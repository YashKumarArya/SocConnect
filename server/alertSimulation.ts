import fs from 'fs';
import path from 'path';
import { storage } from './storage';
import { type InsertRawAlert } from '@shared/schema';
import { kafkaService } from './kafka';

interface CrowdStrikeAlert {
  alert_id: string;
  detect_id: string;
  device_id: string;
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
  alert_label: string;
}

interface EmailAlert {
  alert_id: string;
  sender_email: string;
  recipient_email: string;
  subject: string;
  timestamp: string;
  verdict: string;
  quarantine_status: string;
  malware_detected: string;
  phishing_detected: boolean;
  malicious_link_detected: boolean;
  spam_score: number;
  attachment_name: string;
  attachment_hash: string;
  detection_engine: string;
  alert_label: string;
}

interface FirewallAlert {
  alert_id: string;
  firewall_name: string;
  src_ip: string;
  src_port: number;
  dest_ip: string;
  dest_port: number;
  protocol: string;
  action: string;
  rule_name: string;
  threat_type: string;
  severity: string;
  category: string;
  timestamp: string;
  interface: string;
  country: string;
  alert_label: string;
}

interface SentinelOneAlert {
  alert_id: string;
  agent_id: string;
  device_name: string;
  ip_address: string;
  user_name: string;
  file_path: string;
  file_hash_sha256: string;
  severity: string;
  threat_classification: string;
  mitigation_status: string;
  timestamp: string;
  event_type: string;
  alert_label: string;
}

export class AlertSimulation {
  private crowdStrikeAlerts: CrowdStrikeAlert[] = [];
  private emailAlerts: EmailAlert[] = [];
  private firewallAlerts: FirewallAlert[] = [];
  private sentinelOneAlerts: SentinelOneAlert[] = [];
  private simulationInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private alertIndex = 0;

  constructor() {
    this.loadAlertFiles();
  }

  private loadAlertFiles(): void {
    try {
      // Load CrowdStrike alerts
      const crowdStrikePath = path.join(process.cwd(), 'attached_assets/crowdstrike_alerts_labeled_1754556002025.json');
      if (fs.existsSync(crowdStrikePath)) {
        this.crowdStrikeAlerts = JSON.parse(fs.readFileSync(crowdStrikePath, 'utf-8'));
        console.log(`📊 Loaded ${this.crowdStrikeAlerts.length} CrowdStrike alerts`);
      }

      // Load Email alerts
      const emailPath = path.join(process.cwd(), 'attached_assets/email_alerts_labeled_1754556002031.json');
      if (fs.existsSync(emailPath)) {
        this.emailAlerts = JSON.parse(fs.readFileSync(emailPath, 'utf-8'));
        console.log(`📧 Loaded ${this.emailAlerts.length} email alerts`);
      }

      // Load Firewall alerts
      const firewallPath = path.join(process.cwd(), 'attached_assets/firewall_alerts_labeled_1754556002031.json');
      if (fs.existsSync(firewallPath)) {
        this.firewallAlerts = JSON.parse(fs.readFileSync(firewallPath, 'utf-8'));
        console.log(`🔥 Loaded ${this.firewallAlerts.length} firewall alerts`);
      }

      // Load SentinelOne alerts
      const sentinelOnePath = path.join(process.cwd(), 'attached_assets/sentinelone_alerts_labeled_1754556002032.json');
      if (fs.existsSync(sentinelOnePath)) {
        this.sentinelOneAlerts = JSON.parse(fs.readFileSync(sentinelOnePath, 'utf-8'));
        console.log(`🛡️ Loaded ${this.sentinelOneAlerts.length} SentinelOne alerts`);
      }

      const totalAlerts = this.crowdStrikeAlerts.length + this.emailAlerts.length + 
                         this.firewallAlerts.length + this.sentinelOneAlerts.length;
      console.log(`🎯 Total simulation alerts loaded: ${totalAlerts}`);
    } catch (error) {
      console.error('❌ Error loading alert files:', error);
    }
  }

  private convertCrowdStrikeAlert(alert: CrowdStrikeAlert): InsertRawAlert {
    return {
      sourceId: 'crowdstrike-edr',
      severity: this.normalizeSeverity(alert.severity),
      type: alert.detect_name,
      description: `${alert.tactic} - ${alert.detect_name} on ${alert.device_name}`,
      rawData: alert
    };
  }

  private convertEmailAlert(alert: EmailAlert): InsertRawAlert {
    return {
      sourceId: 'email-security',
      severity: this.getEmailSeverity(alert),
      type: 'Email Threat',
      description: `${alert.verdict} email from ${alert.sender_email}: ${alert.subject}`,
      rawData: alert
    };
  }

  private convertFirewallAlert(alert: FirewallAlert): InsertRawAlert {
    return {
      sourceId: 'firewall',
      severity: this.normalizeSeverity(alert.severity),
      type: alert.threat_type,
      description: `${alert.threat_type} detected: ${alert.src_ip}:${alert.src_port} → ${alert.dest_ip}:${alert.dest_port}`,
      rawData: alert
    };
  }

  private convertSentinelOneAlert(alert: SentinelOneAlert): InsertRawAlert {
    return {
      sourceId: 'sentinelone-edr',
      severity: this.normalizeSeverity(alert.severity),
      type: alert.threat_classification,
      description: `${alert.threat_classification} on ${alert.device_name} - ${alert.mitigation_status}`,
      rawData: alert
    };
  }

  private normalizeSeverity(severity: string): 'critical' | 'high' | 'medium' | 'low' {
    const sev = severity.toLowerCase();
    if (sev.includes('critical')) return 'critical';
    if (sev.includes('high')) return 'high';
    if (sev.includes('medium')) return 'medium';
    return 'low';
  }

  private getEmailSeverity(alert: EmailAlert): 'critical' | 'high' | 'medium' | 'low' {
    if (alert.verdict === 'malicious' && alert.malware_detected !== 'None') return 'critical';
    if (alert.phishing_detected || alert.malicious_link_detected) return 'high';
    if (alert.verdict === 'suspicious') return 'medium';
    return 'low';
  }

  private async processNextAlert(): Promise<void> {
    try {
      const allAlerts = [
        ...this.crowdStrikeAlerts.map(a => ({ type: 'crowdstrike', data: a })),
        ...this.emailAlerts.map(a => ({ type: 'email', data: a })),
        ...this.firewallAlerts.map(a => ({ type: 'firewall', data: a })),
        ...this.sentinelOneAlerts.map(a => ({ type: 'sentinelone', data: a }))
      ];

      if (allAlerts.length === 0) return;

      // Get next alert in round-robin fashion
      const alertData = allAlerts[this.alertIndex % allAlerts.length];
      this.alertIndex++;

      let rawAlert: InsertRawAlert;

      switch (alertData.type) {
        case 'crowdstrike':
          rawAlert = this.convertCrowdStrikeAlert(alertData.data as CrowdStrikeAlert);
          break;
        case 'email':
          rawAlert = this.convertEmailAlert(alertData.data as EmailAlert);
          break;
        case 'firewall':
          rawAlert = this.convertFirewallAlert(alertData.data as FirewallAlert);
          break;
        case 'sentinelone':
          rawAlert = this.convertSentinelOneAlert(alertData.data as SentinelOneAlert);
          break;
        default:
          return;
      }

      // Store in database
      const createdAlert = await storage.createRawAlert(rawAlert);
      
      // Broadcast to WebSocket clients via Kafka service
      kafkaService.broadcastToClients('newAlert', {
        type: 'alert',
        data: createdAlert,
        source: alertData.type
      });

      console.log(`📡 Simulated ${alertData.type} alert: ${rawAlert.type} [${rawAlert.severity}]`);
      
    } catch (error) {
      console.error('❌ Error processing simulated alert:', error);
    }
  }

  public startSimulation(intervalMs: number = 3000): void {
    if (this.isRunning) {
      console.log('⚠️ Simulation already running');
      return;
    }

    this.isRunning = true;
    console.log(`🚀 Starting alert simulation (${intervalMs}ms intervals)`);
    
    // Send first alert immediately
    this.processNextAlert();

    // Then continue with intervals
    this.simulationInterval = setInterval(() => {
      this.processNextAlert();
    }, intervalMs);
  }

  public stopSimulation(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.isRunning = false;
    console.log('🛑 Alert simulation stopped');
  }

  public getSimulationStatus() {
    return {
      isRunning: this.isRunning,
      alertsLoaded: {
        crowdstrike: this.crowdStrikeAlerts.length,
        email: this.emailAlerts.length,
        firewall: this.firewallAlerts.length,
        sentinelone: this.sentinelOneAlerts.length
      },
      currentIndex: this.alertIndex
    };
  }
}