import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ScanLine, Layers, ShieldCheck, Zap, History, Sparkles } from "lucide-react";

export default function ProductPage() {
  const capabilities = [
    {
      icon: ScanLine,
      title: "Optical Label Transcription",
      description: "Extracts ingredients and nutritional tables from complex packaging, curved cans, and low-contrast labels in seconds."
    },
    {
      icon: Layers,
      title: "NOVA Food Processing Standard",
      description: "Classifies every product into one of four verified groups, from Group 1 whole foods to Group 4 ultra-processed formulations."
    },
    {
      icon: ShieldCheck,
      title: "Additive & Chemical Screening",
      description: "Flags industrial emulsifiers, artificial sweeteners, and synthetic preservatives often hidden under technical trade names."
    },
    {
      icon: Zap,
      title: "Nutrition Facts Breakdown",
      description: "Transcribes exact serving sizes, sodium density, saturated fats, and added sugars into an easy-to-read table."
    },
    {
      icon: History,
      title: "Offline History",
      description: "Saves scanned product analyses locally on your device so you can compare items anytime without re-uploading."
    },
    {
      icon: Sparkles,
      title: "Instant Food Health Score",
      description: "Generates an objective 1.0 to 5.0 score based on whole food composition and degree of processing."
    }
  ];

  return (
    <div className="min-h-screen bg-background pt-20 pb-20">
      <main className="container mx-auto px-4 max-w-4xl text-center">
        {/* Hero Section */}
        <div className="mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary block mb-3">
            Product Capabilities
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-foreground tracking-tight mb-4 leading-tight">
            Food product analysis.
            <br />
            <span className="text-muted-foreground">Clear and objective.</span>
          </h1>
          <p className="text-base text-muted-foreground max-w-xl mx-auto mb-8">
            EatInformed decodes the fine print on packaged food labels, helping you make mindful grocery decisions with zero guesswork.
          </p>
          <div className="flex justify-center">
            <Link href="/check">
              <Button size="lg" className="rounded-full bg-foreground hover:bg-foreground/90 text-background text-sm font-semibold px-7 py-3 transition-all active:scale-[0.98]">
                Start Scanning Labels
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Capabilities Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-left mb-20">
          {capabilities.map((cap, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between hover:border-foreground/20 transition-all">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-primary">
                  <cap.icon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{cap.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{cap.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* The NOVA Processing Spectrum Summary */}
        <div className="bg-card border border-border rounded-3xl p-8 text-left">
          <h2 className="text-xl font-semibold text-foreground tracking-tight mb-2">Understanding the NOVA Scale</h2>
          <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
            EatInformed evaluates all products against the international NOVA processing classification developed at the University of Sao Paulo:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 block mb-1">Group 1: Whole Foods</span>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Unprocessed seeds, oats, fresh fruits, vegetables, plain milk, and eggs.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-sky-500/20 bg-sky-500/5">
              <span className="font-semibold text-sky-600 dark:text-sky-400 block mb-1">Group 2: Culinary Bases</span>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Extracted culinary ingredients such as olive oil, butter, sugar, and salt.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
              <span className="font-semibold text-amber-600 dark:text-amber-400 block mb-1">Group 3: Processed Foods</span>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Simple packaged foods like canned vegetables in brine and fresh cheeses.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5">
              <span className="font-semibold text-rose-600 dark:text-rose-400 block mb-1">Group 4: Ultra-Processed</span>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Formulations containing industrial emulsifiers, artificial colors, and synthetic flavorings.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
