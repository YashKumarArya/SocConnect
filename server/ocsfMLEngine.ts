import { storage } from "./storage";
import type { OCSFEvent } from "./ocsf";
import type { InsertIncident } from "@shared/schema";

export interface OCSFFeatureVector {
  id: string;
  eventId: string;
  
  // OCSF-based features
  classUid: number;
  categoryUid: number;
  activityId: number;
  severityId: number;
  
  // Rich OCSF context features
  deviceRiskScore: number;        // Based on device.risk_score
  userRiskScore: number;         // Based on actor.user.risk_score  
  networkThreatLevel: number;    // Based on network activity analysis
  processAnomalyScore: number;   // Based on actor.process analysis
  fileRiskScore: number;         // Based on file hashes & reputation
  
  // OCSF metadata features
  productConfidence: number;     // Based on metadata.product confidence
  observableCount: number;       // Number of observables in event
  enrichmentScore: number;       // Based on enrichment quality
  
  // Temporal features
  timeOfDay: number;            // Hour of day (0-23)
  dayOfWeek: number;            // Day of week (0-6)
  isBusinessHours: boolean;     // Business hours flag
  
  // Relationship features (from OCSF context)
  relatedEventsCount: number;   // Related events in time window
  correlationStrength: number;  // Strength of event correlations
  
  computedAt: Date;
}

export interface OCSFCorrelationResult {
  shouldCreateIncident: boolean;
  incidentSeverity: 'low' | 'medium' | 'high' | 'critical';
  incidentTitle: string;
  incidentDescription: string;
  confidence: number;
  relatedEvents: OCSFEvent[];
  ocsfAnalysis: {
    attackPattern: string;
    tacticsDetected: string[];
    impactAssessment: string;
    recommendedActions: string[];
  };
}

export class OCSFMLEngine {
  
  // Extract ML features from OCSF event
  static async extractOCSFFeatures(event: OCSFEvent): Promise<OCSFFeatureVector> {
    const eventTime = new Date(event.time);
    
    return {
      id: `ocsf_features_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventId: event.unmapped?.original_id || `ocsf_${event.time}`,
      
      // OCSF classification features
      classUid: event.class_uid,
      categoryUid: event.category_uid,
      activityId: event.activity_id,
      severityId: event.severity_id,
      
      // Rich contextual features from OCSF
      deviceRiskScore: this.calculateDeviceRiskScore(event),
      userRiskScore: this.calculateUserRiskScore(event),
      networkThreatLevel: this.calculateNetworkThreatLevel(event),
      processAnomalyScore: this.calculateProcessAnomalyScore(event),
      fileRiskScore: this.calculateFileRiskScore(event),
      
      // OCSF metadata features
      productConfidence: event.confidence_id || 50, // Default medium confidence
      observableCount: this.countObservables(event),
      enrichmentScore: this.calculateEnrichmentScore(event),
      
      // Temporal features
      timeOfDay: eventTime.getHours(),
      dayOfWeek: eventTime.getDay(),
      isBusinessHours: this.isBusinessHours(eventTime),
      
      // Relationship features
      relatedEventsCount: await this.getRelatedEventsCount(event),
      correlationStrength: await this.calculateCorrelationStrength(event),
      
      computedAt: new Date()
    };
  }

  // Advanced OCSF-based correlation analysis
  static async correlateOCSFEvent(event: OCSFEvent): Promise<OCSFCorrelationResult> {
    const features = await this.extractOCSFFeatures(event);
    const recentEvents = await this.getRecentOCSFEvents(60); // Last 60 minutes
    
    let shouldCreateIncident = false;
    let incidentSeverity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    let confidence = 0.5;
    
    // OCSF-specific ML scoring
    const ocsfMLScore = await this.calculateOCSFMLScore(features, recentEvents);
    confidence = Math.max(confidence, ocsfMLScore);
    
    // Advanced OCSF pattern detection
    const attackPattern = this.detectOCSFAttackPattern(event, recentEvents);
    const tacticsDetected = this.extractMITRETactics(event);
    
    // OCSF severity and activity-based scoring
    if (event.severity_id >= 4) { // High/Critical
      shouldCreateIncident = true;
      incidentSeverity = event.severity_id >= 5 ? 'critical' : 'high';
      confidence = Math.max(confidence, 0.8);
    }
    
    // OCSF activity-specific rules
    if (this.isHighRiskActivity(event.class_uid, event.activity_id)) {
      shouldCreateIncident = true;
      incidentSeverity = 'high';
      confidence = Math.max(confidence, 0.85);
    }
    
    // Multi-event correlation using OCSF relationships
    if (features.relatedEventsCount >= 3 && features.correlationStrength > 0.7) {
      shouldCreateIncident = true;
      incidentSeverity = 'critical';
      confidence = Math.max(confidence, 0.9);
    }
    
    const incidentTitle = this.generateOCSFIncidentTitle(event, attackPattern);
    const incidentDescription = this.generateOCSFIncidentDescription(event, tacticsDetected, confidence);
    
    return {
      shouldCreateIncident,
      incidentSeverity,
      incidentTitle,
      incidentDescription,
      confidence,
      relatedEvents: recentEvents.slice(0, 5),
      ocsfAnalysis: {
        attackPattern,
        tacticsDetected,
        impactAssessment: this.assessOCSFImpact(event, features),
        recommendedActions: this.generateOCSFRecommendations(event, tacticsDetected)
      }
    };
  }

  // OCSF-specific ML scoring using rich contextual data
  private static async calculateOCSFMLScore(features: OCSFFeatureVector, recentEvents: OCSFEvent[]): Promise<number> {
    let score = 0.5; // Base score
    
    // OCSF class and activity scoring
    const activityRisk = this.getActivityRiskScore(features.classUid, features.activityId);
    score += activityRisk * 0.2;
    
    // Rich contextual scoring (advantage of OCSF)
    score += (features.deviceRiskScore / 100) * 0.15;
    score += (features.userRiskScore / 100) * 0.15;
    score += (features.networkThreatLevel / 100) * 0.1;
    score += (features.fileRiskScore / 100) * 0.1;
    
    // OCSF metadata confidence scoring
    score += (features.productConfidence / 100) * 0.1;
    
    // Observable richness scoring (more observables = better detection)
    const observableBonus = Math.min(features.observableCount / 10, 0.1);
    score += observableBonus;
    
    // Temporal anomaly detection
    if (!features.isBusinessHours && features.severityId >= 3) {
      score += 0.1; // After-hours high severity events
    }
    
    // Correlation strength
    score += features.correlationStrength * 0.1;
    
    return Math.min(score, 1.0);
  }

  // Calculate device risk score from OCSF device object
  private static calculateDeviceRiskScore(event: OCSFEvent): number {
    if (!event.device) return 50;
    
    let riskScore = event.device.risk_score || 50;
    
    // Additional risk factors from OCSF device data
    if (event.device.is_personal) riskScore += 10;
    if (event.device.is_managed === false) riskScore += 15;
    if (event.device.os_version && this.isOutdatedOS(event.device.os_version)) riskScore += 20;
    
    return Math.min(riskScore, 100);
  }

  // Calculate user risk score from OCSF actor.user object
  private static calculateUserRiskScore(event: OCSFEvent): number {
    if (!event.actor?.user) return 50;
    
    let riskScore = event.actor.user.risk_score || 50;
    
    // Privilege escalation indicators
    if (event.actor.user.type === 'Admin' || event.actor.user.type === 'System') {
      riskScore += 10;
    }
    
    // Account anomalies
    if (event.actor.user.is_compromised) riskScore += 30;
    if (event.actor.user.last_login_time) {
      const daysSinceLogin = (Date.now() - new Date(event.actor.user.last_login_time).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLogin > 90) riskScore += 15; // Dormant account activity
    }
    
    return Math.min(riskScore, 100);
  }

  // Calculate network threat level from OCSF network data
  private static calculateNetworkThreatLevel(event: OCSFEvent): number {
    if (!event.src_endpoint && !event.dst_endpoint) return 30;
    
    let threatLevel = 30;
    
    // Source endpoint analysis
    if (event.src_endpoint?.ip) {
      if (this.isPrivateIP(event.src_endpoint.ip)) threatLevel -= 10;
      else threatLevel += 15; // External source
    }
    
    // Destination endpoint analysis
    if (event.dst_endpoint?.ip) {
      if (this.isThreatIntelIP(event.dst_endpoint.ip)) threatLevel += 40;
      if (this.isUncommonPort(event.dst_endpoint.port)) threatLevel += 10;
    }
    
    // Protocol analysis
    if (event.protocols && event.protocols.includes('tor')) threatLevel += 30;
    
    return Math.min(threatLevel, 100);
  }

  // Process anomaly scoring from OCSF actor.process
  private static calculateProcessAnomalyScore(event: OCSFEvent): number {
    if (!event.actor?.process) return 30;
    
    let anomalyScore = 30;
    
    const process = event.actor.process;
    
    // Process reputation
    if (process.reputation?.score) {
      anomalyScore += (100 - process.reputation.score) * 0.3;
    }
    
    // Process path analysis
    if (process.file?.path) {
      if (this.isSuspiciousPath(process.file.path)) anomalyScore += 20;
      if (this.isSystemPath(process.file.path) && process.user !== 'SYSTEM') anomalyScore += 15;
    }
    
    // Command line analysis
    if (process.cmd_line) {
      if (this.containsSuspiciousCommands(process.cmd_line)) anomalyScore += 25;
    }
    
    return Math.min(anomalyScore, 100);
  }

  // File risk scoring from OCSF file data
  private static calculateFileRiskScore(event: OCSFEvent): number {
    let riskScore = 30;
    
    // Check all file references in the event
    const files = this.extractAllFiles(event);
    
    for (const file of files) {
      if (file.reputation?.score) {
        riskScore += (100 - file.reputation.score) * 0.2;
      }
      
      if (file.hashes) {
        if (this.isKnownMalwareHash(file.hashes)) riskScore += 50;
      }
      
      if (file.signature_info?.is_verified === false) riskScore += 15;
    }
    
    return Math.min(riskScore / files.length || 1, 100);
  }

  // Count observables in OCSF event
  private static countObservables(event: OCSFEvent): number {
    let count = 0;
    
    // Count different types of observables
    if (event.src_endpoint) count++;
    if (event.dst_endpoint) count++;
    if (event.device) count++;
    if (event.actor) count++;
    if (event.resources) count += event.resources.length;
    
    // Count enrichment data
    if (event.enrichments) count += event.enrichments.length;
    
    return count;
  }

  // Generate OCSF-specific incident title
  private static generateOCSFIncidentTitle(event: OCSFEvent, attackPattern: string): string {
    const className = event.class_name;
    const activityName = event.activity_name;
    const deviceName = event.device?.name || 'Unknown Device';
    
    if (attackPattern !== 'Unknown') {
      return `${attackPattern} Detection: ${className} on ${deviceName}`;
    }
    
    return `${className}: ${activityName} Alert - ${deviceName}`;
  }

  // Detect attack patterns using OCSF context
  private static detectOCSFAttackPattern(event: OCSFEvent, recentEvents: OCSFEvent[]): string {
    // Advanced pattern detection using OCSF rich data
    const allEvents = [event, ...recentEvents];
    
    // Ransomware pattern
    if (this.detectRansomwarePattern(allEvents)) return 'Ransomware Attack';
    
    // APT pattern
    if (this.detectAPTPattern(allEvents)) return 'Advanced Persistent Threat';
    
    // Data exfiltration
    if (this.detectExfiltrationPattern(allEvents)) return 'Data Exfiltration';
    
    // Privilege escalation
    if (this.detectPrivilegeEscalationPattern(allEvents)) return 'Privilege Escalation';
    
    // Lateral movement
    if (this.detectLateralMovementPattern(allEvents)) return 'Lateral Movement';
    
    return 'Unknown';
  }

  // Helper methods for pattern detection
  private static detectRansomwarePattern(events: OCSFEvent[]): boolean {
    const fileEvents = events.filter(e => e.class_uid === 1001); // File Activity
    const processEvents = events.filter(e => e.class_uid === 1007); // Process Activity
    
    // Look for file encryption + process execution patterns
    const hasFileEncryption = fileEvents.some(e => 
      e.activity_id === 2 && // Encrypt activity
      e.file?.type_id === 6   // Encrypted file type
    );
    
    const hasRansomwareProcess = processEvents.some(e =>
      e.actor?.process?.cmd_line?.toLowerCase().includes('encrypt') ||
      e.actor?.process?.file?.name?.toLowerCase().includes('ransom')
    );
    
    return hasFileEncryption && hasRansomwareProcess;
  }

  private static detectLateralMovementPattern(events: OCSFEvent[]): boolean {
    const networkEvents = events.filter(e => e.class_uid === 4001); // Network Activity
    const authEvents = events.filter(e => e.class_uid === 3001); // Authentication
    
    // Multiple authentication attempts across different systems
    const uniqueDestinations = new Set(networkEvents.map(e => e.dst_endpoint?.ip));
    const authSources = new Set(authEvents.map(e => e.src_endpoint?.ip));
    
    return uniqueDestinations.size >= 3 && authSources.size >= 2;
  }

  // Extract MITRE tactics from OCSF event
  private static extractMITRETactics(event: OCSFEvent): string[] {
    const tactics: string[] = [];
    
    // Map OCSF activities to MITRE tactics
    if (event.class_uid === 1007 && event.activity_id === 1) { // Process Launch
      tactics.push('Execution');
    }
    
    if (event.class_uid === 1001 && event.activity_id === 2) { // File Encrypt
      tactics.push('Impact');
    }
    
    if (event.class_uid === 4001 && event.activity_id === 1) { // Network Connection
      tactics.push('Command and Control');
    }
    
    // Check for privilege escalation indicators
    if (event.actor?.user?.type === 'Admin' && event.actor?.process?.user !== event.actor.user.name) {
      tactics.push('Privilege Escalation');
    }
    
    return tactics;
  }

  // Utility methods
  private static isHighRiskActivity(classUid: number, activityId: number): boolean {
    const highRiskActivities = [
      { class: 1001, activity: 2 }, // File Encrypt
      { class: 1007, activity: 2 }, // Process Injection  
      { class: 2001, activity: 1 }, // Kernel Module Load
      { class: 3001, activity: 3 }, // Authentication Failure (repeated)
    ];
    
    return highRiskActivities.some(activity => 
      activity.class === classUid && activity.activity === activityId
    );
  }

  private static isBusinessHours(time: Date): boolean {
    const hour = time.getHours();
    const day = time.getDay();
    return day >= 1 && day <= 5 && hour >= 9 && hour <= 17;
  }

  private static isPrivateIP(ip: string): boolean {
    return /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)/.test(ip);
  }

  private static async getRecentOCSFEvents(minutes: number): Promise<OCSFEvent[]> {
    try {
      const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
      const events = await storage.getRecentOCSFEvents(cutoffTime);
      return events.map(e => JSON.parse(e.rawData as string)) as OCSFEvent[];
    } catch (error) {
      console.error('Failed to get recent OCSF events:', error);
      return [];
    }
  }

  private static async getRelatedEventsCount(event: OCSFEvent): Promise<number> {
    const recentEvents = await this.getRecentOCSFEvents(30);
    return recentEvents.filter(e => 
      e.device?.name === event.device?.name ||
      e.src_endpoint?.ip === event.src_endpoint?.ip ||
      e.actor?.user?.name === event.actor?.user?.name
    ).length;
  }

  private static async calculateCorrelationStrength(event: OCSFEvent): Promise<number> {
    const recentEvents = await this.getRecentOCSFEvents(15);
    let correlationScore = 0;
    
    for (const recentEvent of recentEvents) {
      let commonality = 0;
      
      if (event.device?.name === recentEvent.device?.name) commonality += 0.3;
      if (event.actor?.user?.name === recentEvent.actor?.user?.name) commonality += 0.3;
      if (event.src_endpoint?.ip === recentEvent.src_endpoint?.ip) commonality += 0.2;
      if (event.class_uid === recentEvent.class_uid) commonality += 0.2;
      
      correlationScore = Math.max(correlationScore, commonality);
    }
    
    return correlationScore;
  }

  // Placeholder methods for risk assessment
  private static getActivityRiskScore(classUid: number, activityId: number): number {
    // High risk activities get higher scores
    if (classUid === 1001 && activityId === 2) return 0.8; // File Encrypt
    if (classUid === 1007 && activityId === 2) return 0.9; // Process Injection
    return 0.3;
  }

  private static isOutdatedOS(version: string): boolean {
    // Simplified OS version check
    return version.includes('Windows 7') || version.includes('Windows XP');
  }

  private static isThreatIntelIP(ip: string): boolean {
    // Placeholder threat intel check
    return false; // Would integrate with real threat intel
  }

  private static isUncommonPort(port: number | undefined): boolean {
    if (!port) return false;
    const commonPorts = [80, 443, 22, 21, 25, 53, 110, 143, 993, 995];
    return !commonPorts.includes(port);
  }

  private static isSuspiciousPath(path: string): boolean {
    const suspiciousPaths = ['/tmp/', '\\temp\\', '\\appdata\\local\\temp\\'];
    return suspiciousPaths.some(p => path.toLowerCase().includes(p));
  }

  private static isSystemPath(path: string): boolean {
    return path.toLowerCase().includes('\\windows\\system32\\') || path.startsWith('/bin/') || path.startsWith('/sbin/');
  }

  private static containsSuspiciousCommands(cmdLine: string): boolean {
    const suspiciousCommands = ['powershell', 'cmd.exe', 'wget', 'curl', 'base64', 'eval'];
    return suspiciousCommands.some(cmd => cmdLine.toLowerCase().includes(cmd));
  }

  private static extractAllFiles(event: OCSFEvent): any[] {
    const files = [];
    if (event.file) files.push(event.file);
    if (event.actor?.process?.file) files.push(event.actor.process.file);
    if (event.resources) {
      event.resources.forEach(resource => {
        if (resource.type === 'File' && resource.data) files.push(resource.data);
      });
    }
    return files;
  }

  private static isKnownMalwareHash(hashes: any): boolean {
    // Would integrate with threat intelligence for hash checking
    return false;
  }

  private static calculateEnrichmentScore(event: OCSFEvent): number {
    let score = 0;
    if (event.enrichments && event.enrichments.length > 0) score += 30;
    if (event.reputation) score += 20;
    if (event.malware && event.malware.length > 0) score += 50;
    return score;
  }

  private static assessOCSFImpact(event: OCSFEvent, features: OCSFFeatureVector): string {
    if (features.deviceRiskScore > 70 && features.userRiskScore > 70) {
      return 'High Impact: Critical device and user involved';
    }
    if (event.severity_id >= 4) {
      return 'Medium-High Impact: High severity security event';
    }
    return 'Low-Medium Impact: Standard security event';
  }

  private static generateOCSFRecommendations(event: OCSFEvent, tactics: string[]): string[] {
    const recommendations = [];
    
    if (tactics.includes('Execution')) {
      recommendations.push('Block suspicious process execution');
    }
    if (tactics.includes('Impact')) {
      recommendations.push('Isolate affected systems immediately');
    }
    if (tactics.includes('Command and Control')) {
      recommendations.push('Block network communications to suspicious IPs');
    }
    if (event.device?.name) {
      recommendations.push(`Quarantine device: ${event.device.name}`);
    }
    
    return recommendations;
  }

  private static detectAPTPattern(events: OCSFEvent[]): boolean {
    // Multiple persistent connections over time
    const networkEvents = events.filter(e => e.class_uid === 4001);
    const timeSpan = networkEvents.length > 0 ? 
      Math.max(...networkEvents.map(e => e.time)) - Math.min(...networkEvents.map(e => e.time)) : 0;
    
    return networkEvents.length >= 5 && timeSpan > 3600000; // 1 hour persistence
  }

  private static detectExfiltrationPattern(events: OCSFEvent[]): boolean {
    // Large data transfers to external destinations
    const networkEvents = events.filter(e => 
      e.class_uid === 4001 && 
      e.traffic?.bytes_out && 
      e.traffic.bytes_out > 100000000 // 100MB+
    );
    
    return networkEvents.length >= 2;
  }

  private static detectPrivilegeEscalationPattern(events: OCSFEvent[]): boolean {
    const authEvents = events.filter(e => e.class_uid === 3001);
    
    // Look for successful authentication with elevated privileges
    return authEvents.some(e => 
      e.activity_id === 1 && // Logon
      e.actor?.user?.type === 'Admin' &&
      e.status_id === 1 // Success
    );
  }

  private static generateOCSFIncidentDescription(event: OCSFEvent, tactics: string[], confidence: number): string {
    const deviceInfo = event.device?.name || 'Unknown device';
    const userInfo = event.actor?.user?.name || 'Unknown user';
    const activityInfo = `${event.class_name}: ${event.activity_name}`;
    
    let description = `OCSF-based detection: ${activityInfo} detected on ${deviceInfo}`;
    
    if (userInfo !== 'Unknown user') {
      description += ` involving user ${userInfo}`;
    }
    
    if (tactics.length > 0) {
      description += `\n\nMITRE Tactics Detected: ${tactics.join(', ')}`;
    }
    
    description += `\n\nConfidence Level: ${(confidence * 100).toFixed(1)}%`;
    description += `\nOCSF Classification: ${event.class_name} (${event.class_uid})`;
    
    return description;
  }
}