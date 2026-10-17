import Link from "next/link";
import { Check, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-6xl text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">Simple, Transparent Pricing</h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-20">
          Start for free, upgrade when you need more detailed insights and extended scan history.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
          {/* Free Plan */}
          <div className="bg-card/30 backdrop-blur-sm border border-border/30 rounded-3xl p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="text-gray-400 w-6 h-6" />
              <h2 className="text-2xl font-bold text-white">Basic</h2>
            </div>
            <p className="text-gray-400 mb-6 border-b border-border/30 pb-6">Perfect for occasional label checks and standard health profiling.</p>
            <div className="mb-8">
              <span className="text-5xl font-bold text-white">$0</span>
              <span className="text-gray-500">/month</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {["5 scans per day", "Basic AI label extraction", "Standard health analysis", "1 active health profile"].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-primary shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Link href="/check" className="w-full">
              <Button variant="outline" className="w-full border-gray-600 text-white hover:bg-white/10">Start Scanning Free</Button>
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-primary/5 backdrop-blur-sm border border-primary/30 rounded-3xl p-8 flex flex-col relative shadow-2xl shadow-primary/10">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
              Coming Soon
            </div>
            <div className="flex items-center gap-3 mb-4">
              <Star className="text-primary w-6 h-6" />
              <h2 className="text-2xl font-bold text-white">Pro</h2>
            </div>
            <p className="text-gray-400 mb-6 border-b border-border/30 pb-6">For advanced nutritional tracking and extended personal scan archives.</p>
            <div className="mb-8">
              <span className="text-5xl font-bold text-white">$9</span>
              <span className="text-gray-500">/month</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {["Unlimited scans", "Personalized Health Goal Matching", "Scan history and trend analysis", "Export to PDF & CSV", "Priority support"].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-primary shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button disabled className="w-full bg-primary/40 text-primary-foreground cursor-not-allowed">Pro Tier — Coming Soon</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
