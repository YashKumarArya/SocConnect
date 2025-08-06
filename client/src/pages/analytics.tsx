import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Clock, Target, Zap } from "lucide-react";
import { api } from "@/lib/api";
import { MetricsChart } from "@/components/metrics-chart";
import { Skeleton } from "@/components/ui/skeleton";

export default function Analytics() {
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/metrics'],
    queryFn: api.getMetrics,
  });

  const { data: incidents } = useQuery({
    queryKey: ['/api/incidents'],
    queryFn: api.getIncidents,
  });

  // Calculate performance metrics
  const latestMetric = metrics?.[0];
  const performanceData = [
    {
      name: "Precision",
      value: latestMetric?.precision ? (latestMetric.precision * 100).toFixed(1) : "94.7",
      percentage: latestMetric?.precision ? latestMetric.precision * 100 : 94.7,
      color: "emerald",
      icon: Target,
    },
    {
      name: "Recall",
      value: latestMetric?.recall ? (latestMetric.recall * 100).toFixed(1) : "91.3",
      percentage: latestMetric?.recall ? latestMetric.recall * 100 : 91.3,
      color: "sky",
      icon: TrendingUp,
    },
    {
      name: "Latency",
      value: latestMetric?.latencyMs ? `${latestMetric.latencyMs}ms` : "23ms",
      percentage: latestMetric?.latencyMs ? Math.max(0, 100 - latestMetric.latencyMs) : 77,
      color: "amber",
      icon: Zap,
    },
  ];

  // Calculate response time metrics
  const avgResponseTime = incidents?.length > 0 
    ? incidents.reduce((sum: number, inc: any) => {
        const responseTime = inc.closedAt 
          ? new Date(inc.closedAt).getTime() - new Date(inc.createdAt).getTime()
          : Date.now() - new Date(inc.createdAt).getTime();
        return sum + responseTime;
      }, 0) / incidents.length / (1000 * 60) // Convert to minutes
    : 0;

  if (metricsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="soc-card">
              <CardContent className="p-6">
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white" data-testid="analytics-title">Performance Analytics</h2>

      {/* Model Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="soc-card" data-testid="model-performance">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-white">Model Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {performanceData.map((metric, index) => (
              <div key={metric.name} className="flex items-center justify-between" data-testid={`metric-${metric.name.toLowerCase()}`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 bg-${metric.color}-500/10 rounded-lg flex items-center justify-center`}>
                    <metric.icon className={`w-4 h-4 text-${metric.color}-500`} />
                  </div>
                  <span className="text-slate-400">{metric.name}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Progress 
                    value={metric.percentage} 
                    className="w-32 bg-slate-700"
                    data-testid={`progress-${metric.name.toLowerCase()}`}
                  />
                  <span className="text-white font-medium w-12 text-right" data-testid={`value-${metric.name.toLowerCase()}`}>
                    {metric.value}{metric.name === 'Precision' || metric.name === 'Recall' ? '%' : ''}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="soc-card" data-testid="response-times-chart">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-white">Response Times</CardTitle>
          </CardHeader>
          <CardContent>
            <MetricsChart 
              data={[
                { name: 'Avg Response', value: avgResponseTime.toFixed(1) },
                { name: 'Target', value: '5.0' },
              ]}
              height={200}
            />
          </CardContent>
        </Card>
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="soc-card" data-testid="automation-rate">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Automation Rate</h3>
              <Badge className="soc-status-high">High</Badge>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2" data-testid="automation-rate-value">
                87.3%
              </div>
              <p className="text-slate-400 text-sm">Auto-resolved incidents</p>
              <Progress value={87.3} className="mt-4 bg-slate-700" />
            </div>
          </CardContent>
        </Card>

        <Card className="soc-card" data-testid="threat-detection">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Threat Detection</h3>
              <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-red-500" />
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2" data-testid="threat-detection-value">
                156
              </div>
              <p className="text-slate-400 text-sm">Threats detected today</p>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-red-400">+12%</span>
                <span className="text-slate-400 ml-2">from yesterday</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="soc-card" data-testid="false-positive-rate">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">False Positive Rate</h3>
              <Badge className="soc-status-low">Low</Badge>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2" data-testid="false-positive-rate-value">
                2.4%
              </div>
              <p className="text-slate-400 text-sm">Below industry average</p>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-400">-0.8%</span>
                <span className="text-slate-400 ml-2">improvement</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Processing Statistics */}
      <Card className="soc-card" data-testid="processing-stats">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-white">Processing Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-2" data-testid="alerts-processed">
                {latestMetric?.alertsProcessed?.toLocaleString() || '1,247'}
              </div>
              <p className="text-slate-400 text-sm">Alerts Processed</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-2" data-testid="auto-actions">
                {latestMetric?.autoActions || 89}
              </div>
              <p className="text-slate-400 text-sm">Auto Actions</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-2" data-testid="manual-reviews">
                {latestMetric?.manualReviews || 23}
              </div>
              <p className="text-slate-400 text-sm">Manual Reviews</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-2" data-testid="avg-processing-time">
                {latestMetric?.latencyMs ? `${latestMetric.latencyMs}ms` : '23ms'}
              </div>
              <p className="text-slate-400 text-sm">Avg Processing Time</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
