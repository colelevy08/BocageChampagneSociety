/**
 * @file src/hooks/useHaptics.js
 * @description Haptic feedback hook for native platforms.
 * Wraps Capacitor Haptics plugin with safe fallbacks for web.
 * @importedBy src/pages/*.jsx, src/components/*.jsx
 * @imports @capacitor/haptics, src/lib/capacitor.js
 */

import { useCallback } from 'react';
import { isNative } from '../lib/capacitor';

/**
 * Hook providing haptic feedback functions that are no-ops on web.
 *
 * @returns {{ light: Function, medium: Function, heavy: Function, success: Function, error: Function, selection: Function }}
 */
export function useHaptics() {
  /**
   * Triggers haptic feedback with the given style.
   * Dynamically imports Haptics to avoid bundling issues on web.
   * @param {'light'|'medium'|'heavy'} style - Impact style
   */
  const impact = useCallback(async (style = 'medium') => {
    if (!isNative) return;
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      const styles = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };
      await Haptics.impact({ style: styles[style] || ImpactStyle.Medium });
    } catch {
      // Haptics not available
    }
  }, []);

  /**
   * Triggers a success notification haptic.
   */
  const success = useCallback(async () => {
    if (!isNative) return;
    try {
      const { Haptics, NotificationType } = await import('@capacitor/haptics');
      await Haptics.notification({ type: NotificationType.Success });
    } catch {}
  }, []);

  /**
   * Triggers an error notification haptic.
   */
  const error = useCallback(async () => {
    if (!isNative) return;
    try {
      const { Haptics, NotificationType } = await import('@capacitor/haptics');
      await Haptics.notification({ type: NotificationType.Error });
    } catch {}
  }, []);

  /**
   * Triggers selection changed haptic (subtle tap).
   */
  const selection = useCallback(async () => {
    if (!isNative) return;
    try {
      const { Haptics } = await import('@capacitor/haptics');
      await Haptics.selectionChanged();
    } catch {}
  }, []);

  return {
    light: () => impact('light'),
    medium: () => impact('medium'),
    heavy: () => impact('heavy'),
    success,
    error,
    selection,
  };
}
