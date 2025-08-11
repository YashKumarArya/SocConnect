import neo4j, { Driver, Session } from 'neo4j-driver';
import type { RawAlert, NormalizedAlert, Incident } from '@shared/schema';

export interface Neo4jConfig {
  uri: string;
  username: string;
  password: string;
}

export interface GraphRelationship {
  from: string;
  to: string;
  type: 'TRIGGERED_ON' | 'RELATES_TO' | 'AFFECTS' | 'ORIGINATED_FROM' | 'ESCALATED_TO' | 'CONNECTED_TO';
  properties?: Record<string, any>;
}

export interface AttackChain {
  id: string;
  steps: {
    alertId: string;
    timestamp: string;
    alertType: string;
    severity: string;
    description: string;
  }[];
  confidence: number;
  totalImpact: number;
}

export class Neo4jService {
  private driver: Driver | null = null;
  private session: Session | null = null;
  private connected = false;

  constructor(config?: Neo4jConfig) {
    // Default to local Neo4j instance, can be configured via env vars
    const uri = config?.uri || process.env.NEO4J_URI || 'bolt://localhost:7687';
    const username = config?.username || process.env.NEO4J_USERNAME || 'neo4j';
    const password = config?.password || process.env.NEO4J_PASSWORD || 'password';

    try {
      this.driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
      console.log('🔗 Neo4j driver initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Neo4j driver:', error);
    }
  }

  async connect() {
    try {
      if (!this.driver) {
        throw new Error('Neo4j driver not initialized');
      }
      this.session = this.driver.session();
      await this.session.run('MATCH (n) RETURN count(n) as count');
      this.connected = true;
      console.log('✅ Connected to Neo4j database');
      
      // Create initial constraints and indexes
      await this.setupGraphSchema();
    } catch (error) {
      console.error('❌ Failed to connect to Neo4j:', error);
      this.connected = false;
    }
  }

  async disconnect() {
    if (this.session) {
      await this.session.close();
      this.session = null;
    }
    if (this.driver) {
      await this.driver.close();
      this.driver = null;
    }
    this.connected = false;
    console.log('🔌 Disconnected from Neo4j');
  }

  isConnected() {
    return this.connected;
  }

  // Execute a query with parameters
  async executeQuery(query: string, parameters: Record<string, any> = {}) {
    if (!this.connected || !this.session) {
      throw new Error('Neo4j not connected');
    }
    return await this.session.run(query, parameters);
  }

  // Setup graph schema with constraints and indexes
  private async setupGraphSchema() {
    if (!this.session) return;
    
    const constraints = [
      'CREATE CONSTRAINT alert_id IF NOT EXISTS FOR (a:Alert) REQUIRE a.id IS UNIQUE',
      'CREATE CONSTRAINT incident_id IF NOT EXISTS FOR (i:Incident) REQUIRE i.id IS UNIQUE',
      'CREATE CONSTRAINT device_name IF NOT EXISTS FOR (d:Device) REQUIRE d.name IS UNIQUE',
      'CREATE CONSTRAINT user_name IF NOT EXISTS FOR (u:User) REQUIRE u.name IS UNIQUE',
      'CREATE CONSTRAINT ip_address IF NOT EXISTS FOR (ip:IPAddress) REQUIRE ip.address IS UNIQUE'
    ];

    const indexes = [
      'CREATE INDEX alert_timestamp IF NOT EXISTS FOR (a:Alert) ON (a.timestamp)',
      'CREATE INDEX alert_severity IF NOT EXISTS FOR (a:Alert) ON (a.severity)',
      'CREATE INDEX incident_status IF NOT EXISTS FOR (i:Incident) ON (i.status)',
      'CREATE TEXT INDEX alert_description IF NOT EXISTS FOR (a:Alert) ON (a.description)'
    ];

    try {
      for (const constraint of constraints) {
        await this.session.run(constraint);
      }
      for (const index of indexes) {
        await this.session.run(index);
      }
      console.log('📋 Neo4j schema setup completed');
    } catch (error) {
      // Constraints/indexes might already exist, that's ok
      console.log('📋 Neo4j schema already exists or partially configured');
    }
  }

  // Store alert as graph node with relationships
  async storeAlert(alert: RawAlert) {
    if (!this.connected || !this.session) return;

    try {
      const query = `
        MERGE (a:Alert {id: $alertId})
        SET a.timestamp = datetime($timestamp),
            a.severity = $severity,
            a.alertType = $alertType,
            a.description = $description,
            a.sourceId = $sourceId
            
        MERGE (d:Device {name: $deviceName})
        MERGE (a)-[:TRIGGERED_ON]->(d)
        
        RETURN a.id as alertId
      `;

      await this.session.run(query, {
        alertId: alert.id,
        timestamp: alert.receivedAt.toISOString(),
        severity: alert.severity || 'unknown',
        alertType: alert.type || 'Unknown',
        description: alert.description || 'Security Alert',
        sourceId: alert.sourceId,
        deviceName: 'Unknown-Device'  // RawAlert doesn't have device info
      });

      console.log(`📊 Stored alert ${alert.id} in Neo4j graph`);
    } catch (error) {
      console.error('❌ Failed to store alert in Neo4j:', error);
    }
  }

  // Store incident with relationships to alerts
  async storeIncident(incident: Incident, relatedAlertIds: string[] = []) {
    if (!this.connected || !this.session) return;

    try {
      const query = `
        MERGE (i:Incident {id: $incidentId})
        SET i.title = $title,
            i.description = $description,
            i.severity = $severity,
            i.status = $status,
            i.createdAt = datetime($createdAt)
            
        WITH i
        UNWIND $alertIds as alertId
        MATCH (a:Alert {id: alertId})
        MERGE (i)-[:RELATES_TO]->(a)
        
        RETURN i.id as incidentId
      `;

      await this.session.run(query, {
        incidentId: incident.id,
        title: incident.title,
        description: incident.description,
        severity: incident.severity,
        status: incident.status,
        createdAt: incident.createdAt.toISOString(),
        alertIds: relatedAlertIds
      });

      console.log(`📊 Stored incident ${incident.id} in Neo4j graph`);
    } catch (error) {
      console.error('❌ Failed to store incident in Neo4j:', error);
    }
  }

  // Find related alerts based on graph relationships
  async findRelatedAlerts(alertId: string, maxHops: number = 2): Promise<any[]> {
    if (!this.connected || !this.session) return [];

    try {
      const query = `
        MATCH (a:Alert {id: $alertId})
        MATCH path = (a)-[*1..${maxHops}]-(related:Alert)
        WHERE related.id <> $alertId
        RETURN DISTINCT related.id as id,
               related.timestamp as timestamp,
               related.severity as severity,
               related.alertType as alertType,
               related.description as description,
               length(path) as distance
        ORDER BY distance, related.timestamp DESC
        LIMIT 20
      `;

      const result = await this.session.run(query, { alertId });
      return result.records.map((record: any) => ({
        id: record.get('id'),
        timestamp: record.get('timestamp'),
        severity: record.get('severity'),
        alertType: record.get('alertType'),
        description: record.get('description'),
        distance: record.get('distance')
      }));
    } catch (error) {
      console.error('❌ Failed to find related alerts:', error);
      return [];
    }
  }

  // Detect attack chains using graph analysis
  async detectAttackChains(timeWindowHours: number = 24): Promise<AttackChain[]> {
    if (!this.connected || !this.session) return [];

    try {
      const query = `
        MATCH (start:Alert)
        WHERE start.timestamp >= datetime() - duration({hours: $timeWindowHours})
        
        MATCH path = (start)-[:TRIGGERED_ON*1..5]-(end:Alert)
        WHERE start.id <> end.id
          AND end.timestamp >= start.timestamp
          AND end.timestamp <= start.timestamp + duration({hours: 2})
        
        WITH path, [n IN nodes(path) WHERE n:Alert | n] as alerts
        WHERE length(alerts) >= 2
        
        RETURN alerts,
               length(path) as pathLength,
               reduce(severity = 0, alert IN alerts | 
                 severity + CASE alert.severity 
                   WHEN 'critical' THEN 4 
                   WHEN 'high' THEN 3 
                   WHEN 'medium' THEN 2 
                   ELSE 1 END
               ) as totalSeverity
        ORDER BY totalSeverity DESC, pathLength DESC
        LIMIT 10
      `;

      const result = await this.session.run(query, { timeWindowHours });
      
      return result.records.map((record: any, index: number) => {
        const alerts = record.get('alerts');
        const totalSeverity = record.get('totalSeverity');
        
        return {
          id: `chain_${Date.now()}_${index}`,
          steps: alerts.map((alert: any) => ({
            alertId: alert.properties.id,
            timestamp: alert.properties.timestamp,
            alertType: alert.properties.alertType,
            severity: alert.properties.severity,
            description: alert.properties.description
          })),
          confidence: Math.min(totalSeverity / alerts.length / 4, 1), // Normalize confidence
          totalImpact: totalSeverity
        };
      });
    } catch (error) {
      console.error('❌ Failed to detect attack chains:', error);
      return [];
    }
  }

  // Find compromised assets (devices/users with multiple high-severity alerts)
  async findCompromisedAssets(timeWindowHours: number = 24) {
    if (!this.connected || !this.session) return { devices: [], users: [], ipAddresses: [] };

    try {
      const deviceQuery = `
        MATCH (d:Device)<-[:TRIGGERED_ON]-(a:Alert)
        WHERE a.timestamp >= datetime() - duration({hours: $timeWindowHours})
          AND a.severity IN ['high', 'critical']
        WITH d, count(a) as alertCount, collect(a) as alerts
        WHERE alertCount >= 2
        RETURN d.name as name, alertCount, 
               [alert IN alerts | {id: alert.id, severity: alert.severity, alertType: alert.alertType}] as alertDetails
        ORDER BY alertCount DESC
        LIMIT 20
      `;

      const userQuery = `
        MATCH (u:User)<-[:AFFECTS]-(a:Alert)
        WHERE a.timestamp >= datetime() - duration({hours: $timeWindowHours})
          AND a.severity IN ['high', 'critical']
        WITH u, count(a) as alertCount, collect(a) as alerts
        WHERE alertCount >= 2
        RETURN u.name as name, alertCount,
               [alert IN alerts | {id: alert.id, severity: alert.severity, alertType: alert.alertType}] as alertDetails
        ORDER BY alertCount DESC
        LIMIT 20
      `;

      const ipQuery = `
        MATCH (ip:IPAddress)<-[:ORIGINATED_FROM]-(a:Alert)
        WHERE a.timestamp >= datetime() - duration({hours: $timeWindowHours})
          AND a.severity IN ['high', 'critical']
        WITH ip, count(a) as alertCount, collect(a) as alerts
        WHERE alertCount >= 2
        RETURN ip.address as name, alertCount,
               [alert IN alerts | {id: alert.id, severity: alert.severity, alertType: alert.alertType}] as alertDetails
        ORDER BY alertCount DESC
        LIMIT 20
      `;

      const [deviceResult, userResult, ipResult] = await Promise.all([
        this.session.run(deviceQuery, { timeWindowHours }),
        this.session.run(userQuery, { timeWindowHours }),
        this.session.run(ipQuery, { timeWindowHours })
      ]);

      return {
        devices: deviceResult.records.map((record: any) => ({
          name: record.get('name'),
          alertCount: record.get('alertCount'),
          alerts: record.get('alertDetails')
        })),
        users: userResult.records.map((record: any) => ({
          name: record.get('name'),
          alertCount: record.get('alertCount'),
          alerts: record.get('alertDetails')
        })),
        ipAddresses: ipResult.records.map((record: any) => ({
          name: record.get('name'),
          alertCount: record.get('alertCount'),
          alerts: record.get('alertDetails')
        }))
      };
    } catch (error) {
      console.error('❌ Failed to find compromised assets:', error);
      return { devices: [], users: [], ipAddresses: [] };
    }
  }

  // Get graph statistics for monitoring
  async getGraphStats() {
    if (!this.connected || !this.session) return null;

    try {
      const query = `
        CALL {
          MATCH (a:Alert) RETURN count(a) as alertCount
        }
        CALL {
          MATCH (i:Incident) RETURN count(i) as incidentCount
        }
        CALL {
          MATCH (d:Device) RETURN count(d) as deviceCount
        }
        CALL {
          MATCH (u:User) RETURN count(u) as userCount
        }
        CALL {
          MATCH ()-[r]->() RETURN count(r) as relationshipCount
        }
        
        RETURN alertCount, incidentCount, deviceCount, userCount, relationshipCount
      `;

      const result = await this.session.run(query);
      const record = result.records[0];

      return {
        alerts: record.get('alertCount').toNumber(),
        incidents: record.get('incidentCount').toNumber(),
        devices: record.get('deviceCount').toNumber(),
        users: record.get('userCount').toNumber(),
        relationships: record.get('relationshipCount').toNumber()
      };
    } catch (error) {
      console.error('❌ Failed to get graph stats:', error);
      return null;
    }
  }
}

// Export singleton instance
export const neo4jService = new Neo4jService();