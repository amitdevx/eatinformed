import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScanLine, Sparkles, ArrowRight, ShieldCheck, Zap, BookOpen, History, User } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
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
      {/* Brand Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Sparkles size={18} color={colors.primary} />
          </View>
          <Text style={styles.brandName}>EatInformed</Text>
        </View>
        <Text style={styles.heroTitle}>
          Transform Your Nutrition with{' '}
          <Text style={styles.heroHighlight}>AI Power</Text>
        </Text>
        <Text style={styles.heroSubtitle}>
          Scan any ingredient list or nutrition facts panel for instant food safety,
          NOVA classification, and health assessment.
        </Text>
      </View>

      {/* Main Scan Action Card */}
      <Card style={styles.ctaCard}>
        <CardContent>
          <View style={styles.ctaIconContainer}>
            <ScanLine size={32} color={colors.primary} />
          </View>
          <Text style={styles.ctaTitle}>Ready to Check a Product?</Text>
          <Text style={styles.ctaDescription}>
            Point your camera at a food label or pick an image from your photo gallery.
          </Text>
          <Button
            title="Scan Food Label"
            onPress={handleStartScan}
            variant="primary"
            size="lg"
            icon={<ScanLine size={20} color="#000000" />}
            style={styles.ctaButton}
          />
          <View style={styles.quickNavRow}>
            <TouchableOpacity
              style={styles.quickNavButton}
              onPress={handleOpenHistory}
              activeOpacity={0.8}
            >
              <History size={16} color={colors.textSecondary} />
              <Text style={styles.quickNavText}>History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickNavButton}
              onPress={handleOpenGuide}
              activeOpacity={0.8}
            >
              <BookOpen size={16} color={colors.textSecondary} />
              <Text style={styles.quickNavText}>Guide</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickNavButton}
              onPress={handleOpenProfile}
              activeOpacity={0.8}
            >
              <User size={16} color={colors.textSecondary} />
              <Text style={styles.quickNavText}>Account</Text>
            </TouchableOpacity>
          </View>
        </CardContent>
      </Card>

      {/* Demo Samples Section */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Try Sample Products</Text>
          <Text style={styles.sectionSubtitle}>
            Instant analysis examples without taking a photo
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
            <ArrowRight size={18} color={colors.textSecondary} />
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
              <BookOpen size={24} color={colors.info} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Understand NOVA Groups</Text>
              <Text style={styles.infoDescription}>
                Learn how ultra-processed foods impact long-term health and how to identify clean whole foods.
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
    paddingVertical: spacing.lg,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  brandName: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: typography.fontSizes.xxxl,
    fontWeight: typography.fontWeights.black,
    color: colors.text,
    lineHeight: 40,
    marginBottom: spacing.sm,
  },
  heroHighlight: {
    color: colors.primary,
  },
  heroSubtitle: {
    fontSize: typography.fontSizes.base,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  ctaCard: {
    backgroundColor: colors.surfaceRaised,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderWidth: 1.5,
    marginTop: spacing.sm,
  },
  ctaIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  ctaTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  ctaDescription: {
    fontSize: typography.fontSizes.base,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.base,
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
    backgroundColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickNavText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  sectionHeader: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: typography.fontSizes.sm,
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
    marginBottom: spacing.md,
  },
  sampleInfo: {
    flex: 1,
  },
  sampleTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
  },
  sampleSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sampleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoCard: {
    borderColor: 'rgba(59, 130, 246, 0.3)',
    backgroundColor: colors.surfaceRaised,
    marginTop: spacing.sm,
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
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
