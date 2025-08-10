import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, AnimatePresence } from "framer-motion";

gsap.registerPlugin(ScrollTrigger);
import { ArrowLeft, Settings, Bell, User, Shield, AlertTriangle, CheckCircle, Search, Filter, BarChart3, Activity, Eye, Clock, TrendingUp, Target, Zap, Brain, Calendar, MessageSquare, Download, Moon, Sun, PieChart, LineChart, TrendingDown, Bot, Lightbulb, FileText, RefreshCw, ArrowRight, PlayCircle, PauseCircle, UserCheck, X, ThumbsUp, ThumbsDown, Workflow, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { ThreatVisualization } from "@/components/ui/threat-visualization";
import { SimulationControls } from "@/components/ui/simulation-controls";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

type AlertSeverity = "Critical" | "High" | "Medium" | "Low";
type AlertStatus = "Active" | "Investigating" | "Resolved";

interface Alert {
  id: string;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  assignedAnalyst: string;
  time: string;
  source: string;
  confidence: number;
  aiRecommendation: string;
  rootCause?: string;
}

interface ModelResponse {
  id: string;
  timestamp: string;
  prediction: string;
  confidence: number;
  recommendation: string;
  status: "Processing" | "Complete" | "Failed";
  explainability: string;
}

interface AIInsight {
  type: "trend" | "anomaly" | "prediction" | "correlation";
  title: string;
  description: string;
  confidence: number;
  impact: "High" | "Medium" | "Low";
}

interface WorkflowAlert {
  id: string;
  vendorName: string;
  timestamp: string;
  severity: AlertSeverity;
  status: "incoming" | "processing" | "predicted" | "completed";
  stage: "vendor" | "ai_model" | "prediction" | "outcome";
  aiModel?: string;
  confidence?: number;
  processingTime?: number;
  outcome?: "TP" | "FP" | "Escalate";
  explanation?: string;
  escalationReason?: string;
  assignedAnalyst?: string;
}

interface EscalationItem {
  alertId: string;
  reason: string;
  assignedAnalyst: string;
  timestamp: string;
  status: "pending" | "approved" | "rejected";
}

interface AutomationMetrics {
  tpHandled: number;
  fpDismissed: number;
  totalProcessed: number;
  avgProcessingTime: number;
  confidence: {
    high: number;
    medium: number;
    low: number;
  };
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isUnauthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [nlQuery, setNlQuery] = useState("");
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [selectedWorkflowAlert, setSelectedWorkflowAlert] = useState<WorkflowAlert | null>(null);
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [escalationDecision, setEscalationDecision] = useState<"approve" | "reject" | "assign" | null>(null);
  const [workflowAlerts, setWorkflowAlerts] = useState<WorkflowAlert[]>([]);
  const [showLogoutOverlay, setShowLogoutOverlay] = useState(false);
  
  // GSAP refs
  const headerRef = useRef<HTMLElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isUnauthenticated) {
      setLocation("/login");
    }
  }, [isUnauthenticated, setLocation]);

  // Real API calls to backend
  const { data: incidents, isLoading: incidentsLoading } = useQuery({
    queryKey: ['/api/incidents'],
    queryFn: api.getIncidents,
    enabled: isAuthenticated,
  });
  
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: api.getDashboardStats,
    enabled: isAuthenticated,
  });
  
  const { data: alertDatasetStats } = useQuery({
    queryKey: ['/api/alerts/dataset-stats'],
    queryFn: api.getDatasetStats,
    enabled: isAuthenticated,
  });
  
  const { data: sources } = useQuery({
    queryKey: ['/api/sources'],
    queryFn: api.getSources,
    enabled: isAuthenticated,
  });
  
  const { data: metrics } = useQuery({
    queryKey: ['/api/metrics'],
    queryFn: api.getMetrics,
    enabled: isAuthenticated,
  });

  // Convert real data to mock format for compatibility with original UI
  const mockAlerts: Alert[] = incidents?.slice(0, 10).map((incident: any) => ({
    id: incident.id,
    severity: (incident.severity?.charAt(0).toUpperCase() + incident.severity?.slice(1)) as AlertSeverity || "Medium",
    status: (incident.status === 'open' ? 'Active' : incident.status === 'monitoring' ? 'Investigating' : 'Resolved') as AlertStatus,
    title: incident.title || `Security Incident ${incident.id.slice(-6)}`,
    assignedAnalyst: incident.assignedTo || "AI Auto-Triage",
    time: new Date(incident.createdAt).toLocaleTimeString(),
    source: "Security Platform",
    confidence: 85 + Math.floor(Math.random() * 15),
    aiRecommendation: "Investigate for potential threats and correlate with other security events",
    rootCause: incident.description || "Automated detection of suspicious activity"
  })) || [
    { 
      id: "ALT-2024-001", 
      severity: "Critical", 
      status: "Active", 
      title: "Suspicious Network Traffic Detected", 
      assignedAnalyst: "Sarah Chen", 
      time: "2 min ago", 
      source: "NGFW", 
      confidence: 95,
      aiRecommendation: "Immediate isolation of affected endpoints and traffic analysis",
      rootCause: "Potential APT group activity based on TTP correlation"
    },
    { 
      id: "ALT-2024-002", 
      severity: "High", 
      status: "Investigating", 
      title: "Potential Data Exfiltration", 
      assignedAnalyst: "Marcus Johnson", 
      time: "15 min ago", 
      source: "AWS CloudTrail", 
      confidence: 87,
      aiRecommendation: "Monitor data flows and check for unauthorized access patterns",
      rootCause: "Compromised service account credentials detected"
    },
    { 
      id: "ALT-2024-003", 
      severity: "Medium", 
      status: "Active", 
      title: "Unauthorized Access Attempt", 
      assignedAnalyst: "AI Auto-Triage", 
      time: "32 min ago", 
      source: "Okta", 
      confidence: 78,
      aiRecommendation: "Enable additional MFA verification and user behavior analysis",
      rootCause: "Credential stuffing attack from known botnet infrastructure"
    }
  ];

  const mockModelResponses: ModelResponse[] = [
    { 
      id: "MR-001", 
      timestamp: "09:45:23", 
      prediction: "DDoS Attack Pattern", 
      confidence: 94, 
      recommendation: "Activate DDoS protection and rate limiting", 
      status: "Complete",
      explainability: "Model detected anomalous traffic patterns matching known DDoS signatures. Key indicators: 300% traffic spike, unusual geographic distribution, repetitive request patterns."
    },
    { 
      id: "MR-002", 
      timestamp: "09:43:12", 
      prediction: "Phishing Campaign", 
      confidence: 89, 
      recommendation: "Block sender domains and notify users", 
      status: "Complete",
      explainability: "Email content analysis revealed suspicious URL patterns and social engineering tactics commonly used in phishing campaigns."
    },
  ];

  const mockAIInsights: AIInsight[] = [
    {
      type: "trend",
      title: "Alert Volume Increasing",
      description: `Critical alerts have increased based on recent incident data from ${incidents?.length || 0} active incidents.`,
      confidence: 87,
      impact: "High"
    },
    {
      type: "prediction",
      title: "Forecasted Peak Activity",
      description: "AI predicts increased security incidents based on current threat patterns and data source activity.",
      confidence: 82,
      impact: "Medium"
    },
    {
      type: "correlation",
      title: "Source Correlation Detected",
      description: `Analysis of ${sources?.length || 0} active data sources shows coordinated patterns requiring attention.`,
      confidence: 91,
      impact: "High"
    },
    {
      type: "anomaly",
      title: "Unusual User Behavior",
      description: "Detected anomalous login patterns for multiple users outside normal business hours with geographic inconsistencies.",
      confidence: 76,
      impact: "Medium"
    }
  ];

  const mockAutomationMetrics: AutomationMetrics = {
    tpHandled: alertDatasetStats?.stats?.total ? Math.floor(alertDatasetStats.stats.total * 0.4) : 847,
    fpDismissed: alertDatasetStats?.stats?.total ? Math.floor(alertDatasetStats.stats.total * 0.6) : 1203,
    totalProcessed: alertDatasetStats?.stats?.total || 2156,
    avgProcessingTime: 2.3,
    confidence: {
      high: 67,
      medium: 28,
      low: 5
    }
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Dashboard entrance animations
      if (headerRef.current) {
        gsap.fromTo(headerRef.current,
          { y: -50, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
        );
      }

      if (sidebarRef.current) {
        gsap.fromTo(sidebarRef.current,
          { x: -250, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.6, delay: 0.2, ease: "power3.out" }
        );
      }

      if (mainRef.current) {
        gsap.fromTo(mainRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, delay: 0.4, ease: "power2.out" }
        );
      }

      // Stats cards animation
      if (statsRef.current) {
        gsap.fromTo(statsRef.current.children,
          { scale: 0.9, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, stagger: 0.1, delay: 0.6, ease: "back.out(1.7)" }
        );
      }
    });

    return () => ctx.revert();
  }, [activeTab]);

  // Simulate real-time workflow updates
  useEffect(() => {
    const interval = setInterval(() => {
      setWorkflowAlerts(current => 
        current.map(alert => {
          if (alert.status === "incoming" && Math.random() > 0.7) {
            return { ...alert, status: "processing", stage: "ai_model", aiModel: "ThreatDetector v2.1" };
          }
          if (alert.status === "processing" && Math.random() > 0.8) {
            const outcomes: Array<"TP" | "FP" | "Escalate"> = ["TP", "FP", "Escalate"];
            const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
            return { 
              ...alert, 
              status: "completed", 
              stage: "outcome", 
              outcome,
              confidence: Math.floor(Math.random() * 40) + 60,
              processingTime: Math.random() * 3 + 1
            };
          }
          return alert;
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Handle logout with redirect
  useEffect(() => {
    if (showLogoutOverlay) {
      const timer = setTimeout(() => {
        setLocation("/");
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [showLogoutOverlay, setLocation]);

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case "Critical": return "text-red-400 bg-red-400/10 border-red-400/20";
      case "High": return "text-orange-400 bg-orange-400/10 border-orange-400/20";
      case "Medium": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      case "Low": return "text-green-400 bg-green-400/10 border-green-400/20";
    }
  };

  const getStatusColor = (status: AlertStatus) => {
    switch (status) {
      case "Active": return "text-red-400 bg-red-400/10";
      case "Investigating": return "text-yellow-400 bg-yellow-400/10";
      case "Resolved": return "text-green-400 bg-green-400/10";
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "trend": return <TrendingUp className="w-4 h-4" />;
      case "prediction": return <Brain className="w-4 h-4" />;
      case "correlation": return <Target className="w-4 h-4" />;
      case "anomaly": return <AlertTriangle className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const filteredAlerts = mockAlerts.filter(alert => 
    alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alert.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || incidentsLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-[hsl(215,28%,5%)] text-white p-6">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[hsl(330,100%,50%)] to-[hsl(267,100%,67%)] rounded-full mx-auto mb-4 animate-pulse"></div>
            <div className="text-xl font-semibold text-white mb-2">Loading Alpha Command Center</div>
            <div className="text-gray-400">Initializing AI models and security data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(215,28%,5%)] text-white font-['Inter']">
      {/* Enhanced Top Navigation Bar */}
      <motion.header 
        ref={headerRef}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-[hsl(215,28%,5%)]/95 backdrop-blur-sm border-b border-[hsl(330,100%,50%)]/20 px-6 py-4 sticky top-0 z-50"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/")}
              className="text-[hsl(330,100%,50%)] hover:bg-[hsl(330,100%,50%)]/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-[hsl(330,100%,50%)] to-[hsl(267,100%,67%)] rounded-3xl glow-button"></div>
              <span className="text-xl font-bold glow-text">Alpha</span>
            </div>
            <span className="text-lg text-gray-300">Command Center</span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Quick Actions */}
            <Button variant="outline" size="sm" className="border-[hsl(330,100%,50%)]/20 text-[hsl(330,100%,50%)]">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>

            {/* Dark/Light Mode Toggle */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="text-gray-300 hover:text-[hsl(330,100%,50%)] transition-colors"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            {/* System Status */}
            <div className="flex items-center space-x-2 bg-[hsl(0,0%,10%)]/50 rounded-lg px-3 py-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">AI Models Online</span>
            </div>

            <Button variant="ghost" size="icon" className="text-gray-300 hover:text-[hsl(330,100%,50%)] transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center">{incidents?.length || 0}</span>
            </Button>

            <Button variant="ghost" size="icon" className="text-gray-300 hover:text-[hsl(330,100%,50%)] transition-colors">
              <Settings className="w-5 h-5" />
            </Button>

            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-gray-300" />
              <div className="text-sm">
                <div className="text-white">Security Analyst</div>
                <div className="text-xs text-gray-400">Senior Analyst</div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="flex">
        {/* Enhanced Sidebar Navigation */}
        <motion.aside 
          ref={sidebarRef}
          initial={{ x: -250, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-64 bg-[hsl(0,0%,8%)] border-r border-[hsl(330,100%,50%)]/20 min-h-screen"
        >
          <div className="p-4 space-y-2">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${
                  activeTab === "dashboard" 
                    ? "text-[hsl(330,100%,50%)] bg-[hsl(330,100%,50%)]/10 nav-item-active" 
                    : "text-gray-300 hover:text-[hsl(330,100%,50%)] nav-item-hover"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm">Dashboard</span>
              </button>

              <button
                onClick={() => setActiveTab("alerts")}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${
                  activeTab === "alerts" 
                    ? "text-[hsl(330,100%,50%)] bg-[hsl(330,100%,50%)]/10 nav-item-active" 
                    : "text-gray-300 hover:text-[hsl(330,100%,50%)] nav-item-hover"
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">Alerts</span>
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {mockAlerts.filter(a => a.status === "Active").length}
                </span>
              </button>

              <button
                onClick={() => setLocation("/investigation")}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${
                  activeTab === "investigations" 
                    ? "text-[hsl(330,100%,50%)] bg-[hsl(330,100%,50%)]/10 nav-item-active" 
                    : "text-gray-300 hover:text-[hsl(330,100%,50%)] nav-item-hover"
                }`}
              >
                <Eye className="w-4 h-4" />
                <span className="text-sm">Investigations</span>
              </button>

              <button
                onClick={() => setActiveTab("models")}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${
                  activeTab === "models" 
                    ? "text-[hsl(330,100%,50%)] bg-[hsl(330,100%,50%)]/10 nav-item-active" 
                    : "text-gray-300 hover:text-[hsl(330,100%,50%)] nav-item-hover"
                }`}
              >
                <Brain className="w-4 h-4" />
                <span className="text-sm">Model Responses</span>
              </button>

              <button
                onClick={() => setActiveTab("analytics")}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${
                  activeTab === "analytics" 
                    ? "text-[hsl(330,100%,50%)] bg-[hsl(330,100%,50%)]/10 nav-item-active" 
                    : "text-gray-300 hover:text-[hsl(330,100%,50%)] nav-item-hover"
                }`}
              >
                <PieChart className="w-4 h-4" />
                <span className="text-sm">Analytics</span>
              </button>

              <button
                onClick={() => setActiveTab("workflow")}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${
                  activeTab === "workflow" 
                    ? "text-[hsl(330,100%,50%)] bg-[hsl(330,100%,50%)]/10 nav-item-active" 
                    : "text-gray-300 hover:text-[hsl(330,100%,50%)] nav-item-hover"
                }`}
              >
                <Workflow className="w-4 h-4" />
                <span className="text-sm">Alert Pipeline</span>
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${
                  activeTab === "settings" 
                    ? "text-[hsl(330,100%,50%)] bg-[hsl(330,100%,50%)]/10 nav-item-active" 
                    : "text-gray-300 hover:text-[hsl(330,100%,50%)] nav-item-hover"
                }`}
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm">Settings</span>
              </button>

              {/* Logout Button */}
              <button
                onClick={() => setShowLogoutOverlay(true)}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all text-red-400 hover:text-red-300 hover:bg-red-400/10"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </button>
            </nav>

            {/* Data Quality Indicator */}
            <div className="mt-8 p-3 bg-[hsl(0,0%,6%)] rounded-lg border border-[hsl(330,100%,50%)]/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">Data Quality</span>
                <span className="text-xs text-[hsl(330,100%,50%)]">96.8%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-[hsl(330,100%,50%)] h-2 rounded-full w-[96.8%]"></div>
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-2 text-xs text-gray-400 hover:text-[hsl(330,100%,50%)]">
                <RefreshCw className="w-3 h-3 mr-1" />
                Auto-clean data
              </Button>
            </div>
          </div>
        </motion.aside>

        {/* Main Content Area */}
        <main ref={mainRef} className="flex-1 p-6 bg-gradient-to-br from-[hsl(215,28%,5%)] to-[hsl(215,28%,7%)]">
          {activeTab === "dashboard" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold glow-text">AI-Powered Analytics Dashboard</h1>

                {/* Natural Language Query */}
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <MessageSquare className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[hsl(330,100%,50%)]" />
                    <Input 
                      placeholder="Ask me anything about your data..."
                      value={nlQuery}
                      onChange={(e) => setNlQuery(e.target.value)}
                      className="pl-10 bg-[hsl(0,0%,10%)]/50 border-[hsl(330,100%,50%)]/20 w-80"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setLocation("/ai-assistant")}
                    className="border-[hsl(330,100%,50%)]/20 text-[hsl(330,100%,50%)] hover:bg-[hsl(330,100%,50%)]/20"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Ask AI
                  </Button>
                </div>
              </div>

              <ThreatVisualization/>

              {/* Real-time Statistics Cards */}
              <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div className="bg-gradient-to-br from-[hsl(0,0%,8%)]/80 to-[hsl(0,0%,10%)]/60 border border-[hsl(330,100%,50%)]/20 rounded-xl p-6 hover:border-[hsl(330,100%,50%)]/40 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Active Incidents</p>
                      <p className="text-3xl font-bold text-white group-hover:text-[hsl(330,100%,50%)] transition-colors">{incidents?.length || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">Real-time monitoring</p>
                    </div>
                    <div className="p-3 bg-red-400/10 rounded-lg group-hover:bg-red-400/20 transition-colors">
                      <AlertTriangle className="w-6 h-6 text-red-400 group-hover:scale-110 transition-transform" />
                    </div>
                  </div>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-[hsl(0,0%,8%)]/80 to-[hsl(0,0%,10%)]/60 border border-[hsl(267,100%,67%)]/20 rounded-xl p-6 hover:border-[hsl(267,100%,67%)]/40 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Alerts Processed</p>
                      <p className="text-3xl font-bold text-white group-hover:text-[hsl(267,100%,67%)] transition-colors">{alertDatasetStats?.stats?.total?.toLocaleString() || '0'}</p>
                      <p className="text-xs text-gray-500 mt-1">Total dataset</p>
                    </div>
                    <div className="p-3 bg-[hsl(267,100%,67%)]/10 rounded-lg group-hover:bg-[hsl(267,100%,67%)]/20 transition-colors">
                      <Brain className="w-6 h-6 text-[hsl(267,100%,67%)] group-hover:scale-110 transition-transform" />
                    </div>
                  </div>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-[hsl(0,0%,8%)]/80 to-[hsl(0,0%,10%)]/60 border border-green-400/20 rounded-xl p-6 hover:border-green-400/40 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Data Sources</p>
                      <p className="text-3xl font-bold text-white group-hover:text-green-400 transition-colors">{sources?.length || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">Connected systems</p>
                    </div>
                    <div className="p-3 bg-green-400/10 rounded-lg group-hover:bg-green-400/20 transition-colors">
                      <Shield className="w-6 h-6 text-green-400 group-hover:scale-110 transition-transform" />
                    </div>
                  </div>
                </motion.div>

                <motion.div className="bg-gradient-to-br from-[hsl(0,0%,8%)]/80 to-[hsl(0,0%,10%)]/60 border border-blue-400/20 rounded-xl p-6 hover:border-blue-400/40 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Response Time</p>
                      <p className="text-3xl font-bold text-white group-hover:text-blue-400 transition-colors">{dashboardStats?.avgResponseTime || '0.3'}s</p>
                      <p className="text-xs text-gray-500 mt-1">Average detection</p>
                    </div>
                    <div className="p-3 bg-blue-400/10 rounded-lg group-hover:bg-blue-400/20 transition-colors">
                      <Zap className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* SOC Operations Center */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-[hsl(0,0%,8%)]/80 border border-[hsl(330,100%,50%)]/20 rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold flex items-center glow-text">
                    <Shield className="w-6 h-6 text-[hsl(330,100%,50%)] mr-2" />
                    SOC Operations Center
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-400">Live Monitoring</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Real-time Threat Landscape */}
                  <div className="bg-[hsl(0,0%,6%)]/60 border border-[hsl(330,100%,50%)]/10 rounded-lg p-4">
                    <h4 className="text-lg font-semibold mb-4 flex items-center">
                      <Target className="w-5 h-5 text-[hsl(267,100%,67%)] mr-2" />
                      Global Threat Intelligence
                    </h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-400">{incidents?.filter((inc: any) => inc.severity === 'critical').length || 12}</div>
                          <div className="text-xs text-gray-400">Critical Threats</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-400">{sources?.length ? sources.length * 45 : 180}</div>
                          <div className="text-xs text-gray-400">IOCs Tracked</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-[hsl(330,100%,50%)]">94.2%</div>
                          <div className="text-xs text-gray-400">Detection Rate</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">APT Groups</span>
                          <span className="text-red-400 font-medium">23 Active</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">Data Sources</span>
                          <span className="text-green-400 font-medium">{sources?.length || 0} Connected</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">Active Incidents</span>
                          <span className="text-yellow-400 font-medium">{incidents?.length || 0} Monitored</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Incident Response Metrics */}
                  <div className="bg-[hsl(0,0%,6%)]/60 border border-[hsl(330,100%,50%)]/10 rounded-lg p-4">
                    <h4 className="text-lg font-semibold mb-4 flex items-center">
                      <Activity className="w-5 h-5 text-green-400 mr-2" />
                      Incident Response KPIs
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Mean Time to Detection (MTTD)</span>
                        <span className="text-green-400 font-bold">2.3 min</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-green-400 h-2 rounded-full w-[92%]"></div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Mean Time to Response (MTTR)</span>
                        <span className="text-[hsl(330,100%,50%)] font-bold">{dashboardStats?.avgResponseTime || '0.3'}s</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-[hsl(330,100%,50%)] h-2 rounded-full w-[85%]"></div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Automation Coverage</span>
                        <span className="text-[hsl(267,100%,67%)] font-bold">{Math.floor((alertDatasetStats?.stats?.total || 2000) / 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-[hsl(267,100%,67%)] h-2 rounded-full w-[78%]"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* AI Insights Panel */}
              <motion.div className="bg-gradient-to-br from-[hsl(0,0%,8%)]/80 to-[hsl(0,0%,10%)]/60 border border-[hsl(330,100%,50%)]/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-[hsl(330,100%,50%)]/20 rounded-lg">
                      <Brain className="w-5 h-5 text-[hsl(330,100%,50%)]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">AI Security Insights</h2>
                      <p className="text-sm text-gray-400">Real-time analysis from your security data</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="border-[hsl(330,100%,50%)]/20 text-[hsl(330,100%,50%)]">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Analysis
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {mockAIInsights.map((insight, index) => (
                    <motion.div
                      key={index}
                      className="bg-[hsl(0,0%,6%)]/60 border border-[hsl(330,100%,50%)]/10 rounded-lg p-4 hover:bg-[hsl(0,0%,8%)]/80 hover:border-[hsl(330,100%,50%)]/20 transition-all cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${
                          insight.impact === 'High' ? 'bg-red-400/20 text-red-400' :
                          insight.impact === 'Medium' ? 'bg-yellow-400/20 text-yellow-400' :
                          'bg-green-400/20 text-green-400'
                        }`}>
                          {getInsightIcon(insight.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-white mb-1">{insight.title}</h4>
                          <p className="text-sm text-gray-400 mb-3">{insight.description}</p>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              insight.impact === 'High' ? 'bg-red-400/20 text-red-400' :
                              insight.impact === 'Medium' ? 'bg-yellow-400/20 text-yellow-400' :
                              'bg-green-400/20 text-green-400'
                            }`}>
                              {insight.impact} Impact
                            </span>
                            <span className="text-xs text-gray-500">{insight.confidence}% confidence</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Recent Incidents with Real Data */}
              <motion.div className="bg-gradient-to-br from-[hsl(0,0%,8%)]/80 to-[hsl(0,0%,10%)]/60 border border-[hsl(330,100%,50%)]/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-400/20 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">Recent Security Incidents</h2>
                      <p className="text-sm text-gray-400">Latest threats and investigations</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setLocation('/investigation')} className="border-[hsl(330,100%,50%)]/20 text-[hsl(330,100%,50%)]">
                      View All
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {mockAlerts.slice(0, 8).map((alert, index) => (
                    <motion.div
                      key={alert.id}
                      className="bg-[hsl(0,0%,6%)]/60 border border-[hsl(330,100%,50%)]/10 rounded-lg p-4 hover:bg-[hsl(0,0%,8%)]/80 hover:border-[hsl(330,100%,50%)]/20 transition-all cursor-pointer"
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setSelectedAlert(alert)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${
                              alert.status === 'Active' ? 'bg-red-400 animate-pulse' :
                              alert.status === 'Investigating' ? 'bg-yellow-400' :
                              'bg-green-400'
                            }`}></div>
                            <span className="text-sm font-medium text-white">{alert.title}</span>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium border ${
                            alert.severity === 'Critical' ? 'bg-red-400/10 text-red-400 border-red-400/20' :
                            alert.severity === 'High' ? 'bg-orange-400/10 text-orange-400 border-orange-400/20' :
                            alert.severity === 'Medium' ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' :
                            'bg-green-400/10 text-green-400 border-green-400/20'
                          }`}>
                            {alert.severity}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span>{alert.assignedAnalyst}</span>
                          <span>{alert.time}</span>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-[hsl(267,100%,67%)] rounded-full"></div>
                            <span>{alert.confidence}%</span>
                          </div>
                        </div>
                      </div>
                      {alert.rootCause && (
                        <div className="mt-2 text-sm text-gray-400 pl-5">
                          {alert.rootCause}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>

            </motion.div>
          )}

          {/* Alert Management Tab */}
          {activeTab === "alerts" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              {/* Alert Search and Filters */}
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold glow-text">Alert Management</h1>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input 
                      placeholder="Search alerts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-[hsl(0,0%,10%)]/50 border-[hsl(330,100%,50%)]/20 w-80"
                    />
                  </div>
                  <Button variant="outline" size="sm" className="border-[hsl(330,100%,50%)]/20 text-[hsl(330,100%,50%)]">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>

              {/* Alerts Table */}
              <div className="bg-gradient-to-br from-[hsl(0,0%,8%)]/80 to-[hsl(0,0%,10%)]/60 border border-[hsl(330,100%,50%)]/20 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[hsl(0,0%,6%)]/80 border-b border-[hsl(330,100%,50%)]/20">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Alert</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Severity</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Analyst</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Confidence</th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[hsl(330,100%,50%)]/10">
                      {filteredAlerts.map((alert, index) => (
                        <motion.tr 
                          key={alert.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="hover:bg-[hsl(0,0%,6%)]/40 transition-colors cursor-pointer"
                          onClick={() => setSelectedAlert(alert)}
                        >
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-white">{alert.title}</div>
                              <div className="text-sm text-gray-400">ID: {alert.id}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              getSeverityColor(alert.severity)
                            }`}>
                              {alert.severity}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              getStatusColor(alert.status)
                            }`}>
                              {alert.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-300">{alert.assignedAnalyst}</td>
                          <td className="px-6 py-4 text-sm text-gray-300">{alert.time}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-[hsl(267,100%,67%)] h-2 rounded-full" 
                                  style={{ width: `${alert.confidence}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-300">{alert.confidence}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center space-x-2 justify-end">
                              <Button variant="ghost" size="sm" className="text-[hsl(330,100%,50%)]">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-green-400">
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold glow-text">Security Analytics</h1>
              
              {/* Automation Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-[hsl(0,0%,8%)]/80 to-[hsl(0,0%,10%)]/60 border border-green-400/20 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">True Positives</h3>
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="text-3xl font-bold text-green-400 mb-2">{mockAutomationMetrics.tpHandled.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">Handled automatically</div>
                </div>
                
                <div className="bg-gradient-to-br from-[hsl(0,0%,8%)]/80 to-[hsl(0,0%,10%)]/60 border border-red-400/20 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">False Positives</h3>
                    <X className="w-6 h-6 text-red-400" />
                  </div>
                  <div className="text-3xl font-bold text-red-400 mb-2">{mockAutomationMetrics.fpDismissed.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">Dismissed by AI</div>
                </div>
                
                <div className="bg-gradient-to-br from-[hsl(0,0%,8%)]/80 to-[hsl(0,0%,10%)]/60 border border-[hsl(267,100%,67%)]/20 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Total Processed</h3>
                    <Activity className="w-6 h-6 text-[hsl(267,100%,67%)]" />
                  </div>
                  <div className="text-3xl font-bold text-[hsl(267,100%,67%)] mb-2">{mockAutomationMetrics.totalProcessed.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">All time</div>
                </div>
                
                <div className="bg-gradient-to-br from-[hsl(0,0%,8%)]/80 to-[hsl(0,0%,10%)]/60 border border-blue-400/20 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Avg Processing</h3>
                    <Clock className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="text-3xl font-bold text-blue-400 mb-2">{mockAutomationMetrics.avgProcessingTime}s</div>
                  <div className="text-sm text-gray-400">Per alert</div>
                </div>
              </div>
              
              {/* Confidence Distribution */}
              <div className="bg-gradient-to-br from-[hsl(0,0%,8%)]/80 to-[hsl(0,0%,10%)]/60 border border-[hsl(330,100%,50%)]/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-6">AI Confidence Distribution</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">High Confidence (80-100%)</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-64 bg-gray-700 rounded-full h-3">
                        <div className="bg-green-400 h-3 rounded-full" style={{ width: `${mockAutomationMetrics.confidence.high}%` }}></div>
                      </div>
                      <span className="text-white font-medium">{mockAutomationMetrics.confidence.high}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Medium Confidence (60-79%)</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-64 bg-gray-700 rounded-full h-3">
                        <div className="bg-yellow-400 h-3 rounded-full" style={{ width: `${mockAutomationMetrics.confidence.medium}%` }}></div>
                      </div>
                      <span className="text-white font-medium">{mockAutomationMetrics.confidence.medium}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Low Confidence (0-59%)</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-64 bg-gray-700 rounded-full h-3">
                        <div className="bg-red-400 h-3 rounded-full" style={{ width: `${mockAutomationMetrics.confidence.low}%` }}></div>
                      </div>
                      <span className="text-white font-medium">{mockAutomationMetrics.confidence.low}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </main>
      </div>

      {/* Alert Detail Modal */}
      <AnimatePresence>
        {selectedAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedAlert(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[hsl(0,0%,8%)]/95 border border-[hsl(330,100%,50%)]/30 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Alert Details</h3>
                <Button variant="ghost" size="sm" onClick={() => setSelectedAlert(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-400">Alert ID:</span>
                    <div className="text-white font-mono">{selectedAlert.id}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">Source:</span>
                    <div className="text-white">{selectedAlert.source}</div>
                  </div>
                </div>
                
                <div>
                  <span className="text-sm text-gray-400">Title:</span>
                  <div className="text-white font-medium">{selectedAlert.title}</div>
                </div>
                
                <div>
                  <span className="text-sm text-gray-400">AI Recommendation:</span>
                  <div className="text-gray-300">{selectedAlert.aiRecommendation}</div>
                </div>
                
                {selectedAlert.rootCause && (
                  <div>
                    <span className="text-sm text-gray-400">Root Cause Analysis:</span>
                    <div className="text-gray-300">{selectedAlert.rootCause}</div>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(selectedAlert.severity)}`}>
                      {selectedAlert.severity}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAlert.status)}`}>
                      {selectedAlert.status}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="border-green-500/20 text-green-400">
                      Mark Resolved
                    </Button>
                    <Button variant="outline" size="sm" className="border-[hsl(330,100%,50%)]/20 text-[hsl(330,100%,50%)]">
                      Escalate
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Overlay */}
      <AnimatePresence>
        {showLogoutOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-[hsl(0,0%,8%)]/95 border border-[hsl(330,100%,50%)]/30 rounded-xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-[hsl(330,100%,50%)] to-[hsl(267,100%,67%)] rounded-full mx-auto mb-4 flex items-center justify-center">
                <LogOut className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Logging Out</h3>
              <p className="text-gray-400 mb-4">Thank you for using Alpha SOC</p>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-[hsl(330,100%,50%)] h-2 rounded-full w-full animate-pulse"></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}