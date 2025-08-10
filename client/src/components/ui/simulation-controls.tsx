import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Square, BarChart3, Zap } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface SimulationStatus {
  isRunning: boolean;
  alertsLoaded: {
    crowdstrike: number;
    email: number;
    firewall: number;
    sentinelone: number;
  };
  currentIndex: number;
}

export function SimulationControls() {
  const [intervalMs, setIntervalMs] = useState(3000);
  const queryClient = useQueryClient();

  const { data: status } = useQuery({
    queryKey: ['/api/simulation/status'],
    refetchInterval: 10000, // Reduced from 2s to 10s to prevent rate limiting
  });

  const startMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/simulation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intervalMs }),
      });
      if (!response.ok) throw new Error('Failed to start simulation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/simulation/status'] });
    },
  });

  const stopMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/simulation/stop', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to stop simulation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/simulation/status'] });
    },
  });

  const simulationStatus = status as SimulationStatus;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-500" />
          Alert Simulation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <Badge variant={simulationStatus?.isRunning ? "default" : "secondary"}>
            {simulationStatus?.isRunning ? "Running" : "Stopped"}
          </Badge>
        </div>

        {simulationStatus?.alertsLoaded && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Alert Sources:</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span>CrowdStrike:</span>
                <span>{simulationStatus.alertsLoaded.crowdstrike}</span>
              </div>
              <div className="flex justify-between">
                <span>Email:</span>
                <span>{simulationStatus.alertsLoaded.email}</span>
              </div>
              <div className="flex justify-between">
                <span>Firewall:</span>
                <span>{simulationStatus.alertsLoaded.firewall}</span>
              </div>
              <div className="flex justify-between">
                <span>SentinelOne:</span>
                <span>{simulationStatus.alertsLoaded.sentinelone}</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Interval (ms):</label>
          <select
            value={intervalMs}
            onChange={(e) => setIntervalMs(Number(e.target.value))}
            className="w-full p-2 border rounded"
            disabled={simulationStatus?.isRunning}
          >
            <option value={1000}>1 second (Fast)</option>
            <option value={3000}>3 seconds (Normal)</option>
            <option value={5000}>5 seconds (Slow)</option>
            <option value={10000}>10 seconds (Very Slow)</option>
          </select>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => startMutation.mutate()}
            disabled={simulationStatus?.isRunning || startMutation.isPending}
            className="flex-1"
          >
            <Play className="h-4 w-4 mr-2" />
            Start
          </Button>
          <Button
            variant="outline"
            onClick={() => stopMutation.mutate()}
            disabled={!simulationStatus?.isRunning || stopMutation.isPending}
            className="flex-1"
          >
            <Square className="h-4 w-4 mr-2" />
            Stop
          </Button>
        </div>

        {simulationStatus?.currentIndex && (
          <div className="text-xs text-muted-foreground">
            Current index: {simulationStatus.currentIndex}
          </div>
        )}
      </CardContent>
    </Card>
  );
}