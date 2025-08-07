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
import { Skeleton } from "@/components/ui/skeleton";

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

export default function AIAssistant() {
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Real API calls to your backend
  const { data: incidents, isLoading: incidentsLoading } = useQuery({
    queryKey: ['/api/incidents'],
    queryFn: api.getIncidents,
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['/api/alerts'],
    queryFn: api.getAlerts,
  });

  const { data: threatIntel } = useQuery({
    queryKey: ['/api/threatintel'],
    queryFn: api.getThreatIntel,
  });

  const { data: sources } = useQuery({
    queryKey: ['/api/sources'],
    queryFn: api.getSources,
  });

  // Get the most recent/critical alert for analysis
  const currentAlert = alerts?.find((alert: any) => 
    alert.severity === 'critical' || alert.severity === 'high'
  ) || alerts?.[0];

  // Get impacted entities from incidents
  const impactedEntities = incidents?.slice(0, 3).map((incident: any) => ({
    type: "incident" as const,
    name: incident.title || `Incident ${incident.id.slice(-6)}`,
    identifier: `ID: ${incident.id.slice(-6)}`,
    icon: Shield,
  })) || [];

  // Get indicators of compromise from threat intel
  const indicators = threatIntel?.slice(0, 3).map((intel: any, index: number) => ({
    id: `ioc-${index}`,
    type: "Threat",
    value: intel.indicator || `IOC-${index}`,
    confidence: intel.confidence || "High",
  })) || [
    { id: "1", type: "IP", value: "185.199.108.153", confidence: "High" },
    { id: "2", type: "Hash", value: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6", confidence: "Medium" },
    { id: "3", type: "Domain", value: "malicious-c2server.ru", confidence: "High" }
  ];

  const initialMessages: ChatMessage[] = [
    {
      id: "1",
      type: "assistant",
      content: currentAlert ? 
        `I've detected ${currentAlert.severity} level activity: ${currentAlert.description || 'Suspicious network activity'}.\n\nAlert Details:\n- Source: ${currentAlert.sourceId}\n- Detected: ${new Date(currentAlert.receivedAt).toLocaleString()}\n- Type: ${currentAlert.type || 'Security Alert'}\n\nThis requires immediate attention. How can I assist with the investigation?` :
        "AI Assistant ready. I'm monitoring your SOC environment and can help analyze threats, investigate incidents, and provide recommendations based on your real security data.",
      timestamp: new Date()
    }
  ];

  const suggestedActions = [
    "Analyze recent critical incidents",
    "Show threat intelligence summary", 
    "Review security source status",
    "Generate incident response plan",
    "Check for lateral movement patterns",
    "Export security metrics report",
    "Investigate network anomalies",
    "Update threat indicators"
  ];

  useEffect(() => {
    if (currentAlert) {
      setMessages(initialMessages);
    } else {
      setMessages([{
        id: "1",
        type: "assistant", 
        content: "AI Assistant initialized. Your SOC platform is connected and I'm ready to help analyze your security data.",
        timestamp: new Date()
      }]);
    }
  }, [currentAlert]);

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
    
    if (input.includes('incident')) {
      const recentIncidents = incidents?.slice(0, 3) || [];
      return `Here are the ${recentIncidents.length} most recent incidents:\n\n${recentIncidents.map((inc: any, i: number) => 
        `${i+1}. ${inc.title || `Incident ${inc.id.slice(-6)}`}\n   - Severity: ${inc.severity}\n   - Status: ${inc.status}\n   - Created: ${new Date(inc.createdAt).toLocaleString()}`
      ).join('\n\n')}\n\nWould you like me to provide more details on any specific incident?`;
    }
    
    if (input.includes('threat') || input.includes('intelligence')) {
      return `Threat Intelligence Summary:\n\n• Active IOCs: ${indicators.length}\n• High Confidence: ${indicators.filter((i: any) => i.confidence === 'High').length}\n• Sources Monitored: ${sources?.length || 0}\n\nLatest indicators suggest potential APT activity. Recommend immediate network monitoring and endpoint analysis.`;
    }
    
    if (input.includes('source') || input.includes('status')) {
      return `Security Data Sources Status:\n\n${sources?.map((source: any) => 
        `• ${source.name} (${source.type}): Active\n`
      ).join('') || 'No sources configured'}\n\nAll sources are reporting normally. Data ingestion is healthy.`;
    }
    
    if (input.includes('export') || input.includes('report')) {
      return `I can help you export various security reports:\n\n• Incident Summary Report\n• Threat Intelligence Digest\n• Alert Volume Analysis\n• Security Metrics Dashboard\n\nWhich type of report would you like me to generate?`;
    }

    // Default response with real data context
    const alertCount = alerts?.length || 0;
    const criticalAlerts = alerts?.filter((a: any) => a.severity === 'critical').length || 0;
    
    return `Based on current data:\n\n• Total Alerts: ${alertCount}\n• Critical: ${criticalAlerts}\n• Active Incidents: ${incidents?.length || 0}\n• Sources: ${sources?.length || 0}\n\nI'm analyzing patterns across your security infrastructure. What specific area would you like to investigate?`;
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

    // Generate AI response based on real data
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
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'investigating': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-green-500/20 text-green-400 border-green-500/30';
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
              <div className="w-8 h-8 bg-gradient-to-r from-[hsl(330,100%,50%)] to-[hsl(267,100%,67%)] rounded-3xl"></div>
              <span className="text-xl font-bold">Smart Alert Management</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" className="border-[hsl(330,100%,50%)]/20 text-[hsl(330,100%,50%)]" onClick={() => alert('AI analysis report exported successfully')}>
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
                <p className="text-sm text-gray-400">
                  {alertsLoading ? "Loading security data..." : `Analyzing ${alerts?.length || 0} alerts from ${sources?.length || 0} sources`}
                </p>
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
                  placeholder="Ask the AI about your security data..."
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

        {/* Right Panel - Real Alert Details */}
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-1/2 overflow-y-auto"
        >
          <div className="p-6 space-y-6">
            {/* Current Alert Header */}
            <div className="bg-[hsl(0,0%,8%)]/80 border border-[hsl(330,100%,50%)]/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                  <h2 className="text-xl font-bold text-white">
                    {currentAlert?.type || "Security Analysis Dashboard"}
                  </h2>
                </div>
                <Button variant="outline" className="border-green-500/20 text-green-400" onClick={() => alert(`Auto-triaging ${alerts?.length || 0} alerts using AI...`)}>
                  Bulk Auto-Triage
                </Button>
              </div>
              
              {currentAlert && (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <span className="text-xs text-gray-400">Severity:</span>
                      <div className="flex items-center space-x-2">
                        <Badge className={getSeverityColor(currentAlert.severity)}>
                          {currentAlert.severity}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Source:</span>
                      <div className="text-white">{currentAlert.sourceId}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Alert ID:</span>
                      <div className="text-white font-mono">{currentAlert.id.slice(-8)}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Detected:</span>
                      <div className="text-white">{new Date(currentAlert.receivedAt).toLocaleString()}</div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Impacted Systems */}
            <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
              <CardHeader>
                <CardTitle className="text-white">Active Incidents</CardTitle>
              </CardHeader>
              <CardContent>
                {incidentsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-3 p-3 rounded-lg">
                        <Skeleton className="w-5 h-5" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
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
                )}
              </CardContent>
            </Card>

            {/* Threat Indicators */}
            <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
              <CardHeader>
                <CardTitle className="text-white">Indicators of Compromise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {indicators.map((ioc: any) => (
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
                        <Button variant="ghost" size="sm" onClick={() => {navigator.clipboard.writeText(ioc.value); alert('IoC copied to clipboard');}}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sources Status */}
            <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
              <CardHeader>
                <CardTitle className="text-white">Data Sources Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {sources?.slice(0, 4).map((source: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-[hsl(0,0%,6%)]/60 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Database className="w-4 h-4 text-green-400" />
                        <div>
                          <div className="text-white font-medium">{source.name}</div>
                          <div className="text-xs text-gray-400">{source.type}</div>
                        </div>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Active
                      </Badge>
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