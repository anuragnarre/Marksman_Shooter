// apps/web/next.config.ts
import type { NextConfig } from 'next';

const isExport = process.env.NEXT_EXPORT === 'true' || process.env.CAPACITOR_BUILD === 'true' || true;

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  transpilePackages: ['@shooting-platform/shared-types'],
  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
  // Allow dev hot-reload from any origin (LAN, Netbird, Tailscale)
  allowedDevOrigins: [
    'localhost:3000',
    '127.0.0.1:3000',
    'localhost:3002',
    '127.0.0.1:3002',
    '*.proxy.netbird.io',
    '*.netbird.services',
    '*.ts.net',
    '192.168.*',
  ],
  ...(isExport
    ? {}
    : {
        async rewrites() {
          const apiBase = process.env.INTERNAL_API_URL ?? 'http://localhost:3003';
          const visionBase = process.env.INTERNAL_VISION_URL ?? 'http://localhost:8000';
          return [
            { source: '/api/:path*', destination: `${apiBase}/:path*` },
            { source: '/vision/:path*', destination: `${visionBase}/:path*` },
          ];
        },
      }),
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
