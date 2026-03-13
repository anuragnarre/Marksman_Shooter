// apps/web/next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@shooting-platform/shared-types'],
};

export default nextConfig;
