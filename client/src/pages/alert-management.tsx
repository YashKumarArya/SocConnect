import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, AlertTriangle, Activity, Play, Pause, RefreshCw, Database, TestTube2, Eye, BarChart3, Zap, Clock, Target, Settings, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function AlertManagement() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isUnauthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [simulationType, setSimulationType] = useState("crowdstrike");
  const [simulationCount, setSimulationCount] = useState(10);
  const [realtimeDuration, setRealtimeDuration] = useState(5);
  const [testAlertData, setTestAlertData] = useState("");
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isUnauthenticated) {
      setLocation("/login");
    }
  }, [isUnauthenticated, setLocation]);

  // Real API calls
  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['/api/alerts'],
    queryFn: api.getAlerts,
    enabled: isAuthenticated,
  });

  const { data: datasetStats } = useQuery({
    queryKey: ['/api/alerts/dataset-stats'],
    queryFn: api.getDatasetStats,
    enabled: isAuthenticated,
  });

  const { data: sources } = useQuery({
    queryKey: ['/api/sources'],
    queryFn: api.getSources,
    enabled: isAuthenticated,
  });

  // Alert simulation mutations
  const simulateAlertsMutation = useMutation({
    mutationFn: ({ sourceType, count }: { sourceType: string; count: number }) => 
      api.simulateAlerts(sourceType, count),
    onSuccess: (data) => {
      toast({ title: "Success", description: "Alert simulation completed successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to simulate alerts", variant: "destructive" });
    }
  });

  const simulateRealtimeMutation = useMutation({
    mutationFn: ({ sourceType, duration }: { sourceType: string; duration: number }) => 
      api.simulateRealTimeAlerts(sourceType, duration),
    onSuccess: () => {
      toast({ title: "Success", description: "Real-time simulation started" });
      setIsSimulationRunning(true);
      // Stop simulation indicator after duration
      setTimeout(() => setIsSimulationRunning(false), realtimeDuration * 60 * 1000);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to start real-time simulation", variant: "destructive" });
    }
  });

  const handleSimulateAlerts = () => {
    simulateAlertsMutation.mutate({ sourceType: simulationType, count: simulationCount });
  };

  const handleRealtimeSimulation = () => {
    simulateRealtimeMutation.mutate({ sourceType: simulationType, duration: realtimeDuration });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  if (authLoading || alertsLoading) {
    return (
      <div className="min-h-screen bg-[hsl(215,28%,5%)] text-white p-6">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[hsl(330,100%,50%)] to-[hsl(267,100%,67%)] rounded-full mx-auto mb-4 animate-pulse"></div>
            <div className="text-xl font-semibold text-white mb-2">Loading Alert Management</div>
            <div className="text-gray-400">Initializing alert processing interface...</div>
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
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold glow-text">Alert Management</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-[hsl(0,0%,10%)]/50 rounded-lg px-3 py-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">Total Alerts: {alerts?.length || 0}</span>
            </div>
            {isSimulationRunning && (
              <div className="flex items-center space-x-2 bg-orange-500/20 rounded-lg px-3 py-2">
                <Activity className="w-4 h-4 text-orange-400 animate-pulse" />
                <span className="text-sm text-orange-400">Real-time Simulation Active</span>
              </div>
            )}
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
                onClick={() => setActiveTab("overview")}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${
                  activeTab === "overview" 
                    ? "text-[hsl(330,100%,50%)] bg-[hsl(330,100%,50%)]/10" 
                    : "text-gray-300 hover:text-[hsl(330,100%,50%)]"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm">Alert Overview</span>
              </button>

              <button
                onClick={() => setActiveTab("simulation")}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${
                  activeTab === "simulation" 
                    ? "text-[hsl(330,100%,50%)] bg-[hsl(330,100%,50%)]/10" 
                    : "text-gray-300 hover:text-[hsl(330,100%,50%)]"
                }`}
              >
                <Play className="w-4 h-4" />
                <span className="text-sm">Alert Simulation</span>
              </button>

              <button
                onClick={() => setActiveTab("normalization")}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${
                  activeTab === "normalization" 
                    ? "text-[hsl(330,100%,50%)] bg-[hsl(330,100%,50%)]/10" 
                    : "text-gray-300 hover:text-[hsl(330,100%,50%)]"
                }`}
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm">Normalization</span>
              </button>

              <button
                onClick={() => setActiveTab("dataset")}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${
                  activeTab === "dataset" 
                    ? "text-[hsl(330,100%,50%)] bg-[hsl(330,100%,50%)]/10" 
                    : "text-gray-300 hover:text-[hsl(330,100%,50%)]"
                }`}
              >
                <Database className="w-4 h-4" />
                <span className="text-sm">Dataset Statistics</span>
              </button>
            </nav>

            {/* Dataset Stats Summary */}
            {datasetStats && (
              <div className="mt-8 p-3 bg-[hsl(0,0%,6%)] rounded-lg border border-[hsl(330,100%,50%)]/10">
                <div className="text-xs text-gray-400 mb-2">Dataset Overview</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">Total</span>
                    <span className="text-[hsl(330,100%,50%)]">{datasetStats.stats?.total || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">CrowdStrike</span>
                    <span className="text-blue-400">{datasetStats.stats?.crowdstrike || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">SentinelOne</span>
                    <span className="text-green-400">{datasetStats.stats?.sentinelone || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 p-6 bg-gradient-to-br from-[hsl(215,28%,5%)] to-[hsl(215,28%,7%)]">
          {activeTab === "overview" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold glow-text">Alert Overview</h1>

              {/* Alert Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-300">Total Alerts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[hsl(330,100%,50%)]">{alerts?.length || 0}</div>
                    <p className="text-xs text-gray-400">All time</p>
                  </CardContent>
                </Card>

                <Card className="bg-[hsl(0,0%,8%)]/80 border-red-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-300">Critical</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-400">
                      {alerts?.filter((a: any) => a.severity === 'critical').length || 0}
                    </div>
                    <p className="text-xs text-gray-400">High priority</p>
                  </CardContent>
                </Card>

                <Card className="bg-[hsl(0,0%,8%)]/80 border-orange-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-300">High</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-400">
                      {alerts?.filter((a: any) => a.severity === 'high').length || 0}
                    </div>
                    <p className="text-xs text-gray-400">Needs attention</p>
                  </CardContent>
                </Card>

                <Card className="bg-[hsl(0,0%,8%)]/80 border-blue-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-300">Sources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-400">{sources?.length || 0}</div>
                    <p className="text-xs text-gray-400">Active sources</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Alerts */}
              <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
                <CardHeader>
                  <CardTitle className="text-white">Recent Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {alerts?.slice(0, 10).map((alert: any, index: number) => (
                      <div key={alert.id} className="flex items-center justify-between p-3 bg-[hsl(0,0%,6%)]/60 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <AlertTriangle className={`w-4 h-4 ${getSeverityColor(alert.severity || 'medium')}`} />
                          <div>
                            <div className="text-white text-sm">{alert.title || `Alert ${alert.id?.slice(-6)}`}</div>
                            <div className="text-xs text-gray-400">Source: {alert.sourceId}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={`${getSeverityColor(alert.severity || 'medium')} bg-transparent border`}>
                            {alert.severity || 'Medium'}
                          </Badge>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(alert.receivedAt || Date.now()).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "simulation" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold glow-text">Alert Simulation</h1>

              {/* Simulation Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
                  <CardHeader>
                    <CardTitle className="text-white">Batch Alert Simulation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Source Type</label>
                      <Select value={simulationType} onValueChange={setSimulationType}>
                        <SelectTrigger className="bg-[hsl(0,0%,10%)]/60 border-[hsl(330,100%,50%)]/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="crowdstrike">CrowdStrike EDR</SelectItem>
                          <SelectItem value="sentinelone">SentinelOne</SelectItem>
                          <SelectItem value="email">Email Security</SelectItem>
                          <SelectItem value="firewall">Firewall</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Alert Count</label>
                      <Input
                        type="number"
                        value={simulationCount}
                        onChange={(e) => setSimulationCount(parseInt(e.target.value) || 10)}
                        min={1}
                        max={100}
                        className="bg-[hsl(0,0%,10%)]/60 border-[hsl(330,100%,50%)]/20 text-white"
                      />
                    </div>

                    <Button 
                      onClick={handleSimulateAlerts}
                      disabled={simulateAlertsMutation.isPending}
                      className="w-full bg-[hsl(330,100%,50%)] hover:bg-[hsl(330,100%,60%)]"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {simulateAlertsMutation.isPending ? 'Generating...' : 'Generate Alerts'}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-[hsl(0,0%,8%)]/80 border-orange-500/20">
                  <CardHeader>
                    <CardTitle className="text-white">Real-time Simulation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Source Type</label>
                      <Select value={simulationType} onValueChange={setSimulationType}>
                        <SelectTrigger className="bg-[hsl(0,0%,10%)]/60 border-orange-500/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="crowdstrike">CrowdStrike EDR</SelectItem>
                          <SelectItem value="sentinelone">SentinelOne</SelectItem>
                          <SelectItem value="email">Email Security</SelectItem>
                          <SelectItem value="firewall">Firewall</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Duration (minutes)</label>
                      <Input
                        type="number"
                        value={realtimeDuration}
                        onChange={(e) => setRealtimeDuration(parseInt(e.target.value) || 5)}
                        min={1}
                        max={60}
                        className="bg-[hsl(0,0%,10%)]/60 border-orange-500/20 text-white"
                      />
                    </div>

                    <Button 
                      onClick={handleRealtimeSimulation}
                      disabled={simulateRealtimeMutation.isPending || isSimulationRunning}
                      className="w-full bg-orange-500 hover:bg-orange-600"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      {isSimulationRunning ? 'Simulation Active' : simulateRealtimeMutation.isPending ? 'Starting...' : 'Start Real-time'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === "normalization" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold glow-text">Alert Normalization</h1>

              <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
                <CardHeader>
                  <CardTitle className="text-white">Test Normalization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Raw Alert Data (JSON)</label>
                    <Textarea
                      value={testAlertData}
                      onChange={(e) => setTestAlertData(e.target.value)}
                      placeholder='{"timestamp": "2024-01-01T12:00:00Z", "severity": "high", "message": "Suspicious activity detected"}'
                      rows={10}
                      className="bg-[hsl(0,0%,10%)]/60 border-[hsl(330,100%,50%)]/20 text-white font-mono"
                    />
                  </div>

                  <div className="flex space-x-3">
                    <Button className="bg-[hsl(330,100%,50%)] hover:bg-[hsl(330,100%,60%)]">
                      <TestTube2 className="w-4 h-4 mr-2" />
                      Test Normalization
                    </Button>
                    <Button variant="outline" className="border-[hsl(330,100%,50%)]/20 text-[hsl(330,100%,50%)]">
                      <Eye className="w-4 h-4 mr-2" />
                      Get Sample Alert
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "dataset" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold glow-text">Dataset Statistics</h1>

              {datasetStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
                    <CardHeader>
                      <CardTitle className="text-white">Total Alerts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-[hsl(330,100%,50%)] mb-2">
                        {datasetStats.stats?.total || 0}
                      </div>
                      <p className="text-sm text-gray-400">Across all sources</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-[hsl(0,0%,8%)]/80 border-blue-500/20">
                    <CardHeader>
                      <CardTitle className="text-white">CrowdStrike</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-400 mb-2">
                        {datasetStats.stats?.crowdstrike || 0}
                      </div>
                      <p className="text-sm text-gray-400">EDR alerts</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-[hsl(0,0%,8%)]/80 border-green-500/20">
                    <CardHeader>
                      <CardTitle className="text-white">SentinelOne</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-400 mb-2">
                        {datasetStats.stats?.sentinelone || 0}
                      </div>
                      <p className="text-sm text-gray-400">Endpoint alerts</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-[hsl(0,0%,8%)]/80 border-yellow-500/20">
                    <CardHeader>
                      <CardTitle className="text-white">Email Security</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-yellow-400 mb-2">
                        {datasetStats.stats?.email || 0}
                      </div>
                      <p className="text-sm text-gray-400">Email threats</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-[hsl(0,0%,8%)]/80 border-purple-500/20">
                    <CardHeader>
                      <CardTitle className="text-white">Firewall</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-purple-400 mb-2">
                        {datasetStats.stats?.firewall || 0}
                      </div>
                      <p className="text-sm text-gray-400">Network alerts</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
                    <CardHeader>
                      <CardTitle className="text-white">Active Sources</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-[hsl(330,100%,50%)] mb-2">
                        {datasetStats.sources?.length || 0}
                      </div>
                      <p className="text-sm text-gray-400">Configured sources</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}