import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useContext, useState } from 'react';
import {
  ActivityIndicator,
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

// Quit Smoking Icon
const QuitSmokingIcon = () => (
  <Svg width={80} height={80} viewBox="0 0 80 80">
    {/* Broken cigarette */}
    <G transform="rotate(-20, 40, 40)">
      <Rect x="10" y="35" width="25" height="10" fill="#F5F5DC" rx="2" />
      <Rect x="10" y="35" width="8" height="10" fill="#FF6B6B" rx="2" />
      <Rect x="50" y="35" width="25" height="10" fill="#F5F5DC" rx="2" />
      <Rect x="67" y="35" width="8" height="10" fill="#FF6B6B" rx="2" />
    </G>
    {/* Smoke with X */}
    <Path d="M35 20 Q40 10 45 20" stroke="#A0AEC0" strokeWidth="2" fill="none" opacity="0.5" />
    {/* Red circle with slash */}
    <Circle cx="40" cy="40" r="35" stroke="#FF6B6B" strokeWidth="4" fill="none" />
    <Path d="M15 65 L65 15" stroke="#FF6B6B" strokeWidth="4" strokeLinecap="round" />
    {/* Green checkmark in corner */}
    <Circle cx="65" cy="65" r="12" fill={LPColors.primary} />
    <Path d="M59 65 L63 69 L71 61" stroke="#FFF" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Fitness Icon
const FitnessIcon = () => (
  <Svg width={80} height={80} viewBox="0 0 80 80">
    {/* Running figure */}
    <Circle cx="40" cy="15" r="10" fill={LPColors.primary} />
    <Path d="M30 30 L40 45 L50 30" stroke={LPColors.primary} strokeWidth="4" fill="none" strokeLinecap="round" />
    <Path d="M35 45 L25 65" stroke={LPColors.primary} strokeWidth="4" strokeLinecap="round" />
    <Path d="M45 45 L55 65" stroke={LPColors.primary} strokeWidth="4" strokeLinecap="round" />
    <Path d="M28 35 L15 45" stroke={LPColors.primary} strokeWidth="4" strokeLinecap="round" />
    <Path d="M52 35 L65 30" stroke={LPColors.primary} strokeWidth="4" strokeLinecap="round" />
    {/* Heart pulse */}
    <Path d="M10 70 L20 70 L25 60 L30 75 L35 65 L40 70 L70 70" stroke="#FF6B6B" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

interface SignupResponse {
  user: any;
  token: string;
}

export default function SmokerCheckScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const auth: any = useContext(AuthContext);
  
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'smoker' | 'nonsmoker' | null>(null);

  // Get signup data and mode from params
  const signupData = params.signupData ? JSON.parse(params.signupData as string) : null;
  const appMode = params.appMode as string || 'solo';

  const handleSelect = async (isSmoker: boolean) => {
    const option = isSmoker ? 'smoker' : 'nonsmoker';
    setSelectedOption(option);
    setLoading(true);
    LPHaptics.selection();

    try {
      // If we have signup data, create the account now
      if (signupData && !auth.token) {
        console.log('[SmokerCheck] Creating account with smoker status:', isSmoker);
        
        const finalPayload = {
          ...signupData,
          isSmoker,
          appMode,
        };

        const res = await API.post<SignupResponse>('/auth/signup', finalPayload);
        const { user, token } = res.data;
        await auth.loginUser(user, token);
      } else {
        // Update existing user's smoker status
        console.log('[SmokerCheck] Updating smoker status:', isSmoker);
        await API.post('/api/users/update-smoker-status', { isSmoker });
        // Update local user
        if (auth.user) {
          await auth.loginUser({ ...auth.user, isSmoker }, auth.token);
        }
      }

      // Navigate to health sync setup
      router.push({
        pathname: '/onboarding/health-sync-setup',
        params: { 
          isSmoker: isSmoker.toString(),
          appMode,
        },
      });

    } catch (err: any) {
      console.error('[SmokerCheck] Error:', err.response?.data || err.message);
      LPHaptics.error();
      setLoading(false);
      setSelectedOption(null);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#1A1A2E', '#16213E']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.header}>
          <Text style={styles.title}>What's Your Goal?</Text>
          <Text style={styles.subtitle}>
            Choose your path to a healthier life
          </Text>
        </Animated.View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {/* Quit Smoking Option */}
          <Animated.View entering={FadeInDown.delay(300).duration(600)}>
            <TouchableOpacity
              style={[
                styles.optionCard,
                selectedOption === 'smoker' && styles.optionSelected,
              ]}
              onPress={() => handleSelect(true)}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={selectedOption === 'smoker' ? ['#FF6B6B', '#E74C3C'] : ['#2C3E50', '#34495E']}
                style={styles.optionGradient}
              >
                <View style={styles.iconWrapper}>
                  <QuitSmokingIcon />
                </View>
                <Text style={styles.optionTitle}>Quit Smoking</Text>
                <Text style={styles.optionDesc}>
                  I want to quit smoking and rebuild my health with personalized support
                </Text>
                <View style={styles.features}>
                  <View style={styles.feature}>
                    <Ionicons name="shield-checkmark" size={16} color={LPColors.primary} />
                    <Text style={styles.featureText}>Trigger zone alerts</Text>
                  </View>
                  <View style={styles.feature}>
                    <Ionicons name="trending-down" size={16} color="#FF6B6B" />
                    <Text style={styles.featureText}>Gradual reduction plan</Text>
                  </View>
                  <View style={styles.feature}>
                    <Ionicons name="heart" size={16} color="#FF6B6B" />
                    <Text style={styles.featureText}>Health recovery tracking</Text>
                  </View>
                </View>
                {loading && selectedOption === 'smoker' && (
                  <ActivityIndicator color="#FFF" style={{ marginTop: 12 }} />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Fitness Option */}
          <Animated.View entering={FadeInDown.delay(450).duration(600)}>
            <TouchableOpacity
              style={[
                styles.optionCard,
                selectedOption === 'nonsmoker' && styles.optionSelected,
              ]}
              onPress={() => handleSelect(false)}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={selectedOption === 'nonsmoker' ? [LPColors.primary, '#2ECC71'] : ['#2C3E50', '#34495E']}
                style={styles.optionGradient}
              >
                <View style={styles.iconWrapper}>
                  <FitnessIcon />
                </View>
                <Text style={styles.optionTitle}>Boost Fitness</Text>
                <Text style={styles.optionDesc}>
                  I want to improve my fitness, track activities, and live healthier
                </Text>
                <View style={styles.features}>
                  <View style={styles.feature}>
                    <Ionicons name="footsteps" size={16} color={LPColors.primary} />
                    <Text style={styles.featureText}>Step & activity tracking</Text>
                  </View>
                  <View style={styles.feature}>
                    <Ionicons name="nutrition" size={16} color="#FF9500" />
                    <Text style={styles.featureText}>Nutrition guidance</Text>
                  </View>
                  <View style={styles.feature}>
                    <Ionicons name="trophy" size={16} color="#FFD700" />
                    <Text style={styles.featureText}>Goal achievements</Text>
                  </View>
                </View>
                {loading && selectedOption === 'nonsmoker' && (
                  <ActivityIndicator color="#FFF" style={{ marginTop: 12 }} />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Footer note */}
        <Animated.View entering={FadeInDown.delay(600).duration(600)} style={styles.footer}>
          <Ionicons name="information-circle-outline" size={16} color="#718096" />
          <Text style={styles.footerText}>
            You can change this later in your profile settings
          </Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
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
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#A0AEC0',
    textAlign: 'center',
  },
  optionsContainer: {
    flex: 1,
    gap: 20,
  },
  optionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: LPColors.primary,
  },
  optionGradient: {
    padding: 20,
    alignItems: 'center',
  },
  iconWrapper: {
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  optionDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  features: {
    width: '100%',
    gap: 8,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 13,
    color: '#718096',
  },
});
