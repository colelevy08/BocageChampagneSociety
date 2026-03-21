/**
 * @file capacitor.config.ts
 * @description Capacitor configuration for native iOS and Android builds.
 * Defines app identity, web directory, and native plugin settings.
 * @connects dist/ (built web assets synced to native projects)
 */

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bocage.champagnesociety',
  appName: 'Bocage Society',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#0A0A0A',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#0A0A0A',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
