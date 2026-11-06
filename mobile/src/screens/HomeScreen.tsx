import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { NovaBadge } from '../components/NovaBadge';
import { RatingStars } from '../components/RatingStars';
import { useTheme } from '../theme/ThemeContext';
import { FadeInView, PressableScale } from '../theme/animations';
import { borderRadius, layout, spacing, typography } from '../theme/tokens';
import { SAMPLE_PRODUCTS, SampleProduct } from '../lib/sample-products';
import { RootStackParamList } from '../navigation/types';
import { EatInformedLogo } from '../components/EatInformedLogo';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark, toggleTheme } = useTheme();

  const handleStartScan = () => {
    (navigation as any).navigate('Scan');
  };

  const handleOpenSample = (sample: SampleProduct) => {
    navigation.navigate('Result', {
      data: sample.data,
      imageUri: null,
    });
  };

  const handleOpenGuide = () => {
    (navigation as any).navigate('Guide');
  };

  const handleOpenHistory = () => {
    (navigation as any).navigate('History');
  };

  const handleOpenProfile = () => {
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
            accessibilityLabel="Toggle appearance mode"
          >
            {isDark ? (
              <Sun size={18} color={colors.text} />
            ) : (
              <Moon size={18} color={colors.text} />
            )}
          </PressableScale>
        </View>

        <Text style={[styles.heroTitle, { color: colors.text }]}>
          Food clarity.{'\n'}
          <Text style={{ color: colors.textSecondary }}>For what you eat.</Text>
        </Text>
        <Text style={[styles.heroDescription, { color: colors.textSecondary }]}>
          Scan any ingredient list or nutrition panel for instant NOVA food processing classifications, additive alerts, and objective health scores.
        </Text>
      </FadeInView>

      {/* Main Scan Action Card */}
      <FadeInView delay={60}>
        <Card
          style={{
            borderColor: colors.primaryBorder,
          }}
        >
          <CardContent>
            <View style={styles.ctaTopRow}>
              <View
                style={[
                  styles.ctaIconContainer,
                  {
                    backgroundColor: colors.primaryMuted,
                    borderColor: colors.primaryBorder,
                  },
                ]}
              >
                <ScanLine size={22} color={colors.primary} />
              </View>
              <View style={styles.ctaTextContainer}>
                <Text style={[styles.ctaTitle, { color: colors.text }]}>
                  Scan a Product Label
                </Text>
                <Text style={[styles.ctaDescription, { color: colors.textSecondary }]}>
                  Instant camera capture or photo library upload
                </Text>
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
              >
                <History size={14} color={colors.text} />
                <Text style={[styles.quickNavText, { color: colors.text }]}>History</Text>
              </PressableScale>

              <PressableScale
                style={[
                  styles.quickNavButton,
                  { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
                ]}
                onPress={handleOpenGuide}
                scaleTo={0.95}
              >
                <BookOpen size={14} color={colors.text} />
                <Text style={[styles.quickNavText, { color: colors.text }]}>NOVA Guide</Text>
              </PressableScale>

              <PressableScale
                style={[
                  styles.quickNavButton,
                  { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
                ]}
                onPress={handleOpenProfile}
                scaleTo={0.95}
              >
                <User size={14} color={colors.text} />
                <Text style={[styles.quickNavText, { color: colors.text }]}>Account</Text>
              </PressableScale>
            </View>
          </CardContent>
        </Card>
      </FadeInView>

      {/* Demo Samples Section */}
      <FadeInView delay={120} style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Try Instant Samples
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          Compare real products across the NOVA food processing spectrum
        </Text>
      </FadeInView>

      {SAMPLE_PRODUCTS.map((sample, index) => (
        <FadeInView key={sample.id} delay={160 + index * 50}>
          <Card onPress={() => handleOpenSample(sample)} style={styles.sampleCard}>
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
    minHeight: 40,
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
