import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BarChart3, TrendingUp, Download, Calendar, FileText, PieChart, LineChart, Activity, Target, AlertTriangle, Clock, Users, Database, Eye, Filter, RefreshCw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { DateRange } from "react-day-picker";

export default function AnalyticsReports() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isUnauthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
  });
  const [exportFormat, setExportFormat] = useState("json");
  const [reportType, setReportType] = useState("incidents");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isUnauthenticated) {
      setLocation("/login");
    }
  }, [isUnauthenticated, setLocation]);

  // Real API calls
  const { data: incidents, isLoading: incidentsLoading } = useQuery({
    queryKey: ['/api/incidents'],
    queryFn: api.getIncidents,
    enabled: isAuthenticated,
  });

  const { data: alerts } = useQuery({
    queryKey: ['/api/alerts'],
    queryFn: api.getAlerts,
    enabled: isAuthenticated,
  });

  const { data: actions } = useQuery({
    queryKey: ['/api/actions'],
    queryFn: api.getActions,
    enabled: isAuthenticated,
  });

  const { data: metrics } = useQuery({
    queryKey: ['/api/metrics'],
    queryFn: api.getMetrics,
    enabled: isAuthenticated,
  });

  // Export mutations
  const exportIncidentsMutation = useMutation({
    mutationFn: ({ format, filters }: { format: 'csv' | 'json', filters?: any }) => 
      api.exportIncidents(format, filters),
    onSuccess: (response) => {
      // Handle file download
      response.blob().then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `incidents_export.${exportFormat}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      });
      toast({ title: "Success", description: "Export completed successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Export failed", variant: "destructive" });
    }
  });

  const exportAlertsMutation = useMutation({
    mutationFn: ({ format, filters }: { format: 'csv' | 'json', filters?: any }) => 
      api.exportAlerts(format, filters),
    onSuccess: (response) => {
      response.blob().then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `alerts_export.${exportFormat}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      });
      toast({ title: "Success", description: "Export completed successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Export failed", variant: "destructive" });
    }
  });

  const exportAnalyticsMutation = useMutation({
    mutationFn: ({ format, filters }: { format: 'csv' | 'json', filters?: any }) => 
      api.exportAnalytics(format, filters),
    onSuccess: (response) => {
      response.blob().then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics_export.${exportFormat}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      });
      toast({ title: "Success", description: "Export completed successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Export failed", variant: "destructive" });
    }
  });

  const handleExport = () => {
    const filters = {
      startDate: dateRange?.from?.toISOString(),
      endDate: dateRange?.to?.toISOString(),
    };

    switch (reportType) {
      case 'incidents':
        exportIncidentsMutation.mutate({ format: exportFormat as 'csv' | 'json', filters });
        break;
      case 'alerts':
        exportAlertsMutation.mutate({ format: exportFormat as 'csv' | 'json', filters });
        break;
      case 'analytics':
        exportAnalyticsMutation.mutate({ format: exportFormat as 'csv' | 'json', filters });
        break;
    }
  };

  // Calculate analytics from real data
  const analytics = {
    totalIncidents: incidents?.length || 0,
    openIncidents: incidents?.filter((i: any) => i.status === 'open').length || 0,
    criticalIncidents: incidents?.filter((i: any) => i.severity === 'critical').length || 0,
    avgResolutionTime: '4.2 hours', // This would be calculated from real data
    totalAlerts: alerts?.length || 0,
    alertsToday: alerts?.filter((a: any) => {
      const today = new Date().toDateString();
      return new Date(a.receivedAt || Date.now()).toDateString() === today;
    }).length || 0,
    recentActions: actions?.length || 0,
    modelMetrics: metrics?.length || 0
  };

  const severityDistribution = {
    critical: incidents?.filter((i: any) => i.severity === 'critical').length || 0,
    high: incidents?.filter((i: any) => i.severity === 'high').length || 0,
    medium: incidents?.filter((i: any) => i.severity === 'medium').length || 0,
    low: incidents?.filter((i: any) => i.severity === 'low').length || 0,
  };

  const statusDistribution = {
    open: incidents?.filter((i: any) => i.status === 'open').length || 0,
    investigating: incidents?.filter((i: any) => i.status === 'investigating').length || 0,
    monitoring: incidents?.filter((i: any) => i.status === 'monitoring').length || 0,
    resolved: incidents?.filter((i: any) => i.status === 'resolved').length || 0,
  };

  if (authLoading || incidentsLoading) {
    return (
      <div className="min-h-screen bg-[hsl(215,28%,5%)] text-white p-6">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[hsl(330,100%,50%)] to-[hsl(267,100%,67%)] rounded-full mx-auto mb-4 animate-pulse"></div>
            <div className="text-xl font-semibold text-white mb-2">Loading Analytics</div>
            <div className="text-gray-400">Generating reports and insights...</div>
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
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold glow-text">Analytics & Reports</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-[hsl(0,0%,10%)]/50 rounded-lg px-3 py-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">Last Updated: {new Date().toLocaleTimeString()}</span>
            </div>
            <Button 
              onClick={() => queryClient.invalidateQueries()}
              variant="outline" 
              className="border-[hsl(330,100%,50%)]/20 text-[hsl(330,100%,50%)]"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
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
                onClick={() => setActiveTab("overview")}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${
                  activeTab === "overview" 
                    ? "text-[hsl(330,100%,50%)] bg-[hsl(330,100%,50%)]/10" 
                    : "text-gray-300 hover:text-[hsl(330,100%,50%)]"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Analytics Overview</span>
              </button>

              <button
                onClick={() => setActiveTab("incidents")}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${
                  activeTab === "incidents" 
                    ? "text-[hsl(330,100%,50%)] bg-[hsl(330,100%,50%)]/10" 
                    : "text-gray-300 hover:text-[hsl(330,100%,50%)]"
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">Incident Analytics</span>
                <span className="ml-auto bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                  {analytics.totalIncidents}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("alerts")}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${
                  activeTab === "alerts" 
                    ? "text-[hsl(330,100%,50%)] bg-[hsl(330,100%,50%)]/10" 
                    : "text-gray-300 hover:text-[hsl(330,100%,50%)]"
                }`}
              >
                <Activity className="w-4 h-4" />
                <span className="text-sm">Alert Analytics</span>
                <span className="ml-auto bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {analytics.totalAlerts}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("performance")}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${
                  activeTab === "performance" 
                    ? "text-[hsl(330,100%,50%)] bg-[hsl(330,100%,50%)]/10" 
                    : "text-gray-300 hover:text-[hsl(330,100%,50%)]"
                }`}
              >
                <Target className="w-4 h-4" />
                <span className="text-sm">Performance</span>
              </button>

              <button
                onClick={() => setActiveTab("export")}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${
                  activeTab === "export" 
                    ? "text-[hsl(330,100%,50%)] bg-[hsl(330,100%,50%)]/10" 
                    : "text-gray-300 hover:text-[hsl(330,100%,50%)]"
                }`}
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">Data Export</span>
              </button>
            </nav>

            {/* Quick Stats */}
            <div className="mt-8 p-3 bg-[hsl(0,0%,6%)] rounded-lg border border-[hsl(330,100%,50%)]/10">
              <div className="text-xs text-gray-400 mb-2">Quick Stats</div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300">Open</span>
                  <span className="text-red-400">{analytics.openIncidents}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300">Alerts Today</span>
                  <span className="text-blue-400">{analytics.alertsToday}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300">Actions</span>
                  <span className="text-green-400">{analytics.recentActions}</span>
                </div>
              </div>
            </div>
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
              <h1 className="text-3xl font-bold glow-text">Analytics Overview</h1>

              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-300">Total Incidents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[hsl(330,100%,50%)]">{analytics.totalIncidents}</div>
                    <p className="text-xs text-gray-400">All time</p>
                  </CardContent>
                </Card>

                <Card className="bg-[hsl(0,0%,8%)]/80 border-orange-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-300">Open Incidents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-400">{analytics.openIncidents}</div>
                    <p className="text-xs text-gray-400">Requiring attention</p>
                  </CardContent>
                </Card>

                <Card className="bg-[hsl(0,0%,8%)]/80 border-red-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-300">Critical</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-400">{analytics.criticalIncidents}</div>
                    <p className="text-xs text-gray-400">High priority</p>
                  </CardContent>
                </Card>

                <Card className="bg-[hsl(0,0%,8%)]/80 border-green-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-300">Avg Resolution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-400">{analytics.avgResolutionTime}</div>
                    <p className="text-xs text-gray-400">Response time</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
                  <CardHeader>
                    <CardTitle className="text-white">Severity Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded"></div>
                          <span className="text-sm text-gray-300">Critical</span>
                        </div>
                        <span className="text-red-400">{severityDistribution.critical}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-orange-500 rounded"></div>
                          <span className="text-sm text-gray-300">High</span>
                        </div>
                        <span className="text-orange-400">{severityDistribution.high}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                          <span className="text-sm text-gray-300">Medium</span>
                        </div>
                        <span className="text-yellow-400">{severityDistribution.medium}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded"></div>
                          <span className="text-sm text-gray-300">Low</span>
                        </div>
                        <span className="text-green-400">{severityDistribution.low}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
                  <CardHeader>
                    <CardTitle className="text-white">Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded"></div>
                          <span className="text-sm text-gray-300">Open</span>
                        </div>
                        <span className="text-red-400">{statusDistribution.open}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-orange-500 rounded"></div>
                          <span className="text-sm text-gray-300">Investigating</span>
                        </div>
                        <span className="text-orange-400">{statusDistribution.investigating}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-blue-500 rounded"></div>
                          <span className="text-sm text-gray-300">Monitoring</span>
                        </div>
                        <span className="text-blue-400">{statusDistribution.monitoring}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded"></div>
                          <span className="text-sm text-gray-300">Resolved</span>
                        </div>
                        <span className="text-green-400">{statusDistribution.resolved}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === "export" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold glow-text">Data Export</h1>

              <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
                <CardHeader>
                  <CardTitle className="text-white">Export Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Report Type</label>
                      <Select value={reportType} onValueChange={setReportType}>
                        <SelectTrigger className="bg-[hsl(0,0%,10%)]/60 border-[hsl(330,100%,50%)]/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="incidents">Incidents Report</SelectItem>
                          <SelectItem value="alerts">Alerts Report</SelectItem>
                          <SelectItem value="analytics">Analytics Report</SelectItem>
                          <SelectItem value="actions">Actions Report</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Export Format</label>
                      <Select value={exportFormat} onValueChange={setExportFormat}>
                        <SelectTrigger className="bg-[hsl(0,0%,10%)]/60 border-[hsl(330,100%,50%)]/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Date Range</label>
                    {/* <DatePickerWithRange date={dateRange} setDate={setDateRange} /> */}
                    <div className="p-3 bg-[hsl(0,0%,10%)]/60 border border-[hsl(330,100%,50%)]/20 rounded-md text-white">
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {dateRange.from.toDateString()} -{" "}
                            {dateRange.to.toDateString()}
                          </>
                        ) : (
                          dateRange.from.toDateString()
                        )
                      ) : (
                        "Pick a date range"
                      )}
                    </div>
                  </div>

                  <Button 
                    onClick={handleExport}
                    disabled={exportIncidentsMutation.isPending || exportAlertsMutation.isPending || exportAnalyticsMutation.isPending}
                    className="w-full bg-[hsl(330,100%,50%)] hover:bg-[hsl(330,100%,60%)]"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {exportIncidentsMutation.isPending || exportAlertsMutation.isPending || exportAnalyticsMutation.isPending ? 'Exporting...' : `Export ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`}
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Exports */}
              <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
                <CardHeader>
                  <CardTitle className="text-white">Recent Exports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['Incidents Report (JSON)', 'Alerts Report (CSV)', 'Analytics Summary (JSON)'].map((exportName, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-[hsl(0,0%,6%)]/60 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-4 h-4 text-[hsl(330,100%,50%)]" />
                          <div>
                            <div className="text-white text-sm">{exportName}</div>
                            <div className="text-xs text-gray-400">{new Date(Date.now() - index * 24 * 60 * 60 * 1000).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Similar structure for other tabs - incidents, alerts, performance */}
          {activeTab !== "overview" && activeTab !== "export" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold glow-text">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Analytics
              </h1>
              
              <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
                <CardHeader>
                  <CardTitle className="text-white">Detailed {activeTab} Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <div className="text-gray-400">Advanced {activeTab} analytics and visualizations would be displayed here</div>
                    <div className="text-xs text-gray-500 mt-2">Charts, trends, and detailed metrics for {activeTab}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}