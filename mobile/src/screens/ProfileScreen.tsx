import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  User,
  Shield,
  Server,
  Sparkles,
  LogOut,
  LogIn,
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Card, CardHeader, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { SegmentedControl } from '../components/SegmentedControl';
import { ConfirmModal } from '../components/ConfirmModal';
import { checkApiHealth } from '../api/client';
import { getUserSession, clearUserSession } from '../lib/auth';
import { useTheme, ThemeMode } from '../theme/ThemeContext';
import { FadeInView, PressableScale } from '../theme/animations';
import { borderRadius, spacing, typography } from '../theme/tokens';
import { RootStackParamList } from '../navigation/types';
import { EatInformedLogo } from '../components/EatInformedLogo';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, theme: currentTheme, setTheme } = useTheme();
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [serverMessage, setServerMessage] = useState<string>(
    'Checking server status...'
  );
  const [isCheckingServer, setIsCheckingServer] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [signOutModalVisible, setSignOutModalVisible] = useState(false);

  const checkBackend = useCallback(async () => {
    setIsCheckingServer(true);
    setServerOnline(null);
    setServerMessage('Pinging EatInformed API...');
    const start = Date.now();
    const health = await checkApiHealth();
    const elapsedMs = Date.now() - start;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setServerOnline(health.ok);
    setServerMessage(
      health.ok
        ? `${health.message} (${elapsedMs}ms · Checked at ${timeStr})`
        : `${health.message} (Checked at ${timeStr})`
    );
    setIsCheckingServer(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkBackend();
      getUserSession().then((session) => {
        if (session && session.isLoggedIn && !session.isAnonymous && session.email) {
          setIsLoggedIn(true);
          setIsAnonymous(false);
          setUserEmail(session.email);
          setUserName(session.name || session.email.split('@')[0]);
        } else {
          setIsLoggedIn(false);
          setIsAnonymous(true);
          setUserEmail(null);
          setUserName(null);
        }
      });
    }, [checkBackend])
  );

  const handleAuthAction = () => {
    if (isLoggedIn && !isAnonymous) {
      setSignOutModalVisible(true);
    } else {
      navigation.navigate('Auth', { initialTab: 'login' });
    }
  };

  const confirmSignOut = async () => {
    setSignOutModalVisible(false);
    await clearUserSession();
    setIsLoggedIn(false);
    setIsAnonymous(true);
    setUserEmail(null);
    setUserName(null);
  };

  return (
    <Screen scrollable>
      <FadeInView delay={0} style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Account & System
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Manage appearance preferences, session sync, and AI service diagnostics
        </Text>
      </FadeInView>

      {/* User Card */}
      <FadeInView delay={50}>
        <Card
          style={{
            borderColor: colors.primaryBorder,
          }}
        >
          <CardContent>
            <View style={styles.userRow}>
              <View
                style={[
                  styles.avatarCircle,
                  {
                    backgroundColor: colors.primaryMuted,
                    borderColor: colors.primaryBorder,
                  },
                ]}
              >
                {isLoggedIn && !isAnonymous ? (
                  <User size={24} color={colors.primary} />
                ) : (
                  <EatInformedLogo size={24} />
                )}
              </View>
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: colors.text }]}>
                  {isLoggedIn && !isAnonymous
                    ? userName || userEmail?.split('@')[0] || 'Member'
                    : 'Guest Explorer'}
                </Text>
                <Text
                  style={[styles.userEmail, { color: colors.textSecondary }]}
                >
                  {isLoggedIn && !isAnonymous
                    ? userEmail
                    : 'Guest session · Free unlimited scanning'}
                </Text>
                <View style={{ marginTop: 6 }}>
                  <Badge
                    label={isLoggedIn && !isAnonymous ? 'Registered Member' : 'Guest Mode'}
                    variant={isLoggedIn && !isAnonymous ? 'primary' : 'default'}
                    size="sm"
                  />
                </View>
              </View>
            </View>

            <Button
              title={isLoggedIn && !isAnonymous ? 'Sign Out' : 'Sign In / Create Account'}
              onPress={handleAuthAction}
              variant={isLoggedIn && !isAnonymous ? 'danger' : 'primary'}
              size="md"
              icon={
                isLoggedIn && !isAnonymous ? (
                  <LogOut size={16} color={colors.dangerText} />
                ) : (
                  <LogIn size={16} color={colors.onPrimary} />
                )
              }
              style={styles.authButton}
            />
          </CardContent>
        </Card>
      </FadeInView>

      {/* Apple Appearance / Theme Selector Card */}
      <FadeInView delay={100}>
        <Card>
          <CardHeader
            title="Appearance"
            subtitle="Match system settings or lock Light / Dark mode"
          />
          <CardContent>
            <SegmentedControl<ThemeMode>
              options={[
                { value: 'system', label: 'System' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
              value={currentTheme}
              onChange={setTheme}
            />
          </CardContent>
        </Card>
      </FadeInView>

      {/* Backend & AI Service Status Card */}
      <FadeInView delay={150}>
        <Card>
          <CardHeader
            title="Backend AI Status"
            subtitle="Connection to EatInformed Vision & Reasoning API"
          />
          <CardContent>
            <View style={styles.statusRow}>
              <View style={styles.statusIndicator}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        serverOnline === null
                          ? colors.warning
                          : serverOnline
                          ? colors.success
                          : colors.danger,
                    },
                  ]}
                />
                <Text style={[styles.statusText, { color: colors.text }]}>
                  {serverOnline === null
                    ? 'Checking endpoint...'
                    : serverOnline
                    ? 'API Online and Responsive'
                    : 'Backend Offline'}
                </Text>
              </View>

              <PressableScale
                onPress={checkBackend}
                disabled={isCheckingServer}
                style={[
                  styles.recheckButton,
                  {
                    backgroundColor: colors.surfaceRaised,
                    borderColor: colors.border,
                    opacity: isCheckingServer ? 0.6 : 1,
                  },
                ]}
                scaleTo={0.94}
              >
                <Text
                  style={[styles.recheckText, { color: colors.textSecondary }]}
                >
                  {isCheckingServer ? 'Checking...' : 'Check'}
                </Text>
              </PressableScale>
            </View>
            <Text style={[styles.statusDetail, { color: colors.textMuted }]}>
              {serverMessage}
            </Text>
          </CardContent>
        </Card>
      </FadeInView>

      {/* Architecture & AI Engine Info */}
      <FadeInView delay={200}>
        <Card>
          <CardHeader title="AI Engine Architecture" />
          <CardContent>
            <View style={styles.techItem}>
              <View
                style={[
                  styles.techIconBox,
                  { backgroundColor: colors.primaryMuted },
                ]}
              >
                <Sparkles size={16} color={colors.primary} />
              </View>
              <View style={styles.techTextContainer}>
                <Text style={[styles.techTitle, { color: colors.text }]}>
                  OCR & Label Extraction
                </Text>
                <Text
                  style={[styles.techSubtitle, { color: colors.textSecondary }]}
                >
                  NVIDIA Nemotron Nano 12B v2 VL (Unified Single-Pass Vision & OCR)
                </Text>
              </View>
            </View>

            <View style={styles.techItem}>
              <View
                style={[
                  styles.techIconBox,
                  { backgroundColor: colors.infoLight },
                ]}
              >
                <Shield size={16} color={colors.infoText} />
              </View>
              <View style={styles.techTextContainer}>
                <Text style={[styles.techTitle, { color: colors.text }]}>
                  Nutritional Reasoning
                </Text>
                <Text
                  style={[styles.techSubtitle, { color: colors.textSecondary }]}
                >
                  Qwen 3.5 (122B) Clinical Nutrition Reasoning Model
                </Text>
              </View>
            </View>

            <View style={[styles.techItem, { marginBottom: 0 }]}>
              <View
                style={[
                  styles.techIconBox,
                  { backgroundColor: colors.warningLight },
                ]}
              >
                <Server size={16} color={colors.warningText} />
              </View>
              <View style={styles.techTextContainer}>
                <Text style={[styles.techTitle, { color: colors.text }]}>
                  Classification Standard
                </Text>
                <Text
                  style={[styles.techSubtitle, { color: colors.textSecondary }]}
                >
                  International NOVA Food Processing Classification (Groups 1-4)
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </FadeInView>

      {/* App Version Info */}
      <FadeInView delay={240} style={styles.versionContainer}>
        <Text style={[styles.versionText, { color: colors.textSecondary }]}>
          EatInformed Mobile v1.1.0
        </Text>
        <Text style={[styles.versionSubtext, { color: colors.textMuted }]}>
          Food Product Analysis & Nutrition Intelligence
        </Text>
      </FadeInView>

      <ConfirmModal
        visible={signOutModalVisible}
        title="Sign Out"
        message="Are you sure you want to sign out of your EatInformed account?"
        confirmText="Sign Out"
        cancelText="Cancel"
        destructive={true}
        onConfirm={confirmSignOut}
        onCancel={() => setSignOutModalVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.base,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.black,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.lineHeights.sm,
    marginTop: 3,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: -0.3,
  },
  userEmail: {
    fontSize: typography.fontSizes.sm,
    marginTop: 2,
  },
  authButton: {
    width: '100%',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  statusText: {
    fontSize: typography.fontSizes.subhead,
    fontWeight: typography.fontWeights.semibold,
  },
  recheckButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  recheckText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
  },
  statusDetail: {
    fontSize: typography.fontSizes.xs,
    marginTop: 4,
  },
  techItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  techIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  techTextContainer: {
    flex: 1,
  },
  techTitle: {
    fontSize: typography.fontSizes.subhead,
    fontWeight: typography.fontWeights.semibold,
  },
  techSubtitle: {
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
    lineHeight: 16,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingBottom: 36,
  },
  versionText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
  },
  versionSubtext: {
    fontSize: typography.fontSizes.caption2,
    marginTop: 3,
  },
});
