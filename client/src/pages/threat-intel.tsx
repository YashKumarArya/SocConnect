import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Shield, Eye, Target, AlertTriangle, Search, Filter, Plus, Edit3, Trash2, RefreshCw, Download, Upload, Globe, Database, Zap, Clock, TrendingUp, MapPin, Hash, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ThreatIndicator {
  id: string;
  type: 'ip' | 'domain' | 'hash' | 'url' | 'email';
  value: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  source: string;
  description?: string;
  tags: string[];
  firstSeen: string;
  lastSeen: string;
  isActive: boolean;
}

export default function ThreatIntelligence() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isUnauthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("indicators");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newIndicator, setNewIndicator] = useState({
    type: "ip",
    value: "",
    severity: "medium",
    confidence: 75,
    source: "manual",
    description: "",
    tags: []
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isUnauthenticated) {
      setLocation("/login");
    }
  }, [isUnauthenticated, setLocation]);

  // Real API calls
  const { data: threatIntel, isLoading: threatIntelLoading } = useQuery({
    queryKey: ['/api/threatintel'],
    queryFn: api.getThreatIntel,
    enabled: isAuthenticated,
  });

  const { data: incidents } = useQuery({
    queryKey: ['/api/incidents'],
    queryFn: api.getIncidents,
    enabled: isAuthenticated,
  });

  // Mock threat indicators for display (in real system this would come from API)
  const mockIndicators: ThreatIndicator[] = [
    {
      id: "1",
      type: "ip",
      value: "192.168.1.100",
      severity: "critical",
      confidence: 95,
      source: "crowdstrike",
      description: "Known C2 server IP",
      tags: ["malware", "c2", "apt29"],
      firstSeen: "2024-01-15T10:30:00Z",
      lastSeen: "2024-01-20T14:22:00Z",
      isActive: true
    },
    {
      id: "2",
      type: "domain",
      value: "malicious-site.com",
      severity: "high",
      confidence: 88,
      source: "virustotal",
      description: "Phishing domain",
      tags: ["phishing", "credential-theft"],
      firstSeen: "2024-01-10T08:15:00Z",
      lastSeen: "2024-01-19T16:45:00Z",
      isActive: true
    },
    {
      id: "3",
      type: "hash",
      value: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      severity: "medium",
      confidence: 72,
      source: "analyst",
      description: "Suspicious executable hash",
      tags: ["trojan", "windows"],
      firstSeen: "2024-01-18T12:00:00Z",
      lastSeen: "2024-01-18T12:00:00Z",
      isActive: false
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ip': return <MapPin className="w-4 h-4" />;
      case 'domain': return <Globe className="w-4 h-4" />;
      case 'hash': return <Hash className="w-4 h-4" />;
      case 'url': return <Globe className="w-4 h-4" />;
      case 'email': return <User className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low': return 'text-green-400 bg-green-500/20 border-green-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const filteredIndicators = mockIndicators.filter(indicator => {
    const matchesSearch = !searchQuery || 
      indicator.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
      indicator.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      indicator.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = typeFilter === "all" || indicator.type === typeFilter;
    const matchesSeverity = severityFilter === "all" || indicator.severity === severityFilter;
    
    return matchesSearch && matchesType && matchesSeverity;
  });

  if (authLoading || threatIntelLoading) {
    return (
      <div className="min-h-screen bg-[hsl(215,28%,5%)] text-white p-6">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[hsl(330,100%,50%)] to-[hsl(267,100%,67%)] rounded-full mx-auto mb-4 animate-pulse"></div>
            <div className="text-xl font-semibold text-white mb-2">Loading Threat Intelligence</div>
            <div className="text-gray-400">Initializing threat correlation engine...</div>
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
              <div className="w-8 h-8 bg-gradient-to-r from-[hsl(330,100%,50%)] to-[hsl(267,100%,67%)] rounded-3xl glow-button flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold glow-text">Threat Intelligence</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-[hsl(0,0%,10%)]/50 rounded-lg px-3 py-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">IOCs: {mockIndicators.length}</span>
            </div>
            <Button 
              onClick={() => setShowAddModal(true)}
              className="bg-[hsl(330,100%,50%)] hover:bg-[hsl(330,100%,60%)]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Indicator
            </Button>
          </div>
        </div>
      </motion.header>

      <div className="flex">
        {/* Navigation Sidebar */}
        <motion.aside 
          initial={{ x: -250, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-64 bg-[hsl(0,0%,8%)] border-r border-[hsl(330,100%,50%)]/20 min-h-screen"
        >
          <div className="p-4 space-y-2">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab("indicators")}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${
                  activeTab === "indicators" 
                    ? "text-[hsl(330,100%,50%)] bg-[hsl(330,100%,50%)]/10" 
                    : "text-gray-300 hover:text-[hsl(330,100%,50%)]"
                }`}
              >
                <Target className="w-4 h-4" />
                <span className="text-sm">IOC Management</span>
                <span className="ml-auto bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {mockIndicators.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("feeds")}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${
                  activeTab === "feeds" 
                    ? "text-[hsl(330,100%,50%)] bg-[hsl(330,100%,50%)]/10" 
                    : "text-gray-300 hover:text-[hsl(330,100%,50%)]"
                }`}
              >
                <Database className="w-4 h-4" />
                <span className="text-sm">Threat Feeds</span>
              </button>

              <button
                onClick={() => setActiveTab("correlation")}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${
                  activeTab === "correlation" 
                    ? "text-[hsl(330,100%,50%)] bg-[hsl(330,100%,50%)]/10" 
                    : "text-gray-300 hover:text-[hsl(330,100%,50%)]"
                }`}
              >
                <Zap className="w-4 h-4" />
                <span className="text-sm">Correlation Engine</span>
              </button>

              <button
                onClick={() => setActiveTab("analytics")}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${
                  activeTab === "analytics" 
                    ? "text-[hsl(330,100%,50%)] bg-[hsl(330,100%,50%)]/10" 
                    : "text-gray-300 hover:text-[hsl(330,100%,50%)]"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Threat Analytics</span>
              </button>
            </nav>

            {/* Threat Summary */}
            <div className="mt-8 p-3 bg-[hsl(0,0%,6%)] rounded-lg border border-[hsl(330,100%,50%)]/10">
              <div className="text-xs text-gray-400 mb-2">Threat Summary</div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300">Critical</span>
                  <span className="text-red-400">{mockIndicators.filter(i => i.severity === 'critical').length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300">High</span>
                  <span className="text-orange-400">{mockIndicators.filter(i => i.severity === 'high').length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300">Active</span>
                  <span className="text-green-400">{mockIndicators.filter(i => i.isActive).length}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 p-6 bg-gradient-to-br from-[hsl(215,28%,5%)] to-[hsl(215,28%,7%)]">
          {activeTab === "indicators" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold glow-text">IOC Management</h1>
                <div className="flex items-center space-x-4">
                  <Button variant="outline" className="border-[hsl(330,100%,50%)]/20 text-[hsl(330,100%,50%)]">
                    <Upload className="w-4 h-4 mr-2" />
                    Import IOCs
                  </Button>
                  <Button variant="outline" className="border-[hsl(330,100%,50%)]/20 text-[hsl(330,100%,50%)]">
                    <Download className="w-4 h-4 mr-2" />
                    Export IOCs
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Search IOCs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-[hsl(0,0%,10%)]/60 border-[hsl(330,100%,50%)]/20 text-white"
                      />
                    </div>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-32 bg-[hsl(0,0%,10%)]/60 border-[hsl(330,100%,50%)]/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="ip">IP Address</SelectItem>
                        <SelectItem value="domain">Domain</SelectItem>
                        <SelectItem value="hash">File Hash</SelectItem>
                        <SelectItem value="url">URL</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={severityFilter} onValueChange={setSeverityFilter}>
                      <SelectTrigger className="w-32 bg-[hsl(0,0%,10%)]/60 border-[hsl(330,100%,50%)]/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Severity</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* IOC Table */}
              <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[hsl(330,100%,50%)]/20">
                        <TableHead className="text-gray-300">Type</TableHead>
                        <TableHead className="text-gray-300">Indicator</TableHead>
                        <TableHead className="text-gray-300">Severity</TableHead>
                        <TableHead className="text-gray-300">Confidence</TableHead>
                        <TableHead className="text-gray-300">Source</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredIndicators.map((indicator) => (
                        <TableRow key={indicator.id} className="border-[hsl(330,100%,50%)]/10">
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getTypeIcon(indicator.type)}
                              <span className="text-white capitalize">{indicator.type}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="text-white font-mono text-sm">{indicator.value}</div>
                              {indicator.description && (
                                <div className="text-xs text-gray-400 mt-1">{indicator.description}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getSeverityColor(indicator.severity)}>
                              {indicator.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-white">{indicator.confidence}%</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-gray-300 capitalize">{indicator.source}</div>
                          </TableCell>
                          <TableCell>
                            <Badge className={indicator.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                              {indicator.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm">
                                <Edit3 className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-3 h-3 text-red-400" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "feeds" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold glow-text">Threat Intelligence Feeds</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {['VirusTotal', 'AlienVault OTX', 'MISP', 'IBM X-Force', 'Recorded Future', 'CrowdStrike Intel'].map((feed, index) => (
                  <Card key={index} className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white text-sm">{feed}</CardTitle>
                        <Badge className={index < 3 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                          {index < 3 ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Last Update:</span>
                          <span className="text-white">{index < 3 ? '2 min ago' : '2 days ago'}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">IOCs:</span>
                          <span className="text-[hsl(330,100%,50%)]">{Math.floor(Math.random() * 1000) + 100}</span>
                        </div>
                        <Button size="sm" className="w-full mt-3 bg-[hsl(330,100%,50%)] hover:bg-[hsl(330,100%,60%)]">
                          <RefreshCw className="w-3 h-3 mr-2" />
                          Sync Feed
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "correlation" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold glow-text">Threat Correlation Engine</h1>
              
              <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
                <CardHeader>
                  <CardTitle className="text-white">Recent Correlations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {incidents?.slice(0, 5).map((incident: any) => (
                      <div key={incident.id} className="flex items-center justify-between p-3 bg-[hsl(0,0%,6%)]/60 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Zap className="w-4 h-4 text-[hsl(330,100%,50%)]" />
                          <div>
                            <div className="text-white text-sm">{incident.title}</div>
                            <div className="text-xs text-gray-400">Matched 3 IOCs</div>
                          </div>
                        </div>
                        <Badge className={getSeverityColor(incident.severity)}>
                          {incident.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "analytics" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold glow-text">Threat Analytics</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-300">New IOCs (24h)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[hsl(330,100%,50%)]">127</div>
                    <p className="text-xs text-green-400">↑ 23% vs yesterday</p>
                  </CardContent>
                </Card>

                <Card className="bg-[hsl(0,0%,8%)]/80 border-orange-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-300">Critical Threats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-400">8</div>
                    <p className="text-xs text-red-400">↑ 2 since yesterday</p>
                  </CardContent>
                </Card>

                <Card className="bg-[hsl(0,0%,8%)]/80 border-blue-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-300">Feed Sources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-400">12</div>
                    <p className="text-xs text-gray-400">Active integrations</p>
                  </CardContent>
                </Card>

                <Card className="bg-[hsl(0,0%,8%)]/80 border-green-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-300">Correlations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-400">45</div>
                    <p className="text-xs text-green-400">Auto-matched alerts</p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}