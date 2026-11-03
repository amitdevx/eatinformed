import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';
import { ProductAnalysisOutput } from '../types';

// Default development URLs:
// Android Emulator maps host machine to 10.0.2.2
// Physical devices can configure EXPO_PUBLIC_API_URL in .env
const getBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:9003';
  }
  return 'http://localhost:9003';
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 45000, // 45 seconds to accommodate vision and reasoning AI pipeline
  headers: {
    'Content-Type': 'application/json',
  },
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

export async function scanFoodLabel(imageUriOrBase64: string): Promise<ProductAnalysisOutput> {
  let payload = imageUriOrBase64;

  // Ensure data URI prefix
  if (!payload.startsWith('data:image/')) {
    payload = `data:image/jpeg;base64,${payload}`;
  }

  try {
    const response = await apiClient.post<ProductAnalysisOutput>('/api/scan', {
      image: payload,
    });
    return response.data;
  } catch (err) {
    const error = err as AxiosError<{ error?: string }>;
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    if (error.code === 'ECONNABORTED') {
      throw new Error('Analysis timed out. Please verify your connection and try again.');
    }
    if (error.message.includes('Network Error')) {
      throw new Error('Could not connect to EatInformed server. Please verify the server is running.');
    }
    throw new Error(error.message || 'Failed to analyze food label image.');
  }
}
