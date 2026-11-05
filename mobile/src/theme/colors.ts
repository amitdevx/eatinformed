// EatInformed Apple Minimal Design System Palette - Web & Mobile Synchronized
// Full support for both Apple Dark Mode (OLED) and Apple Light Mode

import { useColorScheme } from 'react-native';

export const darkColors = {
  // Brand
  primary: '#30D158', // Apple iOS System Green (Dark)
  primaryDark: '#248A3D',
  primaryLight: '#34C759',
  primaryMuted: 'rgba(48, 209, 88, 0.12)',

  // Background and Surfaces
  background: '#000000', // Pure Black OLED
  surface: '#161618', // Apple System Gray 6 Dark
  surfaceRaised: '#1C1C1E', // Apple System Gray 5 Dark
  surfaceHighlight: '#2C2C2E', // Apple Elevated Surface

  // Borders
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.16)',

  // Typography
  text: '#F5F5F7', // Apple Primary Off-White
  textSecondary: '#86868B', // Apple Muted Gray
  textMuted: '#6E6E73',

  // Semantic
  success: '#30D158',
  successLight: 'rgba(48, 209, 88, 0.12)',
  danger: '#FF453A', // Apple System Red
  dangerLight: 'rgba(255, 69, 58, 0.12)',
  warning: '#FF9F0A', // Apple System Orange
  warningLight: 'rgba(255, 159, 10, 0.12)',
  info: '#0A84FF', // Apple System Blue
  infoLight: 'rgba(10, 132, 255, 0.12)',

  // NOVA Food Processing Classification System
  nova1: '#30D158',
  nova1Bg: 'rgba(48, 209, 88, 0.12)',
  nova1Border: 'rgba(48, 209, 88, 0.25)',

  nova2: '#0A84FF',
  nova2Bg: 'rgba(10, 132, 255, 0.12)',
  nova2Border: 'rgba(10, 132, 255, 0.25)',

  nova3: '#FF9F0A',
  nova3Bg: 'rgba(255, 159, 10, 0.12)',
  nova3Border: 'rgba(255, 159, 10, 0.25)',

  nova4: '#FF453A',
  nova4Bg: 'rgba(255, 69, 58, 0.12)',
  nova4Border: 'rgba(255, 69, 58, 0.25)',
};

export const lightColors = {
  // Brand
  primary: '#34C759', // Apple iOS System Green (Light)
  primaryDark: '#248A3D',
  primaryLight: '#30D158',
  primaryMuted: 'rgba(52, 199, 89, 0.12)',

  // Background and Surfaces
  background: '#F5F5F7', // Apple Light Gray Base
  surface: '#FFFFFF', // Apple Pure White Surface
  surfaceRaised: '#E5E5EA', // Apple System Gray 4
  surfaceHighlight: '#D1D1D6',

  // Borders
  border: 'rgba(0, 0, 0, 0.08)',
  borderStrong: 'rgba(0, 0, 0, 0.16)',

  // Typography
  text: '#1D1D1F', // Apple Primary Dark Slate
  textSecondary: '#86868B', // Apple Muted Gray
  textMuted: '#6E6E73',

  // Semantic
  success: '#34C759',
  successLight: 'rgba(52, 199, 89, 0.12)',
  danger: '#FF3B30',
  dangerLight: 'rgba(255, 59, 48, 0.12)',
  warning: '#FF9500',
  warningLight: 'rgba(255, 149, 0, 0.12)',
  info: '#007AFF',
  infoLight: 'rgba(0, 122, 255, 0.12)',

  // NOVA Food Processing Classification System
  nova1: '#248A3D',
  nova1Bg: 'rgba(52, 199, 89, 0.12)',
  nova1Border: 'rgba(52, 199, 89, 0.25)',

  nova2: '#007AFF',
  nova2Bg: 'rgba(0, 122, 255, 0.12)',
  nova2Border: 'rgba(0, 122, 255, 0.25)',

  nova3: '#C97700',
  nova3Bg: 'rgba(255, 149, 0, 0.12)',
  nova3Border: 'rgba(255, 149, 0, 0.25)',

  nova4: '#D70015',
  nova4Bg: 'rgba(255, 59, 48, 0.12)',
  nova4Border: 'rgba(255, 59, 48, 0.25)',
};

// Default export uses dark colors, with compatibility helper
export const colors = darkColors;

export const useAppThemeColors = () => {
  const scheme = useColorScheme();
  return scheme === 'light' ? lightColors : darkColors;
};

export const getNovaColor = (novaGroup?: number, isLight = false) => {
  const c = isLight ? lightColors : darkColors;
  switch (novaGroup) {
    case 1:
      return {
        text: c.nova1,
        bg: c.nova1Bg,
        border: c.nova1Border,
        label: 'NOVA 1: Whole Food',
      };
    case 2:
      return {
        text: c.nova2,
        bg: c.nova2Bg,
        border: c.nova2Border,
        label: 'NOVA 2: Culinary Base',
      };
    case 3:
      return {
        text: c.nova3,
        bg: c.nova3Bg,
        border: c.nova3Border,
        label: 'NOVA 3: Processed Food',
      };
    case 4:
      return {
        text: c.nova4,
        bg: c.nova4Bg,
        border: c.nova4Border,
        label: 'NOVA 4: Ultra-Processed',
      };
    default:
      return {
        text: c.textSecondary,
        bg: c.surfaceRaised,
        border: c.border,
        label: 'NOVA Classification',
      };
  }
};
