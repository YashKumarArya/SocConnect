/**
 * ML Model Integration Service
 * Handles feature preparation and model prediction integration
 */
export class MLModelService {
  /**
   * Prepare OCSF event data for ML model consumption
   */
  static prepareOCSFForML(ocsfEvent: any) {
    const features = {
      // Temporal features
      hour_of_day: new Date(ocsfEvent.time).getHours(),
      day_of_week: new Date(ocsfEvent.time).getDay(),
      
      // Event classification features
      class_uid: ocsfEvent.class_uid,
      category_uid: ocsfEvent.category_uid,
      activity_id: ocsfEvent.activity_id,
      severity_id: ocsfEvent.severity_id,
      
      // Network features (if available)
      has_src_ip: !!ocsfEvent.src_endpoint?.ip,
      has_dst_ip: !!ocsfEvent.dst_endpoint?.ip,
      is_external_src: ocsfEvent.src_endpoint?.ip ? 
        !this.isInternalIP(ocsfEvent.src_endpoint.ip) : false,
      is_external_dst: ocsfEvent.dst_endpoint?.ip ? 
        !this.isInternalIP(ocsfEvent.dst_endpoint.ip) : false,
      
      // Content features
      message_length: ocsfEvent.message?.length || 0,
      has_observables: !!ocsfEvent.observables,
      observable_count: Array.isArray(ocsfEvent.observables) ? 
        ocsfEvent.observables.length : 0,
      
      // Risk indicators
      risk_score: this.calculateInitialRiskScore(ocsfEvent),
      confidence: 0.85 // Default confidence
    };

    return {
      features,
      modelVersion: '1.2.0',
      featureCount: Object.keys(features).length,
      preparedAt: new Date().toISOString()
    };
  }

  /**
   * Generate ML prediction verdict for security event
   */
  static async generatePrediction(features: any) {
    // Simulate ML model prediction based on features
    const riskScore = features.risk_score;
    let prediction = 'benign';
    let confidence = 0.75;
    
    if (riskScore >= 80) {
      prediction = 'malicious';
      confidence = 0.92;
    } else if (riskScore >= 50) {
      prediction = 'suspicious';
      confidence = 0.78;
    }

    return {
      prediction,
      confidence,
      riskScore,
      modelVersion: '1.2.0',
      predictedAt: new Date().toISOString(),
      features: {
        primary_indicators: this.getPrimaryIndicators(features),
        risk_factors: this.getRiskFactors(features)
      }
    };
  }

  // Private helper methods
  private static isInternalIP(ip: string): boolean {
    return ip.startsWith('10.') || 
           ip.startsWith('192.168.') || 
           ip.startsWith('172.16.') ||
           ip === '127.0.0.1';
  }

  private static calculateInitialRiskScore(ocsfEvent: any): number {
    let score = 20; // Base score

    // Severity-based scoring
    if (ocsfEvent.severity_id >= 4) score += 30; // High/Critical
    else if (ocsfEvent.severity_id >= 3) score += 20; // Medium
    else score += 10; // Low/Info

    // Activity-based scoring
    if (ocsfEvent.activity_name?.toLowerCase().includes('denied') ||
        ocsfEvent.activity_name?.toLowerCase().includes('blocked')) {
      score += 15;
    }

    // External IP involvement
    if (ocsfEvent.src_endpoint?.ip && !this.isInternalIP(ocsfEvent.src_endpoint.ip)) {
      score += 20;
    }

    return Math.min(score, 100);
  }

  private static getPrimaryIndicators(features: any): string[] {
    const indicators = [];
    
    if (features.is_external_src) indicators.push('external_source');
    if (features.severity_id >= 4) indicators.push('high_severity');
    if (features.has_observables) indicators.push('ioc_present');
    if (features.hour_of_day < 6 || features.hour_of_day > 22) indicators.push('off_hours');
    
    return indicators;
  }

  private static getRiskFactors(features: any): string[] {
    const factors = [];
    
    if (features.risk_score > 75) factors.push('high_risk_score');
    if (features.is_external_src && features.is_external_dst) factors.push('external_communication');
    if (features.observable_count > 5) factors.push('multiple_iocs');
    
    return factors;
  }
}