# Overview

This is a full-stack Security Operations Center (SOC) dashboard application built with React frontend and Express.js backend. The system provides real-time monitoring, alert management, incident response, and analytics for cybersecurity operations. It features a modern dark-themed UI optimized for SOC environments with real-time WebSocket communication, comprehensive alert processing, and machine learning integration for automated threat detection.

# User Preferences

Preferred communication style: Simple, everyday language.

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
- **Real-time**: WebSocket server for broadcasting live updates to connected clients
- **API Design**: RESTful endpoints with JSON communication
- **Development**: Hot reload with Vite middleware integration

## Database Design
- **Database**: PostgreSQL with Drizzle ORM for schema management
- **Schema Structure**:
  - Users table for analyst/admin roles
  - Sources table for security tool configurations (SIEM, EDR, Firewall)
  - Raw alerts table for incoming security events
  - Normalized alerts table for processed/standardized alerts
  - Feature vectors table for ML-based analysis
  - Incidents table for security incident management
  - Actions table for response tracking
  - Feedback table for analyst input and model improvement
  - Model metrics table for performance monitoring
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