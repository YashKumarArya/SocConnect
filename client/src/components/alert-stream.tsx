import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, Clock, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  timestamp: Date;
  source?: string;
  description?: string;
  payload?: Record<string, any>;
}

interface AlertStreamProps {
  alerts: Alert[];
  onCreateIncident: (alert: Alert) => void;
  isCreatingIncident?: boolean;
  className?: string;
}

export function AlertStream({ 
  alerts, 
  onCreateIncident, 
  isCreatingIncident = false,
  className 
}: AlertStreamProps) {
  const getSeverityConfig = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return {
          color: 'border-red-500',
          bgColor: 'bg-red-500/10',
          iconColor: 'text-red-500',
          badgeClass: 'soc-status-critical'
        };
      case 'high':
        return {
          color: 'border-amber-500',
          bgColor: 'bg-amber-500/10',
          iconColor: 'text-amber-500',
          badgeClass: 'soc-status-high'
        };
      case 'medium':
        return {
          color: 'border-sky-500',
          bgColor: 'bg-sky-500/10',
          iconColor: 'text-sky-500',
          badgeClass: 'soc-status-medium'
        };
      case 'low':
        return {
          color: 'border-emerald-500',
          bgColor: 'bg-emerald-500/10',
          iconColor: 'text-emerald-500',
          badgeClass: 'soc-status-low'
        };
      default:
        return {
          color: 'border-slate-500',
          bgColor: 'bg-slate-500/10',
          iconColor: 'text-slate-500',
          badgeClass: 'soc-status-medium'
        };
    }
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  return (
    <div className={cn("space-y-3 max-h-96 overflow-y-auto", className)} data-testid="alert-stream">
      {alerts.map((alert, index) => {
        const severityConfig = getSeverityConfig(alert.severity);
        
        return (
          <div
            key={`${alert.id}-${index}`}
            className={cn(
              "flex items-center justify-between p-4 bg-slate-750 rounded-lg border-l-4 transition-all duration-200 hover:bg-slate-700",
              severityConfig.color
            )}
            data-testid={`alert-${index}`}
          >
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", severityConfig.bgColor)}>
                {alert.severity === 'critical' || alert.severity === 'high' ? (
                  <AlertTriangle className={cn("w-4 h-4", severityConfig.iconColor)} />
                ) : (
                  <Shield className={cn("w-4 h-4", severityConfig.iconColor)} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="text-sm font-medium text-white truncate" data-testid={`alert-${index}-title`}>
                    {alert.title}
                  </p>
                  <Badge className={severityConfig.badgeClass} data-testid={`alert-${index}-severity`}>
                    {alert.severity}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 truncate" data-testid={`alert-${index}-source`}>
                  {alert.source ? `Source: ${alert.source}` : 'Unknown source'}
                  {alert.payload && Object.keys(alert.payload).length > 0 && (
                    <span className="ml-2">
                      • {Object.entries(alert.payload).slice(0, 2).map(([key, value]) => 
                        `${key}: ${value}`
                      ).join(' • ')}
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="flex items-center space-x-1 text-xs text-slate-400">
                <Clock className="w-3 h-3" />
                <span data-testid={`alert-${index}-time`}>
                  {getTimeAgo(alert.timestamp)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-sky-400 hover:text-sky-300 hover:bg-sky-500/10"
                onClick={() => onCreateIncident(alert)}
                disabled={isCreatingIncident}
                data-testid={`create-incident-${index}`}
              >
                <Plus className="w-4 h-4 mr-1" />
                {isCreatingIncident ? "Creating..." : "Create Incident"}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
