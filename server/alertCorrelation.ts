import { storage } from "./storage";
import { ThreatIntelligenceService } from "./threatIntelligence";
import { type RawAlert, type InsertIncident } from "@shared/schema";
import { randomUUID } from "crypto";

export interface CorrelationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: {
    severityThreshold?: string;
    alertCount?: number;
    timeWindow?: number; // minutes
    sourceTypes?: string[];
    keywordMatches?: string[];
  };
  actions: {
    createIncident: boolean;
    escalate: boolean;
    notifyAnalyst: boolean;
  };
}

export interface CorrelationResult {
  shouldCreateIncident: boolean;
  incidentSeverity: 'low' | 'medium' | 'high' | 'critical';
  incidentTitle: string;
  incidentDescription: string;
  confidence: number;
  relatedAlerts: RawAlert[];
  triggeredRules: CorrelationRule[];
  threatIntelligence?: {
    indicators: any[];
    riskScore: number;
    threats: any[];
    recommendations: string[];
  };
}

export class AlertCorrelationEngine {
  private static defaultRules: CorrelationRule[] = [
    {
      id: "critical-alert-rule",
      name: "Critical Alert Auto-Escalation",
      description: "Automatically create incidents for critical severity alerts",
      enabled: true,
      conditions: {
        severityThreshold: "critical"
      },
      actions: {
        createIncident: true,
        escalate: true,
        notifyAnalyst: true
      }
    },
    {
      id: "multiple-high-alerts",
      name: "Multiple High Severity Alerts",
      description: "Create incident when 3+ high severity alerts occur within 30 minutes",
      enabled: true,
      conditions: {
        severityThreshold: "high",
        alertCount: 3,
        timeWindow: 30
      },
      actions: {
        createIncident: true,
        escalate: false,
        notifyAnalyst: true
      }
    },
    {
      id: "ransomware-indicators",
      name: "Ransomware Activity Detection",
      description: "Detect potential ransomware based on file encryption patterns",
      enabled: true,
      conditions: {
        keywordMatches: ["encrypt", "ransom", "locked", "decrypt", "bitcoin", "payment"]
      },
      actions: {
        createIncident: true,
        escalate: true,
        notifyAnalyst: true
      }
    },
    {
      id: "privilege-escalation",
      name: "Privilege Escalation Pattern",
      description: "Detect privilege escalation attempts",
      enabled: true,
      conditions: {
        keywordMatches: ["privilege", "escalation", "admin", "root", "sudo", "elevation"]
      },
      actions: {
        createIncident: true,
        escalate: false,
        notifyAnalyst: true
      }
    },
    {
      id: "data-exfiltration",
      name: "Data Exfiltration Detection",
      description: "Detect potential data exfiltration activities",
      enabled: true,
      conditions: {
        keywordMatches: ["exfiltration", "transfer", "upload", "download", "copy", "steal"]
      },
      actions: {
        createIncident: true,
        escalate: true,
        notifyAnalyst: true
      }
    }
  ];

  static async correlateAlert(alert: RawAlert): Promise<CorrelationResult> {
    const recentAlerts = await this.getRecentAlerts(60); // Last 60 minutes
    const triggeredRules: CorrelationRule[] = [];
    let shouldCreateIncident = false;
    let incidentSeverity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    let confidence = 0.5;

    // Check each correlation rule
    for (const rule of this.defaultRules) {
      if (!rule.enabled) continue;

      const ruleTriggered = await this.evaluateRule(rule, alert, recentAlerts);
      if (ruleTriggered) {
        triggeredRules.push(rule);
        
        if (rule.actions.createIncident) {
          shouldCreateIncident = true;
        }

        // Determine severity based on rule type
        if (rule.id === "critical-alert-rule" || rule.id === "ransomware-indicators") {
          incidentSeverity = 'critical';
          confidence = Math.max(confidence, 0.9);
        } else if (rule.id === "data-exfiltration" || rule.id === "multiple-high-alerts") {
          incidentSeverity = 'high';
          confidence = Math.max(confidence, 0.8);
        } else {
          incidentSeverity = 'medium';
          confidence = Math.max(confidence, 0.6);
        }
      }
    }

    // Threat intelligence enrichment
    const threatEnrichment = await ThreatIntelligenceService.enrichAlert(alert);
    
    // Machine learning-based correlation (simplified)
    const mlScore = await this.calculateMLScore(alert, recentAlerts);
    confidence = Math.max(confidence, mlScore);

    // Factor in threat intelligence risk score
    if (threatEnrichment.riskScore > 5) {
      confidence = Math.max(confidence, threatEnrichment.riskScore / 10);
      
      if (threatEnrichment.riskScore >= 7 && !shouldCreateIncident) {
        shouldCreateIncident = true;
        incidentSeverity = 'critical';
      } else if (threatEnrichment.riskScore >= 4 && !shouldCreateIncident) {
        shouldCreateIncident = true;
        incidentSeverity = 'high';
      }
    }

    // If ML score is very high, create incident even if no rules triggered
    if (mlScore > 0.85 && !shouldCreateIncident) {
      shouldCreateIncident = true;
      incidentSeverity = 'high';
    }

    const incidentTitle = this.generateIncidentTitle(alert, triggeredRules);
    const incidentDescription = await this.generateIncidentDescription(alert, triggeredRules, confidence);

    return {
      shouldCreateIncident,
      incidentSeverity,
      incidentTitle,
      incidentDescription,
      confidence,
      relatedAlerts: [alert, ...recentAlerts.slice(0, 5)], // Include up to 5 related alerts
      triggeredRules,
      threatIntelligence: threatEnrichment.indicators.length > 0 ? threatEnrichment : undefined
    };
  }

  private static async evaluateRule(
    rule: CorrelationRule,
    alert: RawAlert,
    recentAlerts: RawAlert[]
  ): Promise<boolean> {
    const { conditions } = rule;

    // Check severity threshold
    if (conditions.severityThreshold) {
      const severityLevels = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
      const alertSeverity = severityLevels[alert.severity as keyof typeof severityLevels] || 0;
      const threshold = severityLevels[conditions.severityThreshold as keyof typeof severityLevels] || 0;
      
      if (alertSeverity < threshold) {
        return false;
      }
    }

    // Check alert count in time window
    if (conditions.alertCount && conditions.timeWindow) {
      const relevantAlerts = recentAlerts.filter(a => 
        new Date(a.receivedAt).getTime() > Date.now() - (conditions.timeWindow! * 60 * 1000)
      );
      
      if (relevantAlerts.length < conditions.alertCount - 1) { // -1 because current alert counts
        return false;
      }
    }

    // Check source types
    if (conditions.sourceTypes && conditions.sourceTypes.length > 0) {
      const source = await storage.getSource(alert.sourceId);
      if (!source || !conditions.sourceTypes.includes(source.type)) {
        return false;
      }
    }

    // Check keyword matches
    if (conditions.keywordMatches && conditions.keywordMatches.length > 0) {
      const alertText = [
        alert.description || '',
        alert.type || '',
        JSON.stringify(alert.rawData)
      ].join(' ').toLowerCase();

      const hasKeywordMatch = conditions.keywordMatches.some(keyword =>
        alertText.includes(keyword.toLowerCase())
      );

      if (!hasKeywordMatch) {
        return false;
      }
    }

    return true;
  }

  private static async getRecentAlerts(minutes: number = 60): Promise<RawAlert[]> {
    const allAlerts = await storage.getRawAlerts();
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
    
    return allAlerts
      .filter(alert => new Date(alert.receivedAt) > cutoffTime)
      .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
  }

  private static async calculateMLScore(alert: RawAlert, recentAlerts: RawAlert[]): Promise<number> {
    // Simplified ML scoring based on various factors
    let score = 0.3; // Base score

    // Severity contribution
    const severityScores = { 'critical': 0.4, 'high': 0.3, 'medium': 0.2, 'low': 0.1 };
    score += severityScores[alert.severity as keyof typeof severityScores] || 0.1;

    // Frequency analysis - if similar alerts occurred recently
    const similarAlerts = recentAlerts.filter(a => 
      a.type === alert.type || 
      a.severity === alert.severity ||
      a.sourceId === alert.sourceId
    );
    
    if (similarAlerts.length > 2) {
      score += 0.2; // Pattern detected
    }

    // Time-based analysis - alerts during off-hours are more suspicious
    const hour = new Date(alert.receivedAt).getHours();
    if (hour < 6 || hour > 22) {
      score += 0.1; // Off-hours activity
    }

    // Source reputation (simplified)
    const source = await storage.getSource(alert.sourceId);
    if (source?.type === 'EDR' || source?.type === 'SIEM') {
      score += 0.1; // Higher trust in EDR/SIEM alerts
    }

    return Math.min(score, 1.0); // Cap at 1.0
  }

  private static generateIncidentTitle(alert: RawAlert, triggeredRules: CorrelationRule[]): string {
    if (triggeredRules.length > 0) {
      const primaryRule = triggeredRules[0];
      if (primaryRule.id === "ransomware-indicators") {
        return "Potential Ransomware Activity Detected";
      } else if (primaryRule.id === "data-exfiltration") {
        return "Possible Data Exfiltration Attempt";
      } else if (primaryRule.id === "privilege-escalation") {
        return "Privilege Escalation Activity Detected";
      } else if (primaryRule.id === "critical-alert-rule") {
        return `Critical Security Alert: ${alert.type || 'Unknown'}`;
      } else if (primaryRule.id === "multiple-high-alerts") {
        return "Multiple High-Severity Security Events";
      }
    }

    // Fallback title
    return `Security Incident: ${alert.type || 'Automated Detection'}`;
  }

  private static async generateIncidentDescription(
    alert: RawAlert,
    triggeredRules: CorrelationRule[],
    confidence: number
  ): Promise<string> {
    let description = `Automated incident created with ${(confidence * 100).toFixed(1)}% confidence.\n\n`;
    
    description += `**Primary Alert Details:**\n`;
    description += `- Type: ${alert.type || 'Unknown'}\n`;
    description += `- Severity: ${alert.severity || 'Unknown'}\n`;
    description += `- Description: ${alert.description || 'No description available'}\n`;
    description += `- Received: ${new Date(alert.receivedAt).toISOString()}\n\n`;

    if (triggeredRules.length > 0) {
      description += `**Triggered Correlation Rules:**\n`;
      triggeredRules.forEach(rule => {
        description += `- ${rule.name}: ${rule.description}\n`;
      });
      description += '\n';
    }
    
    // Add threat intelligence information if available
    const threatEnrichment = await ThreatIntelligenceService.enrichAlert(alert);
    if (threatEnrichment.indicators.length > 0) {
      description += `**Threat Intelligence Matches:**\n`;
      description += `- Risk Score: ${threatEnrichment.riskScore.toFixed(1)}/10\n`;
      threatEnrichment.indicators.forEach(indicator => {
        description += `- ${indicator.type}: ${indicator.value} (${indicator.severity}, ${indicator.source})\n`;
      });
      description += '\n';
      
      if (threatEnrichment.recommendations.length > 0) {
        description += `**Threat Intelligence Recommendations:**\n`;
        threatEnrichment.recommendations.forEach(rec => {
          description += `- ${rec}\n`;
        });
        description += '\n';
      }
    }

    description += `**Recommended Actions:**\n`;
    if (triggeredRules.some(r => r.actions.escalate)) {
      description += `- Immediate escalation recommended\n`;
    }
    description += `- Review alert details and raw data\n`;
    description += `- Investigate related systems and users\n`;
    description += `- Consider containment measures if confirmed malicious\n`;

    return description;
  }

  static async createIncidentFromCorrelation(
    correlationResult: CorrelationResult,
    primaryAlert: RawAlert
  ): Promise<string | null> {
    if (!correlationResult.shouldCreateIncident) {
      return null;
    }

    const incidentData: InsertIncident = {
      title: correlationResult.incidentTitle,
      description: correlationResult.incidentDescription,
      severity: correlationResult.incidentSeverity,
      status: 'open'
    };

    try {
      const incident = await storage.createIncident(incidentData);
      
      // Create initial action for the incident
      await storage.createAction({
        incidentId: incident.id,
        actionType: 'AUTOMATED_DETECTION',
        payload: {
          primaryAlertId: primaryAlert.id,
          confidence: correlationResult.confidence,
          triggeredRules: correlationResult.triggeredRules.map(r => r.id),
          relatedAlertIds: correlationResult.relatedAlerts.map(a => a.id)
        },
        performedBy: 'system'
      });

      console.log(`✅ Auto-created incident ${incident.id}: ${incident.title}`);
      return incident.id;
    } catch (error) {
      console.error('❌ Failed to create incident from correlation:', error);
      return null;
    }
  }
}