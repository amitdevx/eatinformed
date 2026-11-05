// EatInformed Apple Minimal Design System Palette
// Pure Black OLED backdrop with iOS System Green accent and clean dark surfaces

export const colors = {
  // Brand
  primary: '#30D158', // Apple iOS System Green
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

export const getNovaColor = (novaGroup?: number) => {
  switch (novaGroup) {
    case 1:
      return {
        text: colors.nova1,
        bg: colors.nova1Bg,
        border: colors.nova1Border,
        label: 'NOVA 1: Whole Food',
      };
    case 2:
      return {
        text: colors.nova2,
        bg: colors.nova2Bg,
        border: colors.nova2Border,
        label: 'NOVA 2: Culinary Base',
      };
    case 3:
      return {
        text: colors.nova3,
        bg: colors.nova3Bg,
        border: colors.nova3Border,
        label: 'NOVA 3: Processed Food',
      };
    case 4:
      return {
        text: colors.nova4,
        bg: colors.nova4Bg,
        border: colors.nova4Border,
        label: 'NOVA 4: Ultra-Processed',
      };
    default:
      return {
        text: colors.textSecondary,
        bg: colors.surfaceRaised,
        border: colors.border,
        label: 'NOVA Classification',
      };
  }
};
