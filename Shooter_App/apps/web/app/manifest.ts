import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MARKSMAN — Shooting Analytics',
    short_name: 'MARKSMAN',
    description: 'Precision training analytics for elite competitive shooters and coaches.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#080A0F',
    theme_color: '#F5A623',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
