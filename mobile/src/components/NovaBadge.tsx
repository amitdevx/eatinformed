import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { getNovaColor } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { borderRadius, spacing, typography } from '../theme/tokens';

interface NovaBadgeProps {
  novaGroup?: number;
  showDescription?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

const novaDescriptions: Record<number, string> = {
  1: 'Unprocessed or minimally processed whole food in its natural state.',
  2: 'Processed culinary ingredient extracted from nature (e.g., olive oil, butter, salt).',
  3: 'Processed food with simple culinary additions (e.g., cheese, canned legumes, artisan bread).',
  4: 'Ultra-processed industrial formulation containing additives, emulsifiers, or flavorings.',
};

export function NovaBadge({
  novaGroup = 4,
  showDescription = false,
  size = 'md',
  style,
}: NovaBadgeProps) {
  const { colors, isDark } = useTheme();
  const meta = getNovaColor(novaGroup, !isDark);
  const description = novaDescriptions[novaGroup] || '';

  const isLg = size === 'lg';
  const isSm = size === 'sm';

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.badge,
          {
            backgroundColor: meta.bg,
            borderColor: meta.border,
            paddingVertical: isSm ? 4 : isLg ? 8 : 6,
            paddingHorizontal: isSm ? 10 : isLg ? 16 : 12,
          },
        ]}
      >
        <View style={[styles.dot, { backgroundColor: meta.dot }]} />
        <Text
          style={[
            styles.label,
            {
              color: meta.text,
              fontSize: isSm
                ? typography.fontSizes.caption2
                : isLg
                ? typography.fontSizes.subhead
                : typography.fontSizes.xs,
            },
          ]}
        >
          {meta.label}
        </Text>
      </View>

      {showDescription && description ? (
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs + 2,
  },
  label: {
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.2,
  },
  description: {
    marginTop: spacing.xs + 2,
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.lineHeights.sm,
  },
});
