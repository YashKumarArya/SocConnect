import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Settings, Bell, User, Shield, AlertTriangle, CheckCircle, Search, Filter, BarChart3, Activity, Eye, Clock, TrendingUp, Target, Zap, Brain, Calendar, MessageSquare, Download, Moon, Sun, PieChart, LineChart, TrendingDown, Bot, Lightbulb, FileText, RefreshCw, ArrowRight, PlayCircle, PauseCircle, UserCheck, X, ThumbsUp, ThumbsDown, Workflow, LogOut, Plus, Edit3, Trash2, Database, Server, Network, Users, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Source {
  id: string;
  name: string;
  type: string;
  connectionConfig: any;
  isActive: boolean;
  createdAt: string;
}

interface AdminMetrics {
  totalUsers: number;
  activeIncidents: number;
  totalAlerts: number;
  sourcesOnline: number;
  systemHealth: number;
}

export default function AdminPanel() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isUnauthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [newSource, setNewSource] = useState({
    name: "",
    type: "SIEM",
    connectionConfig: {},
    isActive: true
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isUnauthenticated) {
      setLocation("/login");
    }
  }, [isUnauthenticated, setLocation]);

  // Real API calls
  const { data: sources, isLoading: sourcesLoading } = useQuery({
    queryKey: ['/api/sources'],
    queryFn: api.getSources,
    enabled: isAuthenticated,
  });

  const { data: incidents } = useQuery({
    queryKey: ['/api/incidents'],
    queryFn: api.getIncidents,
    enabled: isAuthenticated,
  });

  const { data: alerts } = useQuery({
    queryKey: ['/api/alerts'],
    queryFn: api.getAlerts,
    enabled: isAuthenticated,
  });

  const { data: metrics } = useQuery({
    queryKey: ['/api/metrics'],
    queryFn: api.getMetrics,
    enabled: isAuthenticated,
  });

  const { data: actions } = useQuery({
    queryKey: ['/api/actions'],
    queryFn: api.getActions,
    enabled: isAuthenticated,
  });

  // Mutations for source management
  const createSourceMutation = useMutation({
    mutationFn: (sourceData: any) => api.createSource(sourceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sources'] });
      toast({ title: "Success", description: "Data source created successfully" });
      setShowAddSourceModal(false);
      setNewSource({ name: "", type: "SIEM", connectionConfig: {}, isActive: true });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create data source", variant: "destructive" });
    }
  });

  const deleteSourceMutation = useMutation({
    mutationFn: (sourceId: string) => api.deleteSource(sourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sources'] });
      toast({ title: "Success", description: "Data source deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete data source", variant: "destructive" });
    }
  });

  // Calculate admin metrics
  const adminMetrics: AdminMetrics = {
    totalUsers: 3, // Mock data - in real system this would come from API
    activeIncidents: incidents?.filter((i: any) => i.status === 'open').length || 0,
    totalAlerts: alerts?.length || 0,
    sourcesOnline: sources?.filter((s: any) => s.isActive).length || 0,
    systemHealth: Math.min(100, 85 + (sources?.length || 0) * 3)
  };

  const handleCreateSource = () => {
    if (!newSource.name || !newSource.type) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    createSourceMutation.mutate(newSource);
  };

  const handleDeleteSource = (sourceId: string) => {
    if (window.confirm("Are you sure you want to delete this data source?")) {
      deleteSourceMutation.mutate(sourceId);
    }
  };

  const getSourceTypeIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'SIEM': return <Shield className="w-4 h-4" />;
      case 'EDR': return <Eye className="w-4 h-4" />;
      case 'FIREWALL': return <Server className="w-4 h-4" />;
      case 'IDS': return <Network className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  if (authLoading || sourcesLoading) {
    return (
      <div className="min-h-screen bg-[hsl(215,28%,5%)] text-white p-6">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[hsl(330,100%,50%)] to-[hsl(267,100%,67%)] rounded-full mx-auto mb-4 animate-pulse"></div>
            <div className="text-xl font-semibold text-white mb-2">Loading Admin Panel</div>
            <div className="text-gray-400">Initializing system management interface...</div>
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
              <span className="text-xl font-bold glow-text">System Administration</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-[hsl(0,0%,10%)]/50 rounded-lg px-3 py-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">System Health: {adminMetrics.systemHealth}%</span>
            </div>
            <Button variant="ghost" size="icon" className="text-gray-300 hover:text-[hsl(330,100%,50%)] transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center">
                {adminMetrics.activeIncidents}
              </span>
            </Button>
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-gray-300" />
              <div className="text-sm">
                <div className="text-white">System Administrator</div>
                <div className="text-xs text-gray-400">Admin Panel</div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="flex">
        {/* Admin Navigation Sidebar */}
        <motion.aside 
          initial={{ x: -250, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-64 bg-[hsl(0,0%,8%)] border-r border-[hsl(330,100%,50%)]/20 min-h-screen"
        >
          <div className="p-4 space-y-2">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab("overview")}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${
                  activeTab === "overview" 
                    ? "text-[hsl(330,100%,50%)] bg-[hsl(330,100%,50%)]/10" 
                    : "text-gray-300 hover:text-[hsl(330,100%,50%)]"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm">System Overview</span>
              </button>

              <button
                onClick={() => setActiveTab("sources")}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${
                  activeTab === "sources" 
                    ? "text-[hsl(330,100%,50%)] bg-[hsl(330,100%,50%)]/10" 
                    : "text-gray-300 hover:text-[hsl(330,100%,50%)]"
                }`}
              >
                <Database className="w-4 h-4" />
                <span className="text-sm">Data Sources</span>
                <span className="ml-auto bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {sources?.length || 0}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("users")}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${
                  activeTab === "users" 
                    ? "text-[hsl(330,100%,50%)] bg-[hsl(330,100%,50%)]/10" 
                    : "text-gray-300 hover:text-[hsl(330,100%,50%)]"
                }`}
              >
                <Users className="w-4 h-4" />
                <span className="text-sm">User Management</span>
              </button>

              <button
                onClick={() => setActiveTab("metrics")}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${
                  activeTab === "metrics" 
                    ? "text-[hsl(330,100%,50%)] bg-[hsl(330,100%,50%)]/10" 
                    : "text-gray-300 hover:text-[hsl(330,100%,50%)]"
                }`}
              >
                <Gauge className="w-4 h-4" />
                <span className="text-sm">Performance Metrics</span>
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${
                  activeTab === "settings" 
                    ? "text-[hsl(330,100%,50%)] bg-[hsl(330,100%,50%)]/10" 
                    : "text-gray-300 hover:text-[hsl(330,100%,50%)]"
                }`}
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm">System Settings</span>
              </button>
            </nav>

            {/* System Status */}
            <div className="mt-8 p-3 bg-[hsl(0,0%,6%)] rounded-lg border border-[hsl(330,100%,50%)]/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">System Health</span>
                <span className="text-xs text-[hsl(330,100%,50%)]">{adminMetrics.systemHealth}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-[hsl(330,100%,50%)] h-2 rounded-full" style={{ width: `${adminMetrics.systemHealth}%` }}></div>
              </div>
            </div>
          </div>
        </motion.aside>

        {/* Main Admin Content */}
        <main className="flex-1 p-6 bg-gradient-to-br from-[hsl(215,28%,5%)] to-[hsl(215,28%,7%)]">
          {activeTab === "overview" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold glow-text">System Overview</h1>

              {/* Admin Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-300">Total Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[hsl(330,100%,50%)]">{adminMetrics.totalUsers}</div>
                    <p className="text-xs text-gray-400">Active analysts</p>
                  </CardContent>
                </Card>

                <Card className="bg-[hsl(0,0%,8%)]/80 border-orange-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-300">Active Incidents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-400">{adminMetrics.activeIncidents}</div>
                    <p className="text-xs text-gray-400">Requiring attention</p>
                  </CardContent>
                </Card>

                <Card className="bg-[hsl(0,0%,8%)]/80 border-blue-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-300">Total Alerts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-400">{adminMetrics.totalAlerts}</div>
                    <p className="text-xs text-gray-400">Processed today</p>
                  </CardContent>
                </Card>

                <Card className="bg-[hsl(0,0%,8%)]/80 border-green-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-300">Data Sources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-400">{adminMetrics.sourcesOnline}</div>
                    <p className="text-xs text-gray-400">Sources online</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
                <CardHeader>
                  <CardTitle className="text-white">Recent System Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {actions?.slice(0, 5).map((action: any, index: number) => (
                      <div key={action.id} className="flex items-center justify-between p-3 bg-[hsl(0,0%,6%)]/60 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Activity className="w-4 h-4 text-[hsl(330,100%,50%)]" />
                          <div>
                            <div className="text-white text-sm">{action.actionType.replace('_', ' ')}</div>
                            <div className="text-xs text-gray-400">{action.performedBy || 'System'}</div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(action.performedAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "sources" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold glow-text">Data Source Management</h1>
                <Button 
                  onClick={() => setShowAddSourceModal(true)}
                  className="bg-[hsl(330,100%,50%)] hover:bg-[hsl(330,100%,60%)]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Data Source
                </Button>
              </div>

              {/* Sources Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sources?.map((source: any) => (
                  <Card key={source.id} className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getSourceTypeIcon(source.type)}
                          <div>
                            <CardTitle className="text-white text-sm">{source.name}</CardTitle>
                            <p className="text-xs text-gray-400">{source.type}</p>
                          </div>
                        </div>
                        <Badge className={source.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                          {source.isActive ? 'Online' : 'Offline'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-400">
                          Added: {new Date(source.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteSource(source.id)}
                          >
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Add Source Modal */}
              <AnimatePresence>
                {showAddSourceModal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                  >
                    <motion.div
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.9, y: 20 }}
                      className="bg-[hsl(0,0%,8%)]/95 border border-[hsl(330,100%,50%)]/20 rounded-lg p-6 w-full max-w-md mx-4"
                    >
                      <h2 className="text-xl font-bold text-white mb-4">Add Data Source</h2>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">Source Name</label>
                          <Input
                            value={newSource.name}
                            onChange={(e) => setNewSource({...newSource, name: e.target.value})}
                            placeholder="Enter source name"
                            className="bg-[hsl(0,0%,10%)]/60 border-[hsl(330,100%,50%)]/20 text-white"
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">Source Type</label>
                          <select 
                            value={newSource.type}
                            onChange={(e) => setNewSource({...newSource, type: e.target.value})}
                            className="w-full bg-[hsl(0,0%,10%)]/60 border border-[hsl(330,100%,50%)]/20 text-white rounded-md px-3 py-2"
                          >
                            <option value="SIEM">SIEM</option>
                            <option value="EDR">EDR</option>
                            <option value="FIREWALL">Firewall</option>
                            <option value="IDS">IDS/IPS</option>
                            <option value="CLOUD_SECURITY">Cloud Security</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3 mt-6">
                        <Button 
                          variant="outline"
                          onClick={() => setShowAddSourceModal(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleCreateSource}
                          className="bg-[hsl(330,100%,50%)] hover:bg-[hsl(330,100%,60%)]"
                        >
                          Create Source
                        </Button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === "users" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold glow-text">User Management</h1>
              
              <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
                <CardHeader>
                  <CardTitle className="text-white">System Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['Security Analyst', 'Senior Analyst', 'System Administrator'].map((role, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-[hsl(0,0%,6%)]/60 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <User className="w-5 h-5 text-[hsl(330,100%,50%)]" />
                          <div>
                            <div className="text-white font-medium">{`User ${index + 1}`}</div>
                            <div className="text-xs text-gray-400">{role}</div>
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
            </motion.div>
          )}

          {activeTab === "metrics" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold glow-text">Performance Metrics</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
                  <CardHeader>
                    <CardTitle className="text-white">AI Model Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">Accuracy</span>
                          <span className="text-[hsl(330,100%,50%)]">94.2%</span>
                        </div>
                        <Progress value={94.2} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">Precision</span>
                          <span className="text-[hsl(267,100%,67%)]">91.8%</span>
                        </div>
                        <Progress value={91.8} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">Recall</span>
                          <span className="text-green-400">96.1%</span>
                        </div>
                        <Progress value={96.1} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
                  <CardHeader>
                    <CardTitle className="text-white">System Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">CPU Usage</span>
                          <span className="text-yellow-400">23%</span>
                        </div>
                        <Progress value={23} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">Memory Usage</span>
                          <span className="text-orange-400">67%</span>
                        </div>
                        <Progress value={67} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">Disk Usage</span>
                          <span className="text-blue-400">45%</span>
                        </div>
                        <Progress value={45} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold glow-text">System Settings</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
                  <CardHeader>
                    <CardTitle className="text-white">Security Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Two-Factor Authentication</span>
                      <Badge className="bg-green-500/20 text-green-400">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Session Timeout</span>
                      <span className="text-gray-400">30 minutes</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Auto-logout on Idle</span>
                      <Badge className="bg-green-500/20 text-green-400">Enabled</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
                  <CardHeader>
                    <CardTitle className="text-white">Alert Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Real-time Alerts</span>
                      <Badge className="bg-green-500/20 text-green-400">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Email Notifications</span>
                      <Badge className="bg-green-500/20 text-green-400">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Critical Alert Threshold</span>
                      <span className="text-gray-400">90+</span>
                    </div>
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