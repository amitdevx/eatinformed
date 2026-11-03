import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { AlertCircle, Inbox } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { borderRadius, spacing, typography } from '../theme/tokens';
import { Button } from './Button';

interface LoadingStateProps {
  message?: string;
  stepMessage?: string;
  style?: ViewStyle;
}

export function LoadingState({
  message = 'Analyzing food label...',
  stepMessage,
  style,
}: LoadingStateProps) {
  return (
    <View style={[styles.centerContainer, style]}>
      <View style={styles.spinnerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
      <Text style={styles.loadingTitle}>{message}</Text>
      {stepMessage ? (
        <Text style={styles.loadingStep}>{stepMessage}</Text>
      ) : null}
    </View>
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
  return (
    <View style={[styles.centerContainer, style]}>
      <View style={styles.iconCircle}>
        {icon || <Inbox size={32} color={colors.textMuted} />}
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {description ? (
        <Text style={styles.emptyDescription}>{description}</Text>
      ) : null}
      {actionTitle && onAction ? (
        <Button
          title={actionTitle}
          onPress={onAction}
          variant="secondary"
          size="sm"
          style={styles.emptyAction}
        />
      ) : null}
    </View>
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
  return (
    <View style={[styles.centerContainer, style]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.dangerLight, borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
        <AlertCircle size={32} color={colors.danger} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.danger }]}>{title}</Text>
      <Text style={styles.emptyDescription}>{message}</Text>
      {onRetry ? (
        <Button
          title="Try Again"
          onPress={onRetry}
          variant="primary"
          size="md"
          style={styles.emptyAction}
        />
      ) : null}
    </View>
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
  return (
    <View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius: radius,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.skeletonCard, style]}>
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
    padding: spacing.base,
    backgroundColor: colors.surfaceRaised,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.base,
  },
  loadingTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  loadingStep: {
    fontSize: typography.fontSizes.sm,
    color: colors.primary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  emptyTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  emptyDescription: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.base,
  },
  emptyAction: {
    marginTop: spacing.sm,
  },
  skeleton: {
    backgroundColor: colors.surfaceRaised,
  },
  skeletonCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
});
