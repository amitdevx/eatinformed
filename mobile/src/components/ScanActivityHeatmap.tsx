import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { AppHaptics } from '../lib/haptics';
import { typography, spacing } from '../theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface HeatmapDay {
  dayNumber: number;
  dateStr: string;
  scansCount: number;
  averageScore?: number;
}

interface ScanActivityHeatmapProps {
  days?: HeatmapDay[];
}

function generateEmptyDays(): HeatmapDay[] {
  const list: HeatmapDay[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    list.push({
      dayNumber: d.getDate(),
      dateStr: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      scansCount: 0,
      averageScore: undefined,
    });
  }
  return list;
}

// FitBuddy-grade 30-day nutrition consistency heatmap with GymMane color tokens
export function ScanActivityHeatmap({ days }: ScanActivityHeatmapProps) {
  const { colors, isDark } = useTheme();
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH - 64);
  const [selectedDay, setSelectedDay] = useState<HeatmapDay | null>(null);

  const activeDays = days && days.length > 0 ? days : generateEmptyDays();

  // Grid calculation: 6 columns x 5 rows = 30 cells
  const numColumns = 6;
  const gap = 6;
  const availableWidth = Math.max(containerWidth, 240);
  const cellSize = Math.floor((availableWidth - (numColumns - 1) * gap) / numColumns);

  const handleCellPress = (day: HeatmapDay) => {
    AppHaptics.selection();
    setSelectedDay(day);
  };

  const getCellColor = (day: HeatmapDay) => {
    if (day.scansCount === 0 || day.averageScore === undefined) {
      return isDark ? '#242424' : '#E7E2DC';
    }
    if (day.averageScore >= 4.2) return colors.primary;
    if (day.averageScore >= 3.0) return colors.warning;
    return colors.danger;
  };

  return (
    <View
      style={styles.container}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {/* Active Day Inspection Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>30-Day Nutrition Consistency</Text>
        {selectedDay ? (
          <Text style={[styles.activeInfo, { color: colors.primary }]}>
            {selectedDay.dateStr}: {selectedDay.scansCount} {selectedDay.scansCount === 1 ? 'scan' : 'scans'} · {selectedDay.averageScore !== undefined ? `${selectedDay.averageScore} score` : 'No scans'}
          </Text>
        ) : (
          <Text style={[styles.activeInfo, { color: colors.textSecondary }]}>Tap day to inspect</Text>
        )}
      </View>

      {/* 30-Day Grid (6 columns x 5 rows) with fixed pixel cell sizes */}
      <View style={[styles.grid, { gap }]}>
        {activeDays.map((day, idx) => {
          const isSelected = selectedDay?.dayNumber === day.dayNumber && selectedDay?.dateStr === day.dateStr;
          return (
            <Pressable
              key={idx}
              onPress={() => handleCellPress(day)}
              style={[
                styles.cell,
                {
                  width: cellSize,
                  height: cellSize,
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
    justifyContent: 'flex-start',
  },
  cell: {
    borderRadius: 6,
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
