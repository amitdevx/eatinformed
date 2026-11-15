import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Dimensions,
} from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Line,
  Circle,
  G,
} from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';
import { AppHaptics } from '../lib/haptics';
import { typography, spacing, borderRadius } from '../theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface TrendDataPoint {
  day: string; // e.g. 'Mon', 'Tue'
  score: number; // 0.0 - 5.0
  dateStr: string;
  scansCount: number;
}

interface ProcessingTrendChartProps {
  data?: TrendDataPoint[];
  height?: number;
}

const DEFAULT_TREND_DATA: TrendDataPoint[] = [
  { day: 'Mon', score: 4.6, dateStr: 'May 12', scansCount: 3 },
  { day: 'Tue', score: 3.8, dateStr: 'May 13', scansCount: 2 },
  { day: 'Wed', score: 4.8, dateStr: 'May 14', scansCount: 4 },
  { day: 'Thu', score: 2.9, dateStr: 'May 15', scansCount: 1 },
  { day: 'Fri', score: 4.2, dateStr: 'May 16', scansCount: 3 },
  { day: 'Sat', score: 4.5, dateStr: 'May 17', scansCount: 5 },
  { day: 'Sun', score: 4.9, dateStr: 'May 18', scansCount: 4 },
];

// ponytail: FitBuddy-grade interactive cubic spline scrubber chart using pure react-native-svg (zero dependencies)
export function ProcessingTrendChart({
  data = DEFAULT_TREND_DATA,
  height = 160,
}: ProcessingTrendChartProps) {
  const { colors, isDark } = useTheme();
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH - 64);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const paddingHorizontal = 18;
  const paddingTop = 24;
  const paddingBottom = 30;

  const chartWidth = Math.max(containerWidth, 200);
  const plotWidth = chartWidth - paddingHorizontal * 2;
  const plotHeight = height - paddingTop - paddingBottom;

  // Compute coordinate geometry
  const points = useMemo(() => {
    if (data.length === 0) return [];
    const stepX = data.length > 1 ? plotWidth / (data.length - 1) : 0;
    return data.map((d, i) => {
      const x = paddingHorizontal + i * stepX;
      // Invert Y coordinate (0.0 is bottom, 5.0 is top)
      const normalizedScore = Math.max(0, Math.min(d.score, 5.0)) / 5.0;
      const y = paddingTop + plotHeight * (1 - normalizedScore);
      return { x, y, data: d };
    });
  }, [data, plotWidth, plotHeight, paddingHorizontal, paddingTop]);

  // Compute smooth cubic bezier path connecting all points
  const { pathD, fillD } = useMemo(() => {
    if (points.length < 2) return { pathD: '', fillD: '' };

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

      // Catmull-Rom to Cubic Bezier control point conversion
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }

    const baselineY = paddingTop + plotHeight;
    const lastX = points[points.length - 1].x;
    const firstX = points[0].x;
    const fill = `${d} L ${lastX.toFixed(1)} ${baselineY.toFixed(1)} L ${firstX.toFixed(1)} ${baselineY.toFixed(1)} Z`;

    return { pathD: d, fillD: fill };
  }, [points, paddingTop, plotHeight]);

  const activeIndexRef = useRef<number | null>(null);

  // Pan responder for continuous touch scrubbing with tactile ticks
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const touchX = evt.nativeEvent.locationX;
          updateClosestIndex(touchX);
        },
        onPanResponderMove: (evt) => {
          const touchX = evt.nativeEvent.locationX;
          updateClosestIndex(touchX);
        },
        onPanResponderRelease: () => {
          // Keep active point visible for user examination
        },
      }),
    [points]
  );

  const updateClosestIndex = (touchX: number) => {
    if (points.length === 0) return;
    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < points.length; i++) {
      const diff = Math.abs(points[i].x - touchX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }
    if (closestIdx !== activeIndexRef.current) {
      activeIndexRef.current = closestIdx;
      setSelectedIndex(closestIdx);
      AppHaptics.selection();
    }
  };

  const activePoint = selectedIndex !== null ? points[selectedIndex] : points[points.length - 1];

  return (
    <View
      style={styles.wrapper}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {/* Dynamic Floating Tooltip Header */}
      {activePoint && (
        <View style={styles.tooltipHeader}>
          <View>
            <Text style={[styles.tooltipDay, { color: colors.textSecondary }]}>
              {activePoint.data.dateStr} ({activePoint.data.day})
            </Text>
            <View style={styles.tooltipScoreRow}>
              <Text style={[styles.tooltipScore, { color: colors.text }]}>
                {activePoint.data.score.toFixed(1)}
              </Text>
              <Text style={[styles.tooltipScoreScale, { color: colors.textSecondary }]}>
                / 5.0 HEALTH INDEX
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.clarityBadge,
              {
                backgroundColor:
                  activePoint.data.score >= 4.0
                    ? colors.successLight
                    : activePoint.data.score >= 2.5
                    ? colors.warningLight
                    : colors.dangerLight,
                borderColor:
                  activePoint.data.score >= 4.0
                    ? colors.primary
                    : activePoint.data.score >= 2.5
                    ? colors.warning
                    : colors.danger,
              },
            ]}
          >
            <Text
              style={[
                styles.clarityBadgeText,
                {
                  color:
                    activePoint.data.score >= 4.0
                      ? colors.primary
                      : activePoint.data.score >= 2.5
                      ? colors.warning
                      : colors.danger,
                },
              ]}
            >
              {activePoint.data.score >= 4.0
                ? 'Clean Diet'
                : activePoint.data.score >= 2.5
                ? 'Moderate'
                : 'Processed'}
            </Text>
          </View>
        </View>
      )}

      {/* SVG Cubic Spline Canvas with Touch Scrubbing */}
      <View {...panResponder.panHandlers} style={[styles.svgContainer, { height }]}>
        <Svg width={chartWidth} height={height}>
          <Defs>
            <LinearGradient id="splineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={colors.primary} stopOpacity={isDark ? '0.35' : '0.22'} />
              <Stop offset="100%" stopColor={colors.primary} stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          {/* Reference Baseline Guide */}
          <Line
            x1={paddingHorizontal}
            y1={paddingTop + plotHeight * 0.2}
            x2={chartWidth - paddingHorizontal}
            y2={paddingTop + plotHeight * 0.2}
            stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
            strokeWidth={1}
            strokeDasharray="4 4"
          />

          {/* Shaded Area Fill */}
          {fillD !== '' && <Path d={fillD} fill="url(#splineGradient)" />}

          {/* Smooth Cubic Spline Stroke */}
          {pathD !== '' && (
            <Path
              d={pathD}
              stroke={colors.primary}
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Vertical Scrubber Guide Hairline */}
          {activePoint && (
            <G>
              <Line
                x1={activePoint.x}
                y1={paddingTop - 4}
                x2={activePoint.x}
                y2={paddingTop + plotHeight}
                stroke={colors.primary}
                strokeWidth={1.5}
                strokeDasharray="3 3"
                opacity={0.8}
              />
              {/* Glowing Outer Indicator Ring */}
              <Circle
                cx={activePoint.x}
                cy={activePoint.y}
                r={9}
                fill={colors.primary}
                opacity={0.25}
              />
              {/* Inner Focus Dot */}
              <Circle
                cx={activePoint.x}
                cy={activePoint.y}
                r={5}
                fill={colors.surface}
                stroke={colors.primary}
                strokeWidth={2.5}
              />
            </G>
          )}

          {/* Day Label Tags along X Axis */}
          {points.map((pt, i) => (
            <Circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r={2.5}
              fill={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)'}
            />
          ))}
        </Svg>

        {/* X-Axis Day Initial Row */}
        <View style={[styles.dayLabelsRow, { paddingHorizontal }]}>
          {data.map((d, i) => (
            <Text
              key={i}
              style={[
                styles.dayLabelText,
                {
                  color:
                    selectedIndex === i
                      ? colors.primary
                      : colors.textSecondary,
                  fontWeight: selectedIndex === i ? '700' : '500',
                },
              ]}
            >
              {d.day}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: spacing.xs,
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
    paddingHorizontal: 4,
  },
  tooltipDay: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tooltipScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  tooltipScore: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  tooltipScoreScale: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  clarityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  clarityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  svgContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  dayLabelsRow: {
    position: 'absolute',
    bottom: 2,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayLabelText: {
    fontSize: 10,
    letterSpacing: -0.1,
  },
});
