import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  User,
  Shield,
  Server,
  Sparkles,
  ExternalLink,
  LogOut,
  LogIn,
  CheckCircle,
  XCircle,
  HelpCircle,
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { colors } from '../theme/colors';
import { borderRadius, spacing, typography } from '../theme/tokens';
import { checkApiHealth } from '../api/client';
import { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [serverMessage, setServerMessage] = useState<string>('Checking server status...');
  const [isCheckingServer, setIsCheckingServer] = useState(false);

  // In production, real auth status loaded from SecureStore/Firebase
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const checkBackend = async () => {
    setIsCheckingServer(true);
    const health = await checkApiHealth();
    setServerOnline(health.ok);
    setServerMessage(health.message);
    setIsCheckingServer(false);
  };

  useEffect(() => {
    checkBackend();
  }, []);

  const handleAuthAction = () => {
    if (isLoggedIn) {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: () => {
              setIsLoggedIn(false);
              setUserEmail(null);
            },
          },
        ]
      );
    } else {
      navigation.navigate('Auth', { initialTab: 'login' });
    }
  };

  return (
    <Screen scrollable>
      <View style={styles.header}>
        <Text style={styles.title}>Account & System</Text>
      </View>

      {/* User Card */}
      <Card style={styles.userCard}>
        <CardContent>
          <View style={styles.userRow}>
            <View style={styles.avatarCircle}>
              <User size={30} color={colors.primary} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {isLoggedIn ? (userEmail?.split('@')[0] || 'User') : 'Guest Explorer'}
              </Text>
              <Text style={styles.userEmail}>
                {isLoggedIn ? userEmail : 'Local guest session (free scanning)'}
              </Text>
              <View style={{ marginTop: 6 }}>
                <Badge
                  label={isLoggedIn ? 'Registered Member' : 'Guest Mode'}
                  variant={isLoggedIn ? 'primary' : 'default'}
                  size="sm"
                />
              </View>
            </View>
          </View>

          <Button
            title={isLoggedIn ? 'Sign Out' : 'Sign In / Register'}
            onPress={handleAuthAction}
            variant={isLoggedIn ? 'secondary' : 'primary'}
            size="md"
            icon={
              isLoggedIn ? (
                <LogOut size={16} color={colors.text} />
              ) : (
                <LogIn size={16} color="#000000" />
              )
            }
            style={styles.authButton}
          />
        </CardContent>
      </Card>

      {/* Backend & AI Service Status Card */}
      <Card>
        <CardHeader
          title="Backend AI Status"
          subtitle="Connection to EatInformed Vision & Reasoning API"
        />
        <CardContent>
          <View style={styles.statusRow}>
            <View style={styles.statusIndicator}>
              {serverOnline === null ? (
                <View style={[styles.statusDot, { backgroundColor: colors.warning }]} />
              ) : serverOnline ? (
                <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
              ) : (
                <View style={[styles.statusDot, { backgroundColor: colors.danger }]} />
              )}
              <Text style={styles.statusText}>
                {serverOnline === null
                  ? 'Checking...'
                  : serverOnline
                  ? 'API Online and Responsive'
                  : 'Backend Offline'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={checkBackend}
              style={styles.recheckButton}
              activeOpacity={0.8}
            >
              <Text style={styles.recheckText}>Check</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.statusDetail}>{serverMessage}</Text>
        </CardContent>
      </Card>

      {/* Architecture & AI Engine Info */}
      <Card>
        <CardHeader title="AI Engine Architecture" />
        <CardContent>
          <View style={styles.techItem}>
            <Sparkles size={16} color={colors.primary} style={styles.techIcon} />
            <View style={styles.techTextContainer}>
              <Text style={styles.techTitle}>OCR & Label Extraction</Text>
              <Text style={styles.techSubtitle}>
                Meta Llama 3.2 11B Vision Instruct via NVIDIA NIM
              </Text>
            </View>
          </View>

          <View style={styles.techItem}>
            <Shield size={16} color={colors.info} style={styles.techIcon} />
            <View style={styles.techTextContainer}>
              <Text style={styles.techTitle}>Nutritional Reasoning</Text>
              <Text style={styles.techSubtitle}>
                DeepSeek V4 Pro Clinical Nutrition Model
              </Text>
            </View>
          </View>

          <View style={styles.techItem}>
            <Server size={16} color={colors.warning} style={styles.techIcon} />
            <View style={styles.techTextContainer}>
              <Text style={styles.techTitle}>Classification System</Text>
              <Text style={styles.techSubtitle}>
                International NOVA Food Processing Classification (Groups 1-4)
              </Text>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* App Version Info */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>EatInformed Android App v1.0.0</Text>
        <Text style={styles.versionSubtext}>Production-conscious AI Food Nutrition</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: spacing.lg,
  },
  title: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  userCard: {
    backgroundColor: colors.surfaceRaised,
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  userEmail: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  authButton: {
    width: '100%',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  statusText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
  },
  recheckButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recheckText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
  },
  statusDetail: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    marginTop: 4,
  },
  techItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  techIcon: {
    marginRight: spacing.md,
    marginTop: 2,
  },
  techTextContainer: {
    flex: 1,
  },
  techTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
  },
  techSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingBottom: 40,
  },
  versionText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textMuted,
  },
  versionSubtext: {
    fontSize: typography.fontSizes.xs,
    color: colors.borderStrong,
    marginTop: 2,
  },
});
