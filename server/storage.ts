import { type User, type InsertUser, type Source, type InsertSource, type RawAlert, type InsertRawAlert, type Incident, type InsertIncident, type Action, type InsertAction, type Feedback, type InsertFeedback, type ModelMetric, type InsertModelMetric, type NormalizedAlert } from "@shared/schema";
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
  private normalizedAlerts: Map<string, NormalizedAlert>;
  private incidents: Map<string, Incident>;
  private actions: Map<string, Action>;
  private feedbacks: Map<string, Feedback>;
  private modelMetrics: Map<string, ModelMetric>;

  constructor() {
    this.users = new Map();
    this.sources = new Map();
    this.rawAlerts = new Map();
    this.normalizedAlerts = new Map();
    this.incidents = new Map();
    this.actions = new Map();
    this.feedbacks = new Map();
    this.modelMetrics = new Map();

    // Initialize with some demo data
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Create demo user
    const demoUser: User = {
      id: randomUUID(),
      username: "john.smith",
      email: "john.smith@company.com",
      role: "analyst",
      createdAt: new Date(),
    };
    this.users.set(demoUser.id, demoUser);

    // Create demo sources
    const windowsSource: Source = {
      id: randomUUID(),
      name: "Windows Security Logs",
      type: "SIEM",
      config: { endpoint: "https://windows-logs.example.com" },
      createdAt: new Date(),
    };
    
    const firewallSource: Source = {
      id: randomUUID(),
      name: "Network Firewall",
      type: "Firewall",
      config: { endpoint: "https://firewall.example.com" },
      createdAt: new Date(),
    };

    const endpointSource: Source = {
      id: randomUUID(),
      name: "Endpoint Protection",
      type: "EDR",
      config: { endpoint: "https://edr.example.com" },
      createdAt: new Date(),
    };

    this.sources.set(windowsSource.id, windowsSource);
    this.sources.set(firewallSource.id, firewallSource);
    this.sources.set(endpointSource.id, endpointSource);
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
    const user: User = { ...insertUser, id, createdAt: new Date() };
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
    const source: Source = { ...insertSource, id, createdAt: new Date() };
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
    const alert: RawAlert = { ...insertAlert, id, receivedAt: new Date() };
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
    const incident: Incident = { ...insertIncident, id, createdAt: new Date(), closedAt: null };
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
    const action: Action = { ...insertAction, id, performedAt: new Date() };
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
    const feedback: Feedback = { ...insertFeedback, id, submittedAt: new Date() };
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
