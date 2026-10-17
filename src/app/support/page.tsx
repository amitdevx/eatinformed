import { LifeBuoy, Mail, MessageCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <h1 className="text-5xl font-bold text-white mb-6">Support Center</h1>
        <p className="text-xl text-gray-300 mb-16">
          We&apos;re here to help. Reach out to us if you have any questions or issues.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <div className="bg-card/40 border border-border/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-primary/50 transition-colors">
            <Mail className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Email Support</h3>
            <p className="text-gray-400 mb-6">Send us an email and we&apos;ll get back to you within 24 hours.</p>
            <Button variant="outline" className="border-gray-600 text-white w-full">support@eatinformed.com</Button>
          </div>

          <div className="bg-card/40 border border-border/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-primary/50 transition-colors">
            <MessageCircle className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Live Chat</h3>
            <p className="text-gray-400 mb-6">Chat with our support team in real-time during business hours.</p>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full">Start Chat</Button>
          </div>
        </div>

        <div className="text-left bg-card/30 border border-border/30 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <HelpCircle className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">How accurate is the OCR extraction?</h4>
              <p className="text-gray-400">We use state of the art Vision models, which achieve over 98% accuracy even on curved or partially obscured food labels.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">Is my health profile data secure?</h4>
              <p className="text-gray-400">Yes, your health profile is encrypted at rest and is only used temporarily during inference to compute your specific health score.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">Can I use EatInformed offline?</h4>
              <p className="text-gray-400">Currently, an internet connection is required as the AI analysis runs on our secure cloud infrastructure powered by advanced inference APIs.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
