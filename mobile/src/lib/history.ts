import * as SecureStore from 'expo-secure-store';
import { HistoryItem, ProductAnalysisOutput } from '../types';

const HISTORY_STORAGE_KEY = 'eatinformed_mobile_history_v1';
const MAX_HISTORY_ITEMS = 20;

export async function getScanHistory(): Promise<HistoryItem[]> {
  try {
    const raw = await SecureStore.getItemAsync(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    console.warn('Failed to load scan history from secure storage:', error);
    return [];
  }
}

export async function saveScanToHistory(
  data: ProductAnalysisOutput,
  imagePreviewUrl?: string | null
): Promise<HistoryItem[]> {
  try {
    const currentHistory = await getScanHistory();

    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      productName: data.productName || 'Scanned Food Product',
      brand: data.brand || '',
      rating: data.rating,
      novaGroup: data.novaGroup,
      data,
      imagePreviewUrl: imagePreviewUrl || null,
    };

    // Filter out duplicates with the same product name
    const filtered = currentHistory.filter(
      (item) => item.productName !== newItem.productName
    );

    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    await SecureStore.setItemAsync(
      HISTORY_STORAGE_KEY,
      JSON.stringify(updated)
    );
    return updated;
  } catch (error) {
    console.warn('Failed to save scan to secure storage:', error);
    return [];
  }
}

export async function deleteHistoryItem(id: string): Promise<HistoryItem[]> {
  try {
    const current = await getScanHistory();
    const updated = current.filter((item) => item.id !== id);
    await SecureStore.setItemAsync(
      HISTORY_STORAGE_KEY,
      JSON.stringify(updated)
    );
    return updated;
  } catch (error) {
    console.warn('Failed to delete history item:', error);
    return [];
  }
}

export async function clearAllHistory(): Promise<boolean> {
  try {
    await SecureStore.deleteItemAsync(HISTORY_STORAGE_KEY);
    return true;
  } catch (error) {
    console.warn('Failed to clear scan history:', error);
    return false;
  }
}
