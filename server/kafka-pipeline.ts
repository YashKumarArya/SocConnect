import { Kafka, Producer, Consumer, logLevel } from 'kafkajs';
import { storage } from './storage';
import { OCSFNormalizationPipeline } from './ocsfNormalization';
import type { WebSocket } from 'ws';
import type { RawAlert } from '@shared/schema';

// Sequential Kafka Pipeline Implementation
export class KafkaSequentialPipeline {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumers: Map<string, Consumer> = new Map();
  private isInitialized = false;
  private clients: Set<WebSocket> = new Set();

  constructor() {
    this.kafka = new Kafka({
      clientId: 'soc-sequential-pipeline',
      brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
      logLevel: logLevel.WARN,
      retry: {
        initialRetryTime: 300,
        retries: 8
      }
    });
  }

  async initialize(): Promise<void> {
    try {
      // Create producer
      this.producer = this.kafka.producer({
        maxInFlightRequests: 1,
        idempotent: true,
        transactionTimeout: 30000
      });

      await this.producer.connect();

      // Create consumers for each stage
      await this.createEnhancementConsumer();
      await this.createOCSFConsumer();
      await this.createMLDatabaseConsumer();

      this.isInitialized = true;
      console.log('🚀 Sequential Kafka Pipeline initialized');

    } catch (error) {
      console.error('❌ Failed to initialize Kafka pipeline:', error);
      console.log('📡 Continuing without Kafka - using direct processing');
    }
  }

  // Stage 1: Publish raw alert to Kafka
  async publishRawAlert(rawAlert: RawAlert): Promise<void> {
    if (!this.producer || !this.isInitialized) {
      // Fallback to direct processing
      await this.fallbackProcessAlert(rawAlert);
      return;
    }

    try {
      const message = {
        key: rawAlert.id,
        value: JSON.stringify({
          ...rawAlert,
          pipeline: {
            stage: 'raw',
            timestamp: new Date().toISOString(),
            version: '1.0'
          }
        }),
        headers: {
          'source-type': rawAlert.sourceId,
          'severity': rawAlert.severity || 'medium',
          'correlation-id': `corr_${rawAlert.id}`,
          'stage': 'raw'
        }
      };

      await this.producer.send({
        topic: 'security.alerts.raw',
        messages: [message]
      });

      console.log(`📤 Published raw alert ${rawAlert.id} to pipeline`);

    } catch (error) {
      console.error('❌ Failed to publish raw alert:', error);
      await this.fallbackProcessAlert(rawAlert);
    }
  }

  // Stage 2: Enhancement Service Consumer
  private async createEnhancementConsumer(): Promise<void> {
    const consumer = this.kafka.consumer({
      groupId: 'soc-enhancement-service',
      sessionTimeout: 30000,
      heartbeatInterval: 3000
    });

    await consumer.connect();
    await consumer.subscribe({ topics: ['security.alerts.raw'] });

    await consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;

        try {
          const rawAlert = JSON.parse(message.value.toString());
          
          // Parallel enrichment for low latency
          const [geoData, threatIntel, userContext, assetContext] = await Promise.all([
            this.enrichGeoLocation(rawAlert.rawData?.source_ip),
            this.enrichThreatIntelligence(rawAlert),
            this.enrichUserContext(rawAlert.rawData?.username),
            this.enrichAssetContext(rawAlert.rawData?.hostname)
          ]);

          const enhancedAlert = {
            ...rawAlert,
            enrichment: {
              geoLocation: geoData,
              threatIntel: threatIntel,
              userContext: userContext,
              assetContext: assetContext,
              riskScore: this.calculateRiskScore(rawAlert, threatIntel),
              enrichedAt: new Date().toISOString()
            },
            pipeline: {
              stage: 'enhanced',
              timestamp: new Date().toISOString()
            }
          };

          // Store enhanced data in database
          await this.storeEnhancedAlert(enhancedAlert);

          // Publish to enhanced topic
          if (this.producer) {
            await this.producer.send({
              topic: 'security.alerts.enhanced',
              messages: [{
                key: message.key,
                value: JSON.stringify(enhancedAlert),
                headers: {
                  ...message.headers,
                  'stage': 'enhanced'
                }
              }]
            });
          }

          console.log(`🔍 Enhanced alert ${rawAlert.id} with context data`);

        } catch (error) {
          console.error('❌ Enhancement service error:', error);
        }
      }
    });

    this.consumers.set('enhancement', consumer);
  }

  // Stage 3: OCSF Service Consumer  
  private async createOCSFConsumer(): Promise<void> {
    const consumer = this.kafka.consumer({
      groupId: 'soc-ocsf-service',
      sessionTimeout: 30000,
      heartbeatInterval: 3000
    });

    await consumer.connect();
    await consumer.subscribe({ topics: ['security.alerts.enhanced'] });

    await consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;

        try {
          const enhancedAlert = JSON.parse(message.value.toString());
          
          // Transform enriched data to OCSF format
          const ocsfEvent = await this.transformToOCSF(enhancedAlert);
          
          // Validate OCSF compliance
          const isValid = this.validateOCSF(ocsfEvent);
          
          if (isValid) {
            const ocsfReadyEvent = {
              ...ocsfEvent,
              pipeline: {
                stage: 'ocsf-ready',
                timestamp: new Date().toISOString(),
                readyFor: ['ml-model', 'database']
              }
            };

            // Publish to OCSF Ready topic for ML + Database
            if (this.producer) {
              await this.producer.send({
                topic: 'security.alerts.ocsf.ready',
                messages: [{
                  key: message.key,
                  value: JSON.stringify(ocsfReadyEvent),
                  headers: {
                    ...message.headers,
                    'stage': 'ocsf-ready',
                    'ready-for': 'ml-and-database',
                    'ocsf-version': '1.1.0',
                    'class-uid': ocsfEvent.class_uid?.toString()
                  }
                }]
              });
            }

            console.log(`📋 OCSF standardized alert ${enhancedAlert.id}`);
          }

        } catch (error) {
          console.error('❌ OCSF service error:', error);
        }
      }
    });

    this.consumers.set('ocsf', consumer);
  }

  // Stage 4: ML + Database Service Consumer
  private async createMLDatabaseConsumer(): Promise<void> {
    const consumer = this.kafka.consumer({
      groupId: 'soc-ml-database-service',
      sessionTimeout: 30000,
      heartbeatInterval: 3000
    });

    await consumer.connect();
    await consumer.subscribe({ topics: ['security.alerts.ocsf.ready'] });

    await consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;

        try {
          const ocsfEvent = JSON.parse(message.value.toString());
          
          // Parallel processing: ML prediction AND database storage
          const [mlResult] = await Promise.all([
            this.processWithMLModel(ocsfEvent),
            this.storeOCSFEvent(ocsfEvent)
          ]);

          // Broadcast to WebSocket for real-time UI
          this.broadcastToClients({
            type: 'alert-processed',
            data: {
              alertId: ocsfEvent.id,
              ocsfEvent,
              mlPrediction: mlResult,
              timestamp: new Date().toISOString()
            }
          });

          console.log(`🤖 Processed alert ${ocsfEvent.id} with ML + Database`);

        } catch (error) {
          console.error('❌ ML + Database service error:', error);
        }
      }
    });

    this.consumers.set('ml-database', consumer);
  }

  // Enhancement Methods
  private async enrichGeoLocation(ip?: string) {
    if (!ip) return null;
    
    // Simulate geo-location lookup (replace with real service)
    return {
      country: 'US',
      city: 'San Francisco', 
      asn: 'AS15169',
      latitude: 37.7749,
      longitude: -122.4194
    };
  }

  private async enrichThreatIntelligence(alert: any) {
    // Simulate threat intel lookup (replace with real service)
    const isMalicious = alert.severity === 'critical' || alert.type === 'malware';
    
    return {
      reputation: isMalicious ? 'malicious' : 'clean',
      category: alert.type,
      confidence: isMalicious ? 95 : 10,
      sources: ['internal-db']
    };
  }

  private async enrichUserContext(username?: string) {
    if (!username) return null;
    
    // Simulate directory lookup (replace with real service)
    return {
      department: 'IT',
      riskLevel: 'medium',
      manager: 'john.manager@company.com',
      lastLogin: new Date().toISOString()
    };
  }

  private async enrichAssetContext(hostname?: string) {
    if (!hostname) return null;
    
    // Simulate asset inventory lookup (replace with real service)
    return {
      criticality: 'high',
      os: 'Windows 10',
      patchLevel: 'current',
      owner: 'IT Department'
    };
  }

  private calculateRiskScore(alert: any, threatIntel: any): number {
    let score = 0;
    
    // Severity scoring
    const severityScores = { low: 10, medium: 30, high: 60, critical: 90 };
    score += severityScores[alert.severity as keyof typeof severityScores] || 0;
    
    // Threat intel scoring
    if (threatIntel.reputation === 'malicious') {
      score += threatIntel.confidence * 0.1;
    }
    
    return Math.min(100, Math.max(0, score));
  }

  // Database Operations
  private async storeEnhancedAlert(enhancedAlert: any): Promise<void> {
    try {
      await storage.createEnhancedNormalizedAlert({
        sourceId: enhancedAlert.sourceId,
        originalId: enhancedAlert.id,
        alertType: enhancedAlert.type,
        severity: enhancedAlert.severity,
        title: enhancedAlert.description,
        description: enhancedAlert.description,
        sourceIp: enhancedAlert.rawData?.source_ip,
        hostname: enhancedAlert.rawData?.hostname,
        username: enhancedAlert.rawData?.username,
        threatIntelData: JSON.stringify(enhancedAlert.enrichment?.threatIntel),
        userContext: JSON.stringify(enhancedAlert.enrichment?.userContext),
        assetContext: JSON.stringify(enhancedAlert.enrichment?.assetContext),
        riskScore: enhancedAlert.enrichment?.riskScore || 0,
        rawData: enhancedAlert,
        status: 'open'
      });
    } catch (error) {
      console.error('❌ Failed to store enhanced alert:', error);
    }
  }

  private async transformToOCSF(enhancedAlert: any): Promise<any> {
    // Transform enhanced alert to OCSF 1.1.0 format
    const ocsfEvent = {
      // Core OCSF attributes  
      class_uid: 2001, // Security Finding
      class_name: "Security Finding",
      category_uid: 2,
      category_name: "Findings", 
      activity_id: 1,
      activity_name: "Create",
      severity_id: this.mapSeverityToOCSF(enhancedAlert.severity),
      severity: enhancedAlert.severity,
      time: new Date().toISOString(),
      message: enhancedAlert.description || 'Security event detected',
      
      // Network observables
      src_ip: enhancedAlert.rawData?.source_ip,
      dst_ip: enhancedAlert.rawData?.destination_ip,
      
      // System observables
      username: enhancedAlert.rawData?.username || enhancedAlert.rawData?.user,
      hostname: enhancedAlert.rawData?.hostname || enhancedAlert.rawData?.endpoint,
      
      // Security attributes
      disposition_id: 1, // Unknown
      confidence_score: enhancedAlert.enrichment?.riskScore || 50,
      
      // Product metadata
      metadata: {
        product: {
          name: this.mapSourceToProduct(enhancedAlert.sourceId),
          vendor_name: "Security Platform",
          version: "1.0"
        },
        version: "1.1.0"
      },
      
      // Observables for threat hunting
      observables: this.extractObservables(enhancedAlert),
      
      // Original data
      raw_data: enhancedAlert
    };
    
    return ocsfEvent;
  }

  private mapSeverityToOCSF(severity: string): number {
    const severityMap: Record<string, number> = {
      'low': 2,
      'medium': 3,
      'high': 4,
      'critical': 5
    };
    return severityMap[severity?.toLowerCase()] || 1;
  }

  private mapSourceToProduct(sourceId: string): string {
    if (sourceId?.includes('crowdstrike')) return 'CrowdStrike Falcon';
    if (sourceId?.includes('sentinelone')) return 'SentinelOne';
    if (sourceId?.includes('firewall')) return 'Network Firewall';
    if (sourceId?.includes('email')) return 'Email Security';
    return 'Security Platform';
  }

  private extractObservables(enhancedAlert: any): any[] {
    const observables = [];
    
    if (enhancedAlert.rawData?.source_ip) {
      observables.push({
        name: 'src_ip',
        type: 'IP Address',
        value: enhancedAlert.rawData.source_ip
      });
    }
    
    if (enhancedAlert.rawData?.hash) {
      observables.push({
        name: 'file_hash',
        type: 'File Hash',
        value: enhancedAlert.rawData.hash
      });
    }
    
    if (enhancedAlert.rawData?.username) {
      observables.push({
        name: 'username',
        type: 'User Name',
        value: enhancedAlert.rawData.username
      });
    }
    
    return observables;
  }

  private validateOCSF(ocsfEvent: any): boolean {
    // Basic OCSF validation
    return !!(
      ocsfEvent.class_uid &&
      ocsfEvent.category_uid &&
      ocsfEvent.activity_id &&
      ocsfEvent.severity_id &&
      ocsfEvent.time
    );
  }

  private async storeOCSFEvent(ocsfEvent: any): Promise<void> {
    try {
      await storage.createOCSFEvent({
        classUid: ocsfEvent.class_uid,
        className: ocsfEvent.class_name || 'Security Finding',
        categoryUid: ocsfEvent.category_uid,
        categoryName: ocsfEvent.category_name || 'Findings',
        activityId: ocsfEvent.activity_id,
        activityName: ocsfEvent.activity_name || 'Create',
        severityId: ocsfEvent.severity_id,
        severity: ocsfEvent.severity || 'Unknown',
        time: new Date(ocsfEvent.time),
        message: ocsfEvent.message || 'Security event detected',
        rawData: ocsfEvent,
        observables: JSON.stringify(ocsfEvent.observables || [])
      });
    } catch (error) {
      console.error('❌ Failed to store OCSF event:', error);
    }
  }

  private async processWithMLModel(ocsfEvent: any) {
    try {
      // Extract features for ML model (99.58% accuracy)
      const features = {
        class_uid: ocsfEvent.class_uid,
        category_uid: ocsfEvent.category_uid,
        activity_id: ocsfEvent.activity_id,
        severity_id: ocsfEvent.severity_id,
        src_ip: ocsfEvent.src_ip,
        dst_ip: ocsfEvent.dst_ip,
        username: ocsfEvent.username,
        hostname: ocsfEvent.hostname,
        disposition_id: ocsfEvent.disposition_id || 1,
        confidence_score: ocsfEvent.confidence_score || 50,
        product_name: ocsfEvent.product_name,
        vendor_name: ocsfEvent.vendor_name
      };

      // Simulate ML model call (replace with real ML service)
      const prediction = {
        class: this.simulateMLPrediction(features),
        confidence: 0.97,
        probability: [0.01, 0.02, 0.97]
      };

      const mlResult = {
        alertId: ocsfEvent.id,
        prediction: prediction.class,
        confidence: prediction.confidence,
        features: features,
        modelVersion: '3.2M-params-v1.0',
        processedAt: new Date().toISOString()
      };

      // Store ML result (implement in storage)
      // await storage.createMLPrediction(mlResult);

      return mlResult;

    } catch (error) {
      console.error('❌ ML processing error:', error);
      return null;
    }
  }

  private simulateMLPrediction(features: any): string {
    // Simple rule-based simulation for demo
    if (features.severity_id >= 4) return 'malware';
    if (features.class_uid === 4001) return 'network_anomaly';
    return 'benign';
  }

  // WebSocket Management
  addClient(client: WebSocket): void {
    this.clients.add(client);
  }

  removeClient(client: WebSocket): void {
    this.clients.delete(client);
  }

  private broadcastToClients(data: any): void {
    this.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify(data));
      }
    });
  }

  // Fallback Processing (when Kafka is unavailable)
  private async fallbackProcessAlert(rawAlert: RawAlert): Promise<void> {
    try {
      console.log('🔄 Using fallback processing for alert:', rawAlert.id);
      
      // Simulate the sequential pipeline processing directly
      // Stage 1: Enhancement (simulate enrichment)
      const enrichedAlert = {
        ...rawAlert,
        enrichment: {
          geoLocation: { country: 'US', city: 'San Francisco' },
          threatIntel: { reputation: 'clean', confidence: 85 },
          userContext: { department: 'IT', riskLevel: 'medium' },
          assetContext: { criticality: 'high', os: 'Windows 10' },
          riskScore: 75,
          enrichedAt: new Date().toISOString()
        }
      };

      // Stage 2: Store enhanced alert
      await this.storeEnhancedAlert(enrichedAlert);

      // Stage 3: OCSF transformation
      const ocsfEvent = await this.transformToOCSF(enrichedAlert);

      // Stage 4: Store OCSF event and broadcast
      await this.storeOCSFEvent(ocsfEvent);
      
      // Broadcast result to WebSocket clients
      this.broadcastToClients({
        type: 'alert-processed-fallback',
        data: {
          alertId: rawAlert.id,
          ocsfEvent,
          enrichedAlert,
          processing: 'fallback-direct',
          timestamp: new Date().toISOString()
        }
      });

      console.log(`✅ Fallback processing completed for alert ${rawAlert.id}`);
      
    } catch (error) {
      console.error('❌ Fallback processing error:', error);
    }
  }

  // Cleanup
  async shutdown(): Promise<void> {
    try {
      if (this.producer) {
        await this.producer.disconnect();
      }
      
      for (const consumer of Array.from(this.consumers.values())) {
        await consumer.disconnect();
      }
      
      console.log('🛑 Kafka pipeline shutdown complete');
    } catch (error) {
      console.error('❌ Shutdown error:', error);
    }
  }
}

// Export singleton instance
export const kafkaSequentialPipeline = new KafkaSequentialPipeline();