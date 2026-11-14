import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
} from 'react-native';
import {
  BookOpen,
  AlertTriangle,
  Search,
  X,
  ShieldAlert,
  ShieldCheck,
  FlaskConical,
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card, CardHeader, CardContent } from '../components/Card';
import { NovaBadge } from '../components/NovaBadge';
import { Badge } from '../components/Badge';
import { SegmentedControl } from '../components/SegmentedControl';
import { useTheme } from '../theme/ThemeContext';
import { getNovaColor } from '../theme/colors';
import { FadeInView, PressableScale } from '../theme/animations';
import { borderRadius, layout, spacing, typography } from '../theme/tokens';
import { ADDITIVE_DICTIONARY, AdditiveEntry } from '../lib/additive-dictionary';

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

type GuideTab = 'nova' | 'additives';

export default function GuideScreen() {
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<GuideTab>('nova');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // ponytail: instant offline filtering over compiled additive dictionary
  const filteredAdditives = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return ADDITIVE_DICTIONARY;
    return ADDITIVE_DICTIONARY.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.code && item.code.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q) ||
        item.foundIn.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const getRiskBadge = (risk: AdditiveEntry['riskLevel']) => {
    switch (risk) {
      case 'caution':
        return <Badge label="Caution / Limit" variant="danger" size="sm" />;
      case 'moderate':
        return <Badge label="Moderate" variant="warning" size="sm" />;
      case 'safe':
        return <Badge label="Generally Safe" variant="success" size="sm" />;
    }
  };

  return (
    <Screen scrollable>
      <FadeInView delay={0}>
        <ScreenHeader
          title="Food Safety Guide"
          subtitle="NOVA classification standards & offline clinical additive dictionary"
          largeTitle={true}
        />
      </FadeInView>

      {/* Segmented Tab Switcher */}
      <FadeInView delay={40} style={styles.segmentWrapper}>
        <SegmentedControl<GuideTab>
          options={[
            { value: 'nova', label: 'NOVA Groups (1–4)' },
            {
              value: 'additives',
              label: `Additive Dictionary (${ADDITIVE_DICTIONARY.length})`,
            },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />
      </FadeInView>

      {/* TAB 1: NOVA CLASSIFICATION */}
      {activeTab === 'nova' && (
        <FadeInView key="tab-nova" delay={60}>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Developed by epidemiologists at the University of Sao Paulo, NOVA categorizes foods into 4 groups by the extent and purpose of industrial processing.
          </Text>

          {NOVA_GROUPS.map((item, idx) => {
            const novaMeta = getNovaColor(item.group, !isDark);
            return (
              <FadeInView key={item.group} delay={80 + idx * 40}>
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
                    <Text
                      accessibilityRole="header"
                      style={[styles.groupTitle, { color: colors.text }]}
                    >
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
        </FadeInView>
      )}

      {/* TAB 2: OFFLINE ADDITIVE DICTIONARY */}
      {activeTab === 'additives' && (
        <FadeInView key="tab-additives" delay={60}>
          {/* Real-time offline search bar */}
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: colors.surfaceRaised,
                borderColor: colors.border,
              },
            ]}
          >
            <Search size={18} color={colors.textSecondary} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name, E-number (e.g. E407, Red 40)..."
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.text }]}
              returnKeyType="search"
              clearButtonMode="never"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <PressableScale
                onPress={() => setSearchQuery('')}
                scaleTo={0.9}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                style={styles.clearSearchButton}
              >
                <X size={15} color={colors.textSecondary} />
              </PressableScale>
            )}
          </View>

          <Text style={[styles.resultsCount, { color: colors.textMuted }]}>
            {filteredAdditives.length === 1
              ? '1 clinical entry found'
              : `${filteredAdditives.length} clinical entries found`}
          </Text>

          {filteredAdditives.map((item, idx) => (
            <FadeInView key={item.id} delay={40 + Math.min(idx * 30, 200)}>
              <Card style={styles.additiveCard}>
                <CardContent>
                  <View style={styles.additiveTopRow}>
                    <View style={styles.additiveTitleCol}>
                      {item.code ? (
                        <Text style={[styles.additiveCode, { color: colors.primary }]}>
                          {item.code}
                        </Text>
                      ) : null}
                      <Text
                        selectable={true}
                        accessibilityRole="header"
                        style={[styles.additiveName, { color: colors.text }]}
                      >
                        {item.name}
                      </Text>
                      <Text style={[styles.additiveCategory, { color: colors.textSecondary }]}>
                        {item.category}
                      </Text>
                    </View>
                    <View style={styles.badgeCol}>
                      {getRiskBadge(item.riskLevel)}
                    </View>
                  </View>

                  <Text
                    selectable={true}
                    style={[styles.additiveDescription, { color: colors.textSecondary }]}
                  >
                    {item.description}
                  </Text>

                  <View
                    style={[
                      styles.foundInBox,
                      {
                        backgroundColor: colors.surfaceRaised,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.foundInLabel, { color: colors.textMuted }]}>
                      COMMON SOURCES
                    </Text>
                    <Text style={[styles.foundInText, { color: colors.text }]}>
                      {item.foundIn}
                    </Text>
                  </View>
                </CardContent>
              </Card>
            </FadeInView>
          ))}
        </FadeInView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  segmentWrapper: {
    marginBottom: spacing.base,
  },
  sectionSubtitle: {
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.lineHeights.sm,
    marginBottom: spacing.base,
  },
  novaCard: {
    marginBottom: spacing.md,
  },
  novaCardHeader: {
    marginBottom: spacing.sm,
  },
  groupTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: -0.2,
    marginBottom: spacing.xs,
  },
  groupDescription: {
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.lineHeights.sm,
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
    letterSpacing: 0.7,
    marginBottom: spacing.xs + 2,
  },
  exampleItem: {
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.lineHeights.xs + 2,
    marginBottom: 2,
  },
  impactBox: {
    paddingTop: spacing.sm + 2,
    borderTopWidth: 1,
  },
  impactText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    lineHeight: typography.lineHeights.xs + 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    height: layout.minTouchTarget,
    marginBottom: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    marginLeft: spacing.sm,
    paddingVertical: 0,
  },
  clearSearchButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsCount: {
    fontSize: typography.fontSizes.caption2,
    marginBottom: spacing.md,
    marginLeft: 2,
  },
  additiveCard: {
    marginBottom: spacing.md,
  },
  additiveTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  additiveTitleCol: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  badgeCol: {
    alignItems: 'flex-end',
  },
  additiveCode: {
    fontSize: typography.fontSizes.caption2,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  additiveName: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: -0.2,
  },
  additiveCategory: {
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
  },
  additiveDescription: {
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.lineHeights.sm + 2,
    marginBottom: spacing.sm + 2,
  },
  foundInBox: {
    padding: spacing.sm + 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  foundInLabel: {
    fontSize: typography.fontSizes.caption2 - 1,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  foundInText: {
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.lineHeights.xs,
  },
});
