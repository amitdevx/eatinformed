import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  BookOpen,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Shield,
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { NovaBadge } from '../components/NovaBadge';
import { colors } from '../theme/colors';
import { borderRadius, spacing, typography } from '../theme/tokens';

const NOVA_GROUPS = [
  {
    group: 1,
    title: 'Unprocessed or Minimally Processed',
    color: colors.nova1,
    description:
      'Whole foods in their natural form or cleaned, chilled, ground, or dried without adding fat, sugar, or salt.',
    examples: ['Fresh fruits & vegetables', 'Whole grains & rolled oats', 'Plain non-fat milk & eggs', 'Raw nuts and legumes'],
    impact: 'Optimal nutrient density and highest health rating.',
  },
  {
    group: 2,
    title: 'Processed Culinary Ingredients',
    color: colors.nova2,
    description:
      'Substances extracted directly from nature used to season and cook Group 1 whole foods in culinary preparations.',
    examples: ['Olive oil & vegetable oils', 'Butter and ghee', 'Table sugar and pure honey', 'Iodized table salt'],
    impact: 'Safe when used in moderate cooking proportions.',
  },
  {
    group: 3,
    title: 'Processed Foods',
    color: colors.nova3,
    description:
      'Products made by adding Group 2 ingredients (salt, oil, sugar) to Group 1 foods to enhance taste or preservation.',
    examples: ['Canned vegetables in brine', 'Simple cheeses (mozzarella, cheddar)', 'Freshly baked bakery bread', 'Salted nuts and canned tuna'],
    impact: 'Healthy in balanced dietary patterns; watch sodium and sugar levels.',
  },
  {
    group: 4,
    title: 'Ultra-Processed Foods (UPFs)',
    color: colors.nova4,
    description:
      'Industrial formulations typically containing five or more ingredients including additives, emulsifiers, artificial flavors, and colors.',
    examples: ['Packaged sodas & energy drinks', 'Instant noodles & packaged chips', 'Mass-produced pre-packaged snacks', 'Processed reconstituted meat products'],
    impact: 'Linked to metabolic syndrome, higher inflammation, and cardiovascular risk.',
  },
];

export default function GuideScreen() {
  return (
    <Screen scrollable>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <BookOpen size={24} color={colors.primary} />
          <Text style={styles.title}>Food Safety Guide</Text>
        </View>
        <Text style={styles.subtitle}>
          Learn how to decipher ingredients, detect ultra-processed additives, and choose healthier foods.
        </Text>
      </View>

      {/* NOVA Section */}
      <Text style={styles.sectionHeading}>The NOVA Food System</Text>
      <Text style={styles.sectionSubtitle}>
        Developed by researchers at the University of Sao Paulo, the NOVA system classifies foods by the extent and purpose of industrial processing.
      </Text>

      {NOVA_GROUPS.map((item) => (
        <Card key={item.group} style={styles.novaCard}>
          <CardContent>
            <View style={styles.novaCardHeader}>
              <NovaBadge novaGroup={item.group} size="md" />
            </View>
            <Text style={styles.groupTitle}>{item.title}</Text>
            <Text style={styles.groupDescription}>{item.description}</Text>

            <View style={styles.examplesContainer}>
              <Text style={styles.examplesHeading}>Typical Examples:</Text>
              {item.examples.map((ex, i) => (
                <Text key={i} style={styles.exampleItem}>
                  - {ex}
                </Text>
              ))}
            </View>

            <View style={styles.impactBox}>
              <Text style={styles.impactText}>{item.impact}</Text>
            </View>
          </CardContent>
        </Card>
      ))}

      {/* Additives Guide */}
      <Text style={styles.sectionHeading}>Concerning Additives to Watch</Text>

      <Card style={styles.addonCard}>
        <CardHeader title="Emulsifiers (e.g. Polysorbate 80, CMC)" />
        <CardContent>
          <Text style={styles.addonText}>
            Used to stabilize processed textures and extend shelf-life. Scientific studies suggest excessive intake can alter the gut mucosal barrier and microbiome.
          </Text>
        </CardContent>
      </Card>

      <Card style={styles.addonCard}>
        <CardHeader title="High-Fructose Corn Syrup (HFCS)" />
        <CardContent>
          <Text style={styles.addonText}>
            Industrial liquid sweetener with rapid hepatic absorption, strongly linked to insulin resistance and non-alcoholic fatty liver disease.
          </Text>
        </CardContent>
      </Card>

      <Card style={styles.addonCard}>
        <CardHeader title="Artificial Colors (Red 40, Yellow 5)" />
        <CardContent>
          <Text style={styles.addonText}>
            Synthetic petroleum-derived colorants flagged in the EU for potential behavioral effects in sensitive children.
          </Text>
        </CardContent>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSizes.base,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  sectionHeading: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.base,
  },
  novaCard: {
    marginBottom: spacing.base,
    backgroundColor: colors.surfaceRaised,
  },
  novaCardHeader: {
    marginBottom: spacing.sm,
  },
  groupTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  groupDescription: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  examplesContainer: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  examplesHeading: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  exampleItem: {
    fontSize: typography.fontSizes.sm,
    color: colors.text,
    lineHeight: 20,
  },
  impactBox: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  impactText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.primary,
  },
  addonCard: {
    marginBottom: spacing.md,
  },
  addonText: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
