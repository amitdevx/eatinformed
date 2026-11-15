import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Share,
  Modal,
  Pressable,
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
  Info,
  FileText,
  FileJson,
  X,
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card, CardHeader, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { NovaBadge } from '../components/NovaBadge';
import { RatingStars } from '../components/RatingStars';
import { SegmentedControl } from '../components/SegmentedControl';
import { HealthScoreRing } from '../components/HealthScoreRing';
import { MacroProportionBar } from '../components/MacroProportionBar';
import { AdditiveDetailSheet, AdditiveDetailData } from '../components/AdditiveDetailSheet';
import { ADDITIVE_DICTIONARY } from '../lib/additive-dictionary';
import { AppHaptics } from '../lib/haptics';
import { exportProductAsJsonFile } from '../lib/history';
import { getUserSession } from '../lib/auth';
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
  const [additiveSheetVisible, setAdditiveSheetVisible] = useState(false);
  const [selectedAdditive, setSelectedAdditive] = useState<AdditiveDetailData | null>(null);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [userAllergens, setUserAllergens] = useState<string[]>([]);

  useEffect(() => {
    getUserSession().then((session) => {
      if (session?.allergens && session.allergens.length > 0) {
        setUserAllergens(session.allergens);
      }
    });
  }, []);

  const handleOpenAdditiveDetails = (item: any) => {
    AppHaptics.selection();
    const rawName = item.ingredient || '';
    const match = ADDITIVE_DICTIONARY.find(
      (entry) =>
        entry.name.toLowerCase().includes(rawName.toLowerCase()) ||
        rawName.toLowerCase().includes(entry.name.toLowerCase()) ||
        (entry.code && rawName.toLowerCase().includes(entry.code.toLowerCase()))
    );

    setSelectedAdditive({
      name: rawName,
      code: match?.code,
      category: match?.category || item.purpose,
      riskLevel: match?.riskLevel || (item.isControversial ? 'caution' : 'safe'),
      novaGroup: match?.novaGroup || (item.isControversial ? 4 : 1),
      description: match?.description || item.description,
      foundIn: match?.foundIn,
    });
    setAdditiveSheetVisible(true);
  };

  const productName = data.productName || 'Food Product';
  const rawBrand = (data.brand || '').trim();
  const brand = /^(unknown|n\/a|none|not visible|null|undefined|generic)$/i.test(rawBrand)
    ? ''
    : rawBrand;
  const rating = data.rating || 0;
  const novaGroup = data.novaGroup || 4;

  const matchedPersonalAllergens = React.useMemo(() => {
    if (!userAllergens || userAllergens.length === 0) return [];
    const textPool = [
      ...(data.ingredients || []),
      ...(data.dietaryInfo?.allergens || []),
      ...(data.warnings || []),
    ].join(' ').toLowerCase();

    return userAllergens.filter((alg) => {
      const clean = alg.trim().toLowerCase();
      return clean.length > 0 && textPool.includes(clean);
    });
  }, [userAllergens, data.ingredients, data.dietaryInfo, data.warnings]);

  const handleShare = () => {
    AppHaptics.selection();
    setShareModalVisible(true);
  };

  const handleShareText = async () => {
    setShareModalVisible(false);
    try {
      await Share.share({
        title: `EatInformed Health Report: ${productName}`,
        message: `${productName}${brand ? ` (${brand})` : ''}\nHealth Rating: ${rating.toFixed(1)}/5.0\nNOVA Group: ${novaGroup}\nAnalyzed with EatInformed.`,
      });
    } catch (e) {
      console.warn('Share text error:', e);
    }
  };

  const handleShareJson = async () => {
    setShareModalVisible(false);
    try {
      await exportProductAsJsonFile(data);
    } catch (e) {
      console.warn('Share JSON error:', e);
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
      {/* Standard Apple HIG Screen Header with Back & Share */}
      <FadeInView delay={0}>
        <ScreenHeader
          onBack={() => navigation.goBack()}
          eyebrow={brand || undefined}
          title={productName}
          largeTitle={true}
          rightElement={
            <PressableScale
              style={[
                styles.navIconButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={handleShare}
              scaleTo={0.92}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Share report"
            >
              <Share2 size={18} color={colors.text} />
            </PressableScale>
          }
        />
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
              <HealthScoreRing
                score={rating}
                size={82}
                strokeWidth={8}
                label="SCORE"
              />
              <View style={styles.ratingInfoCol}>
                <Text style={[styles.ratingLabel, { color: colors.textSecondary }]}>
                  OVERALL HEALTH SCORE
                </Text>
                <RatingStars rating={rating} size="lg" />
                <Text style={[styles.ratingSubtext, { color: colors.textSecondary }]}>
                  {rating >= 4.0
                    ? 'Clean / Nutrient Dense'
                    : rating >= 2.5
                    ? 'Moderate Processing'
                    : 'Ultra-Processed Formulation'}
                </Text>
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

      {/* Personal Allergen Flag Banner */}
      {matchedPersonalAllergens.length > 0 && (
        <FadeInView delay={100}>
          <View
            style={[
              styles.allergenAlertBox,
              {
                backgroundColor: colors.dangerLight,
                borderColor: colors.dangerBorder,
              },
            ]}
          >
            <View style={styles.allergenAlertHeader}>
              <AlertTriangle size={18} color={colors.dangerText} />
              <Text style={[styles.allergenAlertTitle, { color: colors.dangerText }]}>
                Personal Allergen Alert
              </Text>
            </View>
            <Text style={[styles.allergenAlertText, { color: colors.text }]}>
              This product contains ingredients matching your flagged allergen profile:
            </Text>
            <View style={styles.allergenChipsRow}>
              {matchedPersonalAllergens.map((alg, i) => (
                <View
                  key={i}
                  style={[
                    styles.allergenMatchChip,
                    { backgroundColor: colors.dangerText },
                  ]}
                >
                  <Text style={styles.allergenMatchChipText}>
                    {alg.toUpperCase()}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </FadeInView>
      )}

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
                borderColor: colors.dangerBorder,
                backgroundColor: colors.dangerLight,
                borderWidth: 1.5,
              }}
            >
              <CardContent>
                <View style={styles.warningHeader}>
                  <AlertTriangle size={20} color={colors.dangerText} />
                  <Text style={[styles.warningTitle, { color: colors.dangerText }]}>
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
            completeIngredientAnalysis.map((item, index) => {
              const isPersonalMatch = userAllergens.some((alg) => {
                const clean = alg.trim().toLowerCase();
                return clean.length > 0 && item.ingredient.toLowerCase().includes(clean);
              });

              return (
                <Card
                  key={index}
                  style={[
                    styles.ingredientCard,
                    isPersonalMatch && {
                      borderColor: colors.dangerBorder,
                      backgroundColor: colors.dangerLight,
                      borderWidth: 1.5,
                    },
                  ]}
                  onPress={() => handleOpenAdditiveDetails(item)}
                  onLongPress={() => AppHaptics.impactHeavy()}
                >
                  <CardContent>
                    <View style={styles.ingredientTopRow}>
                      <Text
                        selectable={true}
                        style={[styles.ingredientName, { color: colors.text }]}
                      >
                        {item.ingredient}
                      </Text>
                      <View style={styles.badgeRow}>
                        {isPersonalMatch && (
                          <Badge label="Personal Allergen" variant="danger" size="sm" />
                        )}
                        {item.isAllergen && !isPersonalMatch && (
                          <Badge label="Allergen" variant="danger" size="sm" />
                        )}
                        {getIngredientBadge(item)}
                        <Info size={14} color={colors.textSecondary} style={{ marginLeft: 4 }} />
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
                        selectable={true}
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
              );
            })
          ) : (
            <Card>
              <CardContent>
                {data.ingredients.map((ing, idx) => (
                  <Text
                    key={idx}
                    selectable={true}
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

        const parseGrams = (query: RegExp) => {
          const item = nutrientsList.find((n) => query.test(n.nutrient));
          const val = item?.perServing || item?.per100mL || '';
          const num = parseFloat(val.replace(/[^0-9.]/g, ''));
          return isNaN(num) ? 0 : num;
        };
        const proteinG = parseGrams(/protein/i);
        const carbsG = parseGrams(/carbohydrate|carbs/i);
        const fatG = parseGrams(/\bfat\b|total fat/i);
        const fiberG = parseGrams(/fiber|dietary fiber/i);
        const caloriesKcal = parseGrams(/energy|calories|kcal/i);

        return (
          <FadeInView key="tab-nutrition" delay={20}>
            {/* FitBuddy Stacked Macro Proportion Bar */}
            <Card style={{ marginBottom: spacing.md }}>
              <CardContent>
                <MacroProportionBar
                  proteinGrams={proteinG}
                  carbsGrams={carbsG}
                  fatGrams={fatG}
                  fiberGrams={fiberG}
                  calories={caloriesKcal}
                />
              </CardContent>
            </Card>

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

      {/* GymMane-Grade Additive Clinical Detail Sheet */}
      <AdditiveDetailSheet
        visible={additiveSheetVisible}
        additive={selectedAdditive}
        onClose={() => setAdditiveSheetVisible(false)}
      />

      {/* Share Choice Modal */}
      <Modal
        visible={shareModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setShareModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShareModalVisible(false)}
        >
          <View
            style={[
              styles.shareModalSheet,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.shareModalHeader}>
              <Text style={[styles.shareModalTitle, { color: colors.text }]}>Share Product Report</Text>
              <Pressable
                onPress={() => setShareModalVisible(false)}
                hitSlop={8}
              >
                <X size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.shareOptionsCol}>
              <Pressable
                style={[styles.shareOptionBtn, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}
                onPress={handleShareText}
              >
                <FileText size={22} color={colors.primary} />
                <View style={styles.shareOptionTexts}>
                  <Text style={[styles.shareOptionTitle, { color: colors.text }]}>Share as Text Summary</Text>
                  <Text style={[styles.shareOptionDesc, { color: colors.textSecondary }]}>
                    Formatted text message with rating, NOVA group, and overview
                  </Text>
                </View>
              </Pressable>

              <Pressable
                style={[styles.shareOptionBtn, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}
                onPress={handleShareJson}
              >
                <FileJson size={22} color="#3B82F6" />
                <View style={styles.shareOptionTexts}>
                  <Text style={[styles.shareOptionTitle, { color: colors.text }]}>Share as JSON File</Text>
                  <Text style={[styles.shareOptionDesc, { color: colors.textSecondary }]}>
                    Complete structured audit file for backup or clinical export
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
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
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  ratingInfoCol: {
    flex: 1,
    marginLeft: spacing.md,
  },
  ratingSubtext: {
    fontSize: typography.fontSizes.xs,
    marginTop: 4,
    fontWeight: '500',
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
  allergenAlertBox: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: spacing.md,
    marginBottom: spacing.base,
    gap: 8,
  },
  allergenAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  allergenAlertTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  allergenAlertText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  allergenChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  allergenMatchChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  allergenMatchChipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  shareModalSheet: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  shareModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  shareModalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  shareOptionsCol: {
    gap: 12,
  },
  shareOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  shareOptionTexts: {
    flex: 1,
  },
  shareOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  shareOptionDesc: {
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 15,
  },
});
