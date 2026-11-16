import React, { useCallback, useEffect } from 'react';
import { BackHandler, Image, Pressable, ScrollView, Share, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { useAnimatedStyle, useSharedValue, useReducedMotion, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { X, Share2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  visible: boolean; onClose: () => void; blurTarget: React.RefObject<View | null>;
  userName: string; userEmail: string; userHandle?: string; userPhoto?: string | null;
  scanCount: number; cleanScore?: number;
}
export function FoodPassportModal({ visible, onClose, blurTarget, userName, userEmail, userHandle, userPhoto, scanCount, cleanScore = 0 }: Props) {
  const { colors, isDark } = useTheme(), insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion(), reveal = useSharedValue(0);
  useEffect(() => { reveal.set(visible ? reduced ? 1 : withSpring(1, { duration: 300, dampingRatio: 0.8 }) : 0); }, [visible, reveal, reduced]);
  const dismiss = useCallback(() => { reveal.set(withTiming(0, { duration: reduced ? 0 : 180 }, done => { if (done) scheduleOnRN(onClose); })); }, [onClose, reduced, reveal]);
  useEffect(() => {
    if (!visible) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { dismiss(); return true; });
    return () => subscription.remove();
  }, [visible, dismiss]);
  const background = useAnimatedStyle(() => ({ opacity: reveal.get() }));
  const card = useAnimatedStyle(() => ({ opacity: reveal.get(), transform: [{ translateY: reduced ? 0 : (1 - reveal.get()) * 24 }, { scale: reduced ? 1 : 0.92 + reveal.get() * 0.08 }] }));
  if (!visible) return null;
  return <View accessibilityViewIsModal style={[StyleSheet.absoluteFill, { zIndex: 30, alignItems: 'center', justifyContent: 'center', paddingTop: insets.top, paddingBottom: insets.bottom }]}>
    <Animated.View style={[StyleSheet.absoluteFill, background]}>
      <BlurView blurTarget={blurTarget} blurMethod="dimezisBlurView" intensity={55} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <Pressable accessibilityLabel="Close Food Passport" onPress={dismiss} style={[StyleSheet.absoluteFill, { backgroundColor: '#00000050' }]} />
    </Animated.View>
    <Animated.View style={[{ width: Math.min(width - 32, 390), maxHeight: height - insets.top - insets.bottom - 32, borderRadius: 28, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, card]}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
        <View style={styles.row}>
          <Text style={{ color: colors.text, fontWeight: '800', letterSpacing: 1 }}>FOOD PASSPORT</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Close Food Passport" onPress={dismiss} style={styles.close}><X color={colors.text} size={22} /></Pressable>
        </View>
        <View style={{ alignItems: 'center', gap: 10 }}>
          {userPhoto ? <Image source={{ uri: userPhoto }} style={styles.avatar} /> : <View style={[styles.avatar, { backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }]}><Text style={{ fontSize: 36, color: colors.primary }}>{userName[0]?.toUpperCase()}</Text></View>}
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center' }}>{userName}</Text>
          <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>{userEmail || 'Anonymous account'}</Text>
          {userHandle ? <Text style={{ color: colors.primary }}>@{userHandle.replace(/^@/, '')}</Text> : null}
        </View>
        <View style={[styles.row, { gap: 12 }]}>
          <View style={styles.metric}><Text style={{ color: colors.text, fontSize: 32, fontWeight: '800' }}>{scanCount}</Text><Text style={{ color: colors.textSecondary }}>Saved scans</Text></View>
          <View style={styles.metric}><Text style={{ color: colors.text, fontSize: 32, fontWeight: '800' }}>{scanCount ? `${cleanScore}%` : '—'}</Text><Text style={{ color: colors.textSecondary, textAlign: 'center' }}>NOVA 1–2 estimates</Text></View>
        </View>
        <Text style={{ color: colors.textSecondary, lineHeight: 20 }}>Your label-reading activity. Food classifications are AI estimates, not health or identity certifications.</Text>
        <Pressable accessibilityRole="button" onPress={() => { void Share.share({ message: `My EatInformed Food Passport: ${scanCount} saved food-label scans.` }).catch(() => {}); }} style={[styles.row, { justifyContent: 'center', gap: 8, minHeight: 48, borderRadius: 24, backgroundColor: colors.primary }]}><Share2 size={18} color="#fff" /><Text style={{ color: '#fff', fontWeight: '700' }}>Share Passport</Text></Pressable>
      </ScrollView>
    </Animated.View>
  </View>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, close: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }, avatar: { width: 96, height: 96, borderRadius: 48 }, metric: { flex: 1, alignItems: 'center', gap: 6 } });
