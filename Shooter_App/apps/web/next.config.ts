// apps/web/next.config.ts
import type { NextConfig } from 'next';

const isExport = process.env.NEXT_EXPORT !== 'false';

const nextConfig: NextConfig = {
  ...(isExport ? { output: 'export' as const } : {}),
  transpilePackages: ['@shooting-platform/shared-types'],
  compress: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'recharts', 'framer-motion'],
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
    unoptimized: true,
  },
  ...(isExport
    ? {}
    : {
        // ── API Proxy Rewrites (Node Server Mode) ────────────────────────────
        async rewrites() {
          const apiBase = process.env.INTERNAL_API_URL ?? 'http://localhost:3001';
          const visionBase = process.env.INTERNAL_VISION_URL ?? 'http://localhost:8000';
          return [
            {
              source: '/api/:path*',
              destination: `${apiBase}/:path*`,
            },
            {
              source: '/vision/:path*',
              destination: `${visionBase}/:path*`,
            },
          ];
        },
        async headers() {
          return [
            {
              source: '/(.*)',
              headers: [
                {
                  key: 'Cross-Origin-Opener-Policy',
                  value: 'same-origin-allow-popups',
                },
                {
                  key: 'Cross-Origin-Embedder-Policy',
                  value: 'unsafe-none',
                },
              ],
            },
          ];
        },
      }),
};

export default nextConfig;
