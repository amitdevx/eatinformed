import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface NameTickerProps {
  text: string;
  color?: string;
  rows?: number;
  size?: number;
  speed?: number;
  running?: boolean;
}

// ponytail: GymMane-grade 120Hz hardware-accelerated infinite scrolling background watermark ticker
// Alternating rows translate in opposite directions entirely on the native render thread via useNativeDriver: true
export const NameTicker = React.memo(function NameTicker({
  text = 'EATINFORMED',
  color = 'rgba(255, 255, 255, 0.07)',
  rows = 5,
  size = 72,
  speed = 40,
  running = true,
}: NameTickerProps) {
  const displayText = (text.trim().toUpperCase() || 'EATINFORMED') + '  ·  ';
  // Approximate width per item based on character count and font size
  const itemWidth = Math.max(displayText.length * size * 0.58, SCREEN_WIDTH * 1.2);
  const duration = Math.round((itemWidth / speed) * 1000);

  const scrollForward = useRef(new Animated.Value(0)).current;
  const scrollReverse = useRef(new Animated.Value(-itemWidth)).current;

  useEffect(() => {
    if (!running) return;

    scrollForward.setValue(0);
    scrollReverse.setValue(-itemWidth);

    const forwardLoop = Animated.loop(
      Animated.timing(scrollForward, {
        toValue: -itemWidth,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const reverseLoop = Animated.loop(
      Animated.timing(scrollReverse, {
        toValue: 0,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    forwardLoop.start();
    reverseLoop.start();

    return () => {
      forwardLoop.stop();
      reverseLoop.stop();
    };
  }, [duration, itemWidth, running, scrollForward, scrollReverse]);

  const rowIndices = Array.from({ length: rows }, (_, i) => i);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.container}>
        {rowIndices.map((rowIndex) => {
          const isEven = rowIndex % 2 === 0;
          const translateX = isEven ? scrollForward : scrollReverse;
          const rowPace = 1 + (rowIndex % 3) * 0.12;

          return (
            <View key={rowIndex} style={[styles.row, { height: size * 0.95 }]}>
              <Animated.View
                style={[
                  styles.animatedTrack,
                  {
                    transform: [{ translateX }],
                    opacity: 0.85 + (rowIndex % 2) * 0.15,
                  },
                ]}
              >
                {/* Render enough repeating blocks to ensure continuous coverage across 120Hz translation */}
                <Text
                  style={[
                    styles.tickerText,
                    {
                      fontSize: size,
                      color,
                      letterSpacing: -size * 0.035,
                      lineHeight: size * 1.05,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {displayText.repeat(8)}
                </Text>
              </Animated.View>
            </View>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  row: {
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  animatedTrack: {
    flexDirection: 'row',
    width: SCREEN_WIDTH * 8,
  },
  tickerText: {
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});
