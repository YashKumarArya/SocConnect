import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Star, Plus, User } from "lucide-react";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertFeedbackSchema } from "@shared/schema";
import { useState } from "react";

const feedbackFormSchema = insertFeedbackSchema.extend({
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, "Comment must be at least 10 characters"),
});

export default function Feedback() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: feedback, isLoading: feedbackLoading } = useQuery({
    queryKey: ['/api/feedback'],
    queryFn: api.getFeedback,
  });

  const { data: incidents } = useQuery({
    queryKey: ['/api/incidents'],
    queryFn: api.getIncidents,
  });

  const createFeedbackMutation = useMutation({
    mutationFn: api.createFeedback,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/feedback'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Feedback submitted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive",
      });
    },
  });

  const form = useForm<z.infer<typeof feedbackFormSchema>>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      incidentId: "",
      userId: "demo-user-id", // In real app, this would come from auth
      feedback: {},
      rating: 5,
      comment: "",
    },
  });

  const onSubmit = (values: z.infer<typeof feedbackFormSchema>) => {
    const { rating, comment, ...feedbackData } = values;
    createFeedbackMutation.mutate({
      ...feedbackData,
      feedback: {
        rating,
        comment,
        timestamp: new Date().toISOString(),
      },
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-amber-400 fill-current' : 'text-slate-600'}`}
      />
    ));
  };

  if (feedbackLoading) {
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
        <h2 className="text-2xl font-bold text-white" data-testid="feedback-title">Feedback & Reviews</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 sm:mt-0 soc-button-primary" data-testid="submit-feedback">
              <Plus className="w-4 h-4 mr-2" />
              Submit Feedback
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Submit Feedback</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="feedback-form">
                <FormField
                  control={form.control}
                  name="incidentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Related Incident</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="incident-select">
                            <SelectValue placeholder="Select an incident" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {incidents?.slice(0, 10).map((incident: any) => (
                            <SelectItem key={incident.id} value={incident.id}>
                              #{incident.id.slice(-6)} - {new Date(incident.createdAt).toLocaleDateString()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Rating</FormLabel>
                      <FormControl>
                        <div className="flex space-x-1" data-testid="rating-stars">
                          {Array.from({ length: 5 }, (_, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => field.onChange(i + 1)}
                              className="p-1"
                              data-testid={`star-${i + 1}`}
                            >
                              <Star
                                className={`w-6 h-6 ${
                                  i < field.value ? 'text-amber-400 fill-current' : 'text-slate-600'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Comment</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Share your thoughts on the incident handling, model accuracy, or system performance..."
                          className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                          data-testid="feedback-comment"
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
                    data-testid="cancel-feedback"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createFeedbackMutation.isPending}
                    className="soc-button-primary"
                    data-testid="submit-feedback-button"
                  >
                    {createFeedbackMutation.isPending ? "Submitting..." : "Submit Feedback"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Feedback Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="soc-card" data-testid="total-feedback-stat">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Total Feedback</p>
                <p className="text-3xl font-bold text-white mt-2" data-testid="total-feedback-count">
                  {feedback?.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-sky-500/10 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-sky-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="soc-card" data-testid="avg-rating-stat">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Average Rating</p>
                <div className="flex items-center mt-2">
                  <p className="text-3xl font-bold text-white mr-2" data-testid="avg-rating-value">4.2</p>
                  <div className="flex">
                    {renderStars(4)}
                  </div>
                </div>
              </div>
              <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="soc-card" data-testid="positive-feedback-stat">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Positive Feedback</p>
                <p className="text-3xl font-bold text-white mt-2" data-testid="positive-feedback-percentage">
                  86%
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="soc-card" data-testid="response-rate-stat">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Response Rate</p>
                <p className="text-3xl font-bold text-white mt-2" data-testid="feedback-response-rate">
                  73%
                </p>
              </div>
              <div className="w-12 h-12 bg-sky-500/10 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-sky-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback List */}
      <Card className="soc-card" data-testid="feedback-list">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-white">
            Recent Feedback ({feedback?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!feedback?.length ? (
            <div className="text-center py-12 text-slate-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-600" />
              <p>No feedback submitted yet</p>
              <p className="text-sm mt-2">Be the first to share your thoughts!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedback.map((item: any, index: number) => (
                <div key={item.id} className="flex space-x-4 p-4 bg-slate-750 rounded-lg" data-testid={`feedback-${index}`}>
                  <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-slate-300" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-white" data-testid={`feedback-${index}-user`}>
                        Security Analyst
                      </span>
                      <span className="text-slate-400 text-sm" data-testid={`feedback-${index}-time`}>
                        • {new Date(item.submittedAt).toLocaleString()}
                      </span>
                    </div>
                    {item.feedback?.comment && (
                      <p className="text-slate-300 text-sm mb-3" data-testid={`feedback-${index}-comment`}>
                        {item.feedback.comment}
                      </p>
                    )}
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-slate-400">Incident:</span>
                        <Badge variant="outline" className="text-sky-400 border-sky-400" data-testid={`feedback-${index}-incident`}>
                          #{item.incidentId?.slice(-6) || 'N/A'}
                        </Badge>
                      </div>
                      {item.feedback?.rating && (
                        <div className="flex items-center space-x-1" data-testid={`feedback-${index}-rating`}>
                          <span className="text-xs text-slate-400">Rating:</span>
                          <div className="flex">
                            {renderStars(item.feedback.rating)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
