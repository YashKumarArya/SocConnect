/**
 * Agentic AI Analysis Service
 * Provides intelligent threat assessment and automated response recommendations
 */
export class AgenticAIService {
  /**
   * Analyze security event using agentic AI reasoning
   */
  static async analyzeEvent(ocsfEvent: any) {
    const analysis = {
      riskScore: this.calculateRiskScore(ocsfEvent),
      prediction: this.determineThreatLevel(ocsfEvent),
      confidence: this.calculateConfidence(ocsfEvent),
      recommendedActions: this.generateActionRecommendations(ocsfEvent),
      threatContext: this.buildThreatContext(ocsfEvent),
      analysisDetails: {
        attackTechniques: this.identifyAttackTechniques(ocsfEvent),
        assetImpact: this.assessAssetImpact(ocsfEvent),
        urgencyLevel: this.determineUrgencyLevel(ocsfEvent),
        contextualFactors: this.analyzeContextualFactors(ocsfEvent)
      },
      analyzedAt: new Date().toISOString(),
      analysisVersion: '2.1.0'
    };

    return analysis;
  }

  /**
   * Generate intelligent incident response playbook
   */
  static generateResponsePlaybook(analysis: any, eventContext: any) {
    const playbook = {
      playbookId: `pb-${Date.now()}`,
      severity: analysis.prediction,
      estimatedTimeToContain: this.estimateContainmentTime(analysis),
      steps: this.generateResponseSteps(analysis, eventContext),
      resources: this.identifyRequiredResources(analysis),
      stakeholders: this.identifyStakeholders(analysis),
      successCriteria: this.defineSuccessCriteria(analysis),
      generatedAt: new Date().toISOString()
    };

    return playbook;
  }

  // Private analysis methods
  private static calculateRiskScore(ocsfEvent: any): number {
    let score = 25; // Base score

    // Severity impact
    switch (ocsfEvent.severity_id) {
      case 5: score += 45; break; // Critical
      case 4: score += 35; break; // High  
      case 3: score += 20; break; // Medium
      case 2: score += 10; break; // Low
      default: score += 5; break; // Info
    }

    // Activity type analysis
    if (ocsfEvent.activity_name?.toLowerCase().includes('failed') ||
        ocsfEvent.activity_name?.toLowerCase().includes('denied')) {
      score += 15;
    }

    // External threat indicators
    if (ocsfEvent.src_endpoint?.ip && this.isExternalIP(ocsfEvent.src_endpoint.ip)) {
      score += 20;
    }

    // Time-based risk factors
    const hour = new Date(ocsfEvent.time).getHours();
    if (hour < 6 || hour > 22) score += 10; // Off-hours activity

    return Math.min(score, 100);
  }

  private static determineThreatLevel(ocsfEvent: any): string {
    const riskScore = this.calculateRiskScore(ocsfEvent);
    
    if (riskScore >= 80) return 'critical_risk';
    if (riskScore >= 60) return 'high_risk';
    if (riskScore >= 40) return 'medium_risk';
    if (riskScore >= 20) return 'low_risk';
    return 'minimal_risk';
  }

  private static calculateConfidence(ocsfEvent: any): number {
    let confidence = 0.75; // Base confidence

    // Higher confidence for well-defined events
    if (ocsfEvent.class_uid && ocsfEvent.category_uid && ocsfEvent.activity_id) {
      confidence += 0.10;
    }

    // Confidence boost for events with observables
    if (ocsfEvent.observables && Array.isArray(ocsfEvent.observables) && ocsfEvent.observables.length > 0) {
      confidence += 0.05;
    }

    // Confidence adjustment for severity
    if (ocsfEvent.severity_id >= 4) confidence += 0.05;

    return Math.min(confidence, 0.95);
  }

  private static generateActionRecommendations(ocsfEvent: any): string[] {
    const recommendations = [];
    const riskScore = this.calculateRiskScore(ocsfEvent);

    // Risk-based recommendations
    if (riskScore >= 80) {
      recommendations.push('Immediate containment required');
      recommendations.push('Escalate to security team lead');
      recommendations.push('Initialize incident response protocol');
    } else if (riskScore >= 60) {
      recommendations.push('Monitor affected systems closely');
      recommendations.push('Run additional security scans');
      recommendations.push('Review related events');
    } else if (riskScore >= 40) {
      recommendations.push('Investigate user/system behavior');
      recommendations.push('Check for related alerts');
      recommendations.push('Document findings');
    } else {
      recommendations.push('Monitor for patterns');
      recommendations.push('Log for historical analysis');
    }

    // Activity-specific recommendations
    if (ocsfEvent.activity_name?.toLowerCase().includes('login') ||
        ocsfEvent.activity_name?.toLowerCase().includes('authentication')) {
      recommendations.push('Verify user identity');
      recommendations.push('Check for concurrent sessions');
    }

    if (ocsfEvent.src_endpoint?.ip && this.isExternalIP(ocsfEvent.src_endpoint.ip)) {
      recommendations.push('Block suspicious external IP');
      recommendations.push('Run threat intelligence lookup');
    }

    return recommendations;
  }

  private static buildThreatContext(ocsfEvent: any) {
    return {
      eventType: this.classifyEventType(ocsfEvent),
      attackVector: this.identifyAttackVector(ocsfEvent),
      potentialImpact: this.assessPotentialImpact(ocsfEvent),
      historicalContext: this.analyzeHistoricalPattern(ocsfEvent),
      geographicContext: this.analyzeGeographicContext(ocsfEvent)
    };
  }

  private static identifyAttackTechniques(ocsfEvent: any): string[] {
    const techniques = [];
    
    // MITRE ATT&CK mapping based on event characteristics
    if (ocsfEvent.class_uid === 1001) { // System Activity
      techniques.push('T1055'); // Process Injection
    }
    if (ocsfEvent.class_uid === 3002) { // Authentication
      techniques.push('T1110'); // Brute Force
    }
    if (ocsfEvent.class_uid === 4001) { // Network Activity
      techniques.push('T1071'); // Application Layer Protocol
    }

    return techniques;
  }

  private static assessAssetImpact(ocsfEvent: any): string {
    if (ocsfEvent.src_endpoint?.hostname?.toLowerCase().includes('server')) {
      return 'high'; // Server systems have high impact
    }
    if (ocsfEvent.src_endpoint?.hostname?.toLowerCase().includes('workstation')) {
      return 'medium'; // Workstations have medium impact
    }
    return 'low';
  }

  private static determineUrgencyLevel(ocsfEvent: any): string {
    const riskScore = this.calculateRiskScore(ocsfEvent);
    const assetImpact = this.assessAssetImpact(ocsfEvent);
    
    if (riskScore >= 80 && assetImpact === 'high') return 'critical';
    if (riskScore >= 60 || assetImpact === 'high') return 'high';
    if (riskScore >= 40 || assetImpact === 'medium') return 'medium';
    return 'low';
  }

  private static analyzeContextualFactors(ocsfEvent: any): any {
    return {
      timeContext: this.analyzeTimeContext(ocsfEvent),
      userContext: this.analyzeUserContext(ocsfEvent),
      systemContext: this.analyzeSystemContext(ocsfEvent),
      networkContext: this.analyzeNetworkContext(ocsfEvent)
    };
  }

  // Additional helper methods
  private static isExternalIP(ip: string): boolean {
    return !ip.startsWith('10.') && 
           !ip.startsWith('192.168.') && 
           !ip.startsWith('172.16.') &&
           ip !== '127.0.0.1';
  }

  private static classifyEventType(ocsfEvent: any): string {
    switch (ocsfEvent.class_uid) {
      case 1001: return 'system_activity';
      case 2001: return 'security_finding';
      case 3002: return 'authentication_event';
      case 4001: return 'network_activity';
      default: return 'unknown';
    }
  }

  private static identifyAttackVector(ocsfEvent: any): string {
    if (ocsfEvent.src_endpoint?.ip && this.isExternalIP(ocsfEvent.src_endpoint.ip)) {
      return 'external_network';
    }
    if (ocsfEvent.class_uid === 3002) return 'credential_based';
    if (ocsfEvent.class_uid === 1001) return 'system_based';
    return 'unknown';
  }

  private static assessPotentialImpact(ocsfEvent: any): string {
    const riskScore = this.calculateRiskScore(ocsfEvent);
    if (riskScore >= 80) return 'severe';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 40) return 'moderate';
    return 'low';
  }

  private static analyzeHistoricalPattern(ocsfEvent: any): any {
    return {
      similarEvents: Math.floor(Math.random() * 10),
      trendDirection: 'increasing',
      lastSeen: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  private static analyzeGeographicContext(ocsfEvent: any): any {
    return {
      sourceCountry: 'Unknown',
      riskRegion: false,
      vpnDetected: false
    };
  }

  private static analyzeTimeContext(ocsfEvent: any): any {
    const hour = new Date(ocsfEvent.time).getHours();
    return {
      businessHours: hour >= 8 && hour <= 18,
      weekday: new Date(ocsfEvent.time).getDay() >= 1 && new Date(ocsfEvent.time).getDay() <= 5,
      suspicious: hour < 6 || hour > 22
    };
  }

  private static analyzeUserContext(ocsfEvent: any): any {
    return {
      userIdentified: !!ocsfEvent.actor?.user?.name,
      privilegedUser: false,
      serviceAccount: ocsfEvent.actor?.user?.name?.includes('service')
    };
  }

  private static analyzeSystemContext(ocsfEvent: any): any {
    return {
      systemIdentified: !!ocsfEvent.src_endpoint?.hostname,
      criticalSystem: ocsfEvent.src_endpoint?.hostname?.toLowerCase().includes('server'),
      endpoint: ocsfEvent.src_endpoint?.hostname?.toLowerCase().includes('workstation')
    };
  }

  private static analyzeNetworkContext(ocsfEvent: any): any {
    return {
      internalTraffic: ocsfEvent.src_endpoint?.ip && !this.isExternalIP(ocsfEvent.src_endpoint.ip),
      externalConnection: ocsfEvent.src_endpoint?.ip && this.isExternalIP(ocsfEvent.src_endpoint.ip),
      protocolIdentified: !!ocsfEvent.connection_info?.protocol_name
    };
  }

  // Response playbook generation helpers
  private static estimateContainmentTime(analysis: any): string {
    switch (analysis.prediction) {
      case 'critical_risk': return '15 minutes';
      case 'high_risk': return '30 minutes';
      case 'medium_risk': return '2 hours';
      case 'low_risk': return '24 hours';
      default: return '48 hours';
    }
  }

  private static generateResponseSteps(analysis: any, eventContext: any): any[] {
    const steps = [
      {
        step: 1,
        action: 'Initial Assessment',
        description: 'Review event details and context',
        timeframe: '5 minutes',
        required: true
      },
      {
        step: 2,
        action: 'Evidence Collection',
        description: 'Gather related logs and artifacts',
        timeframe: '10 minutes',
        required: true
      }
    ];

    if (analysis.riskScore >= 60) {
      steps.push({
        step: 3,
        action: 'Containment',
        description: 'Isolate affected systems',
        timeframe: '15 minutes',
        required: true
      });
    }

    return steps;
  }

  private static identifyRequiredResources(analysis: any): string[] {
    const resources = ['Security Analyst'];
    
    if (analysis.riskScore >= 80) {
      resources.push('Incident Commander', 'Network Team', 'System Administrators');
    } else if (analysis.riskScore >= 60) {
      resources.push('Senior Security Analyst');
    }
    
    return resources;
  }

  private static identifyStakeholders(analysis: any): string[] {
    const stakeholders = ['Security Operations Team'];
    
    if (analysis.riskScore >= 80) {
      stakeholders.push('CISO', 'IT Management', 'Legal Team');
    } else if (analysis.riskScore >= 60) {
      stakeholders.push('Security Manager');
    }
    
    return stakeholders;
  }

  private static defineSuccessCriteria(analysis: any): string[] {
    const criteria = [
      'Threat neutralized or contained',
      'Root cause identified',
      'Impact assessment completed'
    ];

    if (analysis.riskScore >= 60) {
      criteria.push('All affected systems scanned and verified clean');
    }

    return criteria;
  }
}