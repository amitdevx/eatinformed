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
import { saveScanToHistory } from '../lib/history';
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

  useEffect(() => {
    if (data && data.status === 'success') {
      saveScanToHistory(data, imageUri);
    }
  }, [data, imageUri]);

  const productName = data.productName || 'Food Product';
  const brand = data.brand || '';
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
    navigation.goBack();
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
              <NovaBadge novaGroup={novaGroup} size="md" />
            </View>
            <View
              style={[
                styles.novaExplanation,
                { borderTopColor: colors.separator },
              ]}
            >
              <NovaBadge novaGroup={novaGroup} showDescription size="sm" />
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
              label: `Ingredients (${data.ingredients.length})`,
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

          {data.ingredientAnalysis && data.ingredientAnalysis.length > 0 ? (
            data.ingredientAnalysis.map((item, index) => (
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
                      {item.isControversial && (
                        <Badge label="Additive Alert" variant="warning" size="sm" />
                      )}
                      {!item.isAllergen && !item.isControversial && (
                        <Badge label="Clean" variant="success" size="sm" />
                      )}
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
      {activeTab === 'nutrition' && (
        <FadeInView key="tab-nutrition" delay={20}>
          <Card>
            <CardHeader
              title="Nutritional Panel"
              subtitle={
                data.nutrition.servingSizeLabel
                  ? `Serving Size: ${data.nutrition.servingSizeLabel}`
                  : 'Reported nutrient content per serving & per 100g'
              }
            />
            <CardContent>
              {data.nutrition.nutrients && data.nutrition.nutrients.length > 0 ? (
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
                    <Text
                      style={[
                        styles.tableColHeader,
                        { color: colors.text, flex: 1, textAlign: 'right' },
                      ]}
                    >
                      Per Serve
                    </Text>
                    <Text
                      style={[
                        styles.tableColHeader,
                        { color: colors.text, flex: 1, textAlign: 'right' },
                      ]}
                    >
                      Per 100g
                    </Text>
                  </View>

                  {data.nutrition.nutrients.map((n, i) => {
                    const isProtein = /protein/i.test(n.nutrient);
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
                        <Text
                          style={[
                            styles.nutrientValue,
                            {
                              color: isProtein
                                ? colors.successText
                                : colors.textSecondary,
                              fontWeight: isProtein
                                ? typography.fontWeights.bold
                                : typography.fontWeights.medium,
                              flex: 1,
                              textAlign: 'right',
                            },
                          ]}
                        >
                          {n.perServing || '-'}
                        </Text>
                        <Text
                          style={[
                            styles.nutrientValue,
                            {
                              color: isProtein
                                ? colors.successText
                                : colors.textSecondary,
                              fontWeight: isProtein
                                ? typography.fontWeights.bold
                                : typography.fontWeights.regular,
                              flex: 1,
                              textAlign: 'right',
                            },
                          ]}
                        >
                          {n.per100mL || '-'}
                        </Text>
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
      )}

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
