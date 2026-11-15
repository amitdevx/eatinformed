import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { AppHaptics } from '../lib/haptics';
import { borderRadius, spacing, typography } from '../theme/tokens';

const MONTH_INITIALS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

interface YearActivityChartProps {
  monthlyCounts?: number[];
  totalScans?: number;
}

// ponytail: GymMane-style 12-month annual logging activity histogram
export function YearActivityChart({
  monthlyCounts = [2, 5, 8, 12, 16, 14, 18, 22, 19, 25, 28, 15],
  totalScans = 184,
}: YearActivityChartProps) {
  const { colors, isDark } = useTheme();

  const currentMonthIdx = new Date().getMonth(); // 0-based (0 = Jan, 11 = Dec)
  const peak = Math.max(1, ...monthlyCounts);

  const cleanRatio = '78%';
  const activeMonths = monthlyCounts.filter((c) => c > 0).length;

  return (
    <View style={styles.container}>
      {/* 3-Column Summary Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCol}>
          <Text style={[styles.statValue, { color: colors.text }]}>{totalScans}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>SCANS THIS YEAR</Text>
        </View>

        <View style={styles.statCol}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{cleanRatio}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>CLEAN FOODS</Text>
        </View>

        <View style={styles.statCol}>
          <Text style={[styles.statValue, { color: colors.text }]}>{activeMonths}/12</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>ACTIVE MONTHS</Text>
        </View>
      </View>

      {/* 12-Month Bar Chart */}
      <View style={styles.barsContainer}>
        {MONTH_INITIALS.map((initial, idx) => {
          const count = monthlyCounts[idx] || 0;
          const isCurrent = idx === currentMonthIdx;
          const heightPct = Math.max(0.1, count / peak);

          return (
            <Pressable
              key={idx}
              onPress={() => AppHaptics.selection()}
              style={styles.barColumn}
            >
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${heightPct * 100}%`,
                      backgroundColor: isCurrent
                        ? colors.primary
                        : count > 0
                        ? isDark
                          ? 'rgba(255, 255, 255, 0.45)'
                          : 'rgba(0, 0, 0, 0.35)'
                        : colors.surfaceRaised,
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.monthInitial,
                  {
                    color: isCurrent ? colors.primary : colors.textMuted,
                    fontWeight: isCurrent ? '800' : '500',
                  },
                ]}
              >
                {initial}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  statCol: {
    flex: 1,
  },
  statValue: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: typography.fontSizes.caption2 - 1,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.6,
    marginTop: 2,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 72,
    gap: 4,
  },
  barColumn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: '100%',
    flex: 1,
    justifyContent: 'flex-end',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
  },
  monthInitial: {
    fontSize: 10,
    marginTop: 6,
    textAlign: 'center',
  },
});
