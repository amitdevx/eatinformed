import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Share } from 'react-native';
import { HistoryItem, ProductAnalysisOutput } from '../types';
import { getUserSession } from './auth';
import { apiClient } from '../api/client';

const CACHE_PREFIX = '@eatinformed_history_v4_';

export interface TrendDataPoint {
  day: string;
  score: number | null;
  dateStr: string;
  scansCount: number;
}

export interface HeatmapDay {
  dayNumber: number;
  dateStr: string;
  scansCount: number;
  averageScore?: number;
}

async function getHistoryScope(): Promise<string> {
  const session = await getUserSession();
  if (!session?.uid) throw new Error('Sign in to view your scan history.');
  return session.uid;
}

export async function getFullScanLedger(allowOffline = true): Promise<HistoryItem[]> {
  const uid = await getHistoryScope();
  const key = `${CACHE_PREFIX}${uid}`;
  try {
    const items: HistoryItem[] = [];
    let cursor: string | null = null;
    do {
      const response: { data: { items: HistoryItem[]; nextCursor: string | null } } = await apiClient.get('/api/history', { params: cursor ? { cursor } : {} });
      if (await getHistoryScope() !== uid) throw new Error('Account changed.');
      items.push(...response.data.items);
      cursor = response.data.nextCursor;
    } while (cursor);
    await AsyncStorage.setItem(key, JSON.stringify(items));
    return items;
  } catch (error: any) {
    if (!allowOffline || await getHistoryScope() !== uid || error.response) throw error;
    const cached = await AsyncStorage.getItem(key);
    if (cached) return JSON.parse(cached);
    throw error;
  }
}
export async function getScanHistory(): Promise<HistoryItem[]> {
  return (await getFullScanLedger()).slice(0, 20);
}
export async function saveScanToHistory(data: ProductAnalysisOutput, _imagePreviewUrl?: string | null): Promise<HistoryItem[]> {
  // Cache the response already committed by the server; a history outage must not hide a successful result.
  if (!data.scanId) throw new Error('Missing saved scan identifier.');
  const uid = await getHistoryScope(), key = `${CACHE_PREFIX}${uid}`;
  const raw = await AsyncStorage.getItem(key);
  const previous: HistoryItem[] = raw ? JSON.parse(raw) : [];
  const item: HistoryItem = { id: data.scanId, timestamp: Date.now(), productName: data.productName,
    brand: data.brand, rating: data.rating, novaGroup: data.novaGroup, data };
  const items = [item, ...previous.filter(entry => entry.id !== item.id)];
  await AsyncStorage.setItem(key, JSON.stringify(items));
  return items.slice(0, 20);
}
export async function deleteHistoryItem(id: string): Promise<HistoryItem[]> {
  await apiClient.delete('/api/history', { params: { id } });
  const uid = await getHistoryScope();
  await AsyncStorage.removeItem(`${CACHE_PREFIX}${uid}`);
  return getScanHistory();
}
export async function clearAllHistory(): Promise<boolean> {
  const uid = await getHistoryScope();
  const items = await getFullScanLedger(false);
  for (const item of items) {
    if (await getHistoryScope() !== uid) throw new Error('Account changed.');
    await apiClient.delete('/api/history', { params: { id: item.id } });
  }
  await AsyncStorage.removeItem(`${CACHE_PREFIX}${uid}`);
  return true;
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
    const rated = dayScans.filter(s => s.rating !== null);
    const avgRating =
      rated.length > 0
        ? Number((rated.reduce((sum, s) => sum + s.rating!, 0) / rated.length).toFixed(1))
        : null;

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
    const rated = dayScans.filter(s => s.rating !== null);
    const avgScore =
      rated.length > 0
        ? Number((rated.reduce((sum, s) => sum + s.rating!, 0) / rated.length).toFixed(1))
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
