import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, Settings, Play, Database, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { AlertStream } from "@/components/alert-stream";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";

export default function Alerts() {
  const { toast } = useToast();
  const { lastMessage } = useWebSocket();
  const [liveAlerts, setLiveAlerts] = useState<any[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>('crowdstrike');

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['/api/alerts'],
    queryFn: api.getAlerts,
  });

  const { data: datasetStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/alerts/dataset-stats'],
    queryFn: api.getDatasetStats,
  });

  const createIncidentMutation = useMutation({
    mutationFn: (incidentData: any) => api.createIncident(incidentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
      toast({
        title: "Success",
        description: "Incident created from alert",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create incident",
        variant: "destructive",
      });
    },
  });

  const simulateAlertsMutation = useMutation({
    mutationFn: ({ sourceType, count }: { sourceType: string; count: number }) => 
      api.simulateAlerts(sourceType, count),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      toast({
        title: "Success",
        description: `Generated ${data.results?.length || data.length || 10} alerts from ${selectedSource}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to simulate alerts",
        variant: "destructive",
      });
    },
  });

  const realTimeSimulationMutation = useMutation({
    mutationFn: ({ sourceType, duration }: { sourceType: string; duration: number }) => 
      api.simulateRealTimeAlerts(sourceType, duration),
    onSuccess: () => {
      toast({
        title: "Real-time simulation started",
        description: `Simulating ${selectedSource} alerts for ${5} minutes`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start real-time simulation",
        variant: "destructive",
      });
    },
  });

  // Handle real-time WebSocket updates
  useEffect(() => {
    if (lastMessage?.type === 'alert_created') {
      const newAlert = {
        ...lastMessage.data,
        timestamp: new Date(),
        severity: Math.random() > 0.7 ? 'critical' : Math.random() > 0.4 ? 'high' : 'medium',
        title: generateAlertTitle(lastMessage.data),
      };
      setLiveAlerts(prev => [newAlert, ...prev.slice(0, 9)]);
    }
  }, [lastMessage]);

  const generateAlertTitle = (alertData: any) => {
    const titles = [
      'Failed login attempt detected',
      'Network anomaly detected',
      'Malware signature found',
      'Suspicious file activity',
      'Unauthorized access attempt',
      'Data exfiltration suspected',
      'Brute force attack detected',
    ];
    return titles[Math.floor(Math.random() * titles.length)];
  };

  const handleCreateIncident = (alertData: any) => {
    // Create a dummy feature vector ID for the incident
    const dummyFeatureVectorId = "dummy-fv-" + Date.now();
    
    createIncidentMutation.mutate({
      featureVectorId: dummyFeatureVectorId,
      decision: 'MANUAL',
      confidence: Math.random() * 0.4 + 0.6, // Random confidence between 0.6-1.0
      status: 'open',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card className="soc-card">
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Source type options with logos/descriptions
  const sourceTypes = [
    { id: 'crowdstrike', name: 'CrowdStrike', description: 'EDR & Threat Intelligence', color: 'red' },
    { id: 'sentinelone', name: 'SentinelOne', description: 'Autonomous Security Platform', color: 'purple' },
    { id: 'email', name: 'Email Security', description: 'Email Threat Protection', color: 'blue' },
    { id: 'firewall', name: 'Firewall', description: 'Network Security', color: 'orange' },
  ];

  const handleSimulateAlerts = () => {
    simulateAlertsMutation.mutate({ sourceType: selectedSource, count: 10 });
  };

  const handleStartRealTimeSimulation = () => {
    realTimeSimulationMutation.mutate({ sourceType: selectedSource, duration: 5 });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white" data-testid="alerts-title">Alert Monitoring</h2>
          {!statsLoading && datasetStats && (
            <p className="text-slate-400 text-sm mt-1">
              {datasetStats.stats.total.toLocaleString()} alerts loaded from {datasetStats.sources.length} security tools
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button 
            variant="outline" 
            className="soc-button-secondary" 
            data-testid="configure-alerts"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
          <Button 
            className="soc-button-primary" 
            onClick={handleSimulateAlerts}
            disabled={simulateAlertsMutation.isPending}
            data-testid="simulate-alerts"
          >
            <Play className="w-4 h-4 mr-2" />
            {simulateAlertsMutation.isPending ? 'Generating...' : 'Simulate Alerts'}
          </Button>
        </div>
      </div>

      {/* Dataset Statistics */}
      <Card className="soc-card" data-testid="dataset-stats">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium text-white">Security Data Sources</CardTitle>
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-sky-400" />
            <span className="text-sm text-sky-400">Real Data Loaded</span>
          </div>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-4 bg-slate-750 rounded-lg border border-slate-600">
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {sourceTypes.map((source) => {
                const count = datasetStats?.stats[source.id] || 0;
                const isSelected = selectedSource === source.id;
                return (
                  <div 
                    key={source.id}
                    className={`p-4 bg-slate-750 rounded-lg border transition-all cursor-pointer ${
                      isSelected ? 'border-sky-500 bg-sky-500/5' : 'border-slate-600 hover:border-slate-500'
                    }`}
                    onClick={() => setSelectedSource(source.id)}
                    data-testid={`source-${source.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-3 h-3 bg-${source.color}-500 rounded-full`}></div>
                      <Badge className={`text-xs ${
                        isSelected ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-600 text-slate-300'
                      }`}>
                        {isSelected ? 'Selected' : 'Available'}
                      </Badge>
                    </div>
                    <h3 className="text-white font-medium text-sm mb-1">{source.name}</h3>
                    <p className="text-slate-400 text-xs mb-2">{source.description}</p>
                    <div className="text-2xl font-bold text-white">
                      {count.toLocaleString()}
                    </div>
                    <p className="text-xs text-slate-400">alerts loaded</p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Simulation Controls */}
      <Card className="soc-card" data-testid="simulation-controls">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-white">Alert Simulation & Testing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div>
              <p className="text-white font-medium">
                Generate alerts from <span className="text-sky-400">{sourceTypes.find(s => s.id === selectedSource)?.name}</span>
              </p>
              <p className="text-slate-400 text-sm mt-1">
                Test your SOC with real security alerts from production datasets
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                onClick={handleStartRealTimeSimulation}
                disabled={realTimeSimulationMutation.isPending}
                data-testid="start-realtime"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                {realTimeSimulationMutation.isPending ? 'Starting...' : 'Real-time (5min)'}
              </Button>
              <Button 
                onClick={handleSimulateAlerts}
                disabled={simulateAlertsMutation.isPending}
                data-testid="generate-alerts"
              >
                <Play className="w-4 h-4 mr-2" />
                {simulateAlertsMutation.isPending ? 'Generating...' : 'Generate 10 Alerts'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Alert Stream */}
      <Card className="soc-card" data-testid="live-alert-stream">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium text-white">Live Alert Stream</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-slate-300">Real-time</span>
          </div>
        </CardHeader>
        <CardContent>
          {liveAlerts.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Shield className="w-12 h-12 mx-auto mb-4 text-slate-600" />
              <p>No recent alerts</p>
              <p className="text-sm mt-2">Live alerts will appear here when received</p>
            </div>
          ) : (
            <AlertStream 
              alerts={liveAlerts} 
              onCreateIncident={handleCreateIncident}
              isCreatingIncident={createIncidentMutation.isPending}
            />
          )}
        </CardContent>
      </Card>

      {/* Alert Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="soc-card" data-testid="alerts-today-stat">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Alerts in System</p>
                <p className="text-3xl font-bold text-white mt-2" data-testid="alerts-today-count">
                  {datasetStats?.stats.total.toLocaleString() || alerts?.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-sky-400">Real data</span>
              <span className="text-slate-400 ml-2">from 4 sources</span>
            </div>
          </CardContent>
        </Card>

        <Card className="soc-card" data-testid="critical-alerts-stat">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Live Alerts</p>
                <p className="text-3xl font-bold text-white mt-2" data-testid="critical-alerts-count">
                  {liveAlerts.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-red-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-400">+{liveAlerts.filter(alert => alert.severity === 'critical').length}</span>
              <span className="text-slate-400 ml-2">critical alerts</span>
            </div>
          </CardContent>
        </Card>

        <Card className="soc-card" data-testid="response-rate-stat">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Selected Source</p>
                <p className="text-lg font-bold text-white mt-2" data-testid="response-rate-value">
                  {sourceTypes.find(s => s.id === selectedSource)?.name}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <Database className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-emerald-400">{datasetStats?.stats[selectedSource]?.toLocaleString() || '0'}</span>
              <span className="text-slate-400 ml-2">alerts available</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
