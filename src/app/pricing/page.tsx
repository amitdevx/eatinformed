'use client';

import { useState, useEffect } from "react";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

function AnimatedText({
  text,
  delay = 0,
  className,
}: {
  text: string;
  delay?: number;
  className?: string;
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
      y: 8,
      transition: {
        type: "spring" as const,
        damping: 18,
        stiffness: 220,
      },
    },
  };

  return (
    <motion.span
      key={text}
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

const PRICING_STAGES = [
  {
    id: "100",
    price: "$100",
    caption: "per month",
    headline1: "Commercial diet apps.",
    headline2: "$100 per month.",
    subtitle: "Paywalled health data and corporate diet subscriptions.",
    tag: "Legacy Industry Standard",
    title: "Corporate Paywalls",
    buttonText: "Subscribe for $100 / month",
  },
  {
    id: "50",
    price: "$50",
    caption: "per month",
    headline1: "Diet app discounts.",
    headline2: "$50 per month.",
    subtitle: "Recurring monthly fees just to know what ingredients you consume.",
    tag: "Commercial Tier",
    title: "Subscription Access",
    buttonText: "Subscribe for $50 / month",
  },
  {
    id: "10",
    price: "$10",
    caption: "per month",
    headline1: "Micro-subscriptions.",
    headline2: "$10 per month.",
    subtitle: "Even low paywalls turn basic nutrition awareness into a luxury.",
    tag: "Consumer Tier",
    title: "Nutrition Apps",
    buttonText: "Subscribe for $10 / month",
  },
  {
    id: "0",
    price: "$0",
    caption: "forever",
    headline1: "Free and open.",
    headline2: "For everyone.",
    subtitle: "Food transparency should be accessible to all.",
    tag: "All Capabilities",
    title: "EatInformed",
    buttonText: "Start Scanning Free",
  },
];

export default function PricingPage() {
  const [stageIndex, setStageIndex] = useState(0);

  // ponytail: pause 5 seconds on each stage so user can comfortably read, then halt permanently on final $0 stage
  useEffect(() => {
    if (stageIndex < PRICING_STAGES.length - 1) {
      const timer = setTimeout(() => {
        setStageIndex((prev) => prev + 1);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [stageIndex]);

  const current = PRICING_STAGES[stageIndex];
  const isFinal = stageIndex === PRICING_STAGES.length - 1;

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
        {/* Animated Headline */}
        <div className="min-h-[140px] flex flex-col items-center justify-center mb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={`headline-${current.id}`}
              initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-foreground tracking-tight leading-tight">
                <AnimatedText text={current.headline1} delay={0.05} />
                <br />
                <span className={isFinal ? "text-muted-foreground" : "text-primary"}>
                  <AnimatedText text={current.headline2} delay={0.35} />
                </span>
              </h1>
              <p className="text-base text-muted-foreground mt-3 max-w-md mx-auto">
                <AnimatedText text={current.subtitle} delay={0.65} />
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Pricing Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="bg-card border border-border rounded-3xl p-8 sm:p-10 text-left max-w-lg mx-auto shadow-sm mt-8"
        >
          <div className="flex items-center justify-between border-b border-border pb-6 mb-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={`card-left-${current.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-primary block">
                  <AnimatedText text={current.tag} delay={0.1} />
                </span>
                <h2 className="text-2xl font-semibold text-foreground mt-0.5">
                  <AnimatedText text={current.title} delay={0.25} />
                </h2>
              </motion.div>
            </AnimatePresence>

            <div className="text-right">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`card-right-${current.id}`}
                  initial={{ opacity: 0, scale: 0.9, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.05, y: -6 }}
                  transition={{ type: "spring", stiffness: 380, damping: 26 }}
                >
                  <span className="text-4xl sm:text-5xl font-bold text-foreground inline-block">
                    <AnimatedText text={current.price} delay={0.1} />
                  </span>
                  <span className="text-xs text-muted-foreground block mt-0.5">
                    <AnimatedText text={current.caption} delay={0.25} />
                  </span>
                </motion.div>
              </AnimatePresence>
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
              className={cn(
                "w-full rounded-full text-sm font-semibold py-3 transition-all active:scale-[0.98]",
                isFinal
                  ? "bg-foreground hover:bg-foreground/90 text-background"
                  : "bg-muted/80 hover:bg-muted text-foreground border border-border"
              )}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={`btn-${current.id}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex items-center justify-center"
                >
                  <AnimatedText text={current.buttonText} delay={0.1} />
                  {isFinal && <ArrowRight className="ml-2 h-4 w-4" />}
                </motion.span>
              </AnimatePresence>
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
