import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Eye, UserPlus, TrendingUp, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Incident } from "@shared/schema";

interface IncidentCardProps {
  incident: Incident;
  onView?: () => void;
  onAssign?: () => void;
  onEscalate?: () => void;
  isLoading?: boolean;
  className?: string;
  testId?: string;
}

export function IncidentCard({ 
  incident,
  onView,
  onAssign,
  onEscalate,
  isLoading = false,
  className,
  testId = "incident-card"
}: IncidentCardProps) {
  const getSeverityInfo = (confidence: number) => {
    if (confidence > 0.8) return { label: 'Critical', color: 'critical', dotColor: 'bg-red-500' };
    if (confidence > 0.5) return { label: 'High', color: 'high', dotColor: 'bg-amber-500' };
    if (confidence > 0.3) return { label: 'Medium', color: 'medium', dotColor: 'bg-sky-500' };
    return { label: 'Low', color: 'low', dotColor: 'bg-emerald-500' };
  };

  const getTimeAgo = (date: string | Date) => {
    const now = new Date();
    const incidentDate = new Date(date);
    const diffMs = now.getTime() - incidentDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return incidentDate.toLocaleDateString();
    }
  };

  const severity = getSeverityInfo(incident.confidence);
  const isOpen = incident.status === 'open';

  return (
    <Card className={cn("soc-card transition-all duration-200 hover:border-slate-600", className)} data-testid={testId}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-3 mb-4">
          <div className={cn("w-3 h-3 rounded-full mt-2 flex-shrink-0", severity.dotColor)}></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-sm font-medium text-white truncate" data-testid={`${testId}-title`}>
                Security Incident #{incident.id.slice(-6)}
              </h3>
              <Badge 
                className={`soc-status-${severity.color} ml-2 flex-shrink-0`}
                data-testid={`${testId}-severity`}
              >
                {severity.label}
              </Badge>
            </div>
            
            <p className="text-xs text-slate-400 mb-3" data-testid={`${testId}-description`}>
              {incident.decision === 'AUTO' ? 'Automated detection' : 'Manual review required'} 
              {' • '}
              {(incident.confidence * 100).toFixed(1)}% confidence
            </p>

            <div className="flex items-center space-x-4 text-xs text-slate-400 mb-4">
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span data-testid={`${testId}-time`}>
                  {getTimeAgo(incident.createdAt)}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <User className="w-3 h-3" />
                <span data-testid={`${testId}-status`}>
                  {incident.status}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {onView && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 h-8 px-2"
                  onClick={onView}
                  disabled={isLoading}
                  data-testid={`${testId}-view`}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  View
                </Button>
              )}
              
              {onAssign && isOpen && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 h-8 px-2"
                  onClick={onAssign}
                  disabled={isLoading}
                  data-testid={`${testId}-assign`}
                >
                  <UserPlus className="w-3 h-3 mr-1" />
                  Assign
                </Button>
              )}
              
              {onEscalate && isOpen && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 px-2"
                  onClick={onEscalate}
                  disabled={isLoading}
                  data-testid={`${testId}-escalate`}
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Escalate
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Additional incident metadata */}
        <div className="pt-3 border-t border-slate-700">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">ID: {incident.id}</span>
            <span className="text-slate-500">
              Decision: {incident.decision}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
