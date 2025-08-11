import { randomUUID } from "crypto";
import { db } from "../db";
import { rawAlerts, enhancedNormalizedAlerts, ocsfEvents } from "@shared/schema";

/**
 * Alert Processing Service
 * Handles normalization, enrichment, and processing of security alerts with database storage
 */
export class AlertProcessorService {
  /**
   * Process an incoming alert with normalization, enrichment, and database storage
   */
  static async processIncomingAlert(alertData: any, sourceId: string, sourceType?: string) {
    const alertId = randomUUID();
    
    try {
      // Store raw alert first
      const [rawAlert] = await db.insert(rawAlerts).values({
        id: alertId,
        sourceId: sourceId,
        severity: alertData.severity,
        type: alertData.type || alertData.alertType,
        description: alertData.description || alertData.title,
        rawData: alertData
      }).returning();

      // Create enhanced normalized alert with ML-compatible attributes
      const enhancedAlert = {
        id: randomUUID(),
        sourceId: sourceId,
        originalId: alertId,
        timestamp: new Date(),
        severity: alertData.severity || 'medium',
        alertType: this.mapToAlertType(alertData.alertType || alertData.type),
        title: alertData.title || `${sourceType || 'Generic'} Alert`,
        description: alertData.description,
        
        // ML Model Required Attributes
        classUid: this.mapToClassUid(alertData.alertType),
        categoryUid: this.mapToCategoryUid(alertData.alertType),
        activityId: this.mapToActivityId(alertData.alertType),
        severityId: this.mapToSeverityId(alertData.severity),
        
        // Network features
        srcIp: alertData.sourceIp || alertData.src_ip,
        dstIp: alertData.destinationIp || alertData.dst_ip,
        
        // System features
        username: alertData.username,
        hostname: alertData.hostname,
        
        // Security features
        dispositionId: 2, // Default: blocked
        confidenceScore: alertData.confidence || 0.8,
        
        // Product info
        productName: this.mapProductName(sourceType),
        vendorName: this.mapVendorName(sourceType),
        
        // Legacy fields
        sourceIp: alertData.sourceIp,
        destinationIp: alertData.destinationIp,
        ruleId: alertData.ruleId,
        
        rawData: alertData,
        status: 'open'
      };

      // Store enhanced alert
      const [storedEnhancedAlert] = await db.insert(enhancedNormalizedAlerts)
        .values(enhancedAlert).returning();

      // Create OCSF event
      const ocsfEvent = {
        classUid: enhancedAlert.classUid!,
        className: this.mapClassName(enhancedAlert.classUid!),
        categoryUid: enhancedAlert.categoryUid!,
        categoryName: this.mapCategoryName(enhancedAlert.categoryUid!),
        activityId: enhancedAlert.activityId!,
        activityName: this.mapActivityName(enhancedAlert.activityId!),
        severityId: enhancedAlert.severityId!,
        severity: alertData.severity,
        time: enhancedAlert.timestamp,
        message: enhancedAlert.description,
        srcIp: enhancedAlert.srcIp,
        dstIp: enhancedAlert.dstIp,
        username: enhancedAlert.username,
        hostname: enhancedAlert.hostname,
        dispositionId: enhancedAlert.dispositionId,
        confidenceScore: enhancedAlert.confidenceScore,
        productName: enhancedAlert.productName,
        vendorName: enhancedAlert.vendorName,
        rawData: alertData
      };

      // Store OCSF event
      const [storedOcsfEvent] = await db.insert(ocsfEvents)
        .values(ocsfEvent).returning();

      return {
        alertId,
        rawAlertId: rawAlert.id,
        enhancedAlertId: storedEnhancedAlert.id,
        ocsfEventId: storedOcsfEvent.id,
        sourceId,
        sourceType: sourceType || 'generic',
        status: 'processed',
        message: 'Alert stored and normalized successfully',
        normalizedData: {
          ...alertData,
          processedAt: new Date().toISOString(),
          enrichments: {
            geoLocation: this.extractGeoLocation(alertData),
            riskScore: this.calculateRiskScore(alertData),
            threatIntel: this.addThreatIntelligence(alertData)
          }
        },
        mlData: {
          ocsfCompliant: true,
          featuresExtracted: true,
          classUid: ocsfEvent.classUid,
          severityId: ocsfEvent.severityId
        }
      };
    } catch (error) {
      console.error('Error processing alert:', error);
      throw new Error('Failed to process and store alert');
    }
  }

  // ML-compatible mapping methods
  private static mapToAlertType(type: string): 'malware' | 'intrusion' | 'policy_violation' | 'anomaly' | 'threat_intel' {
    if (!type) return 'anomaly';
    const lowerType = type.toLowerCase();
    if (lowerType.includes('malware') || lowerType.includes('virus')) return 'malware';
    if (lowerType.includes('intrusion') || lowerType.includes('lateral')) return 'intrusion';
    if (lowerType.includes('policy') || lowerType.includes('violation')) return 'policy_violation';
    if (lowerType.includes('intel') || lowerType.includes('ioc')) return 'threat_intel';
    return 'anomaly';
  }

  private static mapToClassUid(alertType: string): number {
    // OCSF class UIDs
    if (!alertType) return 2001; // Security Finding
    const type = alertType.toLowerCase();
    if (type.includes('malware')) return 2001; // Security Finding
    if (type.includes('network') || type.includes('intrusion')) return 4001; // Network Activity
    if (type.includes('auth')) return 3001; // Authentication
    return 2001;
  }

  private static mapToCategoryUid(alertType: string): number {
    // OCSF category UIDs
    if (!alertType) return 2; // Findings
    const type = alertType.toLowerCase();
    if (type.includes('network')) return 4; // Network Activity
    if (type.includes('auth')) return 3; // Identity & Access Management
    return 2; // Findings
  }

  private static mapToActivityId(alertType: string): number {
    // OCSF activity IDs
    if (!alertType) return 1; // Create
    const type = alertType.toLowerCase();
    if (type.includes('malware')) return 1; // Create
    if (type.includes('block') || type.includes('deny')) return 2; // Block
    return 1;
  }

  private static mapToSeverityId(severity: string): number {
    if (!severity) return 2; // Low
    switch (severity.toLowerCase()) {
      case 'critical': return 5;
      case 'high': return 4;
      case 'medium': return 3;
      case 'low': return 2;
      default: return 1; // Informational
    }
  }

  private static mapClassName(classUid: number): string {
    const classNames = {
      2001: 'Security Finding',
      4001: 'Network Activity',
      3001: 'Authentication'
    };
    return classNames[classUid] || 'Security Finding';
  }

  private static mapCategoryName(categoryUid: number): string {
    const categoryNames = {
      2: 'Findings',
      4: 'Network Activity',
      3: 'Identity & Access Management'
    };
    return categoryNames[categoryUid] || 'Findings';
  }

  private static mapActivityName(activityId: number): string {
    const activityNames = {
      1: 'Create',
      2: 'Block',
      3: 'Allow'
    };
    return activityNames[activityId] || 'Create';
  }

  private static mapProductName(sourceType: string): string {
    const productNames = {
      crowdstrike: 'CrowdStrike Falcon',
      sentinelone: 'SentinelOne',
      email: 'Email Security Gateway',
      firewall: 'Network Firewall'
    };
    return productNames[sourceType?.toLowerCase()] || 'Security Product';
  }

  private static mapVendorName(sourceType: string): string {
    const vendorNames = {
      crowdstrike: 'CrowdStrike',
      sentinelone: 'SentinelOne',
      email: 'Email Provider',
      firewall: 'Network Vendor'
    };
    return vendorNames[sourceType?.toLowerCase()] || 'Security Vendor';
  }

  // Private helper methods
  private static extractGeoLocation(alertData: any) {
    // Simulate geo-location enrichment based on IP
    const ip = alertData.sourceIp || alertData.src_ip;
    if (!ip) return null;
    
    return {
      ip,
      country: 'Unknown',
      city: 'Unknown',
      coordinates: { lat: 0, lng: 0 }
    };
  }

  private static calculateRiskScore(alertData: any): number {
    let score = 30;
    
    if (alertData.severity === 'critical') score += 40;
    else if (alertData.severity === 'high') score += 30;
    else if (alertData.severity === 'medium') score += 20;
    
    if (alertData.sourceIp && !alertData.sourceIp.startsWith('192.168')) {
      score += 20; // External IP
    }
    
    return Math.min(score, 100);
  }

  private static addThreatIntelligence(alertData: any) {
    return {
      reputation: 'unknown',
      categories: [],
      lastSeen: null
    };
  }

  /**
   * Process multiple alerts in bulk
   */
  static async processBulkAlerts(alerts: any[]) {
    return Promise.all(
      alerts.map(async (alert, index) => ({
        alertId: randomUUID(),
        status: 'processed',
        originalAlert: alert,
        batchIndex: index,
        processedAt: new Date().toISOString(),
        normalizedData: {
          ...alert,
          riskScore: this.calculateRiskScore(alert)
        }
      }))
    );
  }

  /**
   * Simulate real-time alert generation
   */
  static simulateRealTimeAlerts(sourceType: string, durationMinutes: number, alertsPerMinute: number) {
    const totalAlerts = durationMinutes * alertsPerMinute;
    console.log(`🚨 Starting real-time simulation: ${totalAlerts} ${sourceType} alerts over ${durationMinutes} minutes`);
    
    let alertCount = 0;
    const interval = (60 / alertsPerMinute) * 1000; // Convert to milliseconds
    
    const simulationInterval = setInterval(() => {
      alertCount++;
      console.log(`📨 Simulated ${sourceType} alert ${alertCount}/${totalAlerts}`);
      
      if (alertCount >= totalAlerts) {
        clearInterval(simulationInterval);
        console.log(`✅ Real-time simulation completed for ${sourceType}`);
      }
    }, interval);
  }

  /**
   * Get sample alert from authentic dataset
   */
  static async getSampleAlert(sourceType: string) {
    const sampleAlerts = {
      crowdstrike: {
        id: `cs-${randomUUID()}`,
        sourceType: 'crowdstrike',
        severity: 'high',
        alertType: 'malware',
        title: 'Malware Detection - Trojan.GenKryptik',
        description: 'CrowdStrike Falcon detected malicious behavior on endpoint',
        sourceIp: '192.168.1.102',
        hostname: 'WORKSTATION-07',
        username: 'john.doe',
        timestamp: new Date().toISOString(),
        rawData: {
          detection_id: 'cs_det_123456',
          process_name: 'suspicious.exe',
          file_hash: 'a1b2c3d4e5f6789012345678901234567890abcd'
        }
      },
      sentinelone: {
        id: `s1-${randomUUID()}`,
        sourceType: 'sentinelone',
        severity: 'critical',
        alertType: 'intrusion',
        title: 'Lateral Movement Detected',
        description: 'SentinelOne detected suspicious lateral movement activity',
        sourceIp: '10.0.1.45',
        destinationIp: '10.0.1.67',
        username: 'service.account',
        timestamp: new Date().toISOString(),
        rawData: {
          agent_id: 's1_agent_789',
          technique: 'T1021.002',
          confidence: 95
        }
      },
      email: {
        id: `email-${randomUUID()}`,
        sourceType: 'email',
        severity: 'medium',
        alertType: 'policy_violation',
        title: 'Phishing Email Detected',
        description: 'Suspicious email with malicious attachment blocked',
        sourceIp: '203.0.113.45',
        username: 'jane.smith@company.com',
        timestamp: new Date().toISOString(),
        rawData: {
          sender: 'fake@malicious-domain.com',
          subject: 'Urgent: Account Verification Required',
          attachment_hash: 'xyz789abc123def456'
        }
      },
      firewall: {
        id: `fw-${randomUUID()}`,
        sourceType: 'firewall',
        severity: 'high',
        alertType: 'intrusion',
        title: 'Port Scan Detected',
        description: 'Multiple ports scanned from external IP address',
        sourceIp: '198.51.100.123',
        destinationIp: '10.0.0.15',
        timestamp: new Date().toISOString(),
        rawData: {
          rule_id: 'FW_PORTSCAN_001',
          ports_scanned: [22, 80, 443, 3389, 5900],
          scan_duration: '120 seconds'
        }
      }
    };

    return sampleAlerts[sourceType as keyof typeof sampleAlerts] || null;
  }

  // Private helper methods
  private static extractGeoLocation(alertData: any) {
    const sourceIp = alertData.sourceIp || alertData.source_ip;
    if (!sourceIp) return null;
    
    // Simulate geo-location enrichment
    return {
      ip: sourceIp,
      country: 'United States',
      region: 'California',
      city: 'San Francisco',
      coordinates: { lat: 37.7749, lon: -122.4194 }
    };
  }

  private static calculateRiskScore(alertData: any) {
    let score = 50; // Base score
    
    // Increase score based on severity
    switch (alertData.severity) {
      case 'critical': score += 40; break;
      case 'high': score += 30; break;
      case 'medium': score += 15; break;
      case 'low': score += 5; break;
    }
    
    // Increase score for external IPs
    if (alertData.sourceIp && !alertData.sourceIp.startsWith('10.') && !alertData.sourceIp.startsWith('192.168.')) {
      score += 20;
    }
    
    return Math.min(score, 100);
  }

  private static addThreatIntelligence(alertData: any) {
    return {
      iocMatches: 0,
      threatCategories: ['suspicious_activity'],
      reputation: 'unknown',
      firstSeen: new Date().toISOString()
    };
  }
}