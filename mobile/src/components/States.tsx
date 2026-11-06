import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  Animated,
} from 'react-native';
import { AlertCircle, Inbox } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { FadeInView } from '../theme/animations';
import { borderRadius, spacing, typography } from '../theme/tokens';
import { Button } from './Button';

interface LoadingStateProps {
  message?: string;
  stepMessage?: string;
  progress?: number;
  style?: ViewStyle;
}

export function LoadingState({
  message = 'Analyzing food label...',
  stepMessage,
  progress,
  style,
}: LoadingStateProps) {
  const { colors } = useTheme();
  const pulse = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.06,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.85,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <FadeInView style={[styles.centerContainer, style]}>
      <Animated.View
        style={[
          styles.spinnerContainer,
          {
            backgroundColor: colors.primaryMuted,
            borderColor: colors.primaryBorder,
            transform: [{ scale: pulse }],
          },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </Animated.View>
      <Text style={[styles.loadingTitle, { color: colors.text }]}>{message}</Text>
      {stepMessage ? (
        <Text style={[styles.loadingStep, { color: colors.textSecondary }]}>
          {stepMessage}
        </Text>
      ) : null}
      {typeof progress === 'number' ? (
        <View
          style={[
            styles.progressTrack,
            { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: `${Math.max(10, Math.min(100, progress * 100))}%`,
              },
            ]}
          />
        </View>
      ) : null}
    </FadeInView>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  actionTitle?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function EmptyState({
  title,
  description,
  actionTitle,
  onAction,
  icon,
  style,
}: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <FadeInView style={[styles.centerContainer, style]}>
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
        ]}
      >
        {icon || <Inbox size={30} color={colors.textMuted} />}
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      {description ? (
        <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
          {description}
        </Text>
      ) : null}
      {actionTitle && onAction ? (
        <Button
          title={actionTitle}
          onPress={onAction}
          variant="primary"
          size="md"
          style={styles.emptyAction}
        />
      ) : null}
    </FadeInView>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  style?: ViewStyle;
}

export function ErrorState({
  title = 'Analysis Failed',
  message = 'Could not process the food label. Please check your network connection and try again.',
  onRetry,
  style,
}: ErrorStateProps) {
  const { colors } = useTheme();
  return (
    <FadeInView style={[styles.centerContainer, style]}>
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: colors.dangerLight,
            borderColor: colors.dangerBorder,
          },
        ]}
      >
        <AlertCircle size={30} color={colors.dangerText} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.dangerText }]}>{title}</Text>
      <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
        {message}
      </Text>
      {onRetry ? (
        <Button
          title="Try Again"
          onPress={onRetry}
          variant="primary"
          size="md"
          style={styles.emptyAction}
        />
      ) : null}
    </FadeInView>
  );
}

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius: radius = borderRadius.sm,
  style,
}: SkeletonProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: radius,
          backgroundColor: colors.surfaceRaised,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.skeletonCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}
    >
      <Skeleton height={22} width="60%" style={{ marginBottom: spacing.sm }} />
      <Skeleton height={14} width="40%" style={{ marginBottom: spacing.md }} />
      <Skeleton height={14} width="100%" style={{ marginBottom: spacing.xs }} />
      <Skeleton height={14} width="85%" />
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  spinnerContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  loadingTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: spacing.xs,
  },
  loadingStep: {
    fontSize: typography.fontSizes.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    lineHeight: typography.lineHeights.sm,
  },
  progressTrack: {
    width: 220,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
    marginTop: spacing.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  emptyTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: spacing.xs,
  },
  emptyDescription: {
    fontSize: typography.fontSizes.subhead,
    textAlign: 'center',
    lineHeight: typography.lineHeights.subhead,
    marginBottom: spacing.base,
  },
  emptyAction: {
    marginTop: spacing.sm,
  },
  skeletonCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.base,
  },
});
