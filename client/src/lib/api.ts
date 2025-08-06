import { apiRequest } from "./queryClient";

export interface DashboardStats {
  activeIncidents: number;
  alertsToday: number;
  avgResponseTime: string;
  modelAccuracy: number;
}

export interface AlertData {
  id: string;
  sourceId: string;
  payload: Record<string, any>;
  receivedAt: string;
  type?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  title?: string;
  description?: string;
}

export const api = {
  // Dashboard
  getDashboardStats: (): Promise<DashboardStats> =>
    fetch('/api/dashboard/stats').then(res => res.json()),

  // Sources
  getSources: () =>
    fetch('/api/sources').then(res => res.json()),
    
  createSource: (source: any) =>
    apiRequest('POST', '/api/sources', source),
    
  updateSource: (id: string, source: any) =>
    apiRequest('PUT', `/api/sources/${id}`, source),
    
  deleteSource: (id: string) =>
    apiRequest('DELETE', `/api/sources/${id}`),

  // Incidents
  getIncidents: () =>
    fetch('/api/incidents').then(res => res.json()),
    
  getIncident: (id: string) =>
    fetch(`/api/incidents/${id}`).then(res => res.json()),
    
  createIncident: (incident: any) =>
    apiRequest('POST', '/api/incidents', incident),
    
  updateIncident: (id: string, incident: any) =>
    apiRequest('PUT', `/api/incidents/${id}`, incident),

  // Actions
  getActions: () =>
    fetch('/api/actions').then(res => res.json()),
    
  getIncidentActions: (incidentId: string) =>
    fetch(`/api/incidents/${incidentId}/actions`).then(res => res.json()),
    
  createAction: (incidentId: string, action: any) =>
    apiRequest('POST', `/api/incidents/${incidentId}/actions`, action),

  // Alerts
  getAlerts: () =>
    fetch('/api/alerts').then(res => res.json()),
    
  createAlert: (alert: any) =>
    apiRequest('POST', '/api/alerts', alert),

  // Feedback
  getFeedback: () =>
    fetch('/api/feedback').then(res => res.json()),
    
  getIncidentFeedback: (incidentId: string) =>
    fetch(`/api/incidents/${incidentId}/feedback`).then(res => res.json()),
    
  createFeedback: (feedback: any) =>
    apiRequest('POST', '/api/feedback', feedback),

  // Metrics
  getMetrics: () =>
    fetch('/api/metrics').then(res => res.json()),
    
  createMetric: (metric: any) =>
    apiRequest('POST', '/api/metrics', metric),

  // Threat Intelligence
  getThreatIntel: () =>
    fetch('/api/threatintel').then(res => res.json()),
};
