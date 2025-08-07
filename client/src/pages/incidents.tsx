import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertTriangle, Eye, UserPlus, TrendingUp, Search, Download, X, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportDialog } from "@/components/export-dialog";
import { useState } from "react";

export default function Incidents() {
  const { toast } = useToast();
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedIncidents, setSelectedIncidents] = useState<string[]>([]);
  const [bulkOperation, setBulkOperation] = useState<string>('');
  const [showBulkDialog, setShowBulkDialog] = useState(false);

  const { data: incidents, isLoading } = useQuery({
    queryKey: ['/api/incidents'],
    queryFn: api.getIncidents,
  });

  const updateIncidentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateIncident(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
      toast({
        title: "Success",
        description: "Incident updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update incident",
        variant: "destructive",
      });
    },
  });

  const createActionMutation = useMutation({
    mutationFn: ({ incidentId, action }: { incidentId: string; action: any }) => 
      api.createAction(incidentId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
      toast({
        title: "Success",
        description: "Action created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create action",
        variant: "destructive",
      });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ incidentIds, operation, data }: { incidentIds: string[]; operation: string; data?: any }) =>
      api.bulkUpdateIncidents(incidentIds, operation, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
      setSelectedIncidents([]);
      setShowBulkDialog(false);
      toast({
        title: "Bulk Operation Complete",
        description: `Updated ${result.updated} incidents${result.errorCount > 0 ? ` (${result.errorCount} errors)` : ''}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to perform bulk operation",
        variant: "destructive",
      });
    },
  });

  const filteredIncidents = incidents?.filter((incident: any) => {
    const severityMatch = filterSeverity === 'all' || 
      (filterSeverity === 'critical' && incident.confidence > 0.8) ||
      (filterSeverity === 'high' && incident.confidence <= 0.8 && incident.confidence > 0.5) ||
      (filterSeverity === 'medium' && incident.confidence <= 0.5 && incident.confidence > 0.3) ||
      (filterSeverity === 'low' && incident.confidence <= 0.3);
    
    const searchMatch = searchTerm === '' || 
      incident.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.status.toLowerCase().includes(searchTerm.toLowerCase());
    
    return severityMatch && searchMatch;
  }) || [];

  const getSeverityInfo = (confidence: number) => {
    if (confidence > 0.8) return { label: 'Critical', color: 'critical' };
    if (confidence > 0.5) return { label: 'High', color: 'high' };
    if (confidence > 0.3) return { label: 'Medium', color: 'medium' };
    return { label: 'Low', color: 'low' };
  };

  const handleAssignIncident = (incidentId: string) => {
    createActionMutation.mutate({
      incidentId,
      action: {
        actionType: 'ANALYST_ASSIGNMENT',
        payload: { assignedTo: 'current_user' },
        performedBy: 'system',
      },
    });
  };

  const handleEscalateIncident = (incidentId: string) => {
    createActionMutation.mutate({
      incidentId,
      action: {
        actionType: 'ESCALATE',
        payload: { escalatedTo: 'senior_analyst' },
        performedBy: 'system',
      },
    });
  };

  const handleSelectIncident = (incidentId: string, checked: boolean) => {
    if (checked) {
      setSelectedIncidents(prev => [...prev, incidentId]);
    } else {
      setSelectedIncidents(prev => prev.filter(id => id !== incidentId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIncidents(filteredIncidents.map((inc: any) => inc.id));
    } else {
      setSelectedIncidents([]);
    }
  };

  const handleBulkOperation = (operation: string) => {
    setBulkOperation(operation);
    setShowBulkDialog(true);
  };

  const confirmBulkOperation = () => {
    if (selectedIncidents.length === 0 || !bulkOperation) return;
    
    const data: any = { performedBy: 'analyst' };
    
    if (bulkOperation === 'assign') {
      data.assignedTo = 'current_user'; // In real app, this would be selected
    } else if (bulkOperation === 'close') {
      data.reason = 'Bulk closure by analyst';
    }
    
    bulkUpdateMutation.mutate({
      incidentIds: selectedIncidents,
      operation: bulkOperation,
      data
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-white" data-testid="incidents-title">Incident Management</h2>
          {selectedIncidents.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {selectedIncidents.length} selected
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIncidents([])}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {selectedIncidents.length > 0 && (
            <>
              <Button
                onClick={() => handleBulkOperation('assign')}
                disabled={bulkUpdateMutation.isPending}
                className="soc-button-secondary"
                data-testid="bulk-assign"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Assign ({selectedIncidents.length})
              </Button>
              <Button
                onClick={() => handleBulkOperation('escalate')}
                disabled={bulkUpdateMutation.isPending}
                className="soc-button-warning"
                data-testid="bulk-escalate"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Escalate ({selectedIncidents.length})
              </Button>
              <Button
                onClick={() => handleBulkOperation('close')}
                disabled={bulkUpdateMutation.isPending}
                className="soc-button-success"
                data-testid="bulk-close"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Close ({selectedIncidents.length})
              </Button>
            </>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search incidents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-700 border-slate-600 pl-10 text-white placeholder-slate-400 w-64"
              data-testid="incidents-search"
            />
          </div>
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white w-40" data-testid="severity-filter">
              <SelectValue placeholder="All Incidents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Incidents</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <ExportDialog 
            type="incidents" 
            triggerText="Export Report"
            className="soc-button-primary"
          />
        </div>
      </div>

      {/* Incidents Table */}
      <Card className="soc-card" data-testid="incidents-table">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-white">
            Active Incidents ({filteredIncidents.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredIncidents.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-slate-600" />
              <p>No incidents found matching your criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-750">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-12">
                      <Checkbox
                        checked={selectedIncidents.length === filteredIncidents.length && filteredIncidents.length > 0}
                        onCheckedChange={handleSelectAll}
                        data-testid="select-all-checkbox"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Severity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredIncidents.map((incident: any, index: number) => {
                    const severity = getSeverityInfo(incident.confidence);
                    return (
                      <tr key={incident.id} className="hover:bg-slate-750" data-testid={`incident-row-${index}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Checkbox
                            checked={selectedIncidents.includes(incident.id)}
                            onCheckedChange={(checked) => handleSelectIncident(incident.id, checked as boolean)}
                            data-testid={`select-incident-${index}`}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-300" data-testid={`incident-id-${index}`}>
                          #{incident.id.slice(-6)}
                        </td>
                        <td className="px-6 py-4 text-sm text-white">
                          <div>
                            <p className="font-medium" data-testid={`incident-title-${index}`}>
                              Security Incident Detection
                            </p>
                            <p className="text-slate-400" data-testid={`incident-description-${index}`}>
                              Automated detection with {(incident.confidence * 100).toFixed(1)}% confidence
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={`soc-status-${severity.color}`} data-testid={`incident-severity-${index}`}>
                            {severity.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge 
                            variant={incident.status === 'open' ? 'destructive' : 'secondary'}
                            data-testid={`incident-status-${index}`}
                          >
                            {incident.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300" data-testid={`incident-created-${index}`}>
                          {new Date(incident.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-sky-400 hover:text-sky-300"
                            data-testid={`view-incident-${index}`}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-emerald-400 hover:text-emerald-300"
                            onClick={() => handleAssignIncident(incident.id)}
                            disabled={createActionMutation.isPending}
                            data-testid={`assign-incident-${index}`}
                          >
                            <UserPlus className="w-4 h-4 mr-1" />
                            Assign
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300"
                            onClick={() => handleEscalateIncident(incident.id)}
                            disabled={createActionMutation.isPending}
                            data-testid={`escalate-incident-${index}`}
                          >
                            <TrendingUp className="w-4 h-4 mr-1" />
                            Escalate
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Operation Confirmation Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Confirm Bulk Operation</DialogTitle>
            <DialogDescription className="text-slate-400">
              You are about to {bulkOperation} {selectedIncidents.length} incident{selectedIncidents.length !== 1 ? 's' : ''}. 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-slate-750 p-4 rounded-lg">
              <h4 className="text-white font-medium mb-2">Selected Incidents:</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {selectedIncidents.map((incidentId, index) => {
                  const incident = filteredIncidents.find((inc: any) => inc.id === incidentId);
                  return (
                    <div key={incidentId} className="text-sm text-slate-300">
                      #{incident?.id.slice(-6)} - {incident?.status || 'Unknown'}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                onClick={() => setShowBulkDialog(false)}
                disabled={bulkUpdateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmBulkOperation}
                disabled={bulkUpdateMutation.isPending}
                className="soc-button-primary"
                data-testid="confirm-bulk-operation"
              >
                {bulkUpdateMutation.isPending ? "Processing..." : `Confirm ${bulkOperation}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
