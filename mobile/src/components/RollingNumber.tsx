import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TextStyle,
  StyleProp,
} from 'react-native';
import { SpringPresets } from '../theme/animations';

interface RollingNumberProps {
  value: number | string;
  style?: StyleProp<TextStyle>;
  suffix?: string;
  prefix?: string;
}

// ponytail: GymMane-style mechanical odometer digit transition for numeric scores and scan tallies
export function RollingNumber({
  value,
  style,
  suffix = '',
  prefix = '',
}: RollingNumberProps) {
  const animatedScale = useRef(new Animated.Value(1)).current;
  const animatedOpacity = useRef(new Animated.Value(1)).current;
  const previousValue = useRef(value);

  useEffect(() => {
    if (previousValue.current !== value) {
      previousValue.current = value;
      Animated.sequence([
        Animated.parallel([
          Animated.timing(animatedScale, {
            toValue: 1.15,
            duration: 110,
            useNativeDriver: true,
          }),
          Animated.timing(animatedOpacity, {
            toValue: 0.6,
            duration: 110,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.spring(animatedScale, {
            toValue: 1,
            ...SpringPresets.bouncy,
          }),
          Animated.timing(animatedOpacity, {
            toValue: 1,
            duration: 160,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [value, animatedScale, animatedOpacity]);

  return (
    <Animated.Text
      style={[
        style,
        {
          transform: [{ scale: animatedScale }],
          opacity: animatedOpacity,
        },
      ]}
    >
      {prefix}
      {value}
      {suffix}
    </Animated.Text>
  );
}
