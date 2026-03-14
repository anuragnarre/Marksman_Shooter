import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.marksman.shooting',
  appName: 'Marksman',
  webDir: 'out',
  // Points the Android WebView at the live Vercel deployment.
  // No static export needed — all Next.js routes work including dynamic ones.
  server: {
    url: 'https://shooting-web.vercel.app',
    cleartext: false,
  },
  android: {
    backgroundColor: '#080A0F',
  },
};

export default config;
