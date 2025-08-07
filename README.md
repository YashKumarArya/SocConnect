# SOC Dashboard - Security Operations Center

A comprehensive, real-time Security Operations Center (SOC) dashboard for cybersecurity monitoring, incident management, and threat analysis. Built with modern web technologies and featuring enterprise-grade authentication, real-time updates, and advanced analytics.

![SOC Dashboard](https://img.shields.io/badge/Status-Active-brightgreen) ![Version](https://img.shields.io/badge/Version-1.0.0-blue) ![License](https://img.shields.io/badge/License-MIT-green)

## 🚀 Features

### Core Security Operations
- **Real-time Alert Management** - Live monitoring and processing of security alerts from multiple sources
- **Incident Response** - Streamlined incident tracking, assignment, and resolution workflows
- **Threat Analytics** - Advanced threat correlation and intelligence integration
- **Source Integration** - Support for SIEM, EDR, Firewall, and other security tools
- **Dashboard Analytics** - Comprehensive performance metrics and automated reporting

### Technical Features
- **Real-time Communication** - WebSocket-based live updates and notifications
- **Authentication System** - Secure OAuth 2.0/OIDC integration with Replit
- **Role-based Access** - Analyst and admin user roles with appropriate permissions
- **Modern UI/UX** - Dark-themed interface optimized for SOC environments
- **Responsive Design** - Mobile-first approach with cross-device compatibility
- **Type Safety** - Full TypeScript implementation with end-to-end type safety

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript for modern, type-safe development
- **Radix UI + shadcn/ui** for accessible, customizable components
- **Tailwind CSS** with custom dark theme optimized for SOC environments
- **TanStack React Query** for efficient server state management
- **Wouter** for lightweight client-side routing
- **WebSocket integration** for real-time updates

### Backend
- **Node.js + Express.js** with TypeScript
- **Drizzle ORM** for type-safe database operations
- **PostgreSQL** database with session storage
- **WebSocket server** for real-time communication
- **Passport.js** for authentication middleware

### Database
- **PostgreSQL** with Drizzle ORM for schema management
- **Session storage** using connect-pg-simple
- **Automated migrations** with Drizzle Kit

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
- **users** - User accounts and profile information
- **sessions** - Authentication session storage
- **sources** - Security tool configurations (SIEM, EDR, etc.)
- **raw_alerts** - Incoming security events
- **normalized_alerts** - Processed and standardized alerts
- **incidents** - Security incident management
- **actions** - Response tracking and audit trail
- **feedback** - Analyst feedback for model improvement

### Schema Management
```bash
# Push schema changes to database
npm run db:push

# Generate schema migrations
npm run db:generate

# View database in Drizzle Studio
npm run db:studio
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
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   └── App.tsx         # Main application component
├── server/                 # Backend Express application
│   ├── db.ts              # Database connection
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Data access layer
│   ├── replitAuth.ts      # Authentication configuration
│   └── index.ts           # Server entry point
├── shared/                 # Shared TypeScript definitions
│   └── schema.ts          # Database schema and types
└── package.json           # Dependencies and scripts
```

### Code Quality
- **TypeScript** for type safety across frontend and backend
- **ESLint** for code linting and consistency
- **Path aliases** (@, @shared) for clean imports
- **Strict mode** enabled for enhanced type checking

## 🔌 API Endpoints

### Authentication
- `GET /api/login` - Initiate OAuth login flow
- `GET /api/logout` - End user session and logout
- `GET /api/callback` - OAuth callback handler
- `GET /api/auth/user` - Get current authenticated user

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics and metrics
- `GET /api/incidents` - List security incidents
- `GET /api/alerts` - List and filter security alerts
- `GET /api/sources` - Security source configurations

### Real-time
- **WebSocket** connection at `/ws` for live updates
- Events: `alert_created`, `incident_updated`, `system_status`

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

---

**Built with ❤️ for cybersecurity professionals**