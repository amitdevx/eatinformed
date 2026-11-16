import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withSpring, useReducedMotion } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { BlurTargetView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NameTicker } from './NameTicker';
import { FoodPassportModal } from './FoodPassportModal';
import { AppHaptics } from '../lib/haptics';
import { useTheme } from '../theme/ThemeContext';

export function ProfileReveal({ children, name, email, photo, handle, count, clean, avatarRef, visible, onVisibleChange }: {
  children: React.ReactNode; name: string; email: string; photo: string | null; handle?: string;
  count: number; clean: number; visible: boolean; onVisibleChange: (visible: boolean) => void; avatarRef: React.RefObject<View | null>;
}) {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused(), reduced = useReducedMotion();
  const target = useRef<View>(null), scene = useRef<View>(null);
  const [dragging, setDragging] = useState(false), [armed, setArmed] = useState(false);
  const [active, setActive] = useState(AppState.currentState === 'active');
  const progress = useSharedValue(0), scrollY = useSharedValue(0), startX = useSharedValue(0), startY = useSharedValue(0);
  const eligible = useSharedValue(false), notified = useSharedValue(false), threshold = useSharedValue(false), opening = useSharedValue(false);
  const source = useSharedValue({ x: 0, y: 0, size: 82, ready: false });
  const measureAvatar = useCallback(() => {
    scene.current?.measureInWindow((sx, sy) => avatarRef.current?.measureInWindow((x, y, w) => {
      source.set({ x: x - sx, y: y - sy, size: w, ready: true });
    }));
  }, [avatarRef, source]);
  const close = useCallback(() => {
    onVisibleChange(false); setDragging(false); setArmed(false); opening.set(false);
    progress.set(withSpring(0, { duration: 400, dampingRatio: 0.8 }));
  }, [opening, progress, onVisibleChange]);
  useEffect(() => { const subscription = AppState.addEventListener('change', s => setActive(s === 'active')); return () => subscription.remove(); }, []);
  useEffect(() => { if (!focused || !active) close(); }, [focused, active, close]);
  useEffect(() => { navigation.setOptions({ tabBarStyle: visible ? { display: 'none' } : undefined }); return () => navigation.setOptions({ tabBarStyle: undefined }); }, [visible, navigation]);
  useEffect(() => {
    if (visible) { measureAvatar(); opening.set(true); progress.set(withSpring(1, { duration: 300, dampingRatio: 0.8 })); }
  }, [visible, measureAvatar, opening, progress]);
  const open = () => { onVisibleChange(true); setDragging(false); AppHaptics.success(); };
  const arm = () => { setArmed(true); AppHaptics.impactHeavy(); };
  const begin = () => { measureAvatar(); setDragging(true); setArmed(false); };
  const finish = () => { setDragging(false); setArmed(false); };
  const pan = Gesture.Pan().enabled(focused && active).manualActivation(true)
    .onTouchesDown((e, manager) => {
      const touch = e.allTouches[0];
      if (!touch || e.numberOfTouches !== 1) { manager.fail(); return; }
      startX.set(touch.absoluteX); startY.set(touch.absoluteY);
      eligible.set(scrollY.get() <= 1 && !opening.get() && touch.x > 24 && touch.x < width - 24 && touch.y > 12);
      notified.set(false); threshold.set(false);
      if (!eligible.get()) manager.fail();
    })
    .onTouchesMove((e, manager) => {
      if (!eligible.get()) { manager.fail(); return; }
      const touch = e.allTouches[0];
      if (!touch || e.numberOfTouches !== 1) { manager.fail(); return; }
      const dx = touch.absoluteX - startX.get(), dy = touch.absoluteY - startY.get();
      if (Math.abs(dx) > 12 || dy < -8) manager.fail();
      else if (dy > 12 && dy > Math.abs(dx) * 1.5) manager.activate();
    })
    .onTouchesUp((_e, manager) => { if (progress.get() === 0) manager.fail(); })
    .onStart(() => { scheduleOnRN(begin); })
    .onUpdate(e => {
      const raw = Math.max(0, e.translationY);
      const p = Math.min(1, (1 - Math.exp(-raw / 180)) / (1 - Math.exp(-210 / 180)));
      progress.set(p);
      if ((p >= 1) !== threshold.get()) { threshold.set(p >= 1); scheduleOnRN(setArmed, p >= 1); }
      if (p >= 1 && !notified.get()) { notified.set(true); scheduleOnRN(arm); }
    })
    .onEnd(() => {
      if (progress.get() >= 1 && !opening.get()) {
        opening.set(true); progress.set(withSpring(1, { duration: 300, dampingRatio: 0.8 })); scheduleOnRN(open);
      }
    })
    .onFinalize(() => {
      if (!opening.get()) { progress.set(withSpring(0, { duration: 400, dampingRatio: 0.8 })); scheduleOnRN(finish); }
    });
  const native = Gesture.Native().simultaneousWithExternalGesture(pan);
  const onScroll = useAnimatedScrollHandler(e => { scrollY.set(e.contentOffset.y); });
  const contentStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.get() * 0.65, transform: [{ translateY: reduced ? 0 : progress.get() * 115 }] }));
  const tickerStyle = useAnimatedStyle(() => ({ opacity: Math.max(0, (progress.get() - 0.15) / 0.85), transform: [{ scale: reduced ? 1 : 1.3 - progress.get() * 0.3 }] }));
  const avatarStyle = useAnimatedStyle(() => {
    const p = progress.get(), from = source.get();
    const destX = width / 2 - from.size / 2, destY = insets.top + height * 0.18;
    return { opacity: reduced || !from.ready || p === 0 ? 0 : 1,
      transform: [{ translateX: from.x + (destX - from.x) * p + Math.sin(p * Math.PI) * width * 0.12 }, { translateY: from.y + (destY - from.y) * p }, { scale: 1 + 0.2 * p }] };
  });
  return <View ref={scene} style={{ flex: 1 }} onLayout={measureAvatar}>
    <BlurTargetView ref={target} style={{ flex: 1 }} importantForAccessibility={visible ? 'no-hide-descendants' : 'auto'}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, tickerStyle]}>
        <NameTicker text={name} running={focused && active && (dragging || visible)} color={isDark ? '#ffffff18' : '#00000012'} />
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ flex: 1 }, contentStyle]} pointerEvents={visible ? 'none' : 'auto'}>
          <GestureDetector gesture={native}>
            <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} bounces={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 120, gap: 18 }}>
              <Pressable accessibilityRole="button" accessibilityLabel="Open Food Passport" onPress={() => { measureAvatar(); opening.set(true); progress.set(withSpring(1)); open(); }} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <View style={{ height: 4, width: 40, borderRadius: 2, backgroundColor: armed ? colors.primary : colors.textSecondary }} />
                <Text style={{ color: armed ? colors.primary : colors.textSecondary, fontSize: 12 }}>{armed ? 'Release to open Food Passport' : 'Pull down or tap for Food Passport'}</Text>
              </Pressable>
              {children}
            </Animated.ScrollView>
          </GestureDetector>
        </Animated.View>
      </GestureDetector>
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0, width: 82, height: 82, borderRadius: 41, backgroundColor: colors.surfaceRaised, borderColor: colors.primary, borderWidth: 2, alignItems: 'center', justifyContent: 'center' }, avatarStyle]}>
        {photo ? <Image source={{ uri: photo }} style={{ width: 78, height: 78, borderRadius: 39 }} /> : <Text style={{ fontSize: 34, color: colors.primary }}>{name[0]?.toUpperCase()}</Text>}
      </Animated.View>
    </BlurTargetView>
    <FoodPassportModal visible={visible} onClose={close} blurTarget={target} userName={name} userEmail={email} userPhoto={photo} userHandle={handle} scanCount={count} cleanScore={clean} />
  </View>;
}
