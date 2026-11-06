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
  // Brand (Apple System Green Dark #30D158)
  primary: '#30D158',
  primaryButton: '#30D158',
  onPrimary: '#031A09',
  primaryDark: '#248A3D',
  primaryLight: '#4ADE80',
  primaryMuted: '#0D2818',
  primaryBorder: '#1E4E30',

  // Background and Surfaces (True OLED + Apple Elevated Dark Greys)
  background: '#000000', // Pure Black OLED (systemBackground)
  backgroundElevated: '#0B0B0E',
  surface: '#161618', // Level 1 Card Surface (secondarySystemGroupedBackground)
  surfaceRaised: '#222226', // Level 2 Nested Control / Input (tertiarySystemGroupedBackground)
  surfaceHighlight: '#2C2C31', // Level 3 Active Segment / Pressed State
  surfaceGlass: 'rgba(22, 22, 24, 0.86)',

  // Borders & Hairlines
  border: '#26262A',
  borderStrong: '#38383E',
  separator: '#222226',

  // Typography (WCAG AAA/AA Verified on #000000, #161618, and #222226)
  text: '#F5F5F7', // 16.4:1 on surface
  textSecondary: '#AEAEB2', // 8.2:1 on surface (Apple systemGray2 Dark)
  textMuted: '#8E8E93', // 5.4:1 on surface (Apple systemGray Dark)

  // Semantic Status
  success: '#30D158',
  successText: '#4ADE80',
  successLight: '#0D2818',
  successBorder: '#1E4E30',

  danger: '#FF453A',
  dangerText: '#FF6961',
  dangerLight: '#2C1215',
  dangerBorder: '#582226',

  warning: '#FF9F0A',
  warningText: '#FBBF24',
  warningLight: '#2A1C08',
  warningBorder: '#523610',

  info: '#0A84FF',
  infoText: '#60A5FA',
  infoLight: '#0C2340',
  infoBorder: '#1E3A5F',

  starFilled: '#FBBF24',
  starEmpty: '#2C2C31',

  // NOVA Classification (High-Contrast Dark Mode Pills)
  nova1: '#4ADE80',
  nova1Dot: '#30D158',
  nova1Bg: '#0D2818',
  nova1Border: '#1E4E30',

  nova2: '#60A5FA',
  nova2Dot: '#0A84FF',
  nova2Bg: '#0C2340',
  nova2Border: '#1E3A5F',

  nova3: '#FBBF24',
  nova3Dot: '#FF9F0A',
  nova3Bg: '#2A1C08',
  nova3Border: '#523610',

  nova4: '#FF6961',
  nova4Dot: '#FF453A',
  nova4Bg: '#2C1215',
  nova4Border: '#582226',
};

export const lightColors: AppThemeColors = {
  // Brand (Apple Accessible Green Light)
  primary: '#1E8E3E',
  primaryButton: '#1E8E3E',
  onPrimary: '#FFFFFF',
  primaryDark: '#166534',
  primaryLight: '#34C759',
  primaryMuted: '#E8F8ED',
  primaryBorder: '#A7F3D0',

  // Background and Surfaces (Apple Grouped Light Background + Pure White Cards)
  background: '#F2F2F7', // Apple systemGroupedBackground Light
  backgroundElevated: '#FFFFFF',
  surface: '#FFFFFF', // Pure White Card Surface
  surfaceRaised: '#F2F2F7', // Nested Input / Pill / Table Header Surface
  surfaceHighlight: '#E5E5EA', // Active Segment / Pressed State
  surfaceGlass: 'rgba(255, 255, 255, 0.88)',

  // Borders & Hairlines
  border: '#E5E5EA',
  borderStrong: '#D1D1D6',
  separator: '#EBEBF0',

  // Typography (WCAG AAA/AA Verified on #FFFFFF and #F2F2F7)
  text: '#1C1C1E', // 17.4:1 on #FFFFFF
  textSecondary: '#48484A', // 8.4:1 on #FFFFFF, 7.5:1 on #F2F2F7
  textMuted: '#636366', // 5.7:1 on #FFFFFF, 5.1:1 on #F2F2F7

  // Semantic Status
  success: '#1E8E3E',
  successText: '#166534',
  successLight: '#E8F8ED',
  successBorder: '#A7F3D0',

  danger: '#D70015',
  dangerText: '#C41224',
  dangerLight: '#FFEBEE',
  dangerBorder: '#FECDD3',

  warning: '#B45309',
  warningText: '#9A4D00',
  warningLight: '#FFF4E5',
  warningBorder: '#FDE68A',

  info: '#007AFF',
  infoText: '#0055B3',
  infoLight: '#EBF5FF',
  infoBorder: '#BAE6FD',

  starFilled: '#D97706',
  starEmpty: '#E5E5EA',

  // NOVA Classification (High-Contrast Accessible Light Mode Pills)
  nova1: '#166534',
  nova1Dot: '#1E8E3E',
  nova1Bg: '#E8F8ED',
  nova1Border: '#A7F3D0',

  nova2: '#0055B3',
  nova2Dot: '#007AFF',
  nova2Bg: '#EBF5FF',
  nova2Border: '#BAE6FD',

  nova3: '#9A4D00',
  nova3Dot: '#D97706',
  nova3Bg: '#FFF4E5',
  nova3Border: '#FDE68A',

  nova4: '#C41224',
  nova4Dot: '#D70015',
  nova4Bg: '#FFEBEE',
  nova4Border: '#FECDD3',
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
