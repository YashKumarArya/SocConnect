import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Shield, Server, Activity, Trash2, Edit, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Source } from "@shared/schema";

interface SourceCardProps {
  source: Source;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
  onEdit?: () => void;
  isDeleting?: boolean;
  isToggling?: boolean;
  testId?: string;
  className?: string;
}

export function SourceCard({ 
  source, 
  onToggle, 
  onDelete, 
  onEdit,
  isDeleting = false,
  isToggling = false,
  testId = "source-card",
  className 
}: SourceCardProps) {
  const getSourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'siem':
        return Shield;
      case 'edr':
        return Activity;
      case 'firewall':
        return Server;
      default:
        return Server;
    }
  };

  const getSourceIconColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'siem':
        return 'text-sky-500';
      case 'edr':
        return 'text-emerald-500';
      case 'firewall':
        return 'text-amber-500';
      default:
        return 'text-slate-500';
    }
  };

  const getSourceIconBg = (type: string) => {
    switch (type.toLowerCase()) {
      case 'siem':
        return 'bg-sky-500/10';
      case 'edr':
        return 'bg-emerald-500/10';
      case 'firewall':
        return 'bg-amber-500/10';
      default:
        return 'bg-slate-500/10';
    }
  };

  const isEnabled = source.config?.enabled !== false;
  const IconComponent = getSourceIcon(source.type);
  
  // Mock some realistic data for demonstration
  const lastEventTime = new Date(Date.now() - Math.random() * 3600000).toISOString();
  const eventsPerHour = Math.floor(Math.random() * 5000) + 100;

  const getLastEventDisplay = () => {
    const now = new Date();
    const lastEvent = new Date(lastEventTime);
    const diffMs = now.getTime() - lastEvent.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return lastEvent.toLocaleDateString();
    }
  };

  return (
    <Card className={cn("soc-card transition-all duration-200 hover:border-slate-600", className)} data-testid={testId}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", getSourceIconBg(source.type))}>
            <IconComponent className={cn("w-5 h-5", getSourceIconColor(source.type))} />
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              className={isEnabled ? "soc-status-low" : "soc-status-critical"}
              data-testid={`${testId}-status`}
            >
              {isEnabled ? "Active" : "Inactive"}
            </Badge>
            {!isEnabled && (
              <AlertCircle className="w-4 h-4 text-amber-500" />
            )}
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-medium text-white mb-2" data-testid={`${testId}-name`}>
            {source.name}
          </h3>
          <p className="text-sm text-slate-400 mb-3" data-testid={`${testId}-type`}>
            {source.type} • {source.config?.endpoint ? 'Configured' : 'Configuration needed'}
          </p>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Last Event:</span>
            <span className="text-white" data-testid={`${testId}-last-event`}>
              {isEnabled ? getLastEventDisplay() : 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Events/hr:</span>
            <span className="text-white" data-testid={`${testId}-events-per-hour`}>
              {isEnabled ? eventsPerHour.toLocaleString() : '0'}
            </span>
          </div>
          {source.config?.endpoint && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Endpoint:</span>
              <span className="text-slate-300 text-xs truncate max-w-32" title={source.config.endpoint}>
                {source.config.endpoint}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-700">
          <div className="flex items-center space-x-2">
            <Switch
              checked={isEnabled}
              onCheckedChange={onToggle}
              disabled={isToggling}
              data-testid={`${testId}-toggle`}
            />
            <span className="text-sm text-slate-400">
              {isToggling ? "Updating..." : isEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white hover:bg-slate-700"
                onClick={onEdit}
                data-testid={`${testId}-edit`}
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={onDelete}
              disabled={isDeleting}
              data-testid={`${testId}-delete`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
