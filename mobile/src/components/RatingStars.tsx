import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Star } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
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
  const { colors } = useTheme();
  const normalizedRating = Math.max(0, Math.min(5, Number(rating) || 0));

  const starSizes: Record<'sm' | 'md' | 'lg', number> = {
    sm: 14,
    md: 18,
    lg: 22,
  };

  const starSize = starSizes[size];

  const getScoreMeta = (score: number) => {
    if (score >= 4.0) {
      return {
        text: colors.successText,
        bg: colors.successLight,
        border: colors.successBorder,
      };
    }
    if (score >= 2.5) {
      return {
        text: colors.warningText,
        bg: colors.warningLight,
        border: colors.warningBorder,
      };
    }
    return {
      text: colors.dangerText,
      bg: colors.dangerLight,
      border: colors.dangerBorder,
    };
  };

  const scoreMeta = getScoreMeta(normalizedRating);

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
              color={isFilled || isPartial ? colors.starFilled : colors.starEmpty}
              fill={
                isFilled
                  ? colors.starFilled
                  : isPartial
                  ? colors.starFilled
                  : 'transparent'
              }
              style={styles.star}
            />
          );
        })}
      </View>

      {showScore ? (
        <View
          style={[
            styles.scoreBadge,
            {
              backgroundColor: scoreMeta.bg,
              borderColor: scoreMeta.border,
            },
          ]}
        >
          <Text style={[styles.scoreText, { color: scoreMeta.text }]}>
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
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
  },
  scoreText: {
    fontSize: typography.fontSizes.caption2,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: -0.1,
  },
});
