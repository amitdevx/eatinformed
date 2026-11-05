import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScanLine, ArrowRight, BookOpen, History, User, Sun, Moon } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { NovaBadge } from '../components/NovaBadge';
import { RatingStars } from '../components/RatingStars';
import { useTheme } from '../theme/ThemeContext';
import { borderRadius, spacing, typography } from '../theme/tokens';
import { SAMPLE_PRODUCTS, SampleProduct } from '../lib/sample-products';
import { RootStackParamList } from '../navigation/types';

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
      {/* Apple Minimal Header with Theme Toggle */}
      <View style={styles.header}>
        <View style={styles.topRow}>
          <Text style={[styles.brandTitle, { color: colors.text }]}>EatInformed</Text>
          <TouchableOpacity
            style={[styles.themeToggleButton, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}
            onPress={toggleTheme}
            activeOpacity={0.75}
            accessibilityLabel="Toggle theme"
          >
            {isDark ? (
              <Sun size={18} color={colors.textSecondary} />
            ) : (
              <Moon size={18} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>

        <Text style={[styles.heroTitle, { color: colors.text }]}>
          Food clarity.{'\n'}
          <Text style={{ color: colors.textSecondary }}>For what you eat.</Text>
        </Text>
        <Text style={[styles.heroDescription, { color: colors.textSecondary }]}>
          Scan any ingredient list or nutrition panel for instant NOVA processing classification, chemical additive screening, and health scores.
        </Text>
      </View>

      {/* Main Scan Action Card */}
      <Card style={{ borderColor: isDark ? 'rgba(48, 209, 88, 0.25)' : 'rgba(52, 199, 89, 0.35)' }}>
        <CardContent>
          <View style={styles.ctaTopRow}>
            <View style={[styles.ctaIconContainer, { backgroundColor: colors.primaryMuted }]}>
              <ScanLine size={24} color={colors.primary} />
            </View>
            <View style={styles.ctaTextContainer}>
              <Text style={[styles.ctaTitle, { color: colors.text }]}>Scan a Product Label</Text>
              <Text style={[styles.ctaDescription, { color: colors.textSecondary }]}>
                Camera capture or photo library upload
              </Text>
            </View>
          </View>
          <Button
            title="Scan Food Label"
            onPress={handleStartScan}
            variant="primary"
            size="lg"
            icon={<ScanLine size={18} color="#000000" />}
            style={styles.ctaButton}
          />
          <View style={styles.quickNavRow}>
            <TouchableOpacity
              style={[styles.quickNavButton, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}
              onPress={handleOpenHistory}
              activeOpacity={0.75}
            >
              <History size={14} color={colors.textSecondary} />
              <Text style={[styles.quickNavText, { color: colors.textSecondary }]}>History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickNavButton, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}
              onPress={handleOpenGuide}
              activeOpacity={0.75}
            >
              <BookOpen size={14} color={colors.textSecondary} />
              <Text style={[styles.quickNavText, { color: colors.textSecondary }]}>NOVA Guide</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickNavButton, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}
              onPress={handleOpenProfile}
              activeOpacity={0.75}
            >
              <User size={14} color={colors.textSecondary} />
              <Text style={[styles.quickNavText, { color: colors.textSecondary }]}>Account</Text>
            </TouchableOpacity>
          </View>
        </CardContent>
      </Card>

      {/* Demo Samples Section */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Try Instant Samples</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Compare products across the food processing spectrum
          </Text>
        </View>
      </View>

      {SAMPLE_PRODUCTS.map((sample) => (
        <Card
          key={sample.id}
          onPress={() => handleOpenSample(sample)}
          style={styles.sampleCard}
        >
          <View style={styles.sampleHeader}>
            <View style={styles.sampleInfo}>
              <Text style={[styles.sampleTitle, { color: colors.text }]}>{sample.title}</Text>
              <Text style={[styles.sampleSubtitle, { color: colors.textSecondary }]}>{sample.subtitle}</Text>
            </View>
            <ArrowRight size={16} color={colors.textSecondary} />
          </View>
          <View style={styles.sampleMeta}>
            <RatingStars rating={sample.data.rating} size="sm" />
            <NovaBadge novaGroup={sample.novaGroup} size="sm" />
          </View>
        </Card>
      ))}

      {/* Educational NOVA Banner */}
      <Card onPress={handleOpenGuide} style={{ borderColor: colors.info + '30' }}>
        <CardContent>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <BookOpen size={20} color={colors.info} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>The NOVA Standard</Text>
              <Text style={[styles.infoDescription, { color: colors.textSecondary }]}>
                Developed at the University of Sao Paulo to classify foods by the extent and purpose of industrial processing.
              </Text>
            </View>
          </View>
        </CardContent>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.base,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  brandTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: -0.2,
  },
  themeToggleButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: typography.fontSizes.xxxl,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: -0.6,
    lineHeight: 40,
    marginBottom: spacing.xs,
  },
  heroDescription: {
    fontSize: typography.fontSizes.sm,
    lineHeight: 20,
    marginTop: 4,
  },
  ctaTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  ctaIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    letterSpacing: -0.2,
  },
  ctaDescription: {
    fontSize: typography.fontSizes.xs,
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
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  quickNavText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    marginLeft: 5,
  },
  sectionHeader: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
  },
  sampleCard: {
    marginBottom: spacing.md,
  },
  sampleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sampleInfo: {
    flex: 1,
  },
  sampleTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    letterSpacing: -0.2,
  },
  sampleSubtitle: {
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
  },
  sampleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: spacing.md,
    marginTop: 2,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    marginBottom: 2,
  },
  infoDescription: {
    fontSize: typography.fontSizes.xs,
    lineHeight: 18,
  },
});
