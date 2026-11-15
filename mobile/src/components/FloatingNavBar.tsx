import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  Home,
  History,
  ScanLine,
  BookOpen,
  User,
  Camera,
  Image as ImageIcon,
  Sparkles,
  X,
} from 'lucide-react-native';
import { GlassSurface } from './GlassSurface';
import { useTheme } from '../theme/ThemeContext';
import { SpringPresets } from '../theme/animations';
import { AppHaptics } from '../lib/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NAV_BAR_HEIGHT = 68;

interface TabConfig {
  name: string;
  label: string;
  icon: any;
}

const TABS: TabConfig[] = [
  { name: 'Home', label: 'Home', icon: Home },
  { name: 'History', label: 'History', icon: History },
  // Center Slot 2 is Scan FAB
  { name: 'Guide', label: 'Guide', icon: BookOpen },
  { name: 'Profile', label: 'Profile', icon: User },
];

// ponytail: GymMane-grade 120Hz hardware-accelerated floating acrylic navigation island with native GPU transform physics
export function FloatingNavBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [quickScanModalVisible, setQuickScanModalVisible] = useState(false);
  const currentRouteName = state.routes[state.index]?.name;
  const isScanActive = currentRouteName === 'Scan';

  const activeTabIndex = TABS.findIndex((t) => t.name === currentRouteName);

  // Animated values using 100% native driver for 120Hz GPU render thread execution
  const thumbTranslateX = useRef(new Animated.Value(0)).current;
  const fabScale = useRef(new Animated.Value(1)).current;
  const glowPulse = useRef(new Animated.Value(1)).current;

  // Bar width locked to responsive max 420px, 5 slots total
  const barWidth = Math.min(SCREEN_WIDTH - 32, 420);
  const slotWidth = barWidth / 5;
  const pillWidth = slotWidth - 10;
  const pillHeight = NAV_BAR_HEIGHT - 16;

  useEffect(() => {
    if (activeTabIndex !== -1) {
      // Slot 0, 1 -> Slot 0, 1; Slot 2, 3 -> Slot 3, 4 (Slot 2 reserved for center FAB)
      const targetSlot = activeTabIndex < 2 ? activeTabIndex : activeTabIndex + 1;
      Animated.spring(thumbTranslateX, {
        toValue: targetSlot * slotWidth,
        ...SpringPresets.fluid,
      }).start();
    }
  }, [activeTabIndex, slotWidth, thumbTranslateX]);

  // Subtle breathing glow for center Scan FAB
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1.15,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 1.0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [glowPulse]);

  const handleTabPress = (routeName: string) => {
    AppHaptics.selection();
    const route = state.routes.find((r) => r.name === routeName);
    const event = navigation.emit({
      type: 'tabPress',
      target: route?.key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  const handleScanPressIn = () => {
    Animated.spring(fabScale, {
      toValue: 0.88,
      ...SpringPresets.snappy,
    }).start();
  };

  const handleScanPressOut = () => {
    Animated.spring(fabScale, {
      toValue: 1,
      ...SpringPresets.bouncy,
    }).start();
  };

  const handleScanPress = () => {
    AppHaptics.impactHeavy();
    handleTabPress('Scan');
  };

  const handleScanLongPress = () => {
    AppHaptics.impactHeavy();
    setQuickScanModalVisible(true);
  };

  const bottomOffset = Math.max(insets.bottom + 6, 18);

  return (
    <>
      <View
        style={[
          styles.outerWrapper,
          {
            bottom: bottomOffset,
            width: barWidth,
          },
        ]}
        pointerEvents="box-none"
      >
        <GlassSurface
          borderRadius={NAV_BAR_HEIGHT / 2}
          intensity={32}
          hasBorder={true}
          style={styles.glassContainer}
        >
          <View style={styles.slotsRow}>
            {/* 120Hz Hardware-Accelerated Sliding Capsule Pill */}
            {activeTabIndex !== -1 && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.activeCapsule,
                  {
                    width: pillWidth,
                    height: pillHeight,
                    backgroundColor: colors.surfaceRaised,
                    borderColor: colors.border,
                    transform: [{ translateX: thumbTranslateX }],
                  },
                ]}
              />
            )}

            {/* Tab 0: Home */}
            <Pressable
              onPress={() => handleTabPress('Home')}
              style={[styles.slotPressable, { width: slotWidth }]}
              accessibilityRole="button"
              accessibilityLabel="Home"
            >
              <Home
                size={22}
                strokeWidth={currentRouteName === 'Home' ? 2.5 : 1.9}
                color={currentRouteName === 'Home' ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.slotLabel,
                  {
                    color: currentRouteName === 'Home' ? colors.primary : colors.textSecondary,
                    fontWeight: currentRouteName === 'Home' ? '700' : '500',
                  },
                ]}
                numberOfLines={1}
              >
                Home
              </Text>
            </Pressable>

            {/* Tab 1: History */}
            <Pressable
              onPress={() => handleTabPress('History')}
              style={[styles.slotPressable, { width: slotWidth }]}
              accessibilityRole="button"
              accessibilityLabel="History"
            >
              <History
                size={22}
                strokeWidth={currentRouteName === 'History' ? 2.5 : 1.9}
                color={currentRouteName === 'History' ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.slotLabel,
                  {
                    color: currentRouteName === 'History' ? colors.primary : colors.textSecondary,
                    fontWeight: currentRouteName === 'History' ? '700' : '500',
                  },
                ]}
                numberOfLines={1}
              >
                History
              </Text>
            </Pressable>

            {/* Slot 2: Radiant Center Scan FAB */}
            <View style={[styles.fabContainer, { width: slotWidth }]}>
              {/* Breathing Glow Halo */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.fabGlowHalo,
                  {
                    backgroundColor: colors.primary,
                    transform: [{ scale: glowPulse }],
                    opacity: isDark ? 0.35 : 0.22,
                  },
                ]}
              />

              <Pressable
                onPressIn={handleScanPressIn}
                onPressOut={handleScanPressOut}
                onPress={handleScanPress}
                onLongPress={handleScanLongPress}
                delayLongPress={350}
                style={styles.fabPressable}
                accessibilityRole="button"
                accessibilityLabel="Scan food label"
              >
                <Animated.View
                  style={[
                    styles.fabCircle,
                    {
                      backgroundColor: colors.primary,
                      transform: [{ scale: fabScale }],
                      shadowColor: colors.primary,
                    },
                  ]}
                >
                  <ScanLine size={26} color="#FFFFFF" strokeWidth={2.4} />
                </Animated.View>
              </Pressable>
            </View>

            {/* Tab 3: Guide */}
            <Pressable
              onPress={() => handleTabPress('Guide')}
              style={[styles.slotPressable, { width: slotWidth }]}
              accessibilityRole="button"
              accessibilityLabel="Guide"
            >
              <BookOpen
                size={22}
                strokeWidth={currentRouteName === 'Guide' ? 2.5 : 1.9}
                color={currentRouteName === 'Guide' ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.slotLabel,
                  {
                    color: currentRouteName === 'Guide' ? colors.primary : colors.textSecondary,
                    fontWeight: currentRouteName === 'Guide' ? '700' : '500',
                  },
                ]}
                numberOfLines={1}
              >
                Guide
              </Text>
            </Pressable>

            {/* Tab 4: Profile */}
            <Pressable
              onPress={() => handleTabPress('Profile')}
              style={[styles.slotPressable, { width: slotWidth }]}
              accessibilityRole="button"
              accessibilityLabel="Profile"
            >
              <User
                size={22}
                strokeWidth={currentRouteName === 'Profile' ? 2.5 : 1.9}
                color={currentRouteName === 'Profile' ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.slotLabel,
                  {
                    color: currentRouteName === 'Profile' ? colors.primary : colors.textSecondary,
                    fontWeight: currentRouteName === 'Profile' ? '700' : '500',
                  },
                ]}
                numberOfLines={1}
              >
                Profile
              </Text>
            </Pressable>
          </View>
        </GlassSurface>
      </View>

      {/* Long-Press Quick Scan Modal Sheet */}
      <Modal
        visible={quickScanModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQuickScanModalVisible(false)}
      >
        <Pressable
          style={styles.quickModalBackdrop}
          onPress={() => setQuickScanModalVisible(false)}
        >
          <View
            style={[
              styles.quickModalContent,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.quickModalHeader}>
              <View style={styles.quickHeaderTitleRow}>
                <Sparkles size={18} color={colors.primary} />
                <Text style={[styles.quickModalTitle, { color: colors.text }]}>Quick Scanner</Text>
              </View>
              <Pressable
                onPress={() => setQuickScanModalVisible(false)}
                hitSlop={8}
                style={styles.quickModalClose}
              >
                <X size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.quickActionsCol}>
              <Pressable
                style={[styles.quickActionBtn, { backgroundColor: colors.surfaceRaised }]}
                onPress={() => {
                  setQuickScanModalVisible(false);
                  navigation.navigate('Scan');
                }}
              >
                <Camera size={20} color={colors.primary} />
                <View style={styles.quickActionTexts}>
                  <Text style={[styles.quickActionTitle, { color: colors.text }]}>Live Camera</Text>
                  <Text style={[styles.quickActionDesc, { color: colors.textSecondary }]}>
                    Scan label directly with viewfinder
                  </Text>
                </View>
              </Pressable>

              <Pressable
                style={[styles.quickActionBtn, { backgroundColor: colors.surfaceRaised }]}
                onPress={() => {
                  setQuickScanModalVisible(false);
                  navigation.navigate('Scan');
                }}
              >
                <ImageIcon size={20} color="#3B82F6" />
                <View style={styles.quickActionTexts}>
                  <Text style={[styles.quickActionTitle, { color: colors.text }]}>Choose Photo</Text>
                  <Text style={[styles.quickActionDesc, { color: colors.textSecondary }]}>
                    Select saved label from gallery
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    alignSelf: 'center',
    height: NAV_BAR_HEIGHT,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 20,
  },
  glassContainer: {
    flex: 1,
    height: NAV_BAR_HEIGHT,
  },
  slotsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  activeCapsule: {
    position: 'absolute',
    left: 5,
    borderRadius: (NAV_BAR_HEIGHT - 16) / 2,
    borderWidth: 1,
  },
  slotPressable: {
    height: NAV_BAR_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
    zIndex: 2,
  },
  slotLabel: {
    fontSize: 10.5,
  },
  fabContainer: {
    height: NAV_BAR_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    zIndex: 5,
  },
  fabGlowHalo: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    top: -12,
  },
  fabPressable: {
    position: 'absolute',
    top: -14,
  },
  fabCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  quickModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  quickModalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  quickModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  quickHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickModalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  quickModalClose: {
    padding: 4,
  },
  quickActionsCol: {
    gap: 10,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    gap: 14,
  },
  quickActionTexts: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  quickActionDesc: {
    fontSize: 11.5,
    marginTop: 2,
  },
});
