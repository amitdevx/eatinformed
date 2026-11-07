/** @type {import('next').NextConfig} */
const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          // ponytail: per MDN CORS spec, do not pair wildcards with Allow-Credentials: true
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
          },
        ],
      },
    ];
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
