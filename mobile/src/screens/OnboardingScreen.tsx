import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  ShieldCheck,
  User,
  Camera,
  LogIn,
  Mail,
  Sparkles,
  CheckCircle,
  FileText,
  Lock,
} from 'lucide-react-native';
import { EatInformedLogo } from '../components/EatInformedLogo';
import { Button } from '../components/Button';
import { Card, CardContent } from '../components/Card';
import { useTheme } from '../theme/ThemeContext';
import { AppHaptics } from '../lib/haptics';
import {
  saveUserSession,
  signInAsGuest,
  signInWithGoogle,
  authenticateWithBackend,
  normalizeHandle,
  UserSessionData,
} from '../lib/auth';
import { spacing, typography, borderRadius } from '../theme/tokens';
import { FadeInView, PressableScale } from '../theme/animations';

export const ONBOARDING_STORAGE_KEY = '@eatinformed_onboarding_completed_v1';

interface OnboardingScreenProps {
  onComplete: () => void | Promise<void>;
}

type AuthMode = 'select' | 'email-signin' | 'email-signup';

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [step, setStep] = useState<number>(1);
  const [authMode, setAuthMode] = useState<AuthMode>('select');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [handle, setHandle] = useState<string>('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [session, setSession] = useState<UserSessionData | null>(null);

  const isGuest = session?.isAnonymous ?? false;

  const handleNextFromWelcome = () => {
    AppHaptics.selection();
    setStep(2);
  };

  const handleGuestChoice = async () => {
    AppHaptics.selection();
    setLoading(true);
    setErrorMessage(null);
    try {
      const guestSession = await signInAsGuest();
      setSession(guestSession);
      setDisplayName('Guest Explorer');
      setHandle('guest');
      setPhotoUri(null);
      setStep(3);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Could not initialize guest session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleChoice = async () => {
    AppHaptics.selection();
    setLoading(true);
    setErrorMessage(null);
    try {
      const googleSession = await signInWithGoogle();
      setSession(googleSession);
      setDisplayName(googleSession.name || 'Member');
      setHandle(normalizeHandle(googleSession.email || 'member'));
      setPhotoUri(googleSession.photoUrl || null);
      setStep(3);
    } catch (e: any) {
      if (!e.message?.includes('cancelled')) {
        setErrorMessage(e.message || 'Google sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuthSubmit = async (type: 'signIn' | 'signUp') => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    AppHaptics.selection();
    setLoading(true);
    setErrorMessage(null);
    try {
      const authSession = await authenticateWithBackend(email.trim(), password, type);
      setSession(authSession);
      setDisplayName(authSession.name || email.split('@')[0]);
      setHandle(normalizeHandle(email.trim()));
      setPhotoUri(null);
      setStep(3);
    } catch (e: any) {
      setErrorMessage(e.message || 'Authentication failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  const handlePickAvatar = async () => {
    if (isGuest) return;
    AppHaptics.selection();
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Photo Picker', 'Could not open photo library. Please check permissions.');
    }
  };

  const handleFinishOnboarding = async () => {
    AppHaptics.success();
    setLoading(true);
    try {
      const finalEmail = session?.email || (isGuest ? '' : email.trim());
      const finalName = displayName.trim() || (isGuest ? 'Guest Explorer' : 'Member');
      const finalHandle = isGuest ? 'guest' : normalizeHandle(handle);
      const finalToken = session?.token;

      await saveUserSession(
        finalEmail,
        finalName,
        finalToken,
        isGuest,
        photoUri || undefined,
        finalHandle,
        []
      );

      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      await onComplete();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Could not finish setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Navigation Header for Steps > 1 */}
      {step > 1 && (
        <View style={[styles.navHeader, { paddingTop: Math.max(insets.top, 16) }]}>
          <PressableScale
            onPress={() => {
              AppHaptics.selection();
              if (authMode !== 'select' && step === 2) {
                setAuthMode('select');
                setErrorMessage(null);
              } else {
                setStep((prev) => Math.max(1, prev - 1));
                setErrorMessage(null);
              }
            }}
            style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={20} color={colors.text} />
          </PressableScale>

          <View style={styles.stepIndicatorRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <View
                key={i}
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: i === step ? colors.primary : i < step ? colors.primaryDark : colors.border,
                    width: i === step ? 20 : 6,
                  },
                ]}
              />
            ))}
          </View>

          <View style={{ width: 36 }} />
        </View>
      )}

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: step === 1 ? insets.top + 36 : 16,
            paddingBottom: insets.bottom + 36,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* STEP 1: WELCOME SCREEN */}
        {step === 1 && (
          <FadeInView delay={0} style={styles.stepContainer}>
            <View style={styles.logoHeroWrapper}>
              <View style={[styles.logoCircle, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
                <EatInformedLogo size={56} />
              </View>
            </View>

            <Text style={[styles.mainHeading, { color: colors.text }]}>
              Food clarity for what you eat.
            </Text>

            <Text style={[styles.leadDescription, { color: colors.textSecondary }]}>
              Scan any ingredient label or nutrition panel for objective NOVA food processing classifications, additive warnings, and personalized allergen alerts.
            </Text>

            <View style={styles.featuresList}>
              <View style={[styles.featureCard, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
                <View style={[styles.featureIconWrap, { backgroundColor: colors.primaryMuted }]}>
                  <ShieldCheck size={20} color={colors.primary} />
                </View>
                <View style={styles.featureTextWrap}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>NOVA Classification</Text>
                  <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                    Detect ultra-processed formulations and additives instantly.
                  </Text>
                </View>
              </View>

              <View style={[styles.featureCard, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
                <View style={[styles.featureIconWrap, { backgroundColor: colors.warningLight }]}>
                  <Shield size={20} color={colors.warning} />
                </View>
                <View style={styles.featureTextWrap}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>Allergen Protection</Text>
                  <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                    Flag allergens and synthetic preservatives in real time.
                  </Text>
                </View>
              </View>

              <View style={[styles.featureCard, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
                <View style={[styles.featureIconWrap, { backgroundColor: colors.infoLight }]}>
                  <FileText size={20} color={colors.info} />
                </View>
                <View style={styles.featureTextWrap}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>Nutrition Passport</Text>
                  <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                    Keep a clean, private log of your diet quality on your device.
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.bottomCtaRow}>
              <PressableScale
                onPress={handleNextFromWelcome}
                style={[styles.primaryWhiteButton, { backgroundColor: '#FFFFFF' }]}
                scaleTo={0.97}
              >
                <Text style={styles.primaryWhiteButtonText}>Continue</Text>
                <ChevronRight size={18} color="#000000" />
              </PressableScale>
            </View>
          </FadeInView>
        )}

        {/* STEP 2: AUTHENTICATION SCREEN */}
        {step === 2 && (
          <FadeInView delay={0} style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              Create your account
            </Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              Use your existing website account to sign in, or create a new account to sync scans across devices.
            </Text>

            {errorMessage && (
              <View style={[styles.errorBox, { backgroundColor: colors.dangerLight, borderColor: colors.dangerBorder }]}>
                <Text style={[styles.errorText, { color: colors.dangerText }]}>{errorMessage}</Text>
              </View>
            )}

            {authMode === 'select' ? (
              <View style={styles.authChoicesCol}>
                <PressableScale
                  onPress={handleGoogleChoice}
                  disabled={loading}
                  style={[styles.authChoiceBtn, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}
                  scaleTo={0.98}
                >
                  <Sparkles size={20} color="#4285F4" />
                  <Text style={[styles.authChoiceText, { color: colors.text }]}>
                    Continue with Google
                  </Text>
                </PressableScale>

                <PressableScale
                  onPress={() => {
                    AppHaptics.selection();
                    setAuthMode('email-signin');
                    setErrorMessage(null);
                  }}
                  disabled={loading}
                  style={[styles.authChoiceBtn, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}
                  scaleTo={0.98}
                >
                  <Mail size={20} color={colors.primary} />
                  <Text style={[styles.authChoiceText, { color: colors.text }]}>
                    Sign in with Email
                  </Text>
                </PressableScale>

                <PressableScale
                  onPress={() => {
                    AppHaptics.selection();
                    setAuthMode('email-signup');
                    setErrorMessage(null);
                  }}
                  disabled={loading}
                  style={[styles.authChoiceBtn, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}
                  scaleTo={0.98}
                >
                  <LogIn size={20} color={colors.text} />
                  <Text style={[styles.authChoiceText, { color: colors.text }]}>
                    Create an Email Account
                  </Text>
                </PressableScale>

                <View style={styles.dividerRow}>
                  <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                  <Text style={[styles.dividerLabel, { color: colors.textMuted }]}>or</Text>
                  <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                </View>

                <PressableScale
                  onPress={handleGuestChoice}
                  disabled={loading}
                  style={[styles.guestChoiceBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  scaleTo={0.98}
                >
                  <User size={18} color={colors.textSecondary} />
                  <Text style={[styles.guestChoiceText, { color: colors.textSecondary }]}>
                    Continue as Guest (4 scans per 2 hours)
                  </Text>
                </PressableScale>

                {loading && (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Setting up session...</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.emailFormWrapper}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>EMAIL ADDRESS</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={[styles.inputField, { backgroundColor: colors.surfaceRaised, borderColor: colors.border, color: colors.text }]}
                />

                <Text style={[styles.formLabel, { color: colors.textSecondary, marginTop: 14 }]}>PASSWORD</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 6 characters"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  style={[styles.inputField, { backgroundColor: colors.surfaceRaised, borderColor: colors.border, color: colors.text }]}
                />

                <Button
                  title={loading ? 'Verifying...' : authMode === 'email-signin' ? 'Sign In' : 'Create Account'}
                  onPress={() => handleEmailAuthSubmit(authMode === 'email-signin' ? 'signIn' : 'signUp')}
                  variant="primary"
                  size="lg"
                  disabled={loading}
                  style={{ marginTop: 20 }}
                />

                <Pressable
                  onPress={() => {
                    AppHaptics.selection();
                    setAuthMode(authMode === 'email-signin' ? 'email-signup' : 'email-signin');
                    setErrorMessage(null);
                  }}
                  style={styles.switchModePressable}
                >
                  <Text style={[styles.switchModeText, { color: colors.textSecondary }]}>
                    {authMode === 'email-signin'
                      ? 'New user? Create an email account'
                      : 'Already have an account? Sign in'}
                  </Text>
                </Pressable>
              </View>
            )}
          </FadeInView>
        )}

        {/* STEP 3: CHOOSE HANDLE */}
        {step === 3 && (
          <FadeInView delay={0} style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              What should we call you?
            </Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              Your display name and username represent your bio-identity on your nutrition passport.
            </Text>

            <View style={styles.fieldSection}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>DISPLAY NAME</Text>
              <View style={[styles.handleRow, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Your Name"
                  placeholderTextColor={colors.textMuted}
                  editable={!isGuest}
                  style={[
                    styles.handleInput,
                    {
                      color: colors.text,
                      opacity: isGuest ? 0.75 : 1,
                      paddingLeft: 14,
                    },
                  ]}
                />
                {isGuest && <Lock size={16} color={colors.textMuted} style={{ marginRight: 12 }} />}
              </View>

              <Text style={[styles.formLabel, { color: colors.textSecondary, marginTop: 16 }]}>HANDLE</Text>
              <View style={[styles.handleRow, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
                <Text style={[styles.handlePrefix, { color: colors.primary }]}>@</Text>
                <TextInput
                  value={handle}
                  onChangeText={(val) => {
                    if (!isGuest) {
                      setHandle(normalizeHandle(val));
                    }
                  }}
                  placeholder="username"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  editable={!isGuest}
                  style={[
                    styles.handleInput,
                    {
                      color: colors.text,
                      opacity: isGuest ? 0.75 : 1,
                    },
                  ]}
                />
                {isGuest && <Lock size={16} color={colors.textMuted} style={{ marginRight: 12 }} />}
              </View>

              {isGuest ? (
                <View style={styles.guestNoticeWrapper}>
                  <Text style={[styles.helperNotice, { color: colors.textMuted }]}>
                    Sign up with Google or email to choose your name and handle, customize your profile, and unlock higher scan limits.
                  </Text>
                  <PressableScale
                    onPress={() => {
                      AppHaptics.selection();
                      setStep(2);
                      setAuthMode('select');
                    }}
                    style={styles.guestUpgradeLinkRow}
                  >
                    <Sparkles size={14} color={colors.primary} />
                    <Text style={[styles.guestUpgradeLinkText, { color: colors.primary }]}>
                      Create an account or sign in
                    </Text>
                  </PressableScale>
                </View>
              ) : (
                <Text style={[styles.helperNotice, { color: colors.textMuted }]}>
                  Only letters, numbers, and underscores. Special characters are removed automatically.
                </Text>
              )}
            </View>

            <View style={styles.nextButtonWrapper}>
              <Button
                title="Continue"
                onPress={() => {
                  AppHaptics.selection();
                  setStep(4);
                }}
                variant="primary"
                size="lg"
                icon={<ChevronRight size={18} color={colors.onPrimary} />}
              />
            </View>
          </FadeInView>
        )}

        {/* STEP 4: CHOOSE AVATAR */}
        {step === 4 && (
          <FadeInView delay={0} style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              Choose your avatar
            </Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              Personalize the photo that appears on your Food Passport.
            </Text>

            <View style={styles.avatarPreviewCenter}>
              <PressableScale
                onPress={handlePickAvatar}
                disabled={isGuest}
                style={[
                  styles.avatarLargeCircle,
                  {
                    backgroundColor: colors.surfaceRaised,
                    borderColor: photoUri ? colors.primary : colors.border,
                  },
                ]}
                scaleTo={isGuest ? 1 : 0.95}
              >
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.avatarImageLarge} />
                ) : (
                  <View style={styles.avatarPlaceholderInner}>
                    <User size={48} color={colors.primary} />
                  </View>
                )}

                {isGuest ? (
                  <View style={[styles.cameraBadgeCircle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Lock size={14} color={colors.textMuted} />
                  </View>
                ) : (
                  <View style={[styles.cameraBadgeCircle, { backgroundColor: colors.primary, borderColor: colors.background }]}>
                    <Camera size={14} color={colors.onPrimary} />
                  </View>
                )}
              </PressableScale>

              <Text style={[styles.avatarTipText, { color: colors.textSecondary }]}>
                {isGuest
                  ? 'Guest avatars are fixed to standard bio-pass glyphs. Account creation unlocks full avatar customization.'
                  : photoUri
                  ? 'Tap avatar to choose a different photo'
                  : 'Tap circle to pick a profile photo'}
              </Text>
            </View>

            <View style={styles.nextButtonWrapper}>
              <Button
                title="Continue to Review"
                onPress={() => {
                  AppHaptics.selection();
                  setStep(5);
                }}
                variant="primary"
                size="lg"
                icon={<ChevronRight size={18} color={colors.onPrimary} />}
              />
            </View>
          </FadeInView>
        )}

        {/* STEP 5: READY TO BEGIN */}
        {step === 5 && (
          <FadeInView delay={0} style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              You are ready to explore
            </Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              Review your profile information. You can edit your settings or scan food labels right away.
            </Text>

            <Card style={{ marginVertical: spacing.md }}>
              <CardContent>
                <View style={styles.reviewAvatarRow}>
                  <View style={[styles.reviewAvatarCircle, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
                    {photoUri ? (
                      <Image source={{ uri: photoUri }} style={styles.reviewAvatarImg} />
                    ) : (
                      <User size={28} color={colors.primary} />
                    )}
                  </View>

                  <View style={styles.reviewMetaCol}>
                    <Text style={[styles.reviewName, { color: colors.text }]}>{displayName || 'Member'}</Text>
                    <Text style={[styles.reviewHandle, { color: colors.primary }]}>@{handle || 'member'}</Text>
                    <Text style={[styles.reviewTier, { color: colors.textSecondary }]}>
                      {isGuest ? 'Guest Explorer (4 scans / 2 hr)' : 'Verified Member (50 scans / hr)'}
                    </Text>
                  </View>
                </View>

                <View style={[styles.reviewFeatureList, { borderTopColor: colors.separator }]}>
                  <View style={styles.reviewFeatureRow}>
                    <CheckCircle size={16} color={colors.primary} />
                    <Text style={[styles.reviewFeatureText, { color: colors.text }]}>
                      NOVA Food Processing Classification
                    </Text>
                  </View>
                  <View style={styles.reviewFeatureRow}>
                    <CheckCircle size={16} color={colors.primary} />
                    <Text style={[styles.reviewFeatureText, { color: colors.text }]}>
                      Clinical Additive Dictionary & Offline Cache
                    </Text>
                  </View>
                  <View style={styles.reviewFeatureRow}>
                    <CheckCircle size={16} color={colors.primary} />
                    <Text style={[styles.reviewFeatureText, { color: colors.text }]}>
                      Private On-Device Scan History
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            <View style={styles.nextButtonWrapper}>
              <Button
                title={loading ? 'Starting...' : 'Get Started'}
                onPress={handleFinishOnboarding}
                variant="primary"
                size="lg"
                disabled={loading}
                icon={<Sparkles size={18} color={colors.onPrimary} />}
              />
            </View>
          </FadeInView>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepDot: {
    height: 6,
    borderRadius: 3,
  },
  scrollContent: {
    paddingHorizontal: 22,
  },
  stepContainer: {
    flex: 1,
  },
  logoHeroWrapper: {
    alignItems: 'center',
    marginVertical: 24,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainHeading: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.6,
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 12,
  },
  leadDescription: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
  },
  featuresList: {
    gap: 12,
    marginBottom: 32,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  bottomCtaRow: {
    marginTop: 8,
    alignItems: 'center',
  },
  primaryWhiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryWhiteButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  authChoicesCol: {
    gap: 12,
  },
  authChoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  authChoiceText: {
    fontSize: 15,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  guestChoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
  },
  guestChoiceText: {
    fontSize: 13,
    fontWeight: '500',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  loadingText: {
    fontSize: 13,
  },
  emailFormWrapper: {
    gap: 6,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  inputField: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  switchModePressable: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  switchModeText: {
    fontSize: 13,
  },
  fieldSection: {
    gap: 6,
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingLeft: 14,
  },
  handlePrefix: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 4,
  },
  handleInput: {
    flex: 1,
    fontSize: 15,
    height: 48,
  },
  helperNotice: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 6,
  },
  nextButtonWrapper: {
    marginTop: 32,
  },
  avatarPreviewCenter: {
    alignItems: 'center',
    marginVertical: 24,
  },
  avatarLargeCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  avatarImageLarge: {
    width: 114,
    height: 114,
    borderRadius: 57,
  },
  avatarPlaceholderInner: {
    width: 114,
    height: 114,
    borderRadius: 57,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadgeCircle: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTipText: {
    fontSize: 13,
    marginTop: 14,
    textAlign: 'center',
  },
  reviewAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  reviewAvatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewAvatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  reviewMetaCol: {
    flex: 1,
  },
  reviewName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  reviewHandle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  reviewTier: {
    fontSize: 12,
  },
  reviewFeatureList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    gap: 8,
  },
  reviewFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewFeatureText: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  errorBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
  },
  guestNoticeWrapper: {
    marginTop: 4,
  },
  guestUpgradeLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 4,
  },
  guestUpgradeLinkText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
