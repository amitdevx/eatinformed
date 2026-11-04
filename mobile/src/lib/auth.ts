import * as SecureStore from 'expo-secure-store';

const USER_SESSION_KEY = 'eatinformed_user_session_v1';

export interface UserSessionData {
  email: string;
  name: string;
  token?: string;
  isLoggedIn: boolean;
  loginDate: string;
}

export async function getUserSession(): Promise<UserSessionData | null> {
  try {
    const raw = await SecureStore.getItemAsync(USER_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading session from secure storage:', e);
    return null;
  }
}

export async function saveUserSession(email: string, name?: string): Promise<UserSessionData> {
  const session: UserSessionData = {
    email,
    name: name || email.split('@')[0],
    isLoggedIn: true,
    loginDate: new Date().toLocaleDateString(),
  };
  try {
    await SecureStore.setItemAsync(USER_SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.warn('Error saving session to secure storage:', e);
  }
  return session;
}

export async function clearUserSession(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(USER_SESSION_KEY);
  } catch (e) {
    console.warn('Error clearing session from secure storage:', e);
  }
}
