import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  PanResponder,
  Dimensions,
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
  Share2,
  Edit3,
  Award,
  Flame,
  CheckCircle,
  Activity,
  Heart,
  Settings,
  ChevronRight,
  Database,
  Download,
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card, CardHeader, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { ConfirmModal } from '../components/ConfirmModal';
import { EditProfileSheet } from '../components/EditProfileSheet';
import { SettingsSheet } from '../components/SettingsSheet';
import { YearActivityChart } from '../components/YearActivityChart';
import { RollingNumber } from '../components/RollingNumber';
import { checkApiHealth } from '../api/client';
import { getUserSession, clearUserSession, UserSessionData } from '../lib/auth';
import { exportScanHistory, getScanHistory } from '../lib/history';
import { useTheme } from '../theme/ThemeContext';
import { FadeInView, PressableScale } from '../theme/animations';
import { AppHaptics } from '../lib/haptics';
import { borderRadius, layout, spacing, typography } from '../theme/tokens';
import { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, theme: currentTheme, isDark } = useTheme();

  const [session, setSession] = useState<UserSessionData | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);

  const [scanCount, setScanCount] = useState<number>(0);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [serverMessage, setServerMessage] = useState<string>('Checking server status...');
  const [isCheckingServer, setIsCheckingServer] = useState(false);

  const [signOutModalVisible, setSignOutModalVisible] = useState(false);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  // GymMane pull-down gesture & watermark ticker animation
  const pullAnim = useRef(new Animated.Value(0)).current;
  const isArmedRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 10 && gesture.vy > 0,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          // Rubber-band dampening math matching GymMane (0.55 factor)
          const clampedPull = Math.min(gesture.dy * 0.55, 180);
          pullAnim.setValue(clampedPull);

          if (clampedPull >= 110 && !isArmedRef.current) {
            isArmedRef.current = true;
            AppHaptics.impactHeavy();
          } else if (clampedPull < 110 && isArmedRef.current) {
            isArmedRef.current = false;
          }
        }
      },
      onPanResponderRelease: () => {
        if (isArmedRef.current) {
          isArmedRef.current = false;
          AppHaptics.success();
          setSettingsVisible(true);
        }
        Animated.spring(pullAnim, {
          toValue: 0,
          stiffness: 260,
          damping: 22,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        isArmedRef.current = false;
        Animated.spring(pullAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const loadData = useCallback(async () => {
    const s = await getUserSession();
    setSession(s);
    if (s && s.isLoggedIn) {
      setIsLoggedIn(true);
      setIsAnonymous(Boolean(s.isAnonymous));
      setUserEmail(s.email || (s.isAnonymous ? 'Guest Explorer' : null));
      setUserName(s.name || (s.isAnonymous ? 'Guest Explorer' : s.email?.split('@')[0] || 'Member'));
      setUserPhoto(s.photoUrl || null);
    } else {
      setIsLoggedIn(false);
      setIsAnonymous(false);
      setUserEmail(null);
      setUserName(null);
      setUserPhoto(null);
    }

    const history = await getScanHistory();
    setScanCount(history.length);
  }, []);

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
      loadData();
    }, [checkBackend, loadData])
  );

  const handleProfileUpdated = (updated: UserSessionData) => {
    setSession(updated);
    setUserName(updated.name);
    setUserPhoto(updated.photoUrl || null);
  };

  const handleAuthAction = () => {
    if (isLoggedIn) {
      setSignOutModalVisible(true);
    } else {
      navigation.navigate('Auth', { initialTab: 'login' });
    }
  };

  const confirmSignOut = async () => {
    setSignOutModalVisible(false);
    await clearUserSession();
    setIsLoggedIn(false);
    setIsAnonymous(false);
    setUserEmail(null);
    setUserName(null);
    setUserPhoto(null);
  };

  const handleExport = async () => {
    AppHaptics.success();
    await exportScanHistory();
  };

  return (
    <Screen scrollable>
      {/* GymMane Ticker Watermark revealed on swipe-down */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.watermarkTicker,
          {
            opacity: pullAnim.interpolate({
              inputRange: [0, 80, 150],
              outputRange: [0, 0.45, 0.85],
            }),
            transform: [
              {
                scale: pullAnim.interpolate({
                  inputRange: [0, 150],
                  outputRange: [0.85, 1.05],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={[styles.watermarkText, { color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
          EATINFORMED
        </Text>
      </Animated.View>

      <View {...panResponder.panHandlers}>
        <FadeInView delay={0}>
          <ScreenHeader
            title="Profile & Settings"
            subtitle="Swipe down anytime for system configuration"
            largeTitle={true}
            rightElement={
              <PressableScale
                onPress={() => {
                  AppHaptics.selection();
                  setSettingsVisible(true);
                }}
                scaleTo={0.92}
                style={[styles.headerSettingsBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                accessibilityRole="button"
                accessibilityLabel="Open app settings"
              >
                <Settings size={20} color={colors.text} />
              </PressableScale>
            }
          />
        </FadeInView>

        {/* GymMane-Grade Pinned Profile Card with Halo Ring & Quick Actions */}
        <FadeInView delay={40}>
          <Card
            style={{
              borderColor: colors.primaryBorder,
              backgroundColor: colors.surface,
            }}
          >
            <CardContent>
              <View style={styles.userHeroRow}>
                {/* Avatar with Halo Ring */}
                <View
                  style={[
                    styles.avatarRing,
                    {
                      borderColor: colors.primary,
                      backgroundColor: colors.surfaceRaised,
                    },
                  ]}
                >
                  {userPhoto ? (
                    <Image source={{ uri: userPhoto }} style={styles.avatarImg} />
                  ) : (
                    <View
                      style={[
                        styles.avatarInner,
                        { backgroundColor: colors.primaryMuted },
                      ]}
                    >
                      <User size={30} color={colors.primary} />
                    </View>
                  )}
                </View>

                <View style={styles.userMetaCol}>
                  <View style={styles.nameRow}>
                    <Text
                      numberOfLines={1}
                      style={[styles.displayName, { color: colors.text }]}
                    >
                      {userName || 'Guest Explorer'}
                    </Text>
                    <Badge
                      label={isLoggedIn && !isAnonymous ? 'Pro Member' : 'Guest'}
                      variant={isLoggedIn && !isAnonymous ? 'success' : 'default'}
                      size="sm"
                    />
                  </View>
                  <Text style={[styles.userHandle, { color: colors.textSecondary }]}>
                    @{userEmail ? userEmail.split('@')[0] : 'explorer'}
                  </Text>
                </View>

                {/* Edit & Settings Action Buttons */}
                <View style={styles.heroActionBtns}>
                  <PressableScale
                    onPress={() => {
                      AppHaptics.selection();
                      setEditProfileVisible(true);
                    }}
                    scaleTo={0.92}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={[
                      styles.actionCircleBtn,
                      { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
                    ]}
                  >
                    <Edit3 size={15} color={colors.text} />
                  </PressableScale>

                  <PressableScale
                    onPress={() => {
                      AppHaptics.selection();
                      setSettingsVisible(true);
                    }}
                    scaleTo={0.92}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={[
                      styles.actionCircleBtn,
                      { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
                    ]}
                  >
                    <Settings size={15} color={colors.text} />
                  </PressableScale>
                </View>
              </View>

              {/* Quick Auth Trigger */}
              <View style={[styles.authRow, { borderTopColor: colors.separator }]}>
                {isLoggedIn ? (
                  <Button
                    title={isAnonymous ? 'Exit Guest Mode' : 'Sign Out'}
                    onPress={handleAuthAction}
                    variant="outline"
                    size="sm"
                    icon={<LogOut size={15} color={colors.dangerText} />}
                  />
                ) : (
                  <Button
                    title="Sign In / Create Account"
                    onPress={handleAuthAction}
                    variant="primary"
                    size="sm"
                    icon={<LogIn size={15} color={colors.onPrimary} />}
                  />
                )}
              </View>
            </CardContent>
          </Card>
        </FadeInView>

        {/* GymMane 4 Quick Stat Pills with Tactile Haptic Long-Press */}
        <FadeInView delay={80} style={styles.pillsRow}>
          <PressableScale
            style={[styles.pillCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => AppHaptics.selection()}
            onLongPress={() => AppHaptics.impactHeavy()}
          >
            <Activity size={16} color={colors.primary} />
            <RollingNumber value={scanCount} style={[styles.pillValue, { color: colors.text }]} />
            <Text style={[styles.pillLabel, { color: colors.textSecondary }]}>SCANS</Text>
          </PressableScale>

          <PressableScale
            style={[styles.pillCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => AppHaptics.selection()}
            onLongPress={() => AppHaptics.impactHeavy()}
          >
            <CheckCircle size={16} color={colors.success} />
            <Text style={[styles.pillValue, { color: colors.text }]}>84%</Text>
            <Text style={[styles.pillLabel, { color: colors.textSecondary }]}>CLEAN</Text>
          </PressableScale>

          <PressableScale
            style={[styles.pillCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => AppHaptics.selection()}
            onLongPress={() => AppHaptics.impactHeavy()}
          >
            <Shield size={16} color={colors.info} />
            <Text style={[styles.pillValue, { color: colors.text }]}>0</Text>
            <Text style={[styles.pillLabel, { color: colors.textSecondary }]}>ALLERGENS</Text>
          </PressableScale>

          <PressableScale
            style={[styles.pillCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => AppHaptics.selection()}
            onLongPress={() => AppHaptics.impactHeavy()}
          >
            <Flame size={16} color={colors.warning} />
            <Text style={[styles.pillValue, { color: colors.text }]}>7d</Text>
            <Text style={[styles.pillLabel, { color: colors.textSecondary }]}>STREAK</Text>
          </PressableScale>
        </FadeInView>

        {/* GymMane 12-Month Annual Activity Histogram */}
        <FadeInView delay={120}>
          <Card>
            <CardHeader
              title="Annual Scan Activity"
              subtitle="Monthly nutritional verification volume across the year"
            />
            <CardContent>
              <YearActivityChart totalScans={Math.max(scanCount, 42)} />
            </CardContent>
          </Card>
        </FadeInView>

        {/* Quick Settings Shortcut Banner */}
        <FadeInView delay={150}>
          <Card onPress={() => setSettingsVisible(true)}>
            <CardContent style={styles.settingsShortcutRow}>
              <View style={[styles.settingsShortcutIcon, { backgroundColor: colors.primaryMuted }]}>
                <Settings size={20} color={colors.primary} />
              </View>
              <View style={styles.settingsShortcutText}>
                <Text style={[styles.settingsShortcutTitle, { color: colors.text }]}>Preferences & Engine Settings</Text>
                <Text style={[styles.settingsShortcutDesc, { color: colors.textSecondary }]}>
                  Theme, strict allergen alerts, offline dictionary, AI health checks
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textSecondary} />
            </CardContent>
          </Card>
        </FadeInView>

        {/* Data Portability Card */}
        <FadeInView delay={180}>
          <Card>
            <CardHeader
              title="Data Portability & Backup"
              subtitle="Clinical audit logs stored locally on device"
            />
            <CardContent>
              <Button
                title="Export Scan History (JSON)"
                onPress={handleExport}
                variant="outline"
                size="md"
                icon={<Download size={16} color={colors.primary} />}
              />
            </CardContent>
          </Card>
        </FadeInView>

        {/* Server & Diagnostics */}
        <FadeInView delay={210}>
          <Card>
            <CardHeader
              title="Backend AI Status"
              subtitle="EatInformed OCR & Llama 3.2 Vision engine diagnostic"
              rightElement={
                <View style={styles.statusIndicator}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor:
                          serverOnline === true
                            ? colors.success
                            : serverOnline === false
                            ? colors.danger
                            : colors.warning,
                      },
                    ]}
                  />
                  <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                    {serverOnline === true ? 'Online' : serverOnline === false ? 'Offline' : 'Checking'}
                  </Text>
                </View>
              }
            />
            <CardContent>
              <View
                style={[
                  styles.diagnosticBox,
                  { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
                ]}
              >
                <Server size={16} color={colors.textSecondary} />
                <Text style={[styles.diagnosticText, { color: colors.textSecondary }]}>
                  {serverMessage}
                </Text>
              </View>
              <Button
                title={isCheckingServer ? 'Checking...' : 'Check Server Status'}
                onPress={checkBackend}
                variant="outline"
                size="sm"
                loading={isCheckingServer}
                style={{ marginTop: spacing.md }}
              />
            </CardContent>
          </Card>
        </FadeInView>
      </View>

      {/* Edit Profile Bottom Sheet */}
      {session && (
        <EditProfileSheet
          visible={editProfileVisible}
          currentSession={session}
          onClose={() => setEditProfileVisible(false)}
          onProfileUpdated={handleProfileUpdated}
        />
      )}

      {/* Full Settings Modal Sheet */}
      <SettingsSheet
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        onSignOutRequest={() => setSignOutModalVisible(true)}
        isLoggedIn={isLoggedIn}
        isAnonymous={isAnonymous}
      />

      {/* Sign Out Confirmation Modal */}
      <ConfirmModal
        visible={signOutModalVisible}
        title={isAnonymous ? 'Exit Guest Mode' : 'Sign Out'}
        message={
          isAnonymous
            ? 'Your temporary guest session will end. You can start a new session or sign in anytime.'
            : 'Are you sure you want to sign out of your EatInformed account?'
        }
        confirmText={isAnonymous ? 'Exit' : 'Sign Out'}
        cancelText="Cancel"
        destructive
        onCancel={() => setSignOutModalVisible(false)}
        onConfirm={confirmSignOut}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  watermarkTicker: {
    position: 'absolute',
    top: 40,
    alignSelf: 'center',
    zIndex: 0,
  },
  watermarkText: {
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: 8,
  },
  headerSettingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMetaCol: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  displayName: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    maxWidth: 150,
  },
  userHandle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    marginTop: 2,
  },
  heroActionBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  actionCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authRow: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'flex-start',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  pillCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  pillValue: {
    fontSize: typography.fontSizes.md,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  pillLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  settingsShortcutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsShortcutIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsShortcutText: {
    flex: 1,
  },
  settingsShortcutTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '700',
  },
  settingsShortcutDesc: {
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
  },
  diagnosticBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  diagnosticText: {
    fontSize: typography.fontSizes.xs,
    flex: 1,
  },
});
