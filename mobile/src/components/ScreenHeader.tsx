import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { PressableScale } from '../theme/animations';
import { layout, spacing, typography } from '../theme/tokens';

interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  largeTitle?: boolean;
}

// ponytail: unified Apple HIG screen header with guaranteed 44pt touch targets and accessibility semantics
export function ScreenHeader({
  title,
  subtitle,
  eyebrow,
  onBack,
  rightElement,
  style,
  largeTitle = false,
}: ScreenHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {/* Top action row with back button and right elements */}
      {(onBack || rightElement) && (
        <View style={styles.actionRow}>
          {onBack ? (
            <PressableScale
              onPress={onBack}
              scaleTo={0.92}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={[
                styles.backButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <ArrowLeft size={18} color={colors.text} strokeWidth={2.2} />
            </PressableScale>
          ) : (
            <View style={styles.backPlaceholder} />
          )}

          {!largeTitle && title && (
            <Text
              numberOfLines={1}
              accessibilityRole="header"
              style={[styles.inlineTitle, { color: colors.text }]}
            >
              {title}
            </Text>
          )}

          {rightElement ? (
            <View style={styles.rightSlot}>{rightElement}</View>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
        </View>
      )}

      {/* Large Title & Eyebrow display */}
      {(largeTitle || eyebrow || subtitle) && (
        <View style={[styles.textBlock, onBack ? styles.textBlockWithBack : null]}>
          {eyebrow && (
            <Text style={[styles.eyebrow, { color: colors.primary }]}>
              {eyebrow.toUpperCase()}
            </Text>
          )}
          {largeTitle && title && (
            <Text
              accessibilityRole="header"
              style={[styles.largeTitle, { color: colors.text }]}
            >
              {title}
            </Text>
          )}
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: layout.minTouchTarget,
  },
  backButton: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    borderRadius: layout.minTouchTarget / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
  },
  inlineTitle: {
    flex: 1,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    letterSpacing: typography.letterSpacing.title,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  rightSlot: {
    minHeight: layout.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  textBlock: {
    marginTop: spacing.xs,
  },
  textBlockWithBack: {
    marginTop: spacing.md,
  },
  eyebrow: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: typography.letterSpacing.caps,
    marginBottom: 4,
  },
  largeTitle: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: typography.letterSpacing.tight,
    lineHeight: typography.lineHeights.xxl,
  },
  subtitle: {
    fontSize: typography.fontSizes.subhead,
    lineHeight: typography.lineHeights.subhead,
    marginTop: 6,
  },
});
