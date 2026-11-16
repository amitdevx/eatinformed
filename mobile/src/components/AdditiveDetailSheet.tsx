import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';
import {
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Info,
  X,
  Sparkles,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { Button } from './Button';
import { GlassSurface } from './GlassSurface';
import { AppHaptics } from '../lib/haptics';
import { borderRadius, spacing, typography } from '../theme/tokens';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface AdditiveDetailData {
  name: string;
  code?: string;
  category?: string;
  riskLevel?: 'caution' | 'moderate' | 'safe';
  novaGroup?: number;
  description?: string;
  foundIn?: string;
  regulatoryNotice?: string;
}

interface AdditiveDetailSheetProps {
  visible: boolean;
  additive: AdditiveDetailData | null;
  onClose: () => void;
}

// ponytail: GymMane-grade modal bottom sheet with drag handle & clinical breakdown
export function AdditiveDetailSheet({
  visible,
  additive,
  onClose,
}: AdditiveDetailSheetProps) {
  const { colors, isDark } = useTheme();
  const panY = React.useRef(new Animated.Value(0)).current;

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 0.8) {
          AppHaptics.selection();
          Animated.timing(panY, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            panY.setValue(0);
            onClose();
          });
        } else {
          Animated.spring(panY, {
            toValue: 0,
            damping: 20,
            stiffness: 280,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!visible || !additive) return null;

  const isCaution = additive.riskLevel === 'caution' || (additive.novaGroup && additive.novaGroup >= 4);
  const isModerate = additive.riskLevel === 'moderate';

  const riskColor = isCaution ? colors.danger : isModerate ? colors.warning : colors.primary;
  const riskBackground = isCaution ? colors.dangerLight : isModerate ? colors.warningLight : colors.primaryMuted;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={styles.backdropPressable}
          onPress={() => {
            AppHaptics.selection();
            onClose();
          }}
        />

        <Animated.View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              transform: [{ translateY: panY }],
            },
          ]}
        >
          {/* GymMane Drag Handle Bar */}
          <View {...panResponder.panHandlers} style={styles.dragHandleArea}>
            <View
              style={[
                styles.dragHandle,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)' },
              ]}
            />
          </View>

          {/* Header Row */}
          <View style={[styles.headerRow, { borderBottomColor: colors.separator }]}>
            <View style={styles.headerTitleCol}>
              <View style={styles.titleWithBadge}>
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                  {additive.name}
                </Text>
                {additive.code && (
                  <View style={[styles.codeBadge, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
                    <Text style={[styles.codeText, { color: colors.textSecondary }]}>{additive.code}</Text>
                  </View>
                )}
              </View>
              {additive.category && (
                <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
                  {additive.category}
                </Text>
              )}
            </View>

            <Pressable
              onPress={() => {
                AppHaptics.selection();
                onClose();
              }}
              style={[styles.closeButton, { backgroundColor: colors.surfaceRaised }]}
              accessibilityRole="button"
              accessibilityLabel="Close additive details"
            >
              <X size={18} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Clinical Risk Summary Banner */}
            <View style={[styles.banner, { backgroundColor: riskBackground, borderColor: riskColor }]}>
              {isCaution ? (
                <ShieldAlert size={22} color={riskColor} />
              ) : isModerate ? (
                <AlertTriangle size={22} color={riskColor} />
              ) : (
                <ShieldCheck size={22} color={riskColor} />
              )}
              <View style={styles.bannerTextCol}>
                <Text style={[styles.bannerTitle, { color: riskColor }]}>
                  {isCaution
                    ? 'Ingredient information'
                    : isModerate
                    ? 'Moderate Consideration'
                    : 'Ingredient reference'}
                </Text>
                <Text style={[styles.bannerSubtitle, { color: colors.text }]}>
                  {isCaution
                    ? 'Effects depend on the substance, quantity and individual context. This reference is not a medical assessment.'
                    : isModerate
                    ? 'Check the label and consult a qualified professional about individual dietary needs.'
                    : 'This classification does not establish safety for allergies or other dietary conditions.'}
                </Text>
              </View>
            </View>

            {/* NOVA Classification Card */}
            {additive.novaGroup && (
              <View style={[styles.infoCard, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
                <Text style={[styles.cardHeading, { color: colors.textSecondary }]}>NOVA FOOD CLASSIFICATION</Text>
                <Text style={[styles.cardBody, { color: colors.text }]}>
                  Group {additive.novaGroup}:{' '}
                  {additive.novaGroup === 4
                    ? 'Ultra-Processed Food Marker. Found almost exclusively in industrial food formulations.'
                    : additive.novaGroup === 3
                    ? 'Processed Food. Manufactured by adding culinary substances to whole foods.'
                    : 'Unprocessed or Minimally Processed Whole Ingredient.'}
                </Text>
              </View>
            )}

            {/* Description & Impact */}
            <View style={[styles.infoCard, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
              <Text style={[styles.cardHeading, { color: colors.textSecondary }]}>CLINICAL & BIOLOGICAL IMPACT</Text>
              <Text style={[styles.cardBody, { color: colors.text }]}>
                {additive.description ||
                  'Extracted from packaged food ingredients list. Used in food processing for stability, flavor, or texture preservation.'}
              </Text>
            </View>

            {/* Commonly Found In */}
            {additive.foundIn && (
              <View style={[styles.infoCard, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
                <Text style={[styles.cardHeading, { color: colors.textSecondary }]}>COMMONLY FOUND IN</Text>
                <Text style={[styles.cardBody, { color: colors.text }]}>{additive.foundIn}</Text>
              </View>
            )}
          </ScrollView>

          {/* Bottom Action Button */}
          <View style={[styles.footerArea, { borderTopColor: colors.separator }]}>
            <Button
              title="Got It"
              variant="primary"
              size="md"
              onPress={() => {
                AppHaptics.selection();
                onClose();
              }}
              style={{ width: '100%' }}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.54)',
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    maxHeight: SCREEN_HEIGHT * 0.82,
    paddingBottom: 24,
  },
  dragHandleArea: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleCol: {
    flex: 1,
    marginRight: spacing.md,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  title: {
    fontSize: typography.fontSizes.lg,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  codeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  codeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  categoryText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: '500',
    marginTop: 2,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    maxHeight: SCREEN_HEIGHT * 0.55,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  banner: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    alignItems: 'flex-start',
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '700',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: typography.fontSizes.xs,
    lineHeight: 18,
    fontWeight: '500',
  },
  infoCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  cardBody: {
    fontSize: typography.fontSizes.sm,
    lineHeight: 20,
    fontWeight: '500',
  },
  footerArea: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
