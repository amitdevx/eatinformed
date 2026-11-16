import React, { createContext, useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { Easing, SharedValue, useReducedMotion } from 'react-native-reanimated';
export const motion = {
  entranceMs: 560, staggerMs: 70, initialDelayMs: 40,
  easeOut: Easing.out(Easing.cubic),
  settle: { duration: 400, dampingRatio: 0.8 },
  sheet: { duration: 300, dampingRatio: 0.8 },
};
export const ScrollMotionContext = createContext<SharedValue<number> | null>(null);
export function useMotionPreference() {
  const initial = useReducedMotion();
  const [reduced, setReduced] = useState(initial);
  useEffect(() => { const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced); return () => subscription.remove(); }, []);
  return reduced;
}
