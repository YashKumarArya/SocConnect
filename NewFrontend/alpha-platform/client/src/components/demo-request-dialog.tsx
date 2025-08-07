import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import SignupDialog from "./signup-dialog";

const demoRequestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  company: z.string().min(1, "Company name is required"),
  jobTitle: z.string().optional(),
  phoneNumber: z.string().optional(),
  message: z.string().optional(),
});

type DemoRequestForm = z.infer<typeof demoRequestSchema>;

interface DemoRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DemoRequestDialog({ open, onOpenChange }: DemoRequestDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSignup, setShowSignup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<DemoRequestForm>({
    resolver: zodResolver(demoRequestSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      jobTitle: "",
      phoneNumber: "",
      message: "",
    },
  });

  const submitDemoRequest = useMutation({
    mutationFn: async (data: DemoRequestForm) => {
      return await apiRequest("POST", "/api/demo-requests", data);
    },
    onSuccess: () => {
      toast({
        title: "Demo request submitted!",
        description: "We'll be in touch within 24 hours to schedule your demo.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/demo-requests"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error submitting request",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DemoRequestForm) => {
    submitDemoRequest.mutate(data);
  };

  return (
    <>
      <SignupDialog open={showSignup} onOpenChange={setShowSignup} />
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[hsl(215,28%,5%)] border-[hsl(170,100%,48%)]/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold glow-text">Request a Demo</DialogTitle>
          <DialogDescription className="text-gray-300">
            See how Prophet Security can transform your security operations. We'll schedule a personalized demo for your team.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="John Doe" 
                        {...field} 
                        className="bg-[hsl(0,0%,10%)]/50 border-[hsl(170,100%,48%)]/30 text-white placeholder:text-gray-400 focus:border-[hsl(170,100%,48%)]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Email *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="john@company.com" 
                        type="email" 
                        {...field} 
                        className="bg-[hsl(0,0%,10%)]/50 border-[hsl(170,100%,48%)]/30 text-white placeholder:text-gray-400 focus:border-[hsl(170,100%,48%)]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Company *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="ACME Corp" 
                      {...field} 
                      className="bg-[hsl(0,0%,10%)]/50 border-[hsl(170,100%,48%)]/30 text-white placeholder:text-gray-400 focus:border-[hsl(170,100%,48%)]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Job Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="CISO" 
                        {...field} 
                        className="bg-[hsl(0,0%,10%)]/50 border-[hsl(170,100%,48%)]/30 text-white placeholder:text-gray-400 focus:border-[hsl(170,100%,48%)]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Phone Number</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="+1 (555) 123-4567" 
                        {...field} 
                        className="bg-[hsl(0,0%,10%)]/50 border-[hsl(170,100%,48%)]/30 text-white placeholder:text-gray-400 focus:border-[hsl(170,100%,48%)]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Message</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell us about your current security challenges..." 
                      rows={3}
                      {...field} 
                      className="bg-[hsl(0,0%,10%)]/50 border-[hsl(170,100%,48%)]/30 text-white placeholder:text-gray-400 focus:border-[hsl(170,100%,48%)] resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="glow"
                disabled={submitDemoRequest.isPending}
                className="flex-1"
              >
                {submitDemoRequest.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Request Demo"
                )}
              </Button>
            </div>

            <div className="text-center pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-400 mb-3">
                Ready to get started immediately?
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  setShowSignup(true);
                }}
                className="w-full bg-[hsl(330,100%,50%)]/10 border-[hsl(330,100%,50%)]/30 text-[hsl(330,100%,50%)] hover:bg-[hsl(330,100%,50%)]/20"
              >
                Create Account Instead
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    </>
  );
}