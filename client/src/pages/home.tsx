import { useState } from "react";
import { Button } from "@/components/ui/button";
import Header from "@/components/sections/header";
import Hero from "@/components/sections/hero";
import TrustedBy from "@/components/sections/trusted-by";
import DashboardShowcase from "@/components/sections/dashboard-showcase";
import Integrations from "@/components/sections/integrations";
import Testimonials from "@/components/sections/testimonials";
import FAQ from "@/components/sections/faq";
import Footer from "@/components/sections/footer";
import DemoRequestDialog from "@/components/demo-request-dialog";
import LoginDialog from "@/components/login-dialog";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();
  const [showDemoDialog, setShowDemoDialog] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  return (
    <div className="min-h-screen bg-[hsl(220,15%,5%)] text-white">
      <DemoRequestDialog open={showDemoDialog} onOpenChange={setShowDemoDialog} />
      <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
      <Header onRequestDemo={() => setShowDemoDialog(true)} onLogin={() => setLocation("/login")} />
      <Hero onRequestDemo={() => setShowDemoDialog(true)} />
      <TrustedBy />
      <DashboardShowcase />
      <div className="py-20 px-6 relative">
        {/* If your .gradient-glow uses old colors, consider updating it to a pink/navy glow */}
        <div className="absolute inset-0 gradient-glow"></div>
        <div className="container mx-auto text-center relative z-10">
          <button
            onClick={() => setShowDemoDialog(true)}
            className="bg-gradient-to-r from-[hsl(220,15%,5%)] to-[hsl(330,100%,50%)] text-white px-8 py-4 rounded-lg font-semibold text-lg glow-button animate-pulse-glow hover:opacity-90"
          >
            Request a Demo
          </button>
        </div>
      </div>
      <Integrations />
      <Testimonials />
      <FAQ />
      <Footer />
    </div>
  );
}