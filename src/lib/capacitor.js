/**
 * @file src/lib/capacitor.js
 * @description Capacitor native initialization for Bocage Champagne Society.
 * Handles splash screen dismissal, status bar styling, push notification setup,
 * and platform detection. Called once from src/main.jsx on app startup.
 * @importedBy src/main.jsx
 * @imports @capacitor/core, @capacitor/splash-screen, @capacitor/status-bar, @capacitor/push-notifications
 */

import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { PushNotifications } from '@capacitor/push-notifications';

/**
 * Whether the app is running in a native Capacitor shell (iOS/Android)
 * vs. a regular web browser.
 * @type {boolean}
 */
export const isNative = Capacitor.isNativePlatform();

/**
 * Returns the current platform: 'ios', 'android', or 'web'.
 * @returns {string} The platform identifier
 */
export const getPlatform = () => Capacitor.getPlatform();

/**
 * Initializes native features on app startup.
 * - Hides the splash screen after a brief delay
 * - Sets the status bar to light text on dark background (native only)
 * - Requests push notification permissions and registers token (native only)
 *
 * Safe to call on web — native-only calls are guarded by isNative check.
 * @returns {Promise<void>}
 */
export async function initializeApp() {
  if (!isNative) return;

  try {
    // Hide splash screen after content is ready
    await SplashScreen.hide({ fadeOutDuration: 300 });
  } catch (e) {
    console.warn('SplashScreen hide failed:', e);
  }

  try {
    // Style status bar for dark luxury theme
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0A0A0A' });
  } catch (e) {
    console.warn('StatusBar setup failed:', e);
  }
}

/**
 * Requests push notification permissions and registers for remote notifications.
 * Returns the device token string if successful, or null on failure/denial.
 * @returns {Promise<string|null>} The push notification device token, or null
 */
export async function registerPushNotifications() {
  if (!isNative) return null;

  try {
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') return null;

    await PushNotifications.register();

    return new Promise((resolve) => {
      PushNotifications.addListener('registration', (token) => {
        resolve(token.value);
      });
      PushNotifications.addListener('registrationError', () => {
        resolve(null);
      });
    });
  } catch (e) {
    console.warn('Push notification registration failed:', e);
    return null;
  }
}
