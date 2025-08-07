import { storage } from "./storage";
import { AlertNormalizer, type NormalizedAlertData } from "./normalization";
import { AlertDataLoader } from "./alertDataLoader";
import { AlertCorrelationEngine } from "./alertCorrelation";
import { type RawAlert, type InsertRawAlert } from "@shared/schema";
import { randomUUID } from "crypto";

export interface AlertProcessingResult {
  rawAlert: RawAlert;
  normalizedData: NormalizedAlertData;
  success: boolean;
  error?: string;
  incidentCreated?: boolean;
  incidentId?: string;
  correlationConfidence?: number;
}

export class AlertProcessor {
  
  static async processIncomingAlert(
    alertData: any, 
    sourceId: string, 
    sourceType?: string
  ): Promise<AlertProcessingResult> {
    try {
      // Step 1: Normalize the incoming alert
      const normalizedData = AlertNormalizer.normalize(alertData, sourceType);
      
      // Step 2: Convert to raw alert format and store
      const rawAlertData = AlertNormalizer.toRawAlert(normalizedData, sourceId);
      const rawAlert = await storage.createRawAlert(rawAlertData);
      
      // Step 3: Run correlation analysis to determine if incident should be created
      const correlationResult = await AlertCorrelationEngine.correlateAlert(rawAlert);
      
      let incidentId: string | null = null;
      let incidentCreated = false;
      
      if (correlationResult.shouldCreateIncident) {
        incidentId = await AlertCorrelationEngine.createIncidentFromCorrelation(correlationResult, rawAlert);
        incidentCreated = incidentId !== null;
        
        if (incidentCreated) {
          console.log(`🚨 Auto-created incident ${incidentId} for ${normalizedData.sourceType} alert`);
        }
      }
      
      console.log(`✅ Processed ${normalizedData.sourceType} alert: ${normalizedData.title} (correlation: ${(correlationResult.confidence * 100).toFixed(1)}%)`);
      
      return {
        rawAlert,
        normalizedData,
        success: true,
        incidentCreated,
        incidentId: incidentId || undefined,
        correlationConfidence: correlationResult.confidence
      };
    } catch (error) {
      console.error('Alert processing failed:', error);
      return {
        rawAlert: {} as RawAlert,
        normalizedData: {} as NormalizedAlertData,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async processBulkAlerts(
    alerts: Array<{ alertData: any; sourceId: string; sourceType?: string }>
  ): Promise<AlertProcessingResult[]> {
    const results: AlertProcessingResult[] = [];
    
    for (const alert of alerts) {
      const result = await this.processIncomingAlert(
        alert.alertData,
        alert.sourceId,
        alert.sourceType
      );
      results.push(result);
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Bulk processing complete: ${successCount}/${results.length} alerts processed successfully`);
    
    return results;
  }

  static async simulateIncomingAlerts(
    sourceType: string, 
    count: number = 5
  ): Promise<AlertProcessingResult[]> {
    // Load real alert data
    const dataLoader = AlertDataLoader.getInstance();
    await dataLoader.ensureDataLoaded();

    // First, find or create a source for this simulation
    const sources = await storage.getSources();
    let source = sources.find(s => s.type.toLowerCase() === sourceType.toLowerCase());
    
    if (!source) {
      source = await storage.createSource({
        name: `${sourceType} Real Data Simulator`,
        type: sourceType,
        config: { simulated: true, dataSource: 'real_alerts', endpoint: `https://api.${sourceType.toLowerCase()}.example.com` }
      });
    }

    try {
      // Use real alert data instead of generated samples
      const realAlerts = dataLoader.getRandomAlerts(sourceType, count);
      const results: AlertProcessingResult[] = [];

      console.log(`🎯 Simulating ${count} real ${sourceType} alerts...`);
      
      for (const alertData of realAlerts) {
        const result = await this.processIncomingAlert(alertData, source.id, sourceType);
        results.push(result);
      }

      const successCount = results.filter(r => r.success).length;
      console.log(`✅ Successfully processed ${successCount}/${count} ${sourceType} alerts`);

      return results;
    } catch (error) {
      console.log(`⚠️  No real data available for ${sourceType}, falling back to generated samples`);
      // Fallback to generated data if real data is not available
      const sampleAlerts = this.generateSampleAlerts(sourceType, count);
      const results: AlertProcessingResult[] = [];

      for (const alertData of sampleAlerts) {
        const result = await this.processIncomingAlert(alertData, source.id, sourceType);
        results.push(result);
      }

      return results;
    }
  }

  static async simulateRealTimeAlerts(
    sourceType: string,
    durationMinutes: number = 5,
    alertsPerMinute: number = 2
  ): Promise<void> {
    const dataLoader = AlertDataLoader.getInstance();
    await dataLoader.ensureDataLoaded();

    console.log(`🔄 Starting real-time simulation: ${sourceType} alerts for ${durationMinutes} minutes (${alertsPerMinute}/min)`);
    
    const intervalMs = (60 * 1000) / alertsPerMinute; // Convert to milliseconds between alerts
    const totalAlerts = durationMinutes * alertsPerMinute;
    let processedCount = 0;

    const interval = setInterval(async () => {
      try {
        if (processedCount >= totalAlerts) {
          clearInterval(interval);
          console.log(`🏁 Real-time simulation completed: ${processedCount} alerts processed`);
          return;
        }

        const result = await this.simulateIncomingAlerts(sourceType, 1);
        if (result[0]?.success) {
          processedCount++;
          console.log(`⚡ Real-time alert ${processedCount}/${totalAlerts}: ${result[0].normalizedData.title}`);
        }
      } catch (error) {
        console.error('❌ Real-time simulation error:', error);
      }
    }, intervalMs);

    // Return immediately, simulation runs in background
    return;
  }

  static async getDatasetStats(): Promise<any> {
    const dataLoader = AlertDataLoader.getInstance();
    await dataLoader.ensureDataLoaded();
    return dataLoader.getDatasetStats();
  }

  static async getSampleAlert(sourceType: string): Promise<any> {
    const dataLoader = AlertDataLoader.getInstance();
    await dataLoader.ensureDataLoaded();
    return dataLoader.getSampleAlert(sourceType);
  }

  private static generateSampleAlerts(sourceType: string, count: number): any[] {
    const alerts = [];
    
    for (let i = 0; i < count; i++) {
      switch (sourceType.toLowerCase()) {
        case 'crowdstrike':
          alerts.push(this.generateCrowdStrikeSample(i));
          break;
        case 'email':
          alerts.push(this.generateEmailSample(i));
          break;
        case 'firewall':
          alerts.push(this.generateFirewallSample(i));
          break;
        case 'sentinelone':
          alerts.push(this.generateSentinelOneSample(i));
          break;
        default:
          throw new Error(`Unsupported source type: ${sourceType}`);
      }
    }
    
    return alerts;
  }

  private static generateCrowdStrikeSample(index: number) {
    const severities = ['Low', 'Medium', 'High', 'Critical'];
    const tactics = ['Defense Evasion', 'Execution', 'Persistence', 'Privilege Escalation'];
    const techniques = ['T1547', 'T1078', 'T1036', 'T1055'];
    const detections = ['RemoteAccessTool', 'CommandAndControl', 'CredentialAccess', 'Malware'];
    
    return {
      alert_id: randomUUID(),
      detect_id: randomUUID(),
      device_id: randomUUID(),
      device_name: `workstation-${String(index + 1).padStart(2, '0')}.corp.local`,
      agent_version: "4.2.8",
      sensor_version: "6.1.15",
      ip_address: `192.168.1.${100 + index}`,
      mac_address: `00:11:22:33:44:${String(50 + index).padStart(2, '0')}`,
      user_name: `user${index + 1}`,
      file_name: `suspicious_${index}.exe`,
      file_path: `C:\\Temp\\suspicious_${index}.exe`,
      file_hash_sha1: `a1b2c3d4e5f6789${index}`,
      file_hash_sha256: `def456789abc123${index}${'0'.repeat(48)}`,
      severity: severities[index % severities.length],
      tactic: tactics[index % tactics.length],
      technique: techniques[index % techniques.length],
      detect_name: detections[index % detections.length],
      command_line: `suspicious_${index}.exe --malware-flag`,
      parent_process: "explorer.exe",
      parent_cmdline: "C:\\Windows\\explorer.exe",
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      event_platform: "Windows",
      event_type: "ProcessRollup",
      network_remote_ip: `203.0.113.${10 + index}`,
      network_remote_port: 8080 + index,
      protocol: "TCP",
      alert_label: "true_positive"
    };
  }

  private static generateEmailSample(index: number) {
    const verdicts = ['malicious', 'suspicious', 'clean'];
    const malwareTypes = ['Emotet', 'Dridex', 'None'];
    const engines = ['Microsoft Defender', 'Proofpoint', 'Mimecast'];
    
    return {
      alert_id: randomUUID(),
      sender_email: `suspicious${index}@badactor.com`,
      recipient_email: `user${index}@company.com`,
      subject: `Urgent Action Required - Case ${index + 1000}`,
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      verdict: verdicts[index % verdicts.length],
      quarantine_status: index % 2 === 0 ? "blocked" : "quarantined",
      malware_detected: malwareTypes[index % malwareTypes.length],
      phishing_detected: index % 3 === 0,
      malicious_link_detected: index % 4 === 0,
      spam_score: Math.random() * 10,
      attachment_name: `document_${index}.pdf`,
      attachment_hash: `hash${index}${'0'.repeat(60)}`,
      message_id: randomUUID(),
      header_from: `noreply${index}@suspicious.com`,
      reply_to: `reply${index}@badactor.com`,
      detection_engine: engines[index % engines.length],
      message_size: 15000 + Math.floor(Math.random() * 50000),
      alert_label: "true_positive"
    };
  }

  private static generateFirewallSample(index: number) {
    const actions = ['allow', 'deny', 'drop', 'reset'];
    const protocols = ['TCP', 'UDP', 'ICMP'];
    const threatTypes = ['port-scan', 'brute-force', 'dos-attack', 'C2'];
    const severities = ['Low', 'Medium', 'High', 'Critical'];
    
    return {
      alert_id: randomUUID(),
      firewall_name: `fw-${String(index + 1).padStart(2, '0')}.company.com`,
      src_ip: `203.0.113.${10 + index}`,
      src_port: 50000 + index,
      dest_ip: `192.168.1.${100 + index}`,
      dest_port: [22, 80, 443, 3389][index % 4],
      protocol: protocols[index % protocols.length],
      action: actions[index % actions.length],
      rule_name: `rule_security_${index}`,
      policy_id: 1000 + index,
      policy_name: `policy_block_${index}`,
      application: ['SSH', 'HTTP', 'HTTPS', 'RDP'][index % 4],
      threat_type: threatTypes[index % threatTypes.length],
      severity: severities[index % severities.length],
      category: ['threat', 'application', 'network'][index % 3],
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      interface: ['eth0', 'eth1', 'wan1'][index % 3],
      country: ['Unknown', 'China', 'Russia', 'North Korea'][index % 4],
      alert_label: "true_positive"
    };
  }

  private static generateSentinelOneSample(index: number) {
    const classifications = ['Ransomware', 'Trojan', 'PUA', 'Infostealer'];
    const verdicts = ['malicious', 'suspicious', 'benign'];
    const detections = ['Generic.Trojan.Downloader', 'Backdoor.Win32.DarkKomet', 'Win32/Filecoder.AA'];
    
    return {
      alert_id: randomUUID(),
      agent_uuid: randomUUID(),
      agent_ip: `192.168.1.${150 + index}`,
      agent_os_type: ['windows', 'linux', 'mac'][index % 3],
      agent_os_revision: String(60000 + index),
      agent_version: "5.2.1",
      agent_hostname: `endpoint-${String(index + 1).padStart(2, '0')}.corp.local`,
      site_name: `Site ${index + 1}`,
      group_name: ['IT Ops', 'Finance Dept', 'R&D'][index % 3],
      account_name: `account${index}`,
      threat_id: randomUUID(),
      threat_classification: classifications[index % classifications.length],
      detection_name: detections[index % detections.length],
      file_path: `C:\\Users\\user${index}\\AppData\\Temp\\malware_${index}.exe`,
      file_hash_sha256: `sentinel${index}${'0'.repeat(56)}`,
      file_hash_md5: `md5hash${index}${'0'.repeat(24)}`,
      file_hash_sha1: `sha1hash${index}${'0'.repeat(32)}`,
      process_name: `process_${index}.exe`,
      process_id: 1000 + index,
      parent_process_name: "explorer.exe",
      parent_process_id: 500 + index,
      verdict: verdicts[index % verdicts.length],
      initiated_by: ['user', 'system', 'remote'][index % 3],
      storyline_id: randomUUID(),
      mitigation_status: ['mitigated', 'pending', 'unresolved'][index % 3],
      indicator_type: ['Process', 'File', 'Network Connection'][index % 3],
      network_remote_ip: `203.0.113.${50 + index}`,
      network_remote_port: 9000 + index,
      network_protocol: protocols[index % protocols.length],
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      alert_label: "true_positive"
    };
  }
}

const protocols = ['TCP', 'UDP', 'ICMP'];