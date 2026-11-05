'use client';

import { useState, useEffect } from "react";
import { HelpCircle, Github, FileCode, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "How does food label extraction work?",
    a: "When you upload or snap a food packaging photo, our vision engine transcribes ingredients, allergen advice, and nutrition tables into structured data. It breaks down compound ingredients and groups nutrients by serving and per 100g."
  },
  {
    q: "What is the NOVA classification standard?",
    a: "The NOVA standard was developed by researchers at the University of Sao Paulo. It categorizes foods into four distinct groups: Group 1 (Unprocessed/Minimally Processed Whole Foods), Group 2 (Culinary Ingredients like oils and salt), Group 3 (Processed Foods like cheeses and canned goods), and Group 4 (Ultra-Processed Formulations containing industrial additives, emulsifiers, and synthetic flavorings)."
  },
  {
    q: "Is my personal food scan data private?",
    a: "Yes. Your scan history is saved directly on your local device (in browser localStorage or mobile secure storage). EatInformed does not sell your scan records or build commercial profiles from your dietary habits."
  },
  {
    q: "Is EatInformed completely free to use?",
    a: "Yes. EatInformed is 100% free with no subscription tiers, no paywalls, and no third-party advertisements."
  },
  {
    q: "Can I use EatInformed on my Android phone?",
    a: "Yes. In addition to the web application, we provide an Android application built with React Native and Expo that supports native camera label framing, gallery selection, and offline history."
  }
];

export default function SupportPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // Auto-cycle through FAQ items smoothly every 30 seconds to showcase features
  useEffect(() => {
    const timer = setInterval(() => {
      setOpenIndex((prev) => (prev === null ? 0 : (prev + 1) % faqs.length));
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background pt-16 md:pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-3 mb-14"
        >
          <h1 className="text-4xl sm:text-5xl font-semibold text-foreground tracking-tight">
            Support & Community
          </h1>
          <p className="text-base text-muted-foreground max-w-md mx-auto">
            Find answers to common questions or reach out to our open-source contributors on GitHub.
          </p>
        </motion.div>

        {/* Real community support channels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-14 text-left">
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-foreground">
                <Github className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">GitHub Issues</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Report a scanning error, suggest improvements for specific food categories, or track our roadmap.
              </p>
            </div>
            <div className="pt-5">
              <a
                href="https://github.com/amitdevx/eatinformed/issues"
                target="_blank"
                rel="noreferrer"
                className="w-full inline-block"
              >
                <Button variant="outline" className="w-full rounded-full text-xs font-semibold">
                  Open an Issue on GitHub
                </Button>
              </a>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-foreground">
                <FileCode className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Open Source Codebase</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Inspect the vision parsing prompts, check our benchmarks, or run the Next.js server locally.
              </p>
            </div>
            <div className="pt-5">
              <a
                href="https://github.com/amitdevx/eatinformed"
                target="_blank"
                rel="noreferrer"
                className="w-full inline-block"
              >
                <Button variant="outline" className="w-full rounded-full text-xs font-semibold">
                  View Repository
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Apple Style Smooth Accordion FAQ */}
        <div className="text-left space-y-3">
          <div className="flex items-center gap-2 mb-4 px-1">
            <HelpCircle className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-semibold text-foreground tracking-tight">Frequently Asked Questions</h2>
          </div>

          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={cn(
                  "border rounded-2xl bg-card transition-colors overflow-hidden",
                  isOpen ? "border-foreground/20 shadow-sm" : "border-border"
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left transition-colors"
                >
                  <span className="text-sm font-semibold text-foreground pr-4">{faq.q}</span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200",
                      isOpen && "rotate-180 text-foreground"
                    )}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/50">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
