import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LogIn, UserPlus, Compass } from 'lucide-react-native';
import { EatInformedLogo } from '../components/EatInformedLogo';
import { Button } from '../components/Button';
import { useTheme } from '../theme/ThemeContext';
import { AppHaptics } from '../lib/haptics';
import { useAuth } from '../context/AuthContext';
import { spacing, typography, borderRadius } from '../theme/tokens';
import { FadeInView } from '../theme/animations';
import { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SignedOutScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();
  const { continueAsGuest } = useAuth();
  const [loadingGuest, setLoadingGuest] = useState(false);

  const handleOpenAuth = (tab: 'login' | 'signup') => {
    AppHaptics.selection();
    navigation.navigate('Auth', { initialTab: tab });
  };

  const handleContinueAsGuest = async () => {
    AppHaptics.impactMedium();
    setLoadingGuest(true);
    try {
      await continueAsGuest();
    } catch (err) {
      console.warn('Guest sign-in error:', err);
    } finally {
      setLoadingGuest(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + spacing.xl,
          paddingBottom: Math.max(insets.bottom + spacing.lg, spacing.xl),
        },
      ]}
    >
      <FadeInView style={styles.contentWrap}>
        {/* Brand Header */}
        <View style={styles.header}>
          <EatInformedLogo size={76} />
          <Text style={[styles.title, { color: colors.text }]}>You are signed out</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Sign in to continue with your verified food passport, or explore EatInformed as a guest.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title="Sign In"
            onPress={() => handleOpenAuth('login')}
            variant="primary"
            size="lg"
            icon={<LogIn size={18} color={colors.onPrimary} />}
            style={styles.actionBtn}
          />

          <Button
            title="Create Account"
            onPress={() => handleOpenAuth('signup')}
            variant="secondary"
            size="lg"
            icon={<UserPlus size={18} color={colors.text} />}
            style={styles.actionBtn}
          />

          <Button
            title={loadingGuest ? 'Preparing guest session...' : 'Continue as Guest'}
            onPress={handleContinueAsGuest}
            variant="ghost"
            size="md"
            disabled={loadingGuest}
            icon={
              loadingGuest ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Compass size={18} color={colors.primary} />
              )
            }
            style={styles.guestBtn}
          />
        </View>
      </FadeInView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  contentWrap: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: -0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSizes.base,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  actions: {
    width: '100%',
    gap: spacing.md,
  },
  actionBtn: {
    width: '100%',
  },
  guestBtn: {
    width: '100%',
    marginTop: spacing.xs,
  },
});
