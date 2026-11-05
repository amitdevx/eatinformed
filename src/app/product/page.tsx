'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ScanLine, Layers, ShieldCheck, Zap, History, Sparkles, CheckCircle2, AlertTriangle, Eye, Database } from "lucide-react";
import { motion } from "framer-motion";

const springTransition = { type: 'spring' as const, stiffness: 280, damping: 28 };

export default function ProductPage() {
  const capabilities = [
    {
      icon: ScanLine,
      title: "Optical Label Transcription",
      description: "Extracts complete ingredients lists, allergen warnings, and complex nutrition tables from curved cans, snack packaging, and bottle wrappers."
    },
    {
      icon: Layers,
      title: "The NOVA Food Standard",
      description: "Applies the University of Sao Paulo standard to classify products from Group 1 whole foods to Group 4 ultra-processed industrial formulations."
    },
    {
      icon: ShieldCheck,
      title: "Additive & Chemical Screening",
      description: "Identifies industrial emulsifiers, high-fructose corn syrups, artificial sweeteners, and synthetic food dyes that manufacturers hide under numbers."
    },
    {
      icon: Zap,
      title: "Structured Nutritional Panel",
      description: "Computes % Daily Values and breaks down hidden added sugars, sodium density, saturated fats, and dietary fiber ratios."
    },
    {
      icon: History,
      title: "Local Offline Vault",
      description: "Saves scanned product analyses locally in your browser or mobile device, preserving your grocery history with complete privacy."
    },
    {
      icon: Sparkles,
      title: "Objective 1.0 to 5.0 Score",
      description: "Computes a transparent health score based on processing degree, whole food content, and additive burden."
    }
  ];

  return (
    <div className="min-h-screen bg-background pt-16 md:pt-24 pb-24">
      <main className="container mx-auto px-4 max-w-4xl text-center">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 space-y-4"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Product Tour
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-foreground tracking-tight leading-tight">
            Food product analysis.
            <br />
            <span className="text-muted-foreground">Down to the fine print.</span>
          </h1>
          <p className="text-base text-muted-foreground max-w-lg mx-auto">
            EatInformed transforms complex, dense food packaging into transparent, actionable health data in seconds.
          </p>
          <div className="flex justify-center pt-2">
            <Link href="/check">
              <Button size="lg" className="rounded-full bg-foreground hover:bg-foreground/90 text-background text-sm font-semibold px-7 py-3 transition-all active:scale-[0.98]">
                Start Scanning Labels
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Capabilities Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-left mb-20">
          {capabilities.map((cap, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -2 }}
              className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between hover:border-foreground/20 transition-all shadow-sm"
            >
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-primary">
                  <cap.icon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{cap.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{cap.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Detailed NOVA Processing Spectrum */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-card border border-border rounded-3xl p-8 sm:p-10 text-left mb-20 shadow-sm"
        >
          <h2 className="text-2xl font-semibold text-foreground tracking-tight mb-2">The NOVA Classification Standard</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-8 leading-relaxed max-w-2xl">
            Unlike marketing claims like &quot;all natural&quot; or &quot;organic&quot;, the NOVA standard categorizes foods strictly by the extent and purpose of industrial processing.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-1.5">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm block">Group 1: Whole Foods</span>
              <p className="text-foreground text-xs font-medium">Unprocessed or minimally processed</p>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Whole grains, rolled oats, fresh fruit, plain milk, legumes, and seeds cleaned without added fats or salt.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-sky-500/20 bg-sky-500/5 space-y-1.5">
              <span className="font-semibold text-sky-600 dark:text-sky-400 text-sm block">Group 2: Culinary Bases</span>
              <p className="text-foreground text-xs font-medium">Processed culinary ingredients</p>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Oils, butter, sugar, and salt derived from natural sources, used in home cooking to season Group 1 foods.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 space-y-1.5">
              <span className="font-semibold text-amber-600 dark:text-amber-400 text-sm block">Group 3: Processed Foods</span>
              <p className="text-foreground text-xs font-medium">Simple processed foods</p>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Canned vegetables in brine, simple cheeses, and freshly baked breads made with 2 to 3 basic ingredients.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 space-y-1.5">
              <span className="font-semibold text-rose-600 dark:text-rose-400 text-sm block">Group 4: Ultra-Processed Foods</span>
              <p className="text-foreground text-xs font-medium">Industrial formulations (UPFs)</p>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Packaged formulations containing industrial emulsifiers, artificial flavors, synthetic dyes, and flavor enhancers.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Screening Criteria */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-card border border-border rounded-3xl p-8 sm:p-10 text-left shadow-sm"
        >
          <h2 className="text-2xl font-semibold text-foreground tracking-tight mb-2">What EatInformed Screens For</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-6 leading-relaxed">
            Every label scan cross-references ingredients against established food safety databases:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-left">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Emulsifiers & Gums</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Polysorbate 80, carboxymethylcellulose (CMC), and thickeners that impact gut mucosal barriers.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Industrial Sweeteners</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                High-fructose corn syrup, sucralose, and artificial sweeteners that influence insulin sensitivity.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Preservatives & Dyes</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                TBHQ, BHA/BHT, Red 40, and Yellow 5 flagged by international safety agencies.
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
