import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.marksman.shooting',
  appName: 'Marksman',
  webDir: 'out',

  // Points the Android/iOS WebView at the live production deployment.
  server: {
    url: 'https://www.marksmanspro.com',
    cleartext: false,
    androidScheme: 'https',
    allowNavigation: ['www.marksmanspro.com', 'marksmanspro.com'],
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
    // Native Google Sign-In — serverClientId must be the Web OAuth Client ID
    // so the returned ID token is verifiable by the backend (google-auth-library).
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '956705763664-jd9dqcqf3tdknjaflb2gc0iknnf9hmen.apps.googleusercontent.com',
      forceCodeForRefreshToken: false,
    },
  },
};

export default config;
