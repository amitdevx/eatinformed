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
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { EmptyState } from '../components/States';
import { NovaBadge } from '../components/NovaBadge';
import { RatingStars } from '../components/RatingStars';
import { ConfirmModal } from '../components/ConfirmModal';
import { useTheme } from '../theme/ThemeContext';
import { FadeInView, PressableScale } from '../theme/animations';
import { borderRadius, spacing, typography } from '../theme/tokens';
import { getScanHistory, deleteHistoryItem, clearAllHistory } from '../lib/history';
import { HistoryItem } from '../types';
import { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HistoryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isClearAllModalVisible, setIsClearAllModalVisible] = useState(false);

  const loadHistory = useCallback(async () => {
    const items = await getScanHistory();
    setHistoryItems(items);
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
    navigation.navigate('Result', {
      data: item.data,
      imageUri: item.imagePreviewUrl,
    });
  };

  const handleDeleteItem = (id: string, name: string) => {
    setItemToDelete({ id, name });
  };

  const confirmDeleteItem = async () => {
    if (itemToDelete) {
      const updated = await deleteHistoryItem(itemToDelete.id);
      setHistoryItems(updated);
      setItemToDelete(null);
    }
  };

  const handleClearAll = () => {
    setIsClearAllModalVisible(true);
  };

  const confirmClearAll = async () => {
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
      <FadeInView delay={0} style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Scan History</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {historyItems.length}{' '}
            {historyItems.length === 1
              ? 'saved report on device'
              : 'saved reports on device'}
          </Text>
        </View>

        {historyItems.length > 0 && (
          <PressableScale
            style={[
              styles.clearButton,
              {
                backgroundColor: colors.dangerLight,
                borderColor: colors.dangerBorder,
              },
            ]}
            onPress={handleClearAll}
            scaleTo={0.95}
          >
            <Trash2 size={14} color={colors.dangerText} />
            <Text style={[styles.clearButtonText, { color: colors.dangerText }]}>
              Clear All
            </Text>
          </PressableScale>
        )}
      </FadeInView>

      {historyItems.length === 0 ? (
        <EmptyState
          title="No Saved Scans Yet"
          description="Point your camera at any food ingredient label or explore instant samples from the Home screen."
          actionTitle="Start Scanning"
          onAction={() => (navigation as any).navigate('Scan')}
          icon={<HistoryIcon size={32} color={colors.textMuted} />}
          style={{ marginTop: 44 }}
        />
      ) : (
        historyItems.map((item, idx) => (
          <FadeInView key={item.id} delay={50 + idx * 45}>
            <Card onPress={() => handleOpenItem(item)} style={styles.itemCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  {item.brand ? (
                    <Text style={[styles.brandText, { color: colors.primary }]}>
                      {item.brand.toUpperCase()}
                    </Text>
                  ) : null}
                  <Text style={[styles.productName, { color: colors.text }]}>
                    {item.productName}
                  </Text>
                </View>

                <PressableScale
                  onPress={() => handleDeleteItem(item.id, item.productName)}
                  style={[
                    styles.deleteIconButton,
                    { backgroundColor: colors.surfaceRaised },
                  ]}
                  scaleTo={0.9}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Trash2 size={15} color={colors.textSecondary} />
                </PressableScale>
              </View>

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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.base,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.black,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: typography.fontSizes.sm,
    marginTop: 2,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  clearButtonText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    marginLeft: spacing.xs,
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
