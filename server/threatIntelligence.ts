import { storage } from "./storage";
import { type RawAlert } from "@shared/schema";

export interface ThreatIndicator {
  id: string;
  type: 'IP' | 'Domain' | 'URL' | 'FileHash' | 'Email' | 'Registry';
  value: string;
  confidence: number; // 0-1
  severity: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  source: string; // e.g., 'VirusTotal', 'MISP', 'AlienVault'
  firstSeen: Date;
  lastSeen: Date;
  threatType?: string; // e.g., 'malware', 'phishing', 'apt'
  description?: string;
  references?: string[];
  ttl?: number; // Time to live in hours
}

export interface ThreatEnrichmentResult {
  indicators: ThreatIndicator[];
  riskScore: number; // 0-10
  threats: {
    type: string;
    confidence: number;
    description: string;
  }[];
  recommendations: string[];
}

export interface ThreatFeed {
  name: string;
  url: string;
  enabled: boolean;
  format: 'json' | 'csv' | 'xml' | 'stix';
  updateInterval: number; // hours
  lastUpdated?: Date;
  apiKey?: string;
}

export class ThreatIntelligenceService {
  private static indicators: Map<string, ThreatIndicator> = new Map();
  
  // Sample threat feeds configuration
  private static feeds: ThreatFeed[] = [
    {
      name: 'AlienVault OTX',
      url: 'https://otx.alienvault.com/api/v1/indicators',
      enabled: true,
      format: 'json',
      updateInterval: 6,
      apiKey: process.env.ALIENVAULT_API_KEY
    },
    {
      name: 'MISP Feed',
      url: 'https://misp.example.com/feeds',
      enabled: false,
      format: 'json',
      updateInterval: 12,
      apiKey: process.env.MISP_API_KEY
    },
    {
      name: 'VirusTotal',
      url: 'https://www.virustotal.com/vtapi/v2',
      enabled: true,
      format: 'json',
      updateInterval: 4,
      apiKey: process.env.VIRUSTOTAL_API_KEY
    }
  ];

  static {
    // Initialize with sample threat intelligence data
    this.initializeSampleData();
  }

  private static initializeSampleData() {
    const sampleIndicators: ThreatIndicator[] = [
      {
        id: 'ioc-001',
        type: 'IP',
        value: '198.51.100.23',
        confidence: 0.95,
        severity: 'critical',
        tags: ['malware', 'c2', 'apt29'],
        source: 'VirusTotal',
        firstSeen: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lastSeen: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        threatType: 'command-and-control',
        description: 'Known C2 server for APT29 malware campaign',
        references: ['https://attack.mitre.org/groups/G0016/']
      },
      {
        id: 'ioc-002',
        type: 'Domain',
        value: 'malware.example.com',
        confidence: 0.87,
        severity: 'high',
        tags: ['malware', 'downloader', 'emotet'],
        source: 'AlienVault OTX',
        firstSeen: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        lastSeen: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        threatType: 'malware-distribution',
        description: 'Domain serving Emotet banking trojan',
        references: ['https://example.com/threat-report-emotet']
      },
      {
        id: 'ioc-003',
        type: 'FileHash',
        value: 'a1b2c3d4e5f6789012345678901234567890abcd',
        confidence: 0.92,
        severity: 'critical',
        tags: ['ransomware', 'ryuk', 'encryption'],
        source: 'MISP',
        firstSeen: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        lastSeen: new Date(Date.now() - 12 * 60 * 60 * 1000),
        threatType: 'ransomware',
        description: 'Ryuk ransomware variant hash',
        references: ['https://example.com/ryuk-analysis']
      },
      {
        id: 'ioc-004',
        type: 'IP',
        value: '203.0.113.45',
        confidence: 0.78,
        severity: 'medium',
        tags: ['scanning', 'brute-force', 'ssh'],
        source: 'ThreatFox',
        firstSeen: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        lastSeen: new Date(Date.now() - 3 * 60 * 60 * 1000),
        threatType: 'scanning',
        description: 'IP address conducting SSH brute force attacks',
        references: []
      },
      {
        id: 'ioc-005',
        type: 'Email',
        value: 'phishing@badactor.com',
        confidence: 0.89,
        severity: 'high',
        tags: ['phishing', 'credential-theft', 'business-email-compromise'],
        source: 'PhishTank',
        firstSeen: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        lastSeen: new Date(Date.now() - 6 * 60 * 60 * 1000),
        threatType: 'phishing',
        description: 'Email address used in business email compromise campaigns',
        references: ['https://example.com/bec-report']
      },
      {
        id: 'ioc-006',
        type: 'URL',
        value: 'https://evil-domain.com/payload.exe',
        confidence: 0.94,
        severity: 'critical',
        tags: ['malware', 'trojan', 'payload'],
        source: 'URLVoid',
        firstSeen: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        lastSeen: new Date(Date.now() - 1 * 60 * 60 * 1000),
        threatType: 'malware-delivery',
        description: 'URL hosting trojan payloads',
        references: []
      }
    ];

    sampleIndicators.forEach(indicator => {
      this.indicators.set(indicator.value, indicator);
    });

    console.log(`🛡️ Loaded ${sampleIndicators.length} threat intelligence indicators`);
  }

  static async enrichAlert(alert: RawAlert): Promise<ThreatEnrichmentResult> {
    const enrichmentResult: ThreatEnrichmentResult = {
      indicators: [],
      riskScore: 0,
      threats: [],
      recommendations: []
    };

    // Extract potential IOCs from alert data
    const iocs = this.extractIOCs(alert);
    let totalRiskScore = 0;
    let threatCount = 0;

    for (const ioc of iocs) {
      const indicator = this.indicators.get(ioc.value);
      if (indicator) {
        enrichmentResult.indicators.push(indicator);
        
        // Calculate risk contribution
        const riskContribution = this.calculateRiskScore(indicator);
        totalRiskScore += riskContribution;
        threatCount++;

        // Add threat information
        enrichmentResult.threats.push({
          type: indicator.threatType || 'unknown',
          confidence: indicator.confidence,
          description: indicator.description || `${indicator.type} indicator detected`
        });
      }
    }

    // Calculate overall risk score (0-10)
    enrichmentResult.riskScore = threatCount > 0 ? 
      Math.min(totalRiskScore / threatCount * 10, 10) : 0;

    // Generate recommendations based on findings
    enrichmentResult.recommendations = this.generateRecommendations(enrichmentResult);

    return enrichmentResult;
  }

  private static extractIOCs(alert: RawAlert): { type: string; value: string }[] {
    const iocs: { type: string; value: string }[] = [];
    const alertText = JSON.stringify(alert.rawData).toLowerCase();

    // Extract IP addresses
    const ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
    const ips = alertText.match(ipRegex) || [];
    ips.forEach(ip => {
      if (this.isValidIP(ip)) {
        iocs.push({ type: 'IP', value: ip });
      }
    });

    // Extract domains
    const domainRegex = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\b/g;
    const domains = alertText.match(domainRegex) || [];
    domains.forEach(domain => {
      if (this.isValidDomain(domain)) {
        iocs.push({ type: 'Domain', value: domain });
      }
    });

    // Extract file hashes (SHA1, SHA256, MD5)
    const hashRegex = /\b[a-f0-9]{32,64}\b/g;
    const hashes = alertText.match(hashRegex) || [];
    hashes.forEach(hash => {
      iocs.push({ type: 'FileHash', value: hash });
    });

    // Extract email addresses
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = alertText.match(emailRegex) || [];
    emails.forEach(email => {
      iocs.push({ type: 'Email', value: email.toLowerCase() });
    });

    // Extract URLs
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    const urls = alertText.match(urlRegex) || [];
    urls.forEach(url => {
      iocs.push({ type: 'URL', value: url });
    });

    return iocs;
  }

  private static calculateRiskScore(indicator: ThreatIndicator): number {
    let score = indicator.confidence;

    // Severity multiplier
    const severityMultipliers = { 'low': 0.25, 'medium': 0.5, 'high': 0.75, 'critical': 1.0 };
    score *= severityMultipliers[indicator.severity];

    // Recency bonus (more recent = higher risk)
    const daysSinceLastSeen = (Date.now() - indicator.lastSeen.getTime()) / (1000 * 60 * 60 * 24);
    const recencyBonus = Math.max(0, 1 - (daysSinceLastSeen / 30)); // Decay over 30 days
    score *= (1 + recencyBonus * 0.5);

    // Threat type multiplier
    const threatTypeMultipliers: { [key: string]: number } = {
      'ransomware': 1.2,
      'command-and-control': 1.1,
      'malware-distribution': 1.0,
      'phishing': 0.9,
      'scanning': 0.7
    };
    const threatMultiplier = threatTypeMultipliers[indicator.threatType || ''] || 1.0;
    score *= threatMultiplier;

    return Math.min(score, 1.0);
  }

  private static generateRecommendations(enrichment: ThreatEnrichmentResult): string[] {
    const recommendations: string[] = [];

    if (enrichment.riskScore >= 7) {
      recommendations.push('IMMEDIATE ACTION: High-risk threat indicators detected');
      recommendations.push('Isolate affected systems immediately');
      recommendations.push('Escalate to senior security team');
    } else if (enrichment.riskScore >= 4) {
      recommendations.push('Investigate and monitor affected systems');
      recommendations.push('Consider blocking identified IOCs');
    } else if (enrichment.riskScore >= 1) {
      recommendations.push('Monitor for additional suspicious activity');
      recommendations.push('Document findings for trend analysis');
    }

    // Specific recommendations based on threat types
    const threatTypes = enrichment.threats.map(t => t.type);
    if (threatTypes.includes('ransomware')) {
      recommendations.push('Check for file encryption activities');
      recommendations.push('Verify backup integrity and accessibility');
    }
    if (threatTypes.includes('phishing')) {
      recommendations.push('Check for credential compromise');
      recommendations.push('Notify users about potential phishing attempts');
    }
    if (threatTypes.includes('command-and-control')) {
      recommendations.push('Block network communication to identified C2 servers');
      recommendations.push('Hunt for additional compromised endpoints');
    }

    return recommendations;
  }

  private static isValidIP(ip: string): boolean {
    const parts = ip.split('.');
    return parts.length === 4 && parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }

  private static isValidDomain(domain: string): boolean {
    return domain.includes('.') && 
           domain.length > 3 && 
           !domain.includes(' ') &&
           !['localhost', 'example.com', 'test.local'].includes(domain);
  }

  static async getIndicators(): Promise<ThreatIndicator[]> {
    return Array.from(this.indicators.values());
  }

  static async getIndicatorsByType(type: string): Promise<ThreatIndicator[]> {
    return Array.from(this.indicators.values()).filter(indicator => 
      indicator.type.toLowerCase() === type.toLowerCase()
    );
  }

  static async searchIndicators(query: string): Promise<ThreatIndicator[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.indicators.values()).filter(indicator =>
      indicator.value.toLowerCase().includes(searchTerm) ||
      indicator.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      (indicator.description || '').toLowerCase().includes(searchTerm)
    );
  }

  static async addIndicator(indicator: Omit<ThreatIndicator, 'id'>): Promise<ThreatIndicator> {
    const newIndicator: ThreatIndicator = {
      ...indicator,
      id: `ioc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    this.indicators.set(newIndicator.value, newIndicator);
    return newIndicator;
  }

  static async updateIndicator(id: string, updates: Partial<ThreatIndicator>): Promise<ThreatIndicator | null> {
    const indicator = Array.from(this.indicators.values()).find(i => i.id === id);
    if (!indicator) return null;

    const updatedIndicator = { ...indicator, ...updates };
    this.indicators.set(updatedIndicator.value, updatedIndicator);
    return updatedIndicator;
  }

  static async deleteIndicator(id: string): Promise<boolean> {
    const indicator = Array.from(this.indicators.values()).find(i => i.id === id);
    if (!indicator) return false;

    return this.indicators.delete(indicator.value);
  }

  static getStats() {
    const indicators = Array.from(this.indicators.values());
    const stats = {
      total: indicators.length,
      byType: {} as { [key: string]: number },
      bySeverity: {} as { [key: string]: number },
      bySource: {} as { [key: string]: number },
      recentlyUpdated: indicators.filter(i => 
        new Date(i.lastSeen).getTime() > Date.now() - 24 * 60 * 60 * 1000
      ).length
    };

    indicators.forEach(indicator => {
      stats.byType[indicator.type] = (stats.byType[indicator.type] || 0) + 1;
      stats.bySeverity[indicator.severity] = (stats.bySeverity[indicator.severity] || 0) + 1;
      stats.bySource[indicator.source] = (stats.bySource[indicator.source] || 0) + 1;
    });

    return stats;
  }
}