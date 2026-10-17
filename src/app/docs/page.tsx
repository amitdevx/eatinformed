import { BookOpen, FileText, Code, Settings } from "lucide-react";
import Link from "next/link";

export default function DocsPage() {
  const sections = [
    {
      title: "Getting Started",
      icon: BookOpen,
      links: [
        { label: "Quick Start Guide", href: "/how-it-works" },
        { label: "Scanning Food Labels", href: "/check" },
        { label: "Understanding Health Scores", href: "/how-it-works" },
      ]
    },
    {
      title: "AI Analysis",
      icon: Code,
      links: [
        { label: "How Vision OCR works", href: "/product" },
        { label: "Nutritional Reasoning Model", href: "/product" },
        { label: "Allergen Detection Logic", href: "/how-it-works" },
      ]
    },
    {
      title: "Account Settings",
      icon: Settings,
      links: [
        { label: "Managing Profiles", href: "/check" },
        { label: "Data Privacy", href: "/support" },
        { label: "Pricing & Plans", href: "/pricing" },
      ]
    },
    {
      title: "Help & Support",
      icon: FileText,
      links: [
        { label: "Support Center", href: "/support" },
        { label: "Contact Us", href: "/support" },
        { label: "FAQs", href: "/support" },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">Documentation</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Everything you need to know about setting up and using EatInformed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {sections.map((section, idx) => (
            <div key={idx} className="bg-card/30 border border-border/30 rounded-2xl p-8 hover:bg-card/50 transition-colors">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-white/5 rounded-lg text-primary">
                  <section.icon className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-semibold text-white">{section.title}</h2>
              </div>
              <ul className="space-y-3">
                {section.links.map((link, i) => (
                  <li key={i}>
                    <Link href={link.href} className="text-gray-400 hover:text-primary transition-colors flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/50 block"></span>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
