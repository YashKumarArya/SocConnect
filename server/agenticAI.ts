import { neo4jService } from './neo4j';
import type { OCSFEvent } from './ocsf';

/**
 * Agentic AI Service for Neo4j Graph Analysis
 * Provides intelligent analysis of security events using graph relationships
 */
export class AgenticAIService {
  
  /**
   * Analyze OCSF event using graph intelligence
   */
  static async analyzeEvent(ocsfEvent: OCSFEvent): Promise<{
    threatLevel: 'low' | 'medium' | 'high' | 'critical';
    relatedEvents: any[];
    riskFactors: string[];
    recommendations: string[];
  }> {
    try {
      // Create or update event node in Neo4j
      await this.createEventNode(ocsfEvent);
      
      // Find related events and patterns
      const relatedEvents = await this.findRelatedEvents(ocsfEvent);
      
      // Analyze attack patterns
      const attackPatterns = await this.analyzeAttackPatterns(ocsfEvent);
      
      // Calculate threat level based on graph analysis
      const threatLevel = this.calculateThreatLevel(ocsfEvent, relatedEvents, attackPatterns);
      
      // Generate risk factors
      const riskFactors = this.identifyRiskFactors(ocsfEvent, relatedEvents, attackPatterns);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(threatLevel, riskFactors);
      
      return {
        threatLevel,
        relatedEvents,
        riskFactors,
        recommendations
      };
    } catch (error) {
      console.error('Error in agentic AI analysis:', error);
      return {
        threatLevel: 'medium',
        relatedEvents: [],
        riskFactors: ['Analysis unavailable'],
        recommendations: ['Manual review required']
      };
    }
  }
  
  /**
   * Create or update event node in Neo4j graph
   */
  private static async createEventNode(ocsfEvent: OCSFEvent) {
    const query = `
      MERGE (e:SecurityEvent {id: $eventId})
      SET e.class_uid = $classUid,
          e.class_name = $className,
          e.severity_id = $severityId,
          e.time = $time,
          e.source_ip = $sourceIp,
          e.dest_ip = $destIp,
          e.username = $username,
          e.hostname = $hostname,
          e.updated_at = datetime()
      
      // Create IP nodes and relationships
      WITH e
      FOREACH (ip IN CASE WHEN $sourceIp IS NOT NULL THEN [$sourceIp] ELSE [] END |
        MERGE (src:IPAddress {ip: ip})
        MERGE (e)-[:ORIGINATED_FROM]->(src)
      )
      
      FOREACH (ip IN CASE WHEN $destIp IS NOT NULL THEN [$destIp] ELSE [] END |
        MERGE (dst:IPAddress {ip: ip})
        MERGE (e)-[:TARGETED]->(dst)
      )
      
      // Create user node and relationship
      FOREACH (user IN CASE WHEN $username IS NOT NULL THEN [$username] ELSE [] END |
        MERGE (u:User {username: user})
        MERGE (e)-[:INVOLVES_USER]->(u)
      )
      
      // Create host node and relationship
      FOREACH (host IN CASE WHEN $hostname IS NOT NULL THEN [$hostname] ELSE [] END |
        MERGE (h:Host {hostname: host})
        MERGE (e)-[:OCCURRED_ON]->(h)
      )
    `;
    
    const parameters = {
      eventId: ocsfEvent.unmapped?.original_id || `ocsf_${ocsfEvent.time}`,
      classUid: ocsfEvent.class_uid,
      className: ocsfEvent.class_name,
      severityId: ocsfEvent.severity_id,
      time: ocsfEvent.time,
      sourceIp: this.extractSourceIP(ocsfEvent),
      destIp: this.extractDestinationIP(ocsfEvent),
      username: this.extractUsername(ocsfEvent),
      hostname: this.extractHostname(ocsfEvent)
    };
    
    await neo4jService.executeQuery(query, parameters);
  }
  
  /**
   * Find related events using graph traversal
   */
  private static async findRelatedEvents(ocsfEvent: OCSFEvent): Promise<any[]> {
    const sourceIp = this.extractSourceIP(ocsfEvent);
    const destIp = this.extractDestinationIP(ocsfEvent);
    const username = this.extractUsername(ocsfEvent);
    const hostname = this.extractHostname(ocsfEvent);
    
    const query = `
      MATCH (e:SecurityEvent {id: $eventId})
      
      // Find events from same source IP (last 24 hours)
      OPTIONAL MATCH (e)-[:ORIGINATED_FROM]->(ip:IPAddress)<-[:ORIGINATED_FROM]-(related1:SecurityEvent)
      WHERE related1.time > $timeThreshold AND related1.id <> $eventId
      
      // Find events involving same user (last 7 days)
      OPTIONAL MATCH (e)-[:INVOLVES_USER]->(u:User)<-[:INVOLVES_USER]-(related2:SecurityEvent)
      WHERE related2.time > $weekThreshold AND related2.id <> $eventId
      
      // Find events on same host (last 24 hours)
      OPTIONAL MATCH (e)-[:OCCURRED_ON]->(h:Host)<-[:OCCURRED_ON]-(related3:SecurityEvent)
      WHERE related3.time > $timeThreshold AND related3.id <> $eventId
      
      RETURN DISTINCT 
        related1 {.*, type: 'same_source_ip'} as related1,
        related2 {.*, type: 'same_user'} as related2,
        related3 {.*, type: 'same_host'} as related3
      LIMIT 50
    `;
    
    const now = Date.now();
    const parameters = {
      eventId: ocsfEvent.unmapped?.original_id || `ocsf_${ocsfEvent.time}`,
      timeThreshold: now - (24 * 60 * 60 * 1000), // 24 hours ago
      weekThreshold: now - (7 * 24 * 60 * 60 * 1000) // 7 days ago
    };
    
    const result = await neo4jService.executeQuery(query, parameters);
    
    // Flatten and deduplicate results
    const relatedEvents: any[] = [];
    for (const record of result.records) {
      ['related1', 'related2', 'related3'].forEach(key => {
        const event = record.get(key);
        if (event && !relatedEvents.find(e => e.id === event.id)) {
          relatedEvents.push(event);
        }
      });
    }
    
    return relatedEvents;
  }
  
  /**
   * Analyze attack patterns using graph analysis
   */
  private static async analyzeAttackPatterns(ocsfEvent: OCSFEvent): Promise<{
    suspiciousSequences: any[];
    anomalousConnections: any[];
    escalationPatterns: any[];
  }> {
    // Look for suspicious event sequences (reconnaissance → exploitation → lateral movement)
    const sequenceQuery = `
      MATCH (e:SecurityEvent {id: $eventId})-[:ORIGINATED_FROM]->(ip:IPAddress)
      MATCH path = (start:SecurityEvent)-[:ORIGINATED_FROM]->(ip)-[:ORIGINATED_FROM]-(middle:SecurityEvent)-[:ORIGINATED_FROM]->(ip)-[:ORIGINATED_FROM]-(end:SecurityEvent)
      WHERE start.time < middle.time < end.time 
        AND start.time > $timeThreshold
        AND start.class_uid = 4001  // Network Activity
        AND middle.class_uid = 1001 // System Activity
        AND end.class_uid = 2001    // Security Finding
      RETURN path
      LIMIT 10
    `;
    
    // Look for anomalous connections (unusual port patterns, geographic anomalies)
    const connectionQuery = `
      MATCH (e:SecurityEvent {id: $eventId})-[:ORIGINATED_FROM]->(srcIp:IPAddress)
      MATCH (srcIp)<-[:ORIGINATED_FROM]-(events:SecurityEvent)
      WHERE events.time > $timeThreshold
      WITH srcIp, COUNT(events) as eventCount, COLLECT(DISTINCT events.class_uid) as eventTypes
      WHERE eventCount > 10 OR SIZE(eventTypes) > 3
      RETURN srcIp, eventCount, eventTypes
    `;
    
    // Look for privilege escalation patterns
    const escalationQuery = `
      MATCH (e:SecurityEvent {id: $eventId})-[:INVOLVES_USER]->(user:User)
      MATCH (user)<-[:INVOLVES_USER]-(events:SecurityEvent)
      WHERE events.time > $timeThreshold AND events.severity_id >= 4
      WITH user, events
      ORDER BY events.time
      RETURN user, COLLECT(events) as timeline
    `;
    
    const timeThreshold = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
    const parameters = {
      eventId: ocsfEvent.unmapped?.original_id || `ocsf_${ocsfEvent.time}`,
      timeThreshold
    };
    
    const [sequences, connections, escalations] = await Promise.all([
      neo4jService.executeQuery(sequenceQuery, parameters),
      neo4jService.executeQuery(connectionQuery, parameters),
      neo4jService.executeQuery(escalationQuery, parameters)
    ]);
    
    return {
      suspiciousSequences: sequences.records.map((r: any) => r.get('path')),
      anomalousConnections: connections.records.map((r: any) => ({
        ip: r.get('srcIp'),
        eventCount: r.get('eventCount'),
        eventTypes: r.get('eventTypes')
      })),
      escalationPatterns: escalations.records.map((r: any) => ({
        user: r.get('user'),
        timeline: r.get('timeline')
      }))
    };
  }
  
  /**
   * Calculate threat level based on graph analysis
   */
  private static calculateThreatLevel(
    ocsfEvent: OCSFEvent, 
    relatedEvents: any[], 
    attackPatterns: any
  ): 'low' | 'medium' | 'high' | 'critical' {
    let score = 0;
    
    // Base score from OCSF severity
    score += ocsfEvent.severity_id * 10;
    
    // Related events factor
    if (relatedEvents.length > 20) score += 30;
    else if (relatedEvents.length > 10) score += 20;
    else if (relatedEvents.length > 5) score += 10;
    
    // Attack pattern factors
    if (attackPatterns.suspiciousSequences.length > 0) score += 25;
    if (attackPatterns.anomalousConnections.length > 0) score += 15;
    if (attackPatterns.escalationPatterns.length > 0) score += 35;
    
    // Critical event types
    if (ocsfEvent.class_uid === 1001 && ocsfEvent.severity_id >= 4) score += 20; // Critical malware
    if (ocsfEvent.class_uid === 3002 && relatedEvents.length > 5) score += 15; // Auth with related events
    
    // Determine threat level
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }
  
  /**
   * Identify risk factors based on analysis
   */
  private static identifyRiskFactors(
    ocsfEvent: OCSFEvent, 
    relatedEvents: any[], 
    attackPatterns: any
  ): string[] {
    const riskFactors: string[] = [];
    
    if (ocsfEvent.severity_id >= 4) {
      riskFactors.push('High severity event detected');
    }
    
    if (relatedEvents.length > 10) {
      riskFactors.push(`Multiple related events (${relatedEvents.length}) in timeframe`);
    }
    
    if (attackPatterns.suspiciousSequences.length > 0) {
      riskFactors.push('Suspicious attack sequence detected (recon → exploit → lateral movement)');
    }
    
    if (attackPatterns.anomalousConnections.length > 0) {
      riskFactors.push('Anomalous connection patterns from source IP');
    }
    
    if (attackPatterns.escalationPatterns.length > 0) {
      riskFactors.push('Potential privilege escalation pattern detected');
    }
    
    const sourceIp = this.extractSourceIP(ocsfEvent);
    if (sourceIp && this.isExternalIP(sourceIp)) {
      riskFactors.push('External IP address involved');
    }
    
    return riskFactors;
  }
  
  /**
   * Generate recommendations based on analysis
   */
  private static generateRecommendations(
    threatLevel: string, 
    riskFactors: string[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (threatLevel === 'critical') {
      recommendations.push('Immediate containment required');
      recommendations.push('Escalate to senior analyst');
      recommendations.push('Consider host isolation');
    } else if (threatLevel === 'high') {
      recommendations.push('Priority investigation required');
      recommendations.push('Monitor related systems');
    } else if (threatLevel === 'medium') {
      recommendations.push('Standard investigation workflow');
      recommendations.push('Document findings');
    } else {
      recommendations.push('Monitor and log');
    }
    
    if (riskFactors.some(f => f.includes('attack sequence'))) {
      recommendations.push('Analyze attack timeline');
      recommendations.push('Check for data exfiltration');
    }
    
    if (riskFactors.some(f => f.includes('privilege escalation'))) {
      recommendations.push('Review user permissions');
      recommendations.push('Reset affected user credentials');
    }
    
    if (riskFactors.some(f => f.includes('External IP'))) {
      recommendations.push('Block suspicious IP addresses');
      recommendations.push('Review firewall rules');
    }
    
    return recommendations;
  }
  
  // Helper methods for data extraction
  private static extractSourceIP(ocsfEvent: OCSFEvent): string | null {
    if ('src_endpoint' in ocsfEvent) return ocsfEvent.src_endpoint?.ip || null;
    return null;
  }
  
  private static extractDestinationIP(ocsfEvent: OCSFEvent): string | null {
    if ('dst_endpoint' in ocsfEvent) return ocsfEvent.dst_endpoint?.ip || null;
    return null;
  }
  
  private static extractUsername(ocsfEvent: OCSFEvent): string | null {
    if ('actor' in ocsfEvent) return ocsfEvent.actor?.user?.name || null;
    if ('user' in ocsfEvent) return ocsfEvent.user?.name || null;
    return null;
  }
  
  private static extractHostname(ocsfEvent: OCSFEvent): string | null {
    if ('device' in ocsfEvent) return ocsfEvent.device?.hostname || null;
    if ('src_endpoint' in ocsfEvent) return ocsfEvent.src_endpoint?.hostname || null;
    return null;
  }
  
  private static isExternalIP(ip: string): boolean {
    return !ip.startsWith('192.168.') && !ip.startsWith('10.') && !ip.startsWith('172.');
  }
}