import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
import { analyzeFoodApi, fetchDashboardSummary } from '../../services/api';
import { LPHaptics } from '../../services/haptics';

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
  consoleBody: '#FF6B6B',
  consoleDark: '#E85D5D',
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
  const leafColor = smokeAnim ? '#6B8E6B' : plantStage >= 3 ? '#2ECC71' : '#7EC8A0';
  const sunBrightness = sparkleAnim ? 1 : 0.7 + (plantStage * 0.075);

  return (
    <Svg width={GARDEN_W} height={GARDEN_H} viewBox={`0 0 ${GARDEN_W} ${GARDEN_H}`}>
      <Defs>
        <RadialGradient id="sunGlow" cx="85%" cy="15%" r="20%">
          <Stop offset="0%" stopColor="#FFF176" stopOpacity={String(sunBrightness)} />
          <Stop offset="100%" stopColor="#FFF176" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* Sky */}
      <Rect x="0" y="0" width={String(GARDEN_W)} height={String(GARDEN_H)} fill="#87CEEB" rx="12" />

      {/* Clouds */}
      <Ellipse cx="60" cy="40" rx="30" ry="14" fill="rgba(255,255,255,0.8)" />
      <Ellipse cx="80" cy="35" rx="25" ry="12" fill="rgba(255,255,255,0.9)" />
      <Ellipse cx={String(GARDEN_W - 80)} cy="50" rx="28" ry="13" fill="rgba(255,255,255,0.7)" />

      {/* Sun */}
      <Circle cx={String(GARDEN_W - 50)} cy="40" r="22" fill="#FFD93D" opacity={String(sunBrightness)} />
      <Circle cx={String(GARDEN_W - 50)} cy="40" r="35" fill="url(#sunGlow)" />

      {/* Sun rays when sparkle */}
      {sparkleAnim && (
        <G>
          <Path d={`M${GARDEN_W - 50} 5 L${GARDEN_W - 48} 15 L${GARDEN_W - 52} 15 Z`} fill="#FFD93D" opacity="0.6" />
          <Path d={`M${GARDEN_W - 20} 20 L${GARDEN_W - 25} 28 L${GARDEN_W - 18} 28 Z`} fill="#FFD93D" opacity="0.6" />
          <Path d={`M${GARDEN_W - 80} 20 L${GARDEN_W - 75} 28 L${GARDEN_W - 82} 28 Z`} fill="#FFD93D" opacity="0.6" />
        </G>
      )}

      {/* Ground / Grass */}
      <Rect x="0" y={String(GARDEN_H - 60)} width={String(GARDEN_W)} height="60" fill="#7EC8A0" rx="0" />
      <Rect x="0" y={String(GARDEN_H - 30)} width={String(GARDEN_W)} height="30" fill={PASTEL.soil} />

      {/* Grass blades */}
      {[20, 55, 90, 130, 170, 210, 250].map((x, i) => (
        <Path key={i} d={`M${x} ${GARDEN_H - 60} Q${x + 3} ${GARDEN_H - 75} ${x + 6} ${GARDEN_H - 60}`} fill="#5CB85C" />
      ))}

      {/* Smoke clouds when smoking */}
      {smokeAnim && (
        <G opacity="0.5">
          <Ellipse cx={String(GARDEN_W / 2 - 20)} cy="80" rx="25" ry="12" fill="#9E9E9E" />
          <Ellipse cx={String(GARDEN_W / 2 + 15)} cy="70" rx="20" ry="10" fill="#BDBDBD" />
          <Ellipse cx={String(GARDEN_W / 2)} cy="90" rx="18" ry="9" fill="#757575" />
        </G>
      )}

      {/* Plant based on stage */}
      <G transform={`translate(${GARDEN_W / 2}, ${GARDEN_H - 60})`}>
        {/* Stem */}
        {plantStage >= 0 && (
          <Rect x="-2" y={String(-8 - plantStage * 18)} width="4" height={String(8 + plantStage * 18)} fill={PASTEL.darkGreen} rx="2" />
        )}

        {/* Stage 0: Seed */}
        {plantStage === 0 && (
          <Ellipse cx="0" cy="-4" rx="6" ry="4" fill={PASTEL.brown} />
        )}

        {/* Stage 1: Sprout with 2 tiny leaves */}
        {plantStage >= 1 && (
          <G>
            <Ellipse cx="-10" cy="-22" rx="8" ry="5" fill={leafColor} />
            <Ellipse cx="10" cy="-22" rx="8" ry="5" fill={leafColor} />
          </G>
        )}

        {/* Stage 2: Small plant */}
        {plantStage >= 2 && (
          <G>
            <Ellipse cx="-16" cy="-38" rx="12" ry="7" fill={leafColor} />
            <Ellipse cx="16" cy="-38" rx="12" ry="7" fill={leafColor} />
            <Ellipse cx="0" cy="-46" rx="10" ry="8" fill={leafColor} />
          </G>
        )}

        {/* Stage 3: Bush */}
        {plantStage >= 3 && (
          <G>
            <Ellipse cx="-20" cy="-55" rx="16" ry="10" fill={leafColor} />
            <Ellipse cx="20" cy="-55" rx="16" ry="10" fill={leafColor} />
            <Ellipse cx="0" cy="-65" rx="18" ry="12" fill={leafColor} />
            <Ellipse cx="-12" cy="-70" rx="12" ry="8" fill={leafColor} />
            <Ellipse cx="12" cy="-70" rx="12" ry="8" fill={leafColor} />
          </G>
        )}

        {/* Stage 4: Full Tree */}
        {plantStage >= 4 && (
          <G>
            <Ellipse cx="0" cy="-82" rx="28" ry="18" fill="#27AE60" />
            <Ellipse cx="-18" cy="-78" rx="18" ry="12" fill="#2ECC71" />
            <Ellipse cx="18" cy="-78" rx="18" ry="12" fill="#2ECC71" />
            <Ellipse cx="0" cy="-92" rx="20" ry="12" fill="#27AE60" />
            {/* Flowers */}
            <Circle cx="-12" cy="-88" r="3" fill="#FF6F61" />
            <Circle cx="10" cy="-80" r="3" fill="#FFB7B2" />
            <Circle cx="0" cy="-96" r="3" fill="#FFDAC1" />
          </G>
        )}

        {/* Water droplets animation */}
        {waterAnim && (
          <G>
            <Path d="M-8 -10 Q-6 -16 -4 -10" fill="#74B9FF" opacity="0.8" />
            <Path d="M4 -14 Q6 -20 8 -14" fill="#74B9FF" opacity="0.6" />
            <Path d="M-2 -6 Q0 -12 2 -6" fill="#74B9FF" opacity="0.7" />
          </G>
        )}

        {/* Sparkles */}
        {sparkleAnim && (
          <G>
            <Path d="M-25 -80 L-23 -85 L-21 -80 L-23 -75 Z" fill="#FFD700" opacity="0.8" />
            <Path d="M22 -90 L24 -95 L26 -90 L24 -85 Z" fill="#FFD700" opacity="0.7" />
            <Path d="M0 -100 L2 -105 L4 -100 L2 -95 Z" fill="#FFD700" opacity="0.9" />
          </G>
        )}
      </G>
    </Svg>
  );
};

// ── Console Button ──
const ConsoleButton = ({ icon, label, color, onPress, badge }: any) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPressIn={() => { LPHaptics.light(); scale.value = withSpring(0.88); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      onPress={onPress}
    >
      <Animated.View style={[s.consoleBtn, { backgroundColor: color }, animStyle]}>
        <View style={s.consoleBtnInner}>
          <Ionicons name={icon} size={28} color="#FFF" />
          {badge !== undefined && badge > 0 && (
            <View style={s.btnBadge}>
              <Text style={s.btnBadgeText}>{badge}</Text>
            </View>
          )}
        </View>
        <Text style={s.consoleBtnLabel}>{label}</Text>
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

  // Meal
  const [mealInput, setMealInput] = useState('');
  const [ingredientInput, setIngredientInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [meals, setMeals] = useState<any[]>([]);

  // Smoke
  const [smokesToday, setSmokesToday] = useState(0);

  // Animations
  const [waterAnimActive, setWaterAnimActive] = useState(false);
  const [smokeAnimActive, setSmokeAnimActive] = useState(false);
  const [sparkleActive, setSparkleActive] = useState(false);

  const { goals, toggleGoalCompletion, waterIntake, updateWaterIntake, streak } = useGoals();
  const completedGoals = goals.filter(g => g.completed).length;

  // Plant stage
  const plantStage = getPlantStage(waterIntake, completedGoals, goals.length, smokesToday);

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
  };

  // Water
  const handleWater = () => {
    if (waterIntake >= 12) return;
    updateWaterIntake(waterIntake + 1);
    setWaterAnimActive(true);
    setTimeout(() => setWaterAnimActive(false), 1500);
    LPHaptics.success();
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

  // Meal
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

            {/* ── D-Pad decorative ── */}
            <View style={s.dpadArea}>
              <View style={s.dpad}>
                <View style={[s.dpadBtn, s.dpadUp]} />
                <View style={s.dpadRow}>
                  <View style={[s.dpadBtn, s.dpadLeft]} />
                  <View style={s.dpadCenter} />
                  <View style={[s.dpadBtn, s.dpadRight]} />
                </View>
                <View style={[s.dpadBtn, s.dpadDown]} />
              </View>

              {/* ── 4 GAME BUTTONS ── */}
              <View style={s.buttonsGrid}>
                <ConsoleButton icon="water" label="Water" color={PASTEL.btnBlue} onPress={handleWater} badge={waterIntake} />
                <ConsoleButton icon="restaurant" label="Meal" color={PASTEL.btnGreen} onPress={() => setShowMealModal(true)} badge={meals.length} />
                <ConsoleButton icon="cloud" label="Smoke" color={PASTEL.btnRed} onPress={() => setShowSmokeModal(true)} badge={smokesToday} />
                <ConsoleButton icon="trophy" label="Goals" color={PASTEL.btnYellow} onPress={() => setShowGoalsModal(true)} badge={completedGoals} />
              </View>
            </View>

            {/* ── SELECT / START labels ── */}
            <View style={s.selectStartRow}>
              <TouchableOpacity onPress={() => router.push('/sos')} style={s.selectBtn}>
                <Text style={s.selectText}>SOS</Text>
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

      {/* ══════ MEAL MODAL ══════ */}
      <Modal visible={showMealModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>🍽️ Log a Meal</Text>
            <Text style={s.modalSub}>Describe what you ate — AI will calculate nutrients and feed your plant!</Text>
            <TextInput
              style={s.modalInput}
              placeholder="e.g. Paneer tikka with naan"
              placeholderTextColor="#888"
              value={mealInput}
              onChangeText={setMealInput}
              multiline
            />
            <Text style={[s.modalSub, { marginTop: 12 }]}>Ingredients you have at home (optional):</Text>
            <TextInput
              style={[s.modalInput, { minHeight: 50 }]}
              placeholder="e.g. rice, dal, tomatoes, onions"
              placeholderTextColor="#888"
              value={ingredientInput}
              onChangeText={setIngredientInput}
            />
            <TouchableOpacity style={[s.modalBtn, isAnalyzing && { opacity: 0.6 }]} onPress={handleAddMeal} disabled={isAnalyzing}>
              {isAnalyzing ? <ActivityIndicator color="#000" /> : <Text style={s.modalBtnText}>Analyze & Feed Plant 🌱</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowMealModal(false)} style={s.modalCancel}>
              <Text style={s.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
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

  // D-Pad + Buttons area
  dpadArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, marginBottom: 10 },
  dpad: { alignItems: 'center' },
  dpadRow: { flexDirection: 'row', alignItems: 'center' },
  dpadBtn: { width: 24, height: 24, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 3 },
  dpadUp: { borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  dpadDown: { borderBottomLeftRadius: 6, borderBottomRightRadius: 6 },
  dpadLeft: { borderTopLeftRadius: 6, borderBottomLeftRadius: 6 },
  dpadRight: { borderTopRightRadius: 6, borderBottomRightRadius: 6 },
  dpadCenter: { width: 24, height: 24, backgroundColor: 'rgba(0,0,0,0.2)' },

  // Console Buttons
  buttonsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', maxWidth: 170 },
  consoleBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  consoleBtnInner: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  consoleBtnLabel: { color: '#FFF', fontSize: 9, fontWeight: 'bold', marginTop: 2, textTransform: 'uppercase' },
  btnBadge: { position: 'absolute', top: -8, right: -12, backgroundColor: '#FFF', borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  btnBadgeText: { color: '#333', fontSize: 10, fontWeight: 'bold' },

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
});
