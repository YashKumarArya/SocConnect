import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Shield, Clock, CheckCircle, TrendingUp, TrendingDown } from "lucide-react";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: api.getDashboardStats,
  });

  const { data: incidents, isLoading: incidentsLoading } = useQuery({
    queryKey: ['/api/incidents'],
    queryFn: api.getIncidents,
  });

  const recentIncidents = incidents?.slice(0, 3) || [];

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="soc-card">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-4" />
                <Skeleton className="h-8 w-12 mb-4" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const metrics = [
    {
      title: "Active Incidents",
      value: stats?.activeIncidents || 0,
      icon: AlertTriangle,
      iconColor: "text-red-500",
      bgColor: "bg-red-500/10",
      change: "+2",
      changeType: "increase",
      subtitle: "from last hour",
      testId: "metric-active-incidents"
    },
    {
      title: "Alerts Today",
      value: stats?.alertsToday || 0,
      icon: Shield,
      iconColor: "text-amber-500",
      bgColor: "bg-amber-500/10",
      change: "-5",
      changeType: "decrease",
      subtitle: "from yesterday",
      testId: "metric-alerts-today"
    },
    {
      title: "Response Time",
      value: stats?.avgResponseTime || "0m",
      icon: Clock,
      iconColor: "text-sky-500",
      bgColor: "bg-sky-500/10",
      change: "-1.2m",
      changeType: "decrease",
      subtitle: "improvement",
      testId: "metric-response-time"
    },
    {
      title: "Model Accuracy",
      value: `${stats?.modelAccuracy?.toFixed(1) || 0}%`,
      icon: CheckCircle,
      iconColor: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      change: "+0.3%",
      changeType: "increase",
      subtitle: "this week",
      testId: "metric-model-accuracy"
    },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index} className="soc-card" data-testid={metric.testId}>
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
                <span className={`${metric.changeType === 'increase' ? 'text-red-400' : 'text-green-400'}`}>
                  {metric.changeType === 'increase' ? <TrendingUp className="w-4 h-4 inline mr-1" /> : <TrendingDown className="w-4 h-4 inline mr-1" />}
                  {metric.change}
                </span>
                <span className="text-slate-400 ml-2">{metric.subtitle}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <Card className="soc-card" data-testid="incident-trends-chart">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-white">Incident Trends</CardTitle>
            <select className="bg-slate-700 border border-slate-600 rounded-md px-3 py-1 text-sm text-white">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-slate-750 rounded-lg flex items-center justify-center border border-slate-600">
              <div className="text-center text-slate-400">
                <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">Chart visualization will be implemented here</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Incidents */}
        <Card className="soc-card" data-testid="recent-incidents">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-white">Recent Incidents</CardTitle>
            <Button variant="ghost" className="text-sky-400 hover:text-sky-300 text-sm font-medium" data-testid="view-all-incidents">
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
                  const severityColor = incident.confidence > 0.8 ? 'red' : incident.confidence > 0.5 ? 'amber' : 'sky';
                  const severity = incident.confidence > 0.8 ? 'Critical' : incident.confidence > 0.5 ? 'High' : 'Medium';
                  
                  return (
                    <div key={incident.id} className="flex items-start space-x-3 p-3 bg-slate-750 rounded-lg border border-slate-600" data-testid={`incident-${index}`}>
                      <div className={`w-3 h-3 bg-${severityColor}-500 rounded-full mt-1.5 flex-shrink-0`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white" data-testid={`incident-${index}-title`}>
                          Security Incident #{incident.id.slice(-6)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1" data-testid={`incident-${index}-time`}>
                          {new Date(incident.createdAt).toLocaleString()}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge className={`soc-status-${severityColor === 'red' ? 'critical' : severityColor === 'amber' ? 'high' : 'medium'}`} data-testid={`incident-${index}-severity`}>
                            {severity}
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
      </div>
    </div>
  );
}
