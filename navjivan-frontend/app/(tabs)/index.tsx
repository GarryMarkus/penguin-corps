import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { LPColors } from '../../constants/theme';
import { AuthContext } from '../../context/AuthContext';
import { useGoals } from '../../context/GoalsContext';
import { analyzeFoodApi, fetchDashboardSummary, generatePantryRecipesApi, verifyWaterImageApi } from '../../services/api';
import { LPHaptics } from '../../services/haptics';
import * as FileSystem from 'expo-file-system';

const { width: SCREEN_W } = Dimensions.get('window');
const CONSOLE_PAD = 16;
const GARDEN_W = SCREEN_W - CONSOLE_PAD * 2 - 24;
const GARDEN_H = 220;

const PASTEL = {
  mint: '#A8E6CF',
  pink: '#FFB7B2',
  peach: '#FFDAC1',
  lavender: '#C3B1E1',
  sky: '#B5EAD7',
  yellow: '#FFFACD',
  cream: '#FFF5E4',
  coral: '#FF6F61',
  softGreen: '#7EC8A0',
  darkGreen: '#2D6A4F',
  brown: '#8B5E3C',
  soil: '#5C4033',
  consoleBody: '#FFE4C9',
  consoleDark: '#FFD4A8',
  screenBorder: '#333',
  btnBlue: '#74B9FF',
  btnGreen: '#55EFC4',
  btnYellow: '#FFEAA7',
  btnRed: '#FF7675',
};

// ── Plant Growth Stage Calculator ──
const getPlantStage = (water: number, goalsCompleted: number, totalGoals: number, smoked: number) => {
  let score = 0;
  score += Math.min(water, 8) * 5;
  if (totalGoals > 0) score += (goalsCompleted / totalGoals) * 40;
  score -= smoked * 10;
  score = Math.max(0, Math.min(100, score));
  if (score >= 80) return 4;
  if (score >= 55) return 3;
  if (score >= 30) return 2;
  if (score >= 10) return 1;
  return 0;
};

// ── SVG Garden Scene ──
const GardenScene = ({ plantStage, waterAnim, smokeAnim, sparkleAnim }: any) => {
  const W = GARDEN_W;
  const H = GARDEN_H;
  const potTop = H - 95;
  const potW = 120;
  const potTopW = potW + 10;
  const potBotW = potW - 30;
  const potH = 65;
  const potX = (W - potTopW) / 2;
  const soilY = potTop + 8;

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Defs>
        <RadialGradient id="sunGlow" cx="85%" cy="12%" r="25%">
          <Stop offset="0%" stopColor="#FFF9C4" stopOpacity="0.9" />
          <Stop offset="50%" stopColor="#FFE082" stopOpacity="0.4" />
          <Stop offset="100%" stopColor="#FFE082" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* Pink sky background */}
      <Rect x="0" y="0" width={String(W)} height={String(H)} fill="#F8BBD0" rx="12" />

      {/* Bottom cream strip */}
      <Rect x="0" y={String(H - 20)} width={String(W)} height="20" fill="#FFF5E4" rx="0" />

      {/* Sun (top-right) */}
      <Circle cx={String(W - 45)} cy="40" r="50" fill="url(#sunGlow)" />
      <Circle cx={String(W - 45)} cy="40" r="22" fill="#FFD93D" />
      <Circle cx={String(W - 45)} cy="40" r="17" fill="#FFE57F" />
      {/* Sun rays */}
      {sparkleAnim && [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = W - 45 + Math.cos(rad) * 26;
        const y1 = 40 + Math.sin(rad) * 26;
        const x2 = W - 45 + Math.cos(rad) * 36;
        const y2 = 40 + Math.sin(rad) * 36;
        return <Path key={i} d={`M${x1} ${y1} L${x2} ${y2}`} stroke="#FFD93D" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />;
      })}
      {/* Sun sparkles */}
      {sparkleAnim && (
        <G>
          <Circle cx={String(W - 20)} cy="20" r="2" fill="#FFF" opacity="0.8" />
          <Circle cx={String(W - 70)} cy="25" r="1.5" fill="#FFF" opacity="0.6" />
          <Circle cx={String(W - 30)} cy="60" r="1.5" fill="#FFF" opacity="0.7" />
        </G>
      )}

      {/* ── TERRACOTTA POT ── */}
      {/* Pot body (trapezoid) */}
      <Path
        d={`M${potX} ${potTop} L${potX + (potTopW - potBotW) / 2} ${potTop + potH} L${potX + potTopW - (potTopW - potBotW) / 2} ${potTop + potH} L${potX + potTopW} ${potTop} Z`}
        fill="#A0522D"
      />
      {/* Pot highlight */}
      <Path
        d={`M${potX + 8} ${potTop + 4} L${potX + (potTopW - potBotW) / 2 + 8} ${potTop + potH - 4} L${potX + potTopW / 2} ${potTop + potH - 4} L${potX + potTopW / 2 - 4} ${potTop + 4} Z`}
        fill="#B8733D"
        opacity="0.5"
      />
      {/* Pot rim */}
      <Rect
        x={String(potX - 4)}
        y={String(potTop - 6)}
        width={String(potTopW + 8)}
        height="10"
        rx="4"
        fill="#8B4513"
      />
      {/* Soil */}
      <Ellipse
        cx={String(W / 2)}
        cy={String(soilY + 2)}
        rx={String(potTopW / 2 - 2)}
        ry="10"
        fill="#3E2723"
      />

      {/* ── PLANT STAGES ── */}
      {/* Stage 0: Just soil, empty pot */}

      {/* Stage 1: Tiny sprout */}
      {plantStage >= 1 && (
        <G>
          {/* Stem */}
          <Path d={`M${W / 2} ${soilY} L${W / 2} ${soilY - 30}`} stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
          {/* Two tiny leaves */}
          <Ellipse cx={String(W / 2 - 8)} cy={String(soilY - 28)} rx="6" ry="4" fill="#66BB6A" transform={`rotate(-30 ${W / 2 - 8} ${soilY - 28})`} />
          <Ellipse cx={String(W / 2 + 8)} cy={String(soilY - 28)} rx="6" ry="4" fill="#81C784" transform={`rotate(30 ${W / 2 + 8} ${soilY - 28})`} />
        </G>
      )}

      {/* Stage 2: Small plant with more leaves */}
      {plantStage >= 2 && (
        <G>
          {/* Extend stem */}
          <Path d={`M${W / 2} ${soilY - 30} L${W / 2} ${soilY - 50}`} stroke="#43A047" strokeWidth="3" strokeLinecap="round" />
          {/* More leaves */}
          <Ellipse cx={String(W / 2 - 14)} cy={String(soilY - 42)} rx="10" ry="5" fill="#66BB6A" transform={`rotate(-35 ${W / 2 - 14} ${soilY - 42})`} />
          <Ellipse cx={String(W / 2 + 14)} cy={String(soilY - 42)} rx="10" ry="5" fill="#81C784" transform={`rotate(35 ${W / 2 + 14} ${soilY - 42})`} />
          <Ellipse cx={String(W / 2)} cy={String(soilY - 52)} rx="8" ry="5" fill="#4CAF50" />
        </G>
      )}

      {/* Stage 3: Bush with thick leaves */}
      {plantStage >= 3 && (
        <G>
          <Path d={`M${W / 2} ${soilY - 50} L${W / 2} ${soilY - 68}`} stroke="#388E3C" strokeWidth="3.5" strokeLinecap="round" />
          {/* Big leaf cluster */}
          <Ellipse cx={String(W / 2 - 18)} cy={String(soilY - 58)} rx="14" ry="7" fill="#66BB6A" transform={`rotate(-25 ${W / 2 - 18} ${soilY - 58})`} />
          <Ellipse cx={String(W / 2 + 18)} cy={String(soilY - 58)} rx="14" ry="7" fill="#81C784" transform={`rotate(25 ${W / 2 + 18} ${soilY - 58})`} />
          <Ellipse cx={String(W / 2 - 10)} cy={String(soilY - 68)} rx="12" ry="6" fill="#4CAF50" transform={`rotate(-15 ${W / 2 - 10} ${soilY - 68})`} />
          <Ellipse cx={String(W / 2 + 10)} cy={String(soilY - 68)} rx="12" ry="6" fill="#66BB6A" transform={`rotate(15 ${W / 2 + 10} ${soilY - 68})`} />
          <Ellipse cx={String(W / 2)} cy={String(soilY - 72)} rx="10" ry="6" fill="#81C784" />
        </G>
      )}

      {/* Stage 4: Full flower with hearts */}
      {plantStage >= 4 && (
        <G>
          <Path d={`M${W / 2} ${soilY - 68} L${W / 2} ${soilY - 90}`} stroke="#2E7D32" strokeWidth="3.5" strokeLinecap="round" />
          {/* Flower petals (yellow) */}
          {[0, 60, 120, 180, 240, 300].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const cx = W / 2 + Math.cos(rad) * 10;
            const cy = soilY - 95 + Math.sin(rad) * 10;
            return <Ellipse key={i} cx={String(cx)} cy={String(cy)} rx="8" ry="5" fill={i % 2 === 0 ? '#FFD54F' : '#FFEB3B'} transform={`rotate(${angle} ${cx} ${cy})`} />;
          })}
          {/* Flower center */}
          <Circle cx={String(W / 2)} cy={String(soilY - 95)} r="6" fill="#FF9800" />
          <Circle cx={String(W / 2)} cy={String(soilY - 95)} r="4" fill="#FFB74D" />

          {/* Floating hearts */}
          <Path d={`M${W / 2 - 20} ${soilY - 115} C${W / 2 - 24} ${soilY - 120} ${W / 2 - 17} ${soilY - 123} ${W / 2 - 20} ${soilY - 118} C${W / 2 - 23} ${soilY - 123} ${W / 2 - 16} ${soilY - 120} ${W / 2 - 20} ${soilY - 115} Z`} fill="#E91E63" opacity="0.7" />
          <Path d={`M${W / 2 + 22} ${soilY - 120} C${W / 2 + 18} ${soilY - 125} ${W / 2 + 25} ${soilY - 128} ${W / 2 + 22} ${soilY - 123} C${W / 2 + 19} ${soilY - 128} ${W / 2 + 26} ${soilY - 125} ${W / 2 + 22} ${soilY - 120} Z`} fill="#FF4081" opacity="0.5" />
        </G>
      )}

      {/* ── WATER ANIMATION ── */}
      {waterAnim && (
        <G>
          {/* Watering can silhouette */}
          <Rect x={String(W / 2 + 40)} y={String(soilY - 80)} width="35" height="20" rx="4" fill="#64B5F6" opacity="0.8" />
          <Rect x={String(W / 2 + 65)} y={String(soilY - 75)} width="20" height="6" rx="3" fill="#64B5F6" opacity="0.8" />
          {/* Water droplets */}
          {[0, 8, 16, 5, 13, -3, 10].map((offset, i) => (
            <Ellipse key={i} cx={String(W / 2 + 70 + offset * 0.5 - i * 3)} cy={String(soilY - 55 + i * 6)} rx="2.5" ry="4" fill="#42A5F5" opacity={String(0.9 - i * 0.1)} />
          ))}
        </G>
      )}

      {/* ── SMOKE ANIMATION ── */}
      {smokeAnim && (
        <G>
          <Ellipse cx={String(W / 2 - 15)} cy={String(soilY - 40)} rx="22" ry="12" fill="#9E9E9E" opacity="0.5" />
          <Ellipse cx={String(W / 2 + 10)} cy={String(soilY - 55)} rx="18" ry="10" fill="#BDBDBD" opacity="0.4" />
          <Ellipse cx={String(W / 2 - 5)} cy={String(soilY - 70)} rx="15" ry="8" fill="#757575" opacity="0.3" />
          <Ellipse cx={String(W / 2 + 20)} cy={String(soilY - 30)} rx="12" ry="7" fill="#616161" opacity="0.35" />
          {/* Wilting indicator */}
          <Ellipse cx={String(W / 2)} cy={String(soilY - 10)} rx="20" ry="5" fill="rgba(100,100,100,0.2)" />
        </G>
      )}
    </Svg>
  );
};







// ── Action Buttons ──
const ActionBtn = ({ label, onPress, badge }: any) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPressIn={() => { LPHaptics.light(); scale.value = withSpring(0.92); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      onPress={onPress}
      style={{ width: '100%', alignItems: 'center', marginBottom: 12 }}
    >
      <Animated.View style={[s.actionBtn, animStyle]}>
        <Text style={s.actionBtnText}>{label}</Text>
        {badge !== undefined && badge > 0 && (
          <View style={s.btnBadge}>
            <Text style={s.btnBadgeText}>{badge}</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
};

const SmokeBtnCenter = ({ onPress, smokes }: any) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPressIn={() => { LPHaptics.light(); scale.value = withSpring(0.92); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      onPress={onPress}
      style={{ alignItems: 'center' }}
    >
      <Animated.View style={[s.smokeBtnCenter, animStyle]}>
        <Text style={s.smokeBtnText}>SMOKED</Text>
        <Text style={s.smokeBtnIcon}>!</Text>
        {smokes !== undefined && smokes > 0 && (
          <View style={[s.btnBadge, { top: 10, right: 10 }]}>
            <Text style={s.btnBadgeText}>{smokes}</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
};

// ── Status Bar Meter ──
const StatusMeter = ({ label, value, max, color, icon }: any) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <View style={s.meterRow}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={s.meterLabel}>{label}</Text>
      <View style={s.meterTrack}>
        <View style={[s.meterFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={s.meterValue}>{value}/{max}</Text>
    </View>
  );
};

// ═══════════════ MAIN SCREEN ═══════════════
export default function HomeScreen() {
  const auth: any = useContext(AuthContext);
  const router = useRouter();
  const userName = auth?.user?.name || 'Player';

  const [dashboard, setDashboard] = useState<any>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [showMealModal, setShowMealModal] = useState(false);
  const [showSmokeModal, setShowSmokeModal] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);

  // Meal - Enhanced with mode selection and nutrition preview
  const [mealMode, setMealMode] = useState<'select' | 'log' | 'plan' | 'preview' | 'recipes'>('select');
  const [mealInput, setMealInput] = useState('');
  const [ingredientInput, setIngredientInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [meals, setMeals] = useState<any[]>([]);
  
  // Nutrition Preview
  const [nutritionPreview, setNutritionPreview] = useState<any>(null);
  
  // Meal Planning
  const [mealTypeSelection, setMealTypeSelection] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [pantryRecipes, setPantryRecipes] = useState<any[]>([]);
  const [isGeneratingRecipes, setIsGeneratingRecipes] = useState(false);

  // Smoke
  const [smokesToday, setSmokesToday] = useState(0);

  // Animations
  const [waterAnimActive, setWaterAnimActive] = useState(false);
  const [smokeAnimActive, setSmokeAnimActive] = useState(false);
  const [sparkleActive, setSparkleActive] = useState(false);

  // Water photo camera
  const [showWaterCamera, setShowWaterCamera] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [capturedWaterPhoto, setCapturedWaterPhoto] = useState<string | null>(null);
  const [verifyingWater, setVerifyingWater] = useState(false);

  const { goals, toggleGoalCompletion, waterIntake, updateWaterIntake, streak } = useGoals();
  const completedGoals = goals.filter(g => g.completed).length;

  // Plant stage
  const localPlantStage = getPlantStage(waterIntake, completedGoals, goals.length, smokesToday);

  // Duo sync: use shared plant stage when in active duo
  const [duoPlantStage, setDuoPlantStage] = useState<number | null>(null);
  const plantStage = duoPlantStage !== null ? duoPlantStage : localPlantStage;

  // Dashboard
  const loadDashboard = async () => {
    try {
      const res = await fetchDashboardSummary();
      setDashboard(res.data);
    } catch (err) {
      console.log('Failed to load dashboard summary', err);
    } finally {
      setLoadingDashboard(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);
  useEffect(() => { loadSmokes(); loadMeals(); }, []);

  // ── Sync stats to Duo (if active) ──
  useEffect(() => {
    const syncDuo = async () => {
      try {
        const { updateDuoStatsApi } = await import('../../services/api');
        await updateDuoStatsApi({
          water: waterIntake,
          meals: meals.length,
          goalsCompleted: completedGoals,
          goalsTotal: goals.length,
          smokes: smokesToday,
        });
      } catch (e) { }
    };
    const timer = setTimeout(syncDuo, 2000);
    return () => clearTimeout(timer);
  }, [waterIntake, meals.length, completedGoals, smokesToday]);

  // ── Poll duo plant stage every 15s ──
  useEffect(() => {
    let active = true;
    const pollDuo = async () => {
      try {
        const { getDuoStatusApi } = await import('../../services/api');
        const res = await getDuoStatusApi();
        const d: any = res.data;
        if (d.hasDuo && d.status === 'active' && active) {
          setDuoPlantStage(d.plantStage);
        } else if (active) {
          setDuoPlantStage(null);
        }
      } catch (e) {
        if (active) setDuoPlantStage(null);
      }
    };
    pollDuo();
    const interval = setInterval(pollDuo, 15000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  const onRefresh = () => { setRefreshing(true); LPHaptics.light(); loadDashboard(); };

  // Persist smokes
  const SMOKE_KEY = '@daily_smokes';
  const SMOKE_DATE_KEY = '@daily_smokes_date';
  const MEAL_KEY = '@daily_meals';
  const MEAL_DATE_KEY = '@daily_date';

  const loadSmokes = async () => {
    const today = new Date().toDateString();
    const storedDate = await AsyncStorage.getItem(SMOKE_DATE_KEY);
    if (storedDate !== today) {
      setSmokesToday(0);
      await AsyncStorage.setItem(SMOKE_DATE_KEY, today);
      await AsyncStorage.setItem(SMOKE_KEY, '0');
    } else {
      const val = await AsyncStorage.getItem(SMOKE_KEY);
      if (val) setSmokesToday(parseInt(val));
    }
  };

  const loadMeals = async () => {
    const today = new Date().toDateString();
    const storedDate = await AsyncStorage.getItem(MEAL_DATE_KEY);
    if (storedDate === today) {
      const stored = await AsyncStorage.getItem(MEAL_KEY);
      if (stored) setMeals(JSON.parse(stored));
    }
  };

  const addSmoke = async (count: number) => {
    const newVal = smokesToday + count;
    setSmokesToday(newVal);
    await AsyncStorage.setItem(SMOKE_KEY, String(newVal));
    await AsyncStorage.setItem(SMOKE_DATE_KEY, new Date().toDateString());
    setSmokeAnimActive(true);
    setTimeout(() => setSmokeAnimActive(false), 2500);
    LPHaptics.error();
    // Notify duo partner
    try { const { logDuoSmokeApi } = await import('../../services/api'); await logDuoSmokeApi(count); } catch (e) { }
  };

  // Water - requires photo proof
  const openWaterCamera = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert('Camera Required', 'Please allow camera access to log water intake with a photo.');
        return;
      }
    }
    setCapturedWaterPhoto(null);
    setShowWaterCamera(true);
  };

  const takeWaterPhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
        setCapturedWaterPhoto(photo.uri);
        LPHaptics.success();
      } catch (e) {
        LPHaptics.error();
        Alert.alert('Error', 'Failed to take photo');
      }
    }
  };

  const confirmWaterLog = async () => {
    if (!capturedWaterPhoto) return;
    
    setVerifyingWater(true);
    try {
      // Read the image and convert to base64
      const base64 = await FileSystem.readAsStringAsync(capturedWaterPhoto, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Verify with AI
      const response = await verifyWaterImageApi(`data:image/jpeg;base64,${base64}`);
      const { isWater, confidence, reason } = response.data;
      
      if (isWater && confidence >= 50) {
        // Water verified - log it
        updateWaterIntake(waterIntake + 1);
        setWaterAnimActive(true);
        setTimeout(() => setWaterAnimActive(false), 1500);
        LPHaptics.success();
        setShowWaterCamera(false);
        setCapturedWaterPhoto(null);
        Alert.alert('💧 Hydrated!', `Water logged! ${confidence >= 80 ? '✨ Perfect shot!' : ''}`);
      } else {
        // Not water - reject
        LPHaptics.error();
        Alert.alert(
          '❌ Not Water Detected',
          reason || 'Please take a clear photo of your water bottle or glass of water.',
          [{ text: 'Try Again', onPress: () => setCapturedWaterPhoto(null) }]
        );
      }
    } catch (error) {
      console.log('Water verification error:', error);
      // On network error, allow with warning
      Alert.alert(
        '⚠️ Verification Unavailable',
        'Could not verify the image. Please make sure this is actually water.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Log Anyway', 
            onPress: () => {
              updateWaterIntake(waterIntake + 1);
              setWaterAnimActive(true);
              setTimeout(() => setWaterAnimActive(false), 1500);
              LPHaptics.success();
              setShowWaterCamera(false);
              setCapturedWaterPhoto(null);
            }
          }
        ]
      );
    } finally {
      setVerifyingWater(false);
    }
  };

  // Goals
  const handleGoalPress = (goalId: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal || goal.completed) return;
    LPHaptics.success();
    toggleGoalCompletion(goalId);
    setSparkleActive(true);
    setTimeout(() => setSparkleActive(false), 2000);
  };

  // Meal - Analyze and show preview
  const handleAnalyzeMeal = async () => {
    if (!mealInput.trim()) return;
    setIsAnalyzing(true);
    try {
      const res = await analyzeFoodApi(mealInput);
      const data: any = res.data;
      setNutritionPreview({
        name: data.name || mealInput,
        calories: data.calories || 0,
        protein: data.protein || 0,
        carbs: data.carbs || 0,
        fats: data.fats || 0,
      });
      setMealMode('preview');
      LPHaptics.success();
    } catch (err: any) {
      LPHaptics.error();
      Alert.alert('Analysis Failed', err.response?.data?.error || 'Could not analyze food.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Confirm and log the meal after preview
  const handleConfirmMeal = async () => {
    if (!nutritionPreview) return;
    const newMeal = {
      id: Date.now().toString(),
      ...nutritionPreview,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const updated = [newMeal, ...meals];
    setMeals(updated);
    await AsyncStorage.setItem(MEAL_KEY, JSON.stringify(updated));
    await AsyncStorage.setItem(MEAL_DATE_KEY, new Date().toDateString());
    
    // Reset modal state
    setMealInput('');
    setNutritionPreview(null);
    setMealMode('select');
    setShowMealModal(false);
    
    setSparkleActive(true);
    setTimeout(() => setSparkleActive(false), 2000);
    LPHaptics.success();
    Alert.alert('🌱 Plant Fed!', `Logged ${newMeal.name} (${newMeal.calories} kcal)`);
  };

  // Generate recipes from pantry ingredients
  const handleGenerateRecipes = async () => {
    if (!ingredientInput.trim()) {
      Alert.alert('Missing Ingredients', 'Please enter ingredients you have in your pantry.');
      return;
    }
    setIsGeneratingRecipes(true);
    try {
      const res = await generatePantryRecipesApi(ingredientInput, mealTypeSelection);
      const data: any = res.data;
      setPantryRecipes(data.recipes || []);
      setMealMode('recipes');
      LPHaptics.success();
    } catch (err: any) {
      LPHaptics.error();
      Alert.alert('Generation Failed', err.response?.data?.error || 'Could not generate recipes.');
    } finally {
      setIsGeneratingRecipes(false);
    }
  };

  // Reset meal modal state
  const closeMealModal = () => {
    setShowMealModal(false);
    setMealMode('select');
    setMealInput('');
    setIngredientInput('');
    setNutritionPreview(null);
    setPantryRecipes([]);
  };

  // Legacy function for backward compatibility
  const handleAddMeal = async () => {
    if (!mealInput.trim()) return;
    setIsAnalyzing(true);
    try {
      const res = await analyzeFoodApi(mealInput);
      const data: any = res.data;
      const newMeal = {
        id: Date.now().toString(),
        name: data.name || mealInput,
        calories: data.calories || 0,
        protein: data.protein || 0,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const updated = [newMeal, ...meals];
      setMeals(updated);
      await AsyncStorage.setItem(MEAL_KEY, JSON.stringify(updated));
      await AsyncStorage.setItem(MEAL_DATE_KEY, new Date().toDateString());
      setMealInput('');
      setIngredientInput('');
      setShowMealModal(false);
      setSparkleActive(true);
      setTimeout(() => setSparkleActive(false), 2000);
      LPHaptics.success();
      Alert.alert('🌱 Plant Fed!', `Logged ${newMeal.name} (${newMeal.calories} kcal)`);
    } catch (err: any) {
      LPHaptics.error();
      Alert.alert('Analysis Failed', err.response?.data?.error || 'Could not analyze food.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const puffCoins = 0;

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <SafeAreaView style={s.safe}>
        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PASTEL.mint} colors={[PASTEL.mint]} />}
        >
          {/* ── Header ── */}
          <Animated.View entering={FadeInDown.delay(50).duration(400)} style={s.header}>
            <View>
              <Text style={s.greeting}>Welcome back,</Text>
              <Text style={s.userName}>{userName}</Text>
            </View>
            <View style={s.coinsBadge}>
              <Ionicons name="logo-bitcoin" size={14} color="#FFD700" />
              <Text style={s.coinsText}>{puffCoins}</Text>
            </View>
          </Animated.View>

          {/* ══════ CONSOLE BODY ══════ */}
          <Animated.View entering={FadeInDown.delay(150).duration(500)} style={s.consoleBody}>

            {/* ── Speaker Dots ── */}
            <View style={s.speakerRow}>
              {[1, 2, 3, 4, 5, 6].map(i => <View key={i} style={s.speakerDot} />)}
            </View>

            {/* ── GAME SCREEN (Garden) ── */}
            <View style={s.screenBezel}>
              <View style={s.screenInner}>
                <GardenScene
                  plantStage={plantStage}
                  waterAnim={waterAnimActive}
                  smokeAnim={smokeAnimActive}
                  sparkleAnim={sparkleActive}
                />
                {/* HUD overlay */}
                <View style={s.hud}>
                  <View style={s.hudItem}>
                    <Ionicons name="flame" size={12} color="#FF6B6B" />
                    <Text style={s.hudText}>{streak}d</Text>
                  </View>
                  <View style={s.hudItem}>
                    <Ionicons name="leaf" size={12} color="#2ECC71" />
                    <Text style={s.hudText}>Lv{plantStage}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ── ACTION BUTTONS AREA ── */}
            <View style={s.actionArea}>
              <View style={s.actionCol}>
                <ActionBtn label="WATER" onPress={openWaterCamera} badge={waterIntake} />
                <ActionBtn label="GOALS" onPress={() => setShowGoalsModal(true)} badge={completedGoals} />
              </View>
              
              <View style={s.actionCenterCol}>
                <SmokeBtnCenter onPress={() => setShowSmokeModal(true)} smokes={smokesToday} />
              </View>

              <View style={s.actionCol}>
                <ActionBtn label="MEAL" onPress={() => setShowMealModal(true)} badge={meals.length} />
                <ActionBtn label={`ON THE\nMOVE`} onPress={() => router.push('/sports-training' as any)} />
              </View>
            </View>

            {/* ── SELECT / START labels ── */}
            <View style={s.selectStartRow}>
              <TouchableOpacity onPress={() => router.push('/sos')} style={s.selectBtn}>
                <Text style={s.selectText}>SOS</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/duo' as any)} style={[s.selectBtn, { backgroundColor: 'rgba(255,107,107,0.5)', borderWidth: 1, borderColor: '#FF6B6B' }]}>
                <Text style={[s.selectText, { color: '#FFF' }]}>🤝 DUO</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/sports-training' as any)} style={s.selectBtn}>
                <Text style={s.selectText}>TRAIN</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* ══════ CONSOLE STATUS PANEL ══════ */}
          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={s.statusPanel}>
            <Text style={s.panelTitle}>🎮 Status Panel</Text>
            <StatusMeter label="Water" value={waterIntake} max={8} color={PASTEL.btnBlue} icon="water" />
            <StatusMeter label="Nutrition" value={meals.length} max={4} color={PASTEL.btnGreen} icon="nutrition" />
            <StatusMeter label="Smoke" value={Math.max(0, 5 - smokesToday)} max={5} color={PASTEL.btnRed} icon="shield-checkmark" />
            <StatusMeter label="Goals" value={completedGoals} max={goals.length || 1} color={PASTEL.btnYellow} icon="trophy" />
          </Animated.View>

          {/* ── Quick Games Row ── */}
          <Animated.View entering={FadeInDown.delay(400).duration(500)} style={s.section}>
            <Text style={s.sectionTitle}>🕹️ Quick Games</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.gamesRow}>
              {[
                { route: '/games/breathing', icon: 'fitness', name: 'Breathe', bg: 'rgba(85,239,196,0.15)' },
                { route: '/games/2048', icon: 'grid', name: '2048', bg: 'rgba(116,185,255,0.15)' },
                { route: '/games/maths-quiz', icon: 'calculator', name: 'Maths', bg: 'rgba(162,155,254,0.15)' },
                { route: '/games/memory-game', icon: 'albums', name: 'Memory', bg: 'rgba(255,183,178,0.15)' },
              ].map((g, i) => (
                <TouchableOpacity key={i} onPress={() => router.push(g.route as any)} style={[s.gameCard, { backgroundColor: g.bg }]}>
                  <Ionicons name={g.icon as any} size={22} color="#FFF" />
                  <Text style={s.gameName}>{g.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>

          {/* ── Community Impact ── */}
          <Animated.View entering={FadeInDown.delay(500).duration(500)} style={[s.section, { marginBottom: 120 }]}>
            <Text style={s.sectionTitle}>🌍 Community Impact</Text>
            <View style={s.impactCard}>
              <View style={s.impactItem}>
                <Text style={s.impactVal}>0</Text>
                <Text style={s.impactLabel}>Cigs Avoided</Text>
              </View>
              <View style={s.impactDivider} />
              <View style={s.impactItem}>
                <Text style={s.impactVal}>₹0</Text>
                <Text style={s.impactLabel}>Money Saved</Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      {/* ══════ MEAL MODAL - Multi-Step ══════ */}
      <Modal visible={showMealModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { maxHeight: '90%' }]}>
            
            {/* Mode Selection */}
            {mealMode === 'select' && (
              <>
                <Text style={s.modalTitle}>🍽️ Meal Options</Text>
                <Text style={s.modalSub}>What would you like to do?</Text>
                
                <TouchableOpacity 
                  style={[s.mealOptionBtn, { backgroundColor: 'rgba(85,239,196,0.15)', borderColor: PASTEL.mint }]}
                  onPress={() => setMealMode('log')}
                >
                  <Ionicons name="restaurant-outline" size={28} color={PASTEL.mint} />
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={s.mealOptionTitle}>Log/Track Meal</Text>
                    <Text style={s.mealOptionDesc}>Record what you ate with nutrition analysis</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color={PASTEL.mint} />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[s.mealOptionBtn, { backgroundColor: 'rgba(116,185,255,0.15)', borderColor: PASTEL.btnBlue }]}
                  onPress={() => setMealMode('plan')}
                >
                  <Ionicons name="bulb-outline" size={28} color={PASTEL.btnBlue} />
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={s.mealOptionTitle}>Plan Next Meal</Text>
                    <Text style={s.mealOptionDesc}>Get recipes based on your pantry ingredients</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color={PASTEL.btnBlue} />
                </TouchableOpacity>

                <TouchableOpacity onPress={closeMealModal} style={s.modalCancel}>
                  <Text style={s.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Log Meal Mode */}
            {mealMode === 'log' && (
              <>
                <View style={s.modalHeader}>
                  <TouchableOpacity onPress={() => setMealMode('select')}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                  </TouchableOpacity>
                  <Text style={[s.modalTitle, { flex: 1, marginLeft: 12, marginBottom: 0 }]}>Log a Meal</Text>
                </View>
                <Text style={s.modalSub}>Describe what you ate — AI will analyze the nutrients!</Text>
                <TextInput
                  style={s.modalInput}
                  placeholder="e.g. Paneer tikka with naan, 2 rotis with dal"
                  placeholderTextColor="#888"
                  value={mealInput}
                  onChangeText={setMealInput}
                  multiline
                />
                <TouchableOpacity 
                  style={[s.modalBtn, isAnalyzing && { opacity: 0.6 }]} 
                  onPress={handleAnalyzeMeal} 
                  disabled={isAnalyzing || !mealInput.trim()}
                >
                  {isAnalyzing ? <ActivityIndicator color="#000" /> : <Text style={s.modalBtnText}>Analyze Nutrition 📊</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={closeMealModal} style={s.modalCancel}>
                  <Text style={s.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Nutrition Preview Mode */}
            {mealMode === 'preview' && nutritionPreview && (
              <>
                <View style={s.modalHeader}>
                  <TouchableOpacity onPress={() => setMealMode('log')}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                  </TouchableOpacity>
                  <Text style={[s.modalTitle, { flex: 1, marginLeft: 12, marginBottom: 0 }]}>Nutrition Preview</Text>
                </View>
                <Text style={s.modalSub}>Review before logging to your plant:</Text>
                
                <View style={s.nutritionCard}>
                  <Text style={s.nutritionName}>{nutritionPreview.name}</Text>
                  
                  <View style={s.nutritionGrid}>
                    <View style={s.nutritionItem}>
                      <Text style={s.nutritionValue}>{nutritionPreview.calories}</Text>
                      <Text style={s.nutritionLabel}>Calories</Text>
                    </View>
                    <View style={s.nutritionItem}>
                      <Text style={[s.nutritionValue, { color: '#FF6B6B' }]}>{nutritionPreview.protein}g</Text>
                      <Text style={s.nutritionLabel}>Protein</Text>
                    </View>
                    <View style={s.nutritionItem}>
                      <Text style={[s.nutritionValue, { color: '#FFD93D' }]}>{nutritionPreview.carbs}g</Text>
                      <Text style={s.nutritionLabel}>Carbs</Text>
                    </View>
                    <View style={s.nutritionItem}>
                      <Text style={[s.nutritionValue, { color: '#74B9FF' }]}>{nutritionPreview.fats}g</Text>
                      <Text style={s.nutritionLabel}>Fats</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity style={s.modalBtn} onPress={handleConfirmMeal}>
                  <Text style={s.modalBtnText}>Confirm & Feed Plant 🌱</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setMealMode('log')} style={s.modalCancel}>
                  <Text style={s.modalCancelText}>Edit Meal</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Plan Meal Mode */}
            {mealMode === 'plan' && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={s.modalHeader}>
                  <TouchableOpacity onPress={() => setMealMode('select')}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                  </TouchableOpacity>
                  <Text style={[s.modalTitle, { flex: 1, marginLeft: 12, marginBottom: 0 }]}>Plan Your Meal</Text>
                </View>
                <Text style={s.modalSub}>Enter ingredients you have — get quick Indian recipes!</Text>
                
                {/* Meal Type Selection */}
                <Text style={[s.modalSub, { marginTop: 12, color: '#FFF', fontWeight: '600' }]}>Meal Type:</Text>
                <View style={s.mealTypeRow}>
                  {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[s.mealTypeBtn, mealTypeSelection === type && s.mealTypeBtnActive]}
                      onPress={() => setMealTypeSelection(type)}
                    >
                      <Text style={[s.mealTypeText, mealTypeSelection === type && s.mealTypeTextActive]}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[s.modalSub, { marginTop: 16, color: '#FFF', fontWeight: '600' }]}>Pantry Ingredients:</Text>
                <TextInput
                  style={[s.modalInput, { minHeight: 80 }]}
                  placeholder="e.g. rice, dal, potatoes, onion, tomatoes, eggs, paneer..."
                  placeholderTextColor="#888"
                  value={ingredientInput}
                  onChangeText={setIngredientInput}
                  multiline
                />
                <Text style={[s.modalSub, { fontSize: 11, marginTop: -4 }]}>
                  Basic spices (salt, turmeric, cumin, etc.) are assumed available
                </Text>

                <TouchableOpacity 
                  style={[s.modalBtn, isGeneratingRecipes && { opacity: 0.6 }]} 
                  onPress={handleGenerateRecipes} 
                  disabled={isGeneratingRecipes || !ingredientInput.trim()}
                >
                  {isGeneratingRecipes ? <ActivityIndicator color="#000" /> : <Text style={s.modalBtnText}>Generate Recipes 🍳</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={closeMealModal} style={s.modalCancel}>
                  <Text style={s.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {/* Recipes Display Mode */}
            {mealMode === 'recipes' && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={s.modalHeader}>
                  <TouchableOpacity onPress={() => setMealMode('plan')}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                  </TouchableOpacity>
                  <Text style={[s.modalTitle, { flex: 1, marginLeft: 12, marginBottom: 0 }]}>Quick Recipes</Text>
                </View>
                <Text style={s.modalSub}>Here are some quick recipes with your ingredients!</Text>
                
                {pantryRecipes.map((recipe: any, index: number) => (
                  <View key={index} style={s.recipeCard}>
                    <View style={s.recipeHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.recipeName}>{recipe.name}</Text>
                        <Text style={s.recipeTime}>⏱️ {recipe.time_minutes} mins</Text>
                      </View>
                      <View style={s.recipeCuisineBadge}>
                        <Text style={s.recipeCuisineText}>{recipe.cuisine}</Text>
                      </View>
                    </View>
                    
                    <Text style={s.recipeIngredientsTitle}>Ingredients:</Text>
                    <Text style={s.recipeIngredients}>{recipe.ingredients?.join(', ')}</Text>
                    
                    <Text style={s.recipeStepsTitle}>Steps:</Text>
                    {recipe.steps?.map((step: string, i: number) => (
                      <Text key={i} style={s.recipeStep}>{step}</Text>
                    ))}
                    
                    {recipe.video && (
                      <TouchableOpacity 
                        style={s.videoBtn}
                        onPress={() => {
                          // Open YouTube video
                          import('react-native').then(({ Linking }) => {
                            Linking.openURL(recipe.video);
                          });
                        }}
                      >
                        <Ionicons name="play-circle" size={20} color="#FF0000" />
                        <Text style={s.videoBtnText}>Watch Video</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                
                <TouchableOpacity onPress={closeMealModal} style={[s.modalCancel, { marginBottom: 20 }]}>
                  <Text style={s.modalCancelText}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ══════ SMOKE MODAL ══════ */}
      <Modal visible={showSmokeModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>🚬 Smoke Tracker</Text>
            <Text style={s.modalSub}>Each cigarette harms your plant. Be honest — your garden reflects you.</Text>
            <View style={s.smokeCounter}>
              <Text style={s.smokeCountLabel}>Today's count</Text>
              <Text style={s.smokeCountVal}>{smokesToday}</Text>
            </View>
            <View style={s.smokeButtons}>
              {[1, 2, 3].map(n => (
                <TouchableOpacity key={n} style={s.smokeAddBtn} onPress={() => addSmoke(n)}>
                  <Text style={s.smokeAddText}>+{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setShowSmokeModal(false)} style={s.modalCancel}>
              <Text style={s.modalCancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ══════ GOALS MODAL ══════ */}
      <Modal visible={showGoalsModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { maxHeight: '80%' }]}>
            <Text style={s.modalTitle}>🏆 Daily Goals</Text>
            <Text style={s.modalSub}>Complete goals to make the sun shine brighter and grow your plant!</Text>
            <ScrollView style={{ marginTop: 12 }}>
              {goals.map(goal => (
                <TouchableOpacity
                  key={goal.id}
                  style={[s.goalRow, goal.completed && s.goalDone]}
                  onPress={() => handleGoalPress(goal.id)}
                  disabled={goal.completed}
                >
                  <View style={[s.goalCheck, goal.completed && s.goalCheckDone]}>
                    {goal.completed && <Ionicons name="checkmark" size={14} color="#000" />}
                  </View>
                  <Text style={[s.goalText, goal.completed && s.goalTextDone]}>{goal.text}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Link href="/goals" asChild>
              <TouchableOpacity style={s.modalBtn} onPress={() => setShowGoalsModal(false)}>
                <Text style={s.modalBtnText}>Manage Goals</Text>
              </TouchableOpacity>
            </Link>
            <TouchableOpacity onPress={() => setShowGoalsModal(false)} style={s.modalCancel}>
              <Text style={s.modalCancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ══ WATER CAMERA MODAL ══ */}
      <Modal visible={showWaterCamera} animationType="slide">
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
              <TouchableOpacity onPress={() => { setShowWaterCamera(false); setCapturedWaterPhoto(null); }}>
                <Ionicons name="close" size={28} color="#FFF" />
              </TouchableOpacity>
              <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold' }}>💧 Log Water</Text>
              <View style={{ width: 28 }} />
            </View>
            
            <Text style={{ color: '#A0AEC0', textAlign: 'center', marginBottom: 12, paddingHorizontal: 20 }}>
              Take a photo of your water bottle or glass to log your hydration!
            </Text>

            {capturedWaterPhoto ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 3, borderColor: PASTEL.btnBlue }}>
                  <Image
                    source={{ uri: capturedWaterPhoto }}
                    style={{ width: SCREEN_W - 80, height: SCREEN_W - 80 }}
                    resizeMode="cover"
                  />
                </View>
                {verifyingWater && (
                  <View style={{ marginTop: 16, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={PASTEL.btnBlue} />
                    <Text style={{ color: '#A0AEC0', marginTop: 8, fontSize: 13 }}>
                      🔍 AI verifying water...
                    </Text>
                  </View>
                )}
                <View style={{ flexDirection: 'row', gap: 16, marginTop: 24 }}>
                  <TouchableOpacity
                    style={{ 
                      backgroundColor: 'rgba(255,255,255,0.1)', 
                      paddingVertical: 14, 
                      paddingHorizontal: 28, 
                      borderRadius: 12,
                      opacity: verifyingWater ? 0.5 : 1 
                    }}
                    onPress={() => setCapturedWaterPhoto(null)}
                    disabled={verifyingWater}
                  >
                    <Text style={{ color: '#FFF', fontWeight: '600' }}>Retake</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ 
                      backgroundColor: PASTEL.btnBlue, 
                      paddingVertical: 14, 
                      paddingHorizontal: 28, 
                      borderRadius: 12,
                      opacity: verifyingWater ? 0.7 : 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8
                    }}
                    onPress={confirmWaterLog}
                    disabled={verifyingWater}
                  >
                    {verifyingWater ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : null}
                    <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
                      {verifyingWater ? 'Verifying...' : '✓ Log Water'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                <CameraView
                  ref={cameraRef}
                  style={{ flex: 1, marginHorizontal: 20, borderRadius: 16, overflow: 'hidden' }}
                  facing="back"
                />
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <TouchableOpacity
                    onPress={takeWaterPhoto}
                    style={{
                      width: 72, height: 72, borderRadius: 36,
                      backgroundColor: PASTEL.btnBlue,
                      alignItems: 'center', justifyContent: 'center',
                      borderWidth: 4, borderColor: '#FFF',
                    }}
                  >
                    <Ionicons name="water" size={32} color="#FFF" />
                  </TouchableOpacity>
                  <Text style={{ color: '#A0AEC0', marginTop: 10, fontSize: 12 }}>Tap to capture</Text>
                </View>
              </View>
            )}
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

// ═══════════════ STYLES ═══════════════
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1A1A2E' },
  safe: { flex: 1 },
  scrollContent: { paddingHorizontal: CONSOLE_PAD },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  greeting: { fontSize: 13, color: '#A0AEC0', fontWeight: '500' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginTop: 2 },
  coinsBadge: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)' },
  coinsText: { color: '#FFD700', fontWeight: 'bold', fontSize: 14, marginLeft: 5 },

  // Console
  consoleBody: {
    backgroundColor: PASTEL.consoleBody,
    borderRadius: 28,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: 16,
  },
  speakerRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 8 },
  speakerDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.2)' },

  // Screen
  screenBezel: {
    backgroundColor: PASTEL.screenBorder,
    borderRadius: 16,
    padding: 6,
    marginBottom: 14,
  },
  screenInner: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  hud: { position: 'absolute', top: 6, left: 8, flexDirection: 'row', gap: 10 },
  hudItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.35)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, gap: 3 },
  hudText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

  // Action Buttons Area
  actionArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, marginBottom: 16, marginTop: 10 },
  actionCol: { width: '30%', alignItems: 'center' },
  actionCenterCol: { width: '40%', alignItems: 'center', justifyContent: 'center' },
  
  actionBtn: { 
    width: '100%', 
    aspectRatio: 1.5,
    backgroundColor: '#F8BBD0', 
    borderRadius: 8, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#F48FB1',
    borderRightWidth: 2,
    borderRightColor: '#Fce4ec',
    borderLeftWidth: 1,
    borderLeftColor: '#Fce4ec',
    borderTopWidth: 1,
    borderTopColor: '#Fce4ec',
    paddingHorizontal: 4,
  },
  actionBtnText: { color: '#C2185B', fontSize: 10, fontWeight: '900', textAlign: 'center', letterSpacing: 0.5 },
  
  smokeBtnCenter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F8BBD0',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 6,
    borderBottomColor: '#F48FB1',
    borderRightWidth: 2,
    borderRightColor: '#F48FB1',
    borderLeftWidth: 1,
    borderLeftColor: '#Fce4ec',
    borderTopWidth: 1,
    borderTopColor: '#Fce4ec',
    marginTop: -10,
  },
  smokeBtnText: { color: '#C2185B', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  smokeBtnIcon: { color: '#C2185B', fontSize: 28, fontWeight: 'bold' },

  btnBadge: { position: 'absolute', top: -6, right: -6, backgroundColor: '#FFF', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1 },
  btnBadgeText: { color: '#C2185B', fontSize: 10, fontWeight: 'bold' },

  // SELECT / START
  selectStartRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, paddingVertical: 8 },
  selectBtn: { backgroundColor: 'rgba(0,0,0,0.25)', paddingHorizontal: 18, paddingVertical: 6, borderRadius: 10 },
  selectText: { color: '#FFF', fontSize: 10, fontWeight: 'bold', letterSpacing: 2 },

  // Status Panel
  statusPanel: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  panelTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 14 },
  meterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  meterLabel: { color: '#A0AEC0', fontSize: 12, width: 62, fontWeight: '600' },
  meterTrack: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' },
  meterFill: { height: '100%', borderRadius: 4 },
  meterValue: { color: '#FFF', fontSize: 11, fontWeight: 'bold', width: 30, textAlign: 'right' },

  // Sections
  section: { marginBottom: 16 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  gamesRow: { gap: 10, paddingRight: 10 },
  gameCard: { width: 80, height: 80, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 6 },
  gameName: { color: '#FFF', fontSize: 11, fontWeight: '600' },

  // Impact
  impactCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 20, flexDirection: 'row', justifyContent: 'space-around', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  impactItem: { alignItems: 'center' },
  impactVal: { color: PASTEL.mint, fontSize: 24, fontWeight: 'bold' },
  impactLabel: { color: '#A0AEC0', fontSize: 12, marginTop: 4 },
  impactDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1E1E2E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF', marginBottom: 6 },
  modalSub: { fontSize: 13, color: '#A0AEC0', marginBottom: 14 },
  modalInput: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 14, color: '#FFF', fontSize: 15, marginBottom: 8, minHeight: 70, textAlignVertical: 'top', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalBtn: { backgroundColor: PASTEL.mint, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 10 },
  modalBtnText: { color: '#000', fontSize: 15, fontWeight: 'bold' },
  modalCancel: { padding: 14, alignItems: 'center' },
  modalCancelText: { color: '#A0AEC0', fontSize: 15 },

  // Smoke modal
  smokeCounter: { alignItems: 'center', marginVertical: 20 },
  smokeCountLabel: { color: '#A0AEC0', fontSize: 13, marginBottom: 6 },
  smokeCountVal: { color: PASTEL.btnRed, fontSize: 48, fontWeight: 'bold' },
  smokeButtons: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 10 },
  smokeAddBtn: { backgroundColor: 'rgba(255,118,117,0.2)', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: PASTEL.btnRed },
  smokeAddText: { color: PASTEL.btnRed, fontSize: 18, fontWeight: 'bold' },

  // Goals modal
  goalRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 14, borderRadius: 12, marginBottom: 8 },
  goalDone: { opacity: 0.5 },
  goalCheck: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  goalCheckDone: { backgroundColor: PASTEL.mint, borderColor: PASTEL.mint },
  goalText: { flex: 1, color: '#FFF', fontSize: 14, fontWeight: '500' },
  goalTextDone: { textDecorationLine: 'line-through', color: '#A0AEC0' },

  // Meal Modal - Mode Selection
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  mealOptionBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 14, 
    borderWidth: 1.5, 
    marginBottom: 12 
  },
  mealOptionTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  mealOptionDesc: { color: '#A0AEC0', fontSize: 12 },
  
  // Meal Type Selection
  mealTypeRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  mealTypeBtn: { 
    flex: 1, 
    paddingVertical: 10, 
    backgroundColor: 'rgba(255,255,255,0.08)', 
    borderRadius: 10, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  mealTypeBtnActive: { 
    backgroundColor: 'rgba(85,239,196,0.15)', 
    borderColor: PASTEL.mint,
  },
  mealTypeText: { color: '#A0AEC0', fontSize: 12, fontWeight: '600' },
  mealTypeTextActive: { color: PASTEL.mint },

  // Nutrition Preview Card
  nutritionCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  nutritionName: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  nutritionGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  nutritionItem: { alignItems: 'center' },
  nutritionValue: { color: PASTEL.mint, fontSize: 24, fontWeight: 'bold' },
  nutritionLabel: { color: '#A0AEC0', fontSize: 11, marginTop: 4 },

  // Recipe Card
  recipeCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  recipeHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  recipeName: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  recipeTime: { color: '#A0AEC0', fontSize: 12, marginTop: 4 },
  recipeCuisineBadge: { 
    backgroundColor: 'rgba(129,236,236,0.2)', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 20 
  },
  recipeCuisineText: { color: PASTEL.mint, fontSize: 11, fontWeight: '600' },
  recipeIngredientsTitle: { color: PASTEL.btnBlue, fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  recipeIngredients: { color: '#A0AEC0', fontSize: 12, lineHeight: 18, marginBottom: 12 },
  recipeStepsTitle: { color: PASTEL.btnBlue, fontSize: 12, fontWeight: 'bold', marginBottom: 6 },
  recipeStep: { color: '#D0D0D0', fontSize: 13, lineHeight: 20, marginBottom: 6 },
  videoBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,0,0,0.1)', 
    paddingVertical: 10, 
    paddingHorizontal: 14, 
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 8,
    gap: 8,
  },
  videoBtnText: { color: '#FF6B6B', fontSize: 13, fontWeight: '600' },
});
