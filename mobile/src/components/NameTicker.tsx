import React, { useEffect, useState } from 'react';
import { AppState, Text, View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
function Row({ text, size, color, speed, reverse, running }: { text: string; size: number; color: string; speed: number; reverse: boolean; running: boolean }) {
  const [span, setSpan] = useState(0), { width } = useWindowDimensions();
  const offset = useSharedValue(0), reduced = useReducedMotion();
  useEffect(() => {
    if (!running || reduced || !span) { cancelAnimation(offset); return; }
    offset.set(reverse ? -span : 0);
    offset.set(withRepeat(withTiming(reverse ? 0 : -span, { duration: span / Math.max(speed, 1) * 1000, easing: Easing.linear }), -1));
    return () => cancelAnimation(offset);
  }, [span, speed, reverse, running, reduced, offset]);
  const motion = useAnimatedStyle(() => ({ transform: [{ translateX: offset.get() }] }));
  const style = { fontSize: size, fontWeight: '900' as const, color, lineHeight: size * 1.1 };
  return <View style={{ overflow: 'hidden', height: size * 1.1 }}>
    <Text onTextLayout={e => setSpan(Math.ceil(e.nativeEvent.lines[0]?.width || 0))} style={[style, { position: 'absolute', width: 10000, opacity: 0 }]} numberOfLines={1}>{text}</Text>
    {span > 0 && <Animated.View style={[{ flexDirection: 'row', width: span * (Math.ceil(width / span) + 2) }, motion]}>{Array.from({ length: Math.ceil(width / span) + 2 }, (_, i) => <Text key={i} style={[style, { width: span }]} numberOfLines={1}>{text}</Text>)}</Animated.View>}
  </View>;
}
export const NameTicker = React.memo(function NameTicker({ text, color = '#ffffff12', rows = 5, size = 72, speed = 40, running = false }: { text: string; color?: string; rows?: number; size?: number; speed?: number; running?: boolean }) {
  const [active, setActive] = useState(AppState.currentState === 'active');
  useEffect(() => { const sub = AppState.addEventListener('change', s => setActive(s === 'active')); return () => sub.remove(); }, []);
  return <View pointerEvents="none" accessibilityElementsHidden style={[StyleSheet.absoluteFill, { justifyContent: 'center', overflow: 'hidden' }]}>{Array.from({ length: rows }, (_, i) => <Row key={i} text={`${text.trim().toUpperCase() || 'EATINFORMED'}  ·  `} size={size} color={color} speed={speed} reverse={i % 2 === 1} running={running && active} />)}</View>;
});
