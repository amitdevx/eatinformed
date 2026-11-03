// EatInformed Design System Colors
// Matches EatInformed website: Pure Black aesthetic with Emerald Green accent

export const colors = {
  // Brand
  primary: '#22C55E',
  primaryDark: '#16A34A',
  primaryLight: '#4ADE80',
  primaryMuted: 'rgba(34, 197, 94, 0.15)',

  // Background and Surfaces
  background: '#000000',
  surface: '#0C0C0E',
  surfaceRaised: '#141417',
  surfaceHighlight: '#1F1F24',

  // Borders
  border: '#1F1F23',
  borderStrong: '#2E2E35',

  // Typography
  text: '#FAFAFA',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',

  // Semantic
  success: '#10B981',
  successLight: 'rgba(16, 185, 129, 0.15)',
  danger: '#EF4444',
  dangerLight: 'rgba(239, 68, 68, 0.15)',
  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.15)',
  info: '#3B82F6',
  infoLight: 'rgba(59, 130, 246, 0.15)',

  // NOVA Food Processing Classification System
  nova1: '#10B981',
  nova1Bg: 'rgba(16, 185, 129, 0.15)',
  nova1Border: 'rgba(16, 185, 129, 0.3)',

  nova2: '#3B82F6',
  nova2Bg: 'rgba(59, 130, 246, 0.15)',
  nova2Border: 'rgba(59, 130, 246, 0.3)',

  nova3: '#F59E0B',
  nova3Bg: 'rgba(245, 158, 11, 0.15)',
  nova3Border: 'rgba(245, 158, 11, 0.3)',

  nova4: '#F43F5E',
  nova4Bg: 'rgba(244, 63, 94, 0.15)',
  nova4Border: 'rgba(244, 63, 94, 0.3)',
};

export const getNovaColor = (novaGroup?: number) => {
  switch (novaGroup) {
    case 1:
      return {
        text: colors.nova1,
        bg: colors.nova1Bg,
        border: colors.nova1Border,
        label: 'NOVA 1: Unprocessed / Minimal',
      };
    case 2:
      return {
        text: colors.nova2,
        bg: colors.nova2Bg,
        border: colors.nova2Border,
        label: 'NOVA 2: Culinary Ingredients',
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
