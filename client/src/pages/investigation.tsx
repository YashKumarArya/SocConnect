import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Shield, Brain, AlertTriangle, CheckCircle, Clock, Eye, Download, RefreshCw, Activity, Users, Server, Network, FileText, Target, Zap, TrendingUp, BarChart3, Settings, Bell, User, Search, Filter, Calendar, MessageSquare, ExternalLink, ChevronDown, ChevronRight, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import InvestigationKnowledgeGraph from "@/components/ui/investigation-knowledge-graph";

interface TimelineEvent {
  id: string;
  timestamp: string;
  type: "detection" | "analysis" | "investigation" | "containment" | "closed";
  status: "completed" | "in_progress" | "pending";
  title: string;
  description: string;
  user?: string;
}

export default function Investigation() {
  const [, setLocation] = useLocation();
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);

  // Real API calls to your backend
  const { data: incidents, isLoading: incidentsLoading } = useQuery({
    queryKey: ['/api/incidents'],
    queryFn: api.getIncidents,
  });

  const { data: actions, isLoading: actionsLoading } = useQuery({
    queryKey: ['/api/actions'],
    queryFn: api.getActions,
  });

  const { data: alerts } = useQuery({
    queryKey: ['/api/alerts'],
    queryFn: api.getAlerts,
  });

  const { data: sources } = useQuery({
    queryKey: ['/api/sources'],
    queryFn: api.getSources,
  });

  // Get the most critical incident for detailed view
  const criticalIncident = incidents?.find((inc: any) => 
    inc.severity === 'critical' || inc.severity === 'high'
  ) || incidents?.[0];

  // Generate timeline from real incident actions
  const generateTimelineFromActions = (incident: any): TimelineEvent[] => {
    if (!incident) return [];

    const incidentActions = actions?.filter((action: any) => 
      action.incidentId === incident.id
    ) || [];

    const timeline: TimelineEvent[] = [
      {
        id: "detection",
        timestamp: incident.createdAt,
        type: "detection",
        status: "completed",
        title: "Incident Detected",
        description: `${incident.severity.toUpperCase()} level incident created`,
        user: "System"
      }
    ];

    // Add actions as timeline events
    incidentActions.forEach((action: any, index: number) => {
      timeline.push({
        id: action.id,
        timestamp: action.performedAt,
        type: index === 0 ? "analysis" : index === 1 ? "investigation" : "containment",
        status: "completed",
        title: action.actionType.replace('_', ' '),
        description: action.payload?.description || "Action performed",
        user: action.performedBy || "System"
      });
    });

    // Add current status
    const currentStatus = incident.status === 'resolved' ? 'closed' : 
                         incident.status === 'monitoring' ? 'containment' : 'investigation';
    
    if (incident.status !== 'resolved') {
      timeline.push({
        id: "current",
        timestamp: new Date().toISOString(),
        type: currentStatus as any,
        status: "in_progress",
        title: `Currently ${incident.status}`,
        description: `Incident is currently being ${incident.status.replace('_', ' ')}`,
        user: incident.assignedTo ? `Assigned to: ${incident.assignedTo}` : "Unassigned"
      });
    }

    return timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const timelineEvents = generateTimelineFromActions(criticalIncident);

  const getTimelineIcon = (type: string, status: string) => {
    const iconClass = status === 'completed' ? 'text-green-400' : status === 'in_progress' ? 'text-yellow-400' : 'text-gray-400';

    switch (type) {
      case 'detection': return <AlertTriangle className={`w-4 h-4 ${iconClass}`} />;
      case 'analysis': return <Brain className={`w-4 h-4 ${iconClass}`} />;
      case 'investigation': return <Eye className={`w-4 h-4 ${iconClass}`} />;
      case 'containment': return <Shield className={`w-4 h-4 ${iconClass}`} />;
      case 'closed': return <CheckCircle className={`w-4 h-4 ${iconClass}`} />;
      default: return <Clock className={`w-4 h-4 ${iconClass}`} />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      default: return 'text-blue-400';
    }
  };

  if (incidentsLoading) {
    return (
      <div className="min-h-screen bg-[hsl(215,28%,5%)] text-white p-6">
        <div className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="lg:col-span-2 h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(215,28%,5%)] text-white font-['Inter']">
      {/* Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-[hsl(215,28%,5%)]/95 backdrop-blur-sm border-b border-[hsl(330,100%,50%)]/20 px-6 py-4 sticky top-0 z-50"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/dashboard")}
              className="text-[hsl(330,100%,50%)] hover:bg-[hsl(330,100%,50%)]/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-[hsl(330,100%,50%)] to-[hsl(267,100%,67%)] rounded-3xl"></div>
              <span className="text-xl font-bold">Investigation Center</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" className="border-[hsl(330,100%,50%)]/20 text-[hsl(330,100%,50%)]">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-300 hover:text-[hsl(330,100%,50%)] transition-colors">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-300 hover:text-[hsl(330,100%,50%)] transition-colors">
              <Settings className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-gray-300" />
              <div className="text-sm">
                <div className="text-white">Security Analyst</div>
                <div className="text-xs text-gray-400">Senior Analyst</div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="p-6 space-y-6">
        {/* Incident Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className={`text-3xl font-bold mb-2 ${getSeverityColor(criticalIncident?.severity || 'low')}`}>
                {criticalIncident ? 
                  `${criticalIncident.severity.toUpperCase()} Alert: ${criticalIncident.title}` :
                  "No Active Incidents"
                }
              </h1>
              <p className="text-gray-300">
                {criticalIncident ? 
                  `Incident ID: ${criticalIncident.id.slice(-8)} • Severity: ${criticalIncident.severity.toUpperCase()} • ${new Date(criticalIncident.createdAt).toLocaleString()}` :
                  "All incidents resolved"
                }
              </p>
            </div>
            {criticalIncident && (
              <div className="flex space-x-2">
                <Button variant="outline" className="border-green-500/20 text-green-400 hover:bg-green-500/10">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Resolved
                </Button>
                <Button variant="outline" className="border-blue-500/20 text-blue-400 hover:bg-blue-500/10">
                  <Eye className="w-4 h-4 mr-2" />
                  Deep Dive
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Risk Assessment */}
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6"
          >
            {/* Severity Assessment */}
            <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-300">Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className={`text-4xl font-bold mb-1 ${getSeverityColor(criticalIncident?.severity || 'low')}`}>
                    {criticalIncident ? 
                      (criticalIncident.severity === 'critical' ? '95' : 
                       criticalIncident.severity === 'high' ? '78' :
                       criticalIncident.severity === 'medium' ? '52' : '28') : '0'}
                  </div>
                  <div className="text-xs text-gray-400">Risk Score</div>
                </div>
                <Progress 
                  value={criticalIncident ? 
                    (criticalIncident.severity === 'critical' ? 95 : 
                     criticalIncident.severity === 'high' ? 78 :
                     criticalIncident.severity === 'medium' ? 52 : 28) : 0} 
                  className="mb-4" 
                />
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Severity Level:</span>
                    <span className={getSeverityColor(criticalIncident?.severity || 'low')}>
                      {criticalIncident?.severity?.toUpperCase() || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-sky-400">{criticalIncident?.status || 'No incidents'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Assigned:</span>
                    <span className="text-white">{criticalIncident?.assignedTo || 'Unassigned'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(267,100%,67%)]/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-300 flex items-center">
                  <Activity className="w-4 h-4 mr-2 text-[hsl(267,100%,67%)]" />
                  System Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Incidents:</span>
                    <span className="text-white">{incidents?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Active Alerts:</span>
                    <span className="text-orange-400">{alerts?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Data Sources:</span>
                    <span className="text-green-400">{sources?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Actions Taken:</span>
                    <span className="text-sky-400">{actions?.length || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-[hsl(0,0%,8%)]/80 border-orange-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-300">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2">
                  <Button variant="outline" size="sm" className="border-green-500/20 text-green-400 hover:bg-green-500/10">
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                  <Button variant="outline" size="sm" className="border-blue-500/20 text-blue-400 hover:bg-blue-500/10">
                    <Server className="w-4 h-4 mr-2" />
                    Check Systems
                  </Button>
                  <Button variant="outline" size="sm" className="border-orange-500/20 text-orange-400 hover:bg-orange-500/10" onClick={() => window.location.reload()}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Center Column - Knowledge Graph */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <InvestigationKnowledgeGraph />
          </motion.div>

          {/* Right Column - Timeline & Details */}
          <motion.div 
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-6"
          >
            {/* Investigation Timeline */}
            <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
              <CardHeader>
                <CardTitle className="text-sm text-white">Investigation Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timelineEvents.length > 0 ? timelineEvents.map((event, index) => (
                    <motion.div 
                      key={event.id}
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="flex items-start space-x-3"
                    >
                      <div className="flex flex-col items-center">
                        <div className={`p-2 rounded-full border-2 ${
                          event.status === 'completed' ? 'bg-green-400/20 border-green-400' :
                          event.status === 'in_progress' ? 'bg-yellow-400/20 border-yellow-400' :
                          'bg-gray-400/20 border-gray-400'
                        }`}>
                          {getTimelineIcon(event.type, event.status)}
                        </div>
                        {index < timelineEvents.length - 1 && (
                          <div className="w-0.5 h-12 bg-gray-600 mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-white">{event.title}</h4>
                          <Badge variant="outline" className={
                            event.status === 'completed' ? 'border-green-400/20 text-green-400' :
                            event.status === 'in_progress' ? 'border-yellow-400/20 text-yellow-400' :
                            'border-gray-400/20 text-gray-400'
                          }>
                            {event.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400 mb-1">{event.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{new Date(event.timestamp).toLocaleString()}</span>
                          {event.user && <span>by {event.user}</span>}
                        </div>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="text-center py-8 text-slate-400">
                      <Clock className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                      <p>No timeline data available</p>
                    </div>
                  )}
                </div>

                {criticalIncident && (
                  <div className="mt-6 pt-4 border-t border-gray-700">
                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                      <span>Time Elapsed: {Math.floor((Date.now() - new Date(criticalIncident.createdAt).getTime()) / (1000 * 60))} min</span>
                      <span>Status: {criticalIncident.status}</span>
                    </div>
                    <Progress value={criticalIncident.status === 'resolved' ? 100 : 60} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Related Incidents */}
            <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
              <CardHeader>
                <CardTitle className="text-sm text-white">All Incidents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {incidents?.slice(0, 5).map((incident: any, index: number) => (
                    <div 
                      key={incident.id} 
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedIncident === incident.id ? 
                        'bg-[hsl(330,100%,50%)]/10 border-[hsl(330,100%,50%)]/30' : 
                        'bg-[hsl(0,0%,6%)]/60 border-[hsl(330,100%,50%)]/10 hover:bg-[hsl(0,0%,10%)]/60'
                      }`}
                      onClick={() => setSelectedIncident(incident.id)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white">
                          {incident.title || `Incident ${incident.id.slice(-6)}`}
                        </span>
                        <Badge className={`${getSeverityColor(incident.severity)}`}>
                          {incident.severity}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(incident.createdAt).toLocaleString()}
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-4 text-slate-400">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                      <p className="text-sm">No incidents found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom Section - Detailed Analysis */}
        {criticalIncident && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Incident Summary */}
            <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
              <CardHeader>
                <CardTitle className="text-white">Incident Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-2">Summary:</h4>
                    <p className="text-sm text-gray-300">
                      {criticalIncident.description || 
                       `${criticalIncident.severity.toUpperCase()} severity incident detected and is currently being ${criticalIncident.status}. Investigation is ongoing to determine the full scope of impact.`
                      }
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-white mb-2">Key Details:</h4>
                    <div className="space-y-1 text-sm text-gray-300 ml-4">
                      <div>• Incident ID: {criticalIncident.id}</div>
                      <div>• Severity: {criticalIncident.severity.toUpperCase()}</div>
                      <div>• Status: {criticalIncident.status}</div>
                      <div>• Created: {new Date(criticalIncident.createdAt).toLocaleString()}</div>
                      {criticalIncident.assignedTo && <div>• Assigned to: {criticalIncident.assignedTo}</div>}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-white mb-2">Recommended Actions:</h4>
                    <div className="space-y-1 text-sm text-gray-300 ml-4">
                      <div>• Continue monitoring affected systems</div>
                      <div>• Review and update security policies</div>
                      <div>• Document lessons learned</div>
                      <div>• Coordinate with relevant teams</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Impact */}
            <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
              <CardHeader>
                <CardTitle className="text-white">System Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-[hsl(0,0%,6%)]/60 rounded-lg">
                      <div className="text-2xl font-bold text-orange-400">{alerts?.length || 0}</div>
                      <div className="text-xs text-gray-400">Related Alerts</div>
                    </div>
                    <div className="text-center p-3 bg-[hsl(0,0%,6%)]/60 rounded-lg">
                      <div className="text-2xl font-bold text-blue-400">{actions?.length || 0}</div>
                      <div className="text-xs text-gray-400">Actions Taken</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-2">Data Sources Involved:</h4>
                    <div className="space-y-2">
                      {sources?.slice(0, 4).map((source: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-[hsl(0,0%,6%)]/40 rounded">
                          <div className="flex items-center space-x-2">
                            <Network className="w-4 h-4 text-green-400" />
                            <span className="text-sm text-gray-300">{source.name}</span>
                          </div>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            Active
                          </Badge>
                        </div>
                      )) || (
                        <div className="text-sm text-gray-400">No sources configured</div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}