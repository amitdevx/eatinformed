/** @type {import('next').NextConfig} */
const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const nextConfig = {
  turbopack: {
    root: '.',
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async rewrites() {
    if (!firebaseProjectId) return [];
    return [
      {
        // Capture all Firebase Auth internal paths and proxy to configured Firebase project
        source: '/__/auth/:path*',
        destination: `https://${firebaseProjectId}.firebaseapp.com/__/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
