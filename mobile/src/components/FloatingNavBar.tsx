import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
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
import { typography, spacing, borderRadius } from '../theme/tokens';

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
  // Center is Scan FAB (Slot 2)
  { name: 'Guide', label: 'Guide', icon: BookOpen },
  { name: 'Profile', label: 'Profile', icon: User },
];

// ponytail: GymMane-grade floating acrylic glass navigation island with liquid capsule & radiant glowing scan FAB
export function FloatingNavBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [quickScanModalVisible, setQuickScanModalVisible] = useState(false);
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);

  const currentRouteName = state.routes[state.index]?.name;
  const isScanActive = currentRouteName === 'Scan';

  // Active slot index among [Home, History, Guide, Profile] (or null if on Scan)
  const activeTabIndex = TABS.findIndex((t) => t.name === currentRouteName);

  // Animated sliding thumb offset & FAB scale
  const thumbTranslateX = useRef(new Animated.Value(0)).current;
  const fabScale = useRef(new Animated.Value(1)).current;
  const glowPulse = useRef(new Animated.Value(1)).current;

  // Calculate widths: nav bar width = SCREEN_WIDTH - 32, 5 slots total (4 tabs + 1 center FAB)
  const barWidth = Math.min(SCREEN_WIDTH - 32, 420);
  const slotWidth = barWidth / 5;

  useEffect(() => {
    if (activeTabIndex !== -1) {
      // Maps activeTabIndex 0, 1 -> slot 0, 1; and 2, 3 -> slot 3, 4 (skipping slot 2 for Center FAB)
      const targetSlot = activeTabIndex < 2 ? activeTabIndex : activeTabIndex + 1;
      Animated.spring(thumbTranslateX, {
        toValue: targetSlot * slotWidth,
        ...SpringPresets.fluid,
      }).start();
    }
  }, [activeTabIndex, slotWidth, thumbTranslateX]);

  // Subtle breathing glow animation for the center Scan button (GymMane gold standard)
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1.14,
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

  const handleTabLongPress = (routeName: string) => {
    AppHaptics.impactMedium();
    handleTabPress(routeName);
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

  // Horizontal Drag Gesture tracking (GymMane _LiquidPill touch-drag sliding)
  const hoveredSlotRef = useRef<number | null>(null);
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 10,
        onPanResponderGrant: (evt) => {
          const x = evt.nativeEvent.locationX;
          const slot = Math.max(0, Math.min(4, Math.floor(x / slotWidth)));
          hoveredSlotRef.current = slot;
        },
        onPanResponderMove: (evt) => {
          const x = evt.nativeEvent.locationX;
          const clampedX = Math.max(0, Math.min(barWidth - slotWidth, x - slotWidth / 2));
          thumbTranslateX.setValue(clampedX);

          const slot = Math.max(0, Math.min(4, Math.floor(x / slotWidth)));
          if (slot !== hoveredSlotRef.current) {
            hoveredSlotRef.current = slot;
            AppHaptics.selection();
          }
        },
        onPanResponderRelease: () => {
          const slot = hoveredSlotRef.current;
          if (slot !== null) {
            if (slot === 0) handleTabPress('Home');
            else if (slot === 1) handleTabPress('History');
            else if (slot === 2) handleTabPress('Scan');
            else if (slot === 3) handleTabPress('Guide');
            else if (slot === 4) handleTabPress('Profile');
          }
        },
      }),
    [barWidth, slotWidth]
  );

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
          intensity={30}
          hasBorder={true}
          style={styles.glassContainer}
        >
          <View
            {...panResponder.panHandlers}
            style={[styles.barContent, { width: barWidth }]}
          >
            {/* GymMane Liquid Capsule Indicator */}
            {activeTabIndex !== -1 && (
              <Animated.View
                style={[
                  styles.liquidThumb,
                  {
                    width: slotWidth - 8,
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.13)'
                      : 'rgba(0, 0, 0, 0.08)',
                    transform: [{ translateX: thumbTranslateX }],
                  },
                ]}
              />
            )}

            {/* Slot 0: Home */}
            <Pressable
              accessibilityRole="tab"
              accessibilityLabel="Home tab"
              onPressIn={() => setPressedIndex(0)}
              onPressOut={() => setPressedIndex(null)}
              onPress={() => handleTabPress('Home')}
              onLongPress={() => handleTabLongPress('Home')}
              style={[
                styles.tabSlot,
                { width: slotWidth },
                pressedIndex === 0 ? styles.tabPressed : null,
              ]}
            >
              <Home
                size={22}
                color={currentRouteName === 'Home' ? colors.primary : colors.textSecondary}
                strokeWidth={currentRouteName === 'Home' ? 2.5 : 1.9}
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: currentRouteName === 'Home' ? colors.text : colors.textMuted,
                    fontWeight: currentRouteName === 'Home' ? '700' : '500',
                  },
                ]}
              >
                Home
              </Text>
            </Pressable>

            {/* Slot 1: History */}
            <Pressable
              accessibilityRole="tab"
              accessibilityLabel="Scan History tab"
              onPressIn={() => setPressedIndex(1)}
              onPressOut={() => setPressedIndex(null)}
              onPress={() => handleTabPress('History')}
              onLongPress={() => handleTabLongPress('History')}
              style={[
                styles.tabSlot,
                { width: slotWidth },
                pressedIndex === 1 ? styles.tabPressed : null,
              ]}
            >
              <History
                size={22}
                color={currentRouteName === 'History' ? colors.primary : colors.textSecondary}
                strokeWidth={currentRouteName === 'History' ? 2.5 : 1.9}
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: currentRouteName === 'History' ? colors.text : colors.textMuted,
                    fontWeight: currentRouteName === 'History' ? '700' : '500',
                  },
                ]}
              >
                History
              </Text>
            </Pressable>

            {/* Slot 2: Raised Glowing Scan FAB with Specular Halo (GymMane Gold Standard) */}
            <View style={[styles.fabSlot, { width: slotWidth }]}>
              {/* Outer Radiant Breathing Halo */}
              <Animated.View
                style={[
                  styles.fabOuterHalo,
                  {
                    backgroundColor: colors.primary,
                    transform: [{ scale: glowPulse }],
                  },
                ]}
              />

              <Animated.View style={{ transform: [{ scale: fabScale }] }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Scan food product"
                  onPressIn={handleScanPressIn}
                  onPressOut={handleScanPressOut}
                  onPress={handleScanPress}
                  onLongPress={handleScanLongPress}
                  style={[
                    styles.scanFab,
                    {
                      backgroundColor: colors.primary,
                      shadowColor: colors.primary,
                      borderColor: isDark ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.7)',
                    },
                  ]}
                >
                  <ScanLine size={24} color={colors.onPrimary} strokeWidth={2.4} />
                </Pressable>
              </Animated.View>
            </View>

            {/* Slot 3: Guide */}
            <Pressable
              accessibilityRole="tab"
              accessibilityLabel="Nutrition Guide tab"
              onPressIn={() => setPressedIndex(3)}
              onPressOut={() => setPressedIndex(null)}
              onPress={() => handleTabPress('Guide')}
              onLongPress={() => handleTabLongPress('Guide')}
              style={[
                styles.tabSlot,
                { width: slotWidth },
                pressedIndex === 3 ? styles.tabPressed : null,
              ]}
            >
              <BookOpen
                size={22}
                color={currentRouteName === 'Guide' ? colors.primary : colors.textSecondary}
                strokeWidth={currentRouteName === 'Guide' ? 2.5 : 1.9}
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: currentRouteName === 'Guide' ? colors.text : colors.textMuted,
                    fontWeight: currentRouteName === 'Guide' ? '700' : '500',
                  },
                ]}
              >
                Guide
              </Text>
            </Pressable>

            {/* Slot 4: Profile */}
            <Pressable
              accessibilityRole="tab"
              accessibilityLabel="Account and Profile tab"
              onPressIn={() => setPressedIndex(4)}
              onPressOut={() => setPressedIndex(null)}
              onPress={() => handleTabPress('Profile')}
              onLongPress={() => handleTabLongPress('Profile')}
              style={[
                styles.tabSlot,
                { width: slotWidth },
                pressedIndex === 4 ? styles.tabPressed : null,
              ]}
            >
              <User
                size={22}
                color={currentRouteName === 'Profile' ? colors.primary : colors.textSecondary}
                strokeWidth={currentRouteName === 'Profile' ? 2.5 : 1.9}
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: currentRouteName === 'Profile' ? colors.text : colors.textMuted,
                    fontWeight: currentRouteName === 'Profile' ? '700' : '500',
                  },
                ]}
              >
                Profile
              </Text>
            </Pressable>
          </View>
        </GlassSurface>
      </View>

      {/* Quick Scan Action Sheet on Long-Press (GymMane Style) */}
      <Modal
        visible={quickScanModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQuickScanModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setQuickScanModalVisible(false)}
        >
          <View
            style={[
              styles.quickScanCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.quickScanHeader}>
              <Text style={[styles.quickScanTitle, { color: colors.text }]}>Quick Food Scanner</Text>
              <Pressable
                onPress={() => setQuickScanModalVisible(false)}
                style={[styles.quickScanClose, { backgroundColor: colors.surfaceRaised }]}
              >
                <X size={16} color={colors.text} />
              </Pressable>
            </View>

            <Pressable
              style={[styles.quickScanOption, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}
              onPress={() => {
                setQuickScanModalVisible(false);
                handleTabPress('Scan');
              }}
            >
              <Camera size={20} color={colors.primary} />
              <View style={styles.optionTextCol}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>Camera Scanner</Text>
                <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
                  Instant label OCR & additive detection
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={[styles.quickScanOption, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}
              onPress={() => {
                setQuickScanModalVisible(false);
                handleTabPress('Home');
              }}
            >
              <Sparkles size={20} color={colors.warning} />
              <View style={styles.optionTextCol}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>Explore Instant Samples</Text>
                <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
                  Compare NOVA 1 vs NOVA 4 processed items
                </Text>
              </View>
            </Pressable>
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
    zIndex: 999,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.40,
    shadowRadius: 28,
    elevation: 16,
  },
  glassContainer: {
    height: NAV_BAR_HEIGHT,
  },
  barContent: {
    height: NAV_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    paddingHorizontal: 4,
  },
  liquidThumb: {
    position: 'absolute',
    top: 7,
    bottom: 7,
    left: 4,
    borderRadius: 24,
  },
  tabSlot: {
    height: NAV_BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabPressed: {
    transform: [{ scale: 0.88 }],
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: -0.2,
    marginTop: 3,
  },
  fabSlot: {
    height: NAV_BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  fabOuterHalo: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    opacity: 0.32,
    marginTop: -14,
  },
  scanFab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -14,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.82,
    shadowRadius: 18,
    elevation: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  quickScanCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  quickScanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  quickScanTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: '700',
  },
  quickScanClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickScanOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  optionTextCol: {
    flex: 1,
  },
  optionTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '700',
  },
  optionDesc: {
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
  },
});
