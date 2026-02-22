import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LPColors } from '../../constants/theme';
import { AuthContext } from '../../context/AuthContext';
import API, { createDuoApi, getDuoStatusApi, joinDuoApi } from '../../services/api';
import { LPHaptics } from '../../services/haptics';

const { width: W } = Dimensions.get('window');

interface SignupResponse {
  user: any;
  token: string;
}

export default function DuoPairingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const auth: any = useContext(AuthContext);

  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [signupError, setSignupError] = useState('');
  const [creatingDuo, setCreatingDuo] = useState(false);
  const [joiningDuo, setJoiningDuo] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  // Get signup data from params
  const signupData = params.signupData ? JSON.parse(params.signupData as string) : null;

  // Create account if needed (Duo flow requires account before pairing)
  const ensureAccount = useCallback(async () => {
    if (signupData && !auth.token) {
      console.log('[DuoPairing] Creating account for duo mode...');
      try {
        const payload = {
          ...signupData,
          appMode: 'duo',
          // isSmoker will be determined in questionnaire for duo mode
        };
        const res = await API.post<SignupResponse>('/auth/signup', payload);
        const { user, token } = res.data;
        await auth.loginUser(user, token);
        console.log('[DuoPairing] Account created successfully');
        setSignupError('');
        return true;
      } catch (err: any) {
        console.error('[DuoPairing] Account creation failed:', err.response?.data || err.message);
        setSignupError(err.response?.data?.message || 'Failed to create account');
        return false;
      }
    }
    setSignupError('');
    return true; // Already has account
  }, [signupData, auth]);

  // Check if user already has a duo
  const checkDuoStatus = useCallback(async () => {
    // First ensure account exists
    const hasAccount = await ensureAccount();
    if (!hasAccount) {
      setLoading(false);
      return;
    }

    try {
      const res = await getDuoStatusApi();
      const data: any = res.data;
      
      if (data.hasDuo && data.status === 'active') {
        // Already in active duo, go to next step
        LPHaptics.success();
        navigateToNext();
        return;
      }
      
      if (data.hasDuo && data.status === 'pending' && data.inviteCode) {
        // Has pending invite code
        setInviteCode(data.inviteCode);
      }
    } catch (err) {
      console.error('Error checking duo status:', err);
    } finally {
      setLoading(false);
    }
  }, [ensureAccount]);

  useEffect(() => {
    checkDuoStatus();
  }, [checkDuoStatus]);

  // Navigate to next step in duo onboarding flow
  const navigateToNext = () => {
    router.push({
      pathname: '/onboarding/health-sync-setup',
      params: { 
        appMode: 'duo',
        // isSmoker not known yet for duo, will be determined in questionnaire
      },
    });
  };

  const handleCreateDuo = async () => {
    setCreatingDuo(true);
    try {
      const res = await createDuoApi();
      const code = (res.data as any).inviteCode;
      setInviteCode(code);
      LPHaptics.success();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create duo');
      LPHaptics.error();
    } finally {
      setCreatingDuo(false);
    }
  };

  const handleJoinDuo = async () => {
    if (joinCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a 6-character invite code');
      return;
    }

    setJoiningDuo(true);
    try {
      const res = await joinDuoApi(joinCode.toUpperCase());
      LPHaptics.success();
      setShowJoinModal(false);
      Alert.alert(
        '🎉 Duo Activated!',
        `You and ${(res.data as any).partner?.name} are now partners! Let's grow your plant together.`,
        [{ text: 'Let\'s Go!', onPress: navigateToNext }]
      );
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to join duo');
      LPHaptics.error();
    } finally {
      setJoiningDuo(false);
    }
  };

  const handleShareCode = async () => {
    if (!inviteCode) return;
    LPHaptics.selection();
    await Share.share({
      message: `🌱 Join my health journey on Navjivan!\n\nUse my duo invite code: ${inviteCode}\n\nLet's grow a plant together and support each other!`,
    });
  };

  const handleQRScanned = ({ data }: { data: string }) => {
    if (scanned) return; // Prevent multiple scans
    setScanned(true);
    setShowScanner(false);
    LPHaptics.light();
    
    // Check for NAVJIVAN format: NAVJIVAN:XXXXXX
    if (data.startsWith('NAVJIVAN:')) {
      const code = data.replace('NAVJIVAN:', '').toUpperCase().trim();
      if (code.length === 6) {
        setJoinCode(code);
        setShowJoinModal(true);
        return;
      }
    }
    
    // Fallback: try to extract any 6-char alphanumeric code
    const code = data.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    if (code.length === 6) {
      setJoinCode(code);
      setShowJoinModal(true);
    } else {
      Alert.alert('Invalid QR', 'The scanned QR code is not a valid Navjivan invite code');
    }
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is needed to scan QR codes');
        return;
      }
    }
    setScanned(false);
    setShowScanner(true);
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Pairing?',
      'You can pair with a partner later from the Duo section.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', onPress: navigateToNext },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={LPColors.primary} />
        <Text style={styles.loadingText}>Checking duo status...</Text>
        {signupError ? (
          <View style={{ marginTop: 24 }}>
            <Text style={{ color: '#FF6B6B', fontWeight: 'bold', fontSize: 16 }}>{signupError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => { setSignupError(''); setLoading(true); checkDuoStatus(); }}>
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.header}>
          <Text style={styles.title}>Duo Pairing</Text>
          <Text style={styles.subtitle}>
            Connect with your partner to grow a shared plant together
          </Text>
        </Animated.View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Create/Show Invite Code Section */}
          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.section}>
            <Text style={styles.sectionTitle}>Share Your Code</Text>
            <Text style={styles.sectionDesc}>
              Create an invite code and share it with your partner
            </Text>

            {inviteCode ? (
              <View style={styles.codeContainer}>
                {/* QR Code */}
                <View style={styles.qrContainer}>
                  <QRCode
                    value={`NAVJIVAN:${inviteCode}`}
                    size={180}
                    backgroundColor="#FFF"
                    color="#000"
                  />
                </View>

                {/* Text Code */}
                <View style={styles.textCodeContainer}>
                  <Text style={styles.codeLabel}>Invite Code</Text>
                  <Text style={styles.codeText}>{inviteCode}</Text>
                </View>

                {/* Share Button */}
                <TouchableOpacity style={styles.shareButton} onPress={handleShareCode}>
                  <LinearGradient
                    colors={[LPColors.primary, '#E85D5D']}
                    style={styles.shareGradient}
                  >
                    <Ionicons name="share-outline" size={20} color="#FFF" />
                    <Text style={styles.shareText}>Share Code</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.waitingText}>
                  Waiting for your partner to join...
                </Text>
                
                {/* Refresh button */}
                <TouchableOpacity style={styles.refreshButton} onPress={checkDuoStatus}>
                  <Ionicons name="refresh" size={18} color={LPColors.primary} />
                  <Text style={styles.refreshText}>Check Status</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateDuo}
                disabled={creatingDuo}
              >
                <LinearGradient
                  colors={['#8E44AD', '#9B59B6']}
                  style={styles.createGradient}
                >
                  {creatingDuo ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="qr-code-outline" size={24} color="#FFF" />
                      <Text style={styles.createText}>Generate Invite Code</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Join Section */}
          <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.section}>
            <Text style={styles.sectionTitle}>Join a Partner</Text>
            <Text style={styles.sectionDesc}>
              Scan your partner's QR code or enter their invite code
            </Text>

            <View style={styles.joinButtons}>
              <TouchableOpacity
                style={styles.joinButton}
                onPress={openScanner}
              >
                <Ionicons name="scan-outline" size={28} color={LPColors.primary} />
                <Text style={styles.joinButtonText}>Scan QR</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.joinButton}
                onPress={() => setShowJoinModal(true)}
              >
                <Ionicons name="keypad-outline" size={28} color={LPColors.primary} />
                <Text style={styles.joinButtonText}>Enter Code</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>

        {/* Skip Button */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* QR Scanner Modal */}
      <Modal visible={showScanner} animationType="slide">
        <View style={styles.scannerContainer}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.scannerHeader}>
              <TouchableOpacity onPress={() => { setShowScanner(false); setScanned(false); }}>
                <Ionicons name="close" size={28} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.scannerTitle}>Scan QR Code</Text>
              <View style={{ width: 28 }} />
            </View>

            <View style={styles.cameraContainer}>
              <CameraView
                style={styles.camera}
                barcodeScannerSettings={{
                  barcodeTypes: ['qr'],
                }}
                onBarcodeScanned={scanned ? undefined : handleQRScanned}
              />
              <View style={styles.scanOverlay}>
                <View style={styles.scanFrame} />
              </View>
            </View>

            <Text style={styles.scanHint}>
              Point your camera at your partner's QR code
            </Text>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Join Code Modal */}
      <Modal visible={showJoinModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeIn.duration(200)} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Invite Code</Text>
            <Text style={styles.modalDesc}>
              Enter the 6-character code from your partner
            </Text>

            <TextInput
              style={styles.codeInput}
              value={joinCode}
              onChangeText={(text) => setJoinCode(text.toUpperCase())}
              placeholder="ABC123"
              placeholderTextColor={LPColors.textGray}
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowJoinModal(false);
                  setJoinCode('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalJoinButton, joinCode.length !== 6 && styles.modalButtonDisabled]}
                onPress={handleJoinDuo}
                disabled={joiningDuo || joinCode.length !== 6}
              >
                {joiningDuo ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.modalJoinText}>Join Duo</Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LPColors.bg,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: LPColors.textGray,
    marginTop: 12,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: LPColors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: LPColors.textGray,
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: LPColors.text,
    marginBottom: 6,
  },
  sectionDesc: {
    fontSize: 14,
    color: LPColors.textGray,
    marginBottom: 16,
  },
  codeContainer: {
    alignItems: 'center',
    backgroundColor: LPColors.surface,
    borderRadius: 16,
    padding: 20,
  },
  qrContainer: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  textCodeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  codeLabel: {
    fontSize: 12,
    color: LPColors.textGray,
    marginBottom: 4,
  },
  codeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: LPColors.primary,
    letterSpacing: 4,
  },
  shareButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  shareGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    gap: 8,
  },
  shareText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  waitingText: {
    fontSize: 13,
    color: LPColors.textGray,
    marginTop: 16,
    fontStyle: 'italic',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    padding: 8,
  },
  refreshText: {
    color: LPColors.primary,
    fontSize: 14,
  },
  createButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  createGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 10,
  },
  createText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: LPColors.border,
  },
  dividerText: {
    color: LPColors.textGray,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  joinButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  joinButton: {
    flex: 1,
    backgroundColor: LPColors.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LPColors.border,
  },
  joinButtonText: {
    color: LPColors.text,
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
  },
  skipButton: {
    alignItems: 'center',
    padding: 16,
  },
  skipText: {
    color: LPColors.textGray,
    fontSize: 15,
  },
  // Scanner Modal
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  scannerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: LPColors.primary,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  scanHint: {
    color: '#FFF',
    textAlign: 'center',
    padding: 20,
    fontSize: 15,
  },
  // Join Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: LPColors.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: LPColors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    color: LPColors.textGray,
    textAlign: 'center',
    marginBottom: 20,
  },
  codeInput: {
    backgroundColor: LPColors.bg,
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: 'bold',
    color: LPColors.text,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: LPColors.bg,
    alignItems: 'center',
  },
  modalCancelText: {
    color: LPColors.textGray,
    fontSize: 16,
    fontWeight: '500',
  },
  modalJoinButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: LPColors.primary,
    alignItems: 'center',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalJoinText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: LPColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
  },
});
