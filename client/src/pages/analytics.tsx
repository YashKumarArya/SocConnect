import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Clock, Target, Zap } from "lucide-react";
import { api } from "@/lib/api";
import { MetricsChart } from "@/components/metrics-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportDialog } from "@/components/export-dialog";

export default function Analytics() {
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/metrics'],
    queryFn: api.getMetrics,
  });

  const { data: realTimeAnalytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/analytics/realtime'],
    queryFn: () => fetch('/api/analytics/realtime').then(res => res.json()),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: incidents } = useQuery({
    queryKey: ['/api/incidents'],
    queryFn: api.getIncidents,
  });

  // Calculate performance metrics from real-time data
  const performanceData = [
    {
      name: "Precision",
      value: realTimeAnalytics?.precision ? (realTimeAnalytics.precision * 100).toFixed(1) : "0.0",
      percentage: realTimeAnalytics?.precision ? realTimeAnalytics.precision * 100 : 0,
      color: "emerald",
      icon: Target,
    },
    {
      name: "Recall",
      value: realTimeAnalytics?.recall ? (realTimeAnalytics.recall * 100).toFixed(1) : "0.0",
      percentage: realTimeAnalytics?.recall ? realTimeAnalytics.recall * 100 : 0,
      color: "sky",
      icon: TrendingUp,
    },
    {
      name: "F1 Score",
      value: realTimeAnalytics?.f1Score ? (realTimeAnalytics.f1Score * 100).toFixed(1) : "0.0",
      percentage: realTimeAnalytics?.f1Score ? realTimeAnalytics.f1Score * 100 : 0,
      color: "amber",
      icon: Zap,
    },
  ];

  // Use real-time calculated response time
  const avgResponseTime = realTimeAnalytics?.avgResponseTimeMinutes || 0;

  if (metricsLoading || analyticsLoading) {
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-white" data-testid="analytics-title">Performance Analytics</h2>
        <ExportDialog 
          type="analytics" 
          triggerText="Export Analytics Report"
          className="soc-button-primary"
        />
      </div>

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
                {realTimeAnalytics?.automationRate ? (realTimeAnalytics.automationRate * 100).toFixed(1) : '0.0'}%
              </div>
              <p className="text-slate-400 text-sm">Auto-resolved incidents</p>
              <Progress value={realTimeAnalytics?.automationRate ? realTimeAnalytics.automationRate * 100 : 0} className="mt-4 bg-slate-700" />
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
                {realTimeAnalytics?.incidentsCreatedToday || 0}
              </div>
              <p className="text-slate-400 text-sm">Incidents created today</p>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-emerald-400">{realTimeAnalytics?.threatDetectionRate ? (realTimeAnalytics.threatDetectionRate * 100).toFixed(0) : '0'}%</span>
                <span className="text-slate-400 ml-2">detection rate</span>
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
                {realTimeAnalytics?.falsePositiveRate ? (realTimeAnalytics.falsePositiveRate * 100).toFixed(1) : '0.0'}%
              </div>
              <p className="text-slate-400 text-sm">False positive rate</p>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-emerald-400">Avg: {realTimeAnalytics?.avgFeedbackRating ? realTimeAnalytics.avgFeedbackRating.toFixed(1) : '0.0'}/5</span>
                <span className="text-slate-400 ml-2">analyst rating</span>
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
                {realTimeAnalytics?.alertsProcessedToday?.toLocaleString() || '0'}
              </div>
              <p className="text-slate-400 text-sm">Alerts Processed Today</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-2" data-testid="auto-actions">
                {Math.round((realTimeAnalytics?.automationRate || 0) * (realTimeAnalytics?.alertsProcessedToday || 0))}
              </div>
              <p className="text-slate-400 text-sm">Auto Actions</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-2" data-testid="manual-reviews">
                {realTimeAnalytics?.manualReviewsToday || 0}
              </div>
              <p className="text-slate-400 text-sm">Manual Reviews Today</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-2" data-testid="avg-processing-time">
                {realTimeAnalytics?.avgResponseTimeMinutes ? `${realTimeAnalytics.avgResponseTimeMinutes.toFixed(1)}m` : '0.0m'}
              </div>
              <p className="text-slate-400 text-sm">Avg Response Time</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
