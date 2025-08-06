import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Server, Plus, Edit, Trash2, Activity } from "lucide-react";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SourceCard } from "@/components/source-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertSourceSchema } from "@shared/schema";
import { useState } from "react";

const sourceFormSchema = insertSourceSchema.extend({
  endpoint: z.string().url().optional(),
});

export default function Sources() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: sources, isLoading } = useQuery({
    queryKey: ['/api/sources'],
    queryFn: api.getSources,
  });

  const createSourceMutation = useMutation({
    mutationFn: api.createSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sources'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Source created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create source",
        variant: "destructive",
      });
    },
  });

  const updateSourceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateSource(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sources'] });
      toast({
        title: "Success",
        description: "Source updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update source",
        variant: "destructive",
      });
    },
  });

  const deleteSourceMutation = useMutation({
    mutationFn: api.deleteSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sources'] });
      toast({
        title: "Success",
        description: "Source deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete source",
        variant: "destructive",
      });
    },
  });

  const form = useForm<z.infer<typeof sourceFormSchema>>({
    resolver: zodResolver(sourceFormSchema),
    defaultValues: {
      name: "",
      type: "",
      config: {},
    },
  });

  const onSubmit = (values: z.infer<typeof sourceFormSchema>) => {
    const { endpoint, ...sourceData } = values;
    const config = endpoint ? { ...sourceData.config, endpoint } : sourceData.config;
    
    createSourceMutation.mutate({
      ...sourceData,
      config,
    });
  };

  const handleToggleSource = (sourceId: string, currentStatus: boolean) => {
    updateSourceMutation.mutate({
      id: sourceId,
      data: { config: { enabled: !currentStatus } },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="soc-card">
              <CardContent className="p-6">
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-white" data-testid="sources-title">Data Sources</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 sm:mt-0 soc-button-primary" data-testid="add-source">
              <Plus className="w-4 h-4 mr-2" />
              Add Source
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Add New Data Source</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="create-source-form">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Source Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="bg-slate-700 border-slate-600 text-white"
                          data-testid="source-name-input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Source Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="source-type-select">
                            <SelectValue placeholder="Select source type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SIEM">SIEM</SelectItem>
                          <SelectItem value="EDR">EDR</SelectItem>
                          <SelectItem value="Firewall">Firewall</SelectItem>
                          <SelectItem value="IDS">IDS</SelectItem>
                          <SelectItem value="Antivirus">Antivirus</SelectItem>
                          <SelectItem value="Network">Network Monitor</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endpoint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Endpoint URL (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="https://source.example.com/api"
                          className="bg-slate-700 border-slate-600 text-white"
                          data-testid="source-endpoint-input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="cancel-source-button"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createSourceMutation.isPending}
                    className="soc-button-primary"
                    data-testid="create-source-button"
                  >
                    {createSourceMutation.isPending ? "Creating..." : "Create Source"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sources Grid */}
      {sources?.length === 0 ? (
        <Card className="soc-card">
          <CardContent className="text-center py-12">
            <Server className="w-12 h-12 mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400 text-lg mb-2">No data sources configured</p>
            <p className="text-slate-500 text-sm">Add your first data source to start monitoring</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sources?.map((source: any, index: number) => (
            <SourceCard
              key={source.id}
              source={source}
              onToggle={(enabled) => handleToggleSource(source.id, !enabled)}
              onDelete={() => deleteSourceMutation.mutate(source.id)}
              isDeleting={deleteSourceMutation.isPending}
              isToggling={updateSourceMutation.isPending}
              testId={`source-${index}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
