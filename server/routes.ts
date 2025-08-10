import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { AlertProcessor } from "./alertProcessor";
import { AlertNormalizer } from "./normalization";
import { ThreatIntelligenceService } from "./threatIntelligence";
import { AnalyticsService } from "./analyticsService";
import { ExportService } from "./exportService";
import { isAuthenticated } from "./auth";
import session from "express-session";
import { AuthService } from "./auth";
import { registerUserSchema, loginUserSchema } from "@shared/schema";
import { insertSourceSchema, insertRawAlertSchema, insertIncidentSchema, insertActionSchema, insertFeedbackSchema, insertModelMetricSchema } from "@shared/schema";
import { ZodError } from "zod";
import { kafkaService, SecurityEventIngestion } from "./kafka";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Setup session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'development-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    name: 'soc.sid', // Custom session name
    rolling: true, // Reset expiry on activity
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours (shorter for development)
      sameSite: 'lax' // Allow cross-origin requests
    },
  }));

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    
    // Register client with Kafka service for real-time event streaming
    kafkaService.addClient(ws);
    
    ws.on('close', () => {
      clients.delete(ws);
      kafkaService.removeClient(ws);
    });

    // Send welcome message
    ws.send(JSON.stringify({ type: 'connected', message: 'WebSocket connected' }));
  });

  // Broadcast function for real-time updates
  const broadcast = (data: any) => {
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const validatedData = registerUserSchema.parse(req.body);
      const user = await AuthService.registerUser(validatedData);
      
      // Log user in automatically after registration
      req.session.userId = user.id;
      
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Invalid registration data', details: error.errors });
      }
      res.status(400).json({ error: error instanceof Error ? error.message : 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const validatedData = loginUserSchema.parse(req.body);
      const user = await AuthService.loginUser(validatedData.email, validatedData.password);
      
      // Store user session
      req.session.userId = user.id;
      console.log('🔑 Setting session userId:', user.id, 'Session ID:', req.sessionID);
      
      // Save session explicitly
      req.session.save((err) => {
        if (err) {
          console.error('❌ Session save error:', err);
          return res.status(500).json({ error: 'Failed to save session' });
        }
        console.log('✅ Session saved successfully for user:', user.email);
        res.json(user);
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Invalid login data', details: error.errors });
      }
      res.status(401).json({ error: error instanceof Error ? error.message : 'Login failed' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.clearCookie('soc.sid'); // Custom session cookie name
      res.json({ message: 'Logged out successfully' });
    });
  });

  app.get('/api/auth/user', async (req: any, res) => {
    try {
      console.log('🔍 Auth user check - Session ID:', req.sessionID, 'UserId in session:', req.session.userId, 'Session data:', JSON.stringify(req.session));
      
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized - No session" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        req.session.userId = undefined;
        return res.status(401).json({ message: "Unauthorized - User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  });

  // Sources endpoints
  app.get('/api/sources', isAuthenticated, async (req, res) => {
    try {
      const sources = await storage.getSources();
      res.json(sources);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch sources' });
    }
  });

  app.get('/api/sources/:id', async (req, res) => {
    try {
      const source = await storage.getSource(req.params.id);
      if (!source) {
        return res.status(404).json({ error: 'Source not found' });
      }
      res.json(source);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch source' });
    }
  });

  app.post('/api/sources', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSourceSchema.parse(req.body);
      const source = await storage.createSource(validatedData);
      
      broadcast({ type: 'source_created', data: source });
      res.status(201).json(source);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Invalid source data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create source' });
    }
  });

  app.put('/api/sources/:id', async (req, res) => {
    try {
      const source = await storage.updateSource(req.params.id, req.body);
      if (!source) {
        return res.status(404).json({ error: 'Source not found' });
      }
      
      broadcast({ type: 'source_updated', data: source });
      res.json(source);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update source' });
    }
  });

  app.delete('/api/sources/:id', async (req, res) => {
    try {
      const success = await storage.deleteSource(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Source not found' });
      }
      
      broadcast({ type: 'source_deleted', data: { id: req.params.id } });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete source' });
    }
  });

  // Raw alerts endpoints
  app.get('/api/alerts', async (req, res) => {
    try {
      const alerts = await storage.getRawAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  });

  app.post('/api/alerts', async (req, res) => {
    try {
      const validatedData = insertRawAlertSchema.parse(req.body);
      const alert = await storage.createRawAlert(validatedData);
      
      broadcast({ type: 'alert_created', data: alert });
      res.status(201).json(alert);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Invalid alert data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create alert' });
    }
  });

  // New normalization endpoints
  app.post('/api/alerts/normalize', async (req, res) => {
    try {
      const { alertData, sourceId, sourceType } = req.body;
      
      if (!alertData || !sourceId) {
        return res.status(400).json({ error: 'Missing required fields: alertData, sourceId' });
      }

      const result = await AlertProcessor.processIncomingAlert(alertData, sourceId, sourceType);
      
      // Broadcast alert processing result
      broadcast({ type: 'alert_normalized', data: result });
      
      // If incident was auto-created, broadcast incident creation
      if (result.incidentCreated && result.incidentId) {
        const incident = await storage.getIncident(result.incidentId);
        broadcast({ type: 'incident_created', data: incident });
      }
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Normalization error:', error);
      res.status(500).json({ error: 'Failed to normalize alert' });
    }
  });

  app.post('/api/alerts/bulk-normalize', async (req, res) => {
    try {
      const { alerts } = req.body;
      
      if (!Array.isArray(alerts)) {
        return res.status(400).json({ error: 'alerts must be an array' });
      }

      const results = await AlertProcessor.processBulkAlerts(alerts);
      
      broadcast({ type: 'alerts_bulk_normalized', data: { count: results.length } });
      res.status(201).json({ processed: results.length, results });
    } catch (error) {
      console.error('Bulk normalization error:', error);
      res.status(500).json({ error: 'Failed to normalize alerts' });
    }
  });

  app.post('/api/alerts/simulate/:sourceType', async (req, res) => {
    try {
      const { sourceType } = req.params;
      const count = parseInt(req.query.count as string) || 5;
      
      const results = await AlertProcessor.simulateIncomingAlerts(sourceType, count);
      
      broadcast({ type: 'alerts_simulated', data: { sourceType, count: results.length, usingRealData: true } });
      res.status(201).json({ 
        message: `Generated ${results.length} ${sourceType} alerts using real data`,
        results,
        usingRealData: true
      });
    } catch (error) {
      console.error('Simulation error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to simulate alerts' });
    }
  });

  // Real-time alert simulation
  app.post('/api/alerts/simulate-realtime/:sourceType', async (req, res) => {
    try {
      const { sourceType } = req.params;
      const durationMinutes = parseInt(req.query.duration as string) || 5;
      const alertsPerMinute = parseInt(req.query.rate as string) || 2;
      
      // Start real-time simulation (runs in background)
      AlertProcessor.simulateRealTimeAlerts(sourceType, durationMinutes, alertsPerMinute);
      
      broadcast({ 
        type: 'realtime_simulation_started', 
        data: { sourceType, durationMinutes, alertsPerMinute } 
      });
      
      res.status(202).json({ 
        message: `Real-time simulation started for ${sourceType}`,
        duration: `${durationMinutes} minutes`,
        rate: `${alertsPerMinute} alerts per minute`,
        totalExpected: durationMinutes * alertsPerMinute
      });
    } catch (error) {
      console.error('Real-time simulation error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to start real-time simulation' });
    }
  });

  // Get dataset statistics
  app.get('/api/alerts/dataset-stats', async (req, res) => {
    try {
      const stats = await AlertProcessor.getDatasetStats();
      res.json({
        message: 'Alert dataset statistics',
        stats,
        sources: Object.keys(stats).filter(k => k !== 'total')
      });
    } catch (error) {
      console.error('Dataset stats error:', error);
      res.status(500).json({ error: 'Failed to get dataset statistics' });
    }
  });

  // Get a sample alert from real data
  app.get('/api/alerts/sample/:sourceType', async (req, res) => {
    try {
      const { sourceType } = req.params;
      const sampleAlert = await AlertProcessor.getSampleAlert(sourceType);
      
      if (!sampleAlert) {
        return res.status(404).json({ error: `No sample data available for ${sourceType}` });
      }
      
      res.json({
        sourceType,
        sampleAlert,
        message: `Sample ${sourceType} alert from real dataset`
      });
    } catch (error) {
      console.error('Sample alert error:', error);
      res.status(500).json({ error: 'Failed to get sample alert' });
    }
  });

  // Test endpoint to validate normalization without storing
  app.post('/api/alerts/test-normalize', async (req, res) => {
    try {
      const { alertData, sourceType } = req.body;
      
      if (!alertData) {
        return res.status(400).json({ error: 'Missing alertData' });
      }

      const normalized = AlertNormalizer.normalize(alertData, sourceType);
      res.json({ normalized, original: alertData });
    } catch (error) {
      console.error('Test normalization error:', error);
      res.status(500).json({ error: 'Failed to test normalization' });
    }
  });

  // Incidents endpoints
  app.get('/api/incidents', isAuthenticated, async (req, res) => {
    try {
      const incidents = await storage.getIncidents();
      res.json(incidents);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch incidents' });
    }
  });

  app.get('/api/incidents/:id', async (req, res) => {
    try {
      const incident = await storage.getIncident(req.params.id);
      if (!incident) {
        return res.status(404).json({ error: 'Incident not found' });
      }
      res.json(incident);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch incident' });
    }
  });

  app.post('/api/incidents', async (req, res) => {
    try {
      const validatedData = insertIncidentSchema.parse(req.body);
      const incident = await storage.createIncident(validatedData);
      
      broadcast({ type: 'incident_created', data: incident });
      res.status(201).json(incident);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Invalid incident data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create incident' });
    }
  });

  app.put('/api/incidents/:id', async (req, res) => {
    try {
      const incident = await storage.updateIncident(req.params.id, req.body);
      if (!incident) {
        return res.status(404).json({ error: 'Incident not found' });
      }
      
      broadcast({ type: 'incident_updated', data: incident });
      res.json(incident);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update incident' });
    }
  });

  // Bulk incident operations
  app.patch('/api/incidents/bulk', async (req, res) => {
    try {
      const { incidentIds, operation, data } = req.body;
      
      if (!incidentIds || !Array.isArray(incidentIds) || incidentIds.length === 0) {
        return res.status(400).json({ error: 'incidentIds array is required' });
      }
      
      if (!operation) {
        return res.status(400).json({ error: 'operation is required' });
      }

      const results = [];
      const errors = [];

      for (const incidentId of incidentIds) {
        try {
          let updatedIncident;
          
          switch (operation) {
            case 'assign':
              if (!data?.assignedTo) {
                throw new Error('assignedTo is required for assign operation');
              }
              updatedIncident = await storage.updateIncident(incidentId, { 
                assignedTo: data.assignedTo 
              });
              
              // Create action for the assignment
              await storage.createAction({
                incidentId,
                actionType: 'ANALYST_ASSIGNMENT',
                payload: { assignedTo: data.assignedTo, bulkOperation: true },
                performedBy: data.performedBy || 'system'
              });
              break;
              
            case 'escalate':
              updatedIncident = await storage.updateIncident(incidentId, { 
                severity: 'critical',
                status: 'investigating'
              });
              
              // Create action for the escalation
              await storage.createAction({
                incidentId,
                actionType: 'ESCALATE',
                payload: { escalatedTo: 'senior_analyst', bulkOperation: true },
                performedBy: data?.performedBy || 'system'
              });
              break;
              
            case 'close':
              updatedIncident = await storage.updateIncident(incidentId, { 
                status: 'resolved',
                closedAt: new Date()
              });
              
              // Create action for the closure
              await storage.createAction({
                incidentId,
                actionType: 'CLOSE_INCIDENT',
                payload: { reason: data?.reason || 'Bulk closure', bulkOperation: true },
                performedBy: data?.performedBy || 'system'
              });
              break;
              
            case 'update_status':
              if (!data?.status) {
                throw new Error('status is required for update_status operation');
              }
              updatedIncident = await storage.updateIncident(incidentId, { 
                status: data.status 
              });
              
              // Create action for the status update
              await storage.createAction({
                incidentId,
                actionType: 'STATUS_CHANGE',
                payload: { newStatus: data.status, bulkOperation: true },
                performedBy: data?.performedBy || 'system'
              });
              break;
              
            default:
              throw new Error(`Unknown operation: ${operation}`);
          }
          
          if (updatedIncident) {
            results.push(updatedIncident);
            broadcast({ type: 'incident_updated', data: updatedIncident });
          }
        } catch (error) {
          errors.push({
            incidentId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      res.json({
        success: true,
        updated: results.length,
        errorCount: errors.length,
        results,
        errors
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to perform bulk operation' });
    }
  });

  // Actions endpoints
  app.get('/api/actions', async (req, res) => {
    try {
      const actions = await storage.getActions();
      res.json(actions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch actions' });
    }
  });

  app.get('/api/incidents/:id/actions', async (req, res) => {
    try {
      const actions = await storage.getActionsByIncident(req.params.id);
      res.json(actions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch incident actions' });
    }
  });

  app.post('/api/incidents/:id/actions', async (req, res) => {
    try {
      const validatedData = insertActionSchema.parse({
        ...req.body,
        incidentId: req.params.id
      });
      const action = await storage.createAction(validatedData);
      
      broadcast({ type: 'action_created', data: action });
      res.status(201).json(action);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Invalid action data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create action' });
    }
  });

  // Feedback endpoints
  app.get('/api/feedback', async (req, res) => {
    try {
      const feedback = await storage.getFeedback();
      res.json(feedback);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch feedback' });
    }
  });

  app.get('/api/incidents/:id/feedback', async (req, res) => {
    try {
      const feedback = await storage.getFeedbackByIncident(req.params.id);
      res.json(feedback);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch incident feedback' });
    }
  });

  app.post('/api/feedback', async (req, res) => {
    try {
      const validatedData = insertFeedbackSchema.parse(req.body);
      const feedback = await storage.createFeedback(validatedData);
      
      broadcast({ type: 'feedback_created', data: feedback });
      res.status(201).json(feedback);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Invalid feedback data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create feedback' });
    }
  });

  // Model metrics endpoints
  app.get('/api/metrics', async (req, res) => {
    try {
      const metrics = await storage.getModelMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch metrics' });
    }
  });

  // Real-time analytics endpoint
  app.get('/api/analytics/realtime', async (req, res) => {
    try {
      const analytics = await AnalyticsService.calculateRealTimeMetrics();
      res.json(analytics);
    } catch (error) {
      console.error('Analytics calculation error:', error);
      res.status(500).json({ error: 'Failed to calculate real-time analytics' });
    }
  });

  app.post('/api/metrics', async (req, res) => {
    try {
      const validatedData = insertModelMetricSchema.parse(req.body);
      const metric = await storage.createModelMetric(validatedData);
      
      broadcast({ type: 'metric_created', data: metric });
      res.status(201).json(metric);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Invalid metric data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create metric' });
    }
  });

  // Threat intelligence endpoints
  app.get('/api/threatintel', async (req, res) => {
    try {
      const indicators = await ThreatIntelligenceService.getIndicators();
      res.json(indicators);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch threat intelligence indicators' });
    }
  });

  app.get('/api/threatintel/stats', async (req, res) => {
    try {
      const stats = ThreatIntelligenceService.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch threat intelligence stats' });
    }
  });

  app.get('/api/threatintel/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: 'Query parameter "q" is required' });
      }
      
      const indicators = await ThreatIntelligenceService.searchIndicators(query);
      res.json(indicators);
    } catch (error) {
      res.status(500).json({ error: 'Failed to search threat intelligence' });
    }
  });

  app.get('/api/threatintel/type/:type', async (req, res) => {
    try {
      const { type } = req.params;
      const indicators = await ThreatIntelligenceService.getIndicatorsByType(type);
      res.json(indicators);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch indicators by type' });
    }
  });

  app.post('/api/threatintel', async (req, res) => {
    try {
      const indicator = await ThreatIntelligenceService.addIndicator(req.body);
      res.status(201).json(indicator);
    } catch (error) {
      res.status(500).json({ error: 'Failed to add threat intelligence indicator' });
    }
  });

  app.put('/api/threatintel/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const indicator = await ThreatIntelligenceService.updateIndicator(id, req.body);
      if (!indicator) {
        return res.status(404).json({ error: 'Indicator not found' });
      }
      res.json(indicator);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update threat intelligence indicator' });
    }
  });

  app.delete('/api/threatintel/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const success = await ThreatIntelligenceService.deleteIndicator(id);
      if (!success) {
        return res.status(404).json({ error: 'Indicator not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete threat intelligence indicator' });
    }
  });

  // Correlation stats endpoint
  app.get('/api/correlation/stats', async (req, res) => {
    try {
      const incidents = await storage.getIncidents();
      const actions = await storage.getActions();
      
      const autoCreatedIncidents = actions.filter(action => 
        action.actionType === 'AUTOMATED_DETECTION'
      ).length;
      
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentIncidents = incidents.filter(incident => 
        new Date(incident.createdAt) > last24Hours
      );
      
      res.json({
        totalIncidents: incidents.length,
        autoCreatedIncidents,
        recentIncidents: recentIncidents.length,
        correlationAccuracy: 0.87, // This would come from ML metrics in real system
        avgResponseTime: '4.2m'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch correlation stats' });
    }
  });

  // ========================================
  // KAFKA SECURITY EVENT INGESTION ENDPOINTS  
  // ========================================
  
  // SIEM Integration - Ingest alerts from SIEM systems (Splunk, QRadar, etc.)
  app.post('/api/kafka/siem/alerts', async (req, res) => {
    try {
      const event = await SecurityEventIngestion.ingestSIEMAlert(req.body);
      res.status(201).json({ 
        message: 'SIEM alert ingested successfully', 
        eventId: event.id 
      });
    } catch (error) {
      console.error('SIEM alert ingestion error:', error);
      res.status(500).json({ error: 'Failed to ingest SIEM alert' });
    }
  });
  
  // EDR Integration - Ingest alerts from EDR systems (CrowdStrike, Microsoft Defender, etc.)
  app.post('/api/kafka/edr/alerts', async (req, res) => {
    try {
      const event = await SecurityEventIngestion.ingestEDRAlert(req.body);
      res.status(201).json({ 
        message: 'EDR alert ingested successfully', 
        eventId: event.id 
      });
    } catch (error) {
      console.error('EDR alert ingestion error:', error);
      res.status(500).json({ error: 'Failed to ingest EDR alert' });
    }
  });
  
  // Firewall Integration - Ingest alerts from firewall systems
  app.post('/api/kafka/firewall/alerts', async (req, res) => {
    try {
      const event = await SecurityEventIngestion.ingestFirewallAlert(req.body);
      res.status(201).json({ 
        message: 'Firewall alert ingested successfully', 
        eventId: event.id 
      });
    } catch (error) {
      console.error('Firewall alert ingestion error:', error);
      res.status(500).json({ error: 'Failed to ingest firewall alert' });
    }
  });
  
  // Demo endpoint to simulate live security events
  app.post('/api/kafka/demo/simulate', async (req, res) => {
    try {
      console.log('🎭 Starting security event simulation...');
      await kafkaService.simulateSecurityEvents();
      res.json({ 
        message: 'Security event simulation started', 
        note: 'Events will stream to connected dashboards in real-time' 
      });
    } catch (error) {
      console.error('Event simulation error:', error);
      res.status(500).json({ error: 'Failed to start event simulation' });
    }
  });

  // Processing statistics endpoint for monitoring high-volume flows
  app.get('/api/kafka/stats', async (req, res) => {
    try {
      const stats = kafkaService.getProcessingStats();
      res.json({
        processing: stats,
        recommendations: {
          status: stats.eventsPerSecond > 500 ? 'high_volume' : 'normal',
          batchOptimization: stats.batchQueueSize > 50 ? 'enabled' : 'standard',
          clientLoad: stats.connectedClients > 20 ? 'high' : 'normal'
        }
      });
    } catch (error) {
      console.error('Stats error:', error);
      res.status(500).json({ error: 'Failed to get processing stats' });
    }
  });

  // === OCSF (Open Cybersecurity Schema Framework) Endpoints ===
  
  // Get all OCSF events
  app.get('/api/ocsf/events', async (req, res) => {
    try {
      const events = await storage.getOCSFEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch OCSF events' });
    }
  });

  // Get OCSF events by class
  app.get('/api/ocsf/events/class/:classUid', async (req, res) => {
    try {
      const classUid = parseInt(req.params.classUid);
      if (isNaN(classUid)) {
        return res.status(400).json({ error: 'Invalid class UID' });
      }
      
      const events = await storage.getOCSFEventsByClass(classUid);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch OCSF events by class' });
    }
  });

  // Get specific OCSF event
  app.get('/api/ocsf/events/:id', async (req, res) => {
    try {
      const event = await storage.getOCSFEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ error: 'OCSF event not found' });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch OCSF event' });
    }
  });

  // Ingest OCSF Network Activity events
  app.post('/api/ocsf/network-activity', async (req, res) => {
    try {
      const event = await SecurityEventIngestion.ingestOCSFNetworkActivity(req.body);
      res.status(201).json({ message: 'OCSF Network Activity event ingested successfully', event });
    } catch (error) {
      console.error('OCSF Network Activity ingestion error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to ingest OCSF Network Activity event' });
    }
  });

  // Ingest OCSF System Activity events
  app.post('/api/ocsf/system-activity', async (req, res) => {
    try {
      const event = await SecurityEventIngestion.ingestOCSFSystemActivity(req.body);
      res.status(201).json({ message: 'OCSF System Activity event ingested successfully', event });
    } catch (error) {
      console.error('OCSF System Activity ingestion error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to ingest OCSF System Activity event' });
    }
  });

  // Ingest OCSF Security Finding events
  app.post('/api/ocsf/security-finding', async (req, res) => {
    try {
      const event = await SecurityEventIngestion.ingestOCSFSecurityFinding(req.body);
      res.status(201).json({ message: 'OCSF Security Finding event ingested successfully', event });
    } catch (error) {
      console.error('OCSF Security Finding ingestion error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to ingest OCSF Security Finding event' });
    }
  });

  // Ingest OCSF Authentication events
  app.post('/api/ocsf/authentication', async (req, res) => {
    try {
      const event = await SecurityEventIngestion.ingestOCSFAuthentication(req.body);
      res.status(201).json({ message: 'OCSF Authentication event ingested successfully', event });
    } catch (error) {
      console.error('OCSF Authentication ingestion error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to ingest OCSF Authentication event' });
    }
  });

  // Generic OCSF event ingestion
  app.post('/api/ocsf/events', async (req, res) => {
    try {
      const event = await SecurityEventIngestion.ingestOCSFEvent(req.body);
      res.status(201).json({ message: 'OCSF event ingested successfully', event });
    } catch (error) {
      console.error('OCSF event ingestion error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to ingest OCSF event' });
    }
  });

  // Bulk OCSF event ingestion
  app.post('/api/ocsf/events/bulk', async (req, res) => {
    try {
      const { events } = req.body;
      
      if (!Array.isArray(events)) {
        return res.status(400).json({ error: 'events must be an array' });
      }
      
      const results = await SecurityEventIngestion.ingestOCSFEventsBulk(events);
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      res.status(201).json({ 
        message: `Bulk OCSF ingestion completed: ${successful} successful, ${failed} failed`,
        results,
        summary: { successful, failed, total: results.length }
      });
    } catch (error) {
      console.error('Bulk OCSF ingestion error:', error);
      res.status(500).json({ error: 'Failed to process bulk OCSF ingestion' });
    }
  });

  // Transform legacy events to OCSF and ingest
  app.post('/api/ocsf/transform/:sourceType', async (req, res) => {
    try {
      const { sourceType } = req.params;
      
      if (!['siem', 'edr', 'firewall'].includes(sourceType)) {
        return res.status(400).json({ error: 'Invalid source type. Must be: siem, edr, or firewall' });
      }
      
      const result = await SecurityEventIngestion.transformAndIngestLegacyEvent(
        req.body, 
        sourceType as 'siem' | 'edr' | 'firewall'
      );
      
      res.status(201).json({ 
        message: `Legacy ${sourceType} event transformed to OCSF and ingested successfully`,
        customEvent: result.customEvent,
        ocsfEvent: result.ocsfEvent
      });
    } catch (error) {
      console.error('OCSF transformation error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to transform and ingest event' });
    }
  });

  // OCSF schema validation endpoint
  app.post('/api/ocsf/validate', async (req, res) => {
    try {
      const { event } = req.body;
      
      // Basic OCSF validation
      const requiredFields = ['class_uid', 'class_name', 'time', 'category_uid', 'category_name'];
      const missing = requiredFields.filter(field => !event[field]);
      
      if (missing.length > 0) {
        return res.status(400).json({ 
          valid: false, 
          errors: [`Missing required fields: ${missing.join(', ')}`]
        });
      }
      
      // Check if class_uid is valid
      const validClassUids = [1001, 2001, 3002, 4001]; // System, Finding, Auth, Network
      if (!validClassUids.includes(event.class_uid)) {
        return res.status(400).json({ 
          valid: false, 
          errors: [`Invalid class_uid: ${event.class_uid}. Supported: ${validClassUids.join(', ')}`]
        });
      }
      
      res.json({ 
        valid: true, 
        message: 'OCSF event is valid',
        class_name: event.class_name,
        class_uid: event.class_uid
      });
    } catch (error) {
      console.error('OCSF validation error:', error);
      res.status(500).json({ error: 'Failed to validate OCSF event' });
    }
  });

  // === NORMALIZATION DEMO ENDPOINTS ===
  
  // Demonstrate full normalization flow
  app.get('/api/demo/normalization/full-flow/:sourceType?', async (req, res) => {
    try {
      const { NormalizationDemo } = await import('./normalizationDemo');
      const sourceType = req.params.sourceType || 'crowdstrike';
      const results = await NormalizationDemo.demonstrateFullNormalizationFlow(sourceType);
      
      res.json({
        title: `Complete Normalization Flow Demo - ${sourceType}`,
        description: "Step-by-step demonstration of raw alert → custom normalization → OCSF transformation",
        flow_steps: results
      });
    } catch (error) {
      console.error('Normalization demo error:', error);
      res.status(500).json({ error: 'Failed to run normalization demonstration' });
    }
  });

  // Demonstrate multi-source normalization 
  app.get('/api/demo/normalization/multi-source', async (req, res) => {
    try {
      const { NormalizationDemo } = await import('./normalizationDemo');
      const results = await NormalizationDemo.demonstrateMultiSourceNormalization();
      
      res.json({
        title: "Multi-Source Normalization Demo",
        description: "Shows how different security tools are unified through custom + OCSF normalization",
        sources_processed: Object.keys(results).filter(k => k !== 'unified_ocsf').length,
        unified_results: results
      });
    } catch (error) {
      console.error('Multi-source demo error:', error);
      res.status(500).json({ error: 'Failed to run multi-source demonstration' });
    }
  });

  // Get transformation explanation
  app.get('/api/demo/normalization/explanation', async (req, res) => {
    try {
      const { NormalizationDemo } = await import('./normalizationDemo');
      const explanation = NormalizationDemo.getTransformationExplanation();
      
      res.json({
        title: "Normalization Systems Explanation",
        description: "How custom normalization and OCSF normalization work together",
        ...explanation
      });
    } catch (error) {
      console.error('Explanation demo error:', error);
      res.status(500).json({ error: 'Failed to get normalization explanation' });
    }
  });

  // Export endpoints
  app.get('/api/export/incidents', async (req, res) => {
    try {
      const format = req.query.format as 'csv' | 'json' || 'json';
      const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
      const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;
      const severity = req.query.severity ? (req.query.severity as string).split(',') : undefined;
      const status = req.query.status ? (req.query.status as string).split(',') : undefined;

      const options = {
        format,
        dateRange: startDate && endDate ? { start: startDate, end: endDate } : undefined,
        filters: {
          severity,
          status
        }
      };

      const exportData = await ExportService.exportIncidents(options);
      const filename = ExportService.getExportFilename('incidents', format);

      res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(exportData);
    } catch (error) {
      console.error('Export incidents error:', error);
      res.status(500).json({ error: 'Failed to export incidents' });
    }
  });

  app.get('/api/export/alerts', async (req, res) => {
    try {
      const format = req.query.format as 'csv' | 'json' || 'json';
      const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
      const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;
      const severity = req.query.severity ? (req.query.severity as string).split(',') : undefined;
      const sourceId = req.query.source_id as string;

      const options = {
        format,
        dateRange: startDate && endDate ? { start: startDate, end: endDate } : undefined,
        filters: {
          severity,
          sourceId
        }
      };

      const exportData = await ExportService.exportAlerts(options);
      const filename = ExportService.getExportFilename('alerts', format);

      res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(exportData);
    } catch (error) {
      console.error('Export alerts error:', error);
      res.status(500).json({ error: 'Failed to export alerts' });
    }
  });

  app.get('/api/export/analytics', async (req, res) => {
    try {
      const format = req.query.format as 'csv' | 'json' || 'json';
      const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
      const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;

      const options = {
        format,
        dateRange: startDate && endDate ? { start: startDate, end: endDate } : undefined
      };

      const exportData = await ExportService.exportAnalytics(options);
      const filename = ExportService.getExportFilename('analytics', format);

      res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(exportData);
    } catch (error) {
      console.error('Export analytics error:', error);
      res.status(500).json({ error: 'Failed to export analytics' });
    }
  });

  app.get('/api/export/actions', async (req, res) => {
    try {
      const format = req.query.format as 'csv' | 'json' || 'json';
      const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
      const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;

      const options = {
        format,
        dateRange: startDate && endDate ? { start: startDate, end: endDate } : undefined
      };

      const exportData = await ExportService.exportActions(options);
      const filename = ExportService.getExportFilename('actions', format);

      res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(exportData);
    } catch (error) {
      console.error('Export actions error:', error);
      res.status(500).json({ error: 'Failed to export actions' });
    }
  });

  return httpServer;
}