import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { AlertProcessor } from "./alertProcessor";
import { AlertNormalizer } from "./normalization";
import { insertSourceSchema, insertRawAlertSchema, insertIncidentSchema, insertActionSchema, insertFeedbackSchema, insertModelMetricSchema } from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    
    ws.on('close', () => {
      clients.delete(ws);
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

  // Dashboard stats
  app.get('/api/dashboard/stats', async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  });

  // Sources endpoints
  app.get('/api/sources', async (req, res) => {
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

  app.post('/api/sources', async (req, res) => {
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
      
      broadcast({ type: 'alert_normalized', data: result });
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
      
      broadcast({ type: 'alerts_simulated', data: { sourceType, count: results.length } });
      res.status(201).json({ 
        message: `Generated ${results.length} ${sourceType} alerts`,
        results 
      });
    } catch (error) {
      console.error('Simulation error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to simulate alerts' });
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
  app.get('/api/incidents', async (req, res) => {
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

  // Threat intelligence endpoint (stub)
  app.get('/api/threatintel', (req, res) => {
    const timestamp = new Date();
    res.json([
      { id: 'ioc1', type: 'IP', value: '198.51.100.23', firstSeen: timestamp.toISOString() },
      { id: 'ioc2', type: 'Domain', value: 'malware.example.com', firstSeen: timestamp.toISOString() },
    ]);
  });

  return httpServer;
}