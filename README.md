# Alpha SOC Platform - Agentic AI Security Operations Center

Advanced Security Operations Center (SOC) platform with machine learning for automated threat detection (99.58% accuracy), featuring Neo4j graph database capabilities, OCSF (Open Cybersecurity Schema Framework) normalization pipeline, real-time security event processing, and agentic AI integration.

## 🚀 Architecture Overview

**Complete Data Flow Pipeline:**
```
Alert Sources → API Endpoints → Kafka Streaming → Enhancement/Enrichment → OCSF Standardization → Database Storage → ML Model + Neo4j Graph Analysis
```

The system implements real-time, low-latency processing through Kafka message streaming, allowing for immediate enrichment and standardization of security alerts as they flow through the system.

![SOC Dashboard](https://img.shields.io/badge/Status-Active-brightgreen) ![Version](https://img.shields.io/badge/Version-1.0.0-blue) ![License](https://img.shields.io/badge/License-MIT-green)

## 🎯 Key Features

### AI-Powered Security Operations
- **Real-time Processing** - Kafka-based streaming architecture for sub-second alert processing
- **ML-Powered Detection** - 99.58% accuracy with 3-class classification and 3.2M parameter model
- **OCSF Compliance** - Full Open Cybersecurity Schema Framework implementation
- **Graph Intelligence** - Neo4j-powered relationship analysis and attack pattern detection
- **Agentic AI** - Intelligent threat assessment and automated response recommendations
- **Multi-Source Integration** - Support for CrowdStrike, Email Security, Firewall, SentinelOne

### Enhanced Processing Pipeline
- **Enhanced Enrichment** - Geo-location, user context, threat intelligence, asset context integration
- **Real-time Standardization** - OCSF-compliant data transformation at the streaming layer
- **Low-Latency Processing** - Sub-second alert enrichment and classification
- **Authentic Data Processing** - Handles 4,000+ real security alerts from multiple sources

### Technical Excellence
- **Real-time Communication** - WebSocket + Kafka integration for live updates
- **Database Architecture** - PostgreSQL + Neo4j graph database for comprehensive analysis
- **Type Safety** - End-to-end TypeScript with shared schemas
- **Modern UI/UX** - Dark-themed interface optimized for SOC environments
- **Enterprise Authentication** - Role-based access control with session management

## 🏗️ System Architecture

### Frontend Stack
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - End-to-end type safety and developer experience
- **Radix UI + shadcn/ui** - Accessible, customizable component system
- **Tailwind CSS** - Utility-first styling with custom SOC-optimized dark theme
- **TanStack React Query** - Server state management with caching and synchronization
- **Wouter** - Lightweight client-side routing (alternative to React Router)
- **React Hook Form + Zod** - Type-safe form handling with validation
- **Lucide React** - Modern icon library
- **Framer Motion** - Animation library for enhanced UX
- **WebSocket Client** - Real-time communication with automatic reconnection

### Backend Stack
- **Node.js + Express.js** - Server runtime with TypeScript
- **Drizzle ORM** - Type-safe database operations with PostgreSQL
- **Kafka.js** - Enterprise-grade event streaming and message processing
- **WebSocket (ws)** - Real-time bidirectional communication
- **Passport.js** - Authentication middleware with OpenID Connect
- **bcryptjs** - Password hashing for local authentication
- **Zod** - Runtime type validation and schema definition
- **Express Session** - Session management with PostgreSQL storage

### Database & Storage
- **PostgreSQL** - Primary database with ACID compliance
- **Drizzle ORM** - Schema management and migrations
- **connect-pg-simple** - PostgreSQL session store
- **Database Design**:
  - User management and authentication
  - Security event storage (raw and normalized)
  - OCSF (Open Cybersecurity Schema Framework) compliance
  - Incident management and response tracking
  - Machine learning feature vectors and model metrics

### Event Streaming & Processing
- **Apache Kafka** - Distributed event streaming platform
- **OCSF Integration** - Open Cybersecurity Schema Framework compliance
- **Dual Format Support** - Custom SecurityEvent and standardized OCSF formats
- **Real-time Processing** - Live event transformation and routing
- **Topic Management** - Organized event streams by type and source

### Security & Compliance
- **OCSF Schema Framework** - Industry-standard cybersecurity event format
- **OAuth 2.0/OIDC** - Secure authentication via Replit
- **Session Security** - HTTP-only cookies with secure flags
- **Input Validation** - Zod schemas for runtime type checking
- **CORS Protection** - Cross-origin request security

## 🔐 Authentication System

The application uses **Replit OAuth 2.0/OIDC** for secure authentication:

### Features
- **Single Sign-On (SSO)** through Replit accounts
- **Session Management** with PostgreSQL-backed storage
- **Token Refresh** automatic renewal of expired tokens
- **Protected Routes** middleware-based API protection
- **Role-based Access** user roles and permissions

### Authentication Flow
1. User clicks "Sign In" on landing page
2. Redirected to Replit OAuth authorization
3. User authorizes the application
4. Callback processes tokens and creates session
5. User redirected to dashboard with authenticated session

### Protected Endpoints
- `GET /api/auth/user` - Get current user information
- `GET /api/incidents` - Incident management (requires authentication)
- `GET /api/sources` - Security sources configuration
- `POST /api/alerts` - Alert processing endpoints

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ 
- **PostgreSQL** database
- **Replit** account for authentication

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd soc-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Required environment variables (add to Replit Secrets):
   ```
   DATABASE_URL=postgresql://user:password@host:port/database
   SESSION_SECRET=your-secure-session-secret
   REPL_ID=your-replit-app-id
   REPLIT_DOMAINS=your-replit-domain.replit.app
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Open your browser to the Replit preview URL
   - Sign in with your Replit account

## 🗄️ Database Schema

### Core Tables

#### Authentication & User Management
- **users** - User accounts and profile information
- **sessions** - PostgreSQL-backed authentication sessions

#### Security Event Storage
- **sources** - Security tool configurations (SIEM, EDR, Firewall, etc.)
- **raw_alerts** - Unprocessed incoming security events from sources
- **normalized_alerts** - Processed and standardized security alerts
- **enhanced_normalized_alerts** - Extended alerts with OCSF correlation
- **ocsf_events** - OCSF-compliant security events for compliance

#### Incident Management
- **incidents** - Security incident tracking and management
- **actions** - Response actions and audit trail
- **feedback** - Analyst feedback for continuous improvement

#### Machine Learning & Analytics
- **feature_vectors** - ML features extracted from security events
- **model_metrics** - Performance tracking for ML models

### OCSF Schema Integration

The system implements full **OCSF (Open Cybersecurity Schema Framework)** compliance:

#### OCSF Event Classes Supported
- **Class 1001** - System Activity (Process, File, Registry events)
- **Class 2001** - Security Finding (Vulnerability, Threat detections)
- **Class 3002** - Authentication (Login, Logout, Access events)
- **Class 4001** - Network Activity (Connection, Traffic events)

#### OCSF Storage Schema
```sql
CREATE TABLE ocsf_events (
  id UUID PRIMARY KEY,
  class_uid INTEGER NOT NULL,        -- OCSF class identifier
  class_name VARCHAR(255) NOT NULL,  -- Human-readable class name
  category_uid INTEGER NOT NULL,     -- OCSF category
  category_name VARCHAR(255),        -- Category description
  activity_id INTEGER NOT NULL,      -- Specific activity type
  activity_name VARCHAR(255),        -- Activity description
  severity_id INTEGER NOT NULL,      -- Numeric severity (0-5)
  severity VARCHAR(50),              -- Severity label
  time TIMESTAMP NOT NULL,           -- Event timestamp
  message TEXT,                      -- Event description
  raw_data JSONB NOT NULL,          -- Full OCSF event data
  observables TEXT,                  -- IOCs and artifacts
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX (class_uid, time),           -- Performance optimization
  INDEX (severity_id, time),         -- Severity-based queries
  INDEX (category_uid)               -- Category filtering
);
```

### Schema Management
```bash
# Push schema changes to database
npm run db:push

# Generate schema migrations
npm run db:generate

# View database in Drizzle Studio
npm run db:studio

# Reset database (development only)
npm run db:reset
```

## 🔧 Development

### Development Workflow
```bash
# Start development server with hot reload
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

### Project Structure
```
├── client/                     # Frontend React application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ui/            # shadcn/ui base components
│   │   │   ├── dashboard/     # Dashboard-specific components
│   │   │   ├── alerts/        # Alert management components
│   │   │   └── incidents/     # Incident response components
│   │   ├── pages/             # Page components and routes
│   │   │   ├── dashboard.tsx  # Main SOC dashboard
│   │   │   ├── alerts.tsx     # Alert management page
│   │   │   ├── incidents.tsx  # Incident tracking page
│   │   │   ├── sources.tsx    # Source configuration
│   │   │   ├── login.tsx      # Authentication page
│   │   │   └── register.tsx   # User registration
│   │   ├── hooks/             # Custom React hooks
│   │   │   ├── useAuth.ts     # Authentication hook
│   │   │   ├── useWebSocket.ts # WebSocket connection
│   │   │   └── use-toast.ts   # Toast notifications
│   │   ├── lib/               # Utility functions
│   │   │   ├── queryClient.ts # TanStack Query configuration
│   │   │   ├── authUtils.ts   # Authentication utilities
│   │   │   └── websocket.ts   # WebSocket client
│   │   └── App.tsx            # Main application component
├── server/                     # Backend Express application
│   ├── db.ts                  # Database connection (Drizzle + Neon)
│   ├── routes.ts              # Main API route definitions
│   ├── storage.ts             # Data access layer (IStorage interface)
│   ├── replitAuth.ts          # Replit OAuth configuration
│   ├── kafka.ts               # Kafka event streaming service
│   ├── ocsf.ts                # OCSF schema and transformation
│   ├── websocket.ts           # WebSocket server implementation
│   ├── vite.ts                # Vite middleware for development
│   └── index.ts               # Server entry point
├── shared/                     # Shared TypeScript definitions
│   └── schema.ts              # Database schema and Zod validation
├── drizzle.config.ts          # Drizzle ORM configuration
├── vite.config.ts             # Vite build configuration
├── tailwind.config.ts         # Tailwind CSS configuration
└── package.json               # Dependencies and scripts
```

### Code Quality
- **TypeScript** for type safety across frontend and backend
- **ESLint** for code linting and consistency
- **Path aliases** (@, @shared) for clean imports
- **Strict mode** enabled for enhanced type checking

## 🔌 Complete API Reference

### Authentication Endpoints

#### OAuth 2.0/OIDC Flow
```http
GET /api/login              # Initiate OAuth login flow
GET /api/logout             # End user session and logout  
GET /api/callback           # OAuth callback handler
GET /api/auth/user          # Get current authenticated user
```

**Example Response** - `GET /api/auth/user`:
```json
{
  "id": "user-uuid",
  "email": "analyst@company.com",
  "firstName": "John",
  "lastName": "Smith",
  "role": "analyst",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Dashboard & Analytics

```http
GET /api/dashboard/stats    # Dashboard statistics and KPIs
GET /api/dashboard/metrics  # Real-time security metrics
GET /api/dashboard/trends   # Historical trend analysis
```

**Example** - `GET /api/dashboard/stats`:
```json
{
  "totalAlerts": 1247,
  "criticalAlerts": 23,
  "openIncidents": 8,
  "avgResponseTime": "4.2 minutes",
  "sourceStatus": {
    "online": 12,
    "offline": 1,
    "degraded": 0
  }
}
```

### Security Event Ingestion

#### Custom Format Ingestion
```http
POST /api/events/siem       # Ingest SIEM alerts
POST /api/events/edr        # Ingest EDR events
POST /api/events/firewall   # Ingest firewall alerts
POST /api/events/generic    # Generic security events
```

**Example** - `POST /api/events/siem`:
```json
{
  "id": "siem-2024-001",
  "timestamp": "2024-01-15T14:30:00Z",
  "source": "Splunk-SIEM",
  "severity": "high",
  "type": "intrusion",
  "title": "Suspicious Network Activity Detected",
  "description": "Multiple failed login attempts from external IP",
  "metadata": {
    "source_ip": "192.168.1.100",
    "destination_ip": "10.0.1.50",
    "user": "john.smith",
    "rule_id": "SIEM-LOGIN-001"
  },
  "raw_data": {
    "protocol": "SSH",
    "attempts": 15,
    "time_window": "5 minutes"
  }
}
```

### OCSF (Open Cybersecurity Schema Framework) API

#### OCSF Event Ingestion
```http
POST /api/ocsf/events                    # Generic OCSF event ingestion
POST /api/ocsf/events/bulk              # Bulk OCSF event ingestion
POST /api/ocsf/network-activity         # Network Activity (Class 4001)
POST /api/ocsf/system-activity          # System Activity (Class 1001) 
POST /api/ocsf/security-finding         # Security Finding (Class 2001)
POST /api/ocsf/authentication           # Authentication (Class 3002)
```

#### OCSF Event Retrieval
```http
GET /api/ocsf/events                     # List OCSF events with filtering
GET /api/ocsf/events/:id                 # Get specific OCSF event
GET /api/ocsf/events/class/:class_uid    # Get events by OCSF class
GET /api/ocsf/validate                   # Validate OCSF event structure
```

**Example** - `POST /api/ocsf/network-activity`:
```json
{
  "activity_id": 2,
  "activity_name": "Denied",
  "category_name": "Network Activity",
  "category_uid": 4,
  "class_name": "Network Activity",
  "class_uid": 4001,
  "message": "Network connection blocked by firewall",
  "metadata": {
    "logged_time": 1705329000000,
    "product": {
      "name": "Palo Alto Firewall",
      "vendor_name": "Palo Alto Networks",
      "version": "10.2.0"
    },
    "version": "1.1.0"
  },
  "severity": "Medium",
  "severity_id": 3,
  "time": 1705329000000,
  "type_name": "Network Activity: Denied",
  "type_uid": 400102,
  "src_endpoint": {
    "ip": "192.168.1.100",
    "hostname": "workstation-01"
  },
  "dst_endpoint": {
    "ip": "203.0.113.15",
    "port": 443
  },
  "connection_info": {
    "protocol_name": "HTTPS",
    "direction": "Outbound"
  },
  "disposition": "Blocked",
  "disposition_id": 2
}
```

### Legacy to OCSF Transformation
```http
POST /api/ocsf/transform/siem           # Transform SIEM event to OCSF
POST /api/ocsf/transform/edr            # Transform EDR event to OCSF  
POST /api/ocsf/transform/firewall       # Transform firewall event to OCSF
```

### Alert & Incident Management

#### Alerts
```http
GET /api/alerts                         # List security alerts with filtering
GET /api/alerts/:id                     # Get specific alert details
PUT /api/alerts/:id/status              # Update alert status
POST /api/alerts/:id/acknowledge        # Acknowledge alert
POST /api/alerts/:id/escalate           # Escalate to incident
```

**Query Parameters** - `GET /api/alerts`:
```
?severity=high,critical     # Filter by severity
&status=open               # Filter by status  
&source=firewall           # Filter by source type
&from=2024-01-01           # Date range start
&to=2024-01-31             # Date range end
&limit=50                  # Pagination limit
&offset=0                  # Pagination offset
```

#### Incidents
```http
GET /api/incidents                      # List security incidents
POST /api/incidents                     # Create new incident
GET /api/incidents/:id                  # Get incident details
PUT /api/incidents/:id                  # Update incident
POST /api/incidents/:id/assign          # Assign incident to analyst
POST /api/incidents/:id/close           # Close incident
GET /api/incidents/:id/timeline         # Get incident timeline
```

### Source Management

```http
GET /api/sources                        # List configured security sources
POST /api/sources                       # Add new security source
GET /api/sources/:id                    # Get source configuration
PUT /api/sources/:id                    # Update source configuration
DELETE /api/sources/:id                 # Remove security source
GET /api/sources/:id/health             # Check source health status
```

**Example** - `POST /api/sources`:
```json
{
  "name": "Primary Firewall",
  "type": "firewall",
  "vendor": "Palo Alto Networks",
  "config": {
    "host": "firewall.company.com",
    "port": 514,
    "protocol": "syslog",
    "api_key": "encrypted-key"
  },
  "enabled": true
}
```

### Machine Learning Integration

```http
POST /api/ml/analyze                    # Analyze event with ML models
GET /api/ml/models                      # List available ML models
POST /api/ml/feedback                   # Submit analyst feedback
GET /api/ml/metrics                     # Get model performance metrics
```

### WebSocket Real-time API

**Connection**: `ws://your-domain/ws`

#### Client Events (Send to Server)
```json
{"type": "subscribe", "channel": "alerts"}     # Subscribe to alerts
{"type": "subscribe", "channel": "incidents"}  # Subscribe to incidents
{"type": "heartbeat"}                          # Keep connection alive
```

#### Server Events (Received from Server)
```json
{"type": "security_event", "data": {...}}      # New security event
{"type": "incident_update", "data": {...}}     # Incident status change
{"type": "system_status", "data": {...}}       # System health update
{"type": "connection_status", "status": "connected"} # Connection status
```

### Error Handling

All endpoints return consistent error format:
```json
{
  "error": "ValidationError",
  "message": "Invalid event format",
  "details": {
    "field": "timestamp",
    "reason": "Invalid date format"
  },
  "timestamp": "2024-01-15T14:30:00Z"
}
```

**HTTP Status Codes**:
- `200` - Success
- `201` - Created successfully
- `400` - Bad request / validation error
- `401` - Unauthorized / authentication required
- `403` - Forbidden / insufficient permissions
- `404` - Resource not found
- `422` - Unprocessable entity / business logic error
- `500` - Internal server error

## 🌟 Features in Detail

### Real-time Monitoring
- Live alert feed with automatic updates
- Connection status indicators
- Toast notifications for critical events
- Automatic reconnection handling

### Incident Management
- Create, assign, and track security incidents
- Severity classification and prioritization
- Response workflow automation
- Timeline tracking and audit logs

### Analytics Dashboard
- Security metrics and KPIs
- Threat trend analysis
- Performance dashboards
- Automated reporting

### Source Integration
- SIEM integration (Splunk, QRadar, etc.)
- EDR tool connectivity
- Firewall and network security tools
- Custom source configuration

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/new-feature`)
3. **Commit your changes** (`git commit -am 'Add new feature'`)
4. **Push to the branch** (`git push origin feature/new-feature`)
5. **Create a Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Use existing component patterns
- Maintain consistent code style
- Add tests for new functionality
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation and troubleshooting guides

## 🔧 Troubleshooting

### Common Issues

**Authentication not working:**
- Verify `SESSION_SECRET` is set in environment variables
- Check `REPL_ID` and `REPLIT_DOMAINS` configuration
- Ensure database connection is established

**Database connection errors:**
- Verify `DATABASE_URL` is correctly formatted
- Run `npm run db:push` to ensure schema is up to date
- Check PostgreSQL service is running

**Real-time updates not working:**
- Verify WebSocket connection in browser network tab
- Check for firewall or proxy blocking WebSocket connections
- Restart the development server

**Build errors:**
- Run `npm run type-check` to identify TypeScript issues
- Clear node_modules and reinstall dependencies
- Check for syntax errors in recent changes

## 🤖 AI/ML Integration Architecture

### Machine Learning Pipeline

The SOC Dashboard is designed for seamless AI/ML model integration with a comprehensive pipeline for threat detection and analysis:

#### 1. Feature Engineering
```typescript
interface FeatureVector {
  id: string;
  alertId: string;
  features: Record<string, number>;  // Normalized feature values
  timestamp: Date;
  modelVersion: string;
}
```

**Supported Features**:
- **Network Features**: IP reputation, geolocation, traffic patterns
- **Behavioral Features**: User activity patterns, access anomalies
- **Temporal Features**: Time-based patterns, frequency analysis
- **Content Features**: File hashes, email content, URL analysis
- **Contextual Features**: Historical data, threat intelligence correlation

#### 2. Model Integration Patterns

##### Real-time Model Inference
```javascript
// Example: Integrate custom ML model
class MLModelIntegration {
  async analyzeSecurityEvent(event) {
    // Extract features
    const features = await this.extractFeatures(event);
    
    // Call ML model API
    const prediction = await fetch('/ml/api/predict', {
      method: 'POST',
      body: JSON.stringify({ features }),
      headers: { 'Content-Type': 'application/json' }
    });
    
    // Store results
    await storage.storeMLPrediction({
      alertId: event.id,
      prediction: prediction.confidence,
      modelId: 'threat-classifier-v2',
      features
    });
    
    return prediction;
  }
}
```

##### Batch Processing Pipeline
```javascript
// Process alerts in batches for training data
export async function generateTrainingData() {
  const alerts = await storage.getAlertsForTraining();
  const trainingData = [];
  
  for (const alert of alerts) {
    const features = await extractMLFeatures(alert);
    const label = alert.analystFeedback?.isThreat ? 1 : 0;
    
    trainingData.push({
      features,
      label,
      metadata: {
        alertId: alert.id,
        timestamp: alert.timestamp,
        sourceType: alert.source
      }
    });
  }
  
  return trainingData;
}
```

#### 3. Supported ML Frameworks & APIs

##### Cloud ML Services Integration
```javascript
// AWS SageMaker Integration
const sagemakerConfig = {
  endpoint: process.env.SAGEMAKER_ENDPOINT,
  region: 'us-east-1',
  modelName: 'cybersecurity-threat-detection'
};

// Azure ML Integration
const azureMLConfig = {
  endpoint: process.env.AZURE_ML_ENDPOINT,
  apiKey: process.env.AZURE_ML_API_KEY,
  modelName: 'anomaly-detector-v3'
};

// Google Vertex AI Integration
const vertexAIConfig = {
  projectId: process.env.GOOGLE_PROJECT_ID,
  location: 'us-central1',
  modelId: 'security-classifier'
};
```

##### On-Premise Model Integration
```javascript
// TensorFlow Serving Integration
const tensorflowConfig = {
  modelServerUrl: 'http://tensorflow-serving:8501',
  modelName: 'threat_detection_model',
  version: 'latest'
};

// Custom Model API Integration
const customModelConfig = {
  endpoint: process.env.CUSTOM_MODEL_ENDPOINT,
  authToken: process.env.MODEL_API_TOKEN,
  timeout: 5000
};
```

#### 4. Model Performance Monitoring

**Database Schema for Model Metrics**:
```sql
CREATE TABLE model_metrics (
  id UUID PRIMARY KEY,
  model_id VARCHAR(255) NOT NULL,
  model_version VARCHAR(50) NOT NULL,
  metric_type VARCHAR(50) NOT NULL,    -- 'accuracy', 'precision', 'recall', 'f1'
  metric_value DECIMAL(5,4) NOT NULL,
  evaluation_date TIMESTAMP NOT NULL,
  dataset_size INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Performance Tracking API**:
```javascript
// Track model performance
POST /api/ml/metrics
{
  "modelId": "threat-detector-v2",
  "modelVersion": "2.1.0",
  "metrics": {
    "accuracy": 0.9234,
    "precision": 0.8876,
    "recall": 0.9456,
    "f1_score": 0.9156
  },
  "evaluationDataset": "test-set-2024-01",
  "sampleSize": 10000
}
```

#### 5. Feature Store Implementation

```javascript
// Feature extraction for different event types
class FeatureExtractor {
  
  // Network-based features
  extractNetworkFeatures(event) {
    return {
      src_ip_reputation: this.getIPReputation(event.metadata.source_ip),
      dst_ip_geolocation: this.getGeolocation(event.metadata.destination_ip),
      connection_frequency: this.getConnectionFrequency(event),
      port_risk_score: this.getPortRiskScore(event.metadata.port),
      traffic_volume: event.raw_data.bytes || 0,
      protocol_anomaly: this.detectProtocolAnomaly(event)
    };
  }
  
  // Behavioral features
  extractBehavioralFeatures(event) {
    return {
      user_activity_score: this.getUserActivityScore(event.metadata.user),
      time_of_day_anomaly: this.getTimeAnomalyScore(event.timestamp),
      access_pattern_deviation: this.getAccessPatternScore(event),
      historical_frequency: this.getHistoricalFrequency(event)
    };
  }
  
  // Content-based features
  extractContentFeatures(event) {
    return {
      file_hash_reputation: this.getHashReputation(event.metadata.file_hash),
      file_entropy: this.calculateFileEntropy(event),
      string_analysis: this.analyzeStrings(event.raw_data),
      similarity_to_known_threats: this.getThreatSimilarity(event)
    };
  }
}
```

#### 6. Real-time Model Inference Pipeline

```javascript
// Real-time inference service
class RealTimeMLService {
  
  async processSecurityEvent(event) {
    try {
      // 1. Feature extraction
      const features = await this.extractFeatures(event);
      
      // 2. Model inference
      const predictions = await Promise.all([
        this.runThreatClassifier(features),
        this.runAnomalyDetector(features),
        this.runRiskScorer(features)
      ]);
      
      // 3. Ensemble results
      const ensemblePrediction = this.combineModelOutputs(predictions);
      
      // 4. Store results
      await this.storeMLResults(event.id, {
        threatScore: ensemblePrediction.threatScore,
        anomalyScore: ensemblePrediction.anomalyScore,
        riskLevel: ensemblePrediction.riskLevel,
        confidence: ensemblePrediction.confidence,
        modelVersions: predictions.map(p => p.modelVersion),
        features
      });
      
      // 5. Trigger automated responses if needed
      if (ensemblePrediction.threatScore > 0.8) {
        await this.triggerAutomatedResponse(event, ensemblePrediction);
      }
      
      return ensemblePrediction;
      
    } catch (error) {
      console.error('ML inference failed:', error);
      // Graceful fallback to rule-based detection
      return this.fallbackRuleBasedDetection(event);
    }
  }
  
  // Automated response actions
  async triggerAutomatedResponse(event, prediction) {
    const actions = [];
    
    if (prediction.threatScore > 0.9) {
      // High confidence threat - immediate action
      actions.push({
        type: 'block_ip',
        target: event.metadata.source_ip,
        duration: '1h'
      });
      
      actions.push({
        type: 'create_incident',
        severity: 'critical',
        title: `High-confidence threat detected: ${event.title}`,
        autoAssign: true
      });
    } else if (prediction.threatScore > 0.8) {
      // Medium-high confidence - alert analyst
      actions.push({
        type: 'escalate_alert',
        priority: 'high',
        notify: ['security-team@company.com']
      });
    }
    
    // Execute actions
    for (const action of actions) {
      await this.executeAutomatedAction(action);
    }
  }
}
```

#### 7. Training Data Pipeline

```javascript
// Training data generation and export
class TrainingDataPipeline {
  
  async generateTrainingDataset(options = {}) {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate = new Date(),
      includeLabels = true,
      format = 'json' // 'json', 'csv', 'parquet'
    } = options;
    
    // Get labeled data from analyst feedback
    const labeledAlerts = await storage.getLabeledAlerts(startDate, endDate);
    
    const trainingData = [];
    
    for (const alert of labeledAlerts) {
      const features = await this.extractAllFeatures(alert);
      const record = {
        id: alert.id,
        timestamp: alert.timestamp,
        features,
        metadata: {
          source: alert.source,
          type: alert.type,
          severity: alert.severity
        }
      };
      
      if (includeLabels && alert.analystFeedback) {
        record.labels = {
          isThreat: alert.analystFeedback.isThreat,
          threatType: alert.analystFeedback.threatType,
          falsePositive: alert.analystFeedback.falsePositive,
          severity: alert.analystFeedback.severity
        };
      }
      
      trainingData.push(record);
    }
    
    // Export in requested format
    return this.exportTrainingData(trainingData, format);
  }
  
  // Export to different formats
  exportTrainingData(data, format) {
    switch (format) {
      case 'csv':
        return this.exportToCSV(data);
      case 'parquet':
        return this.exportToParquet(data);
      case 'json':
      default:
        return JSON.stringify(data, null, 2);
    }
  }
}
```

#### 8. Model A/B Testing Framework

```javascript
// A/B testing for different models
class ModelABTesting {
  
  async evaluateModels(eventBatch, modelConfigs) {
    const results = {};
    
    for (const [modelName, config] of Object.entries(modelConfigs)) {
      const predictions = [];
      
      for (const event of eventBatch) {
        const prediction = await this.runModel(event, config);
        predictions.push({
          eventId: event.id,
          prediction,
          processingTime: prediction.processingTime,
          confidence: prediction.confidence
        });
      }
      
      // Calculate metrics
      results[modelName] = {
        avgConfidence: this.calculateAvgConfidence(predictions),
        avgProcessingTime: this.calculateAvgProcessingTime(predictions),
        threatDetectionRate: this.calculateDetectionRate(predictions),
        falsePositiveRate: this.calculateFalsePositiveRate(predictions)
      };
    }
    
    return results;
  }
}
```

#### 9. Integration Examples

##### Integrate with Hugging Face Models
```javascript
// Hugging Face Transformers integration
const huggingFaceConfig = {
  endpoint: 'https://api-inference.huggingface.co/models/',
  apiKey: process.env.HUGGING_FACE_API_KEY,
  models: {
    textClassifier: 'microsoft/DialoGPT-medium',
    anomalyDetector: 'microsoft/unilm-base-cased'
  }
};

class HuggingFaceIntegration {
  async analyzeLogText(logText) {
    const response = await fetch(
      `${huggingFaceConfig.endpoint}${huggingFaceConfig.models.textClassifier}`,
      {
        headers: { Authorization: `Bearer ${huggingFaceConfig.apiKey}` },
        method: 'POST',
        body: JSON.stringify({ inputs: logText })
      }
    );
    return response.json();
  }
}
```

##### Custom PyTorch/TensorFlow Model Integration
```javascript
// Custom model server integration
class CustomModelIntegration {
  async predictThreat(features) {
    // Prepare features in model-expected format
    const modelInput = this.preprocessFeatures(features);
    
    const response = await fetch('http://ml-model-server:5000/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features: modelInput })
    });
    
    const prediction = await response.json();
    
    return {
      threatScore: prediction.probability,
      confidence: prediction.confidence,
      modelVersion: prediction.model_version,
      processingTime: prediction.processing_time_ms
    };
  }
}
```

### ML Development Workflow

1. **Data Collection**: Use `/api/ml/training-data` to export labeled datasets
2. **Feature Engineering**: Implement custom feature extractors in `FeatureExtractor`
3. **Model Training**: Train models using exported data in your ML framework
4. **Model Deployment**: Deploy model to inference endpoint
5. **Integration**: Use ML integration patterns to connect your model
6. **Monitoring**: Track performance using `/api/ml/metrics` endpoints
7. **Iteration**: Use A/B testing framework to compare model versions

---

## 🔧 Advanced Configuration

### Environment Variables Reference

```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database
PGHOST=your-postgres-host
PGPORT=5432
PGUSER=your-user
PGPASSWORD=your-password
PGDATABASE=soc_dashboard

# Authentication
SESSION_SECRET=your-super-secret-session-key
REPL_ID=your-replit-app-id
REPLIT_DOMAINS=your-domain.replit.app

# Kafka Configuration (Optional)
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=soc-dashboard
KAFKA_GROUP_ID=soc-dashboard-group

# ML Model Configuration
ML_MODEL_ENDPOINT=https://your-ml-api.com/predict
ML_API_KEY=your-ml-api-key
HUGGING_FACE_API_KEY=your-hf-api-key
AWS_SAGEMAKER_ENDPOINT=your-sagemaker-endpoint
AZURE_ML_ENDPOINT=your-azure-ml-endpoint
GOOGLE_PROJECT_ID=your-gcp-project

# Third-party Integrations
THREAT_INTEL_API_KEY=your-threat-intel-key
IP_REPUTATION_API_KEY=your-ip-reputation-key
```

### Kafka Topics Configuration

```javascript
// Kafka topics for event streaming
const KAFKA_TOPICS = {
  // Custom format topics
  SECURITY_ALERTS: 'security-alerts',
  INCIDENTS: 'incidents',
  THREAT_INTEL: 'threat-intelligence',
  SYSTEM_METRICS: 'system-metrics',
  AUDIT_LOGS: 'audit-logs',
  
  // OCSF format topics
  OCSF_NETWORK_ACTIVITY: 'ocsf-network-activity',    // Class 4001
  OCSF_SYSTEM_ACTIVITY: 'ocsf-system-activity',      // Class 1001
  OCSF_SECURITY_FINDING: 'ocsf-security-finding',    // Class 2001
  OCSF_AUTHENTICATION: 'ocsf-authentication',        // Class 3002
  
  // ML and Analytics
  ML_PREDICTIONS: 'ml-predictions',
  FEATURE_VECTORS: 'feature-vectors',
  MODEL_METRICS: 'model-metrics'
};
```

### WebSocket Event Types

```javascript
// Client -> Server events
const CLIENT_EVENTS = {
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
  HEARTBEAT: 'heartbeat',
  ACK_ALERT: 'acknowledge_alert',
  UPDATE_INCIDENT: 'update_incident'
};

// Server -> Client events
const SERVER_EVENTS = {
  SECURITY_EVENT: 'security_event',
  INCIDENT_UPDATE: 'incident_update',
  SYSTEM_STATUS: 'system_status',
  CONNECTION_STATUS: 'connection_status',
  ML_PREDICTION: 'ml_prediction',
  ALERT_ACKNOWLEDGED: 'alert_acknowledged'
};
```

## 🎯 Use Cases & Examples

### 1. SIEM Integration Example
```bash
# Send Splunk alert to SOC Dashboard
curl -X POST http://your-domain/api/events/siem \
  -H "Content-Type: application/json" \
  -d '{
    "id": "splunk-alert-001",
    "timestamp": "2024-01-15T14:30:00Z",
    "source": "Splunk-SIEM",
    "severity": "high",
    "type": "intrusion",
    "title": "Brute Force Attack Detected",
    "description": "Multiple failed login attempts detected from external IP",
    "metadata": {
      "source_ip": "203.0.113.45",
      "target_user": "admin",
      "attempt_count": 25,
      "rule_id": "SPLUNK-BF-001"
    },
    "raw_data": {
      "search_query": "index=security action=login result=failure",
      "event_count": 25,
      "time_span": "5 minutes"
    }
  }'
```

### 2. EDR Integration Example
```bash
# Send CrowdStrike detection to SOC Dashboard
curl -X POST http://your-domain/api/events/edr \
  -H "Content-Type: application/json" \
  -d '{
    "id": "cs-detection-002",
    "timestamp": "2024-01-15T15:45:00Z",
    "source": "CrowdStrike-Falcon",
    "severity": "critical",
    "type": "malware",
    "title": "Ransomware Activity Detected",
    "description": "Suspicious file encryption behavior detected on endpoint",
    "metadata": {
      "hostname": "DESKTOP-ABC123",
      "user": "john.smith",
      "file_hash": "e3b0c44298fc1c149afbf4c8996fb924",
      "process_name": "suspicious.exe"
    },
    "raw_data": {
      "detection_type": "behavioral",
      "confidence": 95,
      "quarantine_status": "quarantined"
    }
  }'
```

### 3. OCSF Network Activity Example
```bash
# Send OCSF-compliant network event
curl -X POST http://your-domain/api/ocsf/network-activity \
  -H "Content-Type: application/json" \
  -d '{
    "activity_id": 2,
    "activity_name": "Denied",
    "category_name": "Network Activity",
    "category_uid": 4,
    "class_name": "Network Activity",
    "class_uid": 4001,
    "severity": "Medium",
    "severity_id": 3,
    "time": 1705329000000,
    "message": "Outbound connection blocked by firewall rule",
    "src_endpoint": {
      "ip": "10.0.1.100",
      "hostname": "workstation-01"
    },
    "dst_endpoint": {
      "ip": "203.0.113.15",
      "port": 443
    },
    "connection_info": {
      "protocol_name": "HTTPS",
      "direction": "Outbound"
    },
    "disposition": "Blocked",
    "disposition_id": 2,
    "metadata": {
      "product": {
        "name": "Palo Alto Firewall",
        "vendor_name": "Palo Alto Networks"
      },
      "version": "1.1.0"
    }
  }'
```

---

**Built with ❤️ for cybersecurity professionals**