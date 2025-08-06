import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Shield, Settings, Plus } from "lucide-react";
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

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['/api/alerts'],
    queryFn: api.getAlerts,
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-white" data-testid="alerts-title">Alert Monitoring</h2>
        <Button className="mt-4 sm:mt-0 soc-button-primary" data-testid="configure-alerts">
          <Settings className="w-4 h-4 mr-2" />
          Configure Alerts
        </Button>
      </div>

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
                <p className="text-slate-400 text-sm font-medium">Alerts Today</p>
                <p className="text-3xl font-bold text-white mt-2" data-testid="alerts-today-count">
                  {alerts?.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-400">-12%</span>
              <span className="text-slate-400 ml-2">from yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card className="soc-card" data-testid="critical-alerts-stat">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Critical Alerts</p>
                <p className="text-3xl font-bold text-white mt-2" data-testid="critical-alerts-count">
                  {liveAlerts.filter(alert => alert.severity === 'critical').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-red-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-red-400">+2</span>
              <span className="text-slate-400 ml-2">in last hour</span>
            </div>
          </CardContent>
        </Card>

        <Card className="soc-card" data-testid="response-rate-stat">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Response Rate</p>
                <p className="text-3xl font-bold text-white mt-2" data-testid="response-rate-value">
                  96.5%
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-emerald-400">+1.2%</span>
              <span className="text-slate-400 ml-2">this week</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
