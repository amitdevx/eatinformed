import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme/ThemeContext';

interface GlassSurfaceProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
  intensity?: number;
  hasBorder?: boolean;
  tint?: 'light' | 'dark' | 'default';
}

// ponytail: GymMane-grade specular frosted glass surface with subtle hairline highlight
export function GlassSurface({
  children,
  style,
  borderRadius = 28,
  intensity = 26,
  hasBorder = true,
  tint,
}: GlassSurfaceProps) {
  const { colors, isDark } = useTheme();

  const selectedTint = tint || (isDark ? 'dark' : 'light');
  const fallbackBg = isDark
    ? 'rgba(18, 18, 20, 0.78)'
    : 'rgba(255, 255, 255, 0.85)';

  const specularBorderColor = isDark
    ? 'rgba(255, 255, 255, 0.09)'
    : 'rgba(0, 0, 0, 0.08)';

  return (
    <View
      style={[
        styles.outerContainer,
        {
          borderRadius,
          backgroundColor: fallbackBg,
          borderColor: hasBorder ? specularBorderColor : 'transparent',
          borderWidth: hasBorder ? 1 : 0,
        },
        style,
      ]}
    >
      <BlurView
        intensity={intensity}
        tint={selectedTint}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    overflow: 'hidden',
    position: 'relative',
  },
});
