'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

function AnimatedText({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const characters = Array.from(text);
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.025, delayChildren: delay },
    },
  };
  const child = {
    hidden: { opacity: 0, y: 6 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, damping: 22, stiffness: 380 },
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

const priceSequence = [
  { price: "$100", label: "Paid Tier", caption: "Per month" },
  { price: "$50", label: "Discounted", caption: "Per month" },
  { price: "$10", label: "Subscription", caption: "Per month" },
  { price: "$0", label: "EatInformed", caption: "forever" },
];

export default function PricingPage() {
  const [seqIndex, setSeqIndex] = useState(0);

  useEffect(() => {
    if (seqIndex < priceSequence.length - 1) {
      const timer = setTimeout(() => {
        setSeqIndex((prev) => prev + 1);
      }, 550);
      return () => clearTimeout(timer);
    }
  }, [seqIndex]);

  const current = priceSequence[seqIndex];
  const isFinal = seqIndex === priceSequence.length - 1;

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
        {/* Animated Headline with character by character effect */}
        <div className="min-h-[120px] flex flex-col items-center justify-center mb-6">
          {isFinal ? (
            <div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-foreground tracking-tight leading-tight">
                <AnimatedText text="Free and open." delay={0.05} />
                <br />
                <span className="text-muted-foreground">
                  <AnimatedText text="For everyone." delay={0.4} />
                </span>
              </h1>
              <p className="text-base text-muted-foreground mt-3 max-w-md mx-auto">
                <AnimatedText text="Food transparency should be accessible to all." delay={0.7} />
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={current.price}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-foreground tracking-tight leading-tight">
                  Pricing: {current.price}
                </h1>
                <p className="text-base text-muted-foreground mt-3">
                  Transitioning to community standard...
                </p>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Pricing Card with Character Effect and Morphing Number */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="bg-card border border-border rounded-3xl p-8 sm:p-10 text-left max-w-lg mx-auto shadow-sm mt-8"
        >
          <div className="flex items-center justify-between border-b border-border pb-6 mb-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary block">
                {isFinal ? <AnimatedText text="All Capabilities" delay={0.8} /> : "Capabilities"}
              </span>
              <h2 className="text-2xl font-semibold text-foreground mt-0.5">
                {isFinal ? <AnimatedText text="EatInformed" delay={0.9} /> : current.label}
              </h2>
            </div>
            <div className="text-right">
              <AnimatePresence mode="wait">
                <motion.span
                  key={current.price}
                  initial={{ opacity: 0, scale: 0.8, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.1, y: -8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  className="text-4xl sm:text-5xl font-bold text-foreground inline-block"
                >
                  {current.price}
                </motion.span>
              </AnimatePresence>
              <span className="text-xs text-muted-foreground block mt-0.5">
                {isFinal ? <AnimatedText text="forever" delay={1.0} /> : current.caption}
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
