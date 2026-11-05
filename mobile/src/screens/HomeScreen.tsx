import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScanLine, ArrowRight, BookOpen, History, User } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { NovaBadge } from '../components/NovaBadge';
import { RatingStars } from '../components/RatingStars';
import { colors } from '../theme/colors';
import { borderRadius, spacing, typography } from '../theme/tokens';
import { SAMPLE_PRODUCTS, SampleProduct } from '../lib/sample-products';
import { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();

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
      {/* Apple Minimal Brand Header */}
      <View style={styles.header}>
        <View style={styles.eyebrowContainer}>
          <View style={styles.eyebrowDot} />
          <Text style={styles.eyebrowText}>Clinical Food Intelligence</Text>
        </View>
        <Text style={styles.heroTitle}>
          Food clarity.{'\n'}
          <Text style={styles.heroSubtitle}>Down to the molecule.</Text>
        </Text>
        <Text style={styles.heroDescription}>
          Scan any ingredient list or nutrition panel for instant NOVA processing classification, chemical additive screening, and clinical health scores.
        </Text>
      </View>

      {/* Main Scan Action Card */}
      <Card style={styles.ctaCard}>
        <CardContent>
          <View style={styles.ctaTopRow}>
            <View style={styles.ctaIconContainer}>
              <ScanLine size={24} color={colors.primary} />
            </View>
            <View style={styles.ctaTextContainer}>
              <Text style={styles.ctaTitle}>Scan a Product Label</Text>
              <Text style={styles.ctaDescription}>
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
              style={styles.quickNavButton}
              onPress={handleOpenHistory}
              activeOpacity={0.75}
            >
              <History size={14} color={colors.textSecondary} />
              <Text style={styles.quickNavText}>History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickNavButton}
              onPress={handleOpenGuide}
              activeOpacity={0.75}
            >
              <BookOpen size={14} color={colors.textSecondary} />
              <Text style={styles.quickNavText}>NOVA Guide</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickNavButton}
              onPress={handleOpenProfile}
              activeOpacity={0.75}
            >
              <User size={14} color={colors.textSecondary} />
              <Text style={styles.quickNavText}>Account</Text>
            </TouchableOpacity>
          </View>
        </CardContent>
      </Card>

      {/* Demo Samples Section */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Try Instant Samples</Text>
          <Text style={styles.sectionSubtitle}>
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
              <Text style={styles.sampleTitle}>{sample.title}</Text>
              <Text style={styles.sampleSubtitle}>{sample.subtitle}</Text>
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
      <Card onPress={handleOpenGuide} style={styles.infoCard}>
        <CardContent>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <BookOpen size={20} color={colors.info} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>The NOVA Standard</Text>
              <Text style={styles.infoDescription}>
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
  eyebrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginBottom: spacing.md,
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 6,
  },
  eyebrowText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.textSecondary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: typography.fontSizes.xxxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    letterSpacing: -0.6,
    lineHeight: 40,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    color: colors.textSecondary,
  },
  heroDescription: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: 2,
  },
  ctaCard: {
    backgroundColor: colors.surface,
    borderColor: 'rgba(48, 209, 88, 0.25)',
    borderWidth: 1,
    marginTop: spacing.sm,
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
    backgroundColor: colors.primaryMuted,
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
    color: colors.text,
    letterSpacing: -0.2,
  },
  ctaDescription: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
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
    backgroundColor: colors.surfaceRaised,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickNavText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.textSecondary,
    marginLeft: 5,
  },
  sectionHeader: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
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
    color: colors.text,
    letterSpacing: -0.2,
  },
  sampleSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sampleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoCard: {
    borderColor: 'rgba(10, 132, 255, 0.2)',
    backgroundColor: colors.surface,
    marginTop: spacing.xs,
    marginBottom: spacing.xxl,
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
    color: colors.text,
    marginBottom: 2,
  },
  infoDescription: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
