import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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
  Check,
  Shield,
  Layers,
  Utensils,
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { NovaBadge } from '../components/NovaBadge';
import { RatingStars } from '../components/RatingStars';
import { colors } from '../theme/colors';
import { borderRadius, spacing, typography } from '../theme/tokens';
import { RootStackParamList } from '../navigation/types';

type RouteProps = RouteProp<RootStackParamList, 'Result'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type ActiveTab = 'overview' | 'ingredients' | 'nutrition';

export default function ResultScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { data } = route.params;

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

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
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.8}
        >
          <Share2 size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Product Title Section */}
      <View style={styles.productHeader}>
        {brand ? <Text style={styles.brandText}>{brand.toUpperCase()}</Text> : null}
        <Text style={styles.productTitle}>{productName}</Text>
      </View>

      {/* Main Health Rating Card */}
      <Card style={styles.summaryCard}>
        <CardContent>
          <View style={styles.ratingRow}>
            <View>
              <Text style={styles.ratingLabel}>Health Rating</Text>
              <RatingStars rating={rating} size="lg" />
            </View>
            <NovaBadge novaGroup={novaGroup} size="md" />
          </View>
          <View style={styles.novaExplanation}>
            <NovaBadge novaGroup={novaGroup} showDescription size="sm" />
          </View>
        </CardContent>
      </Card>

      {/* Navigation Tabs (Overview / Ingredients / Nutrition) */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'overview' && styles.tabButtonActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'ingredients' && styles.tabButtonActive]}
          onPress={() => setActiveTab('ingredients')}
        >
          <Text style={[styles.tabText, activeTab === 'ingredients' && styles.tabTextActive]}>
            Ingredients ({data.ingredients.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'nutrition' && styles.tabButtonActive]}
          onPress={() => setActiveTab('nutrition')}
        >
          <Text style={[styles.tabText, activeTab === 'nutrition' && styles.tabTextActive]}>
            Nutrition Facts
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <View>
          {/* Critical Warnings (if any) */}
          {data.warnings && data.warnings.length > 0 && (
            <Card style={styles.warningCard}>
              <CardContent>
                <View style={styles.warningHeader}>
                  <AlertTriangle size={20} color={colors.warning} />
                  <Text style={styles.warningTitle}>Health Notices</Text>
                </View>
                {data.warnings.map((warning, index) => (
                  <Text key={index} style={styles.warningItem}>
                    {warning}
                  </Text>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Pros Section */}
          {data.pros && data.pros.length > 0 && (
            <Card style={styles.prosCard}>
              <CardHeader title="Health Benefits & Pros" />
              <CardContent>
                {data.pros.map((pro, index) => (
                  <View key={index} style={styles.bulletRow}>
                    <CheckCircle size={18} color={colors.success} style={styles.bulletIcon} />
                    <Text style={styles.bulletText}>{pro}</Text>
                  </View>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Cons Section */}
          {data.cons && data.cons.length > 0 && (
            <Card style={styles.consCard}>
              <CardHeader title="Concerns & Cons" />
              <CardContent>
                {data.cons.map((con, index) => (
                  <View key={index} style={styles.bulletRow}>
                    <XCircle size={18} color={colors.danger} style={styles.bulletIcon} />
                    <Text style={styles.bulletText}>{con}</Text>
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

              {data.dietaryInfo.allergens && data.dietaryInfo.allergens.length > 0 && (
                <View style={styles.allergenSection}>
                  <Text style={styles.subSectionTitle}>Allergens Detected:</Text>
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
                <Text style={styles.dietarySummary}>
                  {data.dietaryInfo.summary}
                </Text>
              ) : null}
            </CardContent>
          </Card>
        </View>
      )}

      {/* TAB 2: INGREDIENTS */}
      {activeTab === 'ingredients' && (
        <View>
          <Text style={styles.tabSectionInfo}>
            Every ingredient identified and cross-checked against nutritional safety criteria.
          </Text>

          {data.ingredientAnalysis && data.ingredientAnalysis.length > 0 ? (
            data.ingredientAnalysis.map((item, index) => (
              <Card key={index} style={styles.ingredientCard}>
                <CardContent>
                  <View style={styles.ingredientTopRow}>
                    <Text style={styles.ingredientName}>{item.ingredient}</Text>
                    <View style={styles.badgeRow}>
                      {item.isAllergen && (
                        <Badge label="Allergen" variant="danger" size="sm" />
                      )}
                      {item.isControversial && (
                        <Badge label="Controversial" variant="warning" size="sm" />
                      )}
                    </View>
                  </View>
                  {item.purpose ? (
                    <Text style={styles.ingredientPurpose}>Purpose: {item.purpose}</Text>
                  ) : null}
                  {item.description ? (
                    <Text style={styles.ingredientDescription}>{item.description}</Text>
                  ) : null}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent>
                {data.ingredients.map((ing, idx) => (
                  <Text key={idx} style={styles.rawIngredientItem}>
                    {idx + 1}. {ing}
                  </Text>
                ))}
              </CardContent>
            </Card>
          )}
        </View>
      )}

      {/* TAB 3: NUTRITION FACTS */}
      {activeTab === 'nutrition' && (
        <View>
          <Card>
            <CardHeader
              title="Nutritional Panel"
              subtitle={
                data.nutrition.servingSizeLabel
                  ? `Serving Size: ${data.nutrition.servingSizeLabel}`
                  : 'Reported nutrient content'
              }
            />
            <CardContent>
              {data.nutrition.nutrients && data.nutrition.nutrients.length > 0 ? (
                <View style={styles.nutritionTable}>
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.tableColHeader, { flex: 2 }]}>Nutrient</Text>
                    <Text style={[styles.tableColHeader, { flex: 1, textAlign: 'right' }]}>
                      Per Serve
                    </Text>
                    <Text style={[styles.tableColHeader, { flex: 1, textAlign: 'right' }]}>
                      Per 100g
                    </Text>
                  </View>

                  {data.nutrition.nutrients.map((n, i) => (
                    <View key={i} style={styles.tableRow}>
                      <Text style={[styles.nutrientName, { flex: 2 }]}>{n.nutrient}</Text>
                      <Text style={[styles.nutrientValue, { flex: 1, textAlign: 'right' }]}>
                        {n.perServing || '-'}
                      </Text>
                      <Text style={[styles.nutrientValue, { flex: 1, textAlign: 'right' }]}>
                        {n.per100mL || '-'}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.rawNutritionText}>
                  {data.nutrition.rawText || 'No structured nutrition facts table found on label.'}
                </Text>
              )}
            </CardContent>
          </Card>
        </View>
      )}

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <Button
          title="Scan Another Label"
          onPress={handleScanAnother}
          variant="primary"
          size="lg"
          icon={<RefreshCw size={18} color="#000000" />}
          style={{ width: '100%' }}
        />
      </View>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productHeader: {
    marginBottom: spacing.base,
  },
  brandText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  productTitle: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.black,
    color: colors.text,
    lineHeight: 32,
  },
  summaryCard: {
    borderColor: 'rgba(34, 197, 94, 0.3)',
    backgroundColor: colors.surfaceRaised,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  ratingLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  novaExplanation: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceRaised,
    borderRadius: borderRadius.md,
    padding: 4,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
  },
  tabButtonActive: {
    backgroundColor: colors.surfaceHighlight,
  },
  tabText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.text,
  },
  warningCard: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  warningTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.warning,
    marginLeft: spacing.sm,
  },
  warningItem: {
    fontSize: typography.fontSizes.sm,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  prosCard: {
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  consCard: {
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  bulletIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    color: colors.text,
    lineHeight: 20,
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
    borderTopColor: colors.border,
  },
  subSectionTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  dietarySummary: {
    marginTop: spacing.md,
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  tabSectionInfo: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  ingredientCard: {
    marginBottom: spacing.sm,
  },
  ingredientTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  ingredientName: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  ingredientPurpose: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.primary,
    marginBottom: 4,
  },
  ingredientDescription: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  rawIngredientItem: {
    fontSize: typography.fontSizes.sm,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 4,
  },
  nutritionTable: {
    marginTop: spacing.xs,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
  },
  tableColHeader: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textSecondary,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(31, 31, 35, 0.5)',
  },
  nutrientName: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.text,
  },
  nutrientValue: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
  },
  rawNutritionText: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bottomActions: {
    paddingVertical: spacing.xl,
    paddingBottom: 40,
  },
});
