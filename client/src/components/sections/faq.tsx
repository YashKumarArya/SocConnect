import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

export default function FAQ() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const faqs = [
    {
      question: "How quickly can I deploy Prophet Security?",
      answer:
        "Most customers are up and running within 24 hours. Our platform integrates seamlessly with existing security tools and requires minimal configuration.",
    },
    {
      question: "What types of threats can the AI agents detect?",
      answer:
        "Our AI agents detect a wide range of threats including malware, phishing, insider threats, data breaches, and advanced persistent threats (APTs). The system continuously learns and adapts to new threat patterns.",
    },
    {
      question: "How does Prophet Security handle false positives?",
      answer:
        "Our AI uses advanced machine learning algorithms to minimize false positives. The system learns from your environment and feedback, continuously improving accuracy over time.",
    },
    {
      question: "What compliance standards does Prophet Security support?",
      answer:
        "We support major compliance frameworks including SOC 2, ISO 27001, PCI DSS, HIPAA, and GDPR. Our platform provides automated compliance reporting and audit trails.",
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <section className="py-20 px-6 bg-[hsl(220,15%,5%)]">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold glow-text">Frequently Asked Questions</h2>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="border-b border-gray-800 last:border-b-0"
            >
              <button
                className="w-full text-left py-6 flex items-center justify-between focus:outline-none group"
                onClick={() => toggleFAQ(index)}
              >
                <span className="text-lg font-semibold group-hover:text-[hsl(330,100%,50%)] transition-colors">
                  {faq.question}
                </span>
                <motion.div
                  animate={{ rotate: openFAQ === index ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {openFAQ === index ? (
                    <Minus className="w-5 h-5 text-[hsl(330,100%,50%)]" />
                  ) : (
                    <Plus className="w-5 h-5 text-[hsl(330,100%,50%)]" />
                  )}
                </motion.div>
              </button>
              <AnimatePresence>
                {openFAQ === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="pb-6"
                  >
                    <p className="text-gray-300">{faq.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
