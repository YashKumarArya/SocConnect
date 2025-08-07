import { useEffect } from 'react';
import { useWebSocket } from './use-websocket';
import { queryClient } from '@/lib/queryClient';
import { useToast } from './use-toast';

interface WebSocketEvent {
  type: string;
  data?: any;
  message?: string;
}

export function useRealtimeUpdates() {
  const { lastMessage, connectionStatus } = useWebSocket();
  const { toast } = useToast();

  useEffect(() => {
    if (!lastMessage) return;

    const event = lastMessage as WebSocketEvent;

    switch (event.type) {
      case 'incident_created':
        queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        toast({
          title: "New Incident",
          description: `Incident ${event.data?.title || 'Unknown'} has been created`,
        });
        break;

      case 'incident_updated':
        queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        if (event.data?.id) {
          queryClient.invalidateQueries({ queryKey: ['/api/incidents', event.data.id] });
        }
        toast({
          title: "Incident Updated",
          description: `Incident ${event.data?.title || 'Unknown'} has been updated`,
        });
        break;

      case 'alert_created':
        queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        toast({
          title: "New Alert",
          description: `New ${event.data?.severity || 'unknown'} severity alert received`,
        });
        break;

      case 'alert_normalized':
        queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
        queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        break;

      case 'alerts_simulated':
        queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        toast({
          title: "Alerts Simulated",
          description: `${event.data?.count || 0} ${event.data?.sourceType || 'unknown'} alerts simulated`,
        });
        break;

      case 'source_created':
      case 'source_updated':
      case 'source_deleted':
        queryClient.invalidateQueries({ queryKey: ['/api/sources'] });
        break;

      case 'action_created':
        queryClient.invalidateQueries({ queryKey: ['/api/actions'] });
        if (event.data?.incidentId) {
          queryClient.invalidateQueries({ queryKey: ['/api/incidents', event.data.incidentId, 'actions'] });
        }
        break;

      case 'feedback_created':
        queryClient.invalidateQueries({ queryKey: ['/api/feedback'] });
        if (event.data?.incidentId) {
          queryClient.invalidateQueries({ queryKey: ['/api/incidents', event.data.incidentId, 'feedback'] });
        }
        break;

      case 'metric_created':
        queryClient.invalidateQueries({ queryKey: ['/api/metrics'] });
        break;

      case 'realtime_simulation_started':
        toast({
          title: "Real-time Simulation Started",
          description: `${event.data?.sourceType} alerts will be generated for ${event.data?.durationMinutes} minutes`,
        });
        break;

      case 'connected':
        // Handle initial connection
        console.log('WebSocket connected successfully');
        break;

      default:
        console.log('Unknown WebSocket event:', event.type, event);
    }
  }, [lastMessage, toast]);

  return {
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    isConnecting: connectionStatus === 'connecting',
    isDisconnected: connectionStatus === 'disconnected'
  };
}