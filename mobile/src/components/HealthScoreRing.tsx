import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface HealthScoreRingProps {
  score: number | null; // 0.0 - 5.0
  maxScore?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  showGrade?: boolean;
}

// ponytail: FitBuddy-grade circular SVG health gauge with dynamic color shift & spring reveal
export function HealthScoreRing({
  score,
  maxScore = 5.0,
  size = 100,
  strokeWidth = 9,
  label = 'HEALTH',
  showGrade = true,
}: HealthScoreRingProps) {
  const { colors, isDark } = useTheme();
  const animatedProgress = useRef(new Animated.Value(0)).current;

  const clampedScore = Math.max(0, Math.min(score ?? 0, maxScore));
  const progressRatio = clampedScore / maxScore;

  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    Animated.spring(animatedProgress, {
      toValue: progressRatio,
      stiffness: 140,
      damping: 18,
      mass: 0.8,
      useNativeDriver: false,
    }).start();
  }, [progressRatio, animatedProgress]);

  // Color mapping matching FitBuddy & NOVA clinical standards
  const getRingColor = () => {
    if (clampedScore >= 4.0) return colors.primary; // Emerald for Clean Food
    if (clampedScore >= 2.5) return colors.warning; // Amber for Processed
    return colors.danger; // Coral for Ultra-Processed
  };

  const ringColor = score == null ? colors.textSecondary : getRingColor();
  const trackColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <LinearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={ringColor} stopOpacity="1" />
            <Stop offset="100%" stopColor={ringColor} stopOpacity="0.75" />
          </LinearGradient>
        </Defs>

        <G rotation="-90" origin={`${center}, ${center}`}>
          {/* Background Track Circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Foreground Animated Gauge Circle */}
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke="url(#scoreGrad)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </G>
      </Svg>

      {/* Inner Metric Display */}
      <View style={styles.centerTextContainer}>
        <Text
          style={[
            styles.scoreValue,
            {
              color: colors.text,
              fontSize: size * 0.25,
            },
          ]}
        >
          {score == null ? '—' : clampedScore.toFixed(1)}
        </Text>
        <Text
          style={[
            styles.scoreScale,
            {
              color: colors.textSecondary,
              fontSize: size * 0.11,
            },
          ]}
        >
          / {maxScore.toFixed(0)}
        </Text>
        {label && (
          <Text
            style={[
              styles.scoreLabel,
              {
                color: ringColor,
                fontSize: size * 0.1,
              },
            ]}
          >
            {label}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  centerTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: undefined,
  },
  scoreScale: {
    fontWeight: '600',
    marginTop: -2,
    letterSpacing: -0.2,
  },
  scoreLabel: {
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 2,
    textTransform: 'uppercase',
  },
});
