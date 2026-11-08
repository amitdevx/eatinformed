// mobile/src/components/ConfirmModal.tsx
// Apple HIG Styled Modal Dialog for confirmations & alerts
import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Button } from './Button';
import { borderRadius, getCardShadow, spacing, typography } from '../theme/tokens';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { colors, isDark } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        {/* Backdrop touch target to dismiss dialog */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
          accessibilityLabel="Dismiss dialog"
        />

        <View
          style={[
            styles.dialog,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderStrong,
            },
            getCardShadow(isDark),
          ]}
        >
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {message}
          </Text>

          <View style={styles.actionsRow}>
            <Button
              title={cancelText}
              onPress={onCancel}
              variant="secondary"
              size="md"
              style={styles.actionButton}
            />
            <Button
              title={confirmText}
              onPress={onConfirm}
              variant={destructive ? 'danger' : 'primary'}
              size="md"
              style={styles.actionButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: spacing.xs + 2,
  },
  message: {
    fontSize: typography.fontSizes.subhead,
    lineHeight: typography.lineHeights.subhead,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.sm + 2,
  },
  actionButton: {
    flex: 1,
    height: 40,
  },
});
