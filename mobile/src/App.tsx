import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { NavigationContainer, LinkingOptions, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  Home,
  ScanLine,
  History,
  BookOpen,
  User,
} from 'lucide-react-native';

import { ThemeProvider, useTheme } from './theme/ThemeContext';
import { SpringPresets } from './theme/animations';
import { RootStackParamList, BottomTabParamList } from './navigation/types';

import HomeScreen from './screens/HomeScreen';
import ScanScreen from './screens/ScanScreen';
import HistoryScreen from './screens/HistoryScreen';
import GuideScreen from './screens/GuideScreen';
import ProfileScreen from './screens/ProfileScreen';
import ResultScreen from './screens/ResultScreen';
import AuthScreen from './screens/AuthScreen';
import { getUserSession } from './lib/auth';

const Tab = createBottomTabNavigator<BottomTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['eatinformed://', 'https://eatinformed.amitdevx.tech'],
  config: {
    screens: {
      Main: {
        screens: {
          Home: 'home',
          Scan: 'scan',
          History: 'history',
          Guide: 'guide',
          Profile: 'profile',
        },
      },
      Result: 'result',
      Auth: 'auth',
    },
  },
};

function AnimatedTabIcon({
  focused,
  children,
}: {
  focused: boolean;
  children: React.ReactNode;
}) {
  const scale = useRef(new Animated.Value(focused ? 1.06 : 1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.08 : 1,
      ...SpringPresets.snappy,
    }).start();
  }, [focused, scale]);

  return (
    <Animated.View style={{ transform: [{ scale }], alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </Animated.View>
  );
}

function TabNavigator() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const bottomPadding = insets.bottom > 0 ? insets.bottom : 10;
  const tabBarHeight = 58 + bottomPadding;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: bottomPadding,
          paddingTop: 6,
          elevation: 0,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ color, size, focused }) => {
          const strokeWidth = focused ? 2.3 : 1.9;
          switch (route.name) {
            case 'Home':
              return (
                <AnimatedTabIcon focused={focused}>
                  <Home size={size} color={color} strokeWidth={strokeWidth} />
                </AnimatedTabIcon>
              );
            case 'Scan':
              return (
                <AnimatedTabIcon focused={focused}>
                  <View
                    style={[
                      styles.scanTabIcon,
                      {
                        backgroundColor: focused ? colors.primaryButton : colors.primaryMuted,
                        borderColor: focused ? colors.primaryButton : colors.primaryBorder,
                      },
                    ]}
                  >
                    <ScanLine
                      size={20}
                      color={focused ? colors.onPrimary : colors.primary}
                      strokeWidth={2.2}
                    />
                  </View>
                </AnimatedTabIcon>
              );
            case 'History':
              return (
                <AnimatedTabIcon focused={focused}>
                  <History size={size} color={color} strokeWidth={strokeWidth} />
                </AnimatedTabIcon>
              );
            case 'Guide':
              return (
                <AnimatedTabIcon focused={focused}>
                  <BookOpen size={size} color={color} strokeWidth={strokeWidth} />
                </AnimatedTabIcon>
              );
            case 'Profile':
              return (
                <AnimatedTabIcon focused={focused}>
                  <User size={size} color={color} strokeWidth={strokeWidth} />
                </AnimatedTabIcon>
              );
            default:
              return <Home size={size} color={color} />;
          }
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Scan" component={ScanScreen} options={{ title: 'Scan' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'History' }} />
      <Tab.Screen name="Guide" component={GuideScreen} options={{ title: 'Guide' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

function MainApp() {
  const { colors, isDark } = useTheme();

  // ponytail: restore active user session & auth token on cold app start
  useEffect(() => {
    getUserSession().catch(() => {});
  }, []);

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer linking={linking} theme={navTheme}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen
            name="Result"
            component={ResultScreen}
            options={{
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: -0.1,
    marginTop: 2,
  },
  scanTabIcon: {
    width: 38,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
