import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Sparkles, Lock, Mail } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { SegmentedControl } from '../components/SegmentedControl';
import { useTheme } from '../theme/ThemeContext';
import { FadeInView, PressableScale } from '../theme/animations';
import { borderRadius, layout, spacing, typography } from '../theme/tokens';
import { saveUserSession } from '../lib/auth';
import { RootStackParamList } from '../navigation/types';

type RouteProps = RouteProp<RootStackParamList, 'Auth'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AuthScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const initialTab = route.params?.initialTab || 'login';

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please provide both an email address and password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await saveUserSession(email.trim());
      navigation.goBack();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueGuest = () => {
    navigation.goBack();
  };

  return (
    <Screen scrollable>
      <FadeInView delay={0} style={styles.topBar}>
        <PressableScale
          style={[
            styles.backButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => navigation.goBack()}
          scaleTo={0.92}
          accessibilityLabel="Close authentication modal"
        >
          <ArrowLeft size={20} color={colors.text} />
        </PressableScale>
      </FadeInView>

      <FadeInView delay={40} style={styles.header}>
        <View style={styles.logoRow}>
          <View
            style={[
              styles.logoBadge,
              {
                backgroundColor: colors.primaryMuted,
                borderColor: colors.primaryBorder,
              },
            ]}
          >
            <Sparkles size={16} color={colors.primary} />
          </View>
          <Text style={[styles.brandTitle, { color: colors.primary }]}>
            EatInformed
          </Text>
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          {activeTab === 'login' ? 'Welcome Back' : 'Create an Account'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {activeTab === 'login'
            ? 'Sign in to access your saved food reports and sync scans across devices.'
            : 'Join EatInformed to build transparent, whole-food nutrition habits.'}
        </Text>
      </FadeInView>

      {/* Apple Segmented Control Tabs */}
      <FadeInView delay={80} style={styles.tabWrapper}>
        <SegmentedControl<'login' | 'signup'>
          options={[
            { value: 'login', label: 'Sign In' },
            { value: 'signup', label: 'Create Account' },
          ]}
          value={activeTab}
          onChange={(val) => {
            setActiveTab(val);
            setError(null);
          }}
        />
      </FadeInView>

      {/* Auth Form Card */}
      <FadeInView delay={120}>
        <Card>
          <CardContent>
            {error ? (
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: colors.dangerLight,
                    borderColor: colors.dangerBorder,
                  },
                ]}
              >
                <Text style={[styles.errorText, { color: colors.dangerText }]}>
                  {error}
                </Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                EMAIL ADDRESS
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.surfaceRaised,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Mail
                  size={18}
                  color={colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                PASSWORD
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.surfaceRaised,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Lock
                  size={18}
                  color={colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter password"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            </View>

            <Button
              title={activeTab === 'login' ? 'Sign In' : 'Create Account'}
              onPress={handleSubmit}
              variant="primary"
              size="lg"
              loading={isLoading}
              style={styles.submitButton}
            />

            <View style={styles.dividerRow}>
              <View
                style={[styles.divider, { backgroundColor: colors.separator }]}
              />
              <Text style={[styles.dividerText, { color: colors.textMuted }]}>
                OR
              </Text>
              <View
                style={[styles.divider, { backgroundColor: colors.separator }]}
              />
            </View>

            <Button
              title="Continue as Guest"
              onPress={handleContinueGuest}
              variant="secondary"
              size="md"
            />
          </CardContent>
        </Card>
      </FadeInView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingVertical: spacing.md,
  },
  backButton: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing.lg,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  logoBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs + 2,
  },
  brandTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: -0.2,
  },
  title: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.black,
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: typography.fontSizes.subhead,
    lineHeight: typography.lineHeights.subhead,
  },
  tabWrapper: {
    marginBottom: spacing.base,
  },
  errorBox: {
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: spacing.base,
  },
  label: {
    fontSize: typography.fontSizes.caption2,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSizes.base,
  },
  submitButton: {
    marginTop: spacing.sm,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.base,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: typography.fontSizes.caption2,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.8,
    paddingHorizontal: spacing.md,
  },
});
