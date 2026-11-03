import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Star } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { borderRadius, spacing, typography } from '../theme/tokens';

interface RatingStarsProps {
  rating: number; // 0.0 to 5.0
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
  style?: ViewStyle;
}

export function RatingStars({
  rating,
  size = 'md',
  showScore = true,
  style,
}: RatingStarsProps) {
  const normalizedRating = Math.max(0, Math.min(5, Number(rating) || 0));

  const starSizes: Record<'sm' | 'md' | 'lg', number> = {
    sm: 14,
    md: 18,
    lg: 24,
  };

  const starSize = starSizes[size];

  const getScoreColor = (score: number): string => {
    if (score >= 4.0) return colors.primary;
    if (score >= 2.5) return colors.warning;
    return colors.danger;
  };

  const scoreColor = getScoreColor(normalizedRating);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((index) => {
          const isFilled = normalizedRating >= index;
          const isPartial = !isFilled && normalizedRating > index - 1;

          return (
            <Star
              key={index}
              size={starSize}
              color={isFilled || isPartial ? '#EAB308' : colors.surfaceRaised}
              fill={isFilled ? '#EAB308' : isPartial ? 'rgba(234, 179, 8, 0.4)' : 'transparent'}
              style={styles.star}
            />
          );
        })}
      </View>

      {showScore ? (
        <View style={[styles.scoreBadge, { borderColor: `${scoreColor}40` }]}>
          <Text style={[styles.scoreText, { color: scoreColor }]}>
            {normalizedRating.toFixed(1)} / 5.0
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  star: {
    marginRight: 2,
  },
  scoreBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    backgroundColor: colors.surfaceRaised,
  },
  scoreText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
});
