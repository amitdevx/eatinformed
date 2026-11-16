import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer, LinkingOptions, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { ThemeProvider, useTheme } from './theme/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RootStackParamList, BottomTabParamList } from './navigation/types';

import HomeScreen from './screens/HomeScreen';
import ScanScreen from './screens/ScanScreen';
import HistoryScreen from './screens/HistoryScreen';
import GuideScreen from './screens/GuideScreen';
import ProfileScreen from './screens/ProfileScreen';
import ResultScreen from './screens/ResultScreen';
import AuthScreen from './screens/AuthScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import SignedOutScreen from './screens/SignedOutScreen';
import { checkApiHealth } from './api/client';
import { FloatingNavBar } from './components/FloatingNavBar';
import { isNavigationLink } from './navigation/links';

const Tab = createBottomTabNavigator<BottomTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['eatinformed://', 'https://eatinformed.amitdevx.tech'],
  filter: isNavigationLink,
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

function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingNavBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Scan" component={ScanScreen} />
      <Tab.Screen name="Guide" component={GuideScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function MainApp() {
  const { colors, isDark } = useTheme();
  const { authStatus, completeOnboarding, session } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      checkApiHealth().catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
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

  if (authStatus === 'initializing') {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (authStatus === 'onboarding') {
    return (
      <SafeAreaProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <OnboardingScreen onComplete={completeOnboarding} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer linking={linking} theme={navTheme}>
        <Stack.Navigator
          key={authStatus === 'authenticated' ? `account:${session?.uid}:${session?.isAnonymous ? 'guest' : 'member'}` : 'signed-out'}
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Group navigationKey={authStatus === 'authenticated' ? `account:${session?.uid}:${session?.isAnonymous ? 'guest' : 'member'}` : 'signed-out'}>
          {authStatus === 'signed_out' ? (
            <Stack.Screen name="SignedOut" component={SignedOutScreen} />
          ) : (
            <>
              <Stack.Screen name="Main" component={TabNavigator} />
              <Stack.Screen
                name="Result"
                component={ResultScreen}
                options={{
                  animation: 'slide_from_bottom',
                }}
              />
            </>
          )}
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          </Stack.Group>
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
