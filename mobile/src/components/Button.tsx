import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { colors } from '../theme/colors';
import { borderRadius, spacing, typography } from '../theme/tokens';

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
  const getBackgroundColor = (): string => {
    if (disabled) return colors.surfaceRaised;
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.surfaceRaised;
      case 'outline':
      case 'ghost':
        return 'transparent';
      case 'danger':
        return colors.danger;
      default:
        return colors.primary;
    }
  };

  const getTextColor = (): string => {
    if (disabled) return colors.textMuted;
    switch (variant) {
      case 'primary':
        return '#000000'; // Clean black text on green
      case 'secondary':
        return colors.text;
      case 'outline':
        return colors.primary;
      case 'danger':
        return '#FFFFFF';
      case 'ghost':
        return colors.textSecondary;
      default:
        return '#000000';
    }
  };

  const getBorderColor = (): string => {
    if (disabled) return colors.border;
    if (variant === 'outline') return colors.borderStrong;
    if (variant === 'secondary') return colors.border;
    return 'transparent';
  };

  const sizeStyles: Record<ButtonSize, { paddingVertical: number; paddingHorizontal: number; minHeight: number; fontSize: number }> = {
    sm: { paddingVertical: 8, paddingHorizontal: 14, minHeight: 38, fontSize: typography.fontSizes.xs },
    md: { paddingVertical: 12, paddingHorizontal: 20, minHeight: 48, fontSize: typography.fontSizes.sm },
    lg: { paddingVertical: 15, paddingHorizontal: 26, minHeight: 52, fontSize: typography.fontSizes.base },
  };

  const currentSize = sizeStyles[size];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' || variant === 'secondary' ? 1 : 0,
          paddingVertical: currentSize.paddingVertical,
          paddingHorizontal: currentSize.paddingHorizontal,
          minHeight: currentSize.minHeight,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
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
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.full, // Apple smooth pill button
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
