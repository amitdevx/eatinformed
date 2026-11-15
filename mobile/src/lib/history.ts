import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Share } from 'react-native';
import { HistoryItem, ProductAnalysisOutput } from '../types';

const HISTORY_STORAGE_KEY = 'eatinformed_mobile_history_v2';
const LEGACY_STORAGE_KEY = 'eatinformed_mobile_history_v1';
const MAX_HISTORY_ITEMS = 20;

export interface TrendDataPoint {
  day: string;
  score: number;
  dateStr: string;
  scansCount: number;
}

export interface HeatmapDay {
  dayNumber: number;
  dateStr: string;
  scansCount: number;
  averageScore?: number;
}

export async function getScanHistory(): Promise<HistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }

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
      imagePreviewUrl: imagePreviewUrl && imagePreviewUrl.length < 500000 ? imagePreviewUrl : null,
    };

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

export async function getSevenDayTrendData(
  providedItems?: HistoryItem[]
): Promise<TrendDataPoint[]> {
  const history = providedItems || (await getScanHistory());
  const result: TrendDataPoint[] = [];
  const now = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 6; i >= 0; i--) {
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const targetStart = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
    const targetEnd = targetStart + 86400000;

    const dayScans = history.filter(
      (item) => item.timestamp >= targetStart && item.timestamp < targetEnd
    );

    const scansCount = dayScans.length;
    const avgRating =
      scansCount > 0
        ? Number((dayScans.reduce((sum, s) => sum + s.rating, 0) / scansCount).toFixed(1))
        : 0;

    result.push({
      day: dayNames[target.getDay()],
      score: avgRating,
      dateStr: target.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      scansCount,
    });
  }
  return result;
}

export async function getThirtyDayHeatmapData(
  providedItems?: HistoryItem[]
): Promise<HeatmapDay[]> {
  const history = providedItems || (await getScanHistory());
  const list: HeatmapDay[] = [];
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const targetStart = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
    const targetEnd = targetStart + 86400000;

    const dayScans = history.filter(
      (item) => item.timestamp >= targetStart && item.timestamp < targetEnd
    );

    const scansCount = dayScans.length;
    const avgScore =
      scansCount > 0
        ? Number((dayScans.reduce((sum, s) => sum + s.rating, 0) / scansCount).toFixed(1))
        : undefined;

    list.push({
      dayNumber: target.getDate(),
      dateStr: target.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      scansCount,
      averageScore: avgScore,
    });
  }
  return list;
}

export async function getYearlyHistogramData(
  providedItems?: HistoryItem[]
): Promise<{
  monthlyCounts: number[];
  totalScans: number;
  cleanRatio: string;
  activeMonths: number;
}> {
  const history = providedItems || (await getScanHistory());
  const currentYear = new Date().getFullYear();
  const monthlyCounts = new Array(12).fill(0);
  let cleanScans = 0;

  history.forEach((item) => {
    const d = new Date(item.timestamp);
    if (d.getFullYear() === currentYear) {
      const m = d.getMonth();
      monthlyCounts[m] += 1;
      if (item.novaGroup && item.novaGroup <= 2) {
        cleanScans += 1;
      }
    }
  });

  const totalScans = monthlyCounts.reduce((a, b) => a + b, 0);
  const cleanRatio = totalScans > 0 ? `${Math.round((cleanScans / totalScans) * 100)}%` : '0%';
  const activeMonths = monthlyCounts.filter((c) => c > 0).length;

  return {
    monthlyCounts,
    totalScans,
    cleanRatio,
    activeMonths,
  };
}

export async function exportScanHistory(): Promise<boolean> {
  try {
    const history = await getScanHistory();
    if (history.length === 0) return false;
    const backup = {
      schemaVersion: 1,
      appName: 'EatInformed',
      exportedAt: new Date().toISOString(),
      itemCount: history.length,
      scans: history.map((item) => ({
        timestamp: item.timestamp,
        dateFormatted: new Date(item.timestamp).toLocaleString(),
        productName: item.productName,
        brand: item.brand,
        rating: item.rating,
        novaGroup: item.novaGroup,
        data: item.data,
      })),
    };

    const jsonString = JSON.stringify(backup, null, 2);
    const dir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
    const fileUri = `${dir}eatinformed_scan_history_${Date.now()}.json`;

    await FileSystem.writeAsStringAsync(fileUri, jsonString, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Export EatInformed Scan History (JSON)',
        UTI: 'public.json',
      });
      return true;
    } else {
      await Share.share({
        title: 'EatInformed Scan History Backup',
        message: jsonString,
      });
      return true;
    }
  } catch (error) {
    console.warn('Failed to export scan history file:', error);
    return false;
  }
}

export async function exportProductAsJsonFile(product: ProductAnalysisOutput): Promise<boolean> {
  try {
    const safeTitle = (product.productName || 'product')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .slice(0, 30);
    const jsonString = JSON.stringify(product, null, 2);
    const dir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
    const fileUri = `${dir}${safeTitle}_report_${Date.now()}.json`;

    await FileSystem.writeAsStringAsync(fileUri, jsonString, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: `Share ${product.productName || 'Product'} Report (JSON)`,
        UTI: 'public.json',
      });
      return true;
    } else {
      await Share.share({
        title: `${product.productName || 'Product'} Health Report`,
        message: jsonString,
      });
      return true;
    }
  } catch (error) {
    console.warn('Failed to export product JSON file:', error);
    return false;
  }
}
