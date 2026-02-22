import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useContext } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { LPColors } from '../../constants/theme';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';
import { LPHaptics } from '../../services/haptics';

const { width: W } = Dimensions.get('window');

// Solo Plant Icon
const SoloPlantIcon = () => (
  <Svg width={100} height={120} viewBox="0 0 100 120">
    {/* Pot */}
    <Rect x="20" y="85" width="60" height="30" fill="#E67E22" rx="5" />
    <Rect x="15" y="80" width="70" height="10" fill="#D35400" rx="3" />
    {/* Stem */}
    <Rect x="47" y="40" width="6" height="45" fill="#27AE60" rx="2" />
    {/* Leaves */}
    <Ellipse cx="35" cy="50" rx="15" ry="10" fill="#2ECC71" />
    <Ellipse cx="65" cy="50" rx="15" ry="10" fill="#2ECC71" />
    <Ellipse cx="50" cy="35" rx="18" ry="12" fill="#27AE60" />
    {/* Single person silhouette */}
    <Circle cx="50" cy="10" r="8" fill={LPColors.primary} />
    <Path d="M40 28 Q50 35 60 28 L58 20 Q50 25 42 20 Z" fill={LPColors.primary} />
  </Svg>
);

// Duo Plant Icon
const DuoPlantIcon = () => (
  <Svg width={100} height={120} viewBox="0 0 100 120">
    {/* Pot */}
    <Rect x="20" y="85" width="60" height="30" fill="#E67E22" rx="5" />
    <Rect x="15" y="80" width="70" height="10" fill="#D35400" rx="3" />
    {/* Stem */}
    <Rect x="47" y="40" width="6" height="45" fill="#27AE60" rx="2" />
    {/* Leaves */}
    <Ellipse cx="30" cy="55" rx="15" ry="10" fill="#2ECC71" />
    <Ellipse cx="70" cy="55" rx="15" ry="10" fill="#2ECC71" />
    <Ellipse cx="35" cy="40" rx="12" ry="8" fill="#27AE60" />
    <Ellipse cx="65" cy="40" rx="12" ry="8" fill="#27AE60" />
    <Ellipse cx="50" cy="30" rx="18" ry="12" fill="#27AE60" />
    {/* Heart on top */}
    <Path d="M50 18 C45 10 35 10 35 20 C35 28 50 35 50 35 C50 35 65 28 65 20 C65 10 55 10 50 18" fill="#FF6B6B" />
    {/* Two person silhouettes */}
    <G transform="translate(-15, -5)">
      <Circle cx="35" cy="10" r="6" fill={LPColors.primary} />
      <Path d="M28 22 Q35 27 42 22 L40 16 Q35 20 30 16 Z" fill={LPColors.primary} />
    </G>
    <G transform="translate(15, -5)">
      <Circle cx="65" cy="10" r="6" fill="#9B59B6" />
      <Path d="M58 22 Q65 27 72 22 L70 16 Q65 20 60 16 Z" fill="#9B59B6" />
    </G>
  </Svg>
);

export default function ModeSelectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const auth: any = useContext(AuthContext);
  const [selectedMode, setSelectedMode] = useState<'solo' | 'duo' | null>(null);

  // Get signup data from params (passed from signup screen)
  const signupData = params.signupData as string || null;

  // If signupData is missing AND we have no logged-in user, redirect to signup
  if (!signupData && !auth.user) {
    setTimeout(() => {
      router.replace('/auth/signup');
    }, 100);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: LPColors.bg }}>
        <Text style={{ color: '#FF6B6B', fontSize: 18, fontWeight: 'bold' }}>Signup information missing. Please restart onboarding.</Text>
      </View>
    );
  }

  const handleSelectMode = async (mode: 'solo' | 'duo') => {
    setSelectedMode(mode);
    LPHaptics.selection();

    // If user is already authenticated, save their choice immediately
    if (auth.token && auth.user) {
      try {
        await API.post('/api/users/set-mode', { mode });
        // Update local auth context
        await auth.loginUser({ ...auth.user, appMode: mode }, auth.token);
      } catch (err) {
        console.error('[Mode Selection] Failed to save appMode:', err);
      }
    }

    if (mode === 'duo') {
      router.push({
        pathname: '/onboarding/duo-pairing',
        params: { signupData, appMode: 'duo' },
      });
    } else {
      router.push({
        pathname: '/onboarding/smoker-check',
        params: { signupData, appMode: 'solo' },
      });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.header}>
          <Text style={styles.title}>Choose Your Journey</Text>
          <Text style={styles.subtitle}>
            How would you like to grow your plant?
          </Text>
        </Animated.View>

        {/* Mode Cards */}
        <View style={styles.cardsContainer}>
          {/* Solo Mode Card */}
          <Animated.View entering={FadeInDown.delay(300).duration(600)}>
            <TouchableOpacity
              style={[styles.card, selectedMode === 'solo' && styles.cardSelected]}
              onPress={() => handleSelectMode('solo')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#2C3E50', '#34495E']}
                style={styles.cardGradient}
              >
                <View style={styles.iconContainer}>
                  <SoloPlantIcon />
                </View>
                <Text style={styles.cardTitle}>Solo Mode</Text>
                <Text style={styles.cardDescription}>
                  Grow your plant independently. Track your own progress and achieve your health goals at your own pace.
                </Text>
                <View style={styles.featureList}>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={18} color="#2ECC71" />
                    <Text style={styles.featureText}>Personal progress tracking</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={18} color="#2ECC71" />
                    <Text style={styles.featureText}>Individual streaks</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={18} color="#2ECC71" />
                    <Text style={styles.featureText}>Self-paced journey</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Duo Mode Card */}
          <Animated.View entering={FadeInDown.delay(500).duration(600)}>
            <TouchableOpacity
              style={[styles.card, selectedMode === 'duo' && styles.cardSelected]}
              onPress={() => handleSelectMode('duo')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#8E44AD', '#9B59B6']}
                style={styles.cardGradient}
              >
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>RECOMMENDED</Text>
                </View>
                <View style={styles.iconContainer}>
                  <DuoPlantIcon />
                </View>
                <Text style={styles.cardTitle}>Duo Mode</Text>
                <Text style={styles.cardDescription}>
                  Partner up and co-parent a plant together! Support each other and achieve your goals as a team.
                </Text>
                <View style={styles.featureList}>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={18} color="#2ECC71" />
                    <Text style={styles.featureText}>Shared plant to nurture</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={18} color="#2ECC71" />
                    <Text style={styles.featureText}>Accountability partner</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={18} color="#2ECC71" />
                    <Text style={styles.featureText}>Encouragement & support</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Footer Note */}
        <Animated.Text entering={FadeInDown.delay(700).duration(600)} style={styles.footerNote}>
          You can change this later in settings
        </Animated.Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LPColors.bg,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: LPColors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: LPColors.textGray,
    textAlign: 'center',
  },
  cardsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: LPColors.primary,
  },
  cardGradient: {
    padding: 20,
    alignItems: 'center',
  },
  recommendedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  iconContainer: {
    marginVertical: 10,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  featureList: {
    alignSelf: 'stretch',
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#FFF',
  },
  loader: {
    marginTop: 12,
  },
  footerNote: {
    textAlign: 'center',
    color: LPColors.textGray,
    fontSize: 14,
    marginBottom: 20,
  },
});
