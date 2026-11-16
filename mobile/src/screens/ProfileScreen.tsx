import { ProfileReveal } from '../components/ProfileReveal';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  PanResponder,
  Dimensions,
  Pressable,
  ScrollView,
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
  Camera,
  Leaf,
  ScanLine,
  QrCode,
  Calendar,
  AlertCircle,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassSurface } from '../components/GlassSurface';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { ConfirmModal } from '../components/ConfirmModal';
import { EditProfileSheet } from '../components/EditProfileSheet';
import { SettingsSheet } from '../components/SettingsSheet';
import { YearActivityChart } from '../components/YearActivityChart';
import { RollingNumber } from '../components/RollingNumber';
import { NameTicker } from '../components/NameTicker';
import { FoodPassportModal } from '../components/FoodPassportModal';
import { checkApiHealth } from '../api/client';
import { getUserSession, clearUserSession, UserSessionData } from '../lib/auth';
import { useAuth } from '../context/AuthContext';
import { exportScanHistory, getFullScanLedger, getScanHistory, getYearlyHistogramData } from '../lib/history';
import { HistoryItem } from '../types';
import { useTheme } from '../theme/ThemeContext';
import { FadeInView, PressableScale, SpringPresets } from '../theme/animations';
import { AppHaptics } from '../lib/haptics';
import { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const RAW_PULL_THRESHOLD = 110.0;
const REACH_THRESHOLD = 200.0;

// Achievement Medals Definition (GymMane Medal Shelf with theme icons)
const AWARDS_CONFIG = [
  {
    id: 'first_scan',
    title: 'First Audit',
    desc: '1st scan logged',
    Icon: ScanLine,
    color: '#10B981',
    checkEarned: (count: number) => count >= 1,
  },
  {
    id: 'clean_eater',
    title: 'Clean Eater',
    desc: '5+ clean items',
    Icon: Leaf,
    color: '#10B981',
    checkEarned: (count: number, cleanRatio: number) => count >= 5 && cleanRatio >= 50,
  },
  {
    id: 'scout',
    title: 'Label Scout',
    desc: '10+ products',
    Icon: Award,
    color: '#3B82F6',
    checkEarned: (count: number) => count >= 10,
  },
  {
    id: 'shield',
    title: 'Bio Shield',
    desc: '25+ products',
    Icon: Shield,
    color: '#8B5CF6',
    checkEarned: (count: number) => count >= 25,
  },
  {
    id: 'flame',
    title: 'Daily Streak',
    desc: 'Active routine',
    Icon: Flame,
    color: '#EF4444',
    checkEarned: (count: number) => count >= 3,
  },
];

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { colors, theme: currentTheme, isDark } = useTheme();
  const { signOut: authSignOut } = useAuth();

  const [session, setSession] = useState<UserSessionData | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);

  const [recentScans, setRecentScans] = useState<HistoryItem[]>([]);
  const [scanCount, setScanCount] = useState<number>(0);
  const [cleanRatio, setCleanRatio] = useState<number>(0);
  const [yearStats, setYearStats] = useState<{ monthlyCounts: number[]; totalScans: number }>({
    monthlyCounts: new Array(12).fill(0),
    totalScans: 0,
  });

  const [signOutModalVisible, setSignOutModalVisible] = useState(false);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [passportVisible, setPassportVisible] = useState(false);

  const avatarRef = useRef<View>(null);
  const loadData = useCallback(async () => {
    try {
      const activeSession = await getUserSession();
      if (activeSession && activeSession.isLoggedIn) {
        setSession(activeSession);
        setIsLoggedIn(true);
        setIsAnonymous(!!activeSession.isAnonymous);
        setUserEmail(activeSession.email || null);
        setUserName(activeSession.name || null);
        setUserPhoto(activeSession.photoUrl || null);
      } else {
        setIsLoggedIn(false);
        setIsAnonymous(true);
        setUserEmail(null);
        setUserName('Guest Explorer');
      }

      const [history, yearData] = await Promise.all([
        getFullScanLedger(),
        getYearlyHistogramData(),
      ]);
      setRecentScans(history.slice(0, 4));
      setScanCount(history.length);
      setYearStats(yearData);

      if (history.length > 0) {
        const cleanCount = history.filter((s) => (s.novaGroup || 4) <= 2).length;
        setCleanRatio(Math.round((cleanCount / history.length) * 100));
      } else {
        setCleanRatio(0);
      }
    } catch (_) {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleProfileUpdated = (updated: UserSessionData) => {
    setSession(updated);
    setUserName(updated.name);
    setUserPhoto(updated.photoUrl || null);
  };

  const handleAuthAction = () => {
    if (isLoggedIn && !isAnonymous) {
      setSignOutModalVisible(true);
    } else {
      navigation.navigate('Auth', { initialTab: 'login' });
    }
  };

  const confirmSignOut = async () => {
    setSignOutModalVisible(false);
    AppHaptics.selection();
    await authSignOut();
  };

  const currentLevel = scanCount >= 20 ? 'Master' : scanCount >= 5 ? 'Scout' : 'Novice';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ProfileReveal name={userName || 'Guest Explorer'} email={userEmail || ''} photo={userPhoto} handle={session?.handle} count={scanCount} clean={cleanRatio} avatarRef={avatarRef}>
            {/* Profile Header Block with Banner & Avatar */}
            <View style={styles.headerBlock}>
              {/* Settings Gear Button (Top-Right Glass Circle) */}
              <Pressable
                onPress={() => {
                  AppHaptics.selection();
                  setSettingsVisible(true);
                }}
                hitSlop={8}
                style={[
                  styles.settingsCircleBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                    borderColor: colors.border,
                  },
                ]}
              >
                <Settings size={18} color={colors.text} />
              </Pressable>

              {/* Avatar + Edit Badge */}
              <View style={styles.avatarRow}>
                <View ref={avatarRef} collapsable={false}>
                <PressableScale
                  onPress={() => setEditProfileVisible(true)}
                  style={[styles.avatarCircle, { borderColor: colors.primary, backgroundColor: colors.surfaceRaised }]}
                >
                  {userPhoto ? (
                    <Image source={{ uri: userPhoto }} style={styles.avatarImage} />
                  ) : (
                    <Text style={[styles.avatarLetter, { color: colors.primary }]}>
                      {(userName || 'G')[0].toUpperCase()}
                    </Text>
                  )}
                  <View style={[styles.avatarCameraBadge, { backgroundColor: colors.primary }]}>
                    <Camera size={12} color="#FFFFFF" />
                  </View>
                </PressableScale>
                </View>

                {/* Identity Info */}
                <View style={styles.identityMeta}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.userNameText, { color: colors.text }]} numberOfLines={1}>
                      {userName || 'Guest Explorer'}
                    </Text>
                  </View>
                  <Text style={[styles.userHandleText, { color: colors.textSecondary }]} numberOfLines={1}>
                    {userEmail || 'Anonymous account'}
                  </Text>

                  {/* Membership Tier Badge */}
                  <View style={styles.tierPillsRow}>
                    <View style={[styles.tierBadge, { backgroundColor: colors.primary + '20' }]}>
                      <Shield size={12} color={colors.primary} />
                      <Text style={[styles.tierBadgeText, { color: colors.primary }]}>
                        {isAnonymous ? 'GUEST EXPLORER' : 'MEMBER'}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => setEditProfileVisible(true)}
                      style={[styles.editProfilePill, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}
                    >
                      <Edit3 size={11} color={colors.textSecondary} />
                      <Text style={[styles.editProfileText, { color: colors.textSecondary }]}>Edit</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>

            {/* Quick Stat Horizontal Pills Row */}
            <View style={styles.pillsRow}>
              <View style={[styles.statPill, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
                <ScanLine size={14} color={colors.primary} />
                <RollingNumber value={scanCount} style={[styles.pillValue, { color: colors.text }]} />
                <Text style={[styles.pillLabel, { color: colors.textSecondary }]}>Scans</Text>
              </View>

              <View style={[styles.statPill, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
                <Leaf size={14} color="#10B981" />
                <Text style={[styles.pillValue, { color: colors.text }]}>{cleanRatio}%</Text>
                <Text style={[styles.pillLabel, { color: colors.textSecondary }]}>Clean</Text>
              </View>

              <View style={[styles.statPill, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
                <Flame size={14} color="#EF4444" />
                <Text style={[styles.pillValue, { color: colors.text }]}>{yearStats.totalScans}</Text>
                <Text style={[styles.pillLabel, { color: colors.textSecondary }]}>This year</Text>
              </View>

              <View style={[styles.statPill, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
                <Award size={14} color="#F59E0B" />
                <Text style={[styles.pillValue, { color: colors.text }]}>{currentLevel}</Text>
              </View>
            </View>

            {/* GYMMANE BOX 1: Achievements & Badges Shelf (Theme Icons & Real Earned Logic) */}
            <View style={[styles.gymBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View
                style={[
                  styles.gymBoxDisplay,
                  {
                    backgroundColor: isDark ? '#000000' : colors.surfaceRaised,
                  },
                ]}
              >
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.medalsTrack}>
                  {AWARDS_CONFIG.map((award) => {
                    const isEarned = award.checkEarned(scanCount, cleanRatio);
                    const AwardIcon = award.Icon;
                    return (
                      <View key={award.id} style={styles.medalCard}>
                        <View
                          style={[
                            styles.medalBadgeCircle,
                            {
                              backgroundColor: isEarned ? award.color + '22' : colors.surfaceRaised,
                              borderColor: isEarned ? award.color : colors.border,
                              opacity: isEarned ? 1 : 0.4,
                            },
                          ]}
                        >
                          <AwardIcon
                            size={20}
                            color={isEarned ? award.color : colors.textMuted}
                            strokeWidth={isEarned ? 2.4 : 1.8}
                          />
                        </View>
                        <Text style={[styles.medalTitleText, { color: colors.text }]} numberOfLines={1}>
                          {award.title}
                        </Text>
                        <Text style={[styles.medalDescText, { color: colors.textSecondary }]} numberOfLines={1}>
                          {award.desc}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Box Footer with Title & Count */}
              <View style={styles.gymBoxFooter}>
                <View style={styles.boxTitleRow}>
                  <Text style={[styles.boxTitleText, { color: colors.text }]}>Achievements</Text>
                  <Text style={[styles.boxCountText, { color: colors.textSecondary }]}>
                    {AWARDS_CONFIG.filter((a) => a.checkEarned(scanCount, cleanRatio)).length}/{AWARDS_CONFIG.length} Unlocked
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    AppHaptics.selection();
                    setPassportVisible(true);
                  }}
                  style={[styles.seeAllPill, { backgroundColor: colors.surfaceRaised }]}
                >
                  <Text style={[styles.seeAllText, { color: colors.textSecondary }]}>Passport</Text>
                  <ChevronRight size={13} color={colors.textSecondary} />
                </Pressable>
              </View>
            </View>

            {/* GYMMANE BOX 2: Recent Scan Snapshots Polaroid Fan */}
            <View style={[styles.gymBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Pressable
                onPress={() => navigation.navigate('Main', { screen: 'History' })}
                style={[
                  styles.gymBoxDisplay,
                  {
                    backgroundColor: isDark ? '#000000' : colors.surfaceRaised,
                    height: 140,
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                ]}
              >
                {recentScans.length > 0 ? (
                  <View style={styles.snapshotFanTrack}>
                    {recentScans.slice(0, 4).map((scan, index) => {
                      const count = Math.min(recentScans.length, 4);
                      const rotations = ['-6deg', '4deg', '-3deg', '5deg'];
                      const rot = rotations[index % rotations.length];
                      return (
                        <View
                          key={scan.id || index}
                          style={[
                            styles.polaroidCard,
                            {
                              backgroundColor: colors.surfaceRaised,
                              borderColor: colors.border,
                              transform: [{ rotate: rot }],
                              left: (index - (count - 1) / 2) * 54,
                            },
                          ]}
                        >
                          <View style={[styles.polaroidImgBox, { backgroundColor: colors.primary + '15' }]}>
                            {scan.imagePreviewUrl ? (
                              <Image source={{ uri: scan.imagePreviewUrl }} style={styles.polaroidImage} />
                            ) : (
                              <ScanLine size={18} color={colors.primary} />
                            )}
                          </View>
                          <Text style={[styles.polaroidName, { color: colors.text }]} numberOfLines={1}>
                            {scan.productName || 'Food Item'}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.emptySnapshots}>
                    <ScanLine size={28} color={colors.textSecondary} />
                    <Text style={[styles.emptySnapshotText, { color: colors.textSecondary }]}>
                      No scanned food snapshots yet
                    </Text>
                  </View>
                )}
              </Pressable>

              <View style={styles.gymBoxFooter}>
                <View style={styles.boxTitleRow}>
                  <Text style={[styles.boxTitleText, { color: colors.text }]}>Recent Snapshots</Text>
                  <Text style={[styles.boxCountText, { color: colors.textSecondary }]}>{scanCount}</Text>
                </View>
                <Pressable
                  onPress={() => navigation.navigate('Main', { screen: 'History' })}
                  style={[styles.seeAllPill, { backgroundColor: colors.surfaceRaised }]}
                >
                  <Text style={[styles.seeAllText, { color: colors.textSecondary }]}>History</Text>
                  <ChevronRight size={13} color={colors.textSecondary} />
                </Pressable>
              </View>
            </View>

            {/* GYMMANE BOX 3: 12-Month Logging Histogram */}
            <View style={[styles.gymBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View
                style={[
                  styles.gymBoxDisplay,
                  {
                    backgroundColor: isDark ? '#000000' : colors.surfaceRaised,
                  },
                ]}
              >
                <YearActivityChart
                  monthlyCounts={yearStats.monthlyCounts}
                  totalScans={yearStats.totalScans}
                  cleanPercentage={cleanRatio}
                />
              </View>

              <View style={styles.gymBoxFooter}>
                <View style={styles.boxTitleRow}>
                  <Text style={[styles.boxTitleText, { color: colors.text }]}>Annual Density</Text>
                  <Text style={[styles.boxCountText, { color: colors.textSecondary }]}>12 Months</Text>
                </View>
              </View>
            </View>
      </ProfileReveal>

      <EditProfileSheet
        visible={editProfileVisible}
        onClose={() => setEditProfileVisible(false)}
        currentSession={session}
        onProfileUpdated={handleProfileUpdated}
      />

      <SettingsSheet
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        onSignOutRequest={() => {
          setSettingsVisible(false);
          setSignOutModalVisible(true);
        }}
        isLoggedIn={isLoggedIn}
        isAnonymous={isAnonymous}
      />

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  watermarkWrapper: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  animatedScrollContainer: {
    flex: 1,
    zIndex: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 18,
  },
  grabberSection: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  grabberPill: {
    height: 4,
    borderRadius: 2,
  },
  grabberText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  headerBlock: {
    position: 'relative',
    marginTop: 6,
  },
  settingsCircleBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  avatarLetter: {
    fontSize: 34,
    fontWeight: '900',
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  identityMeta: {
    flex: 1,
    paddingRight: 40,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userNameText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  userHandleText: {
    fontSize: 13,
    marginTop: 2,
  },
  tierPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tierBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  editProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  editProfileText: {
    fontSize: 10,
    fontWeight: '700',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 6,
  },
  pillValue: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  pillLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  gymBox: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 6,
    overflow: 'hidden',
  },
  gymBoxDisplay: {
    borderRadius: 22,
    overflow: 'hidden',
    padding: 12,
  },
  gymBoxFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  boxTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  boxTitleText: {
    fontSize: 14,
    fontWeight: '800',
  },
  boxCountText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  seeAllPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  seeAllText: {
    fontSize: 11,
    fontWeight: '700',
  },
  medalsTrack: {
    gap: 12,
    paddingVertical: 6,
  },
  medalCard: {
    width: 82,
    alignItems: 'center',
    gap: 4,
  },
  medalBadgeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medalIconText: {
    fontSize: 22,
  },
  medalTitleText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  medalDescText: {
    fontSize: 9.5,
    textAlign: 'center',
  },
  snapshotFanTrack: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: 120,
    position: 'relative',
  },
  polaroidCard: {
    position: 'absolute',
    width: 86,
    height: 110,
    borderRadius: 14,
    borderWidth: 1,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  polaroidImgBox: {
    width: 74,
    height: 74,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  polaroidImage: {
    width: '100%',
    height: '100%',
  },
  polaroidName: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySnapshots: {
    alignItems: 'center',
    gap: 6,
  },
  emptySnapshotText: {
    fontSize: 12,
    fontWeight: '500',
  },
  passportCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passportCardMeta: {
    gap: 4,
  },
  passportCardTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  passportCardId: {
    fontSize: 11,
    fontWeight: '800',
  },
  passportShieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  passportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  passportBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  tapToInspectText: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  diagnosticCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  diagnosticHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  diagnosticTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  diagnosticMessage: {
    fontSize: 11,
  },
  actionsBlock: {
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
});
