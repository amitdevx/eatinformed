import { Camera, ScanLine, Layers, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-screen bg-background pt-20 pb-20">
      <div className="container mx-auto px-4 max-w-3xl text-center">
        <h1 className="text-4xl sm:text-5xl font-semibold text-foreground tracking-tight mb-4 leading-tight">
          How EatInformed Works
        </h1>
        <p className="text-base text-muted-foreground max-w-lg mx-auto mb-16">
          From snapping a label to getting a complete nutritional breakdown in seconds.
        </p>

        <div className="space-y-6 text-left">
          {steps.map((step) => (
            <div key={step.id} className="bg-card border border-border p-6 rounded-2xl flex items-start gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-muted text-primary shrink-0 mt-0.5">
                <step.Icon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">Step {step.id}</span>
                </div>
                <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Link href="/check">
            <Button size="lg" className="rounded-full bg-foreground hover:bg-foreground/90 text-background text-sm font-semibold px-7 py-3 transition-all active:scale-[0.98]">
              Scan a Label Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
