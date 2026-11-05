'use client';

import { Camera, ScanLine, Layers, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function HowItWorksPage() {
  const steps = [
    {
      id: 1,
      Icon: Camera,
      title: "Capture the Label",
      description: "Take a photo of any packaged food label or upload an existing image from your photo library."
    },
    {
      id: 2,
      Icon: ScanLine,
      title: "Optical Text Extraction",
      description: "Our vision model reads the ingredients list, allergen notices, and nutrition table into structured data."
    },
    {
      id: 3,
      Icon: Layers,
      title: "Processing & Additive Analysis",
      description: "The ingredients are cross-referenced with the international NOVA standard to detect industrial additives and processing levels."
    },
    {
      id: 4,
      Icon: CheckCircle2,
      title: "Clear, Objective Report",
      description: "Receive a simple 1.0 to 5.0 score, the NOVA group badge, pros, cons, and a structured nutrition facts table."
    }
  ];

  return (
    <div className="min-h-screen bg-background pt-16 md:pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14 space-y-3"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Step-by-Step Flow
          </span>
          <h1 className="text-4xl sm:text-5xl font-semibold text-foreground tracking-tight leading-tight">
            How EatInformed Works
          </h1>
          <p className="text-base text-muted-foreground max-w-lg mx-auto">
            From snapping a packaging label to getting a complete nutritional breakdown in seconds.
          </p>
        </motion.div>

        {/* Apple Style Scroll-Triggered Step Cards */}
        <div className="space-y-4 text-left">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -2 }}
              className="bg-card border border-border p-6 sm:p-7 rounded-3xl flex items-start gap-5 shadow-sm hover:border-foreground/20 transition-all"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-muted text-primary shrink-0 mt-0.5 border border-border">
                <step.Icon className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">Step {step.id}</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground tracking-tight">{step.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-14 text-center"
        >
          <Link href="/check">
            <Button size="lg" className="rounded-full bg-foreground hover:bg-foreground/90 text-background text-sm font-semibold px-7 py-3 transition-all active:scale-[0.98]">
              Scan a Label Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
