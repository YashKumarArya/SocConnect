import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

gsap.registerPlugin(ScrollTrigger);
import { ArrowLeft, Settings, Bell, User, Shield, AlertTriangle, CheckCircle, Search, Filter, BarChart3, Activity, Eye, Clock, TrendingUp, Target, Zap, Brain, Calendar, MessageSquare, Download, Moon, Sun, PieChart, LineChart, TrendingDown, Bot, Lightbulb, FileText, RefreshCw, ArrowRight, PlayCircle, PauseCircle, UserCheck, X, ThumbsUp, ThumbsDown, Workflow, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { ThreatVisualization } from "@/components/ui/threat-visualization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

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

const mockAlerts: Alert[] = [
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
  },
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
    description: "Critical alerts have increased by 23% over the past 48 hours, primarily from network security sources.",
    confidence: 87,
    impact: "High"
  },
  {
    type: "prediction",
    title: "Forecasted Peak Activity",
    description: "AI predicts a 40% increase in security incidents during the next 7 days based on threat intelligence patterns.",
    confidence: 82,
    impact: "Medium"
  },
  {
    type: "correlation",
    title: "Geographic Correlation Detected",
    description: "85% of high-severity alerts originate from similar geographic regions, suggesting coordinated threat activity.",
    confidence: 91,
    impact: "High"
  },
  {
    type: "anomaly",
    title: "Unusual User Behavior",
    description: "Detected anomalous login patterns for 12 users outside normal business hours with geographic inconsistencies.",
    confidence: 76,
    impact: "Medium"
  }
];

const mockWorkflowAlerts: WorkflowAlert[] = [
  {
    id: "WF-001",
    vendorName: "CrowdStrike",
    timestamp: "10:45:23",
    severity: "Critical",
    status: "processing",
    stage: "ai_model",
    aiModel: "ThreatDetector v2.1",
    confidence: 94,
    processingTime: 1.2
  },
  {
    id: "WF-002", 
    vendorName: "Splunk",
    timestamp: "10:44:15",
    severity: "High",
    status: "completed",
    stage: "outcome",
    outcome: "TP",
    confidence: 89,
    processingTime: 2.1,
    explanation: "Suspicious network traffic pattern matching known APT indicators"
  },
  {
    id: "WF-003",
    vendorName: "Microsoft Sentinel",
    timestamp: "10:43:47",
    severity: "Medium",
    status: "completed",
    stage: "outcome", 
    outcome: "FP",
    confidence: 76,
    processingTime: 1.8,
    explanation: "Benign administrative activity misclassified due to timing correlation"
  },
  {
    id: "WF-004",
    vendorName: "Palo Alto",
    timestamp: "10:42:33",
    severity: "High",
    status: "completed",
    stage: "outcome",
    outcome: "Escalate",
    escalationReason: "Low confidence score requires human analysis",
    assignedAnalyst: "Sarah Chen",
    confidence: 67,
    processingTime: 3.4
  },
  {
    id: "WF-005",
    vendorName: "AWS GuardDuty", 
    timestamp: "10:45:55",
    severity: "Low",
    status: "incoming",
    stage: "vendor"
  }
];

const mockEscalationQueue: EscalationItem[] = [
  {
    alertId: "WF-004",
    reason: "Low confidence score requires human analysis",
    assignedAnalyst: "Sarah Chen",
    timestamp: "10:42:33",
    status: "pending"
  },
  {
    alertId: "WF-007",
    reason: "Potential zero-day exploit detected",
    assignedAnalyst: "Marcus Johnson",
    timestamp: "10:38:12",
    status: "approved"
  },
  {
    alertId: "WF-012",
    reason: "Anomalous behavior pattern outside training data",
    assignedAnalyst: "Lisa Wang",
    timestamp: "10:35:44",
    status: "pending"
  }
];

const mockAutomationMetrics: AutomationMetrics = {
  tpHandled: 847,
  fpDismissed: 1203,
  totalProcessed: 2156,
  avgProcessingTime: 2.3,
  confidence: {
    high: 67,
    medium: 28,
    low: 5
  }
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [nlQuery, setNlQuery] = useState("");
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [selectedWorkflowAlert, setSelectedWorkflowAlert] = useState<WorkflowAlert | null>(null);
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [escalationDecision, setEscalationDecision] = useState<"approve" | "reject" | "assign" | null>(null);
  const [workflowAlerts, setWorkflowAlerts] = useState<WorkflowAlert[]>(mockWorkflowAlerts);
  const [showLogoutOverlay, setShowLogoutOverlay] = useState(false);
  
  // GSAP refs
  const headerRef = useRef<HTMLElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Dashboard entrance animations
      gsap.fromTo(headerRef.current,
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
      );

      gsap.fromTo(sidebarRef.current,
        { x: -250, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, delay: 0.2, ease: "power3.out" }
      );

      gsap.fromTo(mainRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, delay: 0.4, ease: "power2.out" }
      );

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

  return (
    <div className="min-h-screen bg-[hsl(215,28%,5%)] text-white font-['Inter']">
      {/* Enhanced Top Navigation Bar */}
      <motion.header 
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
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center">3</span>
            </Button>

            <Button variant="ghost" size="icon" className="text-gray-300 hover:text-[hsl(330,100%,50%)] transition-colors">
              <Settings className="w-5 h-5" />
            </Button>

            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-gray-300" />
              <div className="text-sm">
                <div className="text-white">Sarah Chen</div>
                <div className="text-xs text-gray-400">Senior Analyst</div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="flex">
        {/* Enhanced Sidebar Navigation */}
        <motion.aside 
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
        <main className="flex-1 p-6 bg-gradient-to-br from-[hsl(215,28%,5%)] to-[hsl(215,28%,7%)]">
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
                          <div className="text-2xl font-bold text-red-400">127</div>
                          <div className="text-xs text-gray-400">Active Campaigns</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-400">2.8K</div>
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
                          <span className="text-gray-300">Malware Families</span>
                          <span className="text-orange-400 font-medium">156 Tracked</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">Zero-Days</span>
                          <span className="text-yellow-400 font-medium">4 Monitored</span>
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
                        <span className="text-[hsl(330,100%,50%)] font-bold">8.7 min</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-[hsl(330,100%,50%)] h-2 rounded-full w-[85%]"></div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Mean Time to Containment (MTTC)</span>
                        <span className="text-[hsl(267,100%,67%)] font-bold">18.4 min</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-[hsl(267,100%,67%)] h-2 rounded-full w-[78%]"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Advanced Threat Hunting Dashboard */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-[hsl(0,0%,8%)]/80 border border-[hsl(330,100%,50%)]/20 rounded-xl p-6"
              >
                <h3 className="text-xl font-semibold mb-6 flex items-center glow-text">
                  <Eye className="w-6 h-6 text-[hsl(267,100%,67%)] mr-2" />
                  Advanced Threat Hunting & Analysis
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* MITRE ATT&CK Coverage */}
                  <div className="bg-[hsl(0,0%,6%)]/60 border border-[hsl(330,100%,50%)]/10 rounded-lg p-4">
                    <h4 className="text-sm font-semibold mb-3 text-gray-300">MITRE ATT&CK Coverage</h4>
                    <div className="text-center mb-4">
                      <div className="text-3xl font-bold text-[hsl(330,100%,50%)]">78%</div>
                      <div className="text-xs text-gray-400">Techniques Covered</div>
                    </div>
                    <div className="space-y-2">
                      {['Initial Access', 'Execution', 'Persistence', 'Privilege Escalation', 'Defense Evasion'].map((tactic, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">{tactic}</span>
                          <span className="text-[hsl(330,100%,50%)]">{Math.floor(Math.random() * 30) + 70}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Behavioral Analytics */}
                  <div className="bg-[hsl(0,0%,6%)]/60 border border-[hsl(267,100%,67%)]/10 rounded-lg p-4">
                    <h4 className="text-sm font-semibold mb-3 text-gray-300">Behavioral Analytics</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">User Anomalies</span>
                        <span className="text-orange-400 font-medium">12</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Entity Deviations</span>
                        <span className="text-yellow-400 font-medium">47</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Process Anomalies</span>
                        <span className="text-red-400 font-medium">8</span>
                      </div>
                      <div className="mt-3 p-2 bg-[hsl(267,100%,67%)]/10 rounded border border-[hsl(267,100%,67%)]/20">
                        <div className="text-xs text-[hsl(267,100%,67%)] font-medium">AI Confidence: 94.2%</div>
                        <div className="text-xs text-gray-400">Baseline accuracy improving</div>
                      </div>
                    </div>
                  </div>

                  {/* Threat Attribution */}
                  <div className="bg-[hsl(0,0%,6%)]/60 border border-green-400/10 rounded-lg p-4">
                    <h4 className="text-sm font-semibold mb-3 text-gray-300">Threat Attribution</h4>
                    <div className="space-y-2">
                      {[
                        { actor: 'APT29', confidence: 87, attacks: 3 },
                        { actor: 'Lazarus', confidence: 74, attacks: 2 },
                        { actor: 'FIN7', confidence: 92, attacks: 1 },
                        { actor: 'Unknown', confidence: 45, attacks: 8 }
                      ].map((threat, i) => (
                        <div key={i} className="p-2 bg-[hsl(0,0%,4%)]/60 rounded">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-white">{threat.actor}</span>
                            <span className="text-xs text-[hsl(330,100%,50%)]">{threat.attacks} attacks</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-700 rounded-full h-1">
                              <div 
                                className="bg-green-400 h-1 rounded-full"
                                style={{ width: `${threat.confidence}%` }}
                              />
                            </div>
                            <span className="text-xs text-green-400">{threat.confidence}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Hunt Results */}
                  <div className="bg-[hsl(0,0%,6%)]/60 border border-orange-400/10 rounded-lg p-4">
                    <h4 className="text-sm font-semibold mb-3 text-gray-300">Active Hunt Results</h4>
                    <div className="space-y-3">
                      <div className="text-center mb-3">
                        <div className="text-2xl font-bold text-orange-400">23</div>
                        <div className="text-xs text-gray-400">Active Hunts</div>
                      </div>
                      <div className="space-y-2">
                        {[
                          { name: 'Living off the Land', findings: 7, status: 'active' },
                          { name: 'Lateral Movement', findings: 3, status: 'investigating' },
                          { name: 'Data Staging', findings: 12, status: 'completed' }
                        ].map((hunt, i) => (
                          <div key={i} className="p-2 bg-[hsl(0,0%,4%)]/60 rounded">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-white">{hunt.name}</span>
                              <span className={`px-1 py-0.5 rounded text-xs ${
                                hunt.status === 'active' ? 'bg-green-400/10 text-green-400' :
                                hunt.status === 'investigating' ? 'bg-yellow-400/10 text-yellow-400' :
                                'bg-gray-400/10 text-gray-400'
                              }`}>
                                {hunt.status}
                              </span>
                            </div>
                            <div className="text-xs text-orange-400">{hunt.findings} findings</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* AI-Generated Insights Panel */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-[hsl(0,0%,8%)]/80 border border-[hsl(330,100%,50%)]/20 rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Lightbulb className="w-5 h-5 text-[hsl(267,100%,67%)] mr-2" />
                    AI-Generated Security Insights
                  </h3>
                  <Button variant="ghost" size="sm" className="text-[hsl(330,100%,50%)]">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockAIInsights.map((insight, index) => (
                    <motion.div 
                      key={index}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                      className="bg-[hsl(0,0%,6%)]/60 border border-[hsl(330,100%,50%)]/10 rounded-lg p-4 hover:border-[hsl(330,100%,50%)]/20 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getInsightIcon(insight.type)}
                          <span className="text-sm font-medium">{insight.title}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            insight.impact === 'High' ? 'bg-red-400/10 text-red-400' :
                            insight.impact === 'Medium' ? 'bg-yellow-400/10 text-yellow-400' :
                            'bg-green-400/10 text-green-400'
                          }`}>
                            {insight.impact}
                          </span>
                          <span className="text-xs text-[hsl(330,100%,50%)]">{insight.confidence}%</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300">{insight.description}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Key Metrics with AI Suggestions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="bg-[hsl(0,0%,8%)]/80 border border-[hsl(330,100%,50%)]/20 rounded-xl p-6 stats-card-hover"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-[hsl(330,100%,50%)]">22.1K</div>
                      <div className="text-sm text-gray-400">Active Endpoints</div>
                    </div>
                    <Shield className="w-8 h-8 text-[hsl(330,100%,50%)]" />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex-1 bg-gray-700 rounded-full h-2 mr-2">
                      <div className="bg-[hsl(330,100%,50%)] h-2 rounded-full w-4/5"></div>
                    </div>
                    <span className="text-xs text-gray-400">98.2%</span>
                  </div>
                  <div className="mt-2 text-xs text-[hsl(267,100%,67%)]">
                    AI Suggestion: Monitor 3 offline endpoints
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-[hsl(0,0%,8%)]/80 border border-orange-400/20 rounded-xl p-6 stats-card-hover"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-orange-400">1,406</div>
                      <div className="text-sm text-gray-400">Active Alerts</div>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-orange-400" />
                  </div>
                  <div className="mt-4 flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-red-400">+23% (48h trend)</span>
                  </div>
                  <div className="mt-2 text-xs text-[hsl(267,100%,67%)]">
                    AI Prediction: Peak expected in 6 hours
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-[hsl(0,0%,8%)]/80 border border-[hsl(267,100%,67%)]/20 rounded-xl p-6 stats-card-hover"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-[hsl(267,100%,67%)]">87%</div>
                      <div className="text-sm text-gray-400">AI Auto-Triage</div>
                    </div>
                    <Bot className="w-8 h-8 text-[hsl(267,100%,67%)]" />
                  </div>
                  <div className="mt-4 text-xs text-green-400">
                    Model Accuracy: 94.2%
                  </div>
                  <div className="mt-2 text-xs text-[hsl(267,100%,67%)]">
                    AI Insight: False positive rate decreased
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="bg-[hsl(0,0%,8%)]/80 border border-green-400/20 rounded-xl p-6 stats-card-hover"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-green-400">2.3s</div>
                      <div className="text-sm text-gray-400">Avg Response Time</div>
                    </div>
                    <Clock className="w-8 h-8 text-green-400" />
                  </div>
                  <div className="mt-4 flex items-center space-x-2">
                    <TrendingDown className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-400">-15% improvement</span>
                  </div>
                  <div className="mt-2 text-xs text-[hsl(267,100%,67%)]">
                    AI Optimization: 40% faster processing
                  </div>
                </motion.div>
              </div>

              {/* Interactive Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* AI-Suggested Chart: Alert Trends */}
                <motion.div 
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="lg:col-span-2 bg-[hsl(0,0%,8%)]/80 border border-[hsl(330,100%,50%)]/20 rounded-xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Alert Trends & Forecasting</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-[hsl(267,100%,67%)] bg-[hsl(267,100%,67%)]/10 px-2 py-1 rounded">
                        AI Recommended
                      </span>
                      <Button variant="ghost" size="sm" className="text-[hsl(330,100%,50%)]">
                        <LineChart className="w-4 h-4 mr-2" />
                        Switch View
                      </Button>
                    </div>
                  </div>
                  <div className="h-64 flex items-end space-x-2">
                    {Array.from({ length: 24 }, (_, i) => {
                      const height = Math.random() * 80 + 20;
                      const isPrediction = i > 16;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center">
                          <div 
                            className={`w-full rounded-sm ${
                              isPrediction 
                                ? 'bg-gradient-to-t from-[hsl(267,100%,67%)]/40 to-[hsl(267,100%,67%)]/60 border-dashed border-t-2 border-[hsl(267,100%,67%)]' 
                                : 'bg-gradient-to-t from-[hsl(330,100%,50%)]/60 to-[hsl(267,100%,67%)]/60'
                            }`}
                            style={{ height: `${height}%` }}
                          ></div>
                          <span className="text-xs text-gray-400 mt-1">{String(i).padStart(2, '0')}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                    <span>Historical Data</span>
                    <span className="text-[hsl(267,100%,67%)]">AI Forecast (Next 7 hours)</span>
                  </div>
                </motion.div>

                {/* Dynamic Risk Heatmap */}
                <motion.div 
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="bg-[hsl(0,0%,8%)]/80 border border-[hsl(330,100%,50%)]/20 rounded-xl p-6"
                >
                  <h3 className="text-lg font-semibold mb-4">Real-time Risk Heatmap</h3>
                  <div className="grid grid-cols-8 gap-1 h-48">
                    {Array.from({ length: 64 }, (_, i) => {
                      const intensity = Math.random();
                      return (
                        <motion.div 
                          key={i}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.3, delay: 0.7 + i * 0.01 }}
                          className="rounded-sm cursor-pointer hover:scale-110 transition-transform"
                          style={{
                            backgroundColor: intensity > 0.7 ? '#ef4444' : 
                                           intensity > 0.4 ? '#f97316' : 
                                           intensity > 0.2 ? '#eab308' : '#22c55e',
                            opacity: 0.3 + intensity * 0.7
                          }}
                          title={`Risk Level: ${Math.round(intensity * 100)}%`}
                        ></motion.div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-4 text-xs text-gray-400">
                    <span>Low Risk</span>
                    <span>High Risk</span>
                  </div>
                  <div className="mt-2 text-xs text-[hsl(267,100%,67%)]">
                    AI Detected: 3 high-risk zones require attention
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {activeTab === "analytics" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold glow-text">AI-Powered Analytics Command Center</h1>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 bg-[hsl(0,0%,10%)]/50 rounded-lg px-3 py-2">
                    <div className="w-2 h-2 bg-[hsl(330,100%,50%)] rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-400">AI Models Active</span>
                  </div>
                  <Button variant="outline" size="sm" className="border-[hsl(330,100%,50%)]/20 text-[hsl(330,100%,50%)]">
                    <Brain className="w-4 h-4 mr-2" />
                    Neural Network Status
                  </Button>
                </div>
              </div>

              {/* Advanced AI Model Dashboard */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="grid grid-cols-1 lg:grid-cols-4 gap-6"
              >
                {/* AI Processing Center */}
                <div className="lg:col-span-2 bg-[hsl(0,0%,8%)]/80 border border-[hsl(330,100%,50%)]/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Zap className="w-5 h-5 text-[hsl(267,100%,67%)] mr-2" />
                    Neural Processing Matrix
                  </h3>
                  
                  {/* Real-time Processing Visualization */}
                  <div className="relative h-64 bg-[hsl(0,0%,6%)]/60 rounded-lg border border-[hsl(330,100%,50%)]/10 overflow-hidden mb-4">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        {/* Central AI Core */}
                        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[hsl(330,100%,50%)] to-[hsl(267,100%,67%)] flex items-center justify-center animate-pulse">
                          <Brain className="w-10 h-10 text-white" />
                        </div>
                        
                        {/* Orbiting Processing Nodes */}
                        {Array.from({ length: 8 }).map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-3 h-3 bg-[hsl(330,100%,50%)] rounded-full"
                            style={{
                              top: '50%',
                              left: '50%',
                              transformOrigin: `${60 + Math.cos(i * Math.PI / 4) * 20}px ${Math.sin(i * Math.PI / 4) * 20}px`,
                            }}
                            animate={{
                              rotate: 360,
                            }}
                            transition={{
                              duration: 4 + (i * 0.5),
                              repeat: Infinity,
                              ease: "linear"
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Data Stream Visualization */}
                    <div className="absolute top-4 left-4 right-4">
                      <div className="grid grid-cols-12 gap-1 h-2">
                        {Array.from({ length: 48 }).map((_, i) => (
                          <motion.div
                            key={i}
                            className="bg-[hsl(330,100%,50%)] rounded-full h-1"
                            animate={{
                              opacity: [0.2, 1, 0.2],
                              scaleY: [0.5, 1, 0.5]
                            }}
                            transition={{
                              duration: 2,
                              delay: i * 0.1,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Processing Statistics */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[hsl(330,100%,50%)]">2.3M</div>
                      <div className="text-xs text-gray-400">Events/Hour</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[hsl(267,100%,67%)]">847ms</div>
                      <div className="text-xs text-gray-400">Avg Latency</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">99.7%</div>
                      <div className="text-xs text-gray-400">Accuracy</div>
                    </div>
                  </div>
                </div>

                {/* Model Performance Metrics */}
                <div className="bg-[hsl(0,0%,8%)]/80 border border-[hsl(330,100%,50%)]/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Target className="w-5 h-5 text-[hsl(330,100%,50%)] mr-2" />
                    Model Performance
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Threat Detection Model */}
                    <div className="p-3 bg-[hsl(0,0%,6%)]/60 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Threat Detection</span>
                        <span className="text-[hsl(330,100%,50%)] text-xs">Active</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                          <div className="bg-gradient-to-r from-[hsl(330,100%,50%)] to-[hsl(267,100%,67%)] h-2 rounded-full w-[94%]"></div>
                        </div>
                        <span className="text-xs text-gray-300">94%</span>
                      </div>
                    </div>

                    {/* Anomaly Detection Model */}
                    <div className="p-3 bg-[hsl(0,0%,6%)]/60 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Anomaly Detection</span>
                        <span className="text-green-400 text-xs">Optimal</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                          <div className="bg-gradient-to-r from-[hsl(330,100%,50%)] to-green-400 h-2 rounded-full w-[97%]"></div>
                        </div>
                        <span className="text-xs text-gray-300">97%</span>
                      </div>
                    </div>

                    {/* Behavioral Analysis */}
                    <div className="p-3 bg-[hsl(0,0%,6%)]/60 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Behavioral Analysis</span>
                        <span className="text-yellow-400 text-xs">Training</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                          <div className="bg-gradient-to-r from-[hsl(330,100%,50%)] to-yellow-400 h-2 rounded-full w-[89%]"></div>
                        </div>
                        <span className="text-xs text-gray-300">89%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Real-time Predictions */}
                <div className="bg-[hsl(0,0%,8%)]/80 border border-[hsl(330,100%,50%)]/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Eye className="w-5 h-5 text-[hsl(267,100%,67%)] mr-2" />
                    Live Predictions
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-red-400/10 border border-red-400/20 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-red-400">Critical Alert Expected</span>
                        <span className="text-xs text-red-400">92% confidence</span>
                      </div>
                      <div className="text-xs text-gray-400">Next 18 minutes</div>
                    </div>

                    <div className="p-3 bg-orange-400/10 border border-orange-400/20 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-orange-400">Traffic Spike</span>
                        <span className="text-xs text-orange-400">78% confidence</span>
                      </div>
                      <div className="text-xs text-gray-400">Next 2.5 hours</div>
                    </div>

                    <div className="p-3 bg-[hsl(267,100%,67%)]/10 border border-[hsl(267,100%,67%)]/20 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-[hsl(267,100%,67%)]">System Optimization</span>
                        <span className="text-xs text-[hsl(267,100%,67%)]">85% confidence</span>
                      </div>
                      <div className="text-xs text-gray-400">Recommended now</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Advanced Threat Intelligence Dashboard */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-[hsl(0,0%,8%)]/80 border border-[hsl(330,100%,50%)]/20 rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Activity className="w-5 h-5 text-[hsl(330,100%,50%)] mr-2" />
                    Advanced Threat Intelligence Matrix
                  </h3>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="border-[hsl(330,100%,50%)]/20 text-[hsl(330,100%,50%)]">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh Intel
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-[hsl(267,100%,67%)]/20 text-[hsl(267,100%,67%)]"
                      onClick={() => setShowWhatIf(!showWhatIf)}
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      Scenario Analysis
                    </Button>
                  </div>
                </div>

                {showWhatIf && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="mb-6 p-6 bg-[hsl(0,0%,6%)]/60 rounded-lg border border-[hsl(330,100%,50%)]/10"
                  >
                    <h4 className="text-lg font-semibold mb-4 flex items-center">
                      <Target className="w-4 h-4 text-[hsl(267,100%,67%)] mr-2" />
                      AI-Powered Scenario Simulation
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-300">Threat Volume Multiplier</label>
                        <Input 
                          type="range" 
                          min="0.5" 
                          max="5" 
                          step="0.1"
                          defaultValue="1.0" 
                          className="w-full accent-[hsl(330,100%,50%)]"
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>0.5x</span>
                          <span className="text-[hsl(330,100%,50%)] font-medium">Current: 1.0x</span>
                          <span>5.0x</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-300">Response Efficiency</label>
                        <Input 
                          type="range" 
                          min="50" 
                          max="100" 
                          defaultValue="87" 
                          className="w-full accent-[hsl(330,100%,50%)]"
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>50%</span>
                          <span className="text-[hsl(330,100%,50%)] font-medium">Current: 87%</span>
                          <span>100%</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-300">AI Automation Level</label>
                        <Input 
                          type="range" 
                          min="0" 
                          max="100" 
                          defaultValue="73" 
                          className="w-full accent-[hsl(330,100%,50%)]"
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>0%</span>
                          <span className="text-[hsl(330,100%,50%)] font-medium">Current: 73%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* AI Prediction Results */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-[hsl(267,100%,67%)]/10 rounded border border-[hsl(267,100%,67%)]/20">
                        <div className="flex items-center mb-2">
                          <Brain className="w-4 h-4 text-[hsl(267,100%,67%)] mr-2" />
                          <span className="text-sm font-medium text-[hsl(267,100%,67%)]">AI Prediction</span>
                        </div>
                        <p className="text-sm text-gray-300">
                          With current settings: <span className="text-[hsl(330,100%,50%)]">94% efficiency</span> expected, 
                          handling <span className="text-green-400">2.3k alerts/hour</span> with <span className="text-yellow-400">1.8s avg response</span>
                        </p>
                      </div>
                      
                      <div className="p-4 bg-[hsl(330,100%,50%)]/10 rounded border border-[hsl(330,100%,50%)]/20">
                        <div className="flex items-center mb-2">
                          <AlertTriangle className="w-4 h-4 text-[hsl(330,100%,50%)] mr-2" />
                          <span className="text-sm font-medium text-[hsl(330,100%,50%)]">Risk Assessment</span>
                        </div>
                        <p className="text-sm text-gray-300">
                          Risk level: <span className="text-green-400">Low</span> | 
                          False positive rate: <span className="text-yellow-400">12%</span> | 
                          Coverage: <span className="text-[hsl(330,100%,50%)]">98.7%</span>
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Threat Intelligence Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-300">Geographic Threat Distribution</h4>
                    <div className="relative h-32 bg-[hsl(0,0%,6%)]/60 rounded-lg border border-[hsl(330,100%,50%)]/10 overflow-hidden">
                      {/* Simplified world map visualization */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-24 h-16 opacity-30">
                          {/* Threat hotspots */}
                          {[
                            { x: '20%', y: '30%', intensity: 'high' },
                            { x: '60%', y: '40%', intensity: 'medium' },
                            { x: '80%', y: '60%', intensity: 'critical' },
                            { x: '15%', y: '70%', intensity: 'low' }
                          ].map((spot, i) => (
                            <motion.div
                              key={i}
                              className={`absolute w-3 h-3 rounded-full ${
                                spot.intensity === 'critical' ? 'bg-red-400' :
                                spot.intensity === 'high' ? 'bg-orange-400' :
                                spot.intensity === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                              }`}
                              style={{ left: spot.x, top: spot.y }}
                              animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.6, 1, 0.6]
                              }}
                              transition={{
                                duration: 2,
                                delay: i * 0.5,
                                repeat: Infinity
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Asia-Pacific:</span>
                        <span className="text-red-400">High Risk</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Europe:</span>
                        <span className="text-yellow-400">Medium Risk</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Americas:</span>
                        <span className="text-green-400">Low Risk</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-300">Attack Vector Analysis</h4>
                    <div className="space-y-3">
                      {[
                        { vector: 'Phishing', percentage: 34, trend: 'up' },
                        { vector: 'Malware', percentage: 28, trend: 'down' },
                        { vector: 'Ransomware', percentage: 19, trend: 'up' },
                        { vector: 'DDoS', percentage: 19, trend: 'stable' }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-300">{item.vector}</span>
                            {item.trend === 'up' && <TrendingUp className="w-3 h-3 text-red-400" />}
                            {item.trend === 'down' && <TrendingDown className="w-3 h-3 text-green-400" />}
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-700 rounded-full h-1">
                              <div 
                                className="bg-[hsl(330,100%,50%)] h-1 rounded-full"
                                style={{ width: `${item.percentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-[hsl(330,100%,50%)] font-medium w-8">{item.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-300">AI Model Confidence</h4>
                    <div className="relative h-32">
                      {/* Confidence meter visualization */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-20 h-20">
                          <motion.div
                            className="w-full h-full rounded-full border-4 border-gray-700"
                            style={{
                              background: `conic-gradient(from 0deg, hsl(330,100%,50%) 0%, hsl(267,100%,67%) ${94 * 3.6}deg, hsl(0,0%,20%) ${94 * 3.6}deg)`
                            }}
                          />
                          <div className="absolute inset-2 bg-[hsl(0,0%,8%)] rounded-full flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-lg font-bold text-[hsl(330,100%,50%)]">94%</div>
                              <div className="text-xs text-gray-400">Confidence</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Model Accuracy:</span>
                        <span className="text-green-400">Excellent</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Data Quality:</span>
                        <span className="text-[hsl(330,100%,50%)]">96.8%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-300">Predictive Alerts</h4>
                    <div className="space-y-2">
                      {[
                        { type: 'Infrastructure Anomaly', time: '12 min', confidence: 87, severity: 'medium' },
                        { type: 'Credential Compromise', time: '28 min', confidence: 92, severity: 'high' },
                        { type: 'Data Exfiltration Risk', time: '1.2 hr', confidence: 78, severity: 'critical' }
                      ].map((alert, i) => (
                        <div key={i} className={`p-2 rounded-lg border ${
                          alert.severity === 'critical' ? 'bg-red-400/10 border-red-400/20' :
                          alert.severity === 'high' ? 'bg-orange-400/10 border-orange-400/20' :
                          'bg-yellow-400/10 border-yellow-400/20'
                        }`}>
                          <div className="text-xs font-medium">{alert.type}</div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-gray-400">in {alert.time}</span>
                            <span className={`text-xs ${
                              alert.severity === 'critical' ? 'text-red-400' :
                              alert.severity === 'high' ? 'text-orange-400' :
                              'text-yellow-400'
                            }`}>
                              {alert.confidence}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Advanced Analytics Tools */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-[hsl(0,0%,8%)]/80 border border-[hsl(330,100%,50%)]/20 rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold mb-6 flex items-center">
                  <Workflow className="w-5 h-5 text-[hsl(267,100%,67%)] mr-2" />
                  Advanced Analytics & Automation Suite
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Custom Query Builder */}
                  <div className="p-4 bg-[hsl(0,0%,6%)]/60 rounded-lg border border-[hsl(330,100%,50%)]/10 hover:border-[hsl(330,100%,50%)]/30 transition-colors">
                    <MessageSquare className="w-8 h-8 text-[hsl(330,100%,50%)] mb-3" />
                    <h4 className="font-semibold mb-2">Natural Language Queries</h4>
                    <p className="text-sm text-gray-400 mb-3">Ask complex security questions in plain English</p>
                    <Button variant="outline" size="sm" className="w-full border-[hsl(330,100%,50%)]/20">
                      Launch Query Builder
                    </Button>
                  </div>

                  {/* Machine Learning Insights */}
                  <div className="p-4 bg-[hsl(0,0%,6%)]/60 rounded-lg border border-[hsl(267,100%,67%)]/10 hover:border-[hsl(267,100%,67%)]/30 transition-colors">
                    <Brain className="w-8 h-8 text-[hsl(267,100%,67%)] mb-3" />
                    <h4 className="font-semibold mb-2">ML Pattern Recognition</h4>
                    <p className="text-sm text-gray-400 mb-3">Discover hidden patterns in your security data</p>
                    <Button variant="outline" size="sm" className="w-full border-[hsl(267,100%,67%)]/20">
                      Analyze Patterns
                    </Button>
                  </div>

                  {/* Automated Response Orchestration */}
                  <div className="p-4 bg-[hsl(0,0%,6%)]/60 rounded-lg border border-green-400/10 hover:border-green-400/30 transition-colors">
                    <Zap className="w-8 h-8 text-green-400 mb-3" />
                    <h4 className="font-semibold mb-2">Response Orchestration</h4>
                    <p className="text-sm text-gray-400 mb-3">Automate complex incident response workflows</p>
                    <Button variant="outline" size="sm" className="w-full border-green-400/20">
                      Configure Workflows
                    </Button>
                  </div>

                  {/* Advanced Report Generation */}
                  <div className="p-4 bg-[hsl(0,0%,6%)]/60 rounded-lg border border-orange-400/10 hover:border-orange-400/30 transition-colors">
                    <FileText className="w-8 h-8 text-orange-400 mb-3" />
                    <h4 className="font-semibold mb-2">Executive Reporting</h4>
                    <p className="text-sm text-gray-400 mb-3">Generate C-suite ready security reports instantly</p>
                    <Button variant="outline" size="sm" className="w-full border-orange-400/20">
                      Generate Report
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === "alerts" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold glow-text">Smart Alert Management</h1>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input 
                      placeholder="Search alerts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-[hsl(0,0%,10%)]/50 border-[hsl(330,100%,50%)]/20"
                    />
                  </div>
                  <Button variant="outline" size="sm" className="border-[hsl(330,100%,50%)]/20">
                    <Filter className="w-4 h-4 mr-2" />
                    AI Filter
                  </Button>
                  <Button variant="outline" size="sm" className="border-[hsl(267,100%,67%)]/20 text-[hsl(267,100%,67%)]">
                    <Bot className="w-4 h-4 mr-2" />
                    Bulk Auto-Triage
                  </Button>
                </div>
              </div>

              {/* Enhanced Alerts Table */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-[hsl(0,0%,8%)]/80 border border-[hsl(330,100%,50%)]/20 rounded-xl overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[hsl(0,0%,6%)] border-b border-[hsl(330,100%,50%)]/20">
                      <tr>
                        <th className="text-left p-4 text-sm font-semibold text-gray-300">Alert ID</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-300">Title</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-300">Severity</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-300">Status</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-300">Assigned Analyst</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-300">AI Recommendation</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAlerts.map((alert, index) => (
                        <motion.tr 
                          key={alert.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                          className="border-b border-[hsl(330,100%,50%)]/10 hover:bg-[hsl(0,0%,6%)]/50 transition-colors"
                        >
                          <td className="p-4 text-sm font-mono text-[hsl(330,100%,50%)]">{alert.id}</td>
                          <td className="p-4 text-sm">{alert.title}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                              {alert.severity}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                              {alert.status}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-gray-300">{alert.assignedAnalyst}</td>
                          <td className="p-4 text-sm text-[hsl(267,100%,67%)] max-w-xs truncate">
                            {alert.aiRecommendation}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedAlert(alert)}
                                className="text-[hsl(330,100%,50%)] hover:bg-[hsl(330,100%,50%)]/20"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-[hsl(267,100%,67%)] hover:bg-[hsl(267,100%,67%)]/20"
                              >
                                <Bot className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === "models" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold glow-text">AI Model Responses & Explainability</h1>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {mockModelResponses.map((response, index) => (
                  <motion.div 
                    key={response.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    className="bg-[hsl(0,0%,8%)]/80 border border-[hsl(330,100%,50%)]/20 rounded-xl p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Brain className="w-5 h-5 text-[hsl(267,100%,67%)]" />
                        <span className="font-mono text-sm text-[hsl(330,100%,50%)]">{response.id}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        response.status === 'Complete' ? 'bg-green-400/10 text-green-400' :
                        response.status === 'Processing' ? 'bg-yellow-400/10 text-yellow-400' :
                        'bg-red-400/10 text-red-400'
                      }`}>
                        {response.status}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <span className="text-xs text-gray-400">Prediction:</span>
                        <p className="text-white font-medium">{response.prediction}</p>
                      </div>

                      <div>
                        <span className="text-xs text-gray-400">Confidence Score:</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex-1 bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-[hsl(330,100%,50%)] to-[hsl(267,100%,67%)] h-2 rounded-full transition-all duration-1000"
                              style={{ width: `${response.confidence}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-[hsl(330,100%,50%)] font-medium">{response.confidence}%</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-xs text-gray-400">Recommendation:</span>
                        <p className="text-gray-300 text-sm">{response.recommendation}</p>
                      </div>

                      {/* XAI Explainability Section */}
                      <div className="border-t border-gray-700 pt-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Lightbulb className="w-4 h-4 text-[hsl(267,100%,67%)]" />
                          <span className="text-xs text-gray-400">AI Explanation (XAI):</span>
                        </div>
                        <p className="text-sm text-gray-300 bg-[hsl(0,0%,6%)]/60 p-3 rounded border border-[hsl(330,100%,50%)]/10">
                          {response.explainability}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-400 pt-2">
                        <span>Timestamp: {response.timestamp}</span>
                        <Button variant="ghost" size="sm" className="text-[hsl(330,100%,50%)] hover:bg-[hsl(330,100%,50%)]/20">
                          <FileText className="w-3 h-3 mr-1" />
                          Export Analysis
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "workflow" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold glow-text">Alert Processing Pipeline</h1>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 bg-[hsl(0,0%,10%)]/50 rounded-lg px-3 py-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-400">Pipeline Active</span>
                  </div>
                  <Button variant="outline" size="sm" className="border-[hsl(330,100%,50%)]/20 text-[hsl(330,100%,50%)]">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Pipeline
                  </Button>
                </div>
              </div>

              {/* Real-Time Alert Stream & Workflow */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Sidebar - Incoming Alerts Stream */}
                <motion.div 
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="bg-[hsl(0,0%,8%)]/80 border border-[hsl(330,100%,50%)]/20 rounded-xl p-6"
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Activity className="w-5 h-5 text-[hsl(330,100%,50%)] mr-2" />
                    Live Alert Stream
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {workflowAlerts.slice(0, 8).map((alert, index) => (
                      <motion.div 
                        key={alert.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-105 ${
                          selectedWorkflowAlert?.id === alert.id 
                            ? 'bg-[hsl(330,100%,50%)]/20 border-[hsl(330,100%,50%)]/40' 
                            : 'bg-[hsl(0,0%,6%)]/60 border-[hsl(330,100%,50%)]/10 hover:border-[hsl(330,100%,50%)]/20'
                        }`}
                        onClick={() => setSelectedWorkflowAlert(alert)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono text-[hsl(330,100%,50%)]">{alert.id}</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${getSeverityColor(alert.severity)}`}>
                            {alert.severity}
                          </span>
                        </div>
                        <div className="text-sm text-gray-300 mb-1">{alert.vendorName}</div>
                        <div className="text-xs text-gray-400">{alert.timestamp}</div>
                        <div className="flex items-center mt-2">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            alert.status === 'incoming' ? 'bg-blue-400' :
                            alert.status === 'processing' ? 'bg-purple-400 animate-pulse' :
                            'bg-green-400'
                          }`}></div>
                          <span className="text-xs text-gray-400 capitalize">{alert.status}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Center - Workflow Pipeline Visualization */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="lg:col-span-2 bg-[hsl(0,0%,8%)]/80 border border-[hsl(330,100%,50%)]/20 rounded-xl p-6"
                >
                  <h3 className="text-lg font-semibold mb-6">Processing Pipeline</h3>

                  {/* Pipeline Stages */}
                  <div className="relative">
                    <div className="flex items-center justify-between mb-8">
                      {/* Vendor Stage */}
                      <motion.div 
                        className="flex flex-col items-center"
                        whileHover={{ scale: 1.05 }}
                      >
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-2 relative">
                          <Shield className="w-8 h-8 text-white" />
                          {selectedWorkflowAlert?.stage === 'vendor' && (
                            <motion.div
                              className="absolute inset-0 border-2 border-blue-400 rounded-full"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            />
                          )}
                        </div>
                        <span className="text-sm font-medium text-blue-400">Vendor</span>
                        <span className="text-xs text-gray-400">Detection</span>
                      </motion.div>

                      {/* Animated Connector */}
                      <div className="flex-1 mx-4 relative">
                        <div className="h-1 bg-gray-600 rounded-full">
                          <motion.div 
                            className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                            animate={{ width: selectedWorkflowAlert?.stage !== 'vendor' ? '100%' : '0%' }}
                            transition={{ duration: 0.8 }}
                          />
                        </div>
                        <ArrowRight className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>

                      {/* AI Model Stage */}
                      <motion.div 
                        className="flex flex-col items-center"
                        whileHover={{ scale: 1.05 }}
                      >
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mb-2 relative">
                          <Brain className="w-8 h-8 text-white" />
                          {selectedWorkflowAlert?.stage === 'ai_model' && (
                            <motion.div
                              className="absolute inset-0 border-2 border-purple-400 rounded-full"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            />
                          )}
                        </div>
                        <span className="text-sm font-medium text-purple-400">AI Model</span>
                        <span className="text-xs text-gray-400">Analysis</span>
                      </motion.div>

                      {/* Animated Connector */}
                      <div className="flex-1 mx-4 relative">
                        <div className="h-1 bg-gray-600 rounded-full">
                          <motion.div 
                            className="h-1 bg-gradient-to-r from-purple-500 to-green-500 rounded-full"
                            animate={{ width: selectedWorkflowAlert?.stage === 'outcome' ? '100%' : '0%' }}
                            transition={{ duration: 0.8 }}
                          />
                        </div>
                        <ArrowRight className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>

                      {/* Outcome Stage */}
                      <motion.div 
                        className="flex flex-col items-center"
                        whileHover={{ scale: 1.05 }}
                      >
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 relative ${
                          selectedWorkflowAlert?.outcome === 'TP' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                          selectedWorkflowAlert?.outcome === 'FP' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                          selectedWorkflowAlert?.outcome === 'Escalate' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                          'bg-gradient-to-r from-gray-500 to-gray-600'
                        }`}>
                          {selectedWorkflowAlert?.outcome === 'TP' && <CheckCircle className="w-8 h-8 text-white" />}
                          {selectedWorkflowAlert?.outcome === 'FP' && <X className="w-8 h-8 text-white" />}
                          {selectedWorkflowAlert?.outcome === 'Escalate' && <AlertTriangle className="w-8 h-8 text-white" />}
                          {!selectedWorkflowAlert?.outcome && <Target className="w-8 h-8 text-white" />}
                          {selectedWorkflowAlert?.stage === 'outcome' && (
                            <motion.div
                              className="absolute inset-0 border-2 border-white rounded-full"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            />
                          )}
                        </div>
                        <span className={`text-sm font-medium ${
                          selectedWorkflowAlert?.outcome === 'TP' ? 'text-green-400' :
                          selectedWorkflowAlert?.outcome === 'FP' ? 'text-orange-400' :
                          selectedWorkflowAlert?.outcome === 'Escalate' ? 'text-red-400' :
                          'text-gray-400'
                        }`}>
                          {selectedWorkflowAlert?.outcome || 'Outcome'}
                        </span>
                        <span className="text-xs text-gray-400">Decision</span>
                      </motion.div>
                    </div>

                    {/* Alert Details Panel */}
                    {selectedWorkflowAlert && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[hsl(0,0%,6%)]/60 border border-[hsl(330,100%,50%)]/20 rounded-lg p-4"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-xs text-gray-400">Alert ID:</span>
                            <p className="text-sm font-mono text-[hsl(330,100%,50%)]">{selectedWorkflowAlert.id}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-400">Vendor:</span>
                            <p className="text-sm text-white">{selectedWorkflowAlert.vendorName}</p>
                          </div>
                          {selectedWorkflowAlert.aiModel && (
                            <div>
                              <span className="text-xs text-gray-400">AI Model:</span>
                              <p className="text-sm text-purple-400">{selectedWorkflowAlert.aiModel}</p>
                            </div>
                          )}
                          {selectedWorkflowAlert.confidence && (
                            <div>
                              <span className="text-xs text-gray-400">Confidence:</span>
                              <p className="text-sm text-[hsl(330,100%,50%)]">{selectedWorkflowAlert.confidence}%</p>
                            </div>
                          )}
                          {selectedWorkflowAlert.processingTime && (
                            <div>
                              <span className="text-xs text-gray-400">Processing Time:</span>
                              <p className="text-sm text-gray-300">{selectedWorkflowAlert.processingTime.toFixed(1)}s</p>
                            </div>
                          )}
                          {selectedWorkflowAlert.outcome && (
                            <div>
                              <span className="text-xs text-gray-400">Final Outcome:</span>
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                selectedWorkflowAlert.outcome === 'TP' ? 'bg-green-400/10 text-green-400' :
                                selectedWorkflowAlert.outcome === 'FP' ? 'bg-orange-400/10 text-orange-400' :
                                'bg-red-400/10 text-red-400'
                              }`}>
                                {selectedWorkflowAlert.outcome === 'TP' ? 'True Positive' :
                                 selectedWorkflowAlert.outcome === 'FP' ? 'False Positive' :
                                 'Escalated'}
                              </span>
                            </div>
                          )}
                        </div>

                        {selectedWorkflowAlert.explanation && (
                          <div className="mt-4 border-t border-gray-700 pt-3">
                            <span className="text-xs text-gray-400">AI Explanation:</span>
                            <p className="text-sm text-gray-300 mt-1">{selectedWorkflowAlert.explanation}</p>
                          </div>
                        )}

                        {selectedWorkflowAlert.outcome === 'Escalate' && (
                          <div className="mt-4 flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-green-400/20 text-green-400 hover:bg-green-400/10"
                              onClick={() => setShowEscalationModal(true)}
                            >
                              <ThumbsUp className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-red-400/20 text-red-400 hover:bg-red-400/10"
                            >
                              <ThumbsDown className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-[hsl(330,100%,50%)]/20 text-[hsl(330,100%,50%)]"
                            >
                              <UserCheck className="w-4 h-4 mr-2" />
                              Assign
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </motion.div>

                {/* Right Sidebar - Automation Metrics & Escalation Queue */}
                <motion.div 
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="space-y-6"
                >
                  {/* Automation Metrics */}
                  <div className="bg-[hsl(0,0%,8%)]/80 border border-[hsl(330,100%,50%)]/20 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Bot className="w-5 h-5 text-[hsl(267,100%,67%)] mr-2" />
                      Automation Status
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">TP Handled</span>
                        <span className="text-green-400 font-medium">{mockAutomationMetrics.tpHandled}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">FP Dismissed</span>
                        <span className="text-orange-400 font-medium">{mockAutomationMetrics.fpDismissed}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Avg Processing</span>
                        <span className="text-[hsl(330,100%,50%)] font-medium">{mockAutomationMetrics.avgProcessingTime}s</span>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <span className="text-sm text-gray-400 mb-2 block">Confidence Distribution</span>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">High (&gt;80%)</span>
                            <span className="text-green-400 text-xs">{mockAutomationMetrics.confidence.high}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div className="bg-green-400 h-2 rounded-full" style={{ width: `${mockAutomationMetrics.confidence.high}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Escalation Queue */}
                  <div className="bg-[hsl(0,0%,8%)]/80 border border-[hsl(330,100%,50%)]/20 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
                      Escalation Queue
                    </h3>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {mockEscalationQueue.map((item, index) => (
                        <motion.div 
                          key={item.alertId}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                          className="p-3 bg-[hsl(0,0%,6%)]/60 border border-red-400/20 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono text-[hsl(330,100%,50%)]">{item.alertId}</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              item.status === 'pending' ? 'bg-yellow-400/10 text-yellow-400' :
                              item.status === 'approved' ? 'bg-green-400/10 text-green-400' :
                              'bg-red-400/10 text-red-400'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-300 mb-1">{item.reason}</p>
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>{item.assignedAnalyst}</span>
                            <span>{item.timestamp}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* AI & Analyst Metrics Panel */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-[hsl(0,0%,8%)]/80 border border-[hsl(330,100%,50%)]/20 rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold mb-6">Pipeline Performance Analytics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Outcome Distribution */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3 text-gray-300">Outcome Distribution</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-400">True Positives</span>
                        <span className="text-green-400 font-medium">42%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-green-400 h-2 rounded-full w-[42%]"></div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-orange-400">False Positives</span>
                        <span className="text-orange-400 font-medium">31%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-orange-400 h-2 rounded-full w-[31%]"></div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-red-400">Escalated</span>
                        <span className="text-red-400 font-medium">27%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-red-400 h-2 rounded-full w-[27%]"></div>
                      </div>
                    </div>
                  </div>

                  {/* Processing Time Comparison */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3 text-gray-300">Avg Handling Time</h4>
                    <div className="space-y-4">
                      <div className="bg-[hsl(267,100%,67%)]/10 border border-[hsl(267,100%,67%)]/20 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-[hsl(267,100%,67%)]">Automated</span>
                          <span className="text-[hsl(267,100%,67%)] font-medium">2.3s</span>
                        </div>
                        <div className="text-xs text-gray-400">AI Processing</div>
                      </div>

                      <div className="bg-[hsl(330,100%,50%)]/10 border border-[hsl(330,100%,50%)]/20 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-[hsl(330,100%,50%)]">Manual</span>
                          <span className="text-[hsl(330,100%,50%)] font-medium">18.7m</span>
                        </div>
                        <div className="text-xs text-gray-400">Analyst Review</div>
                      </div>

                      <div className="text-xs text-gray-400 text-center">
                        87% faster with AI automation
                      </div>
                    </div>
                  </div>

                  {/* Vendor Performance */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3 text-gray-300">Top Alert Sources</h4>
                    <div className="space-y-2">
                      {['CrowdStrike', 'Splunk', 'Microsoft Sentinel', 'Palo Alto', 'AWS GuardDuty'].map((vendor, index) => (
                        <div key={vendor} className="flex items-center justify-between">
                          <span className="text-sm text-gray-300">{vendor}</span>
                          <span className="text-xs text-[hsl(330,100%,50%)]">{Math.floor(Math.random() * 200) + 50}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </main>
      </div>

      {/* Enhanced Alert Detail Modal with Root Cause Analysis */}
      {selectedAlert && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedAlert(null)}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[hsl(0,0%,8%)] border border-[hsl(330,100%,50%)]/20 rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold glow-text">Alert Investigation Center</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedAlert(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-400">Alert ID:</span>
                    <p className="text-[hsl(330,100%,50%)] font-mono">{selectedAlert.id}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">Source:</span>
                    <p className="text-white">{selectedAlert.source}</p>
                  </div>
                </div>

                <div>
                  <span className="text-sm text-gray-400">Title:</span>
                  <p className="text-white font-medium">{selectedAlert.title}</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-gray-400">Severity:</span>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border mt-1 ${getSeverityColor(selectedAlert.severity)}`}>
                      {selectedAlert.severity}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">Status:</span>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(selectedAlert.status)}`}>
                      {selectedAlert.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">Confidence:</span>
                    <p className="text-[hsl(330,100%,50%)] font-medium">{selectedAlert.confidence}%</p>
                  </div>
                </div>

                <div>
                  <span className="text-sm text-gray-400">Assigned Analyst:</span>
                  <p className="text-white">{selectedAlert.assignedAnalyst}</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* AI Root Cause Analysis */}
                <div className="bg-[hsl(0,0%,6%)]/60 border border-[hsl(267,100%,67%)]/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Brain className="w-4 h-4 text-[hsl(267,100%,67%)]" />
                    <span className="text-sm font-semibold text-[hsl(267,100%,67%)]">AI Root Cause Analysis</span>
                  </div>
                  <p className="text-sm text-gray-300">{selectedAlert.rootCause}</p>
                </div>

                {/* AI Recommendation */}
                <div className="bg-[hsl(0,0%,6%)]/60 border border-[hsl(330,100%,50%)]/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-[hsl(330,100%,50%)]" />
                    <span className="text-sm font-semibold text-[hsl(330,100%,50%)]">AI Recommendation</span>
                  </div>
                  <p className="text-sm text-gray-300">{selectedAlert.aiRecommendation}</p>
                </div>

                {/* Quick Actions */}
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1 border-[hsl(330,100%,50%)]/20 text-[hsl(330,100%,50%)]">
                    <Shield className="w-4 h-4 mr-2" />
                    Isolate
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 border-[hsl(267,100%,67%)]/20 text-[hsl(267,100%,67%)]">
                    <Bot className="w-4 h-4 mr-2" />
                    Auto-Remediate
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Modal for Escalation Decision */}
      {showEscalationModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-lg z-50 flex items-center justify-center p-4"
          onClick={() => setShowEscalationModal(false)}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[hsl(0,0%,8%)] border border-[hsl(330,100%,50%)]/20 rounded-xl p-8 max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-6 text-center glow-text">Escalation Action</h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-300 text-center">Choose an action for the escalated alert.</p>
              <div className="flex justify-center space-x-4 mt-6">
                <Button 
                  variant="outline" 
                  className="border-green-400/20 text-green-400 hover:bg-green-400/10"
                  onClick={() => { setEscalationDecision("approve"); setShowEscalationModal(false); }}
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Approve & Assign
                </Button>
                <Button 
                  variant="outline" 
                  className="border-red-400/20 text-red-400 hover:bg-red-400/10"
                  onClick={() => { setEscalationDecision("reject"); setShowEscalationModal(false); }}
                >
                  <ThumbsDown className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Logout Overlay */}
      <AnimatePresence>
        {showLogoutOverlay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(51,0,51,0.4) 50%, rgba(0,0,0,0.8) 100%)"
            }}
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="text-center"
            >
              <motion.h1 
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                className="text-6xl font-bold mb-4 bg-gradient-to-r from-[hsl(330,100%,50%)] to-[hsl(267,100%,67%)] bg-clip-text text-transparent"
                style={{
                  textShadow: "0 0 30px rgba(255,20,147,0.5), 0 0 60px rgba(138,43,226,0.3)"
                }}
              >
                See You Soon!
              </motion.h1>
              
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center space-x-2 mb-6"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 border-2 border-[hsl(330,100%,50%)] border-t-transparent rounded-full"
                />
                <span className="text-gray-300">Logging out securely...</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-[hsl(267,100%,67%)] text-lg"
              >
                ✨ Thank you for using Alpha Platform ✨
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}