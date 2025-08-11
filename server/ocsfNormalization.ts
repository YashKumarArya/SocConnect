import { OCSFTransformationService, type OCSFEvent } from './ocsf';
import { storage } from './storage';
import { AlertNormalizer } from './normalization';
import type { RawAlert, InsertOCSFEvent, InsertEnhancedNormalizedAlert } from '@shared/schema';

// OCSF-compliant normalization pipeline for ML model compatibility
export class OCSFNormalizationPipeline {
  
  /**
   * Main normalization entry point - converts raw alerts to OCSF format
   * Architecture: Alert Sources → API → Enrichment → OCSF Normalization → Database → ML via Kafka
   */
  static async processRawAlert(rawAlert: RawAlert): Promise<{
    ocsfEvent: OCSFEvent;
    enhancedAlert: InsertEnhancedNormalizedAlert;
  }> {
    
    // Step 1: Normalize based on source type using existing normalizers
    const normalizedData = this.normalizeBySource(rawAlert);
    
    // Step 2: Enrich with threat intelligence and context
    const enrichedData = await this.enrichWithThreatIntel(normalizedData);
    
    // Step 3: Transform to OCSF format for ML model compatibility
    const ocsfEvent = this.transformToOCSF(enrichedData, rawAlert);
    
    // Step 4: Create enhanced normalized alert with OCSF attributes
    const enhancedAlert = this.createEnhancedAlert(ocsfEvent, rawAlert);
    
    return { ocsfEvent, enhancedAlert };
  }
  
  /**
   * Source-specific normalization using existing AlertNormalizer
   */
  private static normalizeBySource(rawAlert: RawAlert) {
    const rawData = rawAlert.rawData as any;
    
    switch (rawAlert.sourceId) {
      case 'crowdstrike':
        return AlertNormalizer.normalizeCrowdStrike(rawData);
      case 'email':
        return AlertNormalizer.normalizeEmail(rawData);
      case 'firewall':
        return AlertNormalizer.normalizeFirewall(rawData);
      case 'sentinelone':
        return AlertNormalizer.normalizeSentinelOne(rawData);
      default:
        // Generic normalization for unknown sources
        return {
          sourceType: rawAlert.sourceId,
          severity: (rawAlert.severity as any) || 'medium',
          alertType: rawAlert.type || 'anomaly',
          title: rawData.title || `Alert from ${rawAlert.sourceId}`,
          description: rawAlert.description || 'Security alert detected',
          timestamp: new Date(rawAlert.receivedAt),
          additionalData: rawData
        };
    }
  }
  
  /**
   * Threat intelligence enrichment
   */
  private static async enrichWithThreatIntel(normalizedData: any) {
    // TODO: Integrate with ThreatIntelligenceService for IOC enrichment
    // For now, return the normalized data as-is
    return normalizedData;
  }
  
  /**
   * Transform normalized data to OCSF format using existing transformation service
   */
  private static transformToOCSF(normalizedData: any, rawAlert: RawAlert): OCSFEvent {
    // Convert normalized data to SecurityEvent format for transformation
    const securityEvent = {
      id: rawAlert.id,
      timestamp: normalizedData.timestamp.toISOString(),
      source: normalizedData.sourceType,
      severity: normalizedData.severity,
      type: this.mapAlertTypeToSecurityEventType(normalizedData.alertType),
      title: normalizedData.title,
      description: normalizedData.description,
      metadata: {
        source_ip: normalizedData.sourceIP,
        destination_ip: normalizedData.destIP,
        user: normalizedData.username,
        file_hash: normalizedData.fileHash,
        hostname: normalizedData.hostname,
        ...normalizedData.additionalData
      },
      raw_data: rawAlert.rawData
    };
    
    return OCSFTransformationService.transformToOCSF(securityEvent);
  }
  
  /**
   * Create enhanced normalized alert with OCSF-compliant attributes
   */
  private static createEnhancedAlert(ocsfEvent: OCSFEvent, rawAlert: RawAlert): InsertEnhancedNormalizedAlert {
    return {
      sourceId: rawAlert.sourceId,
      originalId: rawAlert.id,
      timestamp: new Date(ocsfEvent.time),
      severity: this.mapOCSFSeverityToEnum(ocsfEvent.severity_id),
      alertType: this.mapOCSFClassToAlertType(ocsfEvent.class_uid),
      title: ocsfEvent.message || `${ocsfEvent.class_name}: ${ocsfEvent.activity_name}`,
      description: ocsfEvent.message,
      // Extract OCSF network attributes
      sourceIp: this.extractSourceIP(ocsfEvent),
      destinationIp: this.extractDestinationIP(ocsfEvent), 
      // Extract OCSF system attributes
      username: this.extractUsername(ocsfEvent),
      ruleId: this.extractRuleId(ocsfEvent),
      // Store complete OCSF event data
      rawData: ocsfEvent,
      ocsfEventId: null, // Will be set after OCSF event is stored
      status: 'open'
    };
  }
  
  /**
   * Extract source IP from OCSF event
   */
  private static extractSourceIP(ocsfEvent: OCSFEvent): string | null {
    if ('src_endpoint' in ocsfEvent && ocsfEvent.src_endpoint?.ip) {
      return ocsfEvent.src_endpoint.ip;
    }
    return null;
  }
  
  /**
   * Extract destination IP from OCSF event
   */
  private static extractDestinationIP(ocsfEvent: OCSFEvent): string | null {
    if ('dst_endpoint' in ocsfEvent && ocsfEvent.dst_endpoint?.ip) {
      return ocsfEvent.dst_endpoint.ip;
    }
    return null;
  }
  
  /**
   * Extract username from OCSF event
   */
  private static extractUsername(ocsfEvent: OCSFEvent): string | null {
    if ('actor' in ocsfEvent && ocsfEvent.actor?.user?.name) {
      return ocsfEvent.actor.user.name;
    }
    if ('user' in ocsfEvent && ocsfEvent.user?.name) {
      return ocsfEvent.user.name;
    }
    return null;
  }
  
  /**
   * Extract rule ID from OCSF event
   */
  private static extractRuleId(ocsfEvent: OCSFEvent): string | null {
    if ('finding' in ocsfEvent && ocsfEvent.finding?.uid) {
      return ocsfEvent.finding.uid;
    }
    return null;
  }
  
  /**
   * Map OCSF severity ID to enum
   */
  private static mapOCSFSeverityToEnum(severityId: number): 'low' | 'medium' | 'high' | 'critical' {
    switch (severityId) {
      case 2: return 'low';
      case 3: return 'medium';
      case 4: return 'high';
      case 5: return 'critical';
      default: return 'medium';
    }
  }
  
  /**
   * Map OCSF class UID to alert type enum
   */
  private static mapOCSFClassToAlertType(classUid: number): 'malware' | 'intrusion' | 'policy_violation' | 'anomaly' | 'threat_intel' {
    switch (classUid) {
      case 4001: return 'intrusion';     // Network Activity
      case 1001: return 'malware';      // System Activity  
      case 2001: return 'anomaly';      // Security Finding
      case 3002: return 'policy_violation'; // Authentication
      default: return 'anomaly';
    }
  }
  
  /**
   * Map alert type to SecurityEvent type for OCSF transformation
   */
  private static mapAlertTypeToSecurityEventType(alertType: string): 'malware' | 'intrusion' | 'policy_violation' | 'anomaly' | 'threat_intel' {
    const type = alertType.toLowerCase();
    if (type.includes('malware') || type.includes('trojan') || type.includes('virus')) return 'malware';
    if (type.includes('intrusion') || type.includes('network') || type.includes('scan')) return 'intrusion';
    if (type.includes('policy') || type.includes('auth') || type.includes('login')) return 'policy_violation';
    if (type.includes('intel') || type.includes('ioc')) return 'threat_intel';
    return 'anomaly';
  }
}

/**
 * ML Model Integration Service for OCSF Events
 */
export class MLModelIntegration {
  
  /**
   * Prepare OCSF event for ML model processing
   * ML model expects specific OCSF attribute names for 99.58% accuracy
   */
  static prepareOCSFForML(ocsfEvent: OCSFEvent): Record<string, any> {
    // Extract standardized features that ML model was trained on
    const mlFeatures = {
      // Core OCSF attributes
      class_uid: ocsfEvent.class_uid,
      category_uid: ocsfEvent.category_uid,
      activity_id: ocsfEvent.activity_id,
      severity_id: ocsfEvent.severity_id,
      
      // Time features
      time: ocsfEvent.time,
      
      // Network features (if present)
      src_ip: this.extractSourceIP(ocsfEvent),
      dst_ip: this.extractDestinationIP(ocsfEvent),
      
      // System features (if present)
      username: this.extractUsername(ocsfEvent),
      hostname: this.extractHostname(ocsfEvent),
      
      // Security features
      disposition_id: this.extractDispositionId(ocsfEvent),
      confidence_score: this.extractConfidenceScore(ocsfEvent),
      
      // Metadata features
      product_name: ocsfEvent.metadata.product?.name,
      vendor_name: ocsfEvent.metadata.product?.vendor_name
    };
    
    return mlFeatures;
  }
  
  /**
   * Process ML model verdict and update alert
   */
  static async processMLVerdict(ocsfEventId: string, verdict: {
    classification: string;
    confidence: number;
    risk_score: number;
    recommended_action: string;
  }) {
    // Store ML verdict in database and trigger actions
    console.log(`🤖 ML Verdict for ${ocsfEventId}:`, verdict);
    
    // TODO: Update alert status based on ML verdict
    // TODO: Trigger automated response actions if confidence > threshold
  }
  
  // Helper methods for feature extraction
  private static extractSourceIP(ocsfEvent: OCSFEvent): string | null {
    if ('src_endpoint' in ocsfEvent) return ocsfEvent.src_endpoint?.ip || null;
    return null;
  }
  
  private static extractDestinationIP(ocsfEvent: OCSFEvent): string | null {
    if ('dst_endpoint' in ocsfEvent) return ocsfEvent.dst_endpoint?.ip || null;
    return null;
  }
  
  private static extractUsername(ocsfEvent: OCSFEvent): string | null {
    if ('actor' in ocsfEvent) return ocsfEvent.actor?.user?.name || null;
    if ('user' in ocsfEvent) return ocsfEvent.user?.name || null;
    return null;
  }
  
  private static extractHostname(ocsfEvent: OCSFEvent): string | null {
    if ('device' in ocsfEvent) return ocsfEvent.device?.hostname || null;
    if ('src_endpoint' in ocsfEvent) return ocsfEvent.src_endpoint?.hostname || null;
    return null;
  }
  
  private static extractDispositionId(ocsfEvent: OCSFEvent): number | null {
    if ('disposition_id' in ocsfEvent) return ocsfEvent.disposition_id || null;
    return null;
  }
  
  private static extractConfidenceScore(ocsfEvent: OCSFEvent): number | null {
    if ('confidence_score' in ocsfEvent) return ocsfEvent.confidence_score || null;
    return null;
  }
}