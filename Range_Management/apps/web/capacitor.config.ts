import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.marksman.rangeapp',
  appName: 'Marksman Range',
  webDir: 'out',

  // Uses local bundled web assets from 'out' for offline & local backend operation.
  server: {
    androidScheme: 'http',
    cleartext: true,
  },

  android: {
    backgroundColor: '#080A0F',
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
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
    CapacitorHealth: {
      // @capgo/capacitor-health — Health Connect (Android) + HealthKit (iOS)
    },
    // Native Google Sign-In.
    // The plugin's Android load() reads "androidClientId" then "clientId" (NOT "serverClientId").
    // Both must be the Web OAuth Client ID so the returned ID token is verifiable by the backend.
    GoogleAuth: {
      scopes: ['profile', 'email'],
      clientId: '956705763664-jd9dqcqf3tdknjaflb2gc0iknnf9hmen.apps.googleusercontent.com',
      serverClientId: '956705763664-jd9dqcqf3tdknjaflb2gc0iknnf9hmen.apps.googleusercontent.com',
      forceCodeForRefreshToken: false,
    },
  },
};

export default config;
