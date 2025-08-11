# Overview

This is a comprehensive SOC platform with machine learning for automated threat detection (99.58% accuracy, 3 classes, 3.2M parameters), featuring Neo4j graph database capabilities, OCSF (Open Cybersecurity Schema Framework) normalization pipeline, real-time security event processing, and agentic AI integration. The system implements the complete architecture: Alert Sources → API Endpoints → Data Enrichment → OCSF Normalization → Database Storage → ML Model (via Kafka) + Neo4j Graph Analysis (via Agentic AI). The application processes 4,000+ authentic security alerts from CrowdStrike, Email, Firewall, and SentinelOne sources through OCSF-compliant pipelines for ML model compatibility.

# User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (August 11, 2025)
- **Pipeline Architecture Update**: Restructured to Enhancement → OCSF Standardization order for better enriched data standardization
- **Database Schema Alignment**: Updated OCSF events and enhanced normalized alerts tables to match exact ML model attributes for 99.58% accuracy  
- **ML Model Attributes**: Added class_uid, category_uid, activity_id, severity_id, src_ip, dst_ip, username, hostname, disposition_id, confidence_score, product_name, vendor_name
- **Enhanced Intelligence Layer**: Added comprehensive enrichment with geo-location, user context, threat intel, asset context, risk scoring
- **OCSF Standardization**: All enriched attributes now follow OCSF standards for ML model compatibility

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **UI Components**: Radix UI with shadcn/ui component system for accessible, customizable components
- **Styling**: Tailwind CSS with custom dark theme optimized for SOC environments
- **State Management**: TanStack React Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: WebSocket integration for live updates and notifications
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture  
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules for modern JavaScript features
- **Database ORM**: Drizzle ORM for type-safe database operations
- **OCSF Normalization**: Complete pipeline for ML model compatibility (99.58% accuracy)
- **Agentic AI Integration**: Neo4j graph analysis with intelligent threat assessment
- **Real-time**: WebSocket server + Kafka for ML model communication
- **API Design**: RESTful endpoints with OCSF processing capabilities
- **Development**: Hot reload with Vite middleware integration

## Database Design
- **Primary Database**: PostgreSQL with Drizzle ORM for schema management
- **Graph Database**: Neo4j for relationship analysis and attack pattern detection
- **Schema Structure**:
  - Users table for analyst/admin roles
  - Sources table for security tool configurations (SIEM, EDR, Firewall)
  - Raw alerts table for incoming security events
  - **OCSF Events table** for ML-compatible normalized events
  - **Enhanced Normalized Alerts** with OCSF attribute mapping
  - Feature vectors table for ML-based analysis
  - Incidents table with graph relationship tracking
  - Actions table for automated response tracking
  - Feedback table for analyst input and model improvement
  - Model metrics table for performance monitoring (99.58% accuracy tracking)
- **Neo4j Graph Schema**: Security events, IP addresses, users, hosts with relationship mapping
- **Migrations**: Drizzle Kit for schema versioning and deployment

## Real-time Communication
- **WebSocket Server**: Integrated with HTTP server for bidirectional communication
- **Connection Management**: Automatic reconnection with status indicators
- **Event Broadcasting**: Real-time alerts, incident updates, and system notifications
- **Client Handling**: Graceful connection management with cleanup on disconnect

## Security and Authentication
- **Session Management**: Connect-pg-simple for PostgreSQL-backed sessions
- **Role-based Access**: Analyst and admin user roles with appropriate permissions
- **Data Validation**: Zod schemas for runtime type checking and validation
- **Input Sanitization**: Form validation with React Hook Form and Zod resolvers

## UI/UX Design Patterns
- **Component Architecture**: Modular, reusable components with consistent design patterns
- **Responsive Design**: Mobile-first approach with breakpoint-specific layouts
- **Accessibility**: WCAG compliance through Radix UI primitives
- **Dark Theme**: SOC-optimized color scheme with high contrast for extended use
- **Loading States**: Skeleton components and loading indicators for better UX
- **Error Handling**: Toast notifications and error boundaries for user feedback

## Development Workflow
- **Type Safety**: End-to-end TypeScript with shared schemas between frontend/backend
- **Code Quality**: ESLint and TypeScript compiler checks
- **Development Server**: Vite with HMR and Express.js middleware integration
- **Build Process**: Separate client and server builds with optimized outputs
- **Path Aliases**: Simplified imports with @ and @shared path mapping

# OCSF Architecture Implementation

## Complete Data Flow Pipeline
**Alert Sources → API Endpoints → Enhancement/Enrichment → OCSF Standardization → Database Storage → ML Model (via Kafka) + Neo4j Graph Analysis (via Agentic AI)**

## Key Components Added (August 11, 2025)
- **server/ocsfNormalization.ts**: Complete OCSF normalization pipeline for ML compatibility
- **server/agenticAI.ts**: Neo4j graph analysis with intelligent threat assessment
- **Enhanced Routes**: OCSF processing endpoints (`/api/alerts/process-ocsf`, `/api/ocsf/events`)
- **ML Integration**: Feature extraction and verdict processing for 99.58% accuracy model
- **Graph Intelligence**: Attack pattern detection, compromised asset identification

## Authentic Data Processing
- **4,000+ Real Security Alerts**: CrowdStrike, Email, Firewall, SentinelOne sources
- **OCSF Compliance**: All alerts normalized to OCSF standard for ML model training
- **Real-time Processing**: WebSocket + Kafka integration for live ML verdicts
- **Graph Relationships**: Neo4j tracking of IP addresses, users, hosts, and attack chains

# External Dependencies

## Core Framework Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL serverless database driver
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect support
- **express**: Web application framework for Node.js
- **react**: UI library with hooks and modern features
- **vite**: Build tool and development server

## UI and Component Libraries  
- **@radix-ui/***: Accessible, unstyled UI primitives (dialogs, forms, navigation)
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant system
- **lucide-react**: Icon library with React components

## Data and State Management
- **@tanstack/react-query**: Server state management and caching
- **react-hook-form**: Form handling with validation
- **@hookform/resolvers**: Form validation resolvers
- **zod**: Runtime type validation and schema definition

## Development and Build Tools
- **typescript**: Static type checking
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production
- **@replit/vite-plugin-***: Replit-specific development plugins

## Real-time and Communication
- **ws**: WebSocket library for real-time communication
- **connect-pg-simple**: PostgreSQL session store

## Utilities and Helpers
- **date-fns**: Date manipulation library
- **clsx**: Conditional CSS class utility
- **cmdk**: Command palette component
- **nanoid**: URL-safe unique ID generator