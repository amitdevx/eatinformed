import Link from "next/link";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PricingPage() {
  const freeFeatures = [
    "Unlimited food label scans",
    "Complete NOVA food processing classification",
    "Ingredient deconstruction & additive screening",
    "Structured nutrition facts transcription",
    "Local persistent scan history",
    "Zero third-party advertisements",
    "Open source and transparent",
  ];

  return (
    <div className="min-h-screen bg-background pt-20 pb-20">
      <div className="container mx-auto px-4 max-w-3xl text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-foreground tracking-tight mb-4 leading-tight">
          Free and open.
          <br />
          <span className="text-muted-foreground">For everyone.</span>
        </h1>
        <p className="text-base text-muted-foreground max-w-lg mx-auto mb-14">
          No subscriptions. No locked features. No credit cards. Food transparency should be accessible to all.
        </p>

        <div className="bg-card border border-border rounded-3xl p-8 sm:p-10 text-left max-w-xl mx-auto shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-6 mb-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">All Access</span>
              <h2 className="text-2xl font-semibold text-foreground mt-0.5">EatInformed Community</h2>
            </div>
            <div className="text-right">
              <span className="text-4xl font-bold text-foreground">$0</span>
              <span className="text-xs text-muted-foreground block">forever</span>
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
            <Button size="lg" className="w-full rounded-full bg-foreground hover:bg-foreground/90 text-background text-sm font-semibold py-3 transition-all active:scale-[0.98]">
              Start Scanning Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
