import Animated, { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import { ScrollMotionContext } from '../theme/motion';
import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
  RefreshControlProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { layout } from '../theme/tokens';

interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  scrollable?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

export function Screen({
  children,
  style,
  contentContainerStyle,
  scrollable = false,
  refreshControl,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const scroll = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler(e => { scroll.set(e.contentOffset.y); });
  const { colors } = useTheme();

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: insets.top,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };

  if (scrollable) {
    return (
      <KeyboardAvoidingView
        style={containerStyle}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollMotionContext.Provider value={scroll}>
        <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16}
          style={[{ flex: 1 }, style]}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 104 + insets.bottom },
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </Animated.ScrollView>
        </ScrollMotionContext.Provider>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={containerStyle}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, style]}>{children}</View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 104,
  },
});
