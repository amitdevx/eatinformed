'use client';

import { BookOpen, FileText, Code2, ShieldCheck, ArrowRight, Layers, ScanLine } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const springTransition = { type: 'spring' as const, stiffness: 280, damping: 28 };

export default function DocsPage() {
  const sections = [
    {
      title: "Core Scanner",
      icon: ScanLine,
      description: "How to capture, upload, and process food labels.",
      links: [
        { label: "Scanning Food Labels", href: "/check" },
        { label: "Supported Image Formats", href: "/check" },
        { label: "Camera Alignment Tips", href: "/how-it-works" },
      ]
    },
    {
      title: "The NOVA Standard",
      icon: Layers,
      description: "Scientific food processing classification from Group 1 to 4.",
      links: [
        { label: "Understanding NOVA Groups", href: "/product" },
        { label: "Ultra-Processed Food Risks", href: "/product" },
        { label: "Culinary Ingredients vs UPFs", href: "/product" },
      ]
    },
    {
      title: "Nutritional Science",
      icon: Code2,
      description: "How nutritional facts, macros, and sodium thresholds are parsed.",
      links: [
        { label: "Daily Values (% DV) Reference", href: "/check" },
        { label: "Additive & Preservative Screening", href: "/product" },
        { label: "Allergen Detection Logic", href: "/how-it-works" },
      ]
    },
    {
      title: "Privacy & Open Source",
      icon: ShieldCheck,
      description: "Data retention, local storage policies, and community repositories.",
      links: [
        { label: "Local Vault Privacy Policy", href: "/support" },
        { label: "Open Source Codebase", href: "/support" },
        { label: "FAQ & Community Help", href: "/support" },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background pt-16 md:pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16 space-y-3"
        >
          <h1 className="text-4xl sm:text-5xl font-semibold text-foreground tracking-tight">
            Documentation & Standards
          </h1>
          <p className="text-base text-muted-foreground max-w-md mx-auto">
            Everything you need to know about EatInformed, label extraction, and nutritional scoring.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {sections.map((section, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -2 }}
              className="bg-card border border-border rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-sm hover:border-foreground/20 transition-all"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-primary">
                    <section.icon className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
                </div>
                <p className="text-xs text-muted-foreground mb-5 leading-relaxed">{section.description}</p>

                <ul className="space-y-2 border-t border-border pt-4">
                  {section.links.map((link, i) => (
                    <li key={i}>
                      <Link
                        href={link.href}
                        className="text-xs font-medium text-foreground/80 hover:text-primary transition-colors flex items-center justify-between py-1 group"
                      >
                        <span>{link.label}</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
