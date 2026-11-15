import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  PanResponder,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import {
  Settings,
  Moon,
  Sun,
  Smartphone,
  Vibrate,
  Shield,
  Sparkles,
  Database,
  Download,
  Trash2,
  Activity,
  ChevronRight,
  X,
  Info,
  CheckCircle,
  ExternalLink,
} from 'lucide-react-native';
import { useTheme, ThemeMode } from '../theme/ThemeContext';
import { SegmentedControl } from './SegmentedControl';
import { Button } from './Button';
import { AppHaptics } from '../lib/haptics';
import { exportScanHistory, clearAllHistory } from '../lib/history';
import { checkApiHealth } from '../api/client';
import { spacing, typography, borderRadius } from '../theme/tokens';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SettingsSheetProps {
  visible: boolean;
  onClose: () => void;
  onSignOutRequest: () => void;
  isLoggedIn: boolean;
  isAnonymous: boolean;
}

const SETTINGS_STORAGE_KEY = 'eatinformed_user_preferences_v1';

export function SettingsSheet({
  visible,
  onClose,
  onSignOutRequest,
  isLoggedIn,
  isAnonymous,
}: SettingsSheetProps) {
  const { colors, theme, setTheme, isDark } = useTheme();

  // Settings State
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [strictAllergens, setStrictAllergens] = useState(true);
  const [offlineCache, setOfflineCache] = useState(true);
  const [dietaryGoal, setDietaryGoal] = useState('clean');
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [pingStatus, setPingStatus] = useState<string>('Ready to test');
  const [isPinging, setIsPinging] = useState(false);

  const panY = React.useRef(new Animated.Value(0)).current;

  // Load user preferences from storage
  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_STORAGE_KEY).then((data) => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.hapticsEnabled !== undefined) setHapticsEnabled(parsed.hapticsEnabled);
          if (parsed.strictAllergens !== undefined) setStrictAllergens(parsed.strictAllergens);
          if (parsed.offlineCache !== undefined) setOfflineCache(parsed.offlineCache);
          if (parsed.dietaryGoal) setDietaryGoal(parsed.dietaryGoal);
        } catch {}
      }
    });
  }, []);

  const savePref = async (key: string, val: any) => {
    try {
      const existing = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      const parsed = existing ? JSON.parse(existing) : {};
      parsed[key] = val;
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(parsed));
    } catch {}
  };

  const handleToggleHaptics = (val: boolean) => {
    setHapticsEnabled(val);
    AppHaptics.setEnabled(val);
    if (val) AppHaptics.selection();
    savePref('hapticsEnabled', val);
  };

  const handleToggleStrictAllergens = (val: boolean) => {
    AppHaptics.selection();
    setStrictAllergens(val);
    savePref('strictAllergens', val);
  };

  const handleToggleOfflineCache = (val: boolean) => {
    AppHaptics.selection();
    setOfflineCache(val);
    savePref('offlineCache', val);
  };

  const handleTestPing = async () => {
    AppHaptics.selection();
    setIsPinging(true);
    setPingStatus('Testing latency...');
    const start = Date.now();
    const res = await checkApiHealth();
    const elapsed = Date.now() - start;
    setIsPinging(false);
    if (res.ok) {
      setPingLatency(elapsed);
      setPingStatus(`Online (${elapsed}ms)`);
      AppHaptics.success();
    } else {
      setPingLatency(null);
      setPingStatus('Offline / Unreachable');
      AppHaptics.warning();
    }
  };

  const handleExport = async () => {
    AppHaptics.success();
    await exportScanHistory();
  };

  const handleClearHistory = () => {
    AppHaptics.warning();
    Alert.alert(
      'Clear Scan History',
      'Are you sure you want to delete all cached food scans from your device? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearAllHistory();
            AppHaptics.success();
            Alert.alert('Cleared', 'Your local scan cache has been wiped.');
          },
        },
      ]
    );
  };

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

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
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
          {/* GymMane Drag Handle */}
          <View {...panResponder.panHandlers} style={styles.dragHandleArea}>
            <View
              style={[
                styles.dragHandle,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)' },
              ]}
            />
          </View>

          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.separator }]}>
            <View style={styles.headerTitleCol}>
              <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Preferences, Clinical AI & System Configuration
              </Text>
            </View>

            <Pressable
              onPress={() => {
                AppHaptics.selection();
                onClose();
              }}
              style={[styles.closeButton, { backgroundColor: colors.surfaceRaised }]}
              accessibilityRole="button"
              accessibilityLabel="Close settings"
            >
              <X size={18} color={colors.text} />
            </Pressable>
          </View>

          {/* Settings Groups */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Group 1: Appearance & Touch */}
            <View style={styles.group}>
              <Text style={[styles.groupHeader, { color: colors.textSecondary }]}>
                APPEARANCE & HAPTICS
              </Text>
              <View style={[styles.cardGroup, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
                {/* Theme Mode Segment */}
                <View style={[styles.row, { borderBottomColor: colors.separator, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                  <View style={styles.rowLabelCol}>
                    <Text style={[styles.rowTitle, { color: colors.text }]}>Interface Theme</Text>
                    <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                      Follow system or override
                    </Text>
                  </View>
                </View>
                <View style={{ padding: 12 }}>
                  <SegmentedControl<ThemeMode>
                    options={[
                      { value: 'system', label: 'Auto' },
                      { value: 'dark', label: 'Dark' },
                      { value: 'amoled', label: 'AMOLED' },
                      { value: 'light', label: 'Light' },
                    ]}
                    value={theme}
                    onChange={(newTheme) => {
                      AppHaptics.selection();
                      setTheme(newTheme);
                    }}
                  />
                </View>

                {/* Haptics Switch */}
                <View style={[styles.row, { borderTopColor: colors.separator, borderTopWidth: StyleSheet.hairlineWidth }]}>
                  <View style={styles.rowLabelCol}>
                    <View style={styles.rowTitleWithIcon}>
                      <Vibrate size={16} color={colors.primary} />
                      <Text style={[styles.rowTitle, { color: colors.text }]}>Haptic Tactile Feedback</Text>
                    </View>
                    <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                      Subtle tactile responses on clicks & scans
                    </Text>
                  </View>
                  <Switch
                    value={hapticsEnabled}
                    onValueChange={handleToggleHaptics}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.surface}
                  />
                </View>
              </View>
            </View>

            {/* Group 2: Dietary Sensitivity */}
            <View style={styles.group}>
              <Text style={[styles.groupHeader, { color: colors.textSecondary }]}>
                DIETARY & CLINICAL SENSITIVITY
              </Text>
              <View style={[styles.cardGroup, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
                <View style={[styles.row, { borderBottomColor: colors.separator, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                  <View style={styles.rowLabelCol}>
                    <View style={styles.rowTitleWithIcon}>
                      <Shield size={16} color={colors.warning} />
                      <Text style={[styles.rowTitle, { color: colors.text }]}>Strict Allergen Alerts</Text>
                    </View>
                    <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                      Alert on trace cross-contamination labels
                    </Text>
                  </View>
                  <Switch
                    value={strictAllergens}
                    onValueChange={handleToggleStrictAllergens}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.surface}
                  />
                </View>

                <View style={styles.row}>
                  <View style={styles.rowLabelCol}>
                    <View style={styles.rowTitleWithIcon}>
                      <Database size={16} color={colors.primary} />
                      <Text style={[styles.rowTitle, { color: colors.text }]}>Offline Additive Protection</Text>
                    </View>
                    <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                      Prewarm clinical dictionary for zero-network queries
                    </Text>
                  </View>
                  <Switch
                    value={offlineCache}
                    onValueChange={handleToggleOfflineCache}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.surface}
                  />
                </View>
              </View>
            </View>

            {/* Group 3: Data & Storage */}
            <View style={styles.group}>
              <Text style={[styles.groupHeader, { color: colors.textSecondary }]}>
                DATA & PORTABILITY
              </Text>
              <View style={[styles.cardGroup, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
                <Pressable
                  style={[styles.row, { borderBottomColor: colors.separator, borderBottomWidth: StyleSheet.hairlineWidth }]}
                  onPress={handleExport}
                >
                  <View style={styles.rowLabelCol}>
                    <View style={styles.rowTitleWithIcon}>
                      <Download size={16} color={colors.primary} />
                      <Text style={[styles.rowTitle, { color: colors.text }]}>Export Scan History (JSON)</Text>
                    </View>
                    <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                      Download or share your clinical audit logs
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.textSecondary} />
                </Pressable>

                <Pressable style={styles.row} onPress={handleClearHistory}>
                  <View style={styles.rowLabelCol}>
                    <View style={styles.rowTitleWithIcon}>
                      <Trash2 size={16} color={colors.danger} />
                      <Text style={[styles.rowTitle, { color: colors.danger }]}>Clear Local Scan Cache</Text>
                    </View>
                    <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                      Wipes cached labels and temporary images
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.textSecondary} />
                </Pressable>
              </View>
            </View>

            {/* Group 4: Diagnostics */}
            <View style={styles.group}>
              <Text style={[styles.groupHeader, { color: colors.textSecondary }]}>
                DIAGNOSTICS & SYSTEM STATUS
              </Text>
              <View style={[styles.cardGroup, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
                <View style={[styles.row, { borderBottomColor: colors.separator, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                  <View style={styles.rowLabelCol}>
                    <View style={styles.rowTitleWithIcon}>
                      <Activity size={16} color={colors.primary} />
                      <Text style={[styles.rowTitle, { color: colors.text }]}>Backend AI Health Check</Text>
                    </View>
                    <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>{pingStatus}</Text>
                  </View>
                  <Button
                    title={isPinging ? '...' : 'Ping'}
                    size="sm"
                    variant="outline"
                    onPress={handleTestPing}
                    loading={isPinging}
                  />
                </View>

                <View style={styles.row}>
                  <View style={styles.rowLabelCol}>
                    <Text style={[styles.rowTitle, { color: colors.text }]}>Clinical Additive Registry</Text>
                    <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                      12,400+ ingredients & E-numbers indexed
                    </Text>
                  </View>
                  <CheckCircle size={18} color={colors.primary} />
                </View>
              </View>
            </View>

            {/* Group 5: Account & Session */}
            {isLoggedIn && (
              <View style={styles.group}>
                <Text style={[styles.groupHeader, { color: colors.textSecondary }]}>SESSION</Text>
                <View style={[styles.cardGroup, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
                  <Pressable
                    style={styles.row}
                    onPress={() => {
                      AppHaptics.warning();
                      onClose();
                      onSignOutRequest();
                    }}
                  >
                    <Text style={[styles.rowTitle, { color: colors.danger }]}>
                      {isAnonymous ? 'Exit Guest Mode' : 'Sign Out of EatInformed'}
                    </Text>
                    <ChevronRight size={18} color={colors.textSecondary} />
                  </Pressable>
                </View>
              </View>
            )}

            {/* About Info */}
            <View style={styles.aboutFooter}>
              <Text style={[styles.versionText, { color: colors.textSecondary }]}>
                EatInformed v1.2.0 (Build 42) · Apple HIG & GymMane Design
              </Text>
            </View>
          </ScrollView>
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
    maxHeight: SCREEN_HEIGHT * 0.88,
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
  title: {
    fontSize: typography.fontSizes.xl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
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
    maxHeight: SCREEN_HEIGHT * 0.72,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  group: {
    gap: 8,
  },
  groupHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingLeft: 4,
  },
  cardGroup: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLabelCol: {
    flex: 1,
    marginRight: 12,
  },
  rowTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '700',
  },
  rowSubtitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: '500',
    marginTop: 2,
  },
  aboutFooter: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  versionText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
