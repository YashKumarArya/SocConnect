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
    
  bulkUpdateIncidents: (incidentIds: string[], operation: string, data?: any) =>
    apiRequest('PATCH', '/api/incidents/bulk', { incidentIds, operation, data }),

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

  // Alert Normalization & Simulation
  getDatasetStats: () =>
    fetch('/api/alerts/dataset-stats').then(res => res.json()),
    
  simulateAlerts: (sourceType: string, count: number = 10) =>
    apiRequest('POST', `/api/alerts/simulate/${sourceType}`, { count }),
    
  simulateRealTimeAlerts: (sourceType: string, durationMinutes: number = 5) =>
    apiRequest('POST', `/api/alerts/simulate-realtime/${sourceType}`, { durationMinutes }),
    
  getSampleAlert: (sourceType: string) =>
    fetch(`/api/alerts/sample/${sourceType}`).then(res => res.json()),

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

  // Export functionality
  exportIncidents: (format: 'csv' | 'json', filters?: {
    startDate?: string;
    endDate?: string;
    severity?: string[];
    status?: string[];
  }) => {
    const params = new URLSearchParams({ format });
    if (filters?.startDate) params.append('start_date', filters.startDate);
    if (filters?.endDate) params.append('end_date', filters.endDate);
    if (filters?.severity?.length) params.append('severity', filters.severity.join(','));
    if (filters?.status?.length) params.append('status', filters.status.join(','));
    
    return fetch(`/api/export/incidents?${params.toString()}`);
  },

  exportAlerts: (format: 'csv' | 'json', filters?: {
    startDate?: string;
    endDate?: string;
    severity?: string[];
    sourceId?: string;
  }) => {
    const params = new URLSearchParams({ format });
    if (filters?.startDate) params.append('start_date', filters.startDate);
    if (filters?.endDate) params.append('end_date', filters.endDate);
    if (filters?.severity?.length) params.append('severity', filters.severity.join(','));
    if (filters?.sourceId) params.append('source_id', filters.sourceId);
    
    return fetch(`/api/export/alerts?${params.toString()}`);
  },

  exportAnalytics: (format: 'csv' | 'json', filters?: {
    startDate?: string;
    endDate?: string;
  }) => {
    const params = new URLSearchParams({ format });
    if (filters?.startDate) params.append('start_date', filters.startDate);
    if (filters?.endDate) params.append('end_date', filters.endDate);
    
    return fetch(`/api/export/analytics?${params.toString()}`);
  },

  exportActions: (format: 'csv' | 'json', filters?: {
    startDate?: string;
    endDate?: string;
  }) => {
    const params = new URLSearchParams({ format });
    if (filters?.startDate) params.append('start_date', filters.startDate);
    if (filters?.endDate) params.append('end_date', filters.endDate);
    
    return fetch(`/api/export/actions?${params.toString()}`);
  },
};
