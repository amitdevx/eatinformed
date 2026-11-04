import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Camera as CameraIcon,
  Image as ImageIcon,
  Zap,
  ZapOff,
  SwitchCamera,
  RefreshCw,
  Sparkles,
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { LoadingState, ErrorState } from '../components/States';
import { colors } from '../theme/colors';
import { borderRadius, spacing, typography } from '../theme/tokens';
import { scanFoodLabel } from '../api/client';
import { saveScanToHistory } from '../lib/history';
import { RootStackParamList } from '../navigation/types';

const { width } = Dimensions.get('window');
const VIEWFINDER_WIDTH = width * 0.82;
const VIEWFINDER_HEIGHT = width * 0.95;

const LOADING_STEPS = [
  'Detecting packaging and label text with Vision AI...',
  'Extracting ingredients and nutrition facts table...',
  'Cross-referencing food additives with safety standards...',
  'Computing NOVA processing classification and balance...',
  'Finalizing comprehensive health assessment...',
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ScanScreen() {
  const navigation = useNavigation<NavigationProp>();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();

  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [torch, setTorch] = useState<boolean>(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cameraRef = useRef<any>(null);

  // Progressive step ticker during AI analysis
  useEffect(() => {
    if (!isLoading) return;
    setLoadingStepIndex(0);

    const interval = setInterval(() => {
      setLoadingStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 2400);

    return () => clearInterval(interval);
  }, [isLoading]);

  const handleCapturePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        base64: true,
        skipProcessing: false,
      });

      if (photo?.uri && photo?.base64) {
        setSelectedImageUri(photo.uri);
        setSelectedImageBase64(photo.base64);
        setErrorMessage(null);
      }
    } catch (err: unknown) {
      console.error('Failed to capture photo:', err);
      Alert.alert('Camera Error', 'Could not capture photo. Please try again.');
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.uri && asset.base64) {
          setSelectedImageUri(asset.uri);
          setSelectedImageBase64(asset.base64);
          setErrorMessage(null);
        }
      }
    } catch (err: unknown) {
      console.error('Failed to pick image from gallery:', err);
      Alert.alert('Gallery Error', 'Could not access photo library.');
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImageBase64) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const analysis = await scanFoodLabel(selectedImageBase64);

      if (analysis.status !== 'success' && (!analysis.ingredients || analysis.ingredients.length === 0)) {
        const errorDetail =
          analysis.warnings?.[0] ||
          analysis.nutrition?.rawText ||
          (analysis.status === 'unreadable'
            ? 'The label image was blurry or too dark. Please take a clearer, well-lit photo.'
            : 'No ingredient or nutrition text was found. Please ensure the nutrition panel is clearly visible.');
        setErrorMessage(errorDetail);
        setIsLoading(false);
        return;
      }

      // Save successful scan to persistent history
      await saveScanToHistory(analysis, selectedImageUri);

      // Navigate to detailed result screen
      navigation.navigate('Result', {
        data: analysis,
        imageUri: selectedImageUri,
      });

      // Reset selection for next scan
      setSelectedImageUri(null);
      setSelectedImageBase64(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Could not connect to the analysis service. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetake = () => {
    setSelectedImageUri(null);
    setSelectedImageBase64(null);
    setErrorMessage(null);
  };

  const toggleTorch = () => setTorch((prev) => !prev);
  const toggleFacing = () =>
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));

  // Loading state overlay
  if (isLoading) {
    return (
      <Screen style={styles.centerContainer}>
        <LoadingState
          message="Analyzing Food Product"
          stepMessage={LOADING_STEPS[loadingStepIndex]}
        />
      </Screen>
    );
  }

  // Error state view
  if (errorMessage && selectedImageUri) {
    return (
      <Screen scrollable>
        <ErrorState
          title="Analysis Unsuccessful"
          message={errorMessage}
          onRetry={handleAnalyze}
        />
        <View style={styles.actionRow}>
          <Button
            title="Retake Photo"
            onPress={handleRetake}
            variant="secondary"
            size="md"
            icon={<RefreshCw size={18} color={colors.text} />}
            style={{ flex: 1, marginRight: spacing.sm }}
          />
          <Button
            title="Pick from Gallery"
            onPress={handlePickFromGallery}
            variant="outline"
            size="md"
            icon={<ImageIcon size={18} color={colors.primary} />}
            style={{ flex: 1 }}
          />
        </View>
      </Screen>
    );
  }

  // Preview state view
  if (selectedImageUri) {
    return (
      <Screen scrollable>
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>Confirm Food Label</Text>
          <Text style={styles.previewSubtitle}>
            Ensure the ingredients and nutrition table are legible
          </Text>

          <View style={styles.previewImageWrapper}>
            <Image
              source={{ uri: selectedImageUri }}
              style={styles.previewImage}
              resizeMode="contain"
              alt="Food label preview"
            />
          </View>

          <View style={styles.previewActions}>
            <Button
              title="Analyze Label with AI"
              onPress={handleAnalyze}
              variant="primary"
              size="lg"
              icon={<Sparkles size={20} color="#000000" />}
              style={styles.analyzeButton}
            />
            <Button
              title="Retake / Change Photo"
              onPress={handleRetake}
              variant="secondary"
              size="md"
              icon={<RefreshCw size={18} color={colors.text} />}
            />
          </View>
        </View>
      </Screen>
    );
  }

  // Camera permissions check
  if (!permission) {
    return (
      <Screen style={styles.centerContainer}>
        <LoadingState message="Checking camera permissions..." />
      </Screen>
    );
  }

  if (!permission.granted) {
    return (
      <Screen style={styles.centerContainer}>
        <CameraIcon size={48} color={colors.textSecondary} style={{ marginBottom: spacing.base }} />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionSubtitle}>
          EatInformed uses your camera to scan food labels, ingredients, and nutrition facts.
        </Text>
        <Button
          title="Enable Camera Access"
          onPress={requestPermission}
          variant="primary"
          size="md"
          style={{ width: '100%', marginBottom: spacing.md }}
        />
        <Button
          title="Pick from Photo Gallery Instead"
          onPress={handlePickFromGallery}
          variant="secondary"
          size="md"
          icon={<ImageIcon size={18} color={colors.text} />}
          style={{ width: '100%' }}
        />
      </Screen>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      {isFocused && (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          enableTorch={torch}
        >
          {/* Top Controls Overlay */}
          <View style={styles.topControls}>
            <TouchableOpacity
              style={styles.controlCircle}
              onPress={toggleTorch}
              activeOpacity={0.8}
            >
              {torch ? (
                <Zap size={22} color={colors.warning} />
              ) : (
                <ZapOff size={22} color="#FFFFFF" />
              )}
            </TouchableOpacity>

            <View style={styles.headerPill}>
              <Text style={styles.headerPillText}>Align Food Label</Text>
            </View>

            <TouchableOpacity
              style={styles.controlCircle}
              onPress={toggleFacing}
              activeOpacity={0.8}
            >
              <SwitchCamera size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Viewfinder Target Area */}
          <View style={styles.viewfinderContainer}>
            <View style={styles.viewfinderBox}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
            <Text style={styles.viewfinderHint}>
              Frame ingredient list or nutrition panel
            </Text>
          </View>

          {/* Bottom Shutter Controls */}
          <View style={styles.bottomControls}>
            <TouchableOpacity
              style={styles.galleryButton}
              onPress={handlePickFromGallery}
              activeOpacity={0.8}
            >
              <ImageIcon size={26} color="#FFFFFF" />
              <Text style={styles.galleryButtonText}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shutterButtonOuter}
              onPress={handleCapturePhoto}
              activeOpacity={0.8}
            >
              <View style={styles.shutterButtonInner} />
            </TouchableOpacity>

            <View style={styles.placeholderButton} />
          </View>
        </CameraView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: spacing.lg,
  },
  controlCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerPillText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  viewfinderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinderBox: {
    width: VIEWFINDER_WIDTH,
    height: VIEWFINDER_HEIGHT,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.primary,
  },
  cornerTopLeft: {
    top: -1,
    left: -1,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: borderRadius.md,
  },
  cornerTopRight: {
    top: -1,
    right: -1,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: borderRadius.md,
  },
  cornerBottomLeft: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: borderRadius.md,
  },
  cornerBottomRight: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: borderRadius.md,
  },
  viewfinderHint: {
    fontSize: typography.fontSizes.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 40,
    paddingHorizontal: spacing.xxl,
  },
  galleryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  galleryButtonText: {
    fontSize: typography.fontSizes.xs,
    color: '#FFFFFF',
    marginTop: 4,
  },
  shutterButtonOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  shutterButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
  },
  placeholderButton: {
    width: 60,
  },
  previewContainer: {
    paddingVertical: spacing.lg,
  },
  previewTitle: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  previewSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.base,
  },
  previewImageWrapper: {
    height: 380,
    backgroundColor: colors.surfaceRaised,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewActions: {
    gap: spacing.md,
  },
  analyzeButton: {
    width: '100%',
  },
  permissionTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  permissionSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: spacing.base,
  },
});
