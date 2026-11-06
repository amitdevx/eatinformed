import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { PressableScale } from '../theme/animations';
import { borderRadius, getCardShadow, spacing, typography } from '../theme/tokens';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export function Card({ children, style, onPress }: CardProps) {
  const { colors, isDark } = useTheme();
  const cardStyle: StyleProp<ViewStyle> = [
    styles.card,
    {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    getCardShadow(isDark),
    style,
  ];

  if (onPress) {
    return (
      <PressableScale onPress={onPress} scaleTo={0.982} style={cardStyle}>
        {children}
      </PressableScale>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

export function CardHeader({
  title,
  subtitle,
  rightElement,
  style,
}: {
  title?: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.header, style]}>
      <View style={styles.headerText}>
        {title && <Text style={[styles.title, { color: colors.text }]}>{title}</Text>}
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        )}
      </View>
      {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
    </View>
  );
}

export function CardTitle({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  const { colors } = useTheme();
  return <Text style={[styles.title, { color: colors.text }, style]}>{children}</Text>;
}

export function CardDescription({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  const { colors } = useTheme();
  return (
    <Text style={[styles.subtitle, { color: colors.textSecondary }, style]}>{children}</Text>
  );
}

export function CardContent({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.content, style]}>{children}</View>;
}

export function CardFooter({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.footer, { borderTopColor: colors.separator }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.base,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  headerText: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  title: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    letterSpacing: -0.3,
    lineHeight: typography.lineHeights.md,
  },
  subtitle: {
    fontSize: typography.fontSizes.sm,
    marginTop: 3,
    lineHeight: typography.lineHeights.sm,
  },
  rightElement: {
    alignSelf: 'flex-start',
  },
  content: {},
  footer: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
});
