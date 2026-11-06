// EatInformed Design System Tokens - Apple HIG Dynamic Type & Spatial Grid Aligned

import { Platform, ViewStyle } from 'react-native';

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

// Apple iOS Dynamic Type Scale (Default 'Large' Size)
export const typography = {
  fontSizes: {
    caption2: 11,
    xs: 12, // Caption 1
    sm: 13, // Footnote
    subhead: 15, // Subheadline
    base: 16, // Callout
    md: 17, // Body / Headline
    lg: 20, // Title 3
    xl: 22, // Title 2
    xxl: 28, // Title 1
    xxxl: 34, // Large Title
  },
  lineHeights: {
    caption2: 14,
    xs: 16,
    sm: 18,
    subhead: 20,
    base: 22,
    md: 23,
    lg: 25,
    xl: 28,
    xxl: 34,
    xxxl: 41,
  },
  letterSpacing: {
    tight: -0.6,
    title: -0.4,
    body: -0.2,
    normal: 0,
    caps: 0.6,
  },
  fontWeights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    black: '800' as const,
  },
};

export const borderRadius = {
  xs: 8,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 24,
  full: 9999,
};

export const layout = {
  screenPadding: spacing.lg, // 20pt Apple generous horizontal margin
  cardRadius: borderRadius.lg, // 20pt continuous squircle approximation
  buttonRadius: borderRadius.full,
  minTouchTarget: 44, // Apple HIG 44x44pt minimum hit target
};

export const getCardShadow = (isDark: boolean): ViewStyle => {
  if (isDark) {
    return {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 4,
    };
  }
  return {
    shadowColor: '#1C1C1E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  };
};
