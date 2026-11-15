// EatInformed Tactile Haptics Engine - GymMane & Apple HIG Aligned
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

let _enabled = true;

// ponytail: safe no-throw haptic wrappers for tactile button presses & drag feedback
export const AppHaptics = {
  setEnabled: (enabled: boolean) => {
    _enabled = enabled;
  },

  isEnabled: () => _enabled,

  selection: () => {
    if (!_enabled) return;
    try {
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync().catch(() => {});
      }
    } catch (_) {}
  },

  impactLight: () => {
    if (!_enabled) return;
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    } catch (_) {}
  },

  impactMedium: () => {
    if (!_enabled) return;
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      }
    } catch (_) {}
  },

  impactHeavy: () => {
    if (!_enabled) return;
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      }
    } catch (_) {}
  },

  success: () => {
    if (!_enabled) return;
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } catch (_) {}
  },

  warning: () => {
    if (!_enabled) return;
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      }
    } catch (_) {}
  },

  error: () => {
    if (!_enabled) return;
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
    } catch (_) {}
  },
};
