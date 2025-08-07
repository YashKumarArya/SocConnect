import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Shield, Brain, AlertTriangle, CheckCircle, Clock, Eye, Download, RefreshCw, Activity, Users, Server, Network, FileText, Target, Zap, TrendingUp, BarChart3, Settings, Bell, User, Search, Filter, Calendar, MessageSquare, ExternalLink, ChevronDown, ChevronRight, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ThreatVisualization } from "@/components/ui/threat-visualization";
import InvestigationKnowledgeGraph from "@/components/ui/investigation-knowledge-graph";

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
  const [selectedTimelineEvent, setSelectedTimelineEvent] = useState<string | null>(null);
  const [knowledgeGraphExpanded, setKnowledgeGraphExpanded] = useState(false);
  const [animationNodes, setAnimationNodes] = useState<{ id: string; x: number; y: number }[]>([]);

  const timelineEvents: TimelineEvent[] = [
    {
      id: "1",
      timestamp: "2024-01-15 09:15:23",
      type: "detection",
      status: "completed",
      title: "Alert Raised",
      description: "SLA compliance: On Track",
      user: "System"
    },
    {
      id: "2", 
      timestamp: "2024-01-15 09:16:45",
      type: "analysis",
      status: "completed",
      title: "Acknowledged",
      description: "Analyst review initiated",
      user: "John Doe"
    },
    {
      id: "3",
      timestamp: "2024-01-15 09:25:12",
      type: "investigation",
      status: "in_progress",
      title: "Investigation Completed",
      description: "Threat analysis in progress",
      user: "Sarah Chen"
    },
    {
      id: "4",
      timestamp: "2024-01-15 10:30:00",
      type: "containment",
      status: "pending",
      title: "Contained",
      description: "Mitigation actions pending",
      user: "Marcus Johnson"
    },
    {
      id: "5",
      timestamp: "2024-01-15 11:00:00",
      type: "closed",
      status: "pending",
      title: "Closed",
      description: "Resolution pending",
      user: "AI System"
    }
  ];

  const knowledgeNodes: KnowledgeNode[] = [
    { id: "host-a", type: "asset", label: "Host A", x: 150, y: 100, connections: ["user-1", "process-1"], risk: "high" },
    { id: "user-1", type: "user", label: "User Account", x: 300, y: 80, connections: ["host-a", "ip-1"], risk: "medium" },
    { id: "ip-1", type: "ip", label: "192.168.1.50", x: 450, y: 120, connections: ["user-1", "process-1"], risk: "high" },
    { id: "process-1", type: "process", label: "malware.exe", x: 300, y: 200, connections: ["host-a", "ip-1"], risk: "high" },
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
                <div className="text-white">Sarah Chen</div>
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
              <h1 className="text-3xl font-bold text-red-400 mb-2">Critical Malware Alert: Host A</h1>
              <p className="text-gray-300">Alert ID: CMA-2024-26-001 • Severity: CRITICAL • Jan 15, 2024, 13:15 AM UTC</p>
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
                  <div className="text-4xl font-bold text-[hsl(330,100%,50%)] mb-1">92</div>
                  <div className="text-xs text-gray-400">out of 100</div>
                </div>
                <Progress value={92} className="mb-4" />
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Key Risk Factors:</span>
                  </div>
                  <div className="text-green-400">• Critical asset involved</div>
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
                  <div className="text-4xl font-bold text-[hsl(267,100%,67%)] mb-1">98%</div>
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
                  Limit User Access
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
                  <div className="text-2xl font-bold text-[hsl(330,100%,50%)] mb-1">4</div>
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
                    <span>Time Elapsed: 00:01:15</span>
                    <span>Completion: 60%</span>
                  </div>
                  <Progress value={60} className="h-2" />
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
                A sophisticated malware attack was detected targeting a critical production server (Host A). The attack involved an exploit of a known vulnerability leading to lateral movement within the DMZ network and potential compromise of a user account. The system identified outbound connections to a known Command and Control (C2) server.
              </p>

              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Key Findings:</h4>
                  <div className="space-y-1 text-sm text-gray-300 ml-4">
                    <div>• Host A (192.168.1.50) compromised via zero-day exploit.</div>
                    <div>• Malware established C2 communications.</div>
                    <div>• Potential lateral movement to internal networks.</div>
                    <div>• User account 'john.doe' showed suspicious login activity.</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Recommended Actions:</h4>
                  <div className="space-y-1 text-sm text-gray-300 ml-4">
                    <div>• Immediate isolation of Host A and affected network segments.</div>
                    <div>• Forensic analysis on Host A to identify initial compromise vector.</div>
                    <div>• Force password reset for 'john.doe' and review access logs.</div>
                    <div>• Update IDS/IPS signatures and firewall rules.</div>
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
                  <div className="bg-[hsl(0,0%,6%)] p-3 rounded border border-red-500/20">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-red-400 font-medium">2024-01-15 09:15:23</span>
                      <Badge variant="outline" className="border-red-400/20 text-red-400">Critical</Badge>
                    </div>
                    <p className="text-gray-300">Malicious executable detected on Host A</p>
                  </div>

                  <div className="bg-[hsl(0,0%,6%)] p-3 rounded border border-orange-500/20">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-orange-400 font-medium">2024-01-15 09:16:05</span>
                      <Badge variant="outline" className="border-orange-400/20 text-orange-400">High</Badge>
                    </div>
                    <p className="text-gray-300">Outbound connection attempt to known C2 server (185.234.72.3)</p>
                  </div>

                  <div className="bg-[hsl(0,0%,6%)] p-3 rounded border border-yellow-500/20">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-yellow-400 font-medium">2024-01-15 09:16:50</span>
                      <Badge variant="outline" className="border-yellow-400/20 text-yellow-400">Medium</Badge>
                    </div>
                    <p className="text-gray-300">Suspicious user login from unusual IP address (198.51.100.25)</p>
                  </div>

                  <div className="bg-[hsl(0,0%,6%)] p-3 rounded border border-green-500/20">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-green-400 font-medium">2024-01-15 09:17:12</span>
                      <Badge variant="outline" className="border-green-400/20 text-green-400">Info</Badge>
                    </div>
                    <p className="text-gray-300">Alert generated by SIEM system based on correlated events</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}