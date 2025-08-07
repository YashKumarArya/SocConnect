import { Kafka, Consumer, Producer, logLevel } from 'kafkajs';
import { storage } from './storage';
import type { WebSocket } from 'ws';
import { OCSFTransformationService, type OCSFEvent } from './ocsf';

// Kafka configuration for SOC Dashboard
const kafka = new Kafka({
  clientId: 'soc-dashboard',
  // Using local Kafka broker for development
  // In production, this would be your Kafka cluster
  brokers: ['localhost:9092'],
  logLevel: logLevel.WARN,
  retry: {
    initialRetryTime: 300,
    retries: 8
  }
});

// Kafka Topics for SOC Operations
export const KAFKA_TOPICS = {
  SECURITY_ALERTS: 'security-alerts',
  INCIDENTS: 'incidents', 
  THREAT_INTEL: 'threat-intelligence',
  SYSTEM_METRICS: 'system-metrics',
  AUDIT_LOGS: 'audit-logs',
  // OCSF Topics
  OCSF_NETWORK_ACTIVITY: 'ocsf-network-activity',
  OCSF_SYSTEM_ACTIVITY: 'ocsf-system-activity',
  OCSF_SECURITY_FINDING: 'ocsf-security-finding',
  OCSF_AUTHENTICATION: 'ocsf-authentication'
} as const;

// Standardized Security Event Schema
export interface SecurityEvent {
  id: string;
  timestamp: string;
  source: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'malware' | 'intrusion' | 'policy_violation' | 'anomaly' | 'threat_intel';
  title: string;
  description: string;
  metadata: {
    source_ip?: string;
    destination_ip?: string;
    user?: string;
    file_hash?: string;
    rule_id?: string;
    [key: string]: any;
  };
  raw_data: any;
}

class KafkaService {
  private producer: Producer;
  private consumer: Consumer;
  private clients: Set<WebSocket> = new Set();

  constructor() {
    this.producer = kafka.producer({
      transactionTimeout: 30000,
    });
    
    this.consumer = kafka.consumer({ 
      groupId: 'soc-dashboard-group',
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });
  }

  async initialize() {
    try {
      // Connect producer and consumer
      await this.producer.connect();
      await this.consumer.connect();

      // Subscribe to security event topics
      await this.consumer.subscribe({ 
        topics: Object.values(KAFKA_TOPICS),
        fromBeginning: false 
      });

      console.log('🎯 Kafka service initialized for SOC Dashboard');
      
      // Start consuming events
      this.startEventConsumer();
      
    } catch (error) {
      console.error('❌ Failed to initialize Kafka service:', error);
      // Graceful fallback - continue without Kafka for development
      console.log('📡 Continuing without Kafka - using WebSocket only mode');
    }
  }

  // Producer: Ingest security events from various sources
  async publishSecurityEvent(event: SecurityEvent) {
    try {
      // Publish original event
      await this.producer.send({
        topic: KAFKA_TOPICS.SECURITY_ALERTS,
        messages: [
          {
            key: event.id,
            value: JSON.stringify(event),
            timestamp: new Date(event.timestamp).getTime().toString(),
            headers: {
              source: event.source,
              severity: event.severity,
              type: event.type,
              format: 'custom'
            }
          }
        ]
      });

      // Transform to OCSF and publish to OCSF topic
      await this.publishOCSFEvent(event);

      console.log(`📨 Published security event: ${event.id} from ${event.source}`);
    } catch (error) {
      console.error('❌ Failed to publish security event:', error);
      // Fallback: store directly in database
      await this.fallbackStoreEvent(event);
    }
  }

  // Producer: Publish OCSF-formatted events
  async publishOCSFEvent(event: SecurityEvent | OCSFEvent) {
    try {
      // Transform to OCSF if it's a custom SecurityEvent
      const ocsfEvent = 'class_uid' in event ? 
        event : 
        OCSFTransformationService.transformToOCSF(event);

      const topic = this.getOCSFTopic(ocsfEvent.class_uid);

      await this.producer.send({
        topic,
        messages: [
          {
            key: ocsfEvent.unmapped?.original_id || `ocsf_${Date.now()}`,
            value: JSON.stringify(ocsfEvent),
            timestamp: ocsfEvent.time.toString(),
            headers: {
              class_uid: ocsfEvent.class_uid.toString(),
              class_name: ocsfEvent.class_name,
              severity_id: ocsfEvent.severity_id.toString(),
              format: 'ocsf'
            }
          }
        ]
      });

      console.log(`📨 Published OCSF event: ${ocsfEvent.class_name} (${ocsfEvent.class_uid})`);
    } catch (error) {
      console.error('❌ Failed to publish OCSF event:', error);
    }
  }

  // Get appropriate OCSF topic based on class UID
  private getOCSFTopic(classUid: number): string {
    switch (classUid) {
      case 4001: return KAFKA_TOPICS.OCSF_NETWORK_ACTIVITY;
      case 1001: return KAFKA_TOPICS.OCSF_SYSTEM_ACTIVITY;
      case 2001: return KAFKA_TOPICS.OCSF_SECURITY_FINDING;
      case 3002: return KAFKA_TOPICS.OCSF_AUTHENTICATION;
      default: return KAFKA_TOPICS.OCSF_SECURITY_FINDING;
    }
  }

  // Consumer: Process events and update dashboard
  private async startEventConsumer() {
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message, heartbeat }) => {
        try {
          if (!message.value) return;

          const format = message.headers?.format?.toString() || 'custom';
          
          if (format === 'ocsf') {
            // Process OCSF event
            const ocsfEvent = JSON.parse(message.value.toString()) as OCSFEvent;
            await this.processOCSFEvent(ocsfEvent, topic);
            
            // Convert to custom format for WebSocket broadcast
            const customEvent = OCSFTransformationService.transformFromOCSF(ocsfEvent);
            this.broadcastToClients({
              type: 'security_event',
              data: customEvent,
              ocsf: ocsfEvent
            });
          } else {
            // Process custom SecurityEvent
            const event = JSON.parse(message.value.toString()) as SecurityEvent;
            
            // Process based on topic
            switch (topic) {
              case KAFKA_TOPICS.SECURITY_ALERTS:
                await this.processSecurityAlert(event);
                break;
              case KAFKA_TOPICS.INCIDENTS:
                await this.processIncident(event);
                break;
              case KAFKA_TOPICS.THREAT_INTEL:
                await this.processThreatIntel(event);
                break;
              default:
                console.log(`📥 Received event from topic: ${topic}`);
            }

            // Send to connected WebSocket clients for real-time updates
            this.broadcastToClients({
              type: 'security_event',
              data: event
            });
          }

          // Call heartbeat to prevent session timeout
          await heartbeat();

        } catch (error) {
          console.error('❌ Error processing Kafka message:', error);
        }
      }
    });
  }

  // Process OCSF events
  private async processOCSFEvent(ocsfEvent: OCSFEvent, topic: string) {
    try {
      // Convert OCSF to custom format for storage
      const customEvent = OCSFTransformationService.transformFromOCSF(ocsfEvent);
      
      // Store in database using existing logic
      await this.processSecurityAlert(customEvent);
      
      // Additional OCSF-specific processing
      await this.storeOCSFEvent(ocsfEvent);
      
      console.log(`🔄 Processed OCSF event: ${ocsfEvent.class_name} from ${topic}`);
    } catch (error) {
      console.error('❌ Error processing OCSF event:', error);
    }
  }

  // Store OCSF event with full schema
  private async storeOCSFEvent(ocsfEvent: OCSFEvent) {
    try {
      // Store raw OCSF event for compliance and analysis
      await storage.createOCSFEvent({
        classUid: ocsfEvent.class_uid,
        className: ocsfEvent.class_name,
        categoryUid: ocsfEvent.category_uid,
        categoryName: ocsfEvent.category_name,
        activityId: ocsfEvent.activity_id,
        activityName: ocsfEvent.activity_name,
        severityId: ocsfEvent.severity_id,
        severity: ocsfEvent.severity,
        time: new Date(ocsfEvent.time),
        message: ocsfEvent.message,
        rawData: ocsfEvent,
        observables: JSON.stringify(ocsfEvent.observables || [])
      });
    } catch (error) {
      console.error('❌ Error storing OCSF event:', error);
    }
  }

  // Process security alerts from SIEM, EDR, Firewall systems
  private async processSecurityAlert(event: SecurityEvent) {
    try {
      // Store normalized alert in database
      await storage.createNormalizedAlert({
        sourceId: event.source,
        originalId: event.id,
        timestamp: new Date(event.timestamp),
        severity: event.severity,
        alertType: event.type,
        title: event.title,
        description: event.description,
        sourceIp: event.metadata.source_ip,
        destinationIp: event.metadata.destination_ip,
        username: event.metadata.user,
        ruleId: event.metadata.rule_id,
        rawData: event.raw_data,
        status: 'open'
      });

      console.log(`🚨 Processed security alert: ${event.title} (${event.severity})`);

    } catch (error) {
      console.error('❌ Error processing security alert:', error);
    }
  }

  // Process incident management events
  private async processIncident(event: SecurityEvent) {
    console.log(`🎯 Processing incident: ${event.title}`);
    // Incident processing logic would go here
  }

  // Process threat intelligence feeds
  private async processThreatIntel(event: SecurityEvent) {
    console.log(`🔍 Processing threat intel: ${event.title}`);
    // Threat intelligence processing logic would go here
  }

  // Fallback storage when Kafka is unavailable
  private async fallbackStoreEvent(event: SecurityEvent) {
    try {
      await storage.createNormalizedAlert({
        sourceId: event.source,
        originalId: event.id,
        timestamp: new Date(event.timestamp),
        severity: event.severity,
        alertType: event.type,
        title: event.title,
        description: event.description,
        sourceIp: event.metadata.source_ip,
        destinationIp: event.metadata.destination_ip,
        username: event.metadata.user,
        ruleId: event.metadata.rule_id,
        rawData: event.raw_data,
        status: 'open'
      });
      
      console.log(`💾 Stored event as fallback: ${event.id}`);
    } catch (error) {
      console.error('❌ Fallback storage failed:', error);
    }
  }

  // WebSocket client management
  addClient(ws: WebSocket) {
    this.clients.add(ws);
    console.log(`📡 WebSocket client connected. Total: ${this.clients.size}`);
  }

  removeClient(ws: WebSocket) {
    this.clients.delete(ws);
    console.log(`📡 WebSocket client disconnected. Total: ${this.clients.size}`);
  }

  // Broadcast to all connected dashboard clients
  private broadcastToClients(message: any) {
    const payload = JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        try {
          client.send(payload);
        } catch (error) {
          console.error('Error sending to WebSocket client:', error);
          this.clients.delete(client);
        }
      }
    });
  }

  // Simulate security events for demo purposes
  async simulateSecurityEvents() {
    const demoEvents: SecurityEvent[] = [
      {
        id: `evt_${Date.now()}_1`,
        timestamp: new Date().toISOString(),
        source: 'Firewall-PaloAlto',
        severity: 'high',
        type: 'intrusion',
        title: 'Suspicious Port Scan Detected',
        description: 'Multiple port scan attempts from external IP',
        metadata: {
          source_ip: '192.168.1.100',
          destination_ip: '10.0.1.50',
          rule_id: 'FW-001'
        },
        raw_data: { protocol: 'TCP', ports: [22, 80, 443, 3389] }
      },
      {
        id: `evt_${Date.now()}_2`,
        timestamp: new Date().toISOString(),
        source: 'EDR-CrowdStrike',
        severity: 'critical',
        type: 'malware',
        title: 'Malware Detection: Trojan.Win32.Generic',
        description: 'Malicious executable detected and quarantined',
        metadata: {
          user: 'john.smith@company.com',
          file_hash: 'a1b2c3d4e5f6789012345678901234567890abcd',
          rule_id: 'ML-DETECTION-001'
        },
        raw_data: { file_path: 'C:\\temp\\suspicious.exe', action: 'quarantined' }
      }
    ];

    for (const event of demoEvents) {
      await this.publishSecurityEvent(event);
      // Small delay between events
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  async shutdown() {
    try {
      await this.producer.disconnect();
      await this.consumer.disconnect();
      console.log('🔌 Kafka service disconnected');
    } catch (error) {
      console.error('❌ Error shutting down Kafka service:', error);
    }
  }
}

export const kafkaService = new KafkaService();

// API endpoint helpers for external systems
export class SecurityEventIngestion {
  
  // Endpoint for SIEM systems to send alerts
  static async ingestSIEMAlert(data: any) {
    const event: SecurityEvent = {
      id: `siem_${data.id || Date.now()}`,
      timestamp: data.timestamp || new Date().toISOString(),
      source: data.source || 'SIEM-Unknown',
      severity: data.severity || 'medium',
      type: data.type || 'anomaly',
      title: data.title || 'SIEM Alert',
      description: data.description || 'Alert from SIEM system',
      metadata: data.metadata || {},
      raw_data: data
    };

    await kafkaService.publishSecurityEvent(event);
    return event;
  }

  // Endpoint for EDR systems
  static async ingestEDRAlert(data: any) {
    const event: SecurityEvent = {
      id: `edr_${data.id || Date.now()}`,
      timestamp: data.timestamp || new Date().toISOString(),
      source: data.source || 'EDR-Unknown',
      severity: data.severity || 'medium',
      type: data.type || 'malware',
      title: data.title || 'EDR Detection',
      description: data.description || 'Detection from EDR system',
      metadata: data.metadata || {},
      raw_data: data
    };

    await kafkaService.publishSecurityEvent(event);
    return event;
  }

  // Endpoint for Firewall systems
  static async ingestFirewallAlert(data: any) {
    const event: SecurityEvent = {
      id: `fw_${data.id || Date.now()}`,
      timestamp: data.timestamp || new Date().toISOString(),
      source: data.source || 'Firewall-Unknown',
      severity: data.severity || 'medium',
      type: data.type || 'intrusion',
      title: data.title || 'Firewall Alert',
      description: data.description || 'Alert from firewall system',
      metadata: data.metadata || {},
      raw_data: data
    };

    await kafkaService.publishSecurityEvent(event);
    return event;
  }

  // === OCSF Ingestion Endpoints ===
  
  // Endpoint for OCSF Network Activity events
  static async ingestOCSFNetworkActivity(data: any) {
    // Validate that it's a Network Activity event
    if (data.class_uid !== 4001) {
      throw new Error('Invalid OCSF Network Activity event: class_uid must be 4001');
    }
    
    await kafkaService.publishOCSFEvent(data as OCSFEvent);
    return data;
  }
  
  // Endpoint for OCSF System Activity events
  static async ingestOCSFSystemActivity(data: any) {
    // Validate that it's a System Activity event
    if (data.class_uid !== 1001) {
      throw new Error('Invalid OCSF System Activity event: class_uid must be 1001');
    }
    
    await kafkaService.publishOCSFEvent(data as OCSFEvent);
    return data;
  }
  
  // Endpoint for OCSF Security Finding events
  static async ingestOCSFSecurityFinding(data: any) {
    // Validate that it's a Security Finding event
    if (data.class_uid !== 2001) {
      throw new Error('Invalid OCSF Security Finding event: class_uid must be 2001');
    }
    
    await kafkaService.publishOCSFEvent(data as OCSFEvent);
    return data;
  }
  
  // Endpoint for OCSF Authentication events
  static async ingestOCSFAuthentication(data: any) {
    // Validate that it's an Authentication event
    if (data.class_uid !== 3002) {
      throw new Error('Invalid OCSF Authentication event: class_uid must be 3002');
    }
    
    await kafkaService.publishOCSFEvent(data as OCSFEvent);
    return data;
  }
  
  // Generic OCSF ingestion endpoint
  static async ingestOCSFEvent(data: any) {
    // Basic OCSF validation
    if (!data.class_uid || !data.class_name || !data.time) {
      throw new Error('Invalid OCSF event: missing required fields (class_uid, class_name, time)');
    }
    
    await kafkaService.publishOCSFEvent(data as OCSFEvent);
    return data;
  }
  
  // Bulk OCSF ingestion endpoint
  static async ingestOCSFEventsBulk(events: any[]) {
    const results = [];
    
    for (const event of events) {
      try {
        const result = await this.ingestOCSFEvent(event);
        results.push({ success: true, event: result });
      } catch (error) {
        results.push({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
          event
        });
      }
    }
    
    return results;
  }

  // Transform legacy events to OCSF and ingest
  static async transformAndIngestLegacyEvent(data: any, sourceType: 'siem' | 'edr' | 'firewall') {
    // First create a custom SecurityEvent
    let customEvent: SecurityEvent;
    
    switch (sourceType) {
      case 'siem':
        customEvent = await this.ingestSIEMAlert(data);
        break;
      case 'edr':
        customEvent = await this.ingestEDRAlert(data);
        break;
      case 'firewall':
        customEvent = await this.ingestFirewallAlert(data);
        break;
    }
    
    // Transform to OCSF and publish
    const ocsfEvent = OCSFTransformationService.transformToOCSF(customEvent);
    await kafkaService.publishOCSFEvent(ocsfEvent);
    
    return {
      customEvent,
      ocsfEvent
    };
  }
}