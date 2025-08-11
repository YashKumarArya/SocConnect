import { OCSFTransformationService, type OCSFEvent } from './ocsf';
import { storage } from './storage';
import type { RawAlert, InsertOCSFEvent, InsertEnhancedNormalizedAlert } from '@shared/schema';

// OCSF-compliant normalization pipeline for ML model compatibility
export class OCSFNormalizationPipeline {
  
  /**
   * Main processing entry point - enhanced then OCSF standardization
   * Architecture: Alert Sources → API → Enhancement/Enrichment → OCSF Standardization → Database → ML via Kafka
   */
  static async processRawAlert(rawAlert: RawAlert): Promise<{
    ocsfEvent: OCSFEvent;
    enhancedAlert: InsertEnhancedNormalizedAlert;
  }> {
    
    // Step 1: Normalize based on source type using existing normalizers
    const normalizedData = this.normalizeBySource(rawAlert);
    
    // Step 2: Enhance with threat intelligence, context, and additional enrichment
    const enhancedData = await this.enhanceWithIntelligence(normalizedData, rawAlert);
    
    // Step 3: Apply OCSF standardization to enriched data for ML model compatibility
    const ocsfEvent = this.standardizeToOCSF(enhancedData, rawAlert);
    
    // Step 4: Create final enhanced alert with standardized OCSF attributes
    const enhancedAlert = this.createEnhancedAlert(ocsfEvent, rawAlert, enhancedData);
    
    return { ocsfEvent, enhancedAlert };
  }
  
  /**
   * Source-specific normalization using existing AlertNormalizer
   */
  private static normalizeBySource(rawAlert: RawAlert) {
    const rawData = rawAlert.rawData as any;
    
    switch (rawAlert.sourceId) {
      case 'crowdstrike':
        return this.normalizeCrowdStrike(rawData, rawAlert);
      case 'email':
        return this.normalizeEmail(rawData, rawAlert);
      case 'firewall':
        return this.normalizeFirewall(rawData, rawAlert);
      case 'sentinelone':
        return this.normalizeSentinelOne(rawData, rawAlert);
      default:
        // Generic normalization for unknown sources
        return {
          id: rawAlert.id,
          timestamp: new Date(rawAlert.receivedAt),
          sourceType: rawAlert.sourceId,
          severity: rawAlert.severity,
          alertType: rawAlert.type,
          title: rawAlert.description || 'Unknown Alert',
          description: rawAlert.description || 'No description available',
          sourceIP: rawData.source_ip || rawData.ip_address || rawData.ip || null,
          destIP: rawData.destination_ip || rawData.dest_ip || null,
          username: rawData.user_name || rawData.username || rawData.user || null,
          hostname: rawData.device_name || rawData.hostname || rawData.host || null,
          fileHash: rawData.file_hash || rawData.hash || null,
          additionalData: rawData
        };
    }
  }

  /**
   * CrowdStrike normalization logic
   */
  private static normalizeCrowdStrike(rawData: any, rawAlert: RawAlert) {
    return {
      id: rawAlert.id,
      timestamp: new Date(rawAlert.receivedAt),
      sourceType: 'crowdstrike',
      severity: rawData.severity || rawAlert.severity,
      alertType: rawData.tactic || rawAlert.type,
      title: rawData.alert_name || rawData.title || rawAlert.description,
      description: rawData.description || rawAlert.description,
      sourceIP: rawData.ip_address || rawData.source_ip,
      destIP: rawData.destination_ip || rawData.dest_ip,
      username: rawData.user_name || rawData.username,
      hostname: rawData.device_name || rawData.hostname,
      fileHash: rawData.file_hash || rawData.hash,
      additionalData: rawData
    };
  }

  /**
   * Email normalization logic
   */
  private static normalizeEmail(rawData: any, rawAlert: RawAlert) {
    return {
      id: rawAlert.id,
      timestamp: new Date(rawAlert.receivedAt),
      sourceType: 'email',
      severity: rawData.severity || rawAlert.severity,
      alertType: rawData.alert_type || rawAlert.type,
      title: rawData.subject || rawAlert.description,
      description: rawData.description || rawAlert.description,
      sourceIP: rawData.sender_ip || rawData.source_ip,
      destIP: null,
      username: rawData.recipient || rawData.username,
      hostname: rawData.hostname,
      fileHash: rawData.attachment_hash,
      additionalData: rawData
    };
  }

  /**
   * Firewall normalization logic
   */
  private static normalizeFirewall(rawData: any, rawAlert: RawAlert) {
    return {
      id: rawAlert.id,
      timestamp: new Date(rawAlert.receivedAt),
      sourceType: 'firewall',
      severity: rawData.severity || rawAlert.severity,
      alertType: rawData.action || rawAlert.type,
      title: rawData.rule_name || rawAlert.description,
      description: rawData.description || rawAlert.description,
      sourceIP: rawData.source_ip || rawData.src_ip,
      destIP: rawData.destination_ip || rawData.dest_ip,
      username: rawData.username || rawData.user,
      hostname: rawData.hostname,
      fileHash: null,
      additionalData: rawData
    };
  }

  /**
   * SentinelOne normalization logic
   */
  private static normalizeSentinelOne(rawData: any, rawAlert: RawAlert) {
    return {
      id: rawAlert.id,
      timestamp: new Date(rawAlert.receivedAt),
      sourceType: 'sentinelone',
      severity: rawData.severity || rawAlert.severity,
      alertType: rawData.threat_type || rawAlert.type,
      title: rawData.threat_name || rawAlert.description,
      description: rawData.description || rawAlert.description,
      sourceIP: rawData.network_quarantine_enabled ? rawData.source_ip : null,
      destIP: rawData.destination_ip,
      username: rawData.username || rawData.user,
      hostname: rawData.endpoint_name || rawData.hostname,
      fileHash: rawData.file_content_hash || rawData.hash,
      additionalData: rawData
    };
  }

  /**
   * Enhanced intelligence and enrichment (before OCSF standardization)
   */
  private static async enhanceWithIntelligence(normalizedData: any, rawAlert: RawAlert) {
    // Comprehensive enrichment with threat intelligence, geolocation, user context, etc.
    const enhancedData = {
      ...normalizedData,
      // Add enrichment data
      geoLocation: await this.enrichGeoLocation(normalizedData.sourceIP),
      userContext: await this.enrichUserContext(normalizedData.username),
      threatIntel: await this.enrichThreatIntelligence(normalizedData),
      assetContext: await this.enrichAssetContext(normalizedData.hostname),
      networkContext: await this.enrichNetworkContext(normalizedData.sourceIP, normalizedData.destIP),
      // Add risk scoring and correlation
      riskScore: this.calculateRiskScore(normalizedData),
      correlationId: this.generateCorrelationId(normalizedData),
      // Add timestamps for enrichment tracking
      enrichedAt: new Date().toISOString(),
      originalSourceId: rawAlert.sourceId
    };
    
    return enhancedData;
  }
  
  /**
   * Geo-location enrichment for IP addresses
   */
  private static async enrichGeoLocation(ip: string): Promise<any> {
    if (!ip) return null;
    // TODO: Integrate with geo-location service
    return {
      country: 'Unknown',
      city: 'Unknown',
      coordinates: null
    };
  }
  
  /**
   * User context enrichment
   */
  private static async enrichUserContext(username: string): Promise<any> {
    if (!username) return null;
    // TODO: Integrate with user directory/LDAP
    return {
      department: 'Unknown',
      riskLevel: 'medium',
      lastLogin: null
    };
  }
  
  /**
   * Threat intelligence enrichment
   */
  private static async enrichThreatIntelligence(data: any): Promise<any> {
    // TODO: Integrate with ThreatIntelligenceService for IOC enrichment
    return {
      iocMatches: [],
      threatActors: [],
      campaigns: []
    };
  }
  
  /**
   * Asset context enrichment
   */
  private static async enrichAssetContext(hostname: string): Promise<any> {
    if (!hostname) return null;
    // TODO: Integrate with asset management system
    return {
      assetType: 'workstation',
      criticality: 'medium',
      owner: 'Unknown'
    };
  }
  
  /**
   * Network context enrichment
   */
  private static async enrichNetworkContext(srcIp: string, destIp: string): Promise<any> {
    return {
      isInternal: this.isInternalIP(srcIp),
      networkSegment: 'Unknown',
      communicationPattern: 'Unknown'
    };
  }
  
  /**
   * Calculate risk score based on enriched data
   */
  private static calculateRiskScore(data: any): number {
    let score = 50; // Base score
    
    // Adjust based on severity
    switch (data.severity) {
      case 'critical': score += 40; break;
      case 'high': score += 25; break;
      case 'medium': score += 10; break;
      case 'low': score += 0; break;
    }
    
    return Math.min(100, score);
  }
  
  /**
   * Generate correlation ID for related events
   */
  private static generateCorrelationId(data: any): string {
    // Generate based on key attributes
    const key = `${data.sourceIP || ''}_${data.username || ''}_${data.alertType || ''}`;
    return `corr_${Buffer.from(key).toString('base64').substring(0, 8)}`;
  }
  
  /**
   * Check if IP is internal
   */
  private static isInternalIP(ip: string): boolean {
    if (!ip) return false;
    return ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.');
  }
  
  /**
   * Standardize enriched data to OCSF format for ML model compatibility
   */
  private static standardizeToOCSF(enhancedData: any, rawAlert: RawAlert): OCSFEvent {
    // Convert enhanced data to SecurityEvent format for OCSF standardization
    const securityEvent = {
      id: rawAlert.id,
      timestamp: enhancedData.timestamp.toISOString(),
      source: enhancedData.sourceType,
      severity: enhancedData.severity,
      type: this.mapAlertTypeToSecurityEventType(enhancedData.alertType),
      title: enhancedData.title,
      description: enhancedData.description,
      metadata: {
        // Core attributes
        source_ip: enhancedData.sourceIP,
        destination_ip: enhancedData.destIP,
        user: enhancedData.username,
        file_hash: enhancedData.fileHash,
        hostname: enhancedData.hostname,
        // Enriched attributes (now standardized via OCSF)
        geo_location: enhancedData.geoLocation,
        user_context: enhancedData.userContext,
        threat_intel: enhancedData.threatIntel,
        asset_context: enhancedData.assetContext,
        network_context: enhancedData.networkContext,
        risk_score: enhancedData.riskScore,
        correlation_id: enhancedData.correlationId,
        enriched_at: enhancedData.enrichedAt,
        ...enhancedData.additionalData
      },
      raw_data: rawAlert.rawData
    };
    
    return OCSFTransformationService.transformToOCSF(securityEvent);
  }
  
  /**
   * Create enhanced normalized alert with ML model-compatible OCSF attributes
   */
  private static createEnhancedAlert(ocsfEvent: OCSFEvent, rawAlert: RawAlert, enhancedData?: any): InsertEnhancedNormalizedAlert {
    return {
      sourceId: rawAlert.sourceId,
      originalId: rawAlert.id,
      timestamp: new Date(ocsfEvent.time),
      severity: this.mapOCSFSeverityToEnum(ocsfEvent.severity_id),
      alertType: this.mapOCSFClassToAlertType(ocsfEvent.class_uid),
      title: ocsfEvent.message || `${ocsfEvent.class_name}: ${ocsfEvent.activity_name}`,
      description: ocsfEvent.message,
      
      // ML Model Required OCSF Attributes
      classUid: ocsfEvent.class_uid,
      categoryUid: ocsfEvent.category_uid,
      activityId: ocsfEvent.activity_id,
      severityId: ocsfEvent.severity_id,
      
      // Network features (ML model attributes)
      srcIp: this.extractSourceIP(ocsfEvent),
      dstIp: this.extractDestinationIP(ocsfEvent),
      
      // System features (ML model attributes)
      username: this.extractUsername(ocsfEvent),
      hostname: this.extractHostname(ocsfEvent),
      
      // Security features (ML model attributes)
      dispositionId: this.extractDispositionId(ocsfEvent),
      confidenceScore: this.extractConfidenceScore(ocsfEvent),
      
      // Metadata features (ML model attributes)
      productName: ocsfEvent.metadata.product?.name || null,
      vendorName: ocsfEvent.metadata.product?.vendor_name || null,
      
      // Legacy fields for compatibility
      sourceIp: this.extractSourceIP(ocsfEvent),
      destinationIp: this.extractDestinationIP(ocsfEvent),
      ruleId: this.extractRuleId(ocsfEvent),
      
      // Storage - include both OCSF and enriched data
      rawData: {
        ...ocsfEvent,
        enrichedData: enhancedData || {}
      },
      ocsfEventId: null, // Will be set after OCSF event is stored
      status: 'open'
    };
  }
  
  /**
   * Extract source IP from OCSF event
   */
  static extractSourceIP(ocsfEvent: OCSFEvent): string | null {
    if ('src_endpoint' in ocsfEvent && ocsfEvent.src_endpoint?.ip) {
      return ocsfEvent.src_endpoint.ip;
    }
    return null;
  }
  
  /**
   * Extract destination IP from OCSF event
   */
  static extractDestinationIP(ocsfEvent: OCSFEvent): string | null {
    if ('dst_endpoint' in ocsfEvent && ocsfEvent.dst_endpoint?.ip) {
      return ocsfEvent.dst_endpoint.ip;
    }
    return null;
  }
  
  /**
   * Extract username from OCSF event
   */
  static extractUsername(ocsfEvent: OCSFEvent): string | null {
    if ('actor' in ocsfEvent && ocsfEvent.actor?.user?.name) {
      return ocsfEvent.actor.user.name;
    }
    if ('user' in ocsfEvent && ocsfEvent.user?.name) {
      return ocsfEvent.user.name;
    }
    return null;
  }
  
  /**
   * Extract hostname from OCSF event
   */
  static extractHostname(ocsfEvent: OCSFEvent): string | null {
    if ('device' in ocsfEvent && ocsfEvent.device?.hostname) {
      return ocsfEvent.device.hostname;
    }
    if ('src_endpoint' in ocsfEvent && ocsfEvent.src_endpoint?.hostname) {
      return ocsfEvent.src_endpoint.hostname;
    }
    return null;
  }
  
  /**
   * Extract disposition ID from OCSF event
   */
  static extractDispositionId(ocsfEvent: OCSFEvent): number | null {
    if ('disposition_id' in ocsfEvent) {
      return ocsfEvent.disposition_id || null;
    }
    return null;
  }
  
  /**
   * Extract confidence score from OCSF event
   */
  static extractConfidenceScore(ocsfEvent: OCSFEvent): number | null {
    if ('confidence_score' in ocsfEvent) {
      return ocsfEvent.confidence_score || null;
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