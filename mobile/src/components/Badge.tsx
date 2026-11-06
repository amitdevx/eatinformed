import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
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

export function Badge({
  label,
  variant = 'default',
  size = 'sm',
  icon,
  style,
  textStyle,
}: BadgeProps) {
  const { colors } = useTheme();
  const isSm = size === 'sm';

  const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
    default: {
      bg: colors.surfaceRaised,
      text: colors.textSecondary,
      border: colors.border,
    },
    primary: {
      bg: colors.primaryMuted,
      text: colors.primary,
      border: colors.primaryBorder,
    },
    success: {
      bg: colors.successLight,
      text: colors.successText,
      border: colors.successBorder,
    },
    danger: {
      bg: colors.dangerLight,
      text: colors.dangerText,
      border: colors.dangerBorder,
    },
    warning: {
      bg: colors.warningLight,
      text: colors.warningText,
      border: colors.warningBorder,
    },
    info: {
      bg: colors.infoLight,
      text: colors.infoText,
      border: colors.infoBorder,
    },
    secondary: {
      bg: colors.surfaceHighlight,
      text: colors.text,
      border: colors.borderStrong,
    },
  };

  const currentVariant = variantStyles[variant];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: currentVariant.bg,
          borderColor: currentVariant.border,
          paddingVertical: isSm ? 4 : 6,
          paddingHorizontal: isSm ? 10 : 13,
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
            fontSize: isSm ? typography.fontSizes.caption2 : typography.fontSizes.xs,
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
    letterSpacing: 0.1,
  },
});
