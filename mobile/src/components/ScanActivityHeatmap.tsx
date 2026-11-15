import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { AppHaptics } from '../lib/haptics';
import { typography, spacing } from '../theme/tokens';

export interface HeatmapDay {
  dayNumber: number;
  dateStr: string;
  scansCount: number;
  averageScore?: number;
}

interface ScanActivityHeatmapProps {
  days?: HeatmapDay[];
}

// Generate fallback 30-day realistic activity
function generateDefaultDays(): HeatmapDay[] {
  const list: HeatmapDay[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    // Deterministic simulation
    const daySeed = (d.getDate() * 7) % 10;
    const scansCount = daySeed > 3 ? (daySeed % 4) + 1 : 0;
    const averageScore = scansCount > 0 ? Number((3.6 + (daySeed % 14) * 0.1).toFixed(1)) : undefined;
    list.push({
      dayNumber: d.getDate(),
      dateStr: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      scansCount,
      averageScore,
    });
  }
  return list;
}

// ponytail: FitBuddy-grade 30-day nutrition density heatmap with GymMane color tokens
export function ScanActivityHeatmap({ days = generateDefaultDays() }: ScanActivityHeatmapProps) {
  const { colors, isDark } = useTheme();
  const [selectedDay, setSelectedDay] = useState<HeatmapDay | null>(null);

  const handleCellPress = (day: HeatmapDay) => {
    AppHaptics.selection();
    setSelectedDay(day);
  };

  const getCellColor = (day: HeatmapDay) => {
    if (day.scansCount === 0 || day.averageScore === undefined) {
      return isDark ? '#242424' : '#E7E2DC'; // GymMane heatEmpty token
    }
    if (day.averageScore >= 4.2) return colors.primary; // Clean emerald
    if (day.averageScore >= 3.0) return colors.warning; // Processed amber
    return colors.danger; // Ultra-processed coral
  };

  return (
    <View style={styles.container}>
      {/* Active Day Inspection Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>30-Day Nutrition Consistency</Text>
        {selectedDay ? (
          <Text style={[styles.activeInfo, { color: colors.primary }]}>
            {selectedDay.dateStr}: {selectedDay.scansCount} scans · {selectedDay.averageScore ? `${selectedDay.averageScore} score` : 'Rest day'}
          </Text>
        ) : (
          <Text style={[styles.activeInfo, { color: colors.textSecondary }]}>Tap day to inspect</Text>
        )}
      </View>

      {/* 30-Day Grid (6 columns x 5 rows) */}
      <View style={styles.grid}>
        {days.map((day, idx) => {
          const isSelected = selectedDay?.dayNumber === day.dayNumber;
          return (
            <Pressable
              key={idx}
              onPress={() => handleCellPress(day)}
              style={[
                styles.cell,
                {
                  backgroundColor: getCellColor(day),
                  borderColor: isSelected ? colors.text : 'transparent',
                  borderWidth: isSelected ? 1.5 : 0,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${day.dateStr}: ${day.scansCount} scans`}
            />
          );
        })}
      </View>

      {/* Legend Row */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: isDark ? '#242424' : '#E7E2DC' }]} />
          <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>No Scans</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: colors.warning }]} />
          <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Moderate</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Clean (4.2+)</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  activeInfo: {
    fontSize: 11,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
  },
  cell: {
    width: '14.2%', // 7 per row
    aspectRatio: 1,
    borderRadius: 5,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendBox: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
});
