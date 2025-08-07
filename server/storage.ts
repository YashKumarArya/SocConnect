import { type User, type InsertUser, type Source, type InsertSource, type RawAlert, type InsertRawAlert, type Incident, type InsertIncident, type Action, type InsertAction, type Feedback, type InsertFeedback, type ModelMetric, type InsertModelMetric, type NormalizedAlert, type FeatureVector } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Sources
  getSources(): Promise<Source[]>;
  getSource(id: string): Promise<Source | undefined>;
  createSource(source: InsertSource): Promise<Source>;
  updateSource(id: string, source: Partial<Source>): Promise<Source | undefined>;
  deleteSource(id: string): Promise<boolean>;

  // Raw Alerts
  getRawAlerts(): Promise<RawAlert[]>;
  getRawAlert(id: string): Promise<RawAlert | undefined>;
  createRawAlert(alert: InsertRawAlert): Promise<RawAlert>;

  // Normalized Alerts
  getNormalizedAlerts(): Promise<NormalizedAlert[]>;
  getNormalizedAlert(id: string): Promise<NormalizedAlert | undefined>;

  // Incidents
  getIncidents(): Promise<Incident[]>;
  getIncident(id: string): Promise<Incident | undefined>;
  createIncident(incident: InsertIncident): Promise<Incident>;
  updateIncident(id: string, incident: Partial<Incident>): Promise<Incident | undefined>;

  // Actions
  getActions(): Promise<Action[]>;
  getActionsByIncident(incidentId: string): Promise<Action[]>;
  createAction(action: InsertAction): Promise<Action>;

  // Feedback
  getFeedback(): Promise<Feedback[]>;
  getFeedbackByIncident(incidentId: string): Promise<Feedback[]>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;

  // Model Metrics
  getModelMetrics(): Promise<ModelMetric[]>;
  createModelMetric(metric: InsertModelMetric): Promise<ModelMetric>;

  // Dashboard Stats
  getDashboardStats(): Promise<{
    activeIncidents: number;
    alertsToday: number;
    avgResponseTime: string;
    modelAccuracy: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private sources: Map<string, Source>;
  private rawAlerts: Map<string, RawAlert>;
  private featureVectors: Map<string, FeatureVector>;
  private normalizedAlerts: Map<string, NormalizedAlert>;
  private incidents: Map<string, Incident>;
  private actions: Map<string, Action>;
  private feedbacks: Map<string, Feedback>;
  private modelMetrics: Map<string, ModelMetric>;

  constructor() {
    this.users = new Map();
    this.sources = new Map();
    this.rawAlerts = new Map();
    this.featureVectors = new Map();
    this.normalizedAlerts = new Map();
    this.incidents = new Map();
    this.actions = new Map();
    this.feedbacks = new Map();
    this.modelMetrics = new Map();

    // Initialize with some demo data
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Create demo users with different roles
    const users = [
      {
        username: "john.smith",
        email: "john.smith@company.com",
        role: "analyst" as const,
      },
      {
        username: "sarah.johnson",
        email: "sarah.johnson@company.com", 
        role: "admin" as const,
      },
      {
        username: "mike.wilson",
        email: "mike.wilson@company.com",
        role: "analyst" as const,
      }
    ];

    const userIds: string[] = [];
    users.forEach(userData => {
      const user: User = {
        id: randomUUID(),
        username: userData.username,
        email: userData.email,
        role: userData.role as 'analyst' | 'admin',
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 30), // Random date within last 30 days
      };
      this.users.set(user.id, user);
      userIds.push(user.id);
    });

    // Create comprehensive demo sources with realistic configurations
    const sources = [
      { 
        name: "Corporate Firewall - Perimeter", 
        type: "Firewall", 
        config: { 
          endpoint: "https://firewall.corp.local/api",
          enabled: true,
          polling_interval: 300,
          auth_token: "fw_token_abc123"
        } 
      },
      { 
        name: "Windows Defender ATP", 
        type: "EDR", 
        config: { 
          endpoint: "https://api.securitycenter.microsoft.com",
          enabled: true,
          tenant_id: "corp-tenant-123",
          polling_interval: 180
        } 
      },
      { 
        name: "Splunk Enterprise SIEM", 
        type: "SIEM", 
        config: { 
          endpoint: "https://splunk.corp.local:8089",
          enabled: true,
          index: "security_events",
          auth_token: "splunk_token_xyz789"
        } 
      },
      { 
        name: "CrowdStrike Falcon", 
        type: "EDR", 
        config: { 
          endpoint: "https://api.crowdstrike.com",
          enabled: true,
          client_id: "cs_client_456",
          polling_interval: 120
        } 
      },
      { 
        name: "Palo Alto Networks", 
        type: "Firewall", 
        config: { 
          endpoint: "https://panorama.corp.local/api",
          enabled: false,
          maintenance_mode: true
        } 
      },
      { 
        name: "Office 365 Security", 
        type: "Cloud Security", 
        config: { 
          endpoint: "https://graph.microsoft.com",
          enabled: true,
          tenant_id: "o365-tenant-789"
        } 
      }
    ];

    const sourceIds: string[] = [];
    sources.forEach(sourceData => {
      const source: Source = {
        id: randomUUID(),
        name: sourceData.name,
        type: sourceData.type,
        config: sourceData.config,
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 60), // Random date within last 60 days
      };
      this.sources.set(source.id, source);
      sourceIds.push(source.id);
    });

    // Create realistic raw alerts with varying severity and types
    const alertTemplates = [
      {
        severity: "critical",
        type: "malware_detection",
        description: "Ransomware activity detected on endpoint DESKTOP-ABC123",
        rawData: { 
          process: "suspicious_encrypt.exe", 
          user: "jdoe", 
          endpoint: "DESKTOP-ABC123",
          hash: "d41d8cd98f00b204e9800998ecf8427e"
        }
      },
      {
        severity: "high", 
        type: "network_intrusion",
        description: "Multiple failed login attempts from external IP",
        rawData: { 
          source_ip: "192.168.1.100", 
          target_service: "RDP", 
          attempts: 25,
          blocked: true
        }
      },
      {
        severity: "medium",
        type: "policy_violation", 
        description: "Unauthorized software installation detected",
        rawData: { 
          software: "BitTorrent Client", 
          user: "temp_contractor", 
          endpoint: "LAPTOP-XYZ789"
        }
      },
      {
        severity: "low",
        type: "anomaly_detection",
        description: "Unusual network traffic pattern observed",
        rawData: { 
          bytes_transferred: 1024000, 
          destination: "unknown_server.com",
          protocol: "HTTPS"
        }
      },
      {
        severity: "critical",
        type: "data_exfiltration",
        description: "Large data transfer to external storage detected",
        rawData: { 
          volume: "2.5GB", 
          destination: "dropbox.com", 
          user: "marketing_intern"
        }
      },
      {
        severity: "high",
        type: "privilege_escalation",
        description: "Admin privileges granted to standard user account",
        rawData: { 
          user: "contractor_bob", 
          granted_by: "admin_system", 
          privileges: ["local_admin", "domain_user"]
        }
      }
    ];

    const rawAlertIds: string[] = [];
    // Create 50 raw alerts with realistic timestamps
    for (let i = 0; i < 50; i++) {
      const template = alertTemplates[Math.floor(Math.random() * alertTemplates.length)];
      const sourceId = sourceIds[Math.floor(Math.random() * sourceIds.length)];
      
      const rawAlert: RawAlert = {
        id: randomUUID(),
        sourceId,
        severity: template.severity,
        type: template.type,
        description: template.description,
        rawData: { ...template.rawData, alert_id: `ALT-${Date.now()}-${i}` },
        receivedAt: new Date(Date.now() - Math.random() * 86400000 * 7), // Random within last 7 days
      };
      this.rawAlerts.set(rawAlert.id, rawAlert);
      rawAlertIds.push(rawAlert.id);
    }

    // Create feature vectors for ML analysis
    const featureVectorIds: string[] = [];
    rawAlertIds.slice(0, 30).forEach(alertId => {
      const featureVector: FeatureVector = {
        id: randomUUID(),
        rawAlertId: alertId,
        features: {
          severity_score: Math.random() * 10,
          frequency_score: Math.random() * 5,
          source_reputation: Math.random() * 10,
          behavioral_anomaly: Math.random() * 8,
          network_risk: Math.random() * 6
        },
        computedAt: new Date(Date.now() - Math.random() * 86400000 * 5),
      };
      this.featureVectors.set(featureVector.id, featureVector);
      featureVectorIds.push(featureVector.id);
    });

    // Create normalized alerts based on feature vectors
    const normalizedAlertIds: string[] = [];
    featureVectorIds.forEach(vectorId => {
      const confidence = Math.random();
      const decision = confidence > 0.7 ? "AUTO" : "MANUAL";
      
      const normalizedAlert: NormalizedAlert = {
        id: randomUUID(),
        featureVectorId: vectorId,
        decision: decision as "AUTO" | "MANUAL", 
        confidence,
        status: Math.random() > 0.3 ? "reviewed" : "pending",
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 4),
        closedAt: Math.random() > 0.4 ? new Date(Date.now() - Math.random() * 86400000 * 2) : null,
      };
      this.normalizedAlerts.set(normalizedAlert.id, normalizedAlert);
      normalizedAlertIds.push(normalizedAlert.id);
    });

    // Create realistic security incidents
    const incidentTemplates = [
      {
        title: "Ransomware Attack - Finance Department",
        description: "Multiple systems in finance showing signs of file encryption. Immediate containment required.",
        severity: "critical",
        status: "investigating"
      },
      {
        title: "Suspicious Network Activity",
        description: "Unusual outbound connections detected from development servers.",
        severity: "high", 
        status: "monitoring"
      },
      {
        title: "Failed Login Attempts",
        description: "Coordinated brute force attack against VPN endpoints.",
        severity: "medium",
        status: "resolved"
      },
      {
        title: "Data Loss Prevention Alert",
        description: "Sensitive customer data accessed outside normal hours.",
        severity: "high",
        status: "investigating"
      },
      {
        title: "Malware Detection",
        description: "Trojan detected on HR workstation, contained and isolated.",
        severity: "medium",
        status: "resolved"
      }
    ];

    const incidentIds: string[] = [];
    incidentTemplates.forEach((template, index) => {
      const incident: Incident = {
        id: randomUUID(),
        title: template.title,
        description: template.description,
        severity: template.severity as "low" | "medium" | "high" | "critical",
        status: template.status as "open" | "investigating" | "monitoring" | "resolved",
        assignedTo: userIds[Math.floor(Math.random() * userIds.length)],
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 14), // Random within last 14 days
        closedAt: template.status === "resolved" ? 
          new Date(Date.now() - Math.random() * 86400000 * 7) : null,
      };
      this.incidents.set(incident.id, incident);
      incidentIds.push(incident.id);
    });

    // Create response actions for incidents
    const actionTemplates = [
      { type: "isolate_endpoint", description: "Isolated affected workstation from network" },
      { type: "block_ip", description: "Added malicious IP to firewall blocklist" },
      { type: "reset_credentials", description: "Forced password reset for affected accounts" },
      { type: "update_signatures", description: "Updated antivirus signatures across all endpoints" },
      { type: "notify_users", description: "Sent security awareness notification to all staff" },
      { type: "escalate", description: "Escalated to senior security team" },
      { type: "document", description: "Documented findings in incident report" }
    ];

    incidentIds.forEach(incidentId => {
      const numActions = Math.floor(Math.random() * 4) + 1; // 1-4 actions per incident
      for (let i = 0; i < numActions; i++) {
        const template = actionTemplates[Math.floor(Math.random() * actionTemplates.length)];
        const action: Action = {
          id: randomUUID(),
          incidentId,
          actionType: template.type,
          payload: { description: template.description, automated: Math.random() > 0.6 },
          performedBy: userIds[Math.floor(Math.random() * userIds.length)],
          performedAt: new Date(Date.now() - Math.random() * 86400000 * 10),
        };
        this.actions.set(action.id, action);
      }
    });

    // Create analyst feedback for model improvement
    const feedbackTemplates = [
      "Alert was correctly identified as malicious",
      "False positive - legitimate admin activity", 
      "Severity should be upgraded to critical",
      "Missing context about user behavior patterns",
      "Good detection but needs faster response time",
      "Alert correlation could be improved"
    ];

    normalizedAlertIds.slice(0, 20).forEach(alertId => {
      const feedback: Feedback = {
        id: randomUUID(),
        alertId: alertId,
        incidentId: null,
        userId: userIds[Math.floor(Math.random() * userIds.length)],
        feedback: feedbackTemplates[Math.floor(Math.random() * feedbackTemplates.length)],
        rating: Math.floor(Math.random() * 5) + 1, // 1-5 rating
        submittedAt: new Date(Date.now() - Math.random() * 86400000 * 8),
      };
      this.feedbacks.set(feedback.id, feedback);
    });

    // Create model performance metrics
    const metricDates = [];
    for (let i = 30; i >= 0; i--) {
      metricDates.push(new Date(Date.now() - i * 86400000)); // Last 30 days
    }

    metricDates.forEach(date => {
      const metrics: ModelMetric = {
        id: randomUUID(),
        accuracy: 0.85 + Math.random() * 0.1, // 85-95% accuracy
        precision: 0.80 + Math.random() * 0.15, // 80-95% precision  
        recall: 0.75 + Math.random() * 0.2, // 75-95% recall
        runTs: date,
        alertsProcessed: Math.floor(Math.random() * 1000) + 100,
        autoActions: Math.floor(Math.random() * 50),
        manualReviews: Math.floor(Math.random() * 20),
        latencyMs: Math.floor(Math.random() * 500) + 100,
      };
      this.modelMetrics.set(metrics.id, metrics);
    });

    console.log(`Demo data initialized: ${users.length} users, ${sources.length} sources, ${rawAlertIds.length} alerts, ${incidentIds.length} incidents`);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date(),
      role: insertUser.role as 'analyst' | 'admin'
    };
    this.users.set(id, user);
    return user;
  }

  async getSources(): Promise<Source[]> {
    return Array.from(this.sources.values());
  }

  async getSource(id: string): Promise<Source | undefined> {
    return this.sources.get(id);
  }

  async createSource(insertSource: InsertSource): Promise<Source> {
    const id = randomUUID();
    const source: Source = { ...insertSource, id, createdAt: new Date(), config: insertSource.config || {} };
    this.sources.set(id, source);
    return source;
  }

  async updateSource(id: string, updateData: Partial<Source>): Promise<Source | undefined> {
    const source = this.sources.get(id);
    if (!source) return undefined;
    
    const updatedSource = { ...source, ...updateData };
    this.sources.set(id, updatedSource);
    return updatedSource;
  }

  async deleteSource(id: string): Promise<boolean> {
    return this.sources.delete(id);
  }

  async getRawAlerts(): Promise<RawAlert[]> {
    return Array.from(this.rawAlerts.values());
  }

  async getRawAlert(id: string): Promise<RawAlert | undefined> {
    return this.rawAlerts.get(id);
  }

  async createRawAlert(insertAlert: InsertRawAlert): Promise<RawAlert> {
    const id = randomUUID();
    const alert: RawAlert = { 
      ...insertAlert, 
      id, 
      receivedAt: new Date(),
      type: insertAlert.type || null,
      severity: insertAlert.severity || null,
      description: insertAlert.description || null
    };
    this.rawAlerts.set(id, alert);
    return alert;
  }

  async getNormalizedAlerts(): Promise<NormalizedAlert[]> {
    return Array.from(this.normalizedAlerts.values());
  }

  async getNormalizedAlert(id: string): Promise<NormalizedAlert | undefined> {
    return this.normalizedAlerts.get(id);
  }

  async getIncidents(): Promise<Incident[]> {
    return Array.from(this.incidents.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getIncident(id: string): Promise<Incident | undefined> {
    return this.incidents.get(id);
  }

  async createIncident(insertIncident: InsertIncident): Promise<Incident> {
    const id = randomUUID();
    const incident: Incident = { 
      ...insertIncident, 
      id, 
      createdAt: new Date(), 
      closedAt: null,
      status: (insertIncident.status as 'open' | 'investigating' | 'monitoring' | 'resolved') || 'open',
      severity: insertIncident.severity as 'low' | 'medium' | 'high' | 'critical',
      description: insertIncident.description || null,
      assignedTo: insertIncident.assignedTo || null
    };
    this.incidents.set(id, incident);
    return incident;
  }

  async updateIncident(id: string, updateData: Partial<Incident>): Promise<Incident | undefined> {
    const incident = this.incidents.get(id);
    if (!incident) return undefined;
    
    const updatedIncident = { ...incident, ...updateData };
    this.incidents.set(id, updatedIncident);
    return updatedIncident;
  }

  async getActions(): Promise<Action[]> {
    return Array.from(this.actions.values());
  }

  async getActionsByIncident(incidentId: string): Promise<Action[]> {
    return Array.from(this.actions.values())
      .filter(action => action.incidentId === incidentId);
  }

  async createAction(insertAction: InsertAction): Promise<Action> {
    const id = randomUUID();
    const action: Action = { 
      ...insertAction, 
      id, 
      performedAt: new Date(),
      payload: insertAction.payload || {},
      performedBy: insertAction.performedBy || null
    };
    this.actions.set(id, action);
    return action;
  }

  async getFeedback(): Promise<Feedback[]> {
    return Array.from(this.feedbacks.values())
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }

  async getFeedbackByIncident(incidentId: string): Promise<Feedback[]> {
    return Array.from(this.feedbacks.values())
      .filter(feedback => feedback.incidentId === incidentId);
  }

  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const id = randomUUID();
    const feedback: Feedback = { 
      ...insertFeedback, 
      id, 
      submittedAt: new Date(),
      alertId: insertFeedback.alertId || null,
      incidentId: insertFeedback.incidentId || null,
      rating: insertFeedback.rating || null
    };
    this.feedbacks.set(id, feedback);
    return feedback;
  }

  async getModelMetrics(): Promise<ModelMetric[]> {
    return Array.from(this.modelMetrics.values())
      .sort((a, b) => new Date(b.runTs).getTime() - new Date(a.runTs).getTime());
  }

  async createModelMetric(insertMetric: InsertModelMetric): Promise<ModelMetric> {
    const id = randomUUID();
    const metric: ModelMetric = { ...insertMetric, id };
    this.modelMetrics.set(id, metric);
    return metric;
  }

  async getDashboardStats(): Promise<{
    activeIncidents: number;
    alertsToday: number;
    avgResponseTime: string;
    modelAccuracy: number;
  }> {
    const activeIncidents = Array.from(this.incidents.values())
      .filter(incident => incident.status === 'open').length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const alertsToday = Array.from(this.rawAlerts.values())
      .filter(alert => new Date(alert.receivedAt) >= today).length;

    const latestMetrics = Array.from(this.modelMetrics.values())
      .sort((a, b) => new Date(b.runTs).getTime() - new Date(a.runTs).getTime())[0];

    return {
      activeIncidents,
      alertsToday,
      avgResponseTime: "4.2m",
      modelAccuracy: latestMetrics?.precision * 100 || 94.7,
    };
  }
}

export const storage = new MemStorage();
