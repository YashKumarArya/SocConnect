
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { gsap } from "gsap";
import { motion } from "framer-motion";
import { TextPlugin } from "gsap/TextPlugin";
import { useLocation } from "wouter";
import LoginDialog from "@/components/login-dialog";
import React, { useEffect, useRef, useState } from "react";

gsap.registerPlugin(TextPlugin);

interface HeaderProps {
  onRequestDemo: () => void;
}

export default function Header({ onRequestDemo }: HeaderProps) {
  const [, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDemoRequest, setShowDemoRequest] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const logoTextRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header slide down animation
      gsap.fromTo(headerRef.current,
        { y: -100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
      );

      // Logo writing animation
      gsap.to(logoTextRef.current, {
        duration: 1.5,
        text: "Alpha SOC",
        ease: "none",
        delay: 0.5
      });

      // Logo glow pulse (without rotation)
      gsap.to(logoRef.current?.querySelector('.logo-glow'), {
        scale: 1.1,
        opacity: 0.8,
        repeat: -1,
        yoyo: true,
        duration: 2,
        ease: "power2.inOut"
      });

    }, headerRef);

    return () => ctx.revert();
  }, []);

  const onCloseDemoRequest = () => {
    setShowDemoRequest(false);
  };

  return (
    <motion.header 
      ref={headerRef}
      className="fixed top-0 w-full z-50 bg-[hsl(220,15%,5%)]/95 backdrop-blur-lg border-b border-[hsl(330,100%,50%)]/20"
    >
      <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
        {/* Enhanced Logo */}
        <div ref={logoRef} className="flex items-center space-x-3 cursor-pointer" onClick={() => setLocation("/")}>
          <div className="relative">
            <div className="logo-glow w-10 h-10 bg-gradient-to-br from-[hsl(330,100%,50%)] to-[hsl(267,100%,67%)] rounded-lg"></div>
            <div className="absolute inset-0 w-10 h-10 bg-gradient-to-br from-[hsl(330,100%,50%)] to-[hsl(267,100%,67%)] rounded-lg blur-sm opacity-50"></div>
          </div>
          <span ref={logoTextRef} className="text-2xl font-bold text-white glow-text"></span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <motion.a 
            href="#platform" 
            className="text-gray-300 hover:text-[hsl(330,100%,50%)] transition-all duration-300 font-medium"
            whileHover={{ scale: 1.05 }}
          >
            Platform
          </motion.a>
          <motion.a 
            href="#solutions" 
            className="text-gray-300 hover:text-[hsl(330,100%,50%)] transition-all duration-300 font-medium"
            whileHover={{ scale: 1.05 }}
          >
            Solutions
          </motion.a>
          <motion.a 
            href="#resources" 
            className="text-gray-300 hover:text-[hsl(330,100%,50%)] transition-all duration-300 font-medium"
            whileHover={{ scale: 1.05 }}
          >
            Resources
          </motion.a>
          <motion.a 
            href="#company" 
            className="text-gray-300 hover:text-[hsl(330,100%,50%)] transition-all duration-300 font-medium"
            whileHover={{ scale: 1.05 }}
          >
            Company
          </motion.a>
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          <Button 
            variant="ghost"
            className="text-[hsl(330,100%,50%)] hover:bg-[hsl(330,100%,50%)]/10 transition-all duration-300"
            onClick={() => setShowLoginDialog(true)}
          >
            Login
          </Button>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="glow" 
              className="bg-gradient-to-r from-[hsl(330,100%,50%)] to-[hsl(267,100%,67%)] text-white hover:opacity-90 transition-all duration-300"
              onClick={onRequestDemo}
            >
              Request Demo
            </Button>
          </motion.div>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden text-white"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </nav>

      {/* Enhanced Mobile Menu */}
      {isMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden bg-[hsl(220,15%,5%)]/98 backdrop-blur-lg border-t border-[hsl(330,100%,50%)]/20"
        >
          <div className="px-6 py-6 space-y-6">
            <motion.a 
              href="#platform" 
              className="block hover:text-[hsl(330,100%,50%)] transition-colors text-lg font-medium"
              whileHover={{ x: 10 }}
            >
              Platform
            </motion.a>
            <motion.a 
              href="#solutions" 
              className="block hover:text-[hsl(330,100%,50%)] transition-colors text-lg font-medium"
              whileHover={{ x: 10 }}
            >
              Solutions
            </motion.a>
            <motion.a 
              href="#resources" 
              className="block hover:text-[hsl(330,100%,50%)] transition-colors text-lg font-medium"
              whileHover={{ x: 10 }}
            >
              Resources
            </motion.a>
            <motion.a 
              href="#company" 
              className="block hover:text-[hsl(330,100%,50%)] transition-colors text-lg font-medium"
              whileHover={{ x: 10 }}
            >
              Company
            </motion.a>
            <div className="space-y-3 pt-4">
              <Button 
                variant="outline"
                size="lg" 
                className="w-full border-[hsl(330,100%,50%)]/30 text-[hsl(330,100%,50%)] hover:bg-[hsl(330,100%,50%)]/10"
                onClick={() => setShowLoginDialog(true)}
              >
                Login
              </Button>
              <Button 
                variant="glow" 
                size="lg" 
                className="w-full bg-gradient-to-r from-[hsl(330,100%,50%)] to-[hsl(267,100%,67%)] text-white hover:opacity-90"
                onClick={onRequestDemo}
              >
                Request Demo
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Login Dialog */}
      <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
    </motion.header>
  );
}
