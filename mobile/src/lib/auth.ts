import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { apiClient, setAuthToken } from '../api/client';

WebBrowser.maybeCompleteAuthSession();

const USER_SESSION_KEY = 'eatinformed_user_session_v1';

export interface UserSessionData {
  email: string;
  name: string;
  token?: string;
  photoUrl?: string;
  isLoggedIn: boolean;
  isAnonymous?: boolean;
  loginDate: string;
}

export async function getUserSession(): Promise<UserSessionData | null> {
  try {
    const raw = await SecureStore.getItemAsync(USER_SESSION_KEY);
    if (!raw) {
      setAuthToken(null);
      return null;
    }
    const session: UserSessionData = JSON.parse(raw);
    if (session.token) {
      setAuthToken(session.token);
    }
    return session;
  } catch (e) {
    console.warn('Error reading session from secure storage:', e);
    return null;
  }
}

export async function saveUserSession(
  email: string,
  name?: string,
  token?: string,
  isAnonymous: boolean = false,
  photoUrl?: string
): Promise<UserSessionData> {
  const session: UserSessionData = {
    email,
    name: name || (isAnonymous ? 'Guest Explorer' : email.split('@')[0]),
    token: token || `token_${Date.now()}`,
    photoUrl,
    isLoggedIn: true,
    isAnonymous,
    loginDate: new Date().toLocaleDateString(),
  };
  try {
    await SecureStore.setItemAsync(USER_SESSION_KEY, JSON.stringify(session));
    setAuthToken(session.token || null);
  } catch (e) {
    console.warn('Error saving session to secure storage:', e);
  }
  return session;
}

export async function clearUserSession(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(USER_SESSION_KEY);
    setAuthToken(null);
  } catch (e) {
    console.warn('Error clearing session from secure storage:', e);
  }
}

// ponytail: real backend authentication for email & password
export async function authenticateWithBackend(
  email: string,
  password: string,
  type: 'signIn' | 'signUp'
): Promise<UserSessionData> {
  try {
    const response = await apiClient.post<{
      status: string;
      token: string;
      user: { email: string; name: string; isAnonymous: boolean };
    }>('/api/auth/mobile', {
      email,
      password,
      type,
    });

    if (response.data && response.data.token) {
      const u = response.data.user;
      return await saveUserSession(u.email, u.name, response.data.token, u.isAnonymous);
    }
    throw new Error('Invalid response from authentication server');
  } catch (err: any) {
    const msg = err.response?.data?.error || err.message || 'Authentication failed';
    throw new Error(msg);
  }
}

// ponytail: authentic guest session synced with backend
export async function signInAsGuest(): Promise<UserSessionData> {
  try {
    const response = await apiClient.post<{
      status: string;
      token: string;
      user: { email: string; name: string; isAnonymous: boolean };
    }>('/api/auth/mobile', {
      type: 'guest',
    });

    if (response.data && response.data.token) {
      const u = response.data.user;
      return await saveUserSession(u.email, u.name, response.data.token, true);
    }
  } catch (e) {
    console.warn('Backend guest auth failed, falling back to local guest session:', e);
  }

  return await saveUserSession(
    '',
    'Guest Explorer',
    `guest_${Date.now()}`,
    true
  );
}

// ponytail: Google OAuth flow with system browser sheet
export async function signInWithGoogle(): Promise<UserSessionData> {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error('Google Sign-In is not configured (missing EXPO_PUBLIC_GOOGLE_CLIENT_ID).');
  }

  const redirectUri = makeRedirectUri({
    path: 'auth/callback',
    scheme: 'eatinformed',
  });
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
    clientId
  )}&response_type=token&scope=openid%20profile%20email&redirect_uri=${encodeURIComponent(
    redirectUri
  )}`;

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

  if (result.type !== 'success' || !result.url) {
    throw new Error('Google sign-in was cancelled.');
  }

  const match = result.url.match(/access_token=([^&]+)/);
  const accessToken = match ? match[1] : null;

  if (!accessToken) {
    throw new Error('No access token returned from Google authentication.');
  }

  const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!userRes.ok) {
    throw new Error('Failed to fetch user profile from Google.');
  }
  const userInfo = await userRes.json();
  return await saveUserSession(
    userInfo.email || '',
    userInfo.name || userInfo.email?.split('@')[0] || 'Member',
    accessToken,
    false,
    userInfo.picture
  );
}
