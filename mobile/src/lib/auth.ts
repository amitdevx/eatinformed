import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { apiClient, setAuthToken } from '../api/client';

WebBrowser.maybeCompleteAuthSession();

const USER_SESSION_KEY = 'eatinformed_user_session_v1';
let cachedSession: UserSessionData | null = null;

export interface UserSessionData {
  email: string;
  name: string;
  token?: string;
  photoUrl?: string;
  handle?: string;
  allergens?: string[];
  isLoggedIn: boolean;
  isAnonymous?: boolean;
  loginDate: string;
}

export function normalizeHandle(input: string): string {
  if (!input) return 'member';
  const raw = input.includes('@') ? input.split('@')[0] : input;
  const clean = raw.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  return clean.slice(0, 20) || 'member';
}

export async function getUserSession(): Promise<UserSessionData | null> {
  if (cachedSession && cachedSession.isLoggedIn) {
    if (cachedSession.token) {
      setAuthToken(cachedSession.token);
    }
    return cachedSession;
  }

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
    cachedSession = session;
    return session;
  } catch (e) {
    console.warn('Error reading session from secure storage:', e);
    return cachedSession;
  }
}

export async function saveUserSession(
  email: string,
  name?: string,
  token?: string,
  isAnonymous: boolean = false,
  photoUrl?: string,
  handle?: string,
  allergens?: string[]
): Promise<UserSessionData> {
  const existingHandle = cachedSession?.handle;
  const existingAllergens = cachedSession?.allergens;
  const resolvedHandle =
    handle || existingHandle || (isAnonymous ? 'guest' : normalizeHandle(email || name || 'member'));
  const resolvedAllergens = allergens || existingAllergens || [];

  const session: UserSessionData = {
    email,
    name: name || (isAnonymous ? 'Guest Explorer' : email ? email.split('@')[0] : 'Member'),
    token: token || undefined,
    photoUrl: photoUrl !== undefined ? photoUrl : cachedSession?.photoUrl,
    handle: resolvedHandle,
    allergens: resolvedAllergens,
    isLoggedIn: true,
    isAnonymous,
    loginDate: cachedSession?.loginDate || new Date().toLocaleDateString(),
  };

  cachedSession = session;
  setAuthToken(session.token || null);

  try {
    await SecureStore.setItemAsync(USER_SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.warn('Error saving session to secure storage:', e);
  }
  return session;
}

export async function updateUserProfile(
  updates: Partial<UserSessionData>
): Promise<UserSessionData> {
  const current = await getUserSession();
  const email = updates.email !== undefined ? updates.email : current?.email || '';
  const name = updates.name !== undefined ? updates.name : current?.name || 'Member';
  const token = updates.token !== undefined ? updates.token : current?.token;
  const isAnonymous =
    updates.isAnonymous !== undefined ? updates.isAnonymous : current?.isAnonymous ?? false;
  const photoUrl = updates.photoUrl !== undefined ? updates.photoUrl : current?.photoUrl;
  const handle =
    updates.handle !== undefined
      ? isAnonymous
        ? 'guest'
        : normalizeHandle(updates.handle)
      : current?.handle;
  const allergens = updates.allergens !== undefined ? updates.allergens : current?.allergens || [];

  return await saveUserSession(email, name, token, isAnonymous, photoUrl, handle, allergens);
}

export async function clearUserSession(): Promise<void> {
  cachedSession = null;
  setAuthToken(null);
  try {
    await SecureStore.deleteItemAsync(USER_SESSION_KEY);
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
    }, {
      timeout: 12000,
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

// ponytail: authentic guest session with verified cryptographic server token
export async function signInAsGuest(): Promise<UserSessionData> {
  try {
    const response = await apiClient.post<{
      status: string;
      token: string;
      user: { email: string; name: string; isAnonymous: boolean };
    }>('/api/auth/mobile', {
      type: 'guest',
    }, {
      timeout: 8000,
    });

    if (response.data && response.data.token) {
      const u = response.data.user;
      return await saveUserSession(u.email || '', u.name || 'Guest Explorer', response.data.token, true);
    }
    throw new Error('Invalid guest token response from authentication server.');
  } catch (e: any) {
    const msg = e?.response?.data?.error || e?.message || 'Could not initialize guest session. Please verify your connection.';
    console.warn('Backend guest auth failed:', msg);
    throw new Error(msg);
  }
}

// ponytail: Google OAuth flow via HTTPS Web-to-App Bridge to bypass Google Web Client custom scheme policy
export async function signInWithGoogle(): Promise<UserSessionData> {
  const webBaseUrl = (
    process.env.EXPO_PUBLIC_API_URL || 'https://eatinformed.amitdevx.tech'
  ).replace(/\/+$/, '');

  const appCallbackUri = makeRedirectUri({
    path: 'auth/callback',
    scheme: 'eatinformed',
  });

  const bridgeUrl = `${webBaseUrl}/mobile-auth?redirect_uri=${encodeURIComponent(appCallbackUri)}`;

  const res = await WebBrowser.openAuthSessionAsync(bridgeUrl, appCallbackUri);

  if (res.type !== 'success' || !res.url) {
    throw new Error('Google sign-in was cancelled.');
  }

  const queryPart = res.url.split('?')[1] || res.url.split('#')[1] || '';
  const params = new URLSearchParams(queryPart);
  if (params.get('error')) {
    throw new Error('Google sign-in was cancelled.');
  }

  const token = params.get('token') || params.get('access_token') || params.get('id_token');
  const email = params.get('email') || '';
  const name = params.get('name') || (email ? email.split('@')[0] : 'Member');
  const photoUrl = params.get('photoUrl') || undefined;

  if (!token || !email) {
    throw new Error('Could not retrieve Google account details. Please try again.');
  }

  return await saveUserSession(email, name, token, false, photoUrl);
}
