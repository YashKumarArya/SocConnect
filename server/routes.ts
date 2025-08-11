import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { neo4jService } from "./neo4j";
import { isAuthenticated } from "./auth";
import session from "express-session";
import { AuthService } from "./auth";
import { registerUserSchema, loginUserSchema } from "@shared/schema";
import { insertSourceSchema, insertRawAlertSchema, insertIncidentSchema, insertActionSchema, insertFeedbackSchema, insertModelMetricSchema } from "@shared/schema";
import { ZodError } from "zod";
import { randomUUID } from "crypto";
import { kafkaService } from "./kafka";
import { kafkaSequentialPipeline } from "./kafka-pipeline";
import { OCSFNormalizationPipeline } from "./ocsfNormalization";
import { AlertProcessorService } from "./services/AlertProcessorService";
import { MLModelService } from "./services/MLModelService";
import { AgenticAIService } from "./services/AgenticAIService";

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

  // Basic input validation middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('📡 WebSocket client connected. Total:', clients.size);
    
    // Register client with both Kafka services for real-time event streaming
    kafkaService.addClient(ws);
    kafkaSequentialPipeline.addClient(ws);
    
    ws.on('close', () => {
      clients.delete(ws);
      kafkaService.removeClient(ws);
      kafkaSequentialPipeline.removeClient(ws);
      console.log('📡 WebSocket client disconnected. Total:', clients.size);
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

  // OCSF Processing Endpoints - New Architecture: Alert Sources → API → Enrichment → OCSF Normalization → Database → ML via Kafka
  app.post('/api/alerts/process-ocsf', isAuthenticated, async (req, res) => {
    try {
      const rawAlert = req.body;
      
      // Process through OCSF normalization pipeline
      const { ocsfEvent, enhancedAlert } = await OCSFNormalizationPipeline.processRawAlert(rawAlert);
      
      // Store OCSF event in database
      const storedOCSFEvent = await storage.createOCSFEvent({
        classUid: ocsfEvent.class_uid,
        className: ocsfEvent.class_name,
        categoryUid: ocsfEvent.category_uid,
        categoryName: ocsfEvent.category_name,
        activityId: ocsfEvent.activity_id,
        activityName: ocsfEvent.activity_name,
        severityId: ocsfEvent.severity_id,
        severity: ocsfEvent.severity,
        time: new Date(ocsfEvent.time),
        message: ocsfEvent.message,
        rawData: ocsfEvent,
        observables: ocsfEvent.observables
      });
      
      // Link enhanced alert to OCSF event
      enhancedAlert.ocsfEventId = storedOCSFEvent.id;
      const storedEnhancedAlert = await storage.createEnhancedNormalizedAlert(enhancedAlert);
      
      // Send to ML model via Kafka for verdict
      const mlFeatures = MLModelService.prepareOCSFForML(ocsfEvent);
      await kafkaService.publishOCSFEvent(ocsfEvent);
      
      // Perform agentic AI analysis
      const aiAnalysis = await AgenticAIService.analyzeEvent(ocsfEvent);
      
      // Broadcast real-time update
      broadcast({
        type: 'ocsf_event_processed',
        data: {
          ocsfEvent: storedOCSFEvent,
          enhancedAlert: storedEnhancedAlert,
          aiAnalysis,
          mlFeatures
        }
      });
      
      res.status(201).json({
        success: true,
        ocsfEvent: storedOCSFEvent,
        enhancedAlert: storedEnhancedAlert,
        aiAnalysis,
        message: 'Alert processed through OCSF pipeline successfully'
      });
      
    } catch (error) {
      console.error('OCSF processing error:', error);
      res.status(500).json({ error: 'Failed to process alert through OCSF pipeline' });
    }
  });

  // Get OCSF events with enhanced analysis
  app.get('/api/ocsf/events', isAuthenticated, async (req, res) => {
    try {
      const { classUid, severityId, limit = 50 } = req.query;
      const ocsfEvents = await storage.getOCSFEvents({
        classUid: classUid ? parseInt(classUid as string) : undefined,
        severityId: severityId ? parseInt(severityId as string) : undefined,
        limit: Math.min(parseInt(limit as string), 1000)
      });
      
      res.json(ocsfEvents);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch OCSF events' });
    }
  });

  // Get enhanced normalized alerts with OCSF compliance
  app.get('/api/alerts/enhanced', isAuthenticated, async (req, res) => {
    try {
      const enhancedAlerts = await storage.getEnhancedNormalizedAlerts();
      res.json(enhancedAlerts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch enhanced alerts' });
    }
  });

  // ML Model verdict processing endpoint
  app.post('/api/ml/verdict', async (req, res) => {
    try {
      const { ocsfEventId, verdict } = req.body;
      await MLModelIntegration.processMLVerdict(ocsfEventId, verdict);
      
      broadcast({
        type: 'ml_verdict_received',
        data: { ocsfEventId, verdict }
      });
      
      res.json({ success: true, message: 'ML verdict processed successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to process ML verdict' });
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
      
      // Store raw alert first (Stage 1)
      const rawAlert = await storage.createRawAlert(validatedData);
      
      // Process through Sequential Kafka Pipeline: 
      // Alert → Enhancement → OCSF → [ML + Database]
      await kafkaSequentialPipeline.publishRawAlert(rawAlert);
      
      // Immediate response - processing continues asynchronously
      res.status(202).json({
        id: rawAlert.id,
        status: 'accepted',
        message: 'Alert accepted for sequential pipeline processing',
        pipeline: {
          stages: ['Enhancement', 'OCSF Standardization', 'ML + Database Storage'],
          description: 'Alert will be enriched, standardized, and processed by ML model'
        }
      });
      
    } catch (error) {
      console.error('Alert ingestion error:', error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.errors 
        });
      }
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to ingest alert' });
    }
  });

  // New normalization endpoints
  app.post('/api/alerts/normalize', async (req, res) => {
    try {
      const { alertData, sourceId, sourceType } = req.body;
      
      if (!alertData || !sourceId) {
        return res.status(400).json({ error: 'Missing required fields: alertData, sourceId' });
      }

      const result = await AlertProcessorService.processIncomingAlert(alertData, sourceId, sourceType);
      
      // Broadcast alert processing result
      broadcast({ type: 'alert_normalized', data: result });
      
      // If incident was auto-created, broadcast incident creation
      if (result.incidentCreated && result.incidentId) {
        broadcast({ type: 'incident_created', data: { incidentId: result.incidentId, alertId: result.alertId } });
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

      const results = await AlertProcessorService.processBulkAlerts(alerts);
      
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
      AlertProcessorService.simulateRealTimeAlerts(sourceType, durationMinutes, alertsPerMinute);
      
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
      const stats = {
        total: 4247,
        crowdstrike: 1205,
        sentinelone: 967,
        email: 1180,
        firewall: 895
      };
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
      const sampleAlert = await AlertProcessorService.getSampleAlert(sourceType);
      
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
  
  // Alert Simulation endpoints
  app.post("/api/simulation/start", async (req: Request, res: Response) => {
    try {
      const { intervalMs = 3000 } = req.body;
      const alertSimulation = (global as any).alertSimulation;
      
      if (!alertSimulation) {
        return res.status(500).json({ message: "Alert simulation not initialized" });
      }
      
      alertSimulation.startSimulation(intervalMs);
      res.json({ message: "Alert simulation started", intervalMs });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/simulation/stop", async (req: Request, res: Response) => {
    try {
      const alertSimulation = (global as any).alertSimulation;
      
      if (!alertSimulation) {
        return res.status(500).json({ message: "Alert simulation not initialized" });
      }
      
      alertSimulation.stopSimulation();
      res.json({ message: "Alert simulation stopped" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/simulation/status", async (req: Request, res: Response) => {
    try {
      const alertSimulation = (global as any).alertSimulation;
      
      if (!alertSimulation) {
        return res.status(500).json({ message: "Alert simulation not initialized" });
      }
      
      const status = alertSimulation.getSimulationStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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

  // === NEO4J GRAPH DATABASE ENDPOINTS ===
  
  // Get Neo4j connection status and graph statistics
  app.get('/api/graph/status', async (req, res) => {
    try {
      const isConnected = neo4jService.isConnected();
      const stats = await neo4jService.getGraphStats();
      
      res.json({
        connected: isConnected,
        stats: stats || { alerts: 0, incidents: 0, devices: 0, users: 0, relationships: 0 },
        message: isConnected ? 'Neo4j connected successfully' : 'Neo4j not connected'
      });
    } catch (error) {
      console.error('Graph status error:', error);
      res.status(500).json({ error: 'Failed to get graph database status' });
    }
  });

  // Find related alerts using graph relationships
  app.get('/api/graph/alerts/:alertId/related', async (req, res) => {
    try {
      const { alertId } = req.params;
      const maxHops = parseInt(req.query.maxHops as string) || 2;
      
      if (!neo4jService.isConnected()) {
        return res.status(503).json({ error: 'Neo4j graph database not connected' });
      }
      
      const relatedAlerts = await neo4jService.findRelatedAlerts(alertId, maxHops);
      
      res.json({
        alertId,
        relatedAlerts,
        count: relatedAlerts.length,
        maxHops
      });
    } catch (error) {
      console.error('Graph related alerts error:', error);
      res.status(500).json({ error: 'Failed to find related alerts' });
    }
  });

  // Detect attack chains using graph analysis
  app.get('/api/graph/attack-chains', async (req, res) => {
    try {
      const timeWindowHours = parseInt(req.query.timeWindow as string) || 24;
      
      if (!neo4jService.isConnected()) {
        return res.status(503).json({ error: 'Neo4j graph database not connected' });
      }
      
      const attackChains = await neo4jService.detectAttackChains(timeWindowHours);
      
      res.json({
        attackChains,
        count: attackChains.length,
        timeWindowHours,
        analysis: {
          totalChains: attackChains.length,
          highConfidenceChains: attackChains.filter(c => c.confidence > 0.7).length,
          criticalImpactChains: attackChains.filter(c => c.totalImpact > 10).length
        }
      });
    } catch (error) {
      console.error('Graph attack chains error:', error);
      res.status(500).json({ error: 'Failed to detect attack chains' });
    }
  });

  // Find compromised assets (devices/users with multiple alerts)
  app.get('/api/graph/compromised-assets', async (req, res) => {
    try {
      const timeWindowHours = parseInt(req.query.timeWindow as string) || 24;
      
      if (!neo4jService.isConnected()) {
        return res.status(503).json({ error: 'Neo4j graph database not connected' });
      }
      
      const compromisedAssets = await neo4jService.findCompromisedAssets(timeWindowHours);
      
      res.json({
        ...compromisedAssets,
        timeWindowHours,
        summary: {
          totalDevices: compromisedAssets.devices.length,
          totalUsers: compromisedAssets.users.length,
          totalIPs: compromisedAssets.ipAddresses.length,
          criticalDevices: compromisedAssets.devices.filter(d => d.alertCount >= 5).length,
          criticalUsers: compromisedAssets.users.filter(u => u.alertCount >= 3).length
        }
      });
    } catch (error) {
      console.error('Graph compromised assets error:', error);
      res.status(500).json({ error: 'Failed to find compromised assets' });
    }
  });

  // Connect to Neo4j manually (for admin use)
  app.post('/api/graph/connect', isAuthenticated, async (req, res) => {
    try {
      await neo4jService.connect();
      res.json({ message: 'Neo4j connection initiated', connected: neo4jService.isConnected() });
    } catch (error) {
      console.error('Graph connect error:', error);
      res.status(500).json({ error: 'Failed to connect to Neo4j' });
    }
  });

  // Disconnect from Neo4j manually (for admin use)
  app.post('/api/graph/disconnect', isAuthenticated, async (req, res) => {
    try {
      await neo4jService.disconnect();
      res.json({ message: 'Neo4j disconnected successfully', connected: neo4jService.isConnected() });
    } catch (error) {
      console.error('Graph disconnect error:', error);
      res.status(500).json({ error: 'Failed to disconnect from Neo4j' });
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