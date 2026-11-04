import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  Home,
  ScanLine,
  History,
  BookOpen,
  User,
} from 'lucide-react-native';

import { colors } from './theme/colors';
import { RootStackParamList, BottomTabParamList } from './navigation/types';

import HomeScreen from './screens/HomeScreen';
import ScanScreen from './screens/ScanScreen';
import HistoryScreen from './screens/HistoryScreen';
import GuideScreen from './screens/GuideScreen';
import ProfileScreen from './screens/ProfileScreen';
import ResultScreen from './screens/ResultScreen';
import AuthScreen from './screens/AuthScreen';

const Tab = createBottomTabNavigator<BottomTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ color, size, focused }) => {
          const iconSize = focused ? size + 2 : size;
          switch (route.name) {
            case 'Home':
              return <Home size={iconSize} color={color} />;
            case 'Scan':
              return (
                <View style={[styles.scanTabIcon, focused && styles.scanTabIconFocused]}>
                  <ScanLine size={iconSize} color={focused ? '#000000' : color} />
                </View>
              );
            case 'History':
              return <History size={iconSize} color={color} />;
            case 'Guide':
              return <BookOpen size={iconSize} color={color} />;
            case 'Profile':
              return <User size={iconSize} color={color} />;
            default:
              return <Home size={iconSize} color={color} />;
          }
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{ title: 'Scan' }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: 'History' }}
      />
      <Tab.Screen
        name="Guide"
        component={GuideScreen}
        options={{ title: 'Guide' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
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

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  scanTabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanTabIconFocused: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: colors.surface,
  },
});
