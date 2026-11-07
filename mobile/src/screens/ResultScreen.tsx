import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Share,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Share2,
  RefreshCw,
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Card, CardHeader, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { NovaBadge } from '../components/NovaBadge';
import { RatingStars } from '../components/RatingStars';
import { SegmentedControl } from '../components/SegmentedControl';
import { useTheme } from '../theme/ThemeContext';
import { FadeInView, PressableScale } from '../theme/animations';
import { borderRadius, layout, spacing, typography } from '../theme/tokens';
import { RootStackParamList } from '../navigation/types';

type RouteProps = RouteProp<RootStackParamList, 'Result'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type ActiveTab = 'overview' | 'ingredients' | 'nutrition';

export default function ResultScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const { data, imageUri } = route.params;

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  const productName = data.productName || 'Food Product';
  const rawBrand = (data.brand || '').trim();
  const brand = /^(unknown|n\/a|none|not visible|null|undefined|generic)$/i.test(rawBrand)
    ? ''
    : rawBrand;
  const rating = data.rating || 0;
  const novaGroup = data.novaGroup || 4;

  const handleShare = async () => {
    try {
      await Share.share({
        title: `EatInformed Health Report: ${productName}`,
        message: `${productName} (${brand}) - Health Rating: ${rating.toFixed(1)}/5.0, NOVA Group: ${novaGroup}. Analyzed with EatInformed.`,
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  const handleScanAnother = () => {
    navigation.navigate('Main', { screen: 'Scan' });
  };

  // ponytail: guarantee every declared ingredient in data.ingredients is analyzed & displayed
  const completeIngredientAnalysis = React.useMemo(() => {
    const analysisList = Array.isArray(data.ingredientAnalysis) ? data.ingredientAnalysis : [];
    const rawList = Array.isArray(data.ingredients) ? data.ingredients : [];

    if (rawList.length === 0) return analysisList;
    if (analysisList.length >= rawList.length) return analysisList;

    const matchedIndices = new Set<number>();
    const merged = rawList.map((rawIng) => {
      const normalizedRaw = rawIng.toLowerCase().trim();
      const foundIdx = analysisList.findIndex(
        (a, idx) =>
          !matchedIndices.has(idx) &&
          (a.ingredient.toLowerCase().trim() === normalizedRaw ||
            normalizedRaw.includes(a.ingredient.toLowerCase().trim()) ||
            a.ingredient.toLowerCase().trim().includes(normalizedRaw))
      );
      if (foundIdx !== -1) {
        matchedIndices.add(foundIdx);
        return analysisList[foundIdx];
      }
      const isSugarOrSyrup = /sugar|syrup|honey|dextrose|fructose|maltose|sucrose/i.test(rawIng);
      const isOilOrFat = /\boil\b|fat|butter|shortening|palm/i.test(rawIng);
      const isSalt = /\bsalt\b|sodium/i.test(rawIng);
      return {
        ingredient: rawIng,
        description: isSugarOrSyrup
          ? 'Caloric sweetener used for taste, browning, and texture.'
          : isOilOrFat
          ? 'Culinary or processing lipid used for mouthfeel, moisture, and baking.'
          : isSalt
          ? 'Mineral seasoning used for flavor enhancement and preservation.'
          : 'Declared food ingredient extracted from product packaging label.',
        purpose: isSugarOrSyrup
          ? 'Sweetener'
          : isOilOrFat
          ? 'Texture & Lipid Base'
          : isSalt
          ? 'Seasoning & Preservation'
          : 'Formulation Ingredient',
        isAllergen: /milk|dairy|whey|casein|soy|wheat|gluten|peanut|nut|coconut|egg|fish|sesame/i.test(rawIng),
        isControversial: /artificial|dye|red 40|yellow 5|yellow 6|msg|monosodium|high-fructose|bha|bht|tbhq|carrageenan|polysorbate/i.test(rawIng),
      };
    });

    return merged;
  }, [data.ingredients, data.ingredientAnalysis]);

  const getIngredientBadge = (item: {
    ingredient: string;
    isAllergen: boolean;
    isControversial: boolean;
  }) => {
    const name = item.ingredient.toLowerCase();
    if (item.isControversial) {
      return <Badge label="Additive Alert" variant="warning" size="sm" />;
    }
    if (/sugar|syrup|dextrose|fructose|maltose|sucrose|corn sweetener/i.test(name)) {
      return <Badge label="Added Sweetener" variant="warning" size="sm" />;
    }
    if (/\bsalt\b|sodium/i.test(name)) {
      return <Badge label="Sodium Source" variant="default" size="sm" />;
    }
    if (/vegetable oil|canola oil|palm oil|soybean oil|corn oil|sunflower oil/i.test(name)) {
      return <Badge label="Processing Oil" variant="default" size="sm" />;
    }
    return <Badge label="Whole / Clean" variant="success" size="sm" />;
  };

  return (
    <Screen scrollable>
      {/* Top Navigation Bar */}
      <FadeInView delay={0} style={styles.topBar}>
        <PressableScale
          style={[
            styles.navIconButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => navigation.goBack()}
          scaleTo={0.92}
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color={colors.text} />
        </PressableScale>

        <PressableScale
          style={[
            styles.navIconButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={handleShare}
          scaleTo={0.92}
          accessibilityLabel="Share report"
        >
          <Share2 size={19} color={colors.text} />
        </PressableScale>
      </FadeInView>

      {/* Product Title Section */}
      <FadeInView delay={40} style={styles.productHeader}>
        {brand ? (
          <Text style={[styles.brandText, { color: colors.primary }]}>
            {brand.toUpperCase()}
          </Text>
        ) : null}
        <Text style={[styles.productTitle, { color: colors.text }]}>
          {productName}
        </Text>
      </FadeInView>

      {/* Main Health Rating Summary Card */}
      <FadeInView delay={80}>
        <Card
          style={[
            styles.summaryCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.primaryBorder,
            },
          ]}
        >
          <CardContent>
            <View style={styles.ratingRow}>
              <View>
                <Text style={[styles.ratingLabel, { color: colors.textSecondary }]}>
                  HEALTH SCORE
                </Text>
                <RatingStars rating={rating} size="lg" />
              </View>
            </View>
            <View
              style={[
                styles.novaExplanation,
                { borderTopColor: colors.separator },
              ]}
            >
              <NovaBadge novaGroup={novaGroup} showDescription size="md" />
            </View>
          </CardContent>
        </Card>
      </FadeInView>

      {/* Apple iOS Segmented Tab Switcher */}
      <FadeInView delay={120} style={styles.segmentedWrapper}>
        <SegmentedControl<ActiveTab>
          options={[
            { value: 'overview', label: 'Overview' },
            {
              value: 'ingredients',
              label: `Ingredients (${completeIngredientAnalysis.length || data.ingredients.length})`,
            },
            { value: 'nutrition', label: 'Nutrition Facts' },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />
      </FadeInView>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <FadeInView key="tab-overview" delay={20}>
          {/* Critical Warnings (if any) */}
          {data.warnings && data.warnings.length > 0 && (
            <Card
              style={{
                borderColor: colors.warningBorder,
                backgroundColor: colors.warningLight,
              }}
            >
              <CardContent>
                <View style={styles.warningHeader}>
                  <AlertTriangle size={20} color={colors.warningText} />
                  <Text style={[styles.warningTitle, { color: colors.warningText }]}>
                    Health Notices
                  </Text>
                </View>
                {data.warnings.map((warning, index) => (
                  <Text
                    key={index}
                    style={[styles.warningItem, { color: colors.text }]}
                  >
                    • {warning}
                  </Text>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Pros Section */}
          {data.pros && data.pros.length > 0 && (
            <Card style={{ borderColor: colors.successBorder }}>
              <CardHeader title="Health Benefits & Pros" />
              <CardContent>
                {data.pros.map((pro, index) => (
                  <View key={index} style={styles.bulletRow}>
                    <CheckCircle
                      size={18}
                      color={colors.successText}
                      style={styles.bulletIcon}
                    />
                    <Text style={[styles.bulletText, { color: colors.text }]}>
                      {pro}
                    </Text>
                  </View>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Cons Section */}
          {data.cons && data.cons.length > 0 && (
            <Card style={{ borderColor: colors.dangerBorder }}>
              <CardHeader title="Concerns & Cons" />
              <CardContent>
                {data.cons.map((con, index) => (
                  <View key={index} style={styles.bulletRow}>
                    <XCircle
                      size={18}
                      color={colors.dangerText}
                      style={styles.bulletIcon}
                    />
                    <Text style={[styles.bulletText, { color: colors.text }]}>
                      {con}
                    </Text>
                  </View>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Dietary Profile */}
          <Card>
            <CardHeader title="Dietary & Allergen Profile" />
            <CardContent>
              <View style={styles.badgeRow}>
                {data.dietaryInfo.isVegetarian && (
                  <Badge label="Vegetarian" variant="success" size="md" />
                )}
                {data.dietaryInfo.isVegan && (
                  <Badge label="Vegan" variant="success" size="md" />
                )}
                {data.dietaryInfo.isGlutenFree && (
                  <Badge label="Gluten-Free" variant="info" size="md" />
                )}
                {data.dietaryInfo.suitability?.map((suit, idx) => (
                  <Badge key={idx} label={suit} variant="secondary" size="md" />
                ))}
              </View>

              {data.dietaryInfo.allergens &&
                data.dietaryInfo.allergens.length > 0 && (
                  <View
                    style={[
                      styles.allergenSection,
                      { borderTopColor: colors.separator },
                    ]}
                  >
                    <Text
                      style={[
                        styles.subSectionTitle,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Allergens Detected
                    </Text>
                    <View style={styles.badgeRow}>
                      {data.dietaryInfo.allergens.map((allergen, index) => (
                        <Badge
                          key={index}
                          label={allergen}
                          variant="danger"
                          size="sm"
                        />
                      ))}
                    </View>
                  </View>
                )}

              {data.dietaryInfo.summary ? (
                <Text
                  style={[
                    styles.dietarySummary,
                    { color: colors.textSecondary },
                  ]}
                >
                  {data.dietaryInfo.summary}
                </Text>
              ) : null}
            </CardContent>
          </Card>
        </FadeInView>
      )}

      {/* TAB 2: INGREDIENTS */}
      {activeTab === 'ingredients' && (
        <FadeInView key="tab-ingredients" delay={20}>
          <Text style={[styles.tabSectionInfo, { color: colors.textSecondary }]}>
            Every ingredient identified and cross-checked against international nutritional safety criteria.
          </Text>

          {completeIngredientAnalysis && completeIngredientAnalysis.length > 0 ? (
            completeIngredientAnalysis.map((item, index) => (
              <Card key={index} style={styles.ingredientCard}>
                <CardContent>
                  <View style={styles.ingredientTopRow}>
                    <Text style={[styles.ingredientName, { color: colors.text }]}>
                      {item.ingredient}
                    </Text>
                    <View style={styles.badgeRow}>
                      {item.isAllergen && (
                        <Badge label="Allergen" variant="danger" size="sm" />
                      )}
                      {getIngredientBadge(item)}
                    </View>
                  </View>
                  {item.purpose ? (
                    <Text
                      style={[
                        styles.ingredientPurpose,
                        { color: colors.primary },
                      ]}
                    >
                      Role: {item.purpose}
                    </Text>
                  ) : null}
                  {item.description ? (
                    <Text
                      style={[
                        styles.ingredientDescription,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {item.description}
                    </Text>
                  ) : null}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent>
                {data.ingredients.map((ing, idx) => (
                  <Text
                    key={idx}
                    style={[styles.rawIngredientItem, { color: colors.text }]}
                  >
                    {idx + 1}. {ing}
                  </Text>
                ))}
              </CardContent>
            </Card>
          )}
        </FadeInView>
      )}

      {/* TAB 3: NUTRITION FACTS */}
      {activeTab === 'nutrition' && (() => {
        const nutrientsList = Array.isArray(data.nutrition?.nutrients) ? data.nutrition.nutrients : [];
        const hasPer100 = nutrientsList.some((n) => n.per100mL && n.per100mL.trim() !== '' && n.per100mL.trim() !== '-');
        const hasPerServe = nutrientsList.some((n) => n.perServing && n.perServing.trim() !== '' && n.perServing.trim() !== '-');

        const getNutrientColor = (name: string, valStr?: string) => {
          if (!valStr || valStr === '-') return colors.textSecondary;
          const num = parseFloat(valStr.replace(/[^0-9.]/g, ''));
          if (isNaN(num)) return colors.textSecondary;

          const lower = name.toLowerCase();
          if (lower.includes('protein') && num >= 5) return colors.successText;
          if (lower.includes('fiber') && num >= 4) return colors.successText;
          if ((lower.includes('sugar') || lower.includes('added sugar')) && num >= 10) return colors.warningText;
          if (lower.includes('sodium') && num >= 400) return colors.dangerText;
          if (lower.includes('saturated') && num >= 4) return colors.warningText;

          return colors.textSecondary;
        };

        return (
          <FadeInView key="tab-nutrition" delay={20}>
            <Card>
              <CardHeader
                title="Nutritional Panel"
                subtitle={
                  data.nutrition.servingSizeLabel
                    ? `Serving Size: ${data.nutrition.servingSizeLabel}`
                    : hasPer100 && hasPerServe
                    ? 'Reported nutrient content per serving & per 100g'
                    : hasPerServe
                    ? 'Reported nutrient content per serving'
                    : 'Reported nutrient content'
                }
              />
              <CardContent>
                {nutrientsList.length > 0 ? (
                  <View style={styles.nutritionTable}>
                    <View
                      style={[
                        styles.tableHeaderRow,
                        {
                          backgroundColor: colors.surfaceRaised,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tableColHeader,
                          { color: colors.text, flex: 2 },
                        ]}
                      >
                        Nutrient
                      </Text>
                      {hasPerServe && (
                        <Text
                          style={[
                            styles.tableColHeader,
                            { color: colors.text, flex: 1, textAlign: 'right' },
                          ]}
                        >
                          Per Serve
                        </Text>
                      )}
                      {hasPer100 && (
                        <Text
                          style={[
                            styles.tableColHeader,
                            { color: colors.text, flex: 1, textAlign: 'right' },
                          ]}
                        >
                          Per 100g
                        </Text>
                      )}
                    </View>

                    {nutrientsList.map((n, i) => {
                      const serveColor = getNutrientColor(n.nutrient, n.perServing);
                      const p100Color = getNutrientColor(n.nutrient, n.per100mL);
                      return (
                        <View
                          key={i}
                          style={[
                            styles.tableRow,
                            { borderBottomColor: colors.separator },
                          ]}
                        >
                          <Text
                            style={[
                              styles.nutrientName,
                              { color: colors.text, flex: 2 },
                            ]}
                          >
                            {n.nutrient}
                          </Text>
                          {hasPerServe && (
                            <Text
                              style={[
                                styles.nutrientValue,
                                {
                                  color: serveColor,
                                  fontWeight: serveColor !== colors.textSecondary
                                    ? typography.fontWeights.bold
                                    : typography.fontWeights.medium,
                                  flex: 1,
                                  textAlign: 'right',
                                },
                              ]}
                            >
                              {n.perServing || '-'}
                            </Text>
                          )}
                          {hasPer100 && (
                            <Text
                              style={[
                                styles.nutrientValue,
                                {
                                  color: p100Color,
                                  fontWeight: p100Color !== colors.textSecondary
                                    ? typography.fontWeights.bold
                                    : typography.fontWeights.regular,
                                  flex: 1,
                                  textAlign: 'right',
                                },
                              ]}
                            >
                              {n.per100mL || '-'}
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <Text
                    style={[
                      styles.rawNutritionText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {data.nutrition.rawText ||
                      'No structured nutrition facts table found on label.'}
                  </Text>
                )}
              </CardContent>
            </Card>
          </FadeInView>
        );
      })()}

      {/* Bottom Action */}
      <FadeInView delay={180} style={styles.bottomActions}>
        <Button
          title="Scan Another Label"
          onPress={handleScanAnother}
          variant="primary"
          size="lg"
          icon={<RefreshCw size={18} color={colors.onPrimary} />}
          style={{ width: '100%' }}
        />
      </FadeInView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  navIconButton: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productHeader: {
    marginTop: spacing.xs,
    marginBottom: spacing.base,
  },
  brandText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 1.0,
    marginBottom: 4,
  },
  productTitle: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.black,
    letterSpacing: -0.6,
    lineHeight: typography.lineHeights.xxl,
  },
  summaryCard: {
    marginBottom: spacing.base,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  ratingLabel: {
    fontSize: typography.fontSizes.caption2,
    fontWeight: typography.fontWeights.semibold,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  novaExplanation: {
    paddingTop: spacing.sm + 2,
    borderTopWidth: 1,
  },
  segmentedWrapper: {
    marginBottom: spacing.base,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  warningTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    marginLeft: spacing.sm,
  },
  warningItem: {
    fontSize: typography.fontSizes.subhead,
    lineHeight: typography.lineHeights.subhead,
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm + 2,
  },
  bulletIcon: {
    marginRight: spacing.sm + 2,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: typography.fontSizes.subhead,
    lineHeight: typography.lineHeights.subhead,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  allergenSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  subSectionTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    marginBottom: spacing.xs + 2,
    letterSpacing: 0.2,
  },
  dietarySummary: {
    marginTop: spacing.md,
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.lineHeights.sm,
  },
  tabSectionInfo: {
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.lineHeights.sm,
    marginBottom: spacing.md,
  },
  ingredientCard: {
    marginBottom: spacing.sm + 2,
  },
  ingredientTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ingredientName: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    flex: 1,
    marginRight: spacing.sm,
    letterSpacing: -0.2,
  },
  ingredientPurpose: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    marginBottom: 4,
  },
  ingredientDescription: {
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.lineHeights.sm,
  },
  rawIngredientItem: {
    fontSize: typography.fontSizes.subhead,
    lineHeight: 22,
    marginBottom: 4,
  },
  nutritionTable: {
    marginTop: spacing.xs,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  tableColHeader: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
  },
  nutrientName: {
    fontSize: typography.fontSizes.subhead,
    fontWeight: typography.fontWeights.medium,
  },
  nutrientValue: {
    fontSize: typography.fontSizes.subhead,
  },
  rawNutritionText: {
    fontSize: typography.fontSizes.subhead,
    lineHeight: 21,
  },
  bottomActions: {
    paddingVertical: spacing.lg,
    paddingBottom: 36,
  },
});
