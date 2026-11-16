import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { apiClient, setAuthToken } from '../api/client';

WebBrowser.maybeCompleteAuthSession();

const USER_SESSION_KEY = 'eatinformed_user_session_v1';
let cachedSession: UserSessionData | null = null;

export interface UserSessionData {
  uid: string;
  refreshToken?: string;
  expiresAt?: number;
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
  try {
    const raw = await SecureStore.getItemAsync(USER_SESSION_KEY);
    if (!raw) {
      setAuthToken(null);
      return null;
    }
    const session: UserSessionData = JSON.parse(raw);
    if (!session.uid || !session.token || !session.refreshToken) { setAuthToken(null); return null; }
    if (session.token) {
      setAuthToken(session.token);
    }
    cachedSession = session;
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
  photoUrl?: string,
  handle?: string,
  allergens?: string[],
  identity?: { uid: string; refreshToken?: string; expiresAt?: number }
): Promise<UserSessionData> {
  if (!identity?.uid && !cachedSession?.uid) throw new Error('A verified account is required.');
  const sameUser = !identity || identity.uid === cachedSession?.uid;
  const previous = sameUser ? cachedSession : null;
  const existingHandle = previous?.handle;
  const existingAllergens = previous?.allergens;
  const resolvedHandle =
    handle || existingHandle || (isAnonymous ? 'guest' : normalizeHandle(email || name || 'member'));
  const resolvedAllergens = allergens || existingAllergens || [];

  const session: UserSessionData = {
    uid: identity?.uid || previous!.uid,
    refreshToken: identity?.refreshToken || previous?.refreshToken,
    expiresAt: identity?.expiresAt || previous?.expiresAt,
    email,
    name: name || (isAnonymous ? 'Guest Explorer' : email ? email.split('@')[0] : 'Member'),
    token: token || undefined,
    photoUrl: photoUrl !== undefined ? photoUrl : previous?.photoUrl,
    handle: resolvedHandle,
    allergens: resolvedAllergens,
    isLoggedIn: true,
    isAnonymous,
    loginDate: previous?.loginDate || new Date().toLocaleDateString(),
  };

  await SecureStore.setItemAsync(USER_SESSION_KEY, JSON.stringify(session));
  cachedSession = session;
  setAuthToken(session.token || null);
  return session;
}

export async function updateUserProfile(
  updates: Partial<UserSessionData>
): Promise<UserSessionData> {
  const current = await getUserSession();
  await apiClient.patch('/api/profile', { ...(updates.name !== undefined ? { name: updates.name } : {}), ...(updates.handle !== undefined ? { handle: normalizeHandle(updates.handle) } : {}), ...(updates.allergens !== undefined ? { allergens: updates.allergens.map(a => a.toLowerCase()) } : {}) });
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
    const current = await getUserSession();
    if (type === 'signUp' && current?.isAnonymous) await apiClient.get('/api/scan?quota=true');
    const fresh = await getUserSession();
    const response = await apiClient.post<{
      status: string;
      token: string;
      refreshToken: string;
      expiresAt: number;
      user: { uid: string; email: string; name: string; isAnonymous: boolean; handle?: string; allergens?: string[] };
    }>('/api/auth/mobile', {
      email,
      password,
      type: type === 'signUp' && fresh?.isAnonymous ? 'link' : type,
      ...(type === 'signUp' && fresh?.isAnonymous ? { idToken: fresh.token } : {}),
    }, {
      timeout: 12000,
    });

    if (response.data && response.data.token) {
      const u = response.data.user;
      return await saveUserSession(u.email, u.name, response.data.token, u.isAnonymous, undefined, u.handle, u.allergens, { uid: u.uid, refreshToken: response.data.refreshToken, expiresAt: response.data.expiresAt });
    }
    throw new Error('Invalid response from authentication server');
  } catch (err: any) {
    const msg = err.response?.data?.error || (err.code === 'ERR_NETWORK' ? 'Cannot reach EatInformed. Check your connection and try again.' : err.message) || 'Authentication failed';
    throw new Error(msg);
  }
}

// ponytail: authentic guest session with verified cryptographic server token
export async function signInAsGuest(): Promise<UserSessionData> {
  const existing = await getUserSession();
  if (existing?.isAnonymous) return existing;
  try {
    const response = await apiClient.post<{
      status: string;
      token: string;
      refreshToken: string;
      expiresAt: number;
      user: { uid: string; email: string; name: string; isAnonymous: boolean; handle?: string; allergens?: string[] };
    }>('/api/auth/mobile', {
      type: 'guest',
    }, {
      timeout: 15000,
    });

    if (response.data && response.data.token) {
      const u = response.data.user;
      return await saveUserSession(u.email || '', u.name || 'Guest Explorer', response.data.token, true, undefined, u.handle, u.allergens, { uid: u.uid, refreshToken: response.data.refreshToken, expiresAt: response.data.expiresAt });
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

  const state = Crypto.randomUUID();
  const verifier = Crypto.randomUUID() + Crypto.randomUUID();
  const challenge = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier);
  const bridgeUrl = `${webBaseUrl}/mobile-auth?redirect_uri=${encodeURIComponent(appCallbackUri)}&state=${encodeURIComponent(state)}&challenge=${challenge}`;

  const res = await WebBrowser.openAuthSessionAsync(bridgeUrl, appCallbackUri);

  if (res.type !== 'success' || !res.url) {
    throw new Error('Google sign-in was cancelled.');
  }

  if (!res.url.startsWith(appCallbackUri + '#')) throw new Error('Unexpected sign-in callback.');
  const queryPart = res.url.split('#')[1] || '';
  const params = new URLSearchParams(queryPart);
  if (params.get('state') !== state) throw new Error('Sign-in could not be verified.');
  if (params.get('error')) {
    throw new Error('Google sign-in was cancelled.');
  }

  const code = params.get('code');
  if (!code) throw new Error('Could not complete Google sign-in.');
  const response = await apiClient.post('/api/auth/bridge', { mode: 'exchange', code, verifier });
  const verified = response.data;
  return await saveUserSession(verified.user.email, verified.user.name, verified.token, verified.user.isAnonymous, verified.user.photoUrl, verified.user.handle, verified.user.allergens, { uid: verified.user.uid, refreshToken: verified.refreshToken, expiresAt: verified.expiresAt });
}
