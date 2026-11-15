import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { AppHaptics } from '../lib/haptics';
import { PressableScale } from '../theme/animations';
import { spacing, typography } from '../theme/tokens';

interface MacroProportionBarProps {
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams?: number;
  calories?: number;
}

// ponytail: FitBuddy-grade stacked macro proportion bar with clean responsive geometry
export function MacroProportionBar({
  proteinGrams,
  carbsGrams,
  fatGrams,
  fiberGrams = 0,
  calories,
}: MacroProportionBarProps) {
  const { colors, isDark } = useTheme();

  const safeProtein = Math.max(0, proteinGrams || 0);
  const safeCarbs = Math.max(0, carbsGrams || 0);
  const safeFat = Math.max(0, fatGrams || 0);
  const safeFiber = Math.max(0, fiberGrams || 0);

  const totalGrams = safeProtein + safeCarbs + safeFat;

  // Percentage calculations
  const proteinPct = totalGrams > 0 ? Math.round((safeProtein / totalGrams) * 100) : 0;
  const carbsPct = totalGrams > 0 ? Math.round((safeCarbs / totalGrams) * 100) : 0;
  const fatPct = totalGrams > 0 ? Math.max(0, 100 - proteinPct - carbsPct) : 0;

  // Segment colors
  const proteinColor = '#10B981'; // Emerald
  const carbsColor = '#F59E0B';   // Amber
  const fatColor = '#EF4444';     // Coral
  const fiberColor = '#8B5CF6';   // Purple

  const handlePillPress = (name: string, grams: number, pct: number) => {
    AppHaptics.selection();
  };

  return (
    <View style={styles.container}>
      {/* Top Header with Calories */}
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Macro Breakdown</Text>
        {calories !== undefined && calories > 0 && (
          <View style={[styles.calBadge, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
            <Text style={[styles.calValue, { color: colors.text }]}>
              {calories} <Text style={{ color: colors.textSecondary, fontWeight: '500' }}>kcal</Text>
            </Text>
          </View>
        )}
      </View>

      {/* Stacked Horizontal Segment Bar */}
      <View style={[styles.barTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        {totalGrams === 0 ? (
          <View style={[styles.emptyBar, { backgroundColor: colors.surfaceRaised }]} />
        ) : (
          <>
            {proteinPct > 0 && (
              <View
                style={[
                  styles.barSegment,
                  {
                    width: `${proteinPct}%`,
                    backgroundColor: proteinColor,
                    borderTopLeftRadius: 6,
                    borderBottomLeftRadius: 6,
                  },
                ]}
              />
            )}
            {carbsPct > 0 && (
              <View
                style={[
                  styles.barSegment,
                  {
                    width: `${carbsPct}%`,
                    backgroundColor: carbsColor,
                    borderTopLeftRadius: proteinPct === 0 ? 6 : 0,
                    borderBottomLeftRadius: proteinPct === 0 ? 6 : 0,
                  },
                ]}
              />
            )}
            {fatPct > 0 && (
              <View
                style={[
                  styles.barSegment,
                  {
                    width: `${fatPct}%`,
                    backgroundColor: fatColor,
                    borderTopRightRadius: 6,
                    borderBottomRightRadius: 6,
                  },
                ]}
              />
            )}
          </>
        )}
      </View>

      {/* Macro Legend Pills with Haptic Touch */}
      <View style={styles.legendRow}>
        <PressableScale
          style={[styles.macroPill, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}
          onPress={() => handlePillPress('Protein', safeProtein, proteinPct)}
        >
          <View style={[styles.dot, { backgroundColor: proteinColor }]} />
          <View>
            <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Protein</Text>
            <Text style={[styles.macroGrams, { color: colors.text }]}>
              {safeProtein}g <Text style={styles.pctText}>({proteinPct}%)</Text>
            </Text>
          </View>
        </PressableScale>

        <PressableScale
          style={[styles.macroPill, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}
          onPress={() => handlePillPress('Carbs', safeCarbs, carbsPct)}
        >
          <View style={[styles.dot, { backgroundColor: carbsColor }]} />
          <View>
            <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Carbs</Text>
            <Text style={[styles.macroGrams, { color: colors.text }]}>
              {safeCarbs}g <Text style={styles.pctText}>({carbsPct}%)</Text>
            </Text>
          </View>
        </PressableScale>

        <PressableScale
          style={[styles.macroPill, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}
          onPress={() => handlePillPress('Fat', safeFat, fatPct)}
        >
          <View style={[styles.dot, { backgroundColor: fatColor }]} />
          <View>
            <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Fat</Text>
            <Text style={[styles.macroGrams, { color: colors.text }]}>
              {safeFat}g <Text style={styles.pctText}>({fatPct}%)</Text>
            </Text>
          </View>
        </PressableScale>

        {safeFiber > 0 && (
          <PressableScale
            style={[styles.macroPill, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}
            onPress={() => handlePillPress('Fiber', safeFiber, 0)}
          >
            <View style={[styles.dot, { backgroundColor: fiberColor }]} />
            <View>
              <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Fiber</Text>
              <Text style={[styles.macroGrams, { color: colors.text }]}>{safeFiber}g</Text>
            </View>
          </PressableScale>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  calBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  calValue: {
    fontSize: typography.fontSizes.xs,
    fontWeight: '700',
  },
  barTrack: {
    height: 12,
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
    marginVertical: spacing.xs,
  },
  emptyBar: {
    flex: 1,
    height: '100%',
  },
  barSegment: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: spacing.xs,
  },
  macroPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  macroGrams: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  pctText: {
    fontSize: 10,
    fontWeight: '500',
    opacity: 0.7,
  },
});
