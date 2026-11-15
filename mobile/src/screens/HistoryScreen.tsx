import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Trash2,
  Clock,
  ChevronRight,
  History as HistoryIcon,
  Filter,
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card, CardContent } from '../components/Card';
import { EmptyState } from '../components/States';
import { NovaBadge } from '../components/NovaBadge';
import { RatingStars } from '../components/RatingStars';
import { ConfirmModal } from '../components/ConfirmModal';
import { ScanActivityHeatmap, HeatmapDay } from '../components/ScanActivityHeatmap';
import { useTheme } from '../theme/ThemeContext';
import { FadeInView, PressableScale } from '../theme/animations';
import { borderRadius, layout, spacing, typography } from '../theme/tokens';
import { AppHaptics } from '../lib/haptics';
import {
  getScanHistory,
  deleteHistoryItem,
  clearAllHistory,
  getThirtyDayHeatmapData,
} from '../lib/history';
import { HistoryItem } from '../types';
import { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HistoryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [heatmapDays, setHeatmapDays] = useState<HeatmapDay[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'clean' | 'processed' | 'ultra'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isClearAllModalVisible, setIsClearAllModalVisible] = useState(false);

  const loadHistory = useCallback(async () => {
    const [items, days] = await Promise.all([
      getScanHistory(),
      getThirtyDayHeatmapData(),
    ]);
    setHistoryItems(items);
    setHeatmapDays(days);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadHistory();
    setIsRefreshing(false);
  };

  const handleOpenItem = (item: HistoryItem) => {
    AppHaptics.selection();
    navigation.navigate('Result', {
      data: item.data,
      imageUri: item.imagePreviewUrl,
    });
  };

  const handleDeleteItem = (id: string, name: string) => {
    AppHaptics.warning();
    setItemToDelete({ id, name });
  };

  const confirmDeleteItem = async () => {
    if (itemToDelete) {
      AppHaptics.success();
      const updated = await deleteHistoryItem(itemToDelete.id);
      setHistoryItems(updated);
      setItemToDelete(null);
    }
  };

  const handleClearAll = () => {
    AppHaptics.warning();
    setIsClearAllModalVisible(true);
  };

  const confirmClearAll = async () => {
    AppHaptics.success();
    setIsClearAllModalVisible(false);
    await clearAllHistory();
    setHistoryItems([]);
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredItems = historyItems.filter((item) => {
    if (filterMode === 'clean') return (item.novaGroup || 1) <= 2;
    if (filterMode === 'processed') return item.novaGroup === 3;
    if (filterMode === 'ultra') return item.novaGroup === 4;
    return true;
  });

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
        />
      }
    >
      <FadeInView delay={0}>
        <ScreenHeader
          title="Scan History"
          subtitle={`${historyItems.length} ${
            historyItems.length === 1 ? 'saved report on device' : 'saved reports on device'
          }`}
          largeTitle={true}
          rightElement={
            historyItems.length > 0 ? (
              <View style={styles.headerActions}>
                <PressableScale
                  style={[
                    styles.actionIconButton,
                    {
                      backgroundColor: colors.dangerLight,
                      borderColor: colors.dangerBorder,
                    },
                  ]}
                  onPress={handleClearAll}
                  scaleTo={0.92}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Clear all history"
                >
                  <Trash2 size={16} color={colors.dangerText} />
                </PressableScale>
              </View>
            ) : undefined
          }
        />
      </FadeInView>

      {historyItems.length > 0 && (
        <FadeInView delay={30} style={styles.filterRow}>
          {[
            { id: 'all', label: `All (${historyItems.length})` },
            { id: 'clean', label: 'Clean (1-2)' },
            { id: 'processed', label: 'Processed (3)' },
            { id: 'ultra', label: 'Ultra (4)' },
          ].map((tab) => {
            const active = filterMode === tab.id;
            return (
              <PressableScale
                key={tab.id}
                onPress={() => {
                  AppHaptics.selection();
                  setFilterMode(tab.id as any);
                }}
                scaleTo={0.94}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: active ? colors.primary : colors.surfaceRaised,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    {
                      color: active ? colors.onPrimary : colors.textSecondary,
                      fontWeight: active ? '700' : '500',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </PressableScale>
            );
          })}
        </FadeInView>
      )}

      {/* FitBuddy-Grade 30-Day Activity Heatmap with Real Scan Data */}
      {historyItems.length > 0 && (
        <FadeInView delay={50}>
          <Card style={{ marginBottom: spacing.md }}>
            <CardContent>
              <ScanActivityHeatmap days={heatmapDays} />
            </CardContent>
          </Card>
        </FadeInView>
      )}

      {historyItems.length === 0 ? (
        <EmptyState
          title="No Saved Scans Yet"
          description="Point your camera at any food ingredient label or explore instant samples from the Home screen."
          actionTitle="Start Scanning"
          onAction={() => (navigation as any).navigate('Scan')}
          icon={<HistoryIcon size={32} color={colors.textMuted} />}
          style={{ marginTop: 44 }}
        />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title="No Scans in this Category"
          description="None of your saved scans match the selected processing filter."
          actionTitle="Show All Scans"
          onAction={() => setFilterMode('all')}
          icon={<Filter size={32} color={colors.textMuted} />}
          style={{ marginTop: 32 }}
        />
      ) : (
        filteredItems.map((item, idx) => (
          <FadeInView key={item.id} delay={50 + idx * 45}>
            <Card style={styles.itemCard}>
              <View style={styles.cardHeader}>
                <PressableScale
                  onPress={() => handleOpenItem(item)}
                  onLongPress={() => {
                    AppHaptics.impactHeavy();
                    handleDeleteItem(item.id, item.productName);
                  }}
                  scaleTo={0.98}
                  style={styles.cardTitleContainer}
                  accessibilityRole="button"
                  accessibilityLabel={`Open report for ${item.productName}`}
                >
                  {item.brand ? (
                    <Text style={[styles.brandText, { color: colors.primary }]}>
                      {item.brand.toUpperCase()}
                    </Text>
                  ) : null}
                  <Text style={[styles.productName, { color: colors.text }]}>
                    {item.productName}
                  </Text>
                </PressableScale>

                <PressableScale
                  onPress={() => handleDeleteItem(item.id, item.productName)}
                  style={[
                    styles.deleteIconButton,
                    { backgroundColor: colors.surfaceRaised },
                  ]}
                  scaleTo={0.9}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${item.productName}`}
                >
                  <Trash2 size={15} color={colors.textSecondary} />
                </PressableScale>
              </View>

              <PressableScale
                onPress={() => handleOpenItem(item)}
                scaleTo={0.98}
                accessibilityRole="button"
                accessibilityLabel={`Inspect report ${item.productName}`}
              >
                <View style={styles.metaRow}>
                  <RatingStars rating={item.rating} size="sm" />
                  <NovaBadge novaGroup={item.novaGroup} size="sm" />
                </View>

                <View
                  style={[
                    styles.cardFooter,
                    { borderTopColor: colors.separator },
                  ]}
                >
                  <View style={styles.timeRow}>
                    <Clock size={12} color={colors.textMuted} />
                    <Text style={[styles.timeText, { color: colors.textMuted }]}>
                      {formatTimestamp(item.timestamp)}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={colors.textSecondary} />
                </View>
              </PressableScale>
            </Card>
          </FadeInView>
        ))
      )}

      <ConfirmModal
        visible={itemToDelete !== null}
        title="Delete Scan"
        message={itemToDelete ? `Remove "${itemToDelete.name}" from your saved scan history?` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        destructive={true}
        onConfirm={confirmDeleteItem}
        onCancel={() => setItemToDelete(null)}
      />

      <ConfirmModal
        visible={isClearAllModalVisible}
        title="Clear History"
        message="Are you sure you want to delete all saved scan reports from this device?"
        confirmText="Clear All"
        cancelText="Cancel"
        destructive={true}
        onConfirm={confirmClearAll}
        onCancel={() => setIsClearAllModalVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 11,
    letterSpacing: -0.1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionIconButton: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    borderRadius: layout.minTouchTarget / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemCard: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm + 2,
  },
  cardTitleContainer: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  brandText: {
    fontSize: typography.fontSizes.caption2,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.7,
    marginBottom: 2,
  },
  productName: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: -0.2,
  },
  deleteIconButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm + 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: typography.fontSizes.xs,
    marginLeft: spacing.xs,
  },
});
