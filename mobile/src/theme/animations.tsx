// EatInformed Apple Fluid Motion & Spring Physics System
// Grounded in Apple WWDC18 "Designing Fluid Interfaces" & WWDC23 "Animate with Springs"

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  ViewStyle,
  StyleProp,
  AccessibilityInfo,
} from 'react-native';

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
  translateY?: number;
  scaleFrom?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Apple-style staggered spring entrance container.
 * Animates opacity (0 -> 1), translateY (offset -> 0), and scale (0.98 -> 1).
 */
export function FadeInView({
  children,
  delay = 0,
  translateY = 12,
  scaleFrom = 0.985,
  style,
}: FadeInViewProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(translateY)).current;
  const scale = useRef(new Animated.Value(scaleFrom)).current;

  useEffect(() => {
    let isMounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduceMotion) => {
        if (!isMounted) return;
        if (reduceMotion) {
          opacity.setValue(1);
          translate.setValue(0);
          scale.setValue(1);
          return;
        }
        Animated.parallel([
          Animated.spring(opacity, {
            toValue: 1,
            delay,
            ...SpringPresets.gentle,
          }),
          Animated.spring(translate, {
            toValue: 0,
            delay,
            ...SpringPresets.gentle,
          }),
          Animated.spring(scale, {
            toValue: 1,
            delay,
            ...SpringPresets.gentle,
          }),
        ]).start();
      })
      .catch(() => {
        Animated.parallel([
          Animated.spring(opacity, {
            toValue: 1,
            delay,
            ...SpringPresets.gentle,
          }),
          Animated.spring(translate, {
            toValue: 0,
            delay,
            ...SpringPresets.gentle,
          }),
          Animated.spring(scale, {
            toValue: 1,
            delay,
            ...SpringPresets.gentle,
          }),
        ]).start();
      });

    return () => {
      isMounted = false;
    };
  }, [delay, opacity, scale, translate]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ translateY: translate }, { scale }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

interface PressableScaleProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'tab' | 'link';
  hitSlop?: { top?: number; bottom?: number; left?: number; right?: number };
}

/**
 * Tactile iOS spring pressable wrapper.
 * Compresses smoothly to `scaleTo` (default 0.97) on touch-down and springs back on release.
 */
export function PressableScale({
  children,
  onPress,
  disabled = false,
  scaleTo = 0.97,
  style,
  accessibilityLabel,
  accessibilityRole = 'button',
  hitSlop,
}: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: scaleTo,
      ...SpringPresets.snappy,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      ...SpringPresets.snappy,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      hitSlop={hitSlop}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
