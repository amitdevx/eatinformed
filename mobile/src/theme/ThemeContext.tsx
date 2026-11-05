import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { darkColors, lightColors } from './colors';

export type ThemeMode = 'system' | 'dark' | 'light';

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  colors: typeof darkColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const THEME_STORAGE_KEY = 'eatinformed_mobile_theme_pref';

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  isDark: true,
  colors: darkColors,
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(THEME_STORAGE_KEY)
      .then((saved) => {
        if (saved === 'dark' || saved === 'light' || saved === 'system') {
          setThemeMode(saved);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const setTheme = useCallback(async (mode: ThemeMode) => {
    setThemeMode(mode);
    try {
      await SecureStore.setItemAsync(THEME_STORAGE_KEY, mode);
    } catch (e) {
      console.warn('Failed to save theme preference:', e);
    }
  }, []);

  const isDark = themeMode === 'system' ? systemScheme !== 'light' : themeMode === 'dark';

  const toggleTheme = useCallback(() => {
    const nextMode: ThemeMode = isDark ? 'light' : 'dark';
    setTheme(nextMode);
  }, [isDark, setTheme]);

  const activeColors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        theme: themeMode,
        isDark,
        colors: activeColors,
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
