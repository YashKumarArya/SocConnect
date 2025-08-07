import { storage } from "./storage";
import { AnalyticsService } from "./analyticsService";
import type { Incident, RawAlert, Action, Feedback } from "@shared/schema";

export interface ExportOptions {
  format: 'csv' | 'json';
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: {
    severity?: string[];
    status?: string[];
    sourceId?: string;
  };
}

export class ExportService {
  static async exportIncidents(options: ExportOptions): Promise<string> {
    const incidents = await storage.getIncidents();
    const actions = await storage.getActions();
    
    // Apply filters and date range
    let filteredIncidents = incidents;
    
    if (options.dateRange) {
      filteredIncidents = incidents.filter(incident => {
        const createdAt = new Date(incident.createdAt);
        return createdAt >= options.dateRange!.start && createdAt <= options.dateRange!.end;
      });
    }
    
    if (options.filters?.severity?.length) {
      filteredIncidents = filteredIncidents.filter(incident =>
        options.filters!.severity!.includes(incident.severity)
      );
    }
    
    if (options.filters?.status?.length) {
      filteredIncidents = filteredIncidents.filter(incident =>
        options.filters!.status!.includes(incident.status)
      );
    }

    // Enrich incidents with action counts and response times
    const enrichedData = filteredIncidents.map(incident => {
      const incidentActions = actions.filter(action => action.incidentId === incident.id);
      const responseTime = incident.closedAt 
        ? Math.round((new Date(incident.closedAt).getTime() - new Date(incident.createdAt).getTime()) / (1000 * 60))
        : null;
      
      return {
        id: incident.id,
        title: incident.title,
        description: incident.description || 'No description available',
        severity: incident.severity,
        status: incident.status,
        createdAt: new Date(incident.createdAt).toISOString(),
        closedAt: incident.closedAt ? new Date(incident.closedAt).toISOString() : null,
        responseTimeMinutes: responseTime,
        actionCount: incidentActions.length,
        assignedTo: incident.assignedTo || 'Unassigned',
        escalated: incidentActions.some(action => action.actionType === 'ESCALATE') ? 'Yes' : 'No'
      };
    });

    if (options.format === 'csv') {
      return this.convertToCSV(enrichedData);
    } else {
      return JSON.stringify({
        exportedAt: new Date().toISOString(),
        totalCount: enrichedData.length,
        filters: options.filters,
        dateRange: options.dateRange,
        data: enrichedData
      }, null, 2);
    }
  }

  static async exportAlerts(options: ExportOptions): Promise<string> {
    const alerts = await storage.getRawAlerts();
    const sources = await storage.getSources();
    
    // Apply filters and date range
    let filteredAlerts = alerts;
    
    if (options.dateRange) {
      filteredAlerts = alerts.filter(alert => {
        const receivedAt = new Date(alert.receivedAt);
        return receivedAt >= options.dateRange!.start && receivedAt <= options.dateRange!.end;
      });
    }
    
    if (options.filters?.severity?.length) {
      filteredAlerts = filteredAlerts.filter(alert =>
        alert.severity && options.filters!.severity!.includes(alert.severity)
      );
    }
    
    if (options.filters?.sourceId) {
      filteredAlerts = filteredAlerts.filter(alert =>
        alert.sourceId === options.filters!.sourceId
      );
    }

    // Enrich alerts with source information
    const enrichedData = filteredAlerts.map(alert => {
      const source = sources.find(s => s.id === alert.sourceId);
      
      return {
        id: alert.id,
        sourceId: alert.sourceId,
        sourceName: source?.name || 'Unknown',
        sourceType: source?.type || 'Unknown',
        severity: alert.severity || 'Unknown',
        type: alert.type || 'Security Alert',
        description: alert.description || 'Automated security alert',
        receivedAt: new Date(alert.receivedAt).toISOString(),
        dataSize: JSON.stringify(alert.rawData).length
      };
    });

    if (options.format === 'csv') {
      return this.convertToCSV(enrichedData);
    } else {
      return JSON.stringify({
        exportedAt: new Date().toISOString(),
        totalCount: enrichedData.length,
        filters: options.filters,
        dateRange: options.dateRange,
        data: enrichedData
      }, null, 2);
    }
  }

  static async exportAnalytics(options: ExportOptions): Promise<string> {
    const analytics = await AnalyticsService.calculateRealTimeMetrics();
    const incidents = await storage.getIncidents();
    const alerts = await storage.getRawAlerts();
    
    // Calculate additional statistics for export
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recentIncidents = incidents.filter(inc => new Date(inc.createdAt) >= last30Days);
    const weeklyIncidents = incidents.filter(inc => new Date(inc.createdAt) >= last7Days);
    const recentAlerts = alerts.filter(alert => new Date(alert.receivedAt) >= last30Days);
    
    const reportData = {
      generatedAt: new Date().toISOString(),
      reportPeriod: options.dateRange || {
        start: last30Days.toISOString(),
        end: now.toISOString()
      },
      summary: {
        totalIncidents: incidents.length,
        incidentsLast30Days: recentIncidents.length,
        incidentsLast7Days: weeklyIncidents.length,
        totalAlerts: alerts.length,
        alertsLast30Days: recentAlerts.length,
        avgResponseTimeMinutes: analytics.avgResponseTimeMinutes.toFixed(2),
        automationRate: (analytics.automationRate * 100).toFixed(1) + '%',
        falsePositiveRate: (analytics.falsePositiveRate * 100).toFixed(1) + '%'
      },
      performanceMetrics: {
        precision: (analytics.precision * 100).toFixed(1) + '%',
        recall: (analytics.recall * 100).toFixed(1) + '%',
        f1Score: (analytics.f1Score * 100).toFixed(1) + '%',
        accuracy: (analytics.accuracy * 100).toFixed(1) + '%',
        threatDetectionRate: (analytics.threatDetectionRate * 100).toFixed(1) + '%'
      },
      volumeMetrics: {
        alertsProcessedToday: analytics.alertsProcessedToday,
        incidentsCreatedToday: analytics.incidentsCreatedToday,
        incidentsResolvedToday: analytics.incidentsResolvedToday,
        manualReviewsToday: analytics.manualReviewsToday
      },
      severityDistribution: analytics.severityDistribution,
      weeklyTrends: analytics.weeklyTrends,
      sourceMetrics: analytics.sourceMetrics
    };

    if (options.format === 'csv') {
      // For CSV, flatten the complex structure
      const flatData = [
        // Summary metrics
        { metric: 'Total Incidents', value: reportData.summary.totalIncidents, category: 'Summary' },
        { metric: 'Incidents (30 days)', value: reportData.summary.incidentsLast30Days, category: 'Summary' },
        { metric: 'Incidents (7 days)', value: reportData.summary.incidentsLast7Days, category: 'Summary' },
        { metric: 'Total Alerts', value: reportData.summary.totalAlerts, category: 'Summary' },
        { metric: 'Alerts (30 days)', value: reportData.summary.alertsLast30Days, category: 'Summary' },
        { metric: 'Avg Response Time (min)', value: reportData.summary.avgResponseTimeMinutes, category: 'Summary' },
        { metric: 'Automation Rate', value: reportData.summary.automationRate, category: 'Summary' },
        { metric: 'False Positive Rate', value: reportData.summary.falsePositiveRate, category: 'Summary' },
        
        // Performance metrics
        { metric: 'Precision', value: reportData.performanceMetrics.precision, category: 'Performance' },
        { metric: 'Recall', value: reportData.performanceMetrics.recall, category: 'Performance' },
        { metric: 'F1 Score', value: reportData.performanceMetrics.f1Score, category: 'Performance' },
        { metric: 'Accuracy', value: reportData.performanceMetrics.accuracy, category: 'Performance' },
        { metric: 'Threat Detection Rate', value: reportData.performanceMetrics.threatDetectionRate, category: 'Performance' },
        
        // Volume metrics
        { metric: 'Alerts Processed Today', value: reportData.volumeMetrics.alertsProcessedToday, category: 'Volume' },
        { metric: 'Incidents Created Today', value: reportData.volumeMetrics.incidentsCreatedToday, category: 'Volume' },
        { metric: 'Incidents Resolved Today', value: reportData.volumeMetrics.incidentsResolvedToday, category: 'Volume' },
        { metric: 'Manual Reviews Today', value: reportData.volumeMetrics.manualReviewsToday, category: 'Volume' },
        
        // Severity distribution
        { metric: 'Critical Incidents', value: reportData.severityDistribution.critical, category: 'Severity' },
        { metric: 'High Incidents', value: reportData.severityDistribution.high, category: 'Severity' },
        { metric: 'Medium Incidents', value: reportData.severityDistribution.medium, category: 'Severity' },
        { metric: 'Low Incidents', value: reportData.severityDistribution.low, category: 'Severity' }
      ];
      
      return this.convertToCSV(flatData);
    } else {
      return JSON.stringify(reportData, null, 2);
    }
  }

  static async exportActions(options: ExportOptions): Promise<string> {
    const actions = await storage.getActions();
    const incidents = await storage.getIncidents();
    
    // Apply date range filter
    let filteredActions = actions;
    
    if (options.dateRange) {
      filteredActions = actions.filter(action => {
        const performedAt = new Date(action.performedAt);
        return performedAt >= options.dateRange!.start && performedAt <= options.dateRange!.end;
      });
    }

    // Enrich actions with incident information
    const enrichedData = filteredActions.map(action => {
      const incident = incidents.find(inc => inc.id === action.incidentId);
      
      return {
        id: action.id,
        incidentId: action.incidentId,
        incidentSeverity: incident?.severity || 'Unknown',
        incidentStatus: incident?.status || 'Unknown',
        actionType: action.actionType,
        performedBy: action.performedBy || 'System',
        performedAt: new Date(action.performedAt).toISOString(),
        payload: JSON.stringify(action.payload),
        automated: action.performedBy === 'system' ? 'Yes' : 'No',
        bulkOperation: (action.payload as any)?.bulkOperation ? 'Yes' : 'No'
      };
    });

    if (options.format === 'csv') {
      return this.convertToCSV(enrichedData);
    } else {
      return JSON.stringify({
        exportedAt: new Date().toISOString(),
        totalCount: enrichedData.length,
        dateRange: options.dateRange,
        data: enrichedData
      }, null, 2);
    }
  }

  private static convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          // Handle values that contain commas, quotes, or newlines
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value !== null && value !== undefined ? value : '';
        }).join(',')
      )
    ].join('\n');
    
    return csvContent;
  }

  static getExportFilename(type: string, format: string): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    return `soc-${type}-export-${timestamp}.${format}`;
  }
}