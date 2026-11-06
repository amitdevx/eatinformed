import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BookOpen, AlertTriangle } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Card, CardHeader, CardContent } from '../components/Card';
import { NovaBadge } from '../components/NovaBadge';
import { useTheme } from '../theme/ThemeContext';
import { getNovaColor } from '../theme/colors';
import { FadeInView } from '../theme/animations';
import { borderRadius, spacing, typography } from '../theme/tokens';

const NOVA_GROUPS = [
  {
    group: 1,
    title: 'Unprocessed or Minimally Processed',
    description:
      'Whole foods in their natural form or cleaned, chilled, ground, or fermented without adding industrial fats, sugars, or salt.',
    examples: [
      'Fresh fruits & leafy vegetables',
      'Whole grains & rolled oats',
      'Plain non-fat yogurt, milk & eggs',
      'Raw nuts, seeds, and legumes',
    ],
    impact: 'Optimal nutrient density, intact cellular matrix, and highest health score.',
  },
  {
    group: 2,
    title: 'Processed Culinary Ingredients',
    description:
      'Substances extracted directly from nature or Group 1 foods, used in kitchens to season and cook whole foods.',
    examples: [
      'Extra-virgin olive oil & cold-pressed oils',
      'Unsalted butter and traditional ghee',
      'Pure honey and maple syrup',
      'Iodized sea salt and culinary starches',
    ],
    impact: 'Safe and beneficial when used in moderate home-cooking proportions.',
  },
  {
    group: 3,
    title: 'Processed Foods',
    description:
      'Products made by adding Group 2 culinary ingredients (salt, oil, sugar) to Group 1 foods for preservation or palatability.',
    examples: [
      'Canned legumes or vegetables in brine',
      'Traditional cheeses (mozzarella, cheddar)',
      'Freshly baked sourdough or artisan bread',
      'Roasted salted nuts and canned fish',
    ],
    impact: 'Healthy in balanced dietary patterns; monitor sodium and added sugar.',
  },
  {
    group: 4,
    title: 'Ultra-Processed Foods (UPFs)',
    description:
      'Industrial formulations typically containing five or more ingredients including emulsifiers, artificial flavors, synthetic dyes, and preservatives.',
    examples: [
      'Carbonated sodas & sweetened energy drinks',
      'Instant flavored noodles & extruded chips',
      'Mass-produced packaged confectionery',
      'Reconstituted processed meat products',
    ],
    impact: 'Associated with metabolic disruption, gut barrier alteration, and overconsumption.',
  },
];

const ADDITIVES = [
  {
    title: 'Emulsifiers (Polysorbate 80, CMC, Carrageenan)',
    category: 'Texture Stabilizers',
    detail:
      'Used to blend immiscible liquids and extend shelf life. Clinical and preclinical studies suggest high intake can alter gut mucosal barriers and microbiome diversity.',
  },
  {
    title: 'High-Fructose Corn Syrup (HFCS) & Maltodextrin',
    category: 'Industrial Sweeteners & Fillers',
    detail:
      'Rapidly absorbed refined carbohydrates with high glycemic load, strongly linked to hepatic de novo lipogenesis, insulin resistance, and elevated triglycerides.',
  },
  {
    title: 'Synthetic Azo Dyes (Red 40, Yellow 5, Yellow 6)',
    category: 'Cosmetic Colorants',
    detail:
      'Petroleum-derived synthetic colorings used strictly for visual appeal and flagged by international food safety authorities for neurobehavioral sensitivity in children.',
  },
];

export default function GuideScreen() {
  const { colors, isDark } = useTheme();

  return (
    <Screen scrollable>
      <FadeInView delay={0} style={styles.header}>
        <View style={styles.titleRow}>
          <View
            style={[
              styles.iconBadge,
              {
                backgroundColor: colors.primaryMuted,
                borderColor: colors.primaryBorder,
              },
            ]}
          >
            <BookOpen size={20} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            Food Safety Guide
          </Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Learn how to decipher food labels, identify ultra-processed additives, and choose nutrient-dense whole foods.
        </Text>
      </FadeInView>

      {/* NOVA Section */}
      <FadeInView delay={50}>
        <Text style={[styles.sectionHeading, { color: colors.text }]}>
          The NOVA Classification
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          Developed by nutrition researchers at the University of Sao Paulo, NOVA categorizes foods into 4 groups by the extent and purpose of processing.
        </Text>
      </FadeInView>

      {NOVA_GROUPS.map((item, idx) => {
        const novaMeta = getNovaColor(item.group, !isDark);
        return (
          <FadeInView key={item.group} delay={90 + idx * 50}>
            <Card
              style={[
                styles.novaCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <CardContent>
                <View style={styles.novaCardHeader}>
                  <NovaBadge novaGroup={item.group} size="md" />
                </View>
                <Text style={[styles.groupTitle, { color: colors.text }]}>
                  {item.title}
                </Text>
                <Text
                  style={[
                    styles.groupDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  {item.description}
                </Text>

                <View
                  style={[
                    styles.examplesContainer,
                    {
                      backgroundColor: colors.surfaceRaised,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.examplesHeading,
                      { color: colors.textSecondary },
                    ]}
                  >
                    TYPICAL EXAMPLES
                  </Text>
                  {item.examples.map((ex, i) => (
                    <Text
                      key={i}
                      style={[styles.exampleItem, { color: colors.text }]}
                    >
                      • {ex}
                    </Text>
                  ))}
                </View>

                <View
                  style={[
                    styles.impactBox,
                    { borderTopColor: colors.separator },
                  ]}
                >
                  <Text style={[styles.impactText, { color: novaMeta.text }]}>
                    {item.impact}
                  </Text>
                </View>
              </CardContent>
            </Card>
          </FadeInView>
        );
      })}

      {/* Additives Guide */}
      <FadeInView delay={300}>
        <Text style={[styles.sectionHeading, { color: colors.text }]}>
          Concerning Additives to Watch
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          Industrial compounds frequently flagged during EatInformed label screening.
        </Text>
      </FadeInView>

      {ADDITIVES.map((addon, idx) => (
        <FadeInView key={idx} delay={340 + idx * 50}>
          <Card style={styles.addonCard}>
            <CardHeader
              title={addon.title}
              subtitle={addon.category}
              rightElement={<AlertTriangle size={18} color={colors.warningText} />}
            />
            <CardContent>
              <Text style={[styles.addonText, { color: colors.textSecondary }]}>
                {addon.detail}
              </Text>
            </CardContent>
          </Card>
        </FadeInView>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.base,
    paddingBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs + 2,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
  },
  title: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.black,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: typography.fontSizes.subhead,
    lineHeight: typography.lineHeights.subhead,
  },
  sectionHeading: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: -0.4,
    marginTop: spacing.md,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.lineHeights.sm,
    marginBottom: spacing.base,
  },
  novaCard: {
    marginBottom: spacing.base,
  },
  novaCardHeader: {
    marginBottom: spacing.sm,
  },
  groupTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: typography.fontSizes.subhead,
    lineHeight: typography.lineHeights.subhead,
    marginBottom: spacing.md,
  },
  examplesContainer: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  examplesHeading: {
    fontSize: typography.fontSizes.caption2,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  exampleItem: {
    fontSize: typography.fontSizes.sm,
    lineHeight: 20,
  },
  impactBox: {
    paddingTop: spacing.sm + 2,
    borderTopWidth: 1,
  },
  impactText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    lineHeight: 17,
  },
  addonCard: {
    marginBottom: spacing.md,
  },
  addonText: {
    fontSize: typography.fontSizes.subhead,
    lineHeight: typography.lineHeights.subhead,
  },
});
