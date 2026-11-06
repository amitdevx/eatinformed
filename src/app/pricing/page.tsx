'use client';

import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

function AnimatedText({ text, delay = 0, className }: { text: string; delay?: number; className?: string }) {
  const characters = Array.from(text);

  const container = {
    hidden: { opacity: 0 },
    visible: (i: number = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.03, delayChildren: delay * i },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        damping: 18,
        stiffness: 220,
      },
    },
    hidden: {
      opacity: 0,
      y: 10,
      transition: {
        type: "spring" as const,
        damping: 18,
        stiffness: 220,
      },
    },
  };

  return (
    <motion.span
      variants={container}
      initial="hidden"
      animate="visible"
      className={cn("inline-block", className)}
    >
      {characters.map((char, index) => (
        <motion.span key={`${char}-${index}`} variants={child} className="inline-block">
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.span>
  );
}

// ponytail: directly render open-access $0 pricing without fake countdown tiers
export default function PricingPage() {
  const freeFeatures = [
    "Unlimited food label scans",
    "Complete NOVA food processing classification",
    "Ingredient deconstruction & additive screening",
    "Structured nutrition facts transcription",
    "Local persistent scan history on your device",
    "Zero third-party advertisements",
    "Open source and transparent",
  ];

  return (
    <div className="min-h-screen bg-background pt-16 md:pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-3xl text-center">
        <div className="min-h-[120px] flex flex-col items-center justify-center mb-6">
          <div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-foreground tracking-tight leading-tight">
              <AnimatedText text="Free and open." delay={0.05} />
              <br />
              <span className="text-muted-foreground">
                <AnimatedText text="For everyone." delay={0.3} />
              </span>
            </h1>
            <p className="text-base text-muted-foreground mt-3 max-w-md mx-auto">
              <AnimatedText text="Food transparency should be accessible to all." delay={0.5} />
            </p>
          </div>
        </div>

        {/* Pricing Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="bg-card border border-border rounded-3xl p-8 sm:p-10 text-left max-w-lg mx-auto shadow-sm mt-8"
        >
          <div className="flex items-center justify-between border-b border-border pb-6 mb-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary block">
                All Capabilities
              </span>
              <h2 className="text-2xl font-semibold text-foreground mt-0.5">
                EatInformed
              </h2>
            </div>
            <div className="text-right">
              <span className="text-4xl sm:text-5xl font-bold text-foreground inline-block">
                $0
              </span>
              <span className="text-xs text-muted-foreground block mt-0.5">
                forever
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
            Full access to our optical vision parser, NOVA categorization models, and nutrition breakdown tools at zero cost.
          </p>

          <ul className="space-y-3 mb-8">
            {freeFeatures.map((feature, i) => (
              <li key={i} className="flex items-center gap-3 text-xs sm:text-sm text-foreground">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <Link href="/check" className="w-full block">
            <Button
              size="lg"
              className="w-full rounded-full bg-foreground hover:bg-foreground/90 text-background text-sm font-semibold py-3 transition-all active:scale-[0.98]"
            >
              Start Scanning Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
