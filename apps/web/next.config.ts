// apps/web/next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@shooting-platform/shared-types'],
  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
};

export default nextConfig;
