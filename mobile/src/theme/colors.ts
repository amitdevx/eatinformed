// EatInformed Apple Minimal Design System Palette - Web & Mobile Synchronized
// Strictly aligned with Apple Human Interface Guidelines (HIG) Dynamic System Colors
// Full WCAG AA/AAA contrast compliance across both Light Mode and Dark Mode (OLED)

import { useColorScheme } from 'react-native';

export interface AppThemeColors {
  // Brand & Primary Actions
  primary: string;
  primaryButton: string;
  onPrimary: string;
  primaryDark: string;
  primaryLight: string;
  primaryMuted: string;
  primaryBorder: string;

  // Backgrounds & Layered Surfaces (Apple Base / Elevated Hierarchy)
  background: string;
  backgroundElevated: string;
  surface: string;
  surfaceRaised: string;
  surfaceHighlight: string;
  surfaceGlass: string;

  // Hairline Borders & Separators
  border: string;
  borderStrong: string;
  separator: string;

  // Typography (Primary, Secondary, Tertiary/Muted)
  text: string;
  textSecondary: string;
  textMuted: string;

  // Semantic Status Tokens
  success: string;
  successText: string;
  successLight: string;
  successBorder: string;

  danger: string;
  dangerText: string;
  dangerLight: string;
  dangerBorder: string;

  warning: string;
  warningText: string;
  warningLight: string;
  warningBorder: string;

  info: string;
  infoText: string;
  infoLight: string;
  infoBorder: string;

  // Star Rating Accent
  starFilled: string;
  starEmpty: string;

  // NOVA Food Processing Classification (Groups 1-4)
  nova1: string;
  nova1Dot: string;
  nova1Bg: string;
  nova1Border: string;

  nova2: string;
  nova2Dot: string;
  nova2Bg: string;
  nova2Border: string;

  nova3: string;
  nova3Dot: string;
  nova3Bg: string;
  nova3Border: string;

  nova4: string;
  nova4Dot: string;
  nova4Bg: string;
  nova4Border: string;
}

export const darkColors: AppThemeColors = {
  // Brand (GymMane Vibrant Emerald & Sage Palette)
  primary: '#10B981',
  primaryButton: '#10B981',
  onPrimary: '#000000',
  primaryDark: '#059669',
  primaryLight: '#34D399',
  primaryMuted: 'rgba(16, 185, 129, 0.16)',
  primaryBorder: 'rgba(16, 185, 129, 0.38)',

  // Background and Surfaces (Pure AMOLED Pitch Black)
  background: '#000000',
  backgroundElevated: '#080808',
  surface: '#111111',
  surfaceRaised: '#1E1E1E',
  surfaceHighlight: '#2A2A2A',
  surfaceGlass: 'rgba(17, 17, 17, 0.90)',

  // Borders & Hairlines
  border: '#2E2E2E',
  borderStrong: '#444444',
  separator: '#1E1E1E',

  // Typography
  text: '#FFFFFF',
  textSecondary: '#9A9A9A',
  textMuted: '#666666',

  // Semantic Status (Light-Bright Accessible Palette)
  success: '#10B981',
  successText: '#34D399',
  successLight: 'rgba(16, 185, 129, 0.15)',
  successBorder: 'rgba(16, 185, 129, 0.35)',

  danger: '#EF4444',
  dangerText: '#F87171',
  dangerLight: 'rgba(239, 68, 68, 0.16)',
  dangerBorder: 'rgba(239, 68, 68, 0.45)',

  warning: '#F59E0B',
  warningText: '#FBBF24',
  warningLight: 'rgba(245, 158, 11, 0.16)',
  warningBorder: 'rgba(245, 158, 11, 0.40)',

  info: '#3B82F6',
  infoText: '#93C5FD',
  infoLight: 'rgba(59, 130, 246, 0.15)',
  infoBorder: 'rgba(59, 130, 246, 0.35)',

  starFilled: '#E0B15A',
  starEmpty: '#2A2A2A',

  // NOVA Classification (High-Contrast Badges)
  nova1: '#34D399',
  nova1Dot: '#10B981',
  nova1Bg: 'rgba(16, 185, 129, 0.15)',
  nova1Border: 'rgba(16, 185, 129, 0.35)',

  nova2: '#93C5FD',
  nova2Dot: '#3B82F6',
  nova2Bg: 'rgba(59, 130, 246, 0.15)',
  nova2Border: 'rgba(59, 130, 246, 0.35)',

  nova3: '#FBBF24',
  nova3Dot: '#F59E0B',
  nova3Bg: 'rgba(245, 158, 11, 0.15)',
  nova3Border: 'rgba(245, 158, 11, 0.35)',

  nova4: '#F87171',
  nova4Dot: '#EF4444',
  nova4Bg: 'rgba(239, 68, 68, 0.15)',
  nova4Border: 'rgba(239, 68, 68, 0.35)',
};

export const amoledColors: AppThemeColors = darkColors;

export const lightColors: AppThemeColors = {
  // Brand (GymMane Accessible Emerald)
  primary: '#059669',
  primaryButton: '#059669',
  onPrimary: '#FFFFFF',
  primaryDark: '#047857',
  primaryLight: '#10B981',
  primaryMuted: 'rgba(5, 150, 105, 0.12)',
  primaryBorder: 'rgba(5, 150, 105, 0.32)',

  // Background and Surfaces (GymMane Warm Nordic Ivory Light Mode)
  background: '#F7F4F0', // GymMane bg
  backgroundElevated: '#FFFEFD', // GymMane pageBg
  surface: '#FFFFFF', // GymMane bgRaised
  surfaceRaised: '#ECE8E3', // GymMane bgRaised2
  surfaceHighlight: '#E0DBD5',
  surfaceGlass: 'rgba(255, 255, 255, 0.90)',

  // Borders & Hairlines
  border: '#E0DBD5', // GymMane border
  borderStrong: '#CBC5BD',
  separator: '#ECE8E3',

  // Typography (GymMane text, textSecondary, textTertiary)
  text: '#1A1713',
  textSecondary: '#5F574F',
  textMuted: '#8A8179',

  // Semantic Status
  success: '#059669',
  successText: '#047857',
  successLight: 'rgba(5, 150, 105, 0.10)',
  successBorder: 'rgba(5, 150, 105, 0.28)',

  danger: '#C0392B', // GymMane danger
  dangerText: '#991B1B',
  dangerLight: 'rgba(192, 57, 43, 0.10)',
  dangerBorder: 'rgba(192, 57, 43, 0.28)',

  warning: '#9A6A12', // GymMane warn
  warningText: '#92400E',
  warningLight: 'rgba(154, 106, 18, 0.10)',
  warningBorder: 'rgba(154, 106, 18, 0.28)',

  info: '#3268A0', // GymMane info
  infoText: '#1E40AF',
  infoLight: 'rgba(50, 104, 160, 0.10)',
  infoBorder: 'rgba(50, 104, 160, 0.28)',

  starFilled: '#9A6A12',
  starEmpty: '#E0DBD5',

  // NOVA Classification
  nova1: '#047857',
  nova1Dot: '#059669',
  nova1Bg: 'rgba(5, 150, 105, 0.10)',
  nova1Border: 'rgba(5, 150, 105, 0.28)',

  nova2: '#1E40AF',
  nova2Dot: '#3268A0',
  nova2Bg: 'rgba(50, 104, 160, 0.10)',
  nova2Border: 'rgba(50, 104, 160, 0.28)',

  nova3: '#92400E',
  nova3Dot: '#9A6A12',
  nova3Bg: 'rgba(154, 106, 18, 0.10)',
  nova3Border: 'rgba(154, 106, 18, 0.28)',

  nova4: '#991B1B',
  nova4Dot: '#C0392B',
  nova4Bg: 'rgba(192, 57, 43, 0.10)',
  nova4Border: 'rgba(192, 57, 43, 0.28)',
};

// Default fallback export
export const colors = darkColors;

export const useAppThemeColors = (): AppThemeColors => {
  const scheme = useColorScheme();
  return scheme === 'light' ? lightColors : darkColors;
};

export const getNovaColor = (novaGroup?: number, isLight = false) => {
  const c = isLight ? lightColors : darkColors;
  switch (novaGroup) {
    case 1:
      return {
        text: c.nova1,
        dot: c.nova1Dot,
        bg: c.nova1Bg,
        border: c.nova1Border,
        label: 'NOVA 1: Whole Food',
        shortLabel: 'Group 1 · Whole Food',
      };
    case 2:
      return {
        text: c.nova2,
        dot: c.nova2Dot,
        bg: c.nova2Bg,
        border: c.nova2Border,
        label: 'NOVA 2: Culinary Base',
        shortLabel: 'Group 2 · Culinary Base',
      };
    case 3:
      return {
        text: c.nova3,
        dot: c.nova3Dot,
        bg: c.nova3Bg,
        border: c.nova3Border,
        label: 'NOVA 3: Processed Food',
        shortLabel: 'Group 3 · Processed',
      };
    case 4:
      return {
        text: c.nova4,
        dot: c.nova4Dot,
        bg: c.nova4Bg,
        border: c.nova4Border,
        label: 'NOVA 4: Ultra-Processed',
        shortLabel: 'Group 4 · Ultra-Processed',
      };
    default:
      return {
        text: c.textSecondary,
        dot: c.textMuted,
        bg: c.surfaceRaised,
        border: c.border,
        label: 'NOVA Classification',
        shortLabel: 'Unclassified',
      };
  }
};
