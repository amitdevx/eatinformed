import Reanimated, { useAnimatedStyle, useSharedValue, withDelay, withTiming, cancelAnimation } from 'react-native-reanimated';
import { motion, ScrollMotionContext, useMotionPreference } from './motion';
// EatInformed Apple Fluid Motion & Spring Physics System
// Grounded in Apple WWDC18 "Designing Fluid Interfaces" & WWDC23 "Animate with Springs"

import React, { useEffect, useRef, useContext } from 'react';
import {
  Animated,
  Pressable,
  ViewStyle,
  StyleProp,
  StyleSheet,
  AccessibilityInfo,
} from 'react-native';
import { AppHaptics } from '../lib/haptics';

export const SpringPresets = {
  // Critically damped (zeta ~ 1.0): fast, responsive micro-interactions & press feedback
  snappy: {
    stiffness: 380,
    damping: 28,
    mass: 1,
    useNativeDriver: true,
  },
  // Smooth fluid transition for segmented controls, sheets, and layout reveals
  fluid: {
    stiffness: 280,
    damping: 26,
    mass: 1,
    useNativeDriver: true,
  },
  // Gentle card cascade entrance
  gentle: {
    stiffness: 210,
    damping: 24,
    mass: 1,
    useNativeDriver: true,
  },
  // Subtle underdamped bounce (zeta ~ 0.78) for score badges and stars
  bouncy: {
    stiffness: 320,
    damping: 19,
    mass: 0.9,
    useNativeDriver: true,
  },
};

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  depth?: boolean;
  translateY?: number;
  scaleFrom?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Apple-style staggered spring entrance container.
 * Animates opacity (0 -> 1), translateY (offset -> 0), and scale (0.98 -> 1).
 */
export function FadeInView({ children, delay = 40, translateY = 22, scaleFrom = 0.97, depth = false, style }: FadeInViewProps) {
  const reduced = useMotionPreference(), scroll = useContext(ScrollMotionContext);
  const reveal = useSharedValue(0), top = useSharedValue(0), height = useSharedValue(1);
  useEffect(() => {
    reveal.set(reduced ? 1 : withDelay(Math.min(delay, 530), withTiming(1, { duration: motion.entranceMs, easing: motion.easeOut })));
    return () => cancelAnimation(reveal);
  }, [reduced, delay, reveal]);
  const animated = useAnimatedStyle(() => {
    const start = Math.max(0, top.get() - 64);
    const progress = depth && scroll && !reduced ? Math.max(0, Math.min(1, (scroll.get() - start) / Math.max(1, top.get() + height.get() - start))) : 0;
    return { opacity: reveal.get() * (1 - progress * 0.45), transform: [{ translateY: reduced ? 0 : (1 - reveal.get()) * translateY + progress * height.get() * 0.18 }, { scale: reduced ? 1 : scaleFrom + (1 - scaleFrom) * reveal.get() - progress * 0.08 }] };
  });
  return <Reanimated.View onLayout={e => { top.set(e.nativeEvent.layout.y); height.set(e.nativeEvent.layout.height); }} style={[style, animated]}>{children}</Reanimated.View>;
}

interface PressableScaleProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  scaleTo?: number;
  haptic?: 'selection' | 'light' | 'medium' | 'heavy' | 'none';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'tab' | 'link';
  hitSlop?: { top?: number; bottom?: number; left?: number; right?: number };
}

/**
 * Tactile iOS spring pressable wrapper.
 * Compresses smoothly to `scaleTo` (default 0.97) on touch-down and springs back on release.
 * Features built-in GymMane-grade haptic clicks on press & long press.
 */
export function PressableScale({
  children,
  onPress,
  onLongPress,
  disabled = false,
  scaleTo = 0.97,
  haptic = 'selection',
  style,
  accessibilityLabel,
  accessibilityRole = 'button',
  hitSlop,
}: PressableScaleProps) {
  const reduced = useMotionPreference();
  const scale = useRef(new Animated.Value(1)).current;
  const flatStyle = StyleSheet.flatten(style) || {};

  // ponytail: extract outer flexbox & dimensions to outer Pressable so Yoga properly sizes full-width buttons
  const {
    width,
    minWidth,
    maxWidth,
    flex,
    flexGrow,
    flexShrink,
    alignSelf,
    margin,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    marginHorizontal,
    marginVertical,
    ...innerStyle
  } = flatStyle;

  const outerLayoutStyle: ViewStyle = {
    ...(width !== undefined ? { width } : {}),
    ...(minWidth !== undefined ? { minWidth } : {}),
    ...(maxWidth !== undefined ? { maxWidth } : {}),
    ...(flex !== undefined ? { flex } : {}),
    ...(flexGrow !== undefined ? { flexGrow } : {}),
    ...(flexShrink !== undefined ? { flexShrink } : {}),
    ...(alignSelf !== undefined ? { alignSelf } : {}),
    ...(margin !== undefined ? { margin } : {}),
    ...(marginTop !== undefined ? { marginTop } : {}),
    ...(marginBottom !== undefined ? { marginBottom } : {}),
    ...(marginLeft !== undefined ? { marginLeft } : {}),
    ...(marginRight !== undefined ? { marginRight } : {}),
    ...(marginHorizontal !== undefined ? { marginHorizontal } : {}),
    ...(marginVertical !== undefined ? { marginVertical } : {}),
  };

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: reduced ? 1 : scaleTo,
      ...SpringPresets.snappy,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      ...SpringPresets.snappy,
    }).start();
  };

  const handlePress = () => {
    if (disabled) return;
    if (haptic === 'selection') AppHaptics.selection();
    else if (haptic === 'light') AppHaptics.impactLight();
    else if (haptic === 'medium') AppHaptics.impactMedium();
    else if (haptic === 'heavy') AppHaptics.impactHeavy();
    onPress?.();
  };

  const handleLongPress = () => {
    if (disabled || !onLongPress) return;
    AppHaptics.impactHeavy();
    onLongPress();
  };

  return (
    <Pressable
      onPress={onPress ? handlePress : undefined}
      onLongPress={onLongPress ? handleLongPress : undefined}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      hitSlop={hitSlop}
      style={outerLayoutStyle}
    >
      <Animated.View
        style={[
          innerStyle,
          width === '100%' ? { width: '100%' } : null,
          { transform: [{ scale }] },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
