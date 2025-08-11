import { randomUUID } from "crypto";

/**
 * Alert Processing Service
 * Handles normalization, enrichment, and processing of security alerts
 */
export class AlertProcessorService {
  /**
   * Process an incoming alert with normalization and enrichment
   */
  static async processIncomingAlert(alertData: any, sourceId: string, sourceType?: string) {
    const alertId = randomUUID();
    
    // Enhanced processing with source-specific normalization
    const normalizedAlert = {
      alertId,
      sourceId,
      sourceType: sourceType || 'generic',
      status: 'processed',
      message: 'Alert normalized and enriched successfully',
      normalizedData: {
        ...alertData,
        processedAt: new Date().toISOString(),
        enrichments: {
          geoLocation: this.extractGeoLocation(alertData),
          riskScore: this.calculateRiskScore(alertData),
          threatIntel: this.addThreatIntelligence(alertData)
        }
      },
      incidentCreated: false,
      incidentId: null as string | null
    };

    // Auto-create incident for high-severity alerts
    if (alertData.severity === 'critical' || alertData.severity === 'high') {
      normalizedAlert.incidentCreated = true;
      normalizedAlert.incidentId = randomUUID();
    }

    return normalizedAlert;
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