import type { Metadata } from 'next';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Navbar from '@/components/layout/Navbar';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { SITE_URL, SITE_NAME } from '@/lib/constants';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: `${SITE_NAME} | Food Product Analysis & Nutrition Intelligence`,
  description: 'Instant food product analysis. Snap or upload any food label to decode ingredients, nutrition facts, and NOVA processing levels.',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.png`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('eatinformed_theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <main className="flex-grow container mx-auto px-4 py-8 relative z-10 max-w-5xl">
              {children}
            </main>
            <Toaster />
            <footer className="border-t border-border bg-card/40 backdrop-blur-md text-muted-foreground text-center py-8 text-xs tracking-wide">
              <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-5xl">
                <p>Copyright (c) {new Date().getFullYear()} EatInformed. Food product analysis and ingredient intelligence.</p>
                <div className="flex gap-6">
                  <Link href="/support#privacy" className="hover:text-foreground transition-colors">
                    Privacy
                  </Link>
                  <Link href="/docs" className="hover:text-foreground transition-colors">
                    Terms
                  </Link>
                  <Link href="/product#nova-standard" className="hover:text-foreground transition-colors">
                    NOVA Standard
                  </Link>
                  <a
                    href="https://github.com/amitdevx/eatinformed"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    GitHub
                  </a>
                </div>
              </div>
            </footer>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
