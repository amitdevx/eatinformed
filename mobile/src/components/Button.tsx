import React from 'react';
import {
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { PressableScale } from '../theme/animations';
import { borderRadius, layout, spacing, typography } from '../theme/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  style?: ViewStyle;
  textStyle?: TextStyle;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
}: ButtonProps) {
  const { colors } = useTheme();

  const getBackgroundColor = (): string => {
    if (disabled) return colors.surfaceRaised;
    switch (variant) {
      case 'primary':
        return colors.primaryButton;
      case 'secondary':
        return colors.surfaceRaised;
      case 'outline':
      case 'ghost':
        return 'transparent';
      case 'danger':
        return colors.dangerLight;
      default:
        return colors.primaryButton;
    }
  };

  const getTextColor = (): string => {
    if (disabled) return colors.textMuted;
    switch (variant) {
      case 'primary':
        return colors.onPrimary;
      case 'secondary':
        return colors.text;
      case 'outline':
        return colors.primary;
      case 'danger':
        return colors.dangerText;
      case 'ghost':
        return colors.textSecondary;
      default:
        return colors.onPrimary;
    }
  };

  const getBorderColor = (): string => {
    if (disabled) return colors.border;
    if (variant === 'outline') return colors.primaryBorder;
    if (variant === 'secondary') return colors.border;
    if (variant === 'danger') return colors.dangerBorder;
    return 'transparent';
  };

  const sizeStyles: Record<
    ButtonSize,
    { paddingVertical: number; paddingHorizontal: number; minHeight: number; fontSize: number }
  > = {
    sm: {
      paddingVertical: 9,
      paddingHorizontal: 16,
      minHeight: 40,
      fontSize: typography.fontSizes.sm,
    },
    md: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      minHeight: layout.minTouchTarget,
      fontSize: typography.fontSizes.subhead,
    },
    lg: {
      paddingVertical: 15,
      paddingHorizontal: 26,
      minHeight: 52,
      fontSize: typography.fontSizes.base,
    },
  };

  const currentSize = sizeStyles[size];
  const hasBorder = variant === 'outline' || variant === 'secondary' || variant === 'danger';

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      scaleTo={0.975}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: hasBorder ? 1 : 0,
          paddingVertical: currentSize.paddingVertical,
          paddingHorizontal: currentSize.paddingHorizontal,
          minHeight: currentSize.minHeight,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && <View style={styles.leftIcon}>{icon}</View>}
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize: currentSize.fontSize,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && <View style={styles.rightIcon}>{icon}</View>}
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: typography.fontWeights.semibold,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
});
