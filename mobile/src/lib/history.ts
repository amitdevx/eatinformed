import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Share } from 'react-native';
import { HistoryItem, ProductAnalysisOutput } from '../types';
import { getUserSession, normalizeHandle } from './auth';

const RECENT_CACHE_PREFIX = '@eatinformed_recent_v3_';
const DURABLE_LEDGER_PREFIX = '@eatinformed_ledger_v3_';
const LEGACY_STORAGE_KEY = 'eatinformed_mobile_history_v2';
const MAX_RECENT_ITEMS = 20;
const MAX_LEDGER_ITEMS = 2500;

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

/**
 * Derives a clean, isolated partition identifier for the currently active user session.
 */
async function getHistoryScope(): Promise<string> {
  try {
    const session = await getUserSession();
    if (session?.email) {
      return normalizeHandle(session.email);
    }
    if (session?.handle && session.handle !== 'guest') {
      return normalizeHandle(session.handle);
    }
  } catch {}
  return 'guest';
}

/**
 * Retrieves the recent scan history (up to 20 items) for fast list display.
 */
export async function getScanHistory(): Promise<HistoryItem[]> {
  try {
    const scope = await getHistoryScope();
    const recentKey = `${RECENT_CACHE_PREFIX}${scope}`;
    const raw = await AsyncStorage.getItem(recentKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }

    // Migrate legacy data if existing on first upgrade for guest
    if (scope === 'guest') {
      const legacyRaw = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyRaw) {
        const parsed = JSON.parse(legacyRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          await AsyncStorage.setItem(recentKey, legacyRaw);
          await AsyncStorage.setItem(`${DURABLE_LEDGER_PREFIX}${scope}`, legacyRaw);
          return parsed;
        }
      }
    }

    return [];
  } catch (error) {
    console.warn('Failed to load scan history:', error);
    return [];
  }
}

/**
 * Retrieves the complete durable lifetime scan history ledger for the active user.
 * Used for annual histogram, lifetime statistics, and export functions.
 */
export async function getFullScanLedger(): Promise<HistoryItem[]> {
  try {
    const scope = await getHistoryScope();
    const ledgerKey = `${DURABLE_LEDGER_PREFIX}${scope}`;
    const raw = await AsyncStorage.getItem(ledgerKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    return await getScanHistory();
  } catch (error) {
    console.warn('Failed to load full scan ledger:', error);
    return await getScanHistory();
  }
}

/**
 * Saves a new scan event. Appends to the durable ledger without discarding identical products
 * on different occasions, and updates the fast recent-items cache.
 */
export async function saveScanToHistory(
  data: ProductAnalysisOutput,
  imagePreviewUrl?: string | null
): Promise<HistoryItem[]> {
  try {
    const scope = await getHistoryScope();
    const recentKey = `${RECENT_CACHE_PREFIX}${scope}`;
    const ledgerKey = `${DURABLE_LEDGER_PREFIX}${scope}`;

    const [currentRecent, currentLedger] = await Promise.all([
      getScanHistory(),
      getFullScanLedger(),
    ]);

    const uniqueId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const newItem: HistoryItem = {
      id: uniqueId,
      timestamp: Date.now(),
      productName: data.productName || 'Scanned Food Product',
      brand: data.brand || '',
      rating: data.rating ?? 0,
      novaGroup: data.novaGroup ?? undefined,
      data,
      imagePreviewUrl: imagePreviewUrl && imagePreviewUrl.length < 500000 ? imagePreviewUrl : null,
    };

    // 1. Append to durable lifetime ledger
    const updatedLedger = [newItem, ...currentLedger].slice(0, MAX_LEDGER_ITEMS);

    // 2. Update recent items cache
    const updatedRecent = [newItem, ...currentRecent.filter((item) => item.id !== newItem.id)].slice(0, MAX_RECENT_ITEMS);

    await Promise.all([
      AsyncStorage.setItem(ledgerKey, JSON.stringify(updatedLedger)),
      AsyncStorage.setItem(recentKey, JSON.stringify(updatedRecent)),
    ]);

    return updatedRecent;
  } catch (error) {
    console.warn('Failed to save scan to history storage:', error);
    return [];
  }
}

export async function deleteHistoryItem(id: string): Promise<HistoryItem[]> {
  try {
    const scope = await getHistoryScope();
    const recentKey = `${RECENT_CACHE_PREFIX}${scope}`;
    const ledgerKey = `${DURABLE_LEDGER_PREFIX}${scope}`;

    const [currentRecent, currentLedger] = await Promise.all([
      getScanHistory(),
      getFullScanLedger(),
    ]);

    const updatedRecent = currentRecent.filter((item) => item.id !== id);
    const updatedLedger = currentLedger.filter((item) => item.id !== id);

    await Promise.all([
      AsyncStorage.setItem(recentKey, JSON.stringify(updatedRecent)),
      AsyncStorage.setItem(ledgerKey, JSON.stringify(updatedLedger)),
    ]);

    return updatedRecent;
  } catch (error) {
    console.warn('Failed to delete history item:', error);
    return [];
  }
}

export async function clearAllHistory(): Promise<boolean> {
  try {
    const scope = await getHistoryScope();
    const recentKey = `${RECENT_CACHE_PREFIX}${scope}`;
    const ledgerKey = `${DURABLE_LEDGER_PREFIX}${scope}`;

    await Promise.all([
      AsyncStorage.removeItem(recentKey),
      AsyncStorage.removeItem(ledgerKey),
    ]);
    return true;
  } catch (error) {
    console.warn('Failed to clear scan history:', error);
    return false;
  }
}

export async function getSevenDayTrendData(
  providedItems?: HistoryItem[]
): Promise<TrendDataPoint[]> {
  const history = providedItems || (await getFullScanLedger());
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
  const history = providedItems || (await getFullScanLedger());
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
  const history = providedItems || (await getFullScanLedger());
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
    const history = await getFullScanLedger();
    if (history.length === 0) return false;
    const backup = {
      schemaVersion: 2,
      appName: 'EatInformed',
      exportedAt: new Date().toISOString(),
      itemCount: history.length,
      scans: history.map((item) => ({
        id: item.id,
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
