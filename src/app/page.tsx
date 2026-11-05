'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ScanLine, ArrowRight, ShieldCheck, Zap, Layers, Sparkles, CheckCircle2 } from 'lucide-react';
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
    <div className="flex flex-col items-center space-y-28 md:space-y-36 pb-24">
      {/* Hero Section */}
      <section className="w-full pt-16 md:pt-24 text-center relative z-10 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center space-y-6"
        >
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] text-[#86868B] text-xs font-medium tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-[#30D158]" />
            Clinical Nutrition Intelligence
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-[#F5F5F7] leading-[1.08]">
            Food clarity.
            <br />
            <span className="text-[#86868B]">Down to the molecule.</span>
          </h1>

          <p className="max-w-xl text-[#86868B] text-base md:text-xl font-normal leading-relaxed">
            Scan any ingredient list or nutrition panel for instant food processing classification, chemical additive screening, and clinical health ratings.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
            <Dialog open={openAuthDialog} onOpenChange={setOpenAuthDialog}>
              <Button
                onClick={handleCheckProductClick}
                size="lg"
                className="rounded-full bg-[#F5F5F7] hover:bg-white text-[#000000] text-sm font-semibold px-7 py-3.5 transition-all active:scale-[0.98] shadow-sm"
              >
                <ScanLine className="mr-2 h-4 w-4" />
                Scan a Product
              </Button>
              <DialogContent className="max-w-md bg-[#161618] border-white/10 text-[#F5F5F7] rounded-3xl p-6">
                <DialogHeader>
                  <DialogTitle className="text-center text-xl font-semibold tracking-tight">EatInformed</DialogTitle>
                  <DialogDescription className="text-center text-xs text-[#86868B]">
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
              className="rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-[#F5F5F7] border border-white/10 text-sm font-medium px-7 py-3.5 transition-all active:scale-[0.98]"
            >
              <Link href="#pillars">
                Explore the Standard
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Apple Hardware-Inspired Glass Scanner Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 md:mt-20 mx-auto max-w-3xl"
        >
          <div className="relative rounded-3xl border border-white/[0.08] bg-[#161618]/60 backdrop-blur-2xl p-6 md:p-8 shadow-2xl overflow-hidden text-left">
            {/* Subtle top indicator bar */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
              </div>
              <span className="text-xs font-mono text-[#86868B]">LIVE OCR INFERENCE - 768PX ENGINE</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="md:col-span-2 space-y-3">
                <div className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30">
                  NOVA 1: Whole Food
                </div>
                <h3 className="text-2xl font-semibold text-[#F5F5F7]">Plain Greek Yogurt</h3>
                <p className="text-xs text-[#86868B] leading-relaxed">
                  Cultured Pasteurized Nonfat Milk, Live Active Probiotic Bacterial Cultures (S. Thermophilus, L. Bulgaricus).
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="px-2.5 py-1 rounded-md bg-white/[0.05] text-[11px] text-[#F5F5F7] border border-white/[0.08]">
                    17g Protein
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-white/[0.05] text-[11px] text-[#F5F5F7] border border-white/[0.08]">
                    0g Added Sugar
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-white/[0.05] text-[11px] text-[#F5F5F7] border border-white/[0.08]">
                    Zero Additives
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-black/40 p-5 flex flex-col items-center justify-center text-center">
                <span className="text-xs text-[#86868B] uppercase tracking-wider font-semibold">Health Score</span>
                <span className="text-4xl font-bold text-[#30D158] my-1">4.8</span>
                <span className="text-[11px] text-[#86868B]">out of 5.0 rating</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* The 3 Pillars Section */}
      <section id="pillars" className="w-full max-w-5xl mx-auto px-4">
        <div className="text-center space-y-3 mb-14">
          <span className="text-xs font-semibold tracking-widest uppercase text-[#30D158]">Three Pillars</span>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#F5F5F7]">
            Built on scientific standards.
          </h2>
          <p className="text-sm md:text-base text-[#86868B] max-w-lg mx-auto">
            Not opinion. EatInformed evaluates foods against verified clinical processing classifications.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            whileHover={{ y: -2 }}
            transition={springTransition}
            className="rounded-3xl border border-white/[0.08] bg-[#161618]/70 backdrop-blur-xl p-7 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-[#30D158]">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-[#F5F5F7]">The NOVA Standard</h3>
              <p className="text-xs md:text-sm text-[#86868B] leading-relaxed">
                Classifies items from Group 1 (unprocessed whole foods) to Group 4 (ultra-processed formulations with industrial emulsifiers).
              </p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            transition={springTransition}
            className="rounded-3xl border border-white/[0.08] bg-[#161618]/70 backdrop-blur-xl p-7 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-amber-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-[#F5F5F7]">Additive Screening</h3>
              <p className="text-xs md:text-sm text-[#86868B] leading-relaxed">
                Cross-references synthetic dyes, high-fructose syrups, and controversial preservatives flagged by food safety agencies.
              </p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            transition={springTransition}
            className="rounded-3xl border border-white/[0.08] bg-[#161618]/70 backdrop-blur-xl p-7 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-sky-400">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-[#F5F5F7]">Nutrient Precision</h3>
              <p className="text-xs md:text-sm text-[#86868B] leading-relaxed">
                Transcribes exact per-serving and per-100g nutrient panels to uncover hidden sugars, sodium density, and trans fats.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Sample Benchmark Section */}
      <section className="w-full max-w-5xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <h3 className="text-2xl font-semibold text-[#F5F5F7] tracking-tight">Try instant examples.</h3>
            <p className="text-xs text-[#86868B]">Compare products across the food processing spectrum.</p>
          </div>
          <Link
            href="/check"
            className="inline-flex items-center text-xs font-semibold text-[#30D158] hover:text-[#30D158]/80 transition-colors"
          >
            Launch full scanner <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Link href="/check" className="group">
            <div className="rounded-3xl border border-white/[0.08] bg-[#161618]/60 p-6 hover:border-white/[0.18] transition-all duration-200">
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mb-3">
                NOVA 1: Clean Food
              </span>
              <h4 className="text-base font-semibold text-[#F5F5F7] group-hover:text-white">Greek Yogurt</h4>
              <p className="text-xs text-[#86868B] mt-1 mb-4">Chobani Plain Non-Fat</p>
              <div className="flex justify-between items-center text-xs pt-3 border-t border-white/[0.08]">
                <span className="text-[#86868B]">Rating</span>
                <span className="font-semibold text-[#30D158]">4.8 / 5.0</span>
              </div>
            </div>
          </Link>

          <Link href="/check" className="group">
            <div className="rounded-3xl border border-white/[0.08] bg-[#161618]/60 p-6 hover:border-white/[0.18] transition-all duration-200">
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 mb-3">
                NOVA 3: Processed
              </span>
              <h4 className="text-base font-semibold text-[#F5F5F7] group-hover:text-white">Honey Granola</h4>
              <p className="text-xs text-[#86868B] mt-1 mb-4">KIND Healthy Grains</p>
              <div className="flex justify-between items-center text-xs pt-3 border-t border-white/[0.08]">
                <span className="text-[#86868B]">Rating</span>
                <span className="font-semibold text-amber-400">3.6 / 5.0</span>
              </div>
            </div>
          </Link>

          <Link href="/check" className="group">
            <div className="rounded-3xl border border-white/[0.08] bg-[#161618]/60 p-6 hover:border-white/[0.18] transition-all duration-200">
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 mb-3">
                NOVA 4: Ultra-Processed
              </span>
              <h4 className="text-base font-semibold text-[#F5F5F7] group-hover:text-white">Classic Chips</h4>
              <p className="text-xs text-[#86868B] mt-1 mb-4">Lays Salted</p>
              <div className="flex justify-between items-center text-xs pt-3 border-t border-white/[0.08]">
                <span className="text-[#86868B]">Rating</span>
                <span className="font-semibold text-rose-400">1.9 / 5.0</span>
              </div>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
