import { HelpCircle, Github, FileCode, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background pt-20 pb-20">
      <div className="container mx-auto px-4 max-w-3xl text-center">
        <h1 className="text-4xl sm:text-5xl font-semibold text-foreground tracking-tight mb-4">
          Support & FAQ
        </h1>
        <p className="text-base text-muted-foreground mb-12 max-w-lg mx-auto">
          EatInformed is an open source food product analysis tool. Find answers to common questions or contribute on GitHub.
        </p>

        {/* Real community support channels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-14 text-left">
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-foreground">
                <Github className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">GitHub Issues</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Report a scanning bug, suggest a new food standard, or track feature requests directly on our repository.
              </p>
            </div>
            <div className="pt-5">
              <a
                href="https://github.com/amitdevx/eatinformed/issues"
                target="_blank"
                rel="noreferrer"
                className="w-full inline-block"
              >
                <Button variant="outline" className="w-full rounded-full text-xs font-semibold">
                  Open an Issue on GitHub
                </Button>
              </a>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-foreground">
                <FileCode className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Open Source Project</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Explore the codebase, inspect the vision extraction prompts, and review our classification benchmarks.
              </p>
            </div>
            <div className="pt-5">
              <a
                href="https://github.com/amitdevx/eatinformed"
                target="_blank"
                rel="noreferrer"
                className="w-full inline-block"
              >
                <Button variant="outline" className="w-full rounded-full text-xs font-semibold">
                  View Repository
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Real Transparent FAQ */}
        <div className="text-left bg-card border border-border rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-2.5 mb-6">
            <HelpCircle className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground tracking-tight">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-6">
            <div className="space-y-1.5">
              <h4 className="text-sm font-semibold text-foreground">How does label extraction work?</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                When you snap a food packaging photo, our vision engine transcribes ingredients and nutrition tables into structured data. It categorizes nutrients by serving and per 100g.
              </p>
            </div>

            <div className="space-y-1.5 border-t border-border pt-5">
              <h4 className="text-sm font-semibold text-foreground">What is the NOVA classification system?</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The NOVA standard was created by researchers at the University of Sao Paulo. It groups foods into four categories: Unprocessed whole foods (Group 1), Processed culinary ingredients (Group 2), Processed foods (Group 3), and Ultra-processed formulations (Group 4).
              </p>
            </div>

            <div className="space-y-1.5 border-t border-border pt-5">
              <h4 className="text-sm font-semibold text-foreground">Is my scan data private?</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Yes. Your scan history is saved locally in your own browser or mobile secure storage. We do not sell scan data or track your grocery habits.
              </p>
            </div>

            <div className="space-y-1.5 border-t border-border pt-5">
              <h4 className="text-sm font-semibold text-foreground">Is EatInformed free to use?</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Yes. EatInformed is 100% free with no subscriptions, no paywalls, and no third-party advertisements.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
