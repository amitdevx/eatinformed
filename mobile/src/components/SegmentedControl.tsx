import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  LayoutChangeEvent,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { SpringPresets } from '../theme/animations';
import { borderRadius, typography } from '../theme/tokens';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: ViewStyle;
}

/**
 * Apple iOS UISegmentedControl with fluid spring-animated sliding thumb
 * and elevated contrast in both Light and Dark appearances.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  style,
}: SegmentedControlProps<T>) {
  const { colors, isDark } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);
  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  );
  const translateX = useRef(new Animated.Value(0)).current;

  const padding = 3;
  const segmentWidth =
    containerWidth > 0 ? (containerWidth - padding * 2) / options.length : 0;

  useEffect(() => {
    if (segmentWidth > 0) {
      Animated.spring(translateX, {
        toValue: activeIndex * segmentWidth,
        ...SpringPresets.fluid,
      }).start();
    }
  }, [activeIndex, segmentWidth, translateX]);

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceRaised,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {segmentWidth > 0 && (
        <Animated.View
          style={[
            styles.activeThumb,
            {
              width: segmentWidth,
              backgroundColor: isDark ? colors.surfaceHighlight : colors.surface,
              borderColor: colors.border,
              transform: [{ translateX }],
            },
          ]}
        />
      )}
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            style={styles.segment}
            onPress={() => onChange(opt.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                {
                  color: isSelected ? colors.text : colors.textSecondary,
                  fontWeight: isSelected
                    ? typography.fontWeights.semibold
                    : typography.fontWeights.medium,
                },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    position: 'relative',
    padding: 3,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    minHeight: 42,
    alignItems: 'center',
  },
  activeThumb: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    left: 3,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  label: {
    fontSize: typography.fontSizes.xs,
    letterSpacing: -0.2,
  },
});
