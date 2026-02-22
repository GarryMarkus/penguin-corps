import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LPColors } from '../../constants/theme';
import { isHealthSyncAvailable, syncHealthData, initializeHealthConnect, requestHealthConnectPermissions, initializeHealthKit } from '../../services/healthSync';
import { LPHaptics } from '../../services/haptics';

const { width: W } = Dimensions.get('window');

const HEALTH_APPS = [
  { id: 'googlefit', name: 'Google Fit', icon: 'google-fit', color: '#4285F4', platform: 'android' },
  { id: 'samsung', name: 'Samsung Health', icon: 'heart-pulse', color: '#1428A0', platform: 'android' },
  { id: 'fitbit', name: 'Fitbit', icon: 'watch', color: '#00B0B9', platform: 'android' },
  { id: 'garmin', name: 'Garmin', icon: 'watch-variant', color: '#007DC3', platform: 'android' },
  { id: 'apple', name: 'Apple Health', icon: 'apple', color: '#FF3B30', platform: 'ios' },
  { id: 'applewatch', name: 'Apple Watch', icon: 'watch', color: '#5AC8FA', platform: 'ios' },
];

export default function HealthSyncSetupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [checking, setChecking] = useState(true);
  const [available, setAvailable] = useState(false);
  const [source, setSource] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [syncResult, setSyncResult] = useState<{ steps: number; calories: number } | null>(null);

  // Get params from navigation
  const isSmoker = params.isSmoker === 'true';
  const appMode = params.appMode as string || 'solo';

  // Determine next screen based on mode and smoker status
  const navigateToNext = () => {
    if (appMode === 'duo') {
      // Duo mode: always go to hotspot selection (both partners can add hotspots)
      router.push({
        pathname: '/onboarding/hotspot-selection',
        params: { appMode: 'duo' },
      });
    } else {
      // Solo mode: go to hotspot if smoker, otherwise questionnaire
      if (isSmoker) {
        router.push({
          pathname: '/onboarding/hotspot-selection',
          params: { appMode: 'solo' },
        });
      } else {
        router.push('/onboarding/questionnaire');
      }
    }
  };

  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    try {
      const result = await isHealthSyncAvailable();
      setAvailable(result.available);
      setSource(result.source);
    } catch (error) {
      console.log('Health sync check error:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    LPHaptics.selection();

    try {
      let success = false;

      if (Platform.OS === 'android') {
        const initialized = await initializeHealthConnect();
        if (initialized) {
          success = await requestHealthConnectPermissions();
        }
      } else if (Platform.OS === 'ios') {
        success = await initializeHealthKit();
      }

      if (success) {
        // Save preference
        await AsyncStorage.setItem('@health_sync_enabled', 'true');
        
        // Try to sync initial data
        const data = await syncHealthData();
        if (data) {
          setSyncResult({ steps: data.steps, calories: data.calories });
        }
        
        setConnected(true);
        LPHaptics.success();
        
        // Auto-proceed after short delay
        setTimeout(() => {
          navigateToNext();
        }, 2000);
      } else {
        LPHaptics.error();
        Alert.alert(
          'Connection Failed',
          'Could not connect to health apps. You can set this up later in Settings.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.log('Health connect error:', error);
      LPHaptics.error();
      Alert.alert(
        'Error',
        'Something went wrong. You can set this up later in Settings.',
        [{ text: 'OK' }]
      );
    } finally {
      setConnecting(false);
    }
  };

  const handleSkip = async () => {
    LPHaptics.selection();
    await AsyncStorage.setItem('@health_sync_enabled', 'false');
    navigateToNext();
  };

  const platformApps = HEALTH_APPS.filter(app => app.platform === Platform.OS);

  if (checking) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <LinearGradient colors={['#1A1A2E', '#16213E']} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color={LPColors.primary} />
        <Text style={styles.checkingText}>Checking health app availability...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#1A1A2E', '#16213E']} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.header}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={[LPColors.primary, '#4FFFB0']}
              style={styles.iconGradient}
            >
              <Ionicons name="fitness" size={40} color="#FFF" />
            </LinearGradient>
          </View>
          <Text style={styles.title}>Sync Your Fitness Data</Text>
          <Text style={styles.subtitle}>
            Connect your health apps to automatically track steps, calories, and more
          </Text>
        </Animated.View>

        {/* Available Apps */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.appsSection}>
          <Text style={styles.sectionTitle}>
            {Platform.OS === 'ios' ? 'Apple Health Integration' : 'Health Connect Integration'}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {available 
              ? 'These apps can sync with Navjivan:'
              : 'Health Connect is not available on this device'}
          </Text>

          <View style={styles.appsGrid}>
            {platformApps.map((app, index) => (
              <Animated.View
                key={app.id}
                entering={FadeInDown.delay(400 + index * 100).duration(500)}
                style={[styles.appCard, !available && styles.appCardDisabled]}
              >
                <View style={[styles.appIcon, { backgroundColor: app.color + '20' }]}>
                  <MaterialCommunityIcons name={app.icon as any} size={28} color={app.color} />
                </View>
                <Text style={styles.appName}>{app.name}</Text>
                {connected && <Ionicons name="checkmark-circle" size={18} color={LPColors.primary} />}
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Benefits */}
        <Animated.View entering={FadeInDown.delay(600).duration(600)} style={styles.benefitsSection}>
          <View style={styles.benefitRow}>
            <Ionicons name="footsteps" size={20} color={LPColors.primary} />
            <Text style={styles.benefitText}>Automatic step counting from your device</Text>
          </View>
          <View style={styles.benefitRow}>
            <Ionicons name="flame" size={20} color="#FF6B6B" />
            <Text style={styles.benefitText}>Track calories burned throughout the day</Text>
          </View>
          <View style={styles.benefitRow}>
            <Ionicons name="sync" size={20} color="#74B9FF" />
            <Text style={styles.benefitText}>Sync data from wearables and fitness trackers</Text>
          </View>
        </Animated.View>

        {/* Success State */}
        {connected && syncResult && (
          <Animated.View entering={FadeInDown.duration(500)} style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={32} color={LPColors.primary} />
            <Text style={styles.successTitle}>Connected Successfully!</Text>
            {syncResult.steps > 0 && (
              <Text style={styles.successStats}>
                Today: {syncResult.steps.toLocaleString()} steps • {syncResult.calories} cal
              </Text>
            )}
          </Animated.View>
        )}

        {/* Actions */}
        <Animated.View entering={FadeInDown.delay(800).duration(600)} style={styles.actions}>
          {!connected && (
            <>
              <TouchableOpacity
                style={[styles.connectButton, (!available || connecting) && styles.buttonDisabled]}
                onPress={handleConnect}
                disabled={!available || connecting}
              >
                {connecting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="link" size={22} color="#FFF" />
                    <Text style={styles.connectButtonText}>
                      {available ? 'Connect Health Apps' : 'Not Available'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipButtonText}>Skip for Now</Text>
                <Text style={styles.skipSubtext}>You can set this up later in Settings</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safe: {
    flex: 1,
    width: '100%',
  },
  checkingText: {
    color: '#A0AEC0',
    marginTop: 16,
    fontSize: 14,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#A0AEC0',
    textAlign: 'center',
    lineHeight: 22,
  },
  appsSection: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#718096',
    marginBottom: 16,
  },
  appsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  appCard: {
    width: (W - 52) / 3,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  appCardDisabled: {
    opacity: 0.4,
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  appName: {
    fontSize: 11,
    color: '#E2E8F0',
    textAlign: 'center',
    fontWeight: '500',
  },
  benefitsSection: {
    paddingHorizontal: 24,
    marginTop: 30,
    gap: 14,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#A0AEC0',
    flex: 1,
  },
  successCard: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: LPColors.primary,
    marginTop: 10,
  },
  successStats: {
    fontSize: 14,
    color: '#A0AEC0',
    marginTop: 6,
  },
  actions: {
    paddingHorizontal: 20,
    marginTop: 'auto',
    marginBottom: 30,
    gap: 12,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: LPColors.primary,
    paddingVertical: 16,
    borderRadius: 14,
  },
  buttonDisabled: {
    backgroundColor: '#4A5568',
    opacity: 0.7,
  },
  connectButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  skipButtonText: {
    color: '#718096',
    fontSize: 15,
    fontWeight: '600',
  },
  skipSubtext: {
    color: '#4A5568',
    fontSize: 12,
    marginTop: 4,
  },
});
