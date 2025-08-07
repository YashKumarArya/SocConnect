import { motion } from "framer-motion";
import { Twitter, Linkedin, Github } from "lucide-react";

export default function Footer() {
  return (
    <footer className="py-16 px-6 border-t border-gray-800 relative bg-[hsl(220,15%,5%)]">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(330,100%,50%)] to-transparent"></div>
      <div className="container mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="md:col-span-2"
          >
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-[hsl(267,100%,67%)] to-[hsl(330,100%,50%)] rounded-3xl"></div>
              <span className="text-xl font-bold glow-text">Alpha</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              Transforming cybersecurity with intelligent AI agents that work around the clock to protect your organization from evolving threats.
            </p>
            <div className="flex space-x-4">
              <motion.a
                href="#"
                whileHover={{ scale: 1.1 }}
                className="w-10 h-10 bg-[hsl(0,0%,10%)]/50 border border-[hsl(330,100%,50%)]/30 rounded-lg flex items-center justify-center hover:bg-[hsl(330,100%,50%)]/20 transition-colors"
              >
                <Twitter className="w-4 h-4 text-[hsl(330,100%,50%)]" />
              </motion.a>
              <motion.a
                href="#"
                whileHover={{ scale: 1.1 }}
                className="w-10 h-10 bg-[hsl(0,0%,10%)]/50 border border-[hsl(330,100%,50%)]/30 rounded-lg flex items-center justify-center hover:bg-[hsl(330,100%,50%)]/20 transition-colors"
              >
                <Linkedin className="w-4 h-4 text-[hsl(330,100%,50%)]" />
              </motion.a>
              <motion.a
                href="#"
                whileHover={{ scale: 1.1 }}
                className="w-10 h-10 bg-[hsl(0,0%,10%)]/50 border border-[hsl(330,100%,50%)]/30 rounded-lg flex items-center justify-center hover:bg-[hsl(330,100%,50%)]/20 transition-colors"
              >
                <Github className="w-4 h-4 text-[hsl(330,100%,50%)]" />
              </motion.a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h4 className="font-semibold mb-4 text-[hsl(330,100%,50%)]">Features</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a href="#" className="hover:text-[hsl(330,100%,50%)] transition-colors">
                  AI Threat Detection
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[hsl(330,100%,50%)] transition-colors">
                  Automated Response
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[hsl(330,100%,50%)] transition-colors">
                  Real-time Analytics
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[hsl(330,100%,50%)] transition-colors">
                  Compliance Reports
                </a>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h4 className="font-semibold mb-4 text-[hsl(330,100%,50%)]">Resources</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a href="#" className="hover:text-[hsl(330,100%,50%)] transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[hsl(330,100%,50%)] transition-colors">
                  API Reference
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[hsl(330,100%,50%)] transition-colors">
                  Security Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[hsl(330,100%,50%)] transition-colors">
                  Support Center
                </a>
              </li>
            </ul>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center"
        >
          <p className="text-gray-400 text-sm">© 2025 Prophet Security. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-[hsl(330,100%,50%)] transition-colors text-sm">
              Privacy Policy
            </a>
            <a href="#" className="text-gray-400 hover:text-[hsl(330,100%,50%)] transition-colors text-sm">
              Terms of Service
            </a>
            <a href="#" className="text-gray-400 hover:text-[hsl(330,100%,50%)] transition-colors text-sm">
              Security
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
