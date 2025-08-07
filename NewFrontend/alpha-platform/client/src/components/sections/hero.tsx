
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, CheckCircle, Zap, Brain, Eye, Mail, Laptop, Server, Database, Globe } from "lucide-react";
import { useLocation } from "wouter";
import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';

gsap.registerPlugin(TextPlugin);

interface HeroProps {
  onRequestDemo: () => void;
}

export default function Hero({ onRequestDemo }: HeroProps) {
  const [, setLocation] = useLocation();
  const rightColumnRef = useRef(null);
  const titleRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [attackActive, setAttackActive] = useState(false);

  const attackSteps = [
    { id: "phishing", label: "Phishing Email", icon: Mail, position: { x: 10, y: 20 } },
    { id: "endpoint", label: "Endpoint Compromise", icon: Laptop, position: { x: 30, y: 40 } },
    { id: "lateral", label: "Lateral Movement", icon: Server, position: { x: 60, y: 30 } },
    { id: "data", label: "Data Exfiltration", icon: Database, position: { x: 85, y: 50 } },
    { id: "external", label: "External C&C", icon: Globe, position: { x: 95, y: 10 } }
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Writing animation for main title
      gsap.to(titleRef.current, {
        duration: 2,
        text: "Agentic AI SOC Platform",
        ease: "none",
        delay: 0.5
      });

      // Spider web connections animation
      gsap.set(".web-line", { scaleX: 0, transformOrigin: "left center" });
      gsap.to(".web-line", {
        scaleX: 1,
        duration: 0.8,
        stagger: 0.2,
        ease: "power2.out",
        delay: 2
      });

      // Attack propagation animation
      const attackInterval = setInterval(() => {
        setAttackActive(true);
        setCurrentStep(0);
        
        const stepInterval = setInterval(() => {
          setCurrentStep(prev => {
            if (prev >= attackSteps.length - 1) {
              clearInterval(stepInterval);
              setTimeout(() => setAttackActive(false), 1000);
              return 0;
            }
            return prev + 1;
          });
        }, 800);
      }, 6000);

      return () => clearInterval(attackInterval);
    }, rightColumnRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="pt-24 pb-16 px-4 relative overflow-hidden min-h-screen flex items-center">
      {/* Subtle background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(220,15%,3%)] via-[hsl(220,15%,5%)] to-[hsl(267,100%,67%)]/3"></div>
      </div>

      <div className="container mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center max-w-7xl mx-auto">
          
          {/* Left Column - Clean Description Panel */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6 lg:pr-8"
          >
            {/* Compact Header */}
            <div>
              <motion.h1 
                ref={titleRef}
                className="text-4xl lg:text-5xl font-bold leading-tight mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <span className="glow-text bg-gradient-to-r from-white to-[hsl(330,100%,50%)] bg-clip-text text-transparent"></span>
              </motion.h1>
              
              <motion.p 
                className="text-lg text-gray-300 mb-6 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 0.6 }}
              >
                Advanced AI agents detect, analyze, and neutralize cyber threats in real-time with zero human intervention.
              </motion.p>
            </div>

            {/* Compact Feature List */}
            <motion.div 
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.6 }}
            >
              {[
                "🧠 AI-powered threat correlation across all vectors",
                "⚡ Sub-second response time with automated remediation", 
                "🔍 Deep behavioral analysis and anomaly detection",
                "📊 Predictive threat intelligence and risk scoring"
              ].map((feature, index) => (
                <div key={index} className="flex items-center text-sm text-gray-200">
                  <span className="mr-3">{feature.split(' ')[0]}</span>
                  <span>{feature.substring(feature.indexOf(' ') + 1)}</span>
                </div>
              ))}
            </motion.div>

            {/* Compact CTA */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-3 pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.1, duration: 0.6 }}
            >
              <Button
                variant="glow"
                size="lg"
                className="bg-gradient-to-r from-[hsl(330,100%,50%)] to-[hsl(267,100%,67%)] text-white hover:opacity-90 transition-all duration-300 text-sm"
                onClick={onRequestDemo}
              >
                <Zap className="w-4 h-4 mr-2" />
                Request Demo
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-[hsl(330,100%,50%)]/30 text-[hsl(330,100%,50%)] hover:bg-[hsl(330,100%,50%)]/10 text-sm"
                onClick={() => setLocation("/dashboard")}
              >
                <Brain className="w-4 h-4 mr-2" />
                Live Dashboard
              </Button>
            </motion.div>

            {/* Compact Stats */}
            <motion.div 
              className="grid grid-cols-3 gap-4 pt-6 border-t border-[hsl(330,100%,50%)]/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.4 }}
            >
              <div className="text-center">
                <div className="text-xl font-bold text-[hsl(330,100%,50%)]">99.7%</div>
                <div className="text-xs text-gray-400">Threat Detection</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-[hsl(267,100%,67%)]">0.3s</div>
                <div className="text-xs text-gray-400">Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-400">Zero</div>
                <div className="text-xs text-gray-400">False Positives</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Interactive Spider Web Attack Visualization */}
          <div ref={rightColumnRef} className="relative">
            <div className="bg-gradient-to-br from-[hsl(220,15%,8%)] to-[hsl(220,15%,12%)] rounded-2xl p-6 border border-[hsl(330,100%,50%)]/20 relative overflow-hidden h-96">
              
              {/* Spider Web Background */}
              <div className="absolute inset-0">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                  {/* Web structure lines */}
                  {attackSteps.map((step, index) => (
                    <g key={`web-${index}`}>
                      {index < attackSteps.length - 1 && (
                        <line
                          className="web-line"
                          x1={step.position.x}
                          y1={step.position.y}
                          x2={attackSteps[index + 1].position.x}
                          y2={attackSteps[index + 1].position.y}
                          stroke={attackActive && currentStep >= index ? "url(#attackGradient)" : "rgba(255,20,147,0.2)"}
                          strokeWidth="0.5"
                          strokeDasharray={attackActive && currentStep >= index ? "0" : "2,2"}
                        />
                      )}
                      {/* Radial connections for spider web effect */}
                      {index > 0 && (
                        <line
                          className="web-line"
                          x1="50"
                          y1="50"
                          x2={step.position.x}
                          y2={step.position.y}
                          stroke="rgba(138,43,226,0.1)"
                          strokeWidth="0.3"
                        />
                      )}
                    </g>
                  ))}
                  
                  <defs>
                    <linearGradient id="attackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ff1493" />
                      <stop offset="100%" stopColor="#8a2be2" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Attack Node Points */}
              <div className="absolute inset-0">
                {attackSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = attackActive && currentStep >= index;
                  const isCurrent = attackActive && currentStep === index;
                  
                  return (
                    <div
                      key={step.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2"
                      style={{ 
                        left: `${step.position.x}%`, 
                        top: `${step.position.y}%` 
                      }}
                    >
                      <motion.div
                        className={`relative`}
                        animate={{
                          scale: isCurrent ? [1, 1.3, 1] : isActive ? 1.1 : 1,
                        }}
                        transition={{ duration: 0.6, repeat: isCurrent ? Infinity : 0 }}
                      >
                        {/* Node glow */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-500 ${
                          isActive 
                            ? 'bg-red-500/20 border-red-400 shadow-lg shadow-red-400/50' 
                            : 'bg-[hsl(220,15%,15%)] border-[hsl(330,100%,50%)]/20'
                        }`}>
                          <Icon className={`w-4 h-4 transition-colors duration-500 ${
                            isActive ? 'text-red-300' : 'text-gray-400'
                          }`} />
                        </div>
                        
                        {/* Node label */}
                        <div className={`absolute top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap transition-all duration-500 ${
                          isActive ? 'opacity-100' : 'opacity-60'
                        }`}>
                          <div className="text-xs font-medium text-center">
                            <div className={`${isActive ? 'text-red-300' : 'text-gray-300'}`}>
                              {step.label}
                            </div>
                          </div>
                        </div>

                        {/* Attack pulse for current step */}
                        {isCurrent && (
                          <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-75"></div>
                        )}
                      </motion.div>
                    </div>
                  );
                })}
              </div>

              {/* AI Defense Center */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <motion.div
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-[hsl(330,100%,50%)] to-[hsl(267,100%,67%)] flex items-center justify-center relative"
                  animate={{
                    boxShadow: attackActive 
                      ? ["0 0 20px rgba(255,20,147,0.5)", "0 0 40px rgba(255,20,147,0.8)", "0 0 20px rgba(255,20,147,0.5)"]
                      : "0 0 20px rgba(255,20,147,0.3)"
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Shield className="w-8 h-8 text-white" />
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                    <div className="text-xs font-semibold text-[hsl(330,100%,50%)] whitespace-nowrap">
                      AI Defense Core
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Real-time status */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-[hsl(220,15%,10%)]/80 rounded-lg p-3 border border-[hsl(330,100%,50%)]/10">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300">
                      {attackActive ? `Analyzing: ${attackSteps[currentStep]?.label}` : "Monitoring Network"}
                    </span>
                    <div className={`flex items-center space-x-2 ${attackActive ? 'text-red-400' : 'text-green-400'}`}>
                      <div className={`w-2 h-2 rounded-full ${attackActive ? 'bg-red-400' : 'bg-green-400'} animate-pulse`}></div>
                      <span className="font-medium">{attackActive ? 'Threat Active' : 'Secure'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
