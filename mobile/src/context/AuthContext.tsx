import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getUserSession,
  saveUserSession,
  clearUserSession,
  signInAsGuest,
  UserSessionData,
} from '../lib/auth';
import { ONBOARDING_STORAGE_KEY } from '../screens/OnboardingScreen';

export type AuthStatus = 'initializing' | 'onboarding' | 'signed_out' | 'authenticated';

interface AuthContextType {
  session: UserSessionData | null;
  authStatus: AuthStatus;
  isInitializing: boolean;
  setSession: (session: UserSessionData | null) => void;
  signIn: (session: UserSessionData) => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => Promise<UserSessionData>;
  completeOnboarding: () => Promise<void>;
  refreshSession: () => Promise<UserSessionData | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<UserSessionData | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('initializing');

  const refreshSession = useCallback(async (): Promise<UserSessionData | null> => {
    try {
      const current = await getUserSession();
      setSessionState(current);
      return current;
    } catch (_) {
      return null;
    }
  }, []);

  useEffect(() => {
    async function initAuth() {
      try {
        const [onboardingCompleted, storedSession] = await Promise.all([
          AsyncStorage.getItem(ONBOARDING_STORAGE_KEY),
          getUserSession(),
        ]);

        if (onboardingCompleted === 'true') {
          if (storedSession && storedSession.isLoggedIn) {
            setSessionState(storedSession);
            setAuthStatus('authenticated');
          } else {
            setSessionState(null);
            setAuthStatus('signed_out');
          }
        } else {
          setSessionState(storedSession);
          setAuthStatus('onboarding');
        }
      } catch (err) {
        console.warn('Auth context init error:', err);
        setAuthStatus('onboarding');
      }
    }

    initAuth();
  }, []);

  const setSession = useCallback((newSession: UserSessionData | null) => {
    setSessionState(newSession);
    if (newSession && newSession.isLoggedIn) {
      setAuthStatus('authenticated');
    }
  }, []);

  const signIn = useCallback(async (newSession: UserSessionData) => {
    setSessionState(newSession);
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setAuthStatus('authenticated');
  }, []);

  const signOut = useCallback(async () => {
    await clearUserSession();
    setSessionState(null);
    setAuthStatus('signed_out');
  }, []);

  const continueAsGuest = useCallback(async (): Promise<UserSessionData> => {
    const guestSession = await signInAsGuest();
    setSessionState(guestSession);
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setAuthStatus('authenticated');
    return guestSession;
  }, []);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    const current = await getUserSession();
    if (current && current.isLoggedIn) {
      setSessionState(current);
      setAuthStatus('authenticated');
    } else {
      const guest = await signInAsGuest();
      setSessionState(guest);
      setAuthStatus('authenticated');
    }
  }, []);

  const isInitializing = authStatus === 'initializing';

  return (
    <AuthContext.Provider
      value={{
        session,
        authStatus,
        isInitializing,
        setSession,
        signIn,
        signOut,
        continueAsGuest,
        completeOnboarding,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
