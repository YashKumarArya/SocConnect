
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Shield,
  Lock,
  CheckCircle2,
  Eye,
  EyeOff,
  Zap,
  AlertCircle,
} from "lucide-react";
import { useLocation } from "wouter";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginStep, setLoginStep] = useState(0); // 0: locked, 1: email entered, 2: password entered, 3: success
  const [showLaserGrid, setShowLaserGrid] = useState(true);
  const [showFirewall, setShowFirewall] = useState(true);
  const [gateOpen, setGateOpen] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setEmail("");
      setPassword("");
      setLoginStep(0);
      setShowLaserGrid(true);
      setShowFirewall(true);
      setGateOpen(false);
    }
  }, [open]);

  // Update barriers based on input progress
  useEffect(() => {
    if (email && email.includes("@")) {
      setLoginStep(1);
      setShowLaserGrid(false);
    } else {
      setLoginStep(0);
      setShowLaserGrid(true);
    }

    if (password && password.length >= 6) {
      setLoginStep(2);
      setShowFirewall(false);
    } else if (email && email.includes("@")) {
      setLoginStep(1);
      setShowFirewall(true);
    }
  }, [email, password]);

  const handleLogin = async () => {
    setIsLoading(true);
    
    // Simulate login process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setLoginStep(3);
    setGateOpen(true);
    
    // Close dialog and redirect to dashboard after successful animation
    setTimeout(() => {
      setIsLoading(false);
      onOpenChange(false);
      setLocation("/dashboard");
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[hsl(215,28%,5%)] border-[hsl(330,100%,50%)]/30 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold glow-text flex items-center gap-2">
            <Shield className="w-6 h-6 text-[hsl(330,100%,50%)]" />
            Access Control Vault
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Enter your credentials to access the secured digital environment.
          </DialogDescription>
        </DialogHeader>

        {/* DNA of Cyber Attack Animation */}
        <div className="relative h-40 mb-6 overflow-hidden rounded-lg bg-gradient-to-br from-[hsl(220,15%,5%)] to-[hsl(0,0%,8%)] border border-[hsl(330,100%,50%)]/20">
          {/* Attack Chain Background */}
          <div className="absolute inset-0 opacity-10">
            <div className="grid grid-cols-6 grid-rows-4 h-full">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="border border-[hsl(330,100%,50%)]/5" />
              ))}
            </div>
          </div>

          {/* Attack Stages */}
          <div className="absolute inset-0 flex items-center justify-between px-4">
            {[
              { id: 1, label: "Phishing", icon: "📧", color: "red", progress: loginStep >= 0 ? 100 : 0 },
              { id: 2, label: "Credential", icon: "🔑", color: "orange", progress: loginStep >= 1 ? 100 : 0 },
              { id: 3, label: "Lateral Move", icon: "🌐", color: "yellow", progress: loginStep >= 2 ? 100 : 0 },
              { id: 4, label: "Exfiltration", icon: "📤", color: "red", progress: loginStep >= 3 ? 100 : 0 }
            ].map((stage, index) => (
              <div key={stage.id} className="relative flex flex-col items-center">
                {/* Attack Stage */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0.3 }}
                  animate={{ 
                    scale: stage.progress > 0 ? 1 : 0.5,
                    opacity: stage.progress > 0 ? 1 : 0.3,
                    boxShadow: stage.progress > 0 ? `0 0 20px ${stage.color === 'red' ? '#ef4444' : stage.color === 'orange' ? '#f97316' : '#eab308'}` : 'none'
                  }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs ${
                    stage.progress > 0 
                      ? `border-${stage.color}-500 bg-${stage.color}-500/20` 
                      : 'border-gray-600 bg-gray-600/20'
                  }`}
                >
                  <span>{stage.icon}</span>
                </motion.div>
                
                {/* Stage Label */}
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: stage.progress > 0 ? 1 : 0.5, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.2 + 0.3 }}
                  className="text-xs text-gray-300 mt-1 text-center"
                >
                  {stage.label}
                </motion.div>

                {/* Connection Line */}
                {index < 3 && (
                  <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ 
                      scaleX: stage.progress > 0 ? 1 : 0,
                      opacity: stage.progress > 0 ? 1 : 0.3
                    }}
                    transition={{ duration: 0.8, delay: index * 0.2 + 0.4 }}
                    className="absolute top-4 left-8 w-8 h-0.5 bg-gradient-to-r from-red-500 to-orange-500 origin-left"
                  />
                )}

                {/* Countermeasure */}
                <AnimatePresence>
                  {stage.progress > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0, y: -20 }}
                      animate={{ opacity: 1, scale: 1, y: -25 }}
                      exit={{ opacity: 0, scale: 0, y: -20 }}
                      transition={{ duration: 0.5, delay: index * 0.2 + 0.6 }}
                      className="absolute top-0 bg-green-500/20 border border-green-500/50 rounded px-1 py-0.5 text-xs text-green-400"
                    >
                      {stage.id === 1 && "Email Blocked"}
                      {stage.id === 2 && "MFA Required"}
                      {stage.id === 3 && "Network Isolated"}
                      {stage.id === 4 && "Data Protected"}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Attack Flow Visualization */}
          <motion.div
            initial={{ pathLength: 0 }}
            animate={{ pathLength: loginStep >= 3 ? 1 : loginStep / 3 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <motion.path
                d="M 10 50 Q 30 30, 50 50 Q 70 70, 90 50"
                stroke="url(#attackGradient)"
                strokeWidth="0.5"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: loginStep / 3 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
              <defs>
                <linearGradient id="attackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="50%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#eab308" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
          {/* Success State - All Threats Neutralized */}
          <AnimatePresence>
            {gateOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0"
              >
                {/* Success Overlay */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-[hsl(330,100%,50%)]/20 to-blue-500/20 flex items-center justify-center"
                >
                  <div className="text-green-400 font-bold text-lg flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6" />
                    THREATS NEUTRALIZED
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Security Status Indicator */}
          <div className="absolute top-2 right-2">
            <motion.div
              animate={{ 
                backgroundColor: loginStep === 3 ? "#10b981" : loginStep >= 1 ? "#f59e0b" : "#ef4444",
                boxShadow: loginStep === 3 ? "0 0 10px rgba(16, 185, 129, 0.6)" : loginStep >= 1 ? "0 0 10px rgba(245, 158, 11, 0.6)" : "0 0 10px rgba(239, 68, 68, 0.6)"
              }}
              className="w-3 h-3 rounded-full"
            />
          </div>
        </div>

        {/* Login Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="agent@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[hsl(0,0%,8%)] border-[hsl(330,100%,50%)]/30 focus:border-[hsl(330,100%,50%)]"
              disabled={isLoading || gateOpen}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[hsl(0,0%,8%)] border-[hsl(330,100%,50%)]/30 focus:border-[hsl(330,100%,50%)] pr-10"
                disabled={isLoading || gateOpen}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading || gateOpen}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
          </div>

          {/* Security Progress Indicator */}
          <div className="flex items-center gap-2 text-sm">
            <div className="flex gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    i < loginStep ? "bg-[hsl(330,100%,50%)]" : "bg-gray-600"
                  }`}
                />
              ))}
            </div>
            <span className="text-gray-400">
              {loginStep === 0 && "Identify attack vector: Phishing detected"}
              {loginStep === 1 && "Credentials compromised: Deploy MFA"}
              {loginStep === 2 && "Lateral movement blocked: Isolate network"}
              {loginStep === 3 && "All threats neutralized: Access secure"}
            </span>
          </div>

          <Button
            onClick={handleLogin}
            disabled={!email || !password || password.length < 6 || isLoading || gateOpen}
            className="w-full bg-gradient-to-r from-[hsl(220,15%,5%)] to-[hsl(330,100%,50%)] hover:opacity-90 disabled:opacity-50"
            size="lg"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
                Authenticating...
              </div>
            ) : gateOpen ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Access Granted
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Access Vault
              </div>
            )}
          </Button>

          <div className="text-center text-sm text-gray-400">
            Don't have access credentials?{" "}
            <Button variant="link" className="p-0 h-auto text-[hsl(330,100%,50%)] hover:text-[hsl(330,100%,60%)]">
              Request Access
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
