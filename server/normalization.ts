import { type RawAlert, type InsertRawAlert } from "@shared/schema";

// Normalized alert structure that all sources will be converted to
export interface NormalizedAlertData {
  sourceType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  alertType: string;
  title: string;
  description: string;
  timestamp: Date;
  sourceIP?: string;
  destIP?: string;
  hostname?: string;
  username?: string;
  filePath?: string;
  fileHash?: string;
  processName?: string;
  networkInfo?: {
    remoteIP?: string;
    remotePort?: number;
    protocol?: string;
  };
  additionalData: Record<string, any>;
}

// CrowdStrike alert structure
interface CrowdStrikeAlert {
  alert_id: string;
  detect_id: string;
  device_name: string;
  ip_address: string;
  user_name: string;
  file_name: string;
  file_path: string;
  file_hash_sha256: string;
  severity: string;
  tactic: string;
  technique: string;
  detect_name: string;
  command_line: string;
  timestamp: string;
  event_platform: string;
  event_type: string;
  network_remote_ip: string;
  network_remote_port: number;
  protocol: string;
  [key: string]: any;
}

// Email alert structure
interface EmailAlert {
  alert_id: string;
  sender_email: string;
  recipient_email: string;
  subject: string;
  timestamp: string;
  verdict: string;
  malware_detected: string;
  phishing_detected: boolean;
  spam_score: number;
  attachment_name?: string;
  attachment_hash?: string;
  detection_engine: string;
  [key: string]: any;
}

// Firewall alert structure
interface FirewallAlert {
  alert_id: string;
  firewall_name: string;
  src_ip: string;
  dest_ip: string;
  protocol: string;
  action: string;
  threat_type: string;
  severity: string;
  timestamp: string;
  application: string;
  [key: string]: any;
}

// SentinelOne alert structure
interface SentinelOneAlert {
  alert_id: string;
  agent_hostname: string;
  agent_ip: string;
  threat_classification: string;
  detection_name: string;
  file_path: string;
  file_hash_sha256: string;
  process_name: string;
  verdict: string;
  network_remote_ip: string;
  network_remote_port: number;
  timestamp: string;
  [key: string]: any;
}

export class AlertNormalizer {
  
  static normalizeCrowdStrike(rawAlert: CrowdStrikeAlert): NormalizedAlertData {
    return {
      sourceType: 'CrowdStrike',
      severity: this.mapCrowdStrikeSeverity(rawAlert.severity),
      alertType: rawAlert.detect_name,
      title: `${rawAlert.detect_name} - ${rawAlert.device_name}`,
      description: `${rawAlert.tactic} detected: ${rawAlert.technique} on ${rawAlert.device_name}`,
      timestamp: new Date(rawAlert.timestamp),
      hostname: rawAlert.device_name,
      username: rawAlert.user_name,
      filePath: rawAlert.file_path,
      fileHash: rawAlert.file_hash_sha256,
      processName: rawAlert.file_name,
      networkInfo: {
        remoteIP: rawAlert.network_remote_ip,
        remotePort: rawAlert.network_remote_port,
        protocol: rawAlert.protocol
      },
      additionalData: {
        detectId: rawAlert.detect_id,
        tactic: rawAlert.tactic,
        technique: rawAlert.technique,
        commandLine: rawAlert.command_line,
        eventPlatform: rawAlert.event_platform,
        eventType: rawAlert.event_type
      }
    };
  }

  static normalizeEmail(rawAlert: EmailAlert): NormalizedAlertData {
    return {
      sourceType: 'Email',
      severity: this.mapEmailSeverity(rawAlert.verdict, rawAlert.spam_score),
      alertType: 'email_threat',
      title: `Email Threat - ${rawAlert.sender_email}`,
      description: `Email from ${rawAlert.sender_email} to ${rawAlert.recipient_email}: ${rawAlert.subject}`,
      timestamp: new Date(rawAlert.timestamp),
      additionalData: {
        senderEmail: rawAlert.sender_email,
        recipientEmail: rawAlert.recipient_email,
        subject: rawAlert.subject,
        verdict: rawAlert.verdict,
        malwareDetected: rawAlert.malware_detected,
        phishingDetected: rawAlert.phishing_detected,
        spamScore: rawAlert.spam_score,
        attachmentName: rawAlert.attachment_name,
        attachmentHash: rawAlert.attachment_hash,
        detectionEngine: rawAlert.detection_engine
      }
    };
  }

  static normalizeFirewall(rawAlert: FirewallAlert): NormalizedAlertData {
    return {
      sourceType: 'Firewall',
      severity: this.mapFirewallSeverity(rawAlert.severity),
      alertType: rawAlert.threat_type,
      title: `Firewall ${rawAlert.action} - ${rawAlert.threat_type}`,
      description: `${rawAlert.threat_type} from ${rawAlert.src_ip} to ${rawAlert.dest_ip} - ${rawAlert.action}`,
      timestamp: new Date(rawAlert.timestamp),
      sourceIP: rawAlert.src_ip,
      destIP: rawAlert.dest_ip,
      hostname: rawAlert.firewall_name,
      networkInfo: {
        protocol: rawAlert.protocol
      },
      additionalData: {
        firewallName: rawAlert.firewall_name,
        action: rawAlert.action,
        application: rawAlert.application,
        srcPort: rawAlert.src_port,
        destPort: rawAlert.dest_port,
        ruleName: rawAlert.rule_name,
        policyId: rawAlert.policy_id
      }
    };
  }

  static normalizeSentinelOne(rawAlert: SentinelOneAlert): NormalizedAlertData {
    return {
      sourceType: 'SentinelOne',
      severity: this.mapSentinelOneSeverity(rawAlert.threat_classification, rawAlert.verdict),
      alertType: rawAlert.threat_classification,
      title: `${rawAlert.threat_classification} - ${rawAlert.agent_hostname}`,
      description: `${rawAlert.detection_name} detected on ${rawAlert.agent_hostname}`,
      timestamp: new Date(rawAlert.timestamp),
      hostname: rawAlert.agent_hostname,
      filePath: rawAlert.file_path,
      fileHash: rawAlert.file_hash_sha256,
      processName: rawAlert.process_name,
      networkInfo: {
        remoteIP: rawAlert.network_remote_ip,
        remotePort: rawAlert.network_remote_port
      },
      additionalData: {
        agentIP: rawAlert.agent_ip,
        threatClassification: rawAlert.threat_classification,
        detectionName: rawAlert.detection_name,
        verdict: rawAlert.verdict,
        agentUuid: rawAlert.agent_uuid
      }
    };
  }

  // Severity mapping functions
  private static mapCrowdStrikeSeverity(severity: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (severity.toLowerCase()) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      default: return 'low';
    }
  }

  private static mapEmailSeverity(verdict: string, spamScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (verdict === 'malicious') return 'critical';
    if (verdict === 'suspicious') return 'high';
    if (spamScore > 7) return 'medium';
    return 'low';
  }

  private static mapFirewallSeverity(severity: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (severity.toLowerCase()) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'informational': return 'low';
      default: return 'low';
    }
  }

  private static mapSentinelOneSeverity(classification: string, verdict: string): 'low' | 'medium' | 'high' | 'critical' {
    if (classification === 'Ransomware' || verdict === 'malicious') return 'critical';
    if (classification === 'Trojan' || classification === 'Infostealer') return 'high';
    if (verdict === 'suspicious') return 'medium';
    return 'low';
  }

  // Main normalization function that detects source type and normalizes accordingly
  static normalize(rawData: any, sourceType?: string): NormalizedAlertData {
    // Auto-detect source type if not provided
    if (!sourceType) {
      if (rawData.detect_id && rawData.device_name) sourceType = 'crowdstrike';
      else if (rawData.sender_email && rawData.recipient_email) sourceType = 'email';
      else if (rawData.src_ip && rawData.dest_ip && rawData.firewall_name) sourceType = 'firewall';
      else if (rawData.agent_uuid && rawData.threat_classification) sourceType = 'sentinelone';
    }

    switch (sourceType?.toLowerCase()) {
      case 'crowdstrike':
        return this.normalizeCrowdStrike(rawData);
      case 'email':
        return this.normalizeEmail(rawData);
      case 'firewall':
        return this.normalizeFirewall(rawData);
      case 'sentinelone':
        return this.normalizeSentinelOne(rawData);
      default:
        // Generic fallback normalization
        return {
          sourceType: sourceType || 'unknown',
          severity: 'medium',
          alertType: 'generic',
          title: 'Unknown Alert Type',
          description: 'Alert from unknown source',
          timestamp: new Date(),
          additionalData: rawData
        };
    }
  }

  // Convert normalized data to RawAlert format for database storage
  static toRawAlert(normalizedData: NormalizedAlertData, sourceId: string): InsertRawAlert {
    return {
      sourceId,
      severity: normalizedData.severity,
      type: normalizedData.alertType,
      description: normalizedData.description,
      rawData: {
        ...normalizedData.additionalData,
        normalizedTitle: normalizedData.title,
        timestamp: normalizedData.timestamp.toISOString(),
        hostname: normalizedData.hostname,
        username: normalizedData.username,
        filePath: normalizedData.filePath,
        fileHash: normalizedData.fileHash,
        processName: normalizedData.processName,
        sourceIP: normalizedData.sourceIP,
        destIP: normalizedData.destIP,
        networkInfo: normalizedData.networkInfo
      }
    };
  }
}