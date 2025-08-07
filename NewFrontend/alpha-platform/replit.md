# Agentic AI SOC Platform

## Overview

This is a modern cybersecurity SaaS landing page for "Alpha" - an "Agentic AI SOC Platform" built with React, TypeScript, and Express.js. The application features a sleek, dark-themed design with neon glow accents targeting cybersecurity professionals. The platform serves as a marketing website with demo request functionality, showcasing an AI-powered Security Operations Center solution that promises intelligent automation and 24/7 threat monitoring.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

**Frontend Architecture**
- React 18 with TypeScript for type safety and modern development
- Vite as the build tool for fast development and optimized production builds
- Tailwind CSS for utility-first styling with custom cybersecurity theme colors
- Shadcn/ui component library for consistent, accessible UI components
- Framer Motion for smooth animations and transitions
- React Hook Form with Zod validation for form handling
- TanStack Query for server state management and API calls
- Wouter for lightweight client-side routing

**Backend Architecture**  
- Express.js server with TypeScript for API endpoints
- RESTful API design with proper error handling and request logging
- In-memory storage implementation (MemStorage) as the current data layer
- Modular route registration system for scalable API organization
- Built-in development middleware for request/response logging

**Database Schema**
- Drizzle ORM with PostgreSQL dialect configured for production use
- Two main entities: users (authentication) and demo_requests (lead capture)
- Schema validation using Drizzle-Zod for type-safe database operations
- Migration system ready for database schema changes

**Styling and Design System**
- Dark theme with cybersecurity-focused color palette
- CSS custom properties for consistent theming
- Neon teal (#00F6D2) and glowing purple (#A259FF) accent colors
- Deep black (#0B0C10) primary background
- Custom button variants including "glow" effects
- Responsive design with mobile-first approach

**Development and Build Process**
- ESBuild for server-side bundling in production
- Hot module replacement in development via Vite
- TypeScript strict mode for enhanced type safety
- Path mapping for clean imports (@/, @shared/, @assets/)
- Separate client and server build processes

**Form Handling and Validation**
- Demo request form with comprehensive field validation
- Email validation, required field checking, and optional field support  
- Toast notifications for user feedback
- Optimistic UI updates with proper error handling

**State Management**
- TanStack Query for server state with automatic caching
- React Context for UI state (toasts, mobile detection)
- Form state managed by React Hook Form
- Component-level state for UI interactions

**API Design**
- POST /api/demo-requests for lead capture
- GET /api/demo-requests for admin access to submissions
- Consistent error response format with proper HTTP status codes
- Request validation using Zod schemas
- CORS and security middleware ready for production

## External Dependencies

**UI and Styling**
- Radix UI primitives for accessible, unstyled components
- Tailwind CSS for utility-first styling and responsive design
- Framer Motion for animations and micro-interactions
- Lucide React for consistent iconography

**Forms and Validation**
- React Hook Form for performant form handling
- Zod for runtime type validation and schema definition
- Hookform/resolvers for seamless Zod integration

**Development Tools**
- Vite with React plugin for fast development builds
- TypeScript for static type checking
- ESLint and Prettier configurations (implied by project structure)
- Replit-specific development tools and error overlays

**Server Dependencies**
- Express.js for HTTP server and middleware
- Drizzle ORM for database operations and migrations
- Connect-pg-simple for session storage (configured but not actively used)
- Date-fns for date manipulation utilities

**Database**
- PostgreSQL as the primary database (configured via Drizzle)
- Neon Database serverless driver for cloud database connectivity
- Database connection configured via DATABASE_URL environment variable

**Build and Runtime**
- Node.js ESM modules for modern JavaScript features
- tsx for TypeScript execution in development
- esbuild for production server bundling
- PostCSS for CSS processing and autoprefixing