import { motion } from "framer-motion";
import { Brain, Github, Cloud, Shield, Database, Zap } from "lucide-react";

export default function Integrations() {
  const integrations = [
    { icon: <Cloud className="w-6 h-6 text-[hsl(330,100%,50%)]" /> },
    { icon: <Shield className="w-6 h-6 text-[hsl(267,100%,67%)]" /> },
    { icon: <Database className="w-6 h-6 text-[hsl(0,0%,90%)]" /> },
    { icon: <Zap className="w-6 h-6 text-[hsl(330,100%,50%)]" /> },
    { icon: <Github className="w-6 h-6 text-gray-300" /> },
    { icon: <Cloud className="w-6 h-6 text-[hsl(267,100%,67%)]" /> },
  ];

  return (
    <section className="min-h-screen py-20 px-6 bg-[hsl(220,15%,5%)] flex items-center justify-center">
  <div className="flex flex-col items-center text-center">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4 glow-text">Integrations That Simply Work</h2>
          <p className="text-xl text-gray-300">Connect with your existing security stack in minutes</p>
        </motion.div>

        {/* Icons Circle */}
        <div className="relative w-96 h-96 flex items-center justify-center mx-auto">
          {/* Central Brain Icon */}
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            whileInView={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="absolute z-10"
            style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
          >
            <div className="w-20 h-20 bg-gradient-to-r from-[hsl(220,15%,5%)] to-[hsl(330,100%,50%)] rounded-full flex items-center justify-center glow-button">
              <Brain className="w-8 h-8 text-white" />
            </div>
          </motion.div>

          {/* Surrounding Integration Icons in a Circle */}
          {integrations.map((integration, index) => {
            const angle = (index / integrations.length) * 2 * Math.PI;
            const radius = 160; // Adjust distance from center
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                viewport={{ once: true }}
                style={{
                  position: "absolute",
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div className="w-16 h-16 bg-[hsl(220,15%,10%)]/80 rounded-lg border border-[hsl(330,100%,50%)]/30 flex items-center justify-center hover:border-[hsl(330,100%,50%)]/60 hover:shadow-[0_0_12px_hsla(330,100%,50%,0.35)] transition-all">
                  {integration.icon}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
