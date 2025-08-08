import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home, ArrowLeft, Shield } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[hsl(215,28%,5%)] text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md mx-4"
      >
        <Card className="bg-[hsl(0,0%,8%)]/80 border-[hsl(330,100%,50%)]/20">
          <CardContent className="pt-6 text-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col items-center mb-6"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-[hsl(330,100%,50%)] to-[hsl(267,100%,67%)] rounded-full flex items-center justify-center mb-4 glow-button">
                <AlertCircle className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2 glow-text">404</h1>
              <h2 className="text-xl font-semibold text-gray-300">Page Not Found</h2>
            </motion.div>

            <p className="text-sm text-gray-400 mb-6">
              The security module you're looking for doesn't exist in our SOC platform.
            </p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-3"
            >
              <Button 
                onClick={() => setLocation("/dashboard")}
                className="w-full bg-[hsl(330,100%,50%)] hover:bg-[hsl(330,100%,60%)] text-white"
              >
                <Shield className="w-4 h-4 mr-2" />
                Return to SOC Dashboard
              </Button>
              <Button 
                variant="outline"
                onClick={() => setLocation("/")}
                className="w-full border-[hsl(330,100%,50%)]/20 text-[hsl(330,100%,50%)] hover:bg-[hsl(330,100%,50%)]/10"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Home
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-6 pt-4 border-t border-[hsl(330,100%,50%)]/20"
            >
              <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Alpha SOC Platform - All Systems Operational</span>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}