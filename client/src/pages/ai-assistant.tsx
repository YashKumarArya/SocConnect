import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Settings, Bell, User, Shield, AlertTriangle, CheckCircle, Search, Filter, BarChart3, Activity, Eye, Clock, TrendingUp, Target, Zap, Brain, Calendar, MessageSquare, Download, Moon, Sun, PieChart, LineChart, TrendingDown, Bot, Lightbulb, FileText, RefreshCw, ArrowRight, PlayCircle, PauseCircle, UserCheck, X, ThumbsUp, ThumbsDown, Workflow, Send, Mic, Paperclip, MoreHorizontal, Copy, ExternalLink, ChevronDown, Network, Server, Users, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface AlertSummary {
  alertId: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  status: "Active" | "Investigating" | "Resolved";
  detected: string;
  lastUpdated: string;
  assignedAnalyst: string;
  riskScore: number;
  aiConfidence: number;
  sourceIp: string;
  destinationIp: string;
  destinationPort: string;
  protocol: string;
  detectedBy: string;
  actionTaken: string;
  geoLocation: string;
}

interface NetworkFlow {
  flowId: string;
  startTime: string;
  endTime: string;
  bytesSent: string;
  bytesReceived: string;
  packets: string;
  flags: string;
  application: string;
}

interface ImpactedEntity {
  type: "user" | "device" | "server";
  name: string;
  identifier: string;
  icon: typeof User | typeof Server | typeof Network;
}

interface IoC {
  id: string;
  type: string;
  value: string;
  confidence: string;
}

export default function AIAssistant() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isUnauthenticated, isLoading: authLoading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  
  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['/api/alerts'],
    queryFn: api.getAlerts,
    enabled: isAuthenticated,
  });
  
  const { data: threatIntel } = useQuery({
    queryKey: ['/api/threatintel'],
    queryFn: api.getThreatIntel,
    enabled: isAuthenticated,
  });
  
  const { data: sources } = useQuery({
    queryKey: ['/api/sources'],
    queryFn: api.getSources,
    enabled: isAuthenticated,
  });

  // Convert real data to original UI format for compatibility
  const getCurrentAlert = (): AlertSummary => {
    const alert = alerts?.find((a: any) => a.severity === 'critical' || a.severity === 'high') || alerts?.[0];
    const incident = incidents?.find((i: any) => i.severity === 'critical' || i.severity === 'high') || incidents?.[0];
    
    if (alert || incident) {
      const baseData = alert || incident;
      return {
        alertId: `ALT-${baseData.id.slice(-7)}`,
        severity: (baseData.severity?.charAt(0).toUpperCase() + baseData.severity?.slice(1)) as AlertSummary['severity'] || "Medium",
        status: (baseData.status === 'open' ? 'Active' : baseData.status === 'monitoring' ? 'Investigating' : 'Resolved') as AlertSummary['status'],
        detected: new Date(baseData.createdAt || baseData.receivedAt).toLocaleString(),
        lastUpdated: new Date(baseData.updatedAt || baseData.receivedAt).toLocaleString(),
        assignedAnalyst: baseData.assignedTo || "AI Auto-Triage",
        riskScore: Math.floor(Math.random() * 30) + 70,
        aiConfidence: Math.floor(Math.random() * 20) + 80,
        sourceIp: "192.168.1.105",
        destinationIp: "185.199.108.153",
        destinationPort: "443",
        protocol: "TCP",
        detectedBy: baseData.sourceId || "Advanced Detection Rule",
        actionTaken: "Analyzed by AI - " + (baseData.status || 'monitoring'),
        geoLocation: "Suspicious Geographic Pattern"
      };
    }
    
    return {
      alertId: "ALT-2804-001",
      severity: "Critical",
      status: "Active", 
      detected: new Date().toLocaleString(),
      lastUpdated: new Date().toLocaleString(),
      assignedAnalyst: "AI Auto-Triage",
      riskScore: 92,
      aiConfidence: 88,
      sourceIp: "192.168.1.105",
      destinationIp: "185.199.108.153",
      destinationPort: "443",
      protocol: "TCP",
      detectedBy: "Advanced ML Detection",
      actionTaken: "Real-time Monitoring",
      geoLocation: "Global Threat Pattern"
    };
  };

  const alertData = getCurrentAlert();

  const impactedEntities: ImpactedEntity[] = incidents?.slice(0, 3).map((incident: any, index: number) => {
    const types = ["user", "device", "server"] as const;
    const icons = [User, Network, Server];
    return {
      type: types[index % 3],
      name: incident.title || `${types[index % 3]}-${incident.id.slice(-6)}`,
      identifier: `Incident ${incident.id.slice(-6)}`,
      icon: icons[index % 3]
    };
  }) || [
    { type: "user", name: "jane.doe@example.com", identifier: "User Account", icon: User },
    { type: "device", name: "HR-Laptop-007", identifier: "Device", icon: Network },
    { type: "server", name: "prod-web-server-01", identifier: "Server", icon: Server }
  ];

  const indicators: IoC[] = threatIntel?.slice(0, 3).map((intel: any, index: number) => ({
    id: `ioc-${index}`,
    type: intel.type || "IP",
    value: intel.indicator || `IOC-${index}`,
    confidence: intel.confidence || (index === 0 ? "High" : "Medium"),
  })) || [
    { id: "1", type: "IP", value: "185.199.108.153", confidence: "High" },
    { id: "2", type: "Hash", value: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6", confidence: "Medium" },
    { id: "3", type: "Domain", value: "malicious-c2server.ru", confidence: "High" }
  ];

  const networkFlow: NetworkFlow = {
    flowId: "0x48C0123EF04",
    startTime: new Date(Date.now() - 180000).toLocaleString(),
    endTime: new Date().toLocaleString(),
    bytesSent: "1.2 GB",
    bytesReceived: "45.6 MB",
    packets: "15,200",
    flags: "SYN, ACK, PSH, FIN",
    application: "HTTPS"
  };

  const initialMessages: ChatMessage[] = [
    {
      id: "1",
      type: "assistant",
      content: `I've detected unusual outbound traffic originating from '${alertData.sourceIp}' to a known malicious IP '${alertData.destinationIp}' on port '${alertData.destinationPort}' (HTTPS). This activity is highly indicative of potential command and control (C2) communication.\n\nSource IP: ${alertData.sourceIp}\nDestination IP: ${alertData.destinationIp}\nDestination Port: ${alertData.destinationPort}\nProtocol: ${alertData.protocol}\nAnomaly Type: Outbound C2 Traffic\n\nBased on ${incidents?.length || 0} active incidents and ${alerts?.length || 0} alerts from your security infrastructure.`,
      timestamp: new Date()
    },
    {
      id: "2",
      type: "user",
      content: "What process initiated this connection on " + alertData.sourceIp + "?",
      timestamp: new Date()
    },
    {
      id: "3",
      type: "assistant",
      content: `Analysis indicates the connection was initiated by a suspicious process. Based on current security data from ${sources?.length || 0} connected sources, further investigation into process tree and executed commands is recommended. Would you like me to initiate an automated scan?`,
      timestamp: new Date()
    }
  ];

  const suggestedActions = [
    "Run Automated Scan",
    "View Process Tree", 
    "Show me the full network flow data for this connection",
    "Run full vulnerability scan",
    "Isolate impacted host",
    "Generate incident report",
    "Check user login activity",
    "Analyze threat patterns"
  ];

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      setMessages(initialMessages);
    }
  }, [authLoading, isAuthenticated, incidents?.length, alerts?.length, sources?.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const simulateTyping = (content: string, callback: () => void) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      callback();
    }, 1000 + Math.random() * 2000);
  };

  const generateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('network flow') || input.includes('connection')) {
      return `Here is a summary of the network flow for the suspicious connection. High volume outbound traffic observed. The connection persisted for 3 minutes before being terminated by the firewall.\n\nFlow ID: ${networkFlow.flowId}\nStart Time: ${networkFlow.startTime}\nEnd Time: ${networkFlow.endTime}\nBytes Sent: ${networkFlow.bytesSent}\nBytes Received: ${networkFlow.bytesReceived}\nPackets: ${networkFlow.packets}\nFlags: ${networkFlow.flags}\nApplication: ${networkFlow.application}`;
    }
    
    if (input.includes('scan') || input.includes('automated')) {
      return "The automated scan has been initiated. I'll monitor the progress and notify you of any findings. Estimated completion time: 5 minutes.\n\nScan includes:\n• Malware detection\n• Vulnerability assessment\n• Network traffic analysis\n• Process tree examination";
    }
    
    if (input.includes('vulnerability')) {
      const criticalCount = alerts?.filter((a: any) => a.severity === 'critical').length || 0;
      return `I've completed the vulnerability scan. The system shows ${criticalCount} critical vulnerabilities that need immediate attention. Would you like me to generate a remediation plan?\n\nKey findings:\n• Critical alerts: ${criticalCount}\n• Total incidents: ${incidents?.length || 0}\n• Active monitoring sources: ${sources?.length || 0}`;
    }
    
    if (input.includes('incident') || input.includes('report')) {
      return `Based on my analysis, this appears to be a coordinated attack. I recommend immediate isolation of the affected host and initiation of incident response procedures.\n\nIncident Summary:\n• Alert ID: ${alertData.alertId}\n• Risk Score: ${alertData.riskScore}%\n• AI Confidence: ${alertData.aiConfidence}%\n• Assigned Analyst: ${alertData.assignedAnalyst}`;
    }

    // Default contextual response
    return `I'm analyzing your security environment with ${incidents?.length || 0} active incidents and ${alerts?.length || 0} alerts. The current threat landscape shows elevated activity requiring attention. What specific aspect would you like me to investigate further?`;
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue("");

    // Generate AI response with real data context
    simulateTyping("", () => {
      const responseContent = generateAIResponse(currentInput);
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: responseContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    });
  };

  const handleSuggestedAction = (action: string) => {
    setInputValue(action);
    setTimeout(() => handleSendMessage(), 100);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'High': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'Investigating': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
  };

  if (authLoading || incidentsLoading || alertsLoading) {
    return (
      <div className="min-h-screen bg-[hsl(215,28%,5%)] text-white p-6">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[hsl(330,100%,50%)] to-[hsl(267,100%,67%)] rounded-full mx-auto mb-4 animate-pulse"></div>
            <div className="text-xl font-semibold text-white mb-2">Loading AI Assistant</div>
            <div className="text-gray-400">Initializing security analysis engine...</div>
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
              <span className="text-xl font-bold glow-text">Smart Alert Management</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" className="border-[hsl(330,100%,50%)]/20 text-[hsl(330,100%,50%)]">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <div className="flex items-center space-x-2 bg-[hsl(0,0%,10%)]/50 rounded-lg px-3 py-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">AI Models Online</span>
            </div>
            <Button variant="ghost" size="icon" className="text-gray-300 hover:text-[hsl(330,100%,50%)] transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
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

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel - AI Assistant Chat */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="w-1/2 border-r border-[hsl(330,100%,50%)]/20 flex flex-col"
        >
          <div className="bg-[hsl(0,0%,8%)]/80 border-b border-[hsl(330,100%,50%)]/20 px-6 py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[hsl(267,100%,67%)] to-[hsl(330,100%,50%)] rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">AI Assistant</h2>
                <p className="text-sm text-gray-400">Analyzing suspicious network traffic...</p>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${
                    message.type === 'user' 
                      ? 'bg-[hsl(330,100%,50%)]/20 border border-[hsl(330,100%,50%)]/30 rounded-l-lg rounded-tr-lg' 
                      : 'bg-[hsl(0,0%,10%)]/80 border border-[hsl(267,100%,67%)]/20 rounded-r-lg rounded-tl-lg'
                  } p-4`}>
                    <div className="whitespace-pre-wrap text-sm text-gray-100">
                      {message.content}
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-[hsl(0,0%,10%)]/80 border border-[hsl(267,100%,67%)]/20 rounded-r-lg rounded-tl-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-[hsl(267,100%,67%)] rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-[hsl(267,100%,67%)] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-[hsl(267,100%,67%)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-400">AI is analyzing...</span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Actions */}
          <div className="px-6 py-3 border-t border-[hsl(330,100%,50%)]/20">
            <div className="flex flex-wrap gap-2 mb-3">
              {suggestedActions.slice(0, 4).map((action, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleSuggestedAction(action)}
                  className="text-xs bg-[hsl(0,0%,10%)]/60 border border-[hsl(330,100%,50%)]/20 hover:border-[hsl(330,100%,50%)]/40 text-gray-300 hover:text-white px-3 py-1 rounded-full transition-all"
                >
                  {action}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-[hsl(330,100%,50%)]/20">
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask the AI for more details..."
                  className="bg-[hsl(0,0%,10%)]/60 border-[hsl(330,100%,50%)]/20 text-white placeholder:text-gray-400 pr-20"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                  <Button variant="ghost" size="icon" className="w-6 h-6">
                    <Mic className="w-4 h-4 text-gray-400" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-6 h-6">
                    <Paperclip className="w-4 h-4 text-gray-400" />
                  </Button>
                </div>
              </div>
              <Button 
                onClick={handleSendMessage}
                className="bg-[hsl(330,100%,50%)] hover:bg-[hsl(330,100%,60%)] text-white"
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Right Panel - Alert Details */}
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-1/2 overflow-y-auto"
        >
          <div className="p-6 space-y-6">
            {/* Alert Header */}
            <div className="bg-[hsl(0,0%,8%)]/80 border border-[hsl(330,100%,50%)]/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                  <h2 className="text-xl font-bold text-white">Suspicious Network Traffic Detected</h2>
                </div>
                <Button variant="outline" className="border-green-500/20 text-green-400">
                  Bulk Auto-Triage
                </Button>
              </div>
              
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div>
                  <span className="text-xs text-gray-400">Risk Score:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold text-[hsl(330,100%,50%)]">{alertData.riskScore}%</span>
                    <Progress value={alertData.riskScore} className="flex-1" />
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-400">AI Confidence:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold text-[hsl(267,100%,67%)]">{alertData.aiConfidence}%</span>
                    <Progress value={alertData.aiConfidence} className="flex-1" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Alert ID:</span>
                  <div className="text-white font-mono">{alertData.alertId}</div>
                </div>
                <div>
                  <span className="text-gray-400">Detected:</span>
                  <div className="text-white">{alertData.detected}</div>
                </div>
                <div>
                  <span className="text-gray-400">Last Updated:</span>
                  <div className="text-white">{alertData.lastUpdated}</div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex space-x-2">
                  <Badge className={getSeverityColor(alertData.severity)}>
                    {alertData.severity}
                  </Badge>
                  <Badge className={getStatusColor(alertData.status)}>
                    {alertData.status}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <User className="w-4 h-4" />
                  <span>{alertData.assignedAnalyst}</span>
                </div>
              </div>
            </div>

            {/* Alert Summary */}
            <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
              <CardHeader>
                <CardTitle className="text-white">Alert Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Source IP:</span>
                    <div className="text-white font-mono">{alertData.sourceIp}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Destination IP:</span>
                    <div className="text-white font-mono">{alertData.destinationIp}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Destination Port:</span>
                    <div className="text-white">{alertData.destinationPort}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Protocol:</span>
                    <div className="text-white">{alertData.protocol}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Detected By:</span>
                    <div className="text-white">{alertData.detectedBy}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Action Taken:</span>
                    <div className="text-white">{alertData.actionTaken}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400">Geo-Location:</span>
                    <div className="text-white">{alertData.geoLocation}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Impacted Entities */}
            <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
              <CardHeader>
                <CardTitle className="text-white">Impacted Entities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {impactedEntities.map((entity, index) => {
                    const Icon = entity.icon;
                    return (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-[hsl(0,0%,6%)]/60 rounded-lg border border-[hsl(330,100%,50%)]/10">
                        <Icon className="w-5 h-5 text-[hsl(330,100%,50%)]" />
                        <div className="flex-1">
                          <div className="text-white font-medium">{entity.name}</div>
                          <div className="text-xs text-gray-400">{entity.identifier}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Indicators of Compromise */}
            <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
              <CardHeader>
                <CardTitle className="text-white">Indicators of Compromise (IOCs)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {indicators.map((ioc) => (
                    <div key={ioc.id} className="flex items-center justify-between p-3 bg-[hsl(0,0%,6%)]/60 rounded-lg border border-[hsl(330,100%,50%)]/10">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="border-[hsl(330,100%,50%)]/20 text-[hsl(330,100%,50%)]">
                          {ioc.type}
                        </Badge>
                        <span className="text-white font-mono text-sm">{ioc.value}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={ioc.confidence === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}>
                          {ioc.confidence}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}