'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ScanLine, ArrowRight, Layers, ShieldCheck, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AuthForm } from '@/components/features/AuthForm';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';

const springTransition = { type: 'spring' as const, stiffness: 280, damping: 28 };

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [openAuthDialog, setOpenAuthDialog] = useState(false);

  const handleCheckProductClick = () => {
    if (user) {
      router.push('/check');
    } else {
      setOpenAuthDialog(true);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-24 md:space-y-32 pb-24">
      {/* Hero Section */}
      <section className="w-full pt-12 md:pt-20 text-center relative z-10 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center space-y-6"
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-foreground leading-[1.06]">
            Food clarity.
            <br />
            <span className="text-muted-foreground">For what you eat.</span>
          </h1>

          <p className="max-w-xl text-muted-foreground text-base md:text-lg font-normal leading-relaxed">
            Instantly decode food packaging. Scan ingredients, nutrition facts, and processing classifications direct from your camera or photo library.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-3">
            <Dialog open={openAuthDialog} onOpenChange={setOpenAuthDialog}>
              <Button
                onClick={handleCheckProductClick}
                size="lg"
                className="rounded-full bg-foreground hover:bg-foreground/90 text-background text-sm font-semibold px-7 py-3.5 transition-all active:scale-[0.98] shadow-sm"
              >
                <ScanLine className="mr-2 h-4 w-4" />
                Scan a Product
              </Button>
              <DialogContent className="max-w-md bg-card border-border text-foreground rounded-3xl p-6">
                <DialogHeader>
                  <DialogTitle className="text-center text-xl font-semibold tracking-tight">EatInformed</DialogTitle>
                  <DialogDescription className="text-center text-xs text-muted-foreground">
                    Sign in or continue as guest to start scanning food labels.
                  </DialogDescription>
                </DialogHeader>
                <AuthForm onAuthSuccess={() => {
                  setOpenAuthDialog(false);
                  router.push('/check');
                }} />
              </DialogContent>
            </Dialog>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full bg-muted/40 hover:bg-muted text-foreground border-border text-sm font-medium px-7 py-3.5 transition-all active:scale-[0.98]"
            >
              <Link href="#pillars">
                Explore Standards
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Clean Apple-style Product Analysis Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-14 mx-auto max-w-2xl"
        >
          <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-6 sm:p-8 text-left shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-5 mb-5">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Sample Analysis
                </span>
                <h3 className="text-xl font-semibold text-foreground">Plain Greek Yogurt</h3>
                <p className="text-xs text-muted-foreground">Chobani - 100% Non-Fat</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  NOVA 1: Whole Food
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">4.8</span>
                  <span className="text-xs text-muted-foreground"> / 5.0</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs font-semibold text-foreground">Ingredients</span>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                  Cultured Pasteurized Nonfat Milk, Live Active Probiotic Cultures (S. Thermophilus, L. Bulgaricus).
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <span className="px-2.5 py-1 rounded-lg bg-muted text-[11px] text-foreground">
                  17g Protein per serving
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-muted text-[11px] text-foreground">
                  0g Added Sugars
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-muted text-[11px] text-foreground">
                  No Artificial Additives
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* The 3 Pillars Section */}
      <section id="pillars" className="w-full max-w-4xl mx-auto px-4">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            Clear standards for every scan.
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            EatInformed uses verified nutritional metrics to help you understand food quality.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <motion.div
            whileHover={{ y: -2 }}
            transition={springTransition}
            className="rounded-3xl border border-border bg-card/60 p-6 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-primary">
                <Layers className="h-4 w-4" />
              </div>
              <h3 className="text-base font-semibold text-foreground">The NOVA Standard</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Categorizes foods from Group 1 (unprocessed whole foods) to Group 4 (ultra-processed formulations with industrial emulsifiers).
              </p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            transition={springTransition}
            className="rounded-3xl border border-border bg-card/60 p-6 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-amber-500">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Additive Screening</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Flags synthetic food dyes, high-fructose syrups, and controversial stabilizers in common packaged products.
              </p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            transition={springTransition}
            className="rounded-3xl border border-border bg-card/60 p-6 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-sky-500">
                <Zap className="h-4 w-4" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Nutrient Precision</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Transcribes structured nutritional tables to reveal serving sizes, sodium density, and saturated fat levels.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Sample Products Section */}
      <section className="w-full max-w-4xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-semibold text-foreground tracking-tight">Sample Product Reports</h3>
            <p className="text-xs text-muted-foreground">Explore real product breakdowns without taking a photo.</p>
          </div>
          <Link
            href="/check"
            className="inline-flex items-center text-xs font-semibold text-primary hover:underline"
          >
            Launch full scanner <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/check?sample=sample-yogurt" className="group">
            <div className="rounded-2xl border border-border bg-card/60 p-5 hover:border-foreground/20 transition-all duration-150">
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-3">
                NOVA 1: Whole Food
              </span>
              <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Greek Yogurt</h4>
              <p className="text-xs text-muted-foreground mt-0.5 mb-3">Chobani Non-Fat</p>
              <div className="flex justify-between items-center text-xs pt-2.5 border-t border-border">
                <span className="text-muted-foreground">Rating</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">4.8 / 5.0</span>
              </div>
            </div>
          </Link>

          <Link href="/check?sample=sample-granola" className="group">
            <div className="rounded-2xl border border-border bg-card/60 p-5 hover:border-foreground/20 transition-all duration-150">
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-3">
                NOVA 3: Processed
              </span>
              <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Honey Granola</h4>
              <p className="text-xs text-muted-foreground mt-0.5 mb-3">KIND Healthy Grains</p>
              <div className="flex justify-between items-center text-xs pt-2.5 border-t border-border">
                <span className="text-muted-foreground">Rating</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">3.6 / 5.0</span>
              </div>
            </div>
          </Link>

          <Link href="/check?sample=sample-chips" className="group">
            <div className="rounded-2xl border border-border bg-card/60 p-5 hover:border-foreground/20 transition-all duration-150">
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 mb-3">
                NOVA 4: Ultra-Processed
              </span>
              <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Nacho Cheese Chips</h4>
              <p className="text-xs text-muted-foreground mt-0.5 mb-3">Doritos Flavored Tortilla</p>
              <div className="flex justify-between items-center text-xs pt-2.5 border-t border-border">
                <span className="text-muted-foreground">Rating</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">1.6 / 5.0</span>
              </div>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
