

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Navbar from '@/components/layout/Navbar';
import ParticleBackground from '@/components/layout/ParticleBackground';
import FloatingIcons from '@/components/layout/FloatingIcons';
import { AuthProvider } from '@/context/AuthContext';
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '@/lib/constants';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

// Default metadata, can be overridden by individual pages
export const metadata: Metadata = {
  title: `${SITE_NAME} - AI Nutrition Analysis`,
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
      <body className="font-body antialiased min-h-screen flex flex-col">
        <AuthProvider>
          <ParticleBackground />
          <FloatingIcons />
          <Navbar />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <Toaster />
          <footer className="bg-transparent text-muted-foreground text-center py-6 text-sm">
            © {new Date().getFullYear()} EatInformed. All rights reserved.
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
