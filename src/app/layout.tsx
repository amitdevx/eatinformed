import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Navbar from '@/components/layout/Navbar';
import { AuthProvider } from '@/context/AuthContext';
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '@/lib/constants';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: `${SITE_NAME} | Clinical Food Nutrition & Safety Intelligence`,
  description: SITE_DESCRIPTION,
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
    <html lang="en" className={`${inter.variable} dark`}>
      <head>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col bg-[#000000] text-[#F5F5F7] selection:bg-[#30D158]/20 selection:text-[#30D158]">
        <AuthProvider>
          <div className="fixed inset-0 pointer-events-none apple-radial-glow z-0" />
          <Navbar />
          <main className="flex-grow container mx-auto px-4 py-8 relative z-10 max-w-6xl">
            {children}
          </main>
          <Toaster />
          <footer className="border-t border-white/[0.08] bg-black/40 backdrop-blur-md text-[#86868B] text-center py-8 text-xs tracking-wide">
            <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-6xl">
              <p>Copyright (c) {new Date().getFullYear()} EatInformed. Clinical food intelligence.</p>
              <div className="flex gap-6">
                <span className="hover:text-[#F5F5F7] transition-colors cursor-pointer">Privacy</span>
                <span className="hover:text-[#F5F5F7] transition-colors cursor-pointer">Terms</span>
                <span className="hover:text-[#F5F5F7] transition-colors cursor-pointer">NOVA Standard</span>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
