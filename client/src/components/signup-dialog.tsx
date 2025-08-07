
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
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
import { Loader2, Shield, Lock, CheckCircle2, AlertCircle } from "lucide-react";

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  company: z.string().min(1, "Company name is required"),
  jobTitle: z.string().optional(),
  phoneNumber: z.string().optional(),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain uppercase letter")
    .regex(/[a-z]/, "Password must contain lowercase letter")
    .regex(/[0-9]/, "Password must contain a number")
    .regex(/[^A-Za-z0-9]/, "Password must contain special character"),
  confirmPassword: z.string(),
  message: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

interface SignupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SignupDialog({ open, onOpenChange }: SignupDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [passwordScore, setPasswordScore] = useState(0);
  const [showBarriers, setShowBarriers] = useState(true);

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      jobTitle: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      message: "",
    },
  });

  const password = form.watch("password");

  useEffect(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    setPasswordScore(score);
    setShowBarriers(score < 5);
  }, [password]);

  const submitSignup = useMutation({
    mutationFn: async (data: SignupForm) => {
      const { confirmPassword, ...submitData } = data;
      return await apiRequest("POST", "/api/signup", submitData);
    },
    onSuccess: () => {
      toast({
        title: "Account created successfully!",
        description: "Welcome to Prophet Security. You can now access your dashboard.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error creating account",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SignupForm) => {
    submitSignup.mutate(data);
  };

  const passwordCriteria = [
    { test: (p: string) => p.length >= 8, label: "8+ characters" },
    { test: (p: string) => /[A-Z]/.test(p), label: "Uppercase letter" },
    { test: (p: string) => /[a-z]/.test(p), label: "Lowercase letter" },
    { test: (p: string) => /[0-9]/.test(p), label: "Number" },
    { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: "Special character" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-[hsl(215,28%,5%)] border-[hsl(170,100%,48%)]/30 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold glow-text flex items-center gap-2">
            <Shield className="w-6 h-6 text-[hsl(170,100%,48%)]" />
            Join Prophet Security
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Create your account to access our advanced AI-powered SOC platform.
          </DialogDescription>
        </DialogHeader>

        {/* DNA of Cyber Attack - Advanced Version */}
        <div className="relative h-24 mb-4 overflow-hidden rounded-lg bg-[hsl(0,0%,10%)]/50 border border-[hsl(170,100%,48%)]/20">
          {/* Background DNA Helix Pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <motion.path
                d="M 0 30 Q 25 10, 50 30 Q 75 50, 100 30"
                stroke="url(#helixGradient1)"
                strokeWidth="0.5"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
              <motion.path
                d="M 0 70 Q 25 50, 50 70 Q 75 90, 100 70"
                stroke="url(#helixGradient2)"
                strokeWidth="0.5"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 1 }}
              />
              <defs>
                <linearGradient id="helixGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
                <linearGradient id="helixGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06d6a0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Attack Stages Timeline */}
          <div className="absolute inset-0 flex items-center justify-between px-3">
            {[
              { id: 1, label: "Recon", icon: "🔍", threat: "Social Engineering", countermeasure: "Awareness Training" },
              { id: 2, label: "Initial", icon: "🎯", threat: "Phishing Email", countermeasure: "Email Security" },
              { id: 3, label: "Execution", icon: "⚡", threat: "Malware Deployed", countermeasure: "EDR Detection" },
              { id: 4, label: "Persistence", icon: "🔗", threat: "Backdoor Created", countermeasure: "Behavior Analysis" },
              { id: 5, label: "Escalation", icon: "⬆️", threat: "Privilege Escalation", countermeasure: "Zero Trust" },
              { id: 6, label: "Exfiltration", icon: "📤", threat: "Data Theft", countermeasure: "DLP Protection" }
            ].map((stage, index) => {
              const isActive = passwordScore > index;
              return (
                <div key={stage.id} className="relative flex flex-col items-center">
                  {/* Attack Stage Circle */}
                  <motion.div
                    initial={{ scale: 0.3, opacity: 0.2 }}
                    animate={{ 
                      scale: isActive ? 1 : 0.3,
                      opacity: isActive ? 1 : 0.2,
                      boxShadow: isActive ? `0 0 15px rgba(239, 68, 68, 0.6)` : 'none'
                    }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${
                      isActive 
                        ? 'border-red-500 bg-red-500/20 text-red-400' 
                        : 'border-gray-600 bg-gray-600/20 text-gray-500'
                    }`}
                  >
                    <span className="text-xs">{stage.icon}</span>
                  </motion.div>

                  {/* Connection DNA Strand */}
                  {index < 5 && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: isActive ? 1 : 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 + 0.3 }}
                      className="absolute top-3 left-6 w-4 h-0.5 bg-gradient-to-r from-red-500 to-orange-500 origin-left"
                    />
                  )}

                  {/* Threat Label */}
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: isActive ? 1 : 0.3, y: 0 }}
                    className="absolute -top-6 text-xs text-red-400 whitespace-nowrap"
                    style={{ fontSize: '10px' }}
                  >
                    {stage.threat}
                  </motion.div>

                  {/* Countermeasure Animation */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 8 }}
                        exit={{ opacity: 0, scale: 0, y: 10 }}
                        transition={{ duration: 0.4, delay: index * 0.1 + 0.5 }}
                        className="absolute top-8 bg-green-500/20 border border-green-500/50 rounded px-1 py-0.5 text-green-400 whitespace-nowrap"
                        style={{ fontSize: '9px' }}
                      >
                        ✓ {stage.countermeasure}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Progress Indicator */}
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: `${(passwordScore / 6) * 100}%` }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-green-500"
          />

          {/* Complete Security Animation */}
          <AnimatePresence>
            {passwordScore >= 5 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-green-500/20 to-[hsl(170,100%,48%)]/20 backdrop-blur-sm"
              >
                <div className="text-xs font-bold text-[hsl(170,100%,48%)] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  SECURITY CHAIN COMPLETE
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Password *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="••••••••" 
                        type="password"
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
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Confirm Password *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="••••••••" 
                        type="password"
                        {...field} 
                        className="bg-[hsl(0,0%,10%)]/50 border-[hsl(170,100%,48%)]/30 text-white placeholder:text-gray-400 focus:border-[hsl(170,100%,48%)]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Password Requirements */}
            {password && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-[hsl(0,0%,10%)]/30 rounded-lg p-3 border border-[hsl(170,100%,48%)]/20"
              >
                <div className="text-sm text-gray-300 mb-2">Password Requirements:</div>
                <div className="grid grid-cols-2 gap-2">
                  {passwordCriteria.map((criteria, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center gap-2 text-xs ${
                        criteria.test(password) ? "text-green-400" : "text-gray-500"
                      }`}
                    >
                      {criteria.test(password) ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <AlertCircle className="w-3 h-3" />
                      )}
                      {criteria.label}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Message</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell us about your security requirements..." 
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
                disabled={submitSignup.isPending || showBarriers}
                className="flex-1"
              >
                {submitSignup.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Create Account
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
