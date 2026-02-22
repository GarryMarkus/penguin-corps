import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useContext, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { LPColors } from '../../constants/theme';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';
import { LPHaptics } from '../../services/haptics';

const { width: W } = Dimensions.get('window');

// Plant definitions with SVG components
const PLANTS = [
  {
    id: 'tulsi',
    name: 'Tulsi',
    hindi: 'तुलसी',
    description: 'Sacred basil plant, known for its medicinal properties',
    careLevel: 'Easy',
    growthTime: '2-3 weeks',
    color: '#27AE60',
    icon: '🌿',
  },
  {
    id: 'money_plant',
    name: 'Money Plant',
    hindi: 'मनी प्लांट',
    description: 'Brings prosperity and purifies air',
    careLevel: 'Very Easy',
    growthTime: '2-4 weeks',
    color: '#2ECC71',
    icon: '🪴',
  },
  {
    id: 'marigold',
    name: 'Marigold',
    hindi: 'गेंदा',
    description: 'Bright flowering plant with auspicious significance',
    careLevel: 'Medium',
    growthTime: '3-4 weeks',
    color: '#F39C12',
    icon: '🌼',
  },
  {
    id: 'rose',
    name: 'Rose',
    hindi: 'गुलाब',
    description: 'Beautiful flowering plant symbolizing love',
    careLevel: 'Medium',
    growthTime: '4-6 weeks',
    color: '#E74C3C',
    icon: '🌹',
  },
  {
    id: 'aloe_vera',
    name: 'Aloe Vera',
    hindi: 'एलोवेरा',
    description: 'Healing plant with numerous health benefits',
    careLevel: 'Very Easy',
    growthTime: '3-4 weeks',
    color: '#1ABC9C',
    icon: '🌵',
  },
  {
    id: 'jasmine',
    name: 'Jasmine',
    hindi: 'चमेली',
    description: 'Fragrant flowering plant bringing peace',
    careLevel: 'Medium',
    growthTime: '4-5 weeks',
    color: '#ECF0F1',
    icon: '🤍',
  },
];

// Plant Preview SVG Component
const PlantPreview = ({ plant, selected }: { plant: typeof PLANTS[0]; selected: boolean }) => {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withSpring(selected ? 1.1 : 1, {
      damping: 15,
      stiffness: 200,
    });
  }, [selected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Svg width={80} height={100} viewBox="0 0 80 100">
        {/* Pot */}
        <Rect x="15" y="70" width="50" height="25" fill="#A0522D" rx="4" />
        <Rect x="10" y="65" width="60" height="8" fill="#8B4513" rx="3" />
        
        {/* Soil */}
        <Ellipse cx="40" cy="68" rx="22" ry="5" fill="#5D3A1A" />
        
        {/* Stem */}
        <Rect x="37" y="30" width="6" height="40" fill={plant.color} rx="2" />
        
        {/* Leaves based on plant type */}
        {plant.id === 'tulsi' && (
          <>
            <Ellipse cx="25" cy="45" rx="12" ry="8" fill={plant.color} />
            <Ellipse cx="55" cy="45" rx="12" ry="8" fill={plant.color} />
            <Ellipse cx="40" cy="30" rx="15" ry="10" fill="#2ECC71" />
          </>
        )}
        {plant.id === 'money_plant' && (
          <>
            <Circle cx="25" cy="40" r="10" fill={plant.color} />
            <Circle cx="55" cy="40" r="10" fill={plant.color} />
            <Circle cx="40" cy="25" r="12" fill="#2ECC71" />
          </>
        )}
        {plant.id === 'marigold' && (
          <G>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <Ellipse
                key={i}
                cx={40 + 12 * Math.cos((angle * Math.PI) / 180)}
                cy={25 + 12 * Math.sin((angle * Math.PI) / 180)}
                rx="8"
                ry="5"
                fill={plant.color}
                transform={`rotate(${angle}, 40, 25)`}
              />
            ))}
            <Circle cx="40" cy="25" r="8" fill="#E67E22" />
          </G>
        )}
        {plant.id === 'rose' && (
          <G>
            <Circle cx="40" cy="25" r="15" fill={plant.color} />
            <Circle cx="40" cy="25" r="10" fill="#C0392B" />
            <Circle cx="40" cy="25" r="5" fill="#E74C3C" />
            <Ellipse cx="25" cy="50" rx="10" ry="6" fill="#27AE60" />
            <Ellipse cx="55" cy="50" rx="10" ry="6" fill="#27AE60" />
          </G>
        )}
        {plant.id === 'aloe_vera' && (
          <>
            <Path d="M40 20 L30 55 L40 50 L50 55 Z" fill={plant.color} />
            <Path d="M40 25 L25 60 L35 55 L40 58 Z" fill="#16A085" />
            <Path d="M40 25 L55 60 L45 55 L40 58 Z" fill="#16A085" />
          </>
        )}
        {plant.id === 'jasmine' && (
          <G>
            {[0, 72, 144, 216, 288].map((angle, i) => (
              <Ellipse
                key={i}
                cx={40 + 10 * Math.cos((angle * Math.PI) / 180)}
                cy={25 + 10 * Math.sin((angle * Math.PI) / 180)}
                rx="7"
                ry="4"
                fill={plant.color}
                transform={`rotate(${angle + 90}, ${40 + 10 * Math.cos((angle * Math.PI) / 180)}, ${25 + 10 * Math.sin((angle * Math.PI) / 180)})`}
              />
            ))}
            <Circle cx="40" cy="25" r="5" fill="#F1C40F" />
            <Ellipse cx="28" cy="50" rx="10" ry="6" fill="#27AE60" />
            <Ellipse cx="52" cy="50" rx="10" ry="6" fill="#27AE60" />
          </G>
        )}
        
        {/* Selection indicator */}
        {selected && (
          <G>
            <Circle cx="40" cy="10" r="8" fill={LPColors.primary} />
            <Path d="M36 10 L39 13 L44 7" stroke="#FFF" strokeWidth="2" fill="none" />
          </G>
        )}
      </Svg>
    </Animated.View>
  );
};

export default function PlantSelectionScreen() {
  const router = useRouter();
  const auth: any = useContext(AuthContext);
  const [selectedPlant, setSelectedPlant] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelectPlant = async () => {
    if (!selectedPlant) return;
    
    setLoading(true);
    LPHaptics.selection();

    try {
      // Save selected plant to user profile
      await API.patch('/user/update-profile', {
        selectedPlant: selectedPlant,
      });

      LPHaptics.success();

      // Navigate to main app
      if (auth.user?.isSmoker === false) {
        router.replace('/fitness');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err) {
      console.error('Error saving plant:', err);
      LPHaptics.error();
      // Still proceed even if save fails
      if (auth.user?.isSmoker === false) {
        router.replace('/fitness');
      } else {
        router.replace('/(tabs)');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedPlantData = PLANTS.find(p => p.id === selectedPlant);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.header}>
            <Text style={styles.title}>🌱 Choose Your Plant</Text>
            <Text style={styles.subtitle}>
              {auth.user?.appMode === 'duo' 
                ? 'Pick a plant to co-parent with your partner!'
                : 'Pick a plant to grow on your journey!'}
            </Text>
            <Text style={styles.hint}>
              Healthy habits help it grow. Smoking makes it wither. 🚭
            </Text>
          </Animated.View>

          {/* Plant Grid */}
          <View style={styles.plantsGrid}>
            {PLANTS.map((plant, index) => (
              <Animated.View 
                key={plant.id}
                entering={FadeInDown.delay(200 + index * 100).duration(500)}
              >
                <TouchableOpacity
                  style={[
                    styles.plantCard,
                    selectedPlant === plant.id && styles.plantCardSelected,
                    selectedPlant === plant.id && { borderColor: plant.color },
                  ]}
                  onPress={() => {
                    LPHaptics.selection();
                    setSelectedPlant(plant.id);
                  }}
                  activeOpacity={0.8}
                >
                  <PlantPreview plant={plant} selected={selectedPlant === plant.id} />
                  
                  <Text style={styles.plantIcon}>{plant.icon}</Text>
                  <Text style={styles.plantName}>{plant.name}</Text>
                  <Text style={styles.plantHindi}>{plant.hindi}</Text>
                  
                  <View style={[styles.careTag, { backgroundColor: `${plant.color}20` }]}>
                    <Text style={[styles.careText, { color: plant.color }]}>
                      {plant.careLevel}
                    </Text>
                  </View>

                  {selectedPlant === plant.id && (
                    <View style={[styles.checkMark, { backgroundColor: plant.color }]}>
                      <Ionicons name="checkmark" size={16} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          {/* Selected Plant Info */}
          {selectedPlantData && (
            <Animated.View entering={FadeInUp.duration(300)} style={styles.infoCard}>
              <LinearGradient
                colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
                style={styles.infoGradient}
              >
                <Text style={styles.infoTitle}>{selectedPlantData.name}</Text>
                <Text style={styles.infoDesc}>{selectedPlantData.description}</Text>
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Ionicons name="time-outline" size={16} color="#A0AEC0" />
                    <Text style={styles.infoText}>{selectedPlantData.growthTime}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Ionicons name="water-outline" size={16} color="#74B9FF" />
                    <Text style={styles.infoText}>{selectedPlantData.careLevel}</Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>
          )}

          {/* Continue Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.continueBtn, !selectedPlant && styles.continueBtnDisabled]}
              onPress={handleSelectPlant}
              disabled={!selectedPlant || loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={selectedPlant ? [LPColors.primary, '#00B894'] : ['#555', '#444']}
                style={styles.continueBtnGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Text style={styles.continueBtnText}>
                      {selectedPlant ? `Start Growing ${selectedPlantData?.name}!` : 'Select a Plant'}
                    </Text>
                    <Ionicons name="leaf" size={20} color="#FFF" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E2E',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#A0AEC0',
    textAlign: 'center',
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    color: '#FFD93D',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  plantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  plantCard: {
    width: (W - 52) / 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  plantCardSelected: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  plantIcon: {
    fontSize: 24,
    marginTop: 8,
  },
  plantName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  plantHindi: {
    color: '#A0AEC0',
    fontSize: 12,
    marginTop: 2,
  },
  careTag: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  careText: {
    fontSize: 11,
    fontWeight: '600',
  },
  checkMark: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  infoGradient: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  infoTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  infoDesc: {
    color: '#A0AEC0',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    color: '#A0AEC0',
    fontSize: 13,
  },
  buttonContainer: {
    marginTop: 28,
  },
  continueBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  continueBtnDisabled: {
    opacity: 0.5,
  },
  continueBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 10,
  },
  continueBtnText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
});
