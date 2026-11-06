import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Sparkles, Lock, Mail } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { Screen } from '../components/Screen';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { SegmentedControl } from '../components/SegmentedControl';
import { useTheme } from '../theme/ThemeContext';
import { FadeInView, PressableScale } from '../theme/animations';
import { borderRadius, layout, spacing, typography } from '../theme/tokens';
import { saveUserSession, signInWithGoogle, authenticateWithBackend, signInAsGuest } from '../lib/auth';
import { RootStackParamList } from '../navigation/types';
import { EatInformedLogo } from '../components/EatInformedLogo';

type RouteProps = RouteProp<RootStackParamList, 'Auth'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <Path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </Svg>
  );
}

export default function AuthScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const initialTab = route.params?.initialTab || 'login';

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please provide both an email address and password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authenticateWithBackend(
        email.trim(),
        password,
        activeTab === 'login' ? 'signIn' : 'signUp'
      );
      navigation.goBack();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);

    try {
      await signInWithGoogle();
      navigation.goBack();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleContinueGuest = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await signInAsGuest();
      navigation.goBack();
    } catch {
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
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
          <EatInformedLogo size={32} />
          <Text style={[styles.brandTitle, { color: colors.text, marginLeft: spacing.sm }]}>
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

            {/* Google Sign-In Button */}
            <Button
              title="Continue with Google"
              onPress={handleGoogleSignIn}
              variant="secondary"
              size="md"
              loading={isGoogleLoading}
              disabled={isLoading}
              icon={<GoogleIcon size={18} />}
              style={styles.authOptionButton}
            />

            <Button
              title="Continue as Guest"
              onPress={handleContinueGuest}
              variant="secondary"
              size="md"
              disabled={isGoogleLoading || isLoading}
              style={styles.authOptionButton}
            />

            <View style={styles.dividerRow}>
              <View
                style={[styles.divider, { backgroundColor: colors.separator }]}
              />
              <Text style={[styles.dividerText, { color: colors.textMuted }]}>
                {activeTab === 'login' ? 'OR WITH EMAIL' : 'OR REGISTER WITH EMAIL'}
              </Text>
              <View
                style={[styles.divider, { backgroundColor: colors.separator }]}
              />
            </View>

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
  authOptionButton: {
    width: '100%',
    marginBottom: spacing.sm,
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
    marginVertical: spacing.md,
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
