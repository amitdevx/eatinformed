import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../theme/colors';
import { borderRadius, spacing, typography } from '../theme/tokens';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'secondary';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  default: {
    bg: colors.surfaceRaised,
    text: colors.textSecondary,
    border: colors.border,
  },
  primary: {
    bg: colors.primaryMuted,
    text: colors.primary,
    border: 'rgba(34, 197, 94, 0.3)',
  },
  success: {
    bg: colors.successLight,
    text: colors.success,
    border: 'rgba(16, 185, 129, 0.3)',
  },
  danger: {
    bg: colors.dangerLight,
    text: colors.danger,
    border: 'rgba(239, 68, 68, 0.3)',
  },
  warning: {
    bg: colors.warningLight,
    text: colors.warning,
    border: 'rgba(245, 158, 11, 0.3)',
  },
  info: {
    bg: colors.infoLight,
    text: colors.info,
    border: 'rgba(59, 130, 246, 0.3)',
  },
  secondary: {
    bg: colors.surfaceHighlight,
    text: colors.text,
    border: colors.borderStrong,
  },
};

export function Badge({
  label,
  variant = 'default',
  size = 'sm',
  icon,
  style,
  textStyle,
}: BadgeProps) {
  const currentVariant = variantStyles[variant];
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: currentVariant.bg,
          borderColor: currentVariant.border,
          paddingVertical: isSm ? 2 : 4,
          paddingHorizontal: isSm ? 8 : 12,
        },
        style,
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text
        style={[
          styles.text,
          {
            color: currentVariant.text,
            fontSize: isSm ? typography.fontSizes.xs : typography.fontSizes.sm,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: spacing.xs,
  },
  text: {
    fontWeight: typography.fontWeights.semibold,
    letterSpacing: 0.3,
  },
});
