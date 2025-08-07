import { Kafka, Consumer, Producer, logLevel } from 'kafkajs';
import { storage } from './storage';
import type { WebSocket } from 'ws';

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
  AUDIT_LOGS: 'audit-logs'
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
              type: event.type
            }
          }
        ]
      });

      console.log(`📨 Published security event: ${event.id} from ${event.source}`);
    } catch (error) {
      console.error('❌ Failed to publish security event:', error);
      // Fallback: store directly in database
      await this.fallbackStoreEvent(event);
    }
  }

  // Consumer: Process events and update dashboard
  private async startEventConsumer() {
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message, heartbeat }) => {
        try {
          if (!message.value) return;

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

          // Call heartbeat to prevent session timeout
          await heartbeat();

        } catch (error) {
          console.error('❌ Error processing Kafka message:', error);
        }
      }
    });
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
}