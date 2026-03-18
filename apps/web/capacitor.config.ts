import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.marksman.shooting',
  appName: 'Marksman',
  webDir: 'out',

  // Points the Android/iOS WebView at the live Vercel deployment.
  // Avoids a static export and keeps all Next.js dynamic routes working.
  server: {
    url: 'https://shooting-web.vercel.app',
    cleartext: false,
    androidScheme: 'https',
    // Allow the Vercel host to set cookies/tokens that persist in the WebView
    allowNavigation: ['shooting-web.vercel.app'],
  },

  android: {
    backgroundColor: '#080A0F',
    // Let the web content render under the system status bar
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },

  ios: {
    backgroundColor: '#080A0F',
    contentInset: 'automatic',
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: true,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: '#080A0F',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      useDialog: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#080A0F',
      overlaysWebView: true,
    },
    Camera: {
      // Permissions usage descriptions shown to users (iOS)
      // Android descriptions live in AndroidManifest.xml
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
