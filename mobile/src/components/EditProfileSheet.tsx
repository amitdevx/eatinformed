import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Image,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { User, Camera, X, Check, Plus, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { Button } from './Button';
import { PressableScale } from '../theme/animations';
import { AppHaptics } from '../lib/haptics';
import { borderRadius, layout, spacing, typography } from '../theme/tokens';
import { UserSessionData, updateUserProfile, normalizeHandle } from '../lib/auth';

interface EditProfileSheetProps {
  visible: boolean;
  onClose: () => void;
  currentSession: UserSessionData | null;
  onProfileUpdated: (updated: UserSessionData) => void;
}

// GymMane-style edit profile bottom sheet with avatar upload & personal allergen tagging
export function EditProfileSheet({
  visible,
  onClose,
  currentSession,
  onProfileUpdated,
}: EditProfileSheetProps) {
  const { colors, isDark } = useTheme();

  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [allergensList, setAllergensList] = useState<string[]>([]);
  const [newAllergenText, setNewAllergenText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible && currentSession) {
      setName(currentSession.name || '');
      setHandle(currentSession.handle || normalizeHandle(currentSession.email || ''));
      setPhotoUri(currentSession.photoUrl || null);
      setAllergensList(currentSession.allergens || []);
      setNewAllergenText('');
    }
  }, [visible, currentSession]);

  const handlePickPhoto = async () => {
    AppHaptics.selection();
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.82,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('Failed to pick profile image:', e);
    }
  };

  const handleAddAllergen = () => {
    const trimmed = newAllergenText.trim().replace(/^,+|,+$/g, '');
    if (!trimmed) return;
    AppHaptics.selection();
    if (!allergensList.map((a) => a.toLowerCase()).includes(trimmed.toLowerCase())) {
      setAllergensList((prev) => [...prev, trimmed]);
    }
    setNewAllergenText('');
  };

  const handleRemoveAllergen = (item: string) => {
    AppHaptics.selection();
    setAllergensList((prev) => prev.filter((a) => a !== item));
  };

  const handleSave = async () => {
    setIsSaving(true);
    AppHaptics.success();
    try {
      const updated = await updateUserProfile({
        name: name.trim() || 'Member',
        handle: normalizeHandle(handle),
        photoUrl: photoUri || undefined,
        allergens: allergensList,
      });
      onProfileUpdated(updated);
      onClose();
    } catch (e) {
      console.warn('Failed to update profile:', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* GymMane Drag Handle */}
          <View style={styles.handleBar} />

          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>
                Edit Profile
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Personalize your name, avatar, and personal allergen flags
              </Text>
            </View>
            <PressableScale
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[
                styles.closeButton,
                { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
              ]}
            >
              <X size={16} color={colors.textSecondary} />
            </PressableScale>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Avatar Picker */}
            <View style={styles.avatarSection}>
              <PressableScale onPress={handlePickPhoto} style={styles.avatarContainer}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.avatarImage} />
                ) : (
                  <View
                    style={[
                      styles.avatarPlaceholder,
                      { backgroundColor: colors.primaryMuted, borderColor: colors.primaryBorder },
                    ]}
                  >
                    <User size={36} color={colors.primary} />
                  </View>
                )}
                <View
                  style={[
                    styles.cameraBadge,
                    { backgroundColor: colors.primary, borderColor: colors.surface },
                  ]}
                >
                  <Camera size={14} color={colors.onPrimary} />
                </View>
              </PressableScale>
              <Text style={[styles.avatarHint, { color: colors.textSecondary }]}>
                Tap to change avatar
              </Text>
            </View>

            {/* Input Fields */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                DISPLAY NAME
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your Name"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceRaised,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                HANDLE
              </Text>
              <View
                style={[
                  styles.handleInputRow,
                  {
                    backgroundColor: colors.surfaceRaised,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.handlePrefix, { color: colors.textMuted }]}>@</Text>
                <TextInput
                  value={handle}
                  onChangeText={setHandle}
                  placeholder="username"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  style={[styles.handleInput, { color: colors.text }]}
                />
              </View>
            </View>

            {/* Allergens & Personal Ingredient Flags */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                ALLERGENS & INGREDIENT FLAGS TO HIGHLIGHT
              </Text>
              <Text style={[styles.allergenHelper, { color: colors.textSecondary }]}>
                Any scanned product containing these ingredients will display an immediate bright red safety alert.
              </Text>

              {/* Tag Input Row */}
              <View style={styles.allergenInputRow}>
                <TextInput
                  value={newAllergenText}
                  onChangeText={setNewAllergenText}
                  placeholder="e.g. Soy, Peanuts, Red 40, Palm Oil"
                  placeholderTextColor={colors.textMuted}
                  onSubmitEditing={handleAddAllergen}
                  returnKeyType="done"
                  style={[
                    styles.allergenInput,
                    {
                      backgroundColor: colors.surfaceRaised,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                />
                <Pressable
                  onPress={handleAddAllergen}
                  style={[styles.addAllergenBtn, { backgroundColor: colors.primary }]}
                >
                  <Plus size={16} color="#FFFFFF" />
                  <Text style={styles.addAllergenText}>Add</Text>
                </Pressable>
              </View>

              {/* Active Allergen Chips List */}
              <View style={styles.allergenChipsWrap}>
                {allergensList.map((alg) => (
                  <View
                    key={alg}
                    style={[
                      styles.allergenChip,
                      {
                        backgroundColor: colors.dangerLight,
                        borderColor: colors.dangerBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.allergenChipText, { color: colors.dangerText }]}>
                      {alg}
                    </Text>
                    <Pressable
                      onPress={() => handleRemoveAllergen(alg)}
                      hitSlop={6}
                      style={styles.removeChipBtn}
                    >
                      <X size={13} color={colors.dangerText} />
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>

            <Button
              title={isSaving ? 'Saving...' : 'Save Profile Changes'}
              onPress={handleSave}
              variant="primary"
              size="lg"
              disabled={isSaving}
              icon={<Check size={18} color={colors.onPrimary} />}
              style={styles.saveButton}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl + 10,
    maxHeight: '90%',
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(150, 150, 150, 0.4)',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.base,
  },
  title: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: {
    fontSize: typography.fontSizes.caption2,
    marginTop: spacing.xs,
  },
  fieldGroup: {
    marginBottom: spacing.base,
  },
  fieldLabel: {
    fontSize: typography.fontSizes.caption2,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  allergenHelper: {
    fontSize: 11.5,
    lineHeight: 15,
    marginBottom: 8,
  },
  allergenInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  allergenInput: {
    flex: 1,
    height: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSizes.sm,
  },
  addAllergenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  addAllergenText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  allergenChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 14,
    borderWidth: 1.2,
    gap: 6,
  },
  allergenChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  removeChipBtn: {
    padding: 2,
  },
  input: {
    height: 46,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSizes.sm,
  },
  handleInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  handlePrefix: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    marginRight: 4,
  },
  handleInput: {
    flex: 1,
    height: 46,
    fontSize: typography.fontSizes.sm,
    paddingVertical: 0,
  },
  saveButton: {
    marginTop: spacing.md,
  },
});
