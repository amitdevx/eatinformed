import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  Alert,
  Animated,
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
import { useTheme } from '../theme/ThemeContext';
import { FadeInView, PressableScale } from '../theme/animations';
import { borderRadius, spacing, typography } from '../theme/tokens';
import { scanFoodLabel, getEstimatedScanDuration, checkApiHealth } from '../api/client';
import { saveScanToHistory } from '../lib/history';
import { RootStackParamList } from '../navigation/types';

const { width } = Dimensions.get('window');
const VIEWFINDER_WIDTH = width * 0.82;
const VIEWFINDER_HEIGHT = width * 0.92;

const PIPELINE_STAGES = [
  { threshold: 0.0, label: 'Optimizing label image for optical analysis...' },
  { threshold: 0.12, label: 'Uploading food label to EatInformed AI...' },
  { threshold: 0.28, label: 'Extracting ingredients & nutrition panel with Vision AI...' },
  { threshold: 0.58, label: 'Cross-referencing additives & NOVA processing group...' },
  { threshold: 0.82, label: 'Finalizing clinical nutrition assessment...' },
  { threshold: 0.92, label: 'High server load — completing deep verification...' },
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ScanScreen() {
  const navigation = useNavigation<NavigationProp>();
  const isFocused = useIsFocused();
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();

  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [torch, setTorch] = useState<boolean>(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [estimatedTotalMs, setEstimatedTotalMs] = useState<number>(15000);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pre-warm the backend serverless function as soon as the user opens the Scan tab or picks a photo
  useEffect(() => {
    if (isFocused || selectedImageUri) {
      checkApiHealth().catch(() => null);
    }
  }, [isFocused, selectedImageUri]);

  const cameraRef = useRef<any>(null);
  const scanLineY = useRef(new Animated.Value(12)).current;
  const uploadDoneTimeRef = useRef<number | null>(null);

  // Animated scanner laser inside viewfinder
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineY, {
          toValue: VIEWFINDER_HEIGHT - 20,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineY, {
          toValue: 12,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scanLineY]);

  // ponytail: monotonic asymptotic progress ticker (never loops or moves backward)
  useEffect(() => {
    if (!isLoading) {
      setProgress(0);
      setElapsedMs(0);
      uploadDoneTimeRef.current = null;
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      setElapsedMs(now - startTime);

      if (uploadDoneTimeRef.current !== null) {
        const serverElapsed = now - uploadDoneTimeRef.current;
        // Asymptotic curve: smoothly approaches 0.95 based on rolling avg duration, never resets
        const tau = Math.max(6000, estimatedTotalMs * 0.65);
        const serverFraction = 1 - Math.exp(-serverElapsed / tau);
        const targetProgress = Math.min(0.95, 0.28 + 0.67 * serverFraction);
        setProgress((prev) => Math.max(prev, targetProgress));
      }
    }, 150);

    return () => clearInterval(interval);
  }, [isLoading, estimatedTotalMs]);

  const currentStageLabel = useMemo(() => {
    for (let i = PIPELINE_STAGES.length - 1; i >= 0; i--) {
      if (progress >= PIPELINE_STAGES[i].threshold) {
        return PIPELINE_STAGES[i].label;
      }
    }
    return PIPELINE_STAGES[0].label;
  }, [progress]);

  const handleCapturePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.65, // ponytail: compress to stay well under Vercel body size limits and speed up mobile uploads
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
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setErrorMessage('Photo gallery access is required to select food label photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.65, // ponytail: keep under 1.5MB to avoid payload rejection
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        let base64 = asset.base64;
        if (!base64 && asset.uri) {
          // ponytail: fallback read for remote or cloud-synced photos without initial base64
          try {
            const blobRes = await fetch(asset.uri);
            const blob = await blobRes.blob();
            base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const res = reader.result as string;
                resolve(res.includes(',') ? res.split(',')[1] : res);
              };
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          } catch (readErr) {
            console.warn('Failed to read cloud image blob:', readErr);
          }
        }

        if (asset.uri && base64) {
          setSelectedImageUri(asset.uri);
          setSelectedImageBase64(base64);
          setErrorMessage(null);
        } else {
          setErrorMessage('Could not load image data. Please choose a local image.');
        }
      }
    } catch (err: unknown) {
      console.error('Failed to pick image from gallery:', err);
      setErrorMessage('Could not access photo library.');
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImageBase64) return;

    const avgMs = await getEstimatedScanDuration();
    setEstimatedTotalMs(avgMs);
    setProgress(0.08);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const analysis = await scanFoodLabel(selectedImageBase64, (uploadFraction) => {
        // Real upload progress maps monotonically from 8% to 28%
        const mapped = 0.08 + uploadFraction * 0.20;
        setProgress((prev) => Math.max(prev, mapped));
        if (uploadFraction >= 1 && uploadDoneTimeRef.current === null) {
          uploadDoneTimeRef.current = Date.now();
        }
      });
      if (uploadDoneTimeRef.current === null) {
        uploadDoneTimeRef.current = Date.now();
      }
      setProgress(1.0); // Snap to 100% on real completion

      if (
        analysis.status !== 'success' &&
        (!analysis.ingredients || analysis.ingredients.length === 0)
      ) {
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

      await saveScanToHistory(analysis, selectedImageUri);

      navigation.navigate('Result', {
        data: analysis,
        imageUri: selectedImageUri,
      });

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
          stepMessage={currentStageLabel}
          progress={progress}
          elapsedMs={elapsedMs}
          estimatedTotalMs={estimatedTotalMs}
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
        <FadeInView delay={0} style={styles.previewContainer}>
          <Text style={[styles.previewTitle, { color: colors.text }]}>
            Confirm Food Label
          </Text>
          <Text style={[styles.previewSubtitle, { color: colors.textSecondary }]}>
            Ensure the ingredients list and nutrition facts table are legible
          </Text>

          <View
            style={[
              styles.previewImageWrapper,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
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
              icon={<Sparkles size={20} color={colors.onPrimary} />}
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
        </FadeInView>
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
        <View
          style={[
            styles.permissionIconCircle,
            { backgroundColor: colors.primaryMuted, borderColor: colors.primaryBorder },
          ]}
        >
          <CameraIcon size={34} color={colors.primary} />
        </View>
        <Text style={[styles.permissionTitle, { color: colors.text }]}>
          Camera Access Required
        </Text>
        <Text style={[styles.permissionSubtitle, { color: colors.textSecondary }]}>
          EatInformed uses your camera to scan food labels, ingredients, and nutrition tables in real time.
        </Text>
        <View style={styles.permissionButtonsWrapper}>
          <Button
            title="Enable Camera Access"
            onPress={requestPermission}
            variant="primary"
            size="lg"
            icon={<CameraIcon size={18} color={colors.onPrimary} />}
            style={styles.fullWidthButton}
          />
          <Button
            title="Pick from Photo Gallery Instead"
            onPress={handlePickFromGallery}
            variant="secondary"
            size="lg"
            icon={<ImageIcon size={18} color={colors.text} />}
            style={styles.fullWidthButton}
          />
        </View>
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
          {/* Top Translucent Glass Controls Overlay */}
          <View style={styles.topControls}>
            <PressableScale
              style={styles.controlCircle}
              onPress={toggleTorch}
              scaleTo={0.9}
              accessibilityLabel="Toggle flashlight"
            >
              {torch ? (
                <Zap size={20} color="#FBBF24" />
              ) : (
                <ZapOff size={20} color="#FFFFFF" />
              )}
            </PressableScale>

            <View style={styles.headerPill}>
              <Text style={styles.headerPillText}>ALIGN FOOD LABEL</Text>
            </View>

            <PressableScale
              style={styles.controlCircle}
              onPress={toggleFacing}
              scaleTo={0.9}
              accessibilityLabel="Switch camera"
            >
              <SwitchCamera size={20} color="#FFFFFF" />
            </PressableScale>
          </View>

          {/* Viewfinder Target Area with Animated Scan Line */}
          <View style={styles.viewfinderContainer}>
            <View style={styles.viewfinderBox}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />

              <Animated.View
                style={[
                  styles.scanLaser,
                  { transform: [{ translateY: scanLineY }] },
                ]}
              />
            </View>
            <View style={styles.viewfinderHintPill}>
              <Text style={styles.viewfinderHint}>
                Frame ingredients list or nutrition panel clearly
              </Text>
            </View>
          </View>

          {/* Bottom Shutter Controls */}
          <View style={styles.bottomControls}>
            <PressableScale
              style={styles.galleryButton}
              onPress={handlePickFromGallery}
              scaleTo={0.92}
            >
              <View style={styles.galleryIconWrapper}>
                <ImageIcon size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.galleryButtonText}>Photos</Text>
            </PressableScale>

            <PressableScale
              style={styles.shutterButtonOuter}
              onPress={handleCapturePhoto}
              scaleTo={0.92}
              accessibilityLabel="Capture food label photo"
            >
              <View style={styles.shutterButtonInner} />
            </PressableScale>

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
  permissionButtonsWrapper: {
    width: '100%',
    gap: spacing.md,
    alignItems: 'stretch',
    marginTop: spacing.md,
  },
  fullWidthButton: {
    width: '100%',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 54,
    paddingHorizontal: spacing.lg,
  },
  controlCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(22, 22, 24, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  headerPill: {
    paddingHorizontal: spacing.base,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(22, 22, 24, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  headerPillText: {
    fontSize: typography.fontSizes.caption2,
    fontWeight: typography.fontWeights.bold,
    color: '#F5F5F7',
    letterSpacing: 0.8,
  },
  viewfinderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinderBox: {
    width: VIEWFINDER_WIDTH,
    height: VIEWFINDER_HEIGHT,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    position: 'relative',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#30D158',
  },
  cornerTopLeft: {
    top: -1,
    left: -1,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
    borderTopLeftRadius: borderRadius.lg,
  },
  cornerTopRight: {
    top: -1,
    right: -1,
    borderTopWidth: 3.5,
    borderRightWidth: 3.5,
    borderTopRightRadius: borderRadius.lg,
  },
  cornerBottomLeft: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 3.5,
    borderLeftWidth: 3.5,
    borderBottomLeftRadius: borderRadius.lg,
  },
  cornerBottomRight: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
    borderBottomRightRadius: borderRadius.lg,
  },
  scanLaser: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: '#30D158',
    opacity: 0.75,
    borderRadius: 1,
  },
  viewfinderHintPill: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(22, 22, 24, 0.78)',
    paddingHorizontal: spacing.base,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  viewfinderHint: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: '#F5F5F7',
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 36,
    paddingHorizontal: spacing.xxl,
  },
  galleryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
  },
  galleryIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(22, 22, 24, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryButtonText: {
    fontSize: typography.fontSizes.caption2,
    fontWeight: typography.fontWeights.semibold,
    color: '#F5F5F7',
    marginTop: 5,
  },
  shutterButtonOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  shutterButtonInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#30D158',
  },
  placeholderButton: {
    width: 64,
  },
  previewContainer: {
    paddingVertical: spacing.lg,
  },
  previewTitle: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.black,
    letterSpacing: -0.6,
  },
  previewSubtitle: {
    fontSize: typography.fontSizes.subhead,
    marginTop: 3,
    marginBottom: spacing.base,
  },
  previewImageWrapper: {
    height: 380,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
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
  permissionIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  permissionTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: spacing.xs,
  },
  permissionSubtitle: {
    fontSize: typography.fontSizes.subhead,
    textAlign: 'center',
    lineHeight: typography.lineHeights.subhead,
    marginBottom: spacing.xl,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: spacing.base,
  },
});
