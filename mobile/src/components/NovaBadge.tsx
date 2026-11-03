import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { getNovaColor } from '../theme/colors';
import { borderRadius, spacing, typography } from '../theme/tokens';

interface NovaBadgeProps {
  novaGroup?: number;
  showDescription?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

const novaDescriptions: Record<number, string> = {
  1: 'Unprocessed or minimally processed food. Clean whole-food source.',
  2: 'Processed culinary ingredient derived from nature (e.g. oil, butter, salt).',
  3: 'Processed food with simple ingredients, typically cooked or canned.',
  4: 'Ultra-processed food formulation with industrial additives and emulsifiers.',
};

export function NovaBadge({
  novaGroup = 4,
  showDescription = false,
  size = 'md',
  style,
}: NovaBadgeProps) {
  const meta = getNovaColor(novaGroup);
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
            paddingVertical: isSm ? 3 : isLg ? 8 : 6,
            paddingHorizontal: isSm ? 8 : isLg ? 16 : 12,
          },
        ]}
      >
        <View style={[styles.dot, { backgroundColor: meta.text }]} />
        <Text
          style={[
            styles.label,
            {
              color: meta.text,
              fontSize: isSm
                ? typography.fontSizes.xs
                : isLg
                ? typography.fontSizes.md
                : typography.fontSizes.sm,
            },
          ]}
        >
          {meta.label}
        </Text>
      </View>

      {showDescription && description ? (
        <Text style={styles.description}>{description}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
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
    letterSpacing: 0.4,
  },
  description: {
    marginTop: spacing.xs + 2,
    fontSize: typography.fontSizes.xs,
    color: '#A1A1AA',
    lineHeight: 16,
  },
});
