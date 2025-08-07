import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Testimonials() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      quote: "Prophet Security reduced our mean time to response by 80%. The AI agents handle routine incidents while our team focuses on strategic threats.",
      name: "Sarah Chen",
      title: "CISO, TechCorp",
    },
    {
      quote: "The platform's ability to automatically correlate threats across our entire security stack is game-changing. We catch threats we would have missed.",
      name: "Marcus Rodriguez",
      title: "Security Director, FinanceFirst",
    },
    {
      quote: "Implementation was seamless. Within 24 hours, we had AI agents actively monitoring and responding to security events across our infrastructure.",
      name: "Emily Watson",
      title: "Head of Security, CloudScale",
    },
  ];

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-20 px-6 bg-[hsl(220,15%,5%)]">
      <div className="container mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4 glow-text">What Security Leaders Say</h2>
        </motion.div>
        
        <div className="max-w-6xl mx-auto">
          {/* Desktop View - All testimonials */}
          <div className="hidden md:grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="testimonial-card rounded-2xl p-8 backdrop-blur-sm hover:border-[hsl(330,100%,50%)]/40 transition-colors"
              >
                <div className="mb-6">
                  <Quote className="w-8 h-8 text-[hsl(330,100%,50%)]" />
                </div>
                <p className="text-gray-300 mb-6">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-[hsl(267,100%,67%)] to-[hsl(330,100%,50%)] rounded-full mr-4"></div>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-gray-400">{testimonial.title}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Mobile View - Carousel */}
          <div className="md:hidden">
            <div className="relative overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonial}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.5 }}
                  className="testimonial-card rounded-2xl p-8 backdrop-blur-sm"
                >
                  <div className="mb-6">
                    <Quote className="w-8 h-8 text-[hsl(330,100%,50%)]" />
                  </div>
                  <p className="text-gray-300 mb-6">
                    "{testimonials[currentTestimonial].quote}"
                  </p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-[hsl(267,100%,67%)] to-[hsl(330,100%,50%)] rounded-full mr-4"></div>
                    <div>
                      <p className="font-semibold">{testimonials[currentTestimonial].name}</p>
                      <p className="text-sm text-gray-400">{testimonials[currentTestimonial].title}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          
          {/* Carousel Buttons */}
          <div className="flex justify-center mt-8 space-x-4">
            <Button 
              variant="outline" 
              size="icon"
              onClick={prevTestimonial}
              className="bg-[hsl(0,0%,10%)]/50 border-[hsl(330,100%,50%)]/30 hover:bg-[hsl(330,100%,50%)]/20"
            >
              <ChevronLeft className="w-4 h-4 text-[hsl(330,100%,50%)]" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={nextTestimonial}
              className="bg-[hsl(0,0%,10%)]/50 border-[hsl(330,100%,50%)]/30 hover:bg-[hsl(330,100%,50%)]/20"
            >
              <ChevronRight className="w-4 h-4 text-[hsl(330,100%,50%)]" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
