import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Sparkles, Lock, Mail } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { colors } from '../theme/colors';
import { borderRadius, spacing, typography } from '../theme/tokens';
import { RootStackParamList } from '../navigation/types';

type RouteProps = RouteProp<RootStackParamList, 'Auth'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AuthScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const initialTab = route.params?.initialTab || 'login';

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please provide both email and password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Simulate/execute auth flow
      // In production, connects to Firebase Auth client
      await new Promise((resolve) => setTimeout(resolve, 800));

      Alert.alert(
        activeTab === 'login' ? 'Signed In' : 'Account Created',
        `Welcome to EatInformed! Logged in as ${email}.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
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
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Sparkles size={24} color={colors.primary} />
          <Text style={styles.brandTitle}>EatInformed</Text>
        </View>
        <Text style={styles.title}>
          {activeTab === 'login' ? 'Welcome Back' : 'Create an Account'}
        </Text>
        <Text style={styles.subtitle}>
          {activeTab === 'login'
            ? 'Sign in to access your saved food reports and sync scans.'
            : 'Join EatInformed to build healthy eating habits.'}
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'login' && styles.activeTab]}
          onPress={() => {
            setActiveTab('login');
            setError(null);
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'login' && styles.activeTabText,
            ]}
          >
            Sign In
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'signup' && styles.activeTab]}
          onPress={() => {
            setActiveTab('signup');
            setError(null);
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'signup' && styles.activeTabText,
            ]}
          >
            Create Account
          </Text>
        </TouchableOpacity>
      </View>

      {/* Auth Card */}
      <Card style={styles.formCard}>
        <CardContent>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Mail size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
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
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
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
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          <Button
            title="Continue as Guest"
            onPress={handleContinueGuest}
            variant="secondary"
            size="md"
          />
        </CardContent>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing.lg,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  brandTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  title: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceRaised,
    borderRadius: borderRadius.md,
    padding: 4,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  activeTab: {
    backgroundColor: colors.surfaceHighlight,
  },
  tabText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.text,
  },
  formCard: {
    backgroundColor: colors.surfaceRaised,
  },
  errorBox: {
    backgroundColor: colors.dangerLight,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: typography.fontSizes.xs,
    color: colors.danger,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: spacing.base,
  },
  label: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.text,
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
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    paddingHorizontal: spacing.md,
  },
});
