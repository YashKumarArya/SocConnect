import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Shield, Eye, EyeOff, LogIn } from "lucide-react";
import { useLocation } from "wouter";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const demoUsers = [
    { email: "john.smith@company.com", password: "password123", role: "Analyst", name: "John Smith" },
    { email: "sarah.johnson@company.com", password: "admin123", role: "Admin", name: "Sarah Johnson" },
    { email: "mike.wilson@company.com", password: "password123", role: "Analyst", name: "Mike Wilson" }
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await api.login({ email, password });
      // Redirect to dashboard on success
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = (user: typeof demoUsers[0]) => {
    setEmail(user.email);
    setPassword(user.password);
  };

  return (
    <div className="min-h-screen bg-[hsl(215,28%,5%)] text-white font-['Inter'] flex items-center justify-center p-6">
      {/* Background Effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(330,100%,50%)]/10 via-transparent to-[hsl(267,100%,67%)]/10"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[hsl(330,100%,50%)]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[hsl(267,100%,67%)]/5 rounded-full blur-3xl"></div>
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-[hsl(330,100%,50%)] to-[hsl(267,100%,67%)] rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">Alpha SOC</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Security Operations Center</h1>
          <p className="text-gray-400">Sign in to access your cybersecurity dashboard</p>
        </div>

        {/* Login Form */}
        <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[hsl(0,0%,10%)]/60 border-[hsl(330,100%,50%)]/20 text-white placeholder:text-gray-400"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-[hsl(0,0%,10%)]/60 border-[hsl(330,100%,50%)]/20 text-white placeholder:text-gray-400 pr-10"
                    placeholder="Enter your password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[hsl(330,100%,50%)] hover:bg-[hsl(330,100%,60%)] text-white"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Accounts */}
        <Card className="mt-6 bg-[hsl(0,0%,8%)]/60 border-[hsl(330,100%,50%)]/10">
          <CardHeader>
            <CardTitle className="text-sm text-gray-300">Demo Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {demoUsers.map((user, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-[hsl(0,0%,6%)]/60 rounded-lg border border-[hsl(330,100%,50%)]/10 cursor-pointer hover:bg-[hsl(0,0%,10%)]/60 transition-colors"
                  onClick={() => quickLogin(user)}
                >
                  <div>
                    <div className="text-white font-medium">{user.name}</div>
                    <div className="text-xs text-gray-400">{user.email}</div>
                  </div>
                  <Badge className={user.role === 'Admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}>
                    {user.role}
                  </Badge>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">Click any account to auto-fill credentials</p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            Alpha SOC Platform • Secure • Real-time Threat Detection
          </p>
        </div>
      </motion.div>
    </div>
  );
}