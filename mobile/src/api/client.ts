import axios, { AxiosError } from 'axios';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { ProductAnalysisOutput } from '../types';

const AVG_DURATION_KEY = '@eatinformed_avg_scan_ms';
const DEFAULT_ESTIMATED_MS = 15000;

export async function getEstimatedScanDuration(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(AVG_DURATION_KEY);
    const parsed = raw ? Number(raw) : NaN;
    return !isNaN(parsed) && parsed >= 4000 && parsed <= 45000
      ? parsed
      : DEFAULT_ESTIMATED_MS;
  } catch {
    return DEFAULT_ESTIMATED_MS;
  }
}

async function recordScanDuration(durationMs: number): Promise<void> {
  try {
    const prev = await getEstimatedScanDuration();
    // Exponential moving average (70% historical, 30% latest scan)
    const updated = Math.round(prev * 0.7 + Math.min(40000, Math.max(4000, durationMs)) * 0.3);
    await AsyncStorage.setItem(AVG_DURATION_KEY, String(updated));
  } catch {}
}

// Default development and production URLs:
// Uses explicit EXPO_PUBLIC_API_URL or defaults reliably to production domain
const getBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  return 'https://eatinformed.amitdevx.tech';
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 60000, // 60 seconds to accommodate vision and reasoning AI pipeline
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshInFlight: Promise<void> | null = null;
apiClient.interceptors.request.use(async (config) => {
  if (config.url?.startsWith('/api/auth/')) return config;
  let raw = await SecureStore.getItemAsync('eatinformed_user_session_v1');
  let session = raw ? JSON.parse(raw) : null;
  if (session?.refreshToken && (!session.expiresAt || session.expiresAt < Date.now() + 60000)) {
    if (!refreshInFlight) refreshInFlight = (async () => {
      const result = await axios.post(`${getBaseUrl()}/api/auth/mobile`, { type: 'refresh', refreshToken: session.refreshToken }, { timeout: 12000 });
      const currentRaw = await SecureStore.getItemAsync('eatinformed_user_session_v1');
      const current = currentRaw ? JSON.parse(currentRaw) : null;
      if (current?.uid !== session.uid) throw new Error('Account changed. Please retry.');
      await SecureStore.setItemAsync('eatinformed_user_session_v1', JSON.stringify({ ...current, token: result.data.token, refreshToken: result.data.refreshToken, expiresAt: result.data.expiresAt }));
    })().finally(() => { refreshInFlight = null; });
    await refreshInFlight;
    raw = await SecureStore.getItemAsync('eatinformed_user_session_v1');
    session = raw ? JSON.parse(raw) : null;
  }
  if (session?.token) config.headers.Authorization = `Bearer ${session.token}`;
  else delete config.headers.Authorization;
  return config;
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

export async function checkApiHealth(): Promise<{ ok: boolean; message: string }> {
  try {
    const response = await apiClient.get('/api/scan');
    if (response.status === 200) {
      return { ok: true, message: 'Server is online' };
    }
    return { ok: false, message: 'Unexpected status code from server' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Cannot connect to EatInformed server';
    return { ok: false, message };
  }
}

export async function scanFoodLabel(
  imageUriOrBase64: string,
  onUploadProgress?: (fraction: number) => void
): Promise<ProductAnalysisOutput> {
  let payload = imageUriOrBase64;

  // Ensure data URI prefix
  if (!payload.startsWith('data:image/')) {
    payload = `data:image/jpeg;base64,${payload}`;
  }

  const idempotencyKey = Crypto.randomUUID();
  const startTime = Date.now();
  let lastError: unknown = null;

  // Transparently retry up to 2 attempts if attempt #1 hits a cold-start timeout or 5xx/network error
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await apiClient.post<ProductAnalysisOutput>(
        '/api/scan',
        { image: payload },
        {
          headers: { 'Idempotency-Key': idempotencyKey },
          onUploadProgress: (progressEvent) => {
            if (onUploadProgress && progressEvent.total) {
              onUploadProgress(Math.min(1, progressEvent.loaded / progressEvent.total));
            } else if (onUploadProgress) {
              onUploadProgress(1);
            }
          },
        }
      );
      if (response.data.status !== 'success' || !Array.isArray(response.data.ingredients) || !response.data.nutrition) throw new Error('Invalid scan result received.');
      await recordScanDuration(Date.now() - startTime);
      return response.data;
    } catch (err) {
      lastError = err;
      const axiosErr = err as AxiosError;
      const status = axiosErr.response?.status;
      // Don't retry client validation errors (400/401/413)
      if (status && status >= 400 && status < 500 && status !== 408) {
        break;
      }
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 800));
      }
    }
  }

  const error = lastError as AxiosError<{ error?: string }>;
  if (error?.response?.data?.error) {
    throw new Error(error.response.data.error);
  }
  if (error?.code === 'ECONNABORTED') {
    throw new Error('Analysis timed out. Please verify your connection and try again.');
  }
  if (error?.message && error.message.includes('Network Error')) {
    throw new Error('Could not connect to EatInformed server. Please verify the server is running.');
  }
  throw new Error((error && error.message) || 'Failed to analyze food label image.');
}
