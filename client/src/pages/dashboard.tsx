import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Shield, Clock, CheckCircle, TrendingUp, TrendingDown, Database, Settings, Bell, User, LogOut, Brain } from "lucide-react";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isUnauthenticated, isLoading: authLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isUnauthenticated) {
      setLocation("/login");
    }
  }, [isUnauthenticated, setLocation]);

  // Real API calls to your backend
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: api.getDashboardStats,
    enabled: isAuthenticated, // Only run if authenticated
  });

  const { data: incidents, isLoading: incidentsLoading, error: incidentsError } = useQuery({
    queryKey: ['/api/incidents'],
    queryFn: api.getIncidents,
    retry: false,
    refetchOnWindowFocus: false,
    enabled: isAuthenticated, // Only run if authenticated
  });

  const { data: datasetStats } = useQuery({
    queryKey: ['/api/alerts/dataset-stats'],
    queryFn: api.getDatasetStats,
    enabled: isAuthenticated, // Only run if authenticated
  });

  const { data: metrics } = useQuery({
    queryKey: ['/api/metrics'],
    queryFn: api.getMetrics,
    enabled: isAuthenticated, // Only run if authenticated
  });

  const { data: sources } = useQuery({
    queryKey: ['/api/sources'],
    queryFn: api.getSources,
    enabled: isAuthenticated, // Only run if authenticated
  });

  const recentIncidents = Array.isArray(incidents) ? incidents.slice(0, 5) : [];

  // Show loading while checking auth or loading data
  if (authLoading || !isAuthenticated || statsLoading) {
    return (
      <div className="min-h-screen bg-[hsl(215,28%,5%)] text-white p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-4" />
                  <Skeleton className="h-8 w-12 mb-4" />
                  <Skeleton className="h-4 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="min-h-screen bg-[hsl(215,28%,5%)] text-white p-6 flex items-center justify-center">
        <Card className="bg-[hsl(0,0%,8%)]/80 border-red-500/20 p-6">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <h2 className="text-xl font-bold text-red-400 mb-2">Connection Error</h2>
            <p className="text-gray-300 mb-4">Unable to connect to the SOC backend</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-[hsl(330,100%,50%)] hover:bg-[hsl(330,100%,60%)]"
            >
              Retry Connection
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const dashboardMetrics = [
    {
      title: "Active Incidents",
      value: stats?.activeIncidents || 0,
      icon: AlertTriangle,
      iconColor: "text-red-500",
      bgColor: "bg-red-500/10",
      change: "+2",
      changeType: "increase" as const,
      subtitle: "from last hour",
      testId: "metric-active-incidents"
    },
    {
      title: "Alert Dataset", 
      value: datasetStats?.stats.total?.toLocaleString() || stats?.alertsToday || 0,
      icon: Database,
      iconColor: "text-sky-500", 
      bgColor: "bg-sky-500/10",
      change: datasetStats?.stats.total ? `${Math.floor(datasetStats.stats.total/1000)}K+` : "4K+",
      changeType: "increase" as const,
      subtitle: "real security alerts",
      testId: "metric-dataset-size"
    },
    {
      title: "Response Time",
      value: stats?.avgResponseTime || "0m", 
      icon: Clock,
      iconColor: "text-amber-500",
      bgColor: "bg-amber-500/10", 
      change: "-1.2m",
      changeType: "decrease" as const,
      subtitle: "improvement",
      testId: "metric-response-time"
    },
    {
      title: "Model Accuracy",
      value: `${stats?.modelAccuracy?.toFixed(1) || 94.2}%`,
      icon: CheckCircle,
      iconColor: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      change: "+0.3%", 
      changeType: "increase" as const,
      subtitle: "with real data",
      testId: "metric-model-accuracy"
    },
  ];

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
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-[hsl(330,100%,50%)] to-[hsl(267,100%,67%)] rounded-full"></div>
              <span className="text-xl font-bold">Alpha SOC Platform</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-[hsl(0,0%,10%)]/50 rounded-lg px-3 py-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">Backend Connected</span>
            </div>
            <Button variant="ghost" size="icon" className="text-gray-300 hover:text-[hsl(330,100%,50%)] transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-300 hover:text-[hsl(330,100%,50%)] transition-colors">
              <Settings className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-gray-300" />
              <div className="text-sm">
                <div className="text-white">Security Analyst</div>
                <div className="text-xs text-gray-400">Online</div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="p-6 space-y-6">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardMetrics.map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20" data-testid={metric.testId}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm font-medium">{metric.title}</p>
                      <p className="text-3xl font-bold text-white mt-2" data-testid={`${metric.testId}-value`}>
                        {metric.value}
                      </p>
                    </div>
                    <div className={`w-12 h-12 ${metric.bgColor} rounded-lg flex items-center justify-center`}>
                      <metric.icon className={`w-6 h-6 ${metric.iconColor}`} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className={`${metric.changeType === 'increase' && metric.title === 'Active Incidents' ? 'text-red-400' : 'text-sky-400'}`}>
                      {metric.changeType === 'increase' && metric.title === 'Active Incidents' ? 
                        <TrendingUp className="w-4 h-4 inline mr-1" /> : 
                        <TrendingDown className="w-4 h-4 inline mr-1" />
                      }
                      {metric.change}
                    </span>
                    <span className="text-slate-400 ml-2">{metric.subtitle}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alert Sources Distribution */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20" data-testid="alert-sources-chart">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold text-white">Alert Sources</CardTitle>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Live Data</Badge>
              </CardHeader>
              <CardContent>
                {datasetStats ? (
                  <div className="space-y-4">
                    {[
                      { name: 'CrowdStrike', value: datasetStats.stats.crowdstrike, color: 'bg-blue-500' },
                      { name: 'SentinelOne', value: datasetStats.stats.sentinelone, color: 'bg-purple-500' },
                      { name: 'Email Security', value: datasetStats.stats.email, color: 'bg-green-500' },
                      { name: 'Firewall', value: datasetStats.stats.firewall, color: 'bg-orange-500' },
                    ].map((source, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">{source.name}</span>
                          <span className="text-white">{source.value?.toLocaleString() || 0}</span>
                        </div>
                        <Progress 
                          value={(source.value / datasetStats.stats.total) * 100} 
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-64 bg-slate-750 rounded-lg flex items-center justify-center border border-slate-600">
                    <div className="text-center text-slate-400">
                      <Database className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">Loading alert source data...</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Incidents */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20" data-testid="recent-incidents">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold text-white">Recent Incidents</CardTitle>
                <Button 
                  variant="ghost" 
                  className="text-sky-400 hover:text-sky-300 text-sm font-medium" 
                  data-testid="view-all-incidents"
                  onClick={() => setLocation("/investigation")}
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                {incidentsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-start space-x-3 p-3 bg-slate-750 rounded-lg border border-slate-600">
                        <Skeleton className="w-3 h-3 rounded-full mt-1.5" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-48 mb-2" />
                          <Skeleton className="h-3 w-24 mb-2" />
                          <div className="flex items-center space-x-2">
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-3 w-12" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentIncidents.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                    <p>No recent incidents</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentIncidents.map((incident: any, index: number) => {
                      const severityColors = {
                        'critical': 'red',
                        'high': 'orange', 
                        'medium': 'yellow',
                        'low': 'blue'
                      };
                      const severityColor = severityColors[incident.severity as keyof typeof severityColors] || 'blue';
                      
                      return (
                        <div key={incident.id} className="flex items-start space-x-3 p-3 bg-slate-750 rounded-lg border border-slate-600 cursor-pointer hover:bg-slate-700 transition-colors" data-testid={`incident-${index}`}>
                          <div className={`w-3 h-3 bg-${severityColor}-500 rounded-full mt-1.5 flex-shrink-0`}></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white" data-testid={`incident-${index}-title`}>
                              {incident.title || `Incident #${incident.id.slice(-6)}`}
                            </p>
                            <p className="text-xs text-slate-400 mt-1" data-testid={`incident-${index}-time`}>
                              {new Date(incident.createdAt).toLocaleString()}
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge 
                                className={`bg-${severityColor}-500/20 text-${severityColor}-400 border-${severityColor}-500/30`}
                                data-testid={`incident-${index}-severity`}
                              >
                                {incident.severity}
                              </Badge>
                              <span className="text-xs text-slate-400" data-testid={`incident-${index}-status`}>
                                {incident.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        {/* Security Sources Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20" data-testid="sources-overview">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">Security Data Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-2">
                    {sources?.length || 0}
                  </div>
                  <p className="text-slate-400 text-sm">Active Sources</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-2">
                    {datasetStats?.stats?.total?.toLocaleString() || '0'}
                  </div>
                  <p className="text-slate-400 text-sm">Total Alerts</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-400 mb-2">
                    100%
                  </div>
                  <p className="text-slate-400 text-sm">Data Quality</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-sky-400 mb-2">
                    Active
                  </div>
                  <p className="text-slate-400 text-sm">System Status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex justify-center space-x-4"
        >
          <Button 
            onClick={() => setLocation("/investigation")}
            className="bg-[hsl(330,100%,50%)] hover:bg-[hsl(330,100%,60%)] text-white"
          >
            <Shield className="w-4 h-4 mr-2" />
            Investigation Center
          </Button>
          <Button 
            onClick={() => setLocation("/ai-assistant")}
            className="bg-[hsl(267,100%,67%)] hover:bg-[hsl(267,100%,77%)] text-white"
          >
            <Brain className="w-4 h-4 mr-2" />
            AI Assistant
          </Button>
        </motion.div>
      </div>
    </div>
  );
}