import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { HistoryItem, ProductAnalysisOutput } from '../types';

const HISTORY_STORAGE_KEY = 'eatinformed_mobile_history_v2';
const LEGACY_STORAGE_KEY = 'eatinformed_mobile_history_v1';
const MAX_HISTORY_ITEMS = 20;

// ponytail: use AsyncStorage to eliminate 2KB SecureStore ceiling; migrate any legacy records
export async function getScanHistory(): Promise<HistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }

    // Attempt migration from legacy SecureStore if present
    try {
      const legacyRaw = await SecureStore.getItemAsync(LEGACY_STORAGE_KEY);
      if (legacyRaw) {
        const parsed = JSON.parse(legacyRaw);
        if (Array.isArray(parsed)) {
          await AsyncStorage.setItem(HISTORY_STORAGE_KEY, legacyRaw);
          await SecureStore.deleteItemAsync(LEGACY_STORAGE_KEY).catch(() => {});
          return parsed;
        }
      }
    } catch {
      // ignore migration error
    }

    return [];
  } catch (error) {
    console.warn('Failed to load scan history:', error);
    return [];
  }
}

export async function saveScanToHistory(
  data: ProductAnalysisOutput,
  imagePreviewUrl?: string | null
): Promise<HistoryItem[]> {
  try {
    const currentHistory = await getScanHistory();

    const isGenericName = (name: string) =>
      !name || /^(scanned food product|packaged food item|food product)$/i.test(name.trim());

    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      productName: data.productName || 'Scanned Food Product',
      brand: data.brand || '',
      rating: data.rating,
      novaGroup: data.novaGroup,
      data,
      // ponytail: prevent saving massive base64 payloads to storage; keep file uris or small previews
      imagePreviewUrl: imagePreviewUrl && imagePreviewUrl.length < 500000 ? imagePreviewUrl : null,
    };

    // Filter out duplicates with the same product name, but keep separate unnamed scans
    const filtered = currentHistory.filter((item) => {
      if (isGenericName(newItem.productName)) {
        return item.id !== newItem.id;
      }
      return item.productName.toLowerCase() !== newItem.productName.toLowerCase();
    });

    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.warn('Failed to save scan to history storage:', error);
    return [];
  }
}

export async function deleteHistoryItem(id: string): Promise<HistoryItem[]> {
  try {
    const current = await getScanHistory();
    const updated = current.filter((item) => item.id !== id);
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.warn('Failed to delete history item:', error);
    return [];
  }
}

export async function clearAllHistory(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
    await SecureStore.deleteItemAsync(LEGACY_STORAGE_KEY).catch(() => {});
    return true;
  } catch (error) {
    console.warn('Failed to clear scan history:', error);
    return false;
  }
}
