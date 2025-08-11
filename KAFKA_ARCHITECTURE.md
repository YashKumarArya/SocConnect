# Kafka-Based Real-time Processing Architecture for SOC Platform

## Overview

This document explains how to implement Apache Kafka (or similar streaming platforms like Apache Pulsar, AWS Kinesis, or Google Cloud Pub/Sub) for real-time, low-latency security event processing with enrichment and standardization at the messaging layer.

## Architecture Design

### Current vs. Proposed Architecture

**Current (Synchronous):**
```
Alert Sources → API → Enhancement → OCSF → Database → WebSocket
```

**Proposed (Kafka Streaming):**
```
Alert Sources → API → Kafka → [Stream Processors] → Database → WebSocket + ML Model
                         ↓
              [Enhancement Service] → [OCSF Service] → [ML Pipeline]
```

## Kafka Implementation Strategy

### 1. Topic Design

```javascript
// Topic structure for different processing stages
const KAFKA_TOPICS = {
  // Raw incoming alerts from various sources
  RAW_ALERTS: 'security.alerts.raw',
  
  // Enhanced alerts with enrichment data
  ENHANCED_ALERTS: 'security.alerts.enhanced',
  
  // OCSF-standardized alerts
  OCSF_ALERTS: 'security.alerts.ocsf',
  
  // ML model predictions
  ML_PREDICTIONS: 'security.ml.predictions',
  
  // Neo4j graph insights
  GRAPH_INSIGHTS: 'security.graph.insights',
  
  // Real-time notifications
  NOTIFICATIONS: 'security.notifications',
  
  // Error handling and DLQ
  ERRORS: 'security.errors.dlq'
};
```

### 2. Producer Implementation

```javascript
// server/kafka-producer.ts
import { Kafka, Producer } from 'kafkajs';

export class SecurityEventProducer {
  private producer: Producer;
  
  constructor() {
    const kafka = new Kafka({
      clientId: 'soc-platform-producer',
      brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });
    
    this.producer = kafka.producer({
      maxInFlightRequests: 1,
      idempotent: true,
      transactionTimeout: 30000
    });
  }

  async publishRawAlert(alert: RawAlert): Promise<void> {
    const message = {
      key: alert.id,
      value: JSON.stringify({
        ...alert,
        timestamp: Date.now(),
        source: 'api-ingestion'
      }),
      headers: {
        'source-type': alert.sourceId,
        'severity': alert.severity,
        'correlation-id': this.generateCorrelationId(alert)
      }
    };

    await this.producer.send({
      topic: KAFKA_TOPICS.RAW_ALERTS,
      messages: [message],
      acks: -1 // Wait for all replicas
    });
  }
}
```

### 3. Stream Processing Services

#### Enhancement Service
```javascript
// services/enhancement-processor.ts
import { Kafka, Consumer, Producer } from 'kafkajs';

export class EnhancementProcessor {
  private consumer: Consumer;
  private producer: Producer;

  async processAlerts(): Promise<void> {
    await this.consumer.subscribe({ topic: KAFKA_TOPICS.RAW_ALERTS });
    
    await this.consumer.run({
      eachMessage: async ({ message, partition, topic }) => {
        const rawAlert = JSON.parse(message.value.toString());
        
        // Parallel enrichment for low latency
        const [geoData, threatIntel, userContext, assetContext] = await Promise.all([
          this.enrichGeoLocation(rawAlert.sourceIP),
          this.enrichThreatIntelligence(rawAlert),
          this.enrichUserContext(rawAlert.username),
          this.enrichAssetContext(rawAlert.hostname)
        ]);

        const enhancedAlert = {
          ...rawAlert,
          enrichment: {
            geoLocation: geoData,
            threatIntel: threatIntel,
            userContext: userContext,
            assetContext: assetContext,
            riskScore: this.calculateRiskScore(rawAlert, threatIntel),
            correlationId: message.headers['correlation-id']?.toString(),
            enrichedAt: new Date().toISOString()
          }
        };

        // Publish to enhanced alerts topic
        await this.producer.send({
          topic: KAFKA_TOPICS.ENHANCED_ALERTS,
          messages: [{
            key: message.key,
            value: JSON.stringify(enhancedAlert),
            headers: {
              ...message.headers,
              'processing-stage': 'enhanced'
            }
          }]
        });
      }
    });
  }

  private async enrichGeoLocation(ip: string) {
    // Fast geo-location lookup (cached/local DB)
    return {
      country: 'US',
      city: 'San Francisco',
      asn: 'AS15169',
      latitude: 37.7749,
      longitude: -122.4194
    };
  }
}
```

#### OCSF Standardization Service
```javascript
// services/ocsf-processor.ts
export class OCSFProcessor {
  async processEnhancedAlerts(): Promise<void> {
    await this.consumer.subscribe({ topic: KAFKA_TOPICS.ENHANCED_ALERTS });
    
    await this.consumer.run({
      eachMessage: async ({ message }) => {
        const enhancedAlert = JSON.parse(message.value.toString());
        
        // Fast OCSF transformation
        const ocsfEvent = this.transformToOCSF(enhancedAlert);
        
        // Validate OCSF compliance
        const isValid = await this.validateOCSF(ocsfEvent);
        
        if (isValid) {
          // Publish to OCSF topic for ML model
          await this.producer.send({
            topic: KAFKA_TOPICS.OCSF_ALERTS,
            messages: [{
              key: message.key,
              value: JSON.stringify(ocsfEvent),
              headers: {
                ...message.headers,
                'processing-stage': 'ocsf',
                'ocsf-version': '1.1.0',
                'class-uid': ocsfEvent.class_uid.toString()
              }
            }]
          });
        }
      }
    });
  }

  private transformToOCSF(enhancedAlert: any): OCSFEvent {
    return {
      class_uid: this.getOCSFClass(enhancedAlert.alertType),
      category_uid: this.getOCSFCategory(enhancedAlert.alertType),
      activity_id: this.getActivityId(enhancedAlert.alertType),
      severity_id: this.mapSeverityToOCSF(enhancedAlert.severity),
      time: new Date(enhancedAlert.timestamp).getTime(),
      message: enhancedAlert.description,
      src_ip: enhancedAlert.enrichment.geoLocation?.ip,
      dst_ip: enhancedAlert.destIP,
      username: enhancedAlert.username,
      hostname: enhancedAlert.hostname,
      disposition_id: enhancedAlert.enrichment.threatIntel?.disposition || 1,
      confidence_score: enhancedAlert.enrichment.riskScore || 50,
      product_name: this.getProductName(enhancedAlert.sourceId),
      vendor_name: this.getVendorName(enhancedAlert.sourceId)
    };
  }
}
```

### 4. ML Pipeline Integration

```javascript
// services/ml-pipeline.ts
export class MLPipeline {
  async processOCSFAlerts(): Promise<void> {
    await this.consumer.subscribe({ topic: KAFKA_TOPICS.OCSF_ALERTS });
    
    await this.consumer.run({
      eachMessage: async ({ message }) => {
        const ocsfEvent = JSON.parse(message.value.toString());
        
        // Extract features for ML model (99.58% accuracy)
        const features = this.extractMLFeatures(ocsfEvent);
        
        // Send to ML model (external service/API)
        const prediction = await this.callMLModel(features);
        
        const mlResult = {
          alertId: ocsfEvent.id,
          prediction: prediction.class,
          confidence: prediction.confidence,
          features: features,
          modelVersion: '3.2M-params-v1.0',
          processedAt: new Date().toISOString()
        };

        // Publish ML results
        await this.producer.send({
          topic: KAFKA_TOPICS.ML_PREDICTIONS,
          messages: [{
            key: message.key,
            value: JSON.stringify(mlResult),
            headers: {
              'prediction-class': prediction.class,
              'confidence-score': prediction.confidence.toString()
            }
          }]
        });
      }
    });
  }

  private extractMLFeatures(ocsfEvent: OCSFEvent) {
    return {
      class_uid: ocsfEvent.class_uid,
      category_uid: ocsfEvent.category_uid,
      activity_id: ocsfEvent.activity_id,
      severity_id: ocsfEvent.severity_id,
      src_ip_encoded: this.encodeIP(ocsfEvent.src_ip),
      dst_ip_encoded: this.encodeIP(ocsfEvent.dst_ip),
      username_hash: this.hashUsername(ocsfEvent.username),
      hostname_category: this.categorizeHostname(ocsfEvent.hostname),
      disposition_id: ocsfEvent.disposition_id,
      confidence_score: ocsfEvent.confidence_score,
      product_encoded: this.encodeProduct(ocsfEvent.product_name),
      vendor_encoded: this.encodeVendor(ocsfEvent.vendor_name)
    };
  }
}
```

### 5. Database Persistence Service

```javascript
// services/database-processor.ts
export class DatabaseProcessor {
  async processAllStreams(): Promise<void> {
    // Subscribe to multiple topics
    const topics = [
      KAFKA_TOPICS.ENHANCED_ALERTS,
      KAFKA_TOPICS.OCSF_ALERTS,
      KAFKA_TOPICS.ML_PREDICTIONS
    ];
    
    await this.consumer.subscribe({ topics });
    
    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        const data = JSON.parse(message.value.toString());
        
        switch (topic) {
          case KAFKA_TOPICS.ENHANCED_ALERTS:
            await this.storeEnhancedAlert(data);
            break;
          case KAFKA_TOPICS.OCSF_ALERTS:
            await this.storeOCSFEvent(data);
            break;
          case KAFKA_TOPICS.ML_PREDICTIONS:
            await this.storePrediction(data);
            break;
        }
        
        // Broadcast via WebSocket for real-time UI updates
        this.websocketBroadcast(topic, data);
      }
    });
  }
}
```

## Performance Optimizations

### 1. Low-Latency Configuration

```javascript
const PERFORMANCE_CONFIG = {
  // Producer settings for low latency
  producer: {
    acks: 1, // Leader acknowledgment only for speed
    compression: 'snappy', // Fast compression
    batchSize: 1, // Send immediately
    linger: 0, // No waiting
    maxInFlightRequests: 5
  },
  
  // Consumer settings for processing speed
  consumer: {
    sessionTimeout: 6000,
    heartbeatInterval: 1000,
    maxPollRecords: 500,
    fetchMinBytes: 1,
    fetchMaxWait: 100
  },
  
  // Topic configuration
  topics: {
    partitions: 6, // Parallel processing
    replicationFactor: 2, // Balance between safety and speed
    'cleanup.policy': 'delete',
    'retention.ms': 86400000 // 24 hours
  }
};
```

### 2. Caching Strategy

```javascript
// services/cache-service.ts
export class CacheService {
  private redis: Redis;
  
  async enrichWithCache(key: string, enrichmentFn: () => Promise<any>) {
    // Check cache first
    const cached = await this.redis.get(`enrich:${key}`);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Enrich and cache
    const result = await enrichmentFn();
    await this.redis.setex(`enrich:${key}`, 3600, JSON.stringify(result));
    
    return result;
  }
}
```

## Alternative Streaming Platforms

### Apache Pulsar
- Better for multi-tenancy
- Built-in geo-replication
- Schema registry integration

### AWS Kinesis
- Managed service (no ops overhead)
- Auto-scaling
- Integration with AWS ML services

### Google Cloud Pub/Sub
- Exactly-once delivery
- Global by default
- Integration with BigQuery/ML

## Implementation Roadmap

### Phase 1: Basic Kafka Setup
1. Set up Kafka cluster (or managed service)
2. Implement basic producer/consumer
3. Create topic structure
4. Basic message flow

### Phase 2: Stream Processing
1. Implement enhancement processor
2. Add OCSF transformation
3. ML pipeline integration
4. Error handling and DLQ

### Phase 3: Optimization
1. Performance tuning
2. Monitoring and metrics
3. Auto-scaling configuration
4. Advanced caching

### Phase 4: Advanced Features
1. Exactly-once processing
2. Stream joins for correlation
3. Windowed aggregations
4. Advanced ML features

## Benefits of Kafka Architecture

### Performance
- **Sub-second latency**: Parallel processing across partitions
- **High throughput**: Handle thousands of alerts per second
- **Fault tolerance**: Automatic recovery and replication

### Scalability
- **Horizontal scaling**: Add more consumers/partitions
- **Independent services**: Scale enhancement, OCSF, ML independently
- **Load distribution**: Automatic partition balancing

### Reliability
- **At-least-once delivery**: No data loss
- **Dead letter queues**: Error handling
- **Monitoring**: Built-in metrics and observability

### Flexibility
- **Multiple consumers**: Different services can consume same data
- **Stream joins**: Correlate data across multiple sources
- **Time-based processing**: Windowed operations for analytics

This architecture provides the foundation for real-time, low-latency security event processing while maintaining data integrity and system reliability.