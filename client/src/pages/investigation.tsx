import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Shield, Brain, AlertTriangle, CheckCircle, Clock, Eye, Download, RefreshCw, Activity, Users, Server, Network, FileText, Target, Zap, TrendingUp, BarChart3, Settings, Bell, User, Search, Filter, Calendar, MessageSquare, ExternalLink, ChevronDown, ChevronRight, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { InvestigationKnowledgeGraph } from "@/components/ui/investigation-knowledge-graph";

interface TimelineEvent {
  id: string;
  timestamp: string;
  type: "detection" | "analysis" | "investigation" | "containment" | "closed";
  status: "completed" | "in_progress" | "pending";
  title: string;
  description: string;
  user?: string;
}

interface KnowledgeNode {
  id: string;
  type: "asset" | "user" | "ip" | "process";
  label: string;
  x: number;
  y: number;
  connections: string[];
  risk: "high" | "medium" | "low";
}

export default function Investigation() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isUnauthenticated, isLoading: authLoading } = useAuth();
  const [selectedTimelineEvent, setSelectedTimelineEvent] = useState<string | null>(null);
  const [knowledgeGraphExpanded, setKnowledgeGraphExpanded] = useState(false);
  const [animationNodes, setAnimationNodes] = useState<{ id: string; x: number; y: number }[]>([]);

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

  const { data: actions, isLoading: actionsLoading } = useQuery({
    queryKey: ['/api/actions'],
    queryFn: api.getActions,
    enabled: isAuthenticated,
  });

  const { data: alerts } = useQuery({
    queryKey: ['/api/alerts'],
    queryFn: api.getAlerts,
    enabled: isAuthenticated,
  });

  const { data: sources } = useQuery({
    queryKey: ['/api/sources'],
    queryFn: api.getSources,
    enabled: isAuthenticated,
  });

  // Get the most critical incident for detailed view
  const criticalIncident = incidents?.find((inc: any) => 
    inc.severity === 'critical' || inc.severity === 'high'
  ) || incidents?.[0];

  // Generate timeline from real incident data combined with mock structure  
  const generateTimelineFromIncident = (incident: any): TimelineEvent[] => {
    if (!incident) {
      // Fallback to original mock data structure
      return [
        {
          id: "1",
          timestamp: new Date(Date.now() - 3600000).toLocaleString(),
          type: "detection",
          status: "completed",
          title: "Alert Raised",
          description: "SLA compliance: On Track",
          user: "System"
        },
        {
          id: "2", 
          timestamp: new Date(Date.now() - 3300000).toLocaleString(),
          type: "analysis",
          status: "completed",
          title: "Acknowledged",
          description: "Analyst review initiated",
          user: "AI Auto-Triage"
        },
        {
          id: "3",
          timestamp: new Date(Date.now() - 2100000).toLocaleString(),
          type: "investigation",
          status: "in_progress",
          title: "Investigation Completed",
          description: "Threat analysis in progress",
          user: "Security Analyst"
        },
        {
          id: "4",
          timestamp: new Date(Date.now() + 600000).toLocaleString(),
          type: "containment",
          status: "pending",
          title: "Contained",
          description: "Mitigation actions pending",
          user: "Senior Analyst"
        },
        {
          id: "5",
          timestamp: new Date(Date.now() + 1800000).toLocaleString(),
          type: "closed",
          status: "pending",
          title: "Closed",
          description: "Resolution pending",
          user: "AI System"
        }
      ];
    }

    const incidentActions = actions?.filter((action: any) => 
      action.incidentId === incident.id
    ) || [];

    const timeline: TimelineEvent[] = [
      {
        id: "detection",
        timestamp: new Date(incident.createdAt).toLocaleString(),
        type: "detection",
        status: "completed",
        title: "Alert Raised",
        description: "SLA compliance: On Track",
        user: "System"
      }
    ];

    // Add acknowledgment
    if (incident.assignedTo) {
      timeline.push({
        id: "ack",
        timestamp: new Date(incident.createdAt + 85000).toLocaleString(),
        type: "analysis",
        status: "completed",
        title: "Acknowledged",
        description: "Analyst review initiated",
        user: incident.assignedTo
      });
    }

    // Add investigation phase
    timeline.push({
      id: "investigation",
      timestamp: new Date(incident.createdAt + 595000).toLocaleString(),
      type: "investigation",
      status: incident.status === 'monitoring' ? "in_progress" : "completed",
      title: "Investigation Completed",
      description: "Threat analysis in progress",
      user: incident.assignedTo || "Security Analyst"
    });

    // Add containment if needed
    if (incident.status === 'monitoring' || incident.status === 'resolved') {
      timeline.push({
        id: "containment",
        timestamp: new Date(incident.updatedAt).toLocaleString(),
        type: "containment",
        status: incident.status === 'resolved' ? "completed" : "pending",
        title: "Contained",
        description: incident.status === 'resolved' ? "Mitigation completed" : "Mitigation actions pending",
        user: incident.assignedTo || "Senior Analyst"
      });
    }

    // Add closure if resolved
    if (incident.status === 'resolved') {
      timeline.push({
        id: "closed",
        timestamp: new Date(incident.updatedAt + 300000).toLocaleString(),
        type: "closed",
        status: "completed",
        title: "Closed",
        description: "Incident resolved successfully",
        user: "AI System"
      });
    }

    return timeline;
  };

  const timelineEvents = generateTimelineFromIncident(criticalIncident);

  // Enhanced knowledge graph with real data integration
  const knowledgeNodes: KnowledgeNode[] = [
    { id: "host-a", type: "asset", label: criticalIncident?.title?.substring(0, 10) || "Host A", x: 150, y: 100, connections: ["user-1", "process-1"], risk: "high" },
    { id: "user-1", type: "user", label: criticalIncident?.assignedTo?.split(' ')[0] || "User Account", x: 300, y: 80, connections: ["host-a", "ip-1"], risk: "medium" },
    { id: "ip-1", type: "ip", label: "192.168.1.50", x: 450, y: 120, connections: ["user-1", "process-1"], risk: "high" },
    { id: "process-1", type: "process", label: sources?.[0]?.name || "malware.exe", x: 300, y: 200, connections: ["host-a", "ip-1"], risk: "high" },
  ];

  // Animate knowledge graph nodes
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationNodes(prev => 
        knowledgeNodes.map(node => ({
          id: node.id,
          x: node.x + Math.sin(Date.now() / 1000 + node.id.length) * 3,
          y: node.y + Math.cos(Date.now() / 1000 + node.id.length) * 3,
        }))
      );
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const getTimelineIcon = (type: string, status: string) => {
    const iconClass = status === 'completed' ? 'text-green-400' : status === 'in_progress' ? 'text-yellow-400' : 'text-gray-400';

    switch (type) {
      case 'detection': return <AlertTriangle className={`w-4 h-4 ${iconClass}`} />;
      case 'analysis': return <Brain className={`w-4 h-4 ${iconClass}`} />;
      case 'investigation': return <Eye className={`w-4 h-4 ${iconClass}`} />;
      case 'containment': return <Shield className={`w-4 h-4 ${iconClass}`} />;
      case 'closed': return <CheckCircle className={`w-4 h-4 ${iconClass}`} />;
      default: return <Clock className={`w-4 h-4 ${iconClass}`} />;
    }
  };

  const getNodeColor = (type: string, risk: string) => {
    const riskColors = {
      high: '#ef4444',
      medium: '#f97316', 
      low: '#22c55e'
    };
    return riskColors[risk as keyof typeof riskColors];
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'asset': return <Server className="w-4 h-4" />;
      case 'user': return <Users className="w-4 h-4" />;
      case 'ip': return <Network className="w-4 h-4" />;
      case 'process': return <Activity className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      default: return 'text-blue-400';
    }
  };

  // Calculate risk scores based on real data
  const ruleBasedRisk = criticalIncident?.severity === 'critical' ? 92 : 
                        criticalIncident?.severity === 'high' ? 78 : 65;
  const mlConfidence = Math.min(98, 80 + (alerts?.length || 0) * 2);
  const relatedAlertsCount = alerts?.filter((a: any) => 
    a.sourceId === criticalIncident?.id || a.severity === criticalIncident?.severity
  )?.length || 4;

  if (authLoading || incidentsLoading || actionsLoading) {
    return (
      <div className="min-h-screen bg-[hsl(215,28%,5%)] text-white p-6">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[hsl(330,100%,50%)] to-[hsl(267,100%,67%)] rounded-full mx-auto mb-4 animate-pulse"></div>
            <div className="text-xl font-semibold text-white mb-2">Loading Investigation Center</div>
            <div className="text-gray-400">Analyzing incident data and building timeline...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(215,28%,5%)] text-white font-['Inter']">
      {/* Header */}
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
              onClick={() => setLocation("/dashboard")}
              className="text-[hsl(330,100%,50%)] hover:bg-[hsl(330,100%,50%)]/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-[hsl(330,100%,50%)] to-[hsl(267,100%,67%)] rounded-3xl glow-button"></div>
              <span className="text-xl font-bold glow-text">Alpha</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" className="border-[hsl(330,100%,50%)]/20 text-[hsl(330,100%,50%)]">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-300 hover:text-[hsl(330,100%,50%)] transition-colors">
              <Bell className="w-5 h-5" />
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

      <div className="p-6 space-y-6">
        {/* Alert Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className={`text-3xl font-bold mb-2 ${getSeverityColor(criticalIncident?.severity)}`}>
                {criticalIncident?.severity?.toUpperCase() || 'CRITICAL'} Investigation: {criticalIncident?.title || 'Security Incident Analysis'}
              </h1>
              <p className="text-gray-300">
                Alert ID: {criticalIncident?.id?.slice(-12) || 'CMA-2024-26-001'} • 
                Severity: {criticalIncident?.severity?.toUpperCase() || 'CRITICAL'} • 
                {criticalIncident ? new Date(criticalIncident.createdAt).toLocaleString() : 'Jan 15, 2024, 13:15 AM UTC'}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" className="border-green-500/20 text-green-400 hover:bg-green-500/10">
                <CheckCircle className="w-4 h-4 mr-2" />
                Acknowledge
              </Button>
              <Button variant="outline" className="border-blue-500/20 text-blue-400 hover:bg-blue-500/10">
                <Eye className="w-4 h-4 mr-2" />
                Resolve
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Risk Assessment Cards */}
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6"
          >
            {/* Rule-based Risk */}
            <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-300">Rule-based Risk</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-[hsl(330,100%,50%)] mb-1">{ruleBasedRisk}</div>
                  <div className="text-xs text-gray-400">out of 100</div>
                </div>
                <Progress value={ruleBasedRisk} className="mb-4" />
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Key Risk Factors:</span>
                  </div>
                  <div className="text-green-400">• {criticalIncident?.severity || 'Critical'} asset involved</div>
                  <div className="text-yellow-400">• Known Vulnerability (Exposed)</div>
                  <div className="text-red-400">• High level of Anomaly</div>
                </div>
              </CardContent>
            </Card>

            {/* ML Prediction Details */}
            <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(267,100%,67%)]/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-300 flex items-center">
                  <Brain className="w-4 h-4 mr-2 text-[hsl(267,100%,67%)]" />
                  ML Prediction Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-[hsl(267,100%,67%)] mb-1">{mlConfidence}%</div>
                  <div className="text-xs text-gray-400">Confidence</div>
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="text-gray-400 mb-1">Top Contributing Features:</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Anomaly Score</span>
                        <span className="text-[hsl(330,100%,50%)]">65%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Behavior Deviation</span>
                        <span className="text-[hsl(330,100%,50%)]">78%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Threat Intelligence Match</span>
                        <span className="text-[hsl(330,100%,50%)]">85%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Recommendation */}
            <Card className="bg-[hsl(0,0%,8%)]/80 border-orange-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-300 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2 text-orange-400" />
                  AI Recommendation Based on Intent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-red-400 font-bold text-lg mb-3">
                  {criticalIncident?.status === 'resolved' ? 'Investigation Complete' : 'Limit User Access'}
                </div>
                <p className="text-xs text-gray-300">
                  This action is recommended to mitigate the impact of the attack.
                </p>
              </CardContent>
            </Card>

            {/* Related Alerts */}
            <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-300 flex items-center">
                  <Target className="w-4 h-4 mr-2 text-[hsl(330,100%,50%)]" />
                  Related Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[hsl(330,100%,50%)] mb-1">{relatedAlertsCount}</div>
                  <div className="text-xs text-gray-400">Similar incidents</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Center Column - Deep Knowledge Graph */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <InvestigationKnowledgeGraph />
          </motion.div>

          {/* Right Column - Timeline & Actions */}
          <motion.div 
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-6"
          >
            {/* Timeline */}
            <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
              <CardHeader>
                <CardTitle className="text-sm text-white">Cybersecurity Alert Lifecycle Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timelineEvents.map((event, index) => (
                    <motion.div 
                      key={event.id}
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="flex items-start space-x-3"
                    >
                      <div className="flex flex-col items-center">
                        <div className={`p-2 rounded-full border-2 ${
                          event.status === 'completed' ? 'bg-green-400/20 border-green-400' :
                          event.status === 'in_progress' ? 'bg-yellow-400/20 border-yellow-400' :
                          'bg-gray-400/20 border-gray-400'
                        }`}>
                          {getTimelineIcon(event.type, event.status)}
                        </div>
                        {index < timelineEvents.length - 1 && (
                          <div className="w-0.5 h-12 bg-gray-600 mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-white">{event.title}</h4>
                          <Badge variant="outline" className={
                            event.status === 'completed' ? 'border-green-400/20 text-green-400' :
                            event.status === 'in_progress' ? 'border-yellow-400/20 text-yellow-400' :
                            'border-gray-400/20 text-gray-400'
                          }>
                            {event.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400 mb-1">{event.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{event.timestamp}</span>
                          {event.user && <span>by {event.user}</span>}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-700">
                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>Time Elapsed: {criticalIncident ? 
                      Math.floor((Date.now() - new Date(criticalIncident.createdAt).getTime()) / 60000) : 0}m</span>
                    <span>Completion: {criticalIncident?.status === 'resolved' ? '100%' : 
                                       criticalIncident?.status === 'monitoring' ? '75%' : '60%'}</span>
                  </div>
                  <Progress value={criticalIncident?.status === 'resolved' ? 100 : 
                                   criticalIncident?.status === 'monitoring' ? 75 : 60} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
              <CardHeader>
                <CardTitle className="text-sm text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="border-green-500/20 text-green-400 hover:bg-green-500/10">
                    <FileText className="w-4 h-4 mr-2" />
                    Event Timeline
                  </Button>
                  <Button variant="outline" size="sm" className="border-blue-500/20 text-blue-400 hover:bg-blue-500/10">
                    <Server className="w-4 h-4 mr-2" />
                    Affected Assets
                  </Button>
                  <Button variant="outline" size="sm" className="border-orange-500/20 text-orange-400 hover:bg-orange-500/10">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Remediation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom Section - Detailed Findings */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Alert Summary */}
          <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
            <CardHeader>
              <CardTitle className="text-white">Alert Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-300 mb-4">
                {criticalIncident?.description || "A sophisticated security incident was detected targeting critical infrastructure. The analysis involves comprehensive threat assessment and potential compromise evaluation through multi-source correlation and advanced behavioral analysis."}
              </p>

              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Key Findings:</h4>
                  <div className="space-y-1 text-sm text-gray-300 ml-4">
                    <div>• {criticalIncident?.severity?.toUpperCase() || 'Critical'} severity incident detected ({criticalIncident?.id?.slice(-6) || '001'}).</div>
                    <div>• Investigation status: {criticalIncident?.status || 'Active monitoring'}.</div>
                    <div>• Data sources: {sources?.length || 0} security tools integrated.</div>
                    <div>• Related alerts: {relatedAlertsCount} similar incidents identified.</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Recommended Actions:</h4>
                  <div className="space-y-1 text-sm text-gray-300 ml-4">
                    <div>• Immediate {criticalIncident?.severity || 'critical'} threat assessment and containment.</div>
                    <div>• Forensic analysis on affected systems and network segments.</div>
                    <div>• Review access logs and enforce additional security measures.</div>
                    <div>• Update detection rules and firewall configurations.</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Event Log */}
          <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
            <CardHeader>
              <CardTitle className="text-white">Detailed Event Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                <div className="text-xs space-y-2">
                  {/* Real incident event */}
                  <div className={`bg-[hsl(0,0%,6%)] p-3 rounded border ${
                    criticalIncident?.severity === 'critical' ? 'border-red-500/20' : 
                    criticalIncident?.severity === 'high' ? 'border-orange-500/20' : 
                    'border-yellow-500/20'
                  }`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className={`${getSeverityColor(criticalIncident?.severity)} font-medium`}>
                        {criticalIncident ? new Date(criticalIncident.createdAt).toLocaleString() : '2024-01-15 09:15:23'}
                      </span>
                      <Badge variant="outline" className={
                        criticalIncident?.severity === 'critical' ? 'border-red-400/20 text-red-400' :
                        criticalIncident?.severity === 'high' ? 'border-orange-400/20 text-orange-400' :
                        'border-yellow-400/20 text-yellow-400'
                      }>
                        {criticalIncident?.severity?.charAt(0).toUpperCase() + criticalIncident?.severity?.slice(1) || 'Critical'}
                      </Badge>
                    </div>
                    <p className="text-gray-300">{criticalIncident?.title || 'Security incident detected by automated monitoring'}</p>
                  </div>

                  {/* Actions as events */}
                  {actions?.slice(0, 3).map((action: any, index: number) => (
                    <div key={action.id} className="bg-[hsl(0,0%,6%)] p-3 rounded border border-blue-500/20">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-blue-400 font-medium">
                          {new Date(action.performedAt).toLocaleString()}
                        </span>
                        <Badge variant="outline" className="border-blue-400/20 text-blue-400">
                          Action
                        </Badge>
                      </div>
                      <p className="text-gray-300">
                        {action.actionType.replace('_', ' ').charAt(0).toUpperCase() + action.actionType.slice(1)} performed by {action.performedBy || 'System'}
                      </p>
                    </div>
                  ))}

                  {/* Fallback mock events if no real data */}
                  {(!actions || actions.length === 0) && (
                    <>
                      <div className="bg-[hsl(0,0%,6%)] p-3 rounded border border-orange-500/20">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-orange-400 font-medium">2024-01-15 09:16:05</span>
                          <Badge variant="outline" className="border-orange-400/20 text-orange-400">High</Badge>
                        </div>
                        <p className="text-gray-300">Outbound connection attempt to known threat infrastructure</p>
                      </div>

                      <div className="bg-[hsl(0,0%,6%)] p-3 rounded border border-green-500/20">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-green-400 font-medium">2024-01-15 09:17:12</span>
                          <Badge variant="outline" className="border-green-400/20 text-green-400">Info</Badge>
                        </div>
                        <p className="text-gray-300">Alert generated by security correlation engine</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}