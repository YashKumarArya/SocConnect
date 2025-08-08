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

export interface DatasetStats {
  stats: {
    total: number;
    crowdstrike: number;
    sentinelone: number;
    email: number;
    firewall: number;
  };
  sources: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

export interface Incident {
  id: string;
  title: string;
  description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'monitoring' | 'resolved';
  assignedTo?: string;
  createdAt: string;
  closedAt?: string;
  confidence?: number;
}

export const api = {
  // Dashboard
  getDashboardStats: (): Promise<DashboardStats> =>
    fetch('/api/dashboard/stats', { credentials: 'include' }).then(res => res.json()),

  // Dataset Stats
  getDatasetStats: (): Promise<DatasetStats> =>
    fetch('/api/alerts/dataset-stats', { credentials: 'include' }).then(res => res.json()),

  // Sources
  getSources: () =>
    fetch('/api/sources', { credentials: 'include' }).then(res => res.json()),
    
  createSource: (source: any) =>
    apiRequest('POST', '/api/sources', source),
    
  updateSource: (id: string, source: any) =>
    apiRequest('PUT', `/api/sources/${id}`, source),
    
  deleteSource: (id: string) =>
    apiRequest('DELETE', `/api/sources/${id}`),

  // Incidents
  getIncidents: (): Promise<Incident[]> =>
    fetch('/api/incidents', { credentials: 'include' }).then(res => res.json()),
    
  getIncident: (id: string) =>
    fetch(`/api/incidents/${id}`, { credentials: 'include' }).then(res => res.json()),
    
  createIncident: (incident: any) =>
    apiRequest('POST', '/api/incidents', incident),
    
  updateIncident: (id: string, incident: any) =>
    apiRequest('PUT', `/api/incidents/${id}`, incident),
    
  bulkUpdateIncidents: (incidentIds: string[], operation: string, data?: any) =>
    apiRequest('PATCH', '/api/incidents/bulk', { incidentIds, operation, data }),

  // Actions
  getActions: () =>
    fetch('/api/actions', { credentials: 'include' }).then(res => res.json()),
    
  getIncidentActions: (incidentId: string) =>
    fetch(`/api/incidents/${incidentId}/actions`, { credentials: 'include' }).then(res => res.json()),
    
  createAction: (incidentId: string, action: any) =>
    apiRequest('POST', `/api/incidents/${incidentId}/actions`, action),

  // Alerts
  getAlerts: () =>
    fetch('/api/alerts', { credentials: 'include' }).then(res => res.json()),
    
  createAlert: (alert: any) =>
    apiRequest('POST', '/api/alerts', alert),

  // Alert Normalization & Simulation
  simulateAlerts: (sourceType: string, count: number = 10) =>
    apiRequest('POST', `/api/alerts/simulate/${sourceType}`, { count }),
    
  simulateRealTimeAlerts: (sourceType: string, durationMinutes: number = 5) =>
    apiRequest('POST', `/api/alerts/simulate-realtime/${sourceType}`, { durationMinutes }),
    
  getSampleAlert: (sourceType: string) =>
    fetch(`/api/alerts/sample/${sourceType}`, { credentials: 'include' }).then(res => res.json()),

  // Feedback
  getFeedback: () =>
    fetch('/api/feedback', { credentials: 'include' }).then(res => res.json()),
    
  getIncidentFeedback: (incidentId: string) =>
    fetch(`/api/incidents/${incidentId}/feedback`, { credentials: 'include' }).then(res => res.json()),
    
  createFeedback: (feedback: any) =>
    apiRequest('POST', '/api/feedback', feedback),

  // Metrics
  getMetrics: () =>
    fetch('/api/metrics', { credentials: 'include' }).then(res => res.json()),
    
  createMetric: (metric: any) =>
    apiRequest('POST', '/api/metrics', metric),

  // Threat Intelligence
  getThreatIntel: () =>
    fetch('/api/threatintel', { credentials: 'include' }).then(res => res.json()),

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
    
    return fetch(`/api/export/incidents?${params.toString()}`, { credentials: 'include' });
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
    
    return fetch(`/api/export/alerts?${params.toString()}`, { credentials: 'include' });
  },

  exportAnalytics: (format: 'csv' | 'json', filters?: {
    startDate?: string;
    endDate?: string;
  }) => {
    const params = new URLSearchParams({ format });
    if (filters?.startDate) params.append('start_date', filters.startDate);
    if (filters?.endDate) params.append('end_date', filters.endDate);
    
    return fetch(`/api/export/analytics?${params.toString()}`, { credentials: 'include' });
  },

  exportActions: (format: 'csv' | 'json', filters?: {
    startDate?: string;
    endDate?: string;
  }) => {
    const params = new URLSearchParams({ format });
    if (filters?.startDate) params.append('start_date', filters.startDate);
    if (filters?.endDate) params.append('end_date', filters.endDate);
    
    return fetch(`/api/export/actions?${params.toString()}`, { credentials: 'include' });
  },

  // Authentication
  login: (credentials: { email: string; password: string }) =>
    apiRequest('POST', '/api/auth/login', credentials).then(res => res.json()),
    
  register: (userData: { email: string; password: string; confirmPassword: string; firstName?: string; lastName?: string }) =>
    apiRequest('POST', '/api/auth/register', userData),
    
  logout: () =>
    apiRequest('POST', '/api/auth/logout'),
    
  getCurrentUser: () =>
    fetch('/api/auth/user', { credentials: 'include' }).then(res => {
      if (!res.ok) return null;
      return res.json();
    }),
};