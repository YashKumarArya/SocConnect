import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileText, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface ExportDialogProps {
  type: 'incidents' | 'alerts' | 'analytics' | 'actions';
  triggerText?: string;
  className?: string;
}

interface ExportFilters {
  startDate?: string;
  endDate?: string;
  severity?: string[];
  status?: string[];
  sourceId?: string;
}

export function ExportDialog({ type, triggerText, className }: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [filters, setFilters] = useState<ExportFilters>({});
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      let response: Response;
      
      switch (type) {
        case 'incidents':
          response = await api.exportIncidents(format, filters);
          break;
        case 'alerts':
          response = await api.exportAlerts(format, filters);
          break;
        case 'analytics':
          response = await api.exportAnalytics(format, {
            startDate: filters.startDate,
            endDate: filters.endDate,
          });
          break;
        case 'actions':
          response = await api.exportActions(format, {
            startDate: filters.startDate,
            endDate: filters.endDate,
          });
          break;
        default:
          throw new Error('Unknown export type');
      }

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `soc-${type}-export.${format}`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `${type} data exported successfully as ${format.toUpperCase()}`,
      });

      setOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: `Failed to export ${type} data. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const severityOptions = ['critical', 'high', 'medium', 'low'];
  const statusOptions = ['open', 'investigating', 'monitoring', 'resolved'];

  const handleSeverityToggle = (severity: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      severity: checked 
        ? [...(prev.severity || []), severity]
        : (prev.severity || []).filter(s => s !== severity)
    }));
  };

  const handleStatusToggle = (status: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      status: checked 
        ? [...(prev.status || []), status]
        : (prev.status || []).filter(s => s !== status)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={className || "soc-button-primary"} data-testid={`export-${type}`}>
          <Download className="w-4 h-4 mr-2" />
          {triggerText || `Export ${type.charAt(0).toUpperCase() + type.slice(1)}`}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            Export {type.charAt(0).toUpperCase() + type.slice(1)} Data
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label className="text-slate-300">Export Format</Label>
            <Select value={format} onValueChange={(value: 'csv' | 'json') => setFormat(value)}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    CSV (Excel Compatible)
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center">
                    <Database className="w-4 h-4 mr-2" />
                    JSON (Structured Data)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label className="text-slate-300">Date Range (Optional)</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-slate-400">Start Date</Label>
                <Input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-400">End Date</Label>
                <Input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
          </div>

          {/* Filters specific to incidents and alerts */}
          {(type === 'incidents' || type === 'alerts') && (
            <div className="space-y-4">
              {/* Severity Filter */}
              <div className="space-y-2">
                <Label className="text-slate-300">Severity (Optional)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {severityOptions.map((severity) => (
                    <div key={severity} className="flex items-center space-x-2">
                      <Checkbox
                        id={`severity-${severity}`}
                        checked={filters.severity?.includes(severity) || false}
                        onCheckedChange={(checked) => handleSeverityToggle(severity, checked as boolean)}
                      />
                      <Label 
                        htmlFor={`severity-${severity}`} 
                        className="text-sm text-slate-300 capitalize"
                      >
                        {severity}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Filter (incidents only) */}
              {type === 'incidents' && (
                <div className="space-y-2">
                  <Label className="text-slate-300">Status (Optional)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {statusOptions.map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${status}`}
                          checked={filters.status?.includes(status) || false}
                          onCheckedChange={(checked) => handleStatusToggle(status, checked as boolean)}
                        />
                        <Label 
                          htmlFor={`status-${status}`} 
                          className="text-sm text-slate-300 capitalize"
                        >
                          {status}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Export Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="soc-button-primary"
              data-testid="confirm-export"
            >
              {isExporting ? "Exporting..." : "Export Data"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}