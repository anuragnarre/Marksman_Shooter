// apps/web/next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@shooting-platform/shared-types'],
  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
  // Allow dev hot-reload from any origin (LAN, Netbird, Tailscale)
  allowedDevOrigins: [
    'localhost:3000',
    '127.0.0.1:3000',
    '*.proxy.netbird.io',
    '*.netbird.services',
    '*.ts.net',
    '192.168.*',
    'marksmanshooter.in',
    '*.marksmanshooter.in'
  ],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
    ],
  },
  // ── API Proxy Rewrites ────────────────────────────────────────────────────────
  // ALL browser API calls go to the same frontend domain (e.g. marksman.xxx.proxy.netbird.io/api/*)
  // Next.js server-side forwards them to localhost:3001 internally.
  // This means port 3001 (API) and port 8000 (Vision) NEVER need to be exposed publicly.
  async rewrites() {
    const apiBase = process.env.INTERNAL_API_URL ?? 'http://localhost:3001';
    const visionBase = process.env.INTERNAL_VISION_URL ?? 'http://localhost:8000';
    return [
      // Proxy /api/* → NestJS on localhost:3001
      {
        source: '/api/:path*',
        destination: `${apiBase}/:path*`,
      },
      // Proxy /vision/* → FastAPI on localhost:8000
      {
        source: '/vision/:path*',
        destination: `${visionBase}/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        // Google Sign-In popup/iframe needs allow-popups — apply site-wide
        // (restricting to /auth/* breaks the button on any page it appears on)
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            // Required alongside COOP for cross-origin iframes (GSI One Tap)
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
