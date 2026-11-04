import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Trash2,
  Clock,
  ArrowRight,
  History as HistoryIcon,
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { EmptyState } from '../components/States';
import { NovaBadge } from '../components/NovaBadge';
import { RatingStars } from '../components/RatingStars';
import { colors } from '../theme/colors';
import { borderRadius, spacing, typography } from '../theme/tokens';
import { getScanHistory, deleteHistoryItem, clearAllHistory } from '../lib/history';
import { HistoryItem } from '../types';
import { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HistoryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    Alert.alert(
      'Delete Scan',
      `Remove "${name}" from scan history?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = await deleteHistoryItem(id);
            setHistoryItems(updated);
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to delete all saved scan reports?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearAllHistory();
            setHistoryItems([]);
          },
        },
      ]
    );
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
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Scan History</Text>
          <Text style={styles.subtitle}>
            {historyItems.length}{' '}
            {historyItems.length === 1 ? 'saved report' : 'saved reports'}
          </Text>
        </View>

        {historyItems.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearAll}
            activeOpacity={0.8}
          >
            <Trash2 size={16} color={colors.danger} />
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {historyItems.length === 0 ? (
        <EmptyState
          title="No Scans Yet"
          description="Point your camera at food ingredient labels or choose sample items from the home screen."
          actionTitle="Start Scanning"
          onAction={() => (navigation as any).navigate('Scan')}
          icon={<HistoryIcon size={36} color={colors.textMuted} />}
          style={{ marginTop: 40 }}
        />
      ) : (
        historyItems.map((item) => (
          <Card
            key={item.id}
            onPress={() => handleOpenItem(item)}
            style={styles.itemCard}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                {item.brand ? (
                  <Text style={styles.brandText}>{item.brand}</Text>
                ) : null}
                <Text style={styles.productName}>{item.productName}</Text>
              </View>

              <TouchableOpacity
                onPress={() => handleDeleteItem(item.id, item.productName)}
                style={styles.deleteIconButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Trash2 size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.metaRow}>
              <RatingStars rating={item.rating} size="sm" />
              <NovaBadge novaGroup={item.novaGroup} size="sm" />
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.timeRow}>
                <Clock size={12} color={colors.textMuted} />
                <Text style={styles.timeText}>
                  {formatTimestamp(item.timestamp)}
                </Text>
              </View>
              <ArrowRight size={16} color={colors.textSecondary} />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  title: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  clearButtonText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.danger,
    marginLeft: spacing.xs,
  },
  itemCard: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  cardTitleContainer: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  brandText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.primary,
    marginBottom: 2,
  },
  productName: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  deleteIconButton: {
    padding: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
});
