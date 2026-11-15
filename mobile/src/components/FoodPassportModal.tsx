import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Dimensions,
  Share,
  Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import {
  ShieldCheck,
  QrCode,
  Share2,
  X,
  Sparkles,
  Award,
  CheckCircle2,
  Flame,
  Leaf,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { GlassSurface } from './GlassSurface';
import { AppHaptics } from '../lib/haptics';
import { SpringPresets } from '../theme/animations';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 40, 360);
const CARD_HEIGHT = CARD_WIDTH * 1.54;

interface FoodPassportModalProps {
  visible: boolean;
  onClose: () => void;
  userName: string;
  userEmail: string;
  userHandle?: string;
  userPhoto?: string | null;
  scanCount: number;
  cleanScore?: number;
  streakDays?: number;
}

// GymMane Gym Pass / Food Passport equivalent for food & nutrition verification
export function FoodPassportModal({
  visible,
  onClose,
  userName,
  userEmail,
  userHandle,
  userPhoto,
  scanCount,
  cleanScore = 0,
  streakDays = 0,
}: FoodPassportModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      AppHaptics.impactHeavy();
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          ...SpringPresets.bouncy,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();

      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 2400,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 2400,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
    }
  }, [visible, opacityAnim, scaleAnim, shimmerAnim]);

  const handleShare = async () => {
    AppHaptics.impactMedium();
    try {
      await Share.share({
        message: `My EatInformed Nutrition Passport: ${scanCount} food labels verified, ${cleanScore}% clean eating score! Analyze what's really in your food at https://eatinformed.amitdevx.tech`,
      });
    } catch (_) {}
  };

  const handleDismiss = () => {
    AppHaptics.selection();
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  if (!visible) return null;

  const displayHandle = userHandle ? (userHandle.startsWith('@') ? userHandle : `@${userHandle}`) : '@guest';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <View style={styles.backdrop}>
        {/* Real coordinated backdrop blur (Expo BlurView) */}
        <BlurView
          intensity={isDark ? 65 : 45}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(240, 240, 240, 0.35)',
            },
          ]}
        />

        {/* Dismiss overlay */}
        <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />

        {/* Animated Passport Card Container */}
        <Animated.View
          style={[
            styles.cardContainer,
            {
              width: CARD_WIDTH,
              height: CARD_HEIGHT,
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Acrylic Glass Surface with GymMane Specular Border */}
          <GlassSurface
            intensity={40}
            borderRadius={32}
            hasBorder={true}
            style={[
              styles.cardGlass,
              {
                backgroundColor: isDark ? 'rgba(20, 20, 20, 0.88)' : 'rgba(255, 255, 255, 0.92)',
              },
            ]}
          >
            {/* Holographic Header Bar */}
            <View style={styles.cardHeader}>
              <View style={styles.headerBadgeRow}>
                <View style={[styles.chipCircle, { backgroundColor: colors.primary + '25' }]}>
                  <ShieldCheck size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>FOOD PASSPORT</Text>
                  <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                    VERIFIED BIO-IDENTITY
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={handleDismiss}
                hitSlop={12}
                style={[styles.closeIconCircle, { backgroundColor: colors.surfaceRaised }]}
              >
                <X size={16} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Passport Identity Block */}
            <View style={styles.identityRow}>
              <View style={[styles.avatarBox, { borderColor: colors.primary }]}>
                {userPhoto ? (
                  <Image source={{ uri: userPhoto }} style={styles.avatarImage} />
                ) : (
                  <Text style={[styles.avatarInitial, { color: colors.primary }]}>
                    {(userName || 'U')[0].toUpperCase()}
                  </Text>
                )}
              </View>

              <View style={styles.identityMeta}>
                <Text style={[styles.passportName, { color: colors.text }]} numberOfLines={1}>
                  {userName || 'Guest Explorer'}
                </Text>
                <Text style={[styles.passportEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                  {userEmail || 'Local Anonymous Session'}
                </Text>
                <View style={styles.passportIdRow}>
                  <Text style={[styles.memberIdText, { color: colors.primary }]}>
                    {displayHandle}
                  </Text>
                  <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                    VERIFIED PASS
                  </Text>
                </View>
              </View>
            </View>

            {/* Key Nutrition Metrics Row */}
            <View style={[styles.metricsContainer, { backgroundColor: colors.surfaceRaised + '80' }]}>
              <View style={styles.metricCell}>
                <Award size={18} color="#F59E0B" />
                <Text style={[styles.metricVal, { color: colors.text }]}>{scanCount}</Text>
                <Text style={[styles.metricLbl, { color: colors.textSecondary }]}>Labels Scanned</Text>
              </View>
              <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
              <View style={styles.metricCell}>
                <Leaf size={18} color={colors.primary} />
                <Text style={[styles.metricVal, { color: colors.text }]}>{cleanScore}%</Text>
                <Text style={[styles.metricLbl, { color: colors.textSecondary }]}>Clean Index</Text>
              </View>
              <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
              <View style={styles.metricCell}>
                <Flame size={18} color="#EF4444" />
                <Text style={[styles.metricVal, { color: colors.text }]}>{streakDays}d</Text>
                <Text style={[styles.metricLbl, { color: colors.textSecondary }]}>Streak</Text>
              </View>
            </View>

            {/* Total Scans Counter Block (Replaces fake SVG barcode) */}
            <View
              style={[
                styles.totalScansBox,
                {
                  backgroundColor: colors.surfaceRaised,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.totalScansLeft}>
                <Text style={[styles.totalScansLabel, { color: colors.textSecondary }]}>
                  LIFETIME SCANS VERIFIED
                </Text>
                <Text style={[styles.totalScansNumber, { color: colors.text }]}>
                  {scanCount}
                </Text>
              </View>
              <View style={[styles.verifiedBadge, { backgroundColor: colors.primary + '20' }]}>
                <ShieldCheck size={18} color={colors.primary} />
                <Text style={[styles.verifiedBadgeText, { color: colors.primary }]}>
                  BIO-PASS ACTIVE
                </Text>
              </View>
            </View>

            {/* Bottom Actions */}
            <View style={styles.cardActions}>
              <Pressable
                onPress={handleShare}
                style={[styles.shareBtn, { backgroundColor: colors.primary }]}
              >
                <Share2 size={16} color="#FFFFFF" />
                <Text style={styles.shareBtnText}>Share Passport</Text>
              </Pressable>
            </View>
          </GlassSurface>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.45,
    shadowRadius: 32,
    elevation: 24,
  },
  cardGlass: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chipCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  cardSubtitle: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  closeIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 12,
  },
  avatarBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 26,
    fontWeight: '900',
  },
  identityMeta: {
    flex: 1,
  },
  passportName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  passportEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  passportIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  memberIdText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  metricsContainer: {
    flexDirection: 'row',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  metricCell: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  metricLbl: {
    fontSize: 10,
    fontWeight: '600',
  },
  metricDivider: {
    width: 1,
    height: 24,
  },
  totalScansBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginVertical: 6,
  },
  totalScansLeft: {
    gap: 2,
  },
  totalScansLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  totalScansNumber: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardActions: {
    marginTop: 4,
  },
  shareBtn: {
    flexDirection: 'row',
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
