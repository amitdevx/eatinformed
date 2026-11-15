import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ScanLine,
  ChevronRight,
  BookOpen,
  History,
  User,
  Sun,
  Moon,
  Sparkles,
  ShieldCheck,
  Activity,
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Card, CardHeader, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { NovaBadge } from '../components/NovaBadge';
import { RatingStars } from '../components/RatingStars';
import { HealthScoreRing } from '../components/HealthScoreRing';
import { ProcessingTrendChart } from '../components/ProcessingTrendChart';
import { useTheme } from '../theme/ThemeContext';
import { FadeInView, PressableScale } from '../theme/animations';
import { borderRadius, layout, spacing, typography } from '../theme/tokens';
import { SAMPLE_PRODUCTS, SampleProduct } from '../lib/sample-products';
import { getScanHistory } from '../lib/history';
import { AppHaptics } from '../lib/haptics';
import { RootStackParamList } from '../navigation/types';
import { EatInformedLogo } from '../components/EatInformedLogo';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark, toggleTheme } = useTheme();

  const [historyCount, setHistoryCount] = useState(0);
  const [avgScore, setAvgScore] = useState(4.2);

  useFocusEffect(
    useCallback(() => {
      getScanHistory().then((history) => {
        setHistoryCount(history.length);
        if (history.length > 0) {
          const total = history.reduce((acc, cur) => acc + (cur.rating || 0), 0);
          setAvgScore(Number((total / history.length).toFixed(1)));
        } else {
          setAvgScore(4.2);
        }
      });
    }, [])
  );

  const handleStartScan = () => {
    AppHaptics.impactHeavy();
    (navigation as any).navigate('Scan');
  };

  const handleOpenSample = (sample: SampleProduct) => {
    AppHaptics.selection();
    navigation.navigate('Result', {
      data: sample.data,
      imageUri: null,
    });
  };

  const handleOpenGuide = () => {
    AppHaptics.selection();
    (navigation as any).navigate('Guide');
  };

  const handleOpenHistory = () => {
    AppHaptics.selection();
    (navigation as any).navigate('History');
  };

  const handleOpenProfile = () => {
    AppHaptics.selection();
    (navigation as any).navigate('Profile');
  };

  return (
    <Screen scrollable>
      {/* Apple Minimal Header with Brand & Theme Toggle */}
      <FadeInView delay={0} style={styles.header}>
        <View style={styles.topRow}>
          <View style={styles.brandRow}>
            <EatInformedLogo size={24} />
            <Text style={[styles.brandTitle, { color: colors.text, marginLeft: spacing.sm }]}>EatInformed</Text>
          </View>

          <PressableScale
            style={[
              styles.themeToggleButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={toggleTheme}
            scaleTo={0.92}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Toggle appearance mode"
          >
            {isDark ? (
              <Sun size={18} color={colors.text} />
            ) : (
              <Moon size={18} color={colors.text} />
            )}
          </PressableScale>
        </View>

        <Text
          accessibilityRole="header"
          style={[styles.heroTitle, { color: colors.text }]}
        >
          Food clarity.{'\n'}
          <Text style={{ color: colors.textSecondary }}>For what you eat.</Text>
        </Text>
        <Text style={[styles.heroDescription, { color: colors.textSecondary }]}>
          Scan any ingredient list or nutrition panel for instant NOVA food processing classifications, additive alerts, and objective health scores.
        </Text>
      </FadeInView>

      {/* Main Scan Action Card with FitBuddy Health Ring */}
      <FadeInView delay={60}>
        <Card
          style={{
            borderColor: colors.primaryBorder,
          }}
        >
          <CardContent>
            <View style={styles.heroGaugeRow}>
              <HealthScoreRing
                score={avgScore}
                size={82}
                strokeWidth={8}
                label="SCORE"
              />
              <View style={styles.heroGaugeTextCol}>
                <Text
                  accessibilityRole="header"
                  style={[styles.heroGaugeTitle, { color: colors.text }]}
                >
                  Dietary Clarity Index
                </Text>
                <Text style={[styles.heroGaugeSubtitle, { color: colors.textSecondary }]}>
                  {historyCount > 0
                    ? `${historyCount} product audits logged`
                    : 'Instant clinical label OCR & NOVA classification'}
                </Text>

                <View style={styles.heroStatChipsRow}>
                  <View style={[styles.heroStatChip, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
                    <ShieldCheck size={12} color={colors.primary} />
                    <Text style={[styles.heroStatChipText, { color: colors.textSecondary }]}>
                      {historyCount > 0 ? `${historyCount} Audits` : 'Zero Additive Cache'}
                    </Text>
                  </View>
                  <View style={[styles.heroStatChip, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
                    <Activity size={12} color={colors.warning} />
                    <Text style={[styles.heroStatChipText, { color: colors.textSecondary }]}>
                      NOVA 1-4 Ranked
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <Button
              title="Scan Food Label"
              onPress={handleStartScan}
              variant="primary"
              size="lg"
              icon={<ScanLine size={18} color={colors.onPrimary} />}
              style={styles.ctaButton}
            />

            <View style={styles.quickNavRow}>
              <PressableScale
                style={[
                  styles.quickNavButton,
                  { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
                ]}
                onPress={handleOpenHistory}
                scaleTo={0.95}
                accessibilityRole="button"
                accessibilityLabel="View scan history"
              >
                <History size={15} color={colors.text} />
                <Text style={[styles.quickNavText, { color: colors.text }]}>History</Text>
              </PressableScale>

              <PressableScale
                style={[
                  styles.quickNavButton,
                  { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
                ]}
                onPress={handleOpenGuide}
                scaleTo={0.95}
                accessibilityRole="button"
                accessibilityLabel="View NOVA guide"
              >
                <BookOpen size={15} color={colors.text} />
                <Text style={[styles.quickNavText, { color: colors.text }]}>NOVA Guide</Text>
              </PressableScale>

              <PressableScale
                style={[
                  styles.quickNavButton,
                  { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
                ]}
                onPress={handleOpenProfile}
                scaleTo={0.95}
                accessibilityRole="button"
                accessibilityLabel="View account settings"
              >
                <User size={15} color={colors.text} />
                <Text style={[styles.quickNavText, { color: colors.text }]}>Account</Text>
              </PressableScale>
            </View>
          </CardContent>
        </Card>
      </FadeInView>

      {/* FitBuddy-Grade 7-Day Interactive Cubic Spline Scrubber Graph */}
      <FadeInView delay={100}>
        <Card style={{ marginTop: spacing.md }}>
          <CardHeader
            title="7-Day Nutritional Clarity"
            subtitle="Touch-scrubber tracking clinical NOVA diet index"
          />
          <CardContent>
            <ProcessingTrendChart />
          </CardContent>
        </Card>
      </FadeInView>

      {/* Demo Samples Section */}
      <FadeInView delay={140} style={styles.sectionHeader}>
        <Text
          accessibilityRole="header"
          style={[styles.sectionTitle, { color: colors.text }]}
        >
          Try Instant Samples
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          Compare real products across the NOVA food processing spectrum
        </Text>
      </FadeInView>

      {SAMPLE_PRODUCTS.map((sample, index) => (
        <FadeInView key={sample.id} delay={160 + index * 50}>
          <Card
            onPress={() => handleOpenSample(sample)}
            onLongPress={() => AppHaptics.impactHeavy()}
            style={styles.sampleCard}
          >
            <View style={styles.sampleHeader}>
              <View style={styles.sampleInfo}>
                <Text style={[styles.sampleTitle, { color: colors.text }]}>
                  {sample.title}
                </Text>
                <Text style={[styles.sampleSubtitle, { color: colors.textSecondary }]}>
                  {sample.subtitle}
                </Text>
              </View>
              <View
                style={[
                  styles.chevronCircle,
                  { backgroundColor: colors.surfaceRaised },
                ]}
              >
                <ChevronRight size={16} color={colors.textSecondary} />
              </View>
            </View>
            <View style={[styles.sampleMeta, { borderTopColor: colors.separator }]}>
              <RatingStars rating={sample.data.rating} size="sm" />
              <NovaBadge novaGroup={sample.novaGroup} size="sm" />
            </View>
          </Card>
        </FadeInView>
      ))}

      {/* Educational NOVA Banner */}
      <FadeInView delay={320}>
        <Card
          onPress={handleOpenGuide}
          style={{
            borderColor: colors.infoBorder,
            backgroundColor: colors.surface,
          }}
        >
          <CardContent>
            <View style={styles.infoRow}>
              <View
                style={[
                  styles.infoIcon,
                  {
                    backgroundColor: colors.infoLight,
                    borderColor: colors.infoBorder,
                  },
                ]}
              >
                <BookOpen size={18} color={colors.infoText} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoTitle, { color: colors.text }]}>
                  The NOVA Standard
                </Text>
                <Text style={[styles.infoDescription, { color: colors.textSecondary }]}>
                  Developed at the University of Sao Paulo to classify foods by the extent and purpose of industrial processing.
                </Text>
              </View>
              <ChevronRight size={16} color={colors.textMuted} style={{ marginTop: 2 }} />
            </View>
          </CardContent>
        </Card>
      </FadeInView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.base,
    paddingBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  brandTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: -0.3,
  },
  themeToggleButton: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: typography.fontSizes.xxxl,
    fontWeight: typography.fontWeights.black,
    letterSpacing: -0.8,
    lineHeight: 40,
    marginBottom: spacing.xs,
  },
  heroDescription: {
    fontSize: typography.fontSizes.subhead,
    lineHeight: typography.lineHeights.subhead,
    marginTop: 4,
  },
  heroGaugeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.base,
    gap: spacing.md,
  },
  heroGaugeTextCol: {
    flex: 1,
  },
  heroGaugeTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: -0.3,
  },
  heroGaugeSubtitle: {
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
    lineHeight: 16,
  },
  heroStatChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  heroStatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  heroStatChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  ctaTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  ctaIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  ctaTextContainer: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    letterSpacing: -0.3,
  },
  ctaDescription: {
    fontSize: typography.fontSizes.sm,
    marginTop: 2,
  },
  ctaButton: {
    width: '100%',
  },
  quickNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  quickNavButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: layout.minTouchTarget,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  quickNavText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    marginLeft: 6,
    letterSpacing: -0.1,
  },
  sectionHeader: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    fontSize: typography.fontSizes.sm,
    marginTop: 2,
  },
  sampleCard: {
    marginBottom: spacing.md,
  },
  sampleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sampleInfo: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  sampleTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    letterSpacing: -0.2,
  },
  sampleSubtitle: {
    fontSize: typography.fontSizes.sm,
    marginTop: 2,
  },
  chevronCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sampleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm + 2,
    borderTopWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  infoTextContainer: {
    flex: 1,
    paddingRight: spacing.xs,
  },
  infoTitle: {
    fontSize: typography.fontSizes.subhead,
    fontWeight: typography.fontWeights.semibold,
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  infoDescription: {
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.lineHeights.sm,
  },
});
