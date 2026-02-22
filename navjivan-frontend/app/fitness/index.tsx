import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    Platform,
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
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import GameGarden from '../../components/GameGarden';
import { LPColors } from '../../constants/theme';
import { AuthContext } from '../../context/AuthContext';
import { useGoals } from '../../context/GoalsContext';
import { useSteps } from '../../context/StepsContext';
import { analyzeFoodApi, verifyWaterImageApi } from '../../services/api';
import { LPHaptics } from '../../services/haptics';
import * as FileSystem from 'expo-file-system';

const { width: SCREEN_W } = Dimensions.get('window');
const PAD = 16;
const GW = SCREEN_W - PAD * 2 - 24;
const GH = 240;

const PASTEL = {
    coral: '#FF6B6B', btnBlue: '#74B9FF', btnGreen: '#55EFC4',
    btnYellow: '#FFEAA7', btnRed: '#FF7675', mint: '#A8E6CF',
    soil: '#5C4033', darkGreen: '#2D6A4F',
};

// ── Plant Stage (0-4) for NON-SMOKERS ──
// No smoke penalty - focused on healthy habits
const getPlantStage = (water: number, done: number, total: number, mealsCount: number, steps: number) => {
    let score = 0;
    score += Math.min(water, 8) * 4;          // max 32
    score += Math.min(mealsCount, 3) * 12;    // max 36
    if (total > 0) score += (done / total) * 20; // max 20
    score += Math.min(steps / 1000, 12);      // max 12 for 10k+ steps
    score = Math.max(0, Math.min(100, score));
    if (score >= 70) return 4;  // Full tree
    if (score >= 45) return 3;  // Bush
    if (score >= 25) return 2;  // Small plant
    if (score >= 10) return 1;  // Sprout
    return 0;                    // Seed
};


// ── Console Button with bounce ──
const CBtn = ({ icon, label, color, onPress, badge }: any) => {
    const sc = useSharedValue(1);
    const as = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));
    return (
        <Pressable
            onPressIn={() => { LPHaptics.light(); sc.value = withSequence(withTiming(0.8, { duration: 80 }), withSpring(1.05, { damping: 3, stiffness: 200 })); }}
            onPressOut={() => { sc.value = withSpring(1, { damping: 8 }); }}
            onPress={onPress}
        >
            <Animated.View style={[st.cBtn, { backgroundColor: color }, as]}>
                <View style={{ alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <Ionicons name={icon} size={26} color="#FFF" />
                    {badge !== undefined && badge > 0 && <View style={st.badge}><Text style={st.badgeT}>{badge}</Text></View>}
                </View>
                <Text style={st.cBtnL}>{label}</Text>
            </Animated.View>
        </Pressable>
    );
};

// ── Meter ──
const Meter = ({ label, value, max, color, icon }: any) => (
    <View style={st.mRow}>
        <Ionicons name={icon} size={16} color={color} />
        <Text style={st.mLabel}>{label}</Text>
        <View style={st.mTrack}><View style={[st.mFill, { width: `${Math.min((value / max) * 100, 100)}%`, backgroundColor: color }]} /></View>
        <Text style={st.mVal}>{value}/{max}</Text>
    </View>
);

// ═══════ MAIN ═══════
export default function FitnessHomeScreen() {
    const auth: any = useContext(AuthContext);
    const router = useRouter();
    const userName = auth?.user?.name || 'Athlete';
    const { goals = [], toggleGoalCompletion, fitnessLevel = 'beginner', waterIntake = 0, updateWaterIntake, streak = 0 } = useGoals() || {};
    const { currentSteps = 0, caloriesBurnt = 0 } = useSteps() || {};

    const [refreshing, setRefreshing] = useState(false);

    // Modals (no smoke modal for non-smokers)
    const [showMeal, setShowMeal] = useState(false);
    const [showGoals, setShowGoals] = useState(false);
    const [showBMI, setShowBMI] = useState(false);

    // Meal
    const [mealInput, setMealInput] = useState('');
    const [ingredientInput, setIngredientInput] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [meals, setMeals] = useState<any[]>([]);

    // Remove smoking tracking for solo non-smoker
    const [smokesToday, setSmokesToday] = useState(0);
    // Determine if smoking features should be shown
    const isSmoker = auth?.user?.isSmoker === true;
    const inDuoWithSmoker = auth?.user?.appMode === 'duo' && auth?.user?.duoPartnerIsSmoker === true;
    const showSmokingFeatures = isSmoker || inDuoWithSmoker;

    // BMI
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [bmi, setBmi] = useState<number | null>(null);
    const [bmiCategory, setBmiCategory] = useState('');

    // Sports Training
    const [sportInput, setSportInput] = useState('');
    const [loadingSport, setLoadingSport] = useState(false);
    const [sportGoals, setSportGoals] = useState<any[]>([]);
    const [sportError, setSportError] = useState('');

    // Animations (no smoke animation for non-smokers)
    const [waterAnim, setWaterAnim] = useState(false);
    const [sparkle, setSparkle] = useState(false);

    // Water photo camera
    const [showWaterCamera, setShowWaterCamera] = useState(false);
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const cameraRef = useRef<any>(null);
    const [capturedWaterPhoto, setCapturedWaterPhoto] = useState<string | null>(null);
    const [verifyingWater, setVerifyingWater] = useState(false);

    const completedGoals = goals.filter((g: any) => g.completed).length;
    const localPlantStage = getPlantStage(waterIntake, completedGoals, goals.length, meals.length, currentSteps);

    // Duo sync: use shared plant stage when in active duo
    const [duoPlantStage, setDuoPlantStage] = useState<number | null>(null);
    const plantStage = duoPlantStage !== null ? duoPlantStage : localPlantStage;

    // ── Load persisted data ──
    useEffect(() => {
        (async () => {
            // Meals only (no smoke tracking for non-smokers)
            const today = new Date().toDateString();
            const md = await AsyncStorage.getItem('@daily_date');
            if (md === today) { const m = await AsyncStorage.getItem('@daily_meals'); if (m) setMeals(JSON.parse(m)); }
            // BMI
            const sb = await AsyncStorage.getItem('@saved_bmi');
            const sh = await AsyncStorage.getItem('@saved_height');
            const sw = await AsyncStorage.getItem('@saved_weight');
            if (sb) { setBmi(parseFloat(sb)); setBmiCategory(getBMICategory(parseFloat(sb))); }
            if (sh) setHeight(sh);
            if (sw) setWeight(sw);
        })();
    }, []);

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
                    steps: currentSteps,
                    calories: caloriesBurnt,
                });
            } catch (e) {
                // silently fail if not in a duo
            }
        };
        // Debounce: only sync after 2 seconds of no changes
        const timer = setTimeout(syncDuo, 2000);
        return () => clearTimeout(timer);
    }, [waterIntake, meals.length, completedGoals, smokesToday, currentSteps, caloriesBurnt]);

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

    const getBMICategory = (v: number) => v < 18.5 ? 'Underweight' : v < 25 ? 'Normal' : v < 30 ? 'Overweight' : 'Obese';
    const getBMIColor = (v: number | null) => !v ? '#999' : v < 18.5 ? '#3B82F6' : v < 25 ? LPColors.primary : v < 30 ? '#F59E0B' : '#EF4444';

    const calculateBMI = async () => {
        const h = parseFloat(height), w = parseFloat(weight);
        if (!h || !w || h <= 0 || w <= 0) return;
        const val = Math.round((w / ((h / 100) * (h / 100))) * 10) / 10;
        setBmi(val); setBmiCategory(getBMICategory(val));
        await AsyncStorage.setItem('@saved_bmi', val.toString());
        await AsyncStorage.setItem('@saved_height', height);
        await AsyncStorage.setItem('@saved_weight', weight);
        LPHaptics.success(); setShowBMI(false);
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
                setWaterAnim(true);
                setTimeout(() => setWaterAnim(false), 3500);
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
                            setWaterAnim(true);
                            setTimeout(() => setWaterAnim(false), 3500);
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

    // Smoke
    const addSmoke = async (n: number) => {
        const v = smokesToday + n; setSmokesToday(v);
        await AsyncStorage.setItem('@daily_smokes', String(v));
        await AsyncStorage.setItem('@daily_smokes_date', new Date().toDateString());
        setSmokeAnim(true); setTimeout(() => setSmokeAnim(false), 4000);
        LPHaptics.error();
        // Notify duo partner
        try { const { logDuoSmokeApi } = await import('../../services/api'); await logDuoSmokeApi(n); } catch (e) { }
    };

    // Goals
    const handleGoalPress = (id: number) => {
        const g = goals.find((x: any) => x.id === id);
        if (!g || g.completed) return;
        LPHaptics.success(); toggleGoalCompletion(id);
        setSparkle(true); setTimeout(() => setSparkle(false), 3500);
    };

    // Meal
    const handleAddMeal = async () => {
        if (!mealInput.trim()) return;
        setIsAnalyzing(true);
        try {
            const res = await analyzeFoodApi(mealInput);
            const d: any = res.data;
            const m = { id: Date.now().toString(), name: d.name || mealInput, calories: d.calories || 0, protein: d.protein || 0, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
            const up = [m, ...meals]; setMeals(up);
            await AsyncStorage.setItem('@daily_meals', JSON.stringify(up));
            await AsyncStorage.setItem('@daily_date', new Date().toDateString());
            setMealInput(''); setIngredientInput(''); setShowMeal(false);
            setSparkle(true); setTimeout(() => setSparkle(false), 3500);
            LPHaptics.success(); Alert.alert('🌱 Plant Fed!', `Logged ${m.name} (${m.calories} kcal)`);
        } catch (e: any) { LPHaptics.error(); Alert.alert('Failed', e.response?.data?.error || 'Could not analyze.'); }
        finally { setIsAnalyzing(false); }
    };

    // Sports Training
    const generateSportGoals = async () => {
        if (!sportInput.trim()) { setSportError('Please enter a sport'); return; }
        setLoadingSport(true); setSportError(''); LPHaptics.light();
        try {
            const LOCAL_IP = "10.47.0.89";
            const BASE_URL = Platform.OS === "android" ? `http://${LOCAL_IP}:5000` : "http://localhost:5000";
            const r = await fetch(`${BASE_URL}/ai-coach/generate-training`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sport: sportInput.trim() }) });
            if (!r.ok) { setSportError(`Server error: ${r.status}`); LPHaptics.error(); return; }
            const data = await r.json();
            if (data.success && data.programs?.length > 0) {
                const p = data.programs[0];
                setSportGoals(p.exercises.map((e: string, i: number) => ({ id: Date.now() + i, text: e, icon: p.icon, completed: false })));
                setSportInput(''); LPHaptics.success();
            } else { setSportError('Failed to generate.'); LPHaptics.error(); }
        } catch (e: any) { setSportError(e.message || 'Connection failed'); LPHaptics.error(); }
        finally { setLoadingSport(false); }
    };

    const handleSportGoalPress = (id: number) => { setSportGoals(p => p.map(g => g.id === id ? { ...g, completed: !g.completed } : g)); LPHaptics.success(); };

    const onRefresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 800); };

    return (
        <View style={st.root}>
            <StatusBar style="light" />
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PASTEL.mint} colors={[PASTEL.mint]} />}>

                    {/* Header */}
                    <Animated.View entering={FadeInDown.delay(50).duration(400)} style={st.header}>
                        <View>
                            <Text style={st.greet}>Let's get moving,</Text>
                            <Text style={st.name}>{userName}</Text>
                        </View>
                        <View style={st.coins}><Ionicons name="logo-bitcoin" size={14} color="#FFD700" /><Text style={st.coinsT}>0</Text></View>
                    </Animated.View>

                    {/* ══ CONSOLE ══ */}
                    <Animated.View entering={FadeInDown.delay(150).duration(500)} style={st.console}>
                        <View style={st.speakerRow}>{[1, 2, 3, 4, 5, 6].map(i => <View key={i} style={st.spkDot} />)}</View>

                        {/* Screen */}
                        <View style={st.bezel}>
                            <View style={st.screen}>
                                <GameGarden width={GW} height={GH} plantStage={plantStage} waterAnim={waterAnim} smokeAnim={false} sparkleAnim={sparkle} />
                                <View style={st.hud}>
                                    <View style={st.hudI}><Ionicons name="flame" size={12} color="#FF6B6B" /><Text style={st.hudT}>{streak}d</Text></View>
                                    <View style={st.hudI}><Ionicons name="footsteps" size={12} color="#FFF" /><Text style={st.hudT}>{currentSteps}</Text></View>
                                    <View style={st.hudI}><Ionicons name="leaf" size={12} color="#2ECC71" /><Text style={st.hudT}>Lv{plantStage}</Text></View>
                                </View>
                            </View>
                        </View>

                        {/* D-Pad + Buttons */}
                        <View style={st.dArea}>
                            <View style={st.dpad}>
                                <View style={[st.dBtn, st.dUp]} />
                                <View style={st.dRow}><View style={[st.dBtn, st.dLeft]} /><View style={st.dC} /><View style={[st.dBtn, st.dRight]} /></View>
                                <View style={[st.dBtn, st.dDown]} />
                            </View>
                            <View style={st.btns}>
                                <CBtn icon="water" label="Water" color={PASTEL.btnBlue} onPress={openWaterCamera} badge={waterIntake} />
                                <CBtn icon="restaurant" label="Meal" color={PASTEL.btnGreen} onPress={() => setShowMeal(true)} badge={meals.length} />
                                <CBtn icon="trophy" label="Goals" color={PASTEL.btnYellow} onPress={() => setShowGoals(true)} badge={completedGoals} />
                            </View>
                        </View>

                        {/* Select/Start */}
                        <View style={st.ssRow}>
                            <TouchableOpacity onPress={() => setShowBMI(true)} style={st.ssBtn}><Text style={st.ssT}>BMI</Text></TouchableOpacity>
                            <TouchableOpacity onPress={() => router.push('/duo' as any)} style={[st.ssBtn, { backgroundColor: 'rgba(255,107,107,0.5)', borderWidth: 1, borderColor: PASTEL.coral }]}><Text style={[st.ssT, { color: '#FFF' }]}>🤝 DUO</Text></TouchableOpacity>
                            <TouchableOpacity onPress={() => router.push('/sports-training' as any)} style={st.ssBtn}><Text style={st.ssT}>TRAIN</Text></TouchableOpacity>
                        </View>
                    </Animated.View>

                    {/* ══ STATUS PANEL — styled as game cartridge ══ */}
                    <Animated.View entering={FadeInDown.delay(300).duration(500)} style={st.cartridge}>
                        <View style={st.cartLabel}><Text style={st.cartLabelT}>STATUS</Text></View>
                        <Meter label="Water" value={waterIntake} max={8} color={PASTEL.btnBlue} icon="water" />
                        <Meter label="Meals" value={meals.length} max={4} color={PASTEL.btnGreen} icon="nutrition" />
                        {showSmokingFeatures && (
                            <Meter label="Shield" value={Math.max(0, 5 - smokesToday)} max={5} color={PASTEL.btnRed} icon="shield-checkmark" />
                        )}
                        <Meter label="Goals" value={completedGoals} max={goals.length || 1} color={PASTEL.btnYellow} icon="trophy" />
                        <Meter label="Steps" value={Math.min(currentSteps, 10000)} max={10000} color="#A8E6CF" icon="footsteps" />
                        <Meter label="Energy" value={Math.min(caloriesBurnt, 500)} max={500} color="#FFB7B2" icon="flame" />
                    </Animated.View>

                    {/* ══ SPORTS TRAINING — game menu style ══ */}
                    <Animated.View entering={FadeInDown.delay(400).duration(500)} style={st.gameMenu}>
                        <View style={st.menuHeader}>
                            <Text style={st.menuHeaderT}>⚔️ TRAINING MODE</Text>
                            <View style={st.menuDots}><View style={st.menuDot} /><View style={st.menuDot} /><View style={st.menuDot} /></View>
                        </View>
                        <View style={st.menuBody}>
                            <View style={st.sportRow}>
                                <Ionicons name="search" size={16} color={PASTEL.coral} style={{ marginRight: 10 }} />
                                <TextInput style={st.sportInp} placeholder="Enter your sport..." placeholderTextColor="rgba(255,255,255,0.3)" value={sportInput} onChangeText={setSportInput} onSubmitEditing={generateSportGoals} returnKeyType="search" />
                            </View>
                            <TouchableOpacity onPress={generateSportGoals} disabled={loadingSport} style={st.menuBtn}>
                                {loadingSport ? <ActivityIndicator color="#FFF" size="small" /> : <><Ionicons name="sparkles" size={14} color="#FFF" style={{ marginRight: 6 }} /><Text style={st.menuBtnT}>Generate Training</Text></>}
                            </TouchableOpacity>
                            {sportError ? <View style={st.sportErr}><Ionicons name="alert-circle" size={14} color="#FF6B6B" /><Text style={st.sportErrT}>{sportError}</Text></View> : null}
                        </View>
                        {sportGoals.length > 0 && <View style={{ gap: 6, paddingHorizontal: 12, paddingBottom: 12 }}>
                            {sportGoals.map(g => (
                                <TouchableOpacity key={g.id} onPress={() => handleSportGoalPress(g.id)} style={[st.gRow, g.completed && st.gDone]}>
                                    <View style={[st.gChk, g.completed && st.gChkD]}>{g.completed && <Ionicons name="checkmark" size={12} color="#000" />}</View>
                                    <Text style={[st.gTxt, g.completed && st.gTxtD]}>{g.text}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>}
                    </Animated.View>

                    {/* ══ MINI GAMES — game cartridge row ══ */}
                    <Animated.View entering={FadeInDown.delay(500).duration(500)} style={st.gameMenu}>
                        <View style={st.menuHeader}>
                            <Text style={st.menuHeaderT}>🕹️ MINI GAMES</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, padding: 12 }}>
                            {[
                                { r: '/games/breathing', i: 'fitness', n: 'Breathe', c: PASTEL.btnGreen },
                                { r: '/games/memory-game', i: 'albums', n: 'Memory', c: PASTEL.btnRed },
                                { r: '/games/2048', i: 'grid', n: '2048', c: PASTEL.btnBlue },
                                { r: '/games/maths-quiz', i: 'calculator', n: 'Maths', c: PASTEL.btnYellow },
                            ].map((g, i) => (
                                <TouchableOpacity key={i} onPress={() => router.push(g.r as any)} style={[st.miniCart, { borderColor: g.c }]}>
                                    <View style={[st.miniCartTop, { backgroundColor: g.c }]}>
                                        <Ionicons name={g.i as any} size={22} color="#FFF" />
                                    </View>
                                    <Text style={st.miniCartN}>{g.n}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </Animated.View>

                    {/* ══ BMI — styled as game achievement card ══ */}
                    <Animated.View entering={FadeInDown.delay(600).duration(500)} style={{ marginBottom: 120 }}>
                        <TouchableOpacity onPress={() => setShowBMI(true)} activeOpacity={0.8} style={st.bmiGame}>
                            <View style={st.bmiGameHeader}>
                                <View style={st.bmiGameIcon}><Ionicons name="body" size={20} color="#FFF" /></View>
                                <View style={{ flex: 1 }}>
                                    <Text style={st.bmiGameT}>BODY STATS</Text>
                                    <Text style={st.bmiGameS}>Check your BMI index</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.5)" />
                            </View>
                            {bmi ? (
                                <View style={st.bmiGameResult}>
                                    <View><Text style={st.bmiGameV}>{bmi}</Text><Text style={st.bmiGameVL}>BMI</Text></View>
                                    <View style={[st.bmiGameBadge, { backgroundColor: getBMIColor(bmi) }]}><Text style={st.bmiGameBadgeT}>{bmiCategory}</Text></View>
                                </View>
                            ) : null}
                        </TouchableOpacity>
                    </Animated.View>

                </ScrollView>
            </SafeAreaView>

            {/* ══ MEAL MODAL ══ */}
            <Modal visible={showMeal} transparent animationType="slide">
                <View style={st.mo}><View style={st.mc}>
                    <Text style={st.mT}>🍽️ Log a Meal</Text>
                    <Text style={st.mS}>Describe what you ate — AI will calculate nutrients and feed your plant!</Text>
                    <TextInput style={st.mI} placeholder="e.g. Paneer tikka with naan" placeholderTextColor="#888" value={mealInput} onChangeText={setMealInput} multiline />
                    <Text style={[st.mS, { marginTop: 10 }]}>Ingredients at home (optional):</Text>
                    <TextInput style={[st.mI, { minHeight: 50 }]} placeholder="e.g. rice, dal, tomatoes" placeholderTextColor="#888" value={ingredientInput} onChangeText={setIngredientInput} />
                    <TouchableOpacity style={[st.mBtn, isAnalyzing && { opacity: 0.6 }]} onPress={handleAddMeal} disabled={isAnalyzing}>
                        {isAnalyzing ? <ActivityIndicator color="#000" /> : <Text style={st.mBtnT}>Analyze & Feed Plant 🌱</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowMeal(false)} style={st.mCancel}><Text style={st.mCancelT}>Cancel</Text></TouchableOpacity>
                </View></View>
            </Modal>

            {/* ══ SMOKE MODAL ══ */}
            {showSmokingFeatures && (
                <Modal visible={showSmoke} transparent animationType="slide">
                    <View style={st.mo}><View style={st.mc}>
                        <Text style={st.mT}>🚬 Smoke Tracker</Text>
                        <Text style={st.mS}>Each cigarette harms your plant. Be honest.</Text>
                        <View style={{ alignItems: 'center', marginVertical: 20 }}>
                            <Text style={{ color: '#999', fontSize: 13 }}>Today's count</Text>
                            <Text style={{ color: PASTEL.btnRed, fontSize: 48, fontWeight: 'bold' }}>{smokesToday}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 10 }}>
                            {[1, 2, 3].map(n => <TouchableOpacity key={n} style={st.smkBtn} onPress={() => addSmoke(n)}><Text style={st.smkT}>+{n}</Text></TouchableOpacity>)}
                        </View>
                        <TouchableOpacity onPress={() => setShowSmoke(false)} style={st.mCancel}><Text style={st.mCancelT}>Close</Text></TouchableOpacity>
                    </View></View>
                </Modal>
            )}

            {/* ══ GOALS MODAL ══ */}
            <Modal visible={showGoals} transparent animationType="slide">
                <View style={st.mo}><View style={[st.mc, { maxHeight: '80%' }]}>
                    <Text style={st.mT}>🏆 Daily Goals</Text>
                    <Text style={st.mS}>Complete goals to grow your plant!</Text>
                    <ScrollView style={{ marginTop: 12 }}>
                        {goals.map((g: any) => (
                            <TouchableOpacity key={g.id} style={[st.gRow, g.completed && st.gDone]} onPress={() => handleGoalPress(g.id)} disabled={g.completed}>
                                <View style={[st.gChk, g.completed && st.gChkD]}>{g.completed && <Ionicons name="checkmark" size={14} color="#000" />}</View>
                                <Text style={[st.gTxt, g.completed && st.gTxtD]}>{g.text}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <Link href="/goals" asChild>
                        <TouchableOpacity style={st.mBtn} onPress={() => setShowGoals(false)}><Text style={st.mBtnT}>Manage Goals</Text></TouchableOpacity>
                    </Link>
                    <TouchableOpacity onPress={() => setShowGoals(false)} style={st.mCancel}><Text style={st.mCancelT}>Close</Text></TouchableOpacity>
                </View></View>
            </Modal>

            {/* ══ BMI MODAL ══ */}
            <Modal visible={showBMI} transparent animationType="slide">
                <View style={st.mo}><View style={st.mc}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <Text style={st.mT}>BMI Calculator</Text>
                        <TouchableOpacity onPress={() => setShowBMI(false)}><Ionicons name="close" size={24} color="#FFF" /></TouchableOpacity>
                    </View>
                    <Text style={{ color: '#999', fontSize: 13, marginBottom: 6 }}>Height (cm)</Text>
                    <TextInput style={st.mI} placeholder="175" placeholderTextColor="#666" keyboardType="numeric" value={height} onChangeText={setHeight} />
                    <Text style={{ color: '#999', fontSize: 13, marginBottom: 6, marginTop: 12 }}>Weight (kg)</Text>
                    <TextInput style={st.mI} placeholder="70" placeholderTextColor="#666" keyboardType="numeric" value={weight} onChangeText={setWeight} />
                    <TouchableOpacity onPress={calculateBMI} style={[st.mBtn, { marginTop: 16 }]}>
                        <Text style={st.mBtnT}>Calculate BMI</Text>
                    </TouchableOpacity>
                    <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 16, marginTop: 16 }}>
                        <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '600', marginBottom: 10 }}>BMI Categories:</Text>
                        {[['Underweight (< 18.5)', '#3B82F6'], ['Normal (18.5 - 24.9)', LPColors.primary], ['Overweight (25 - 29.9)', '#F59E0B'], ['Obese (≥ 30)', '#EF4444']].map(([t, c], i) => (
                            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c as string, marginRight: 10 }} />
                                <Text style={{ color: '#999', fontSize: 12 }}>{t}</Text>
                            </View>
                        ))}
                    </View>
                </View></View>
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

// ═══════ STYLES ═══════
const st = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#1A1A2E' },
    scroll: { paddingHorizontal: PAD },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
    greet: { fontSize: 13, color: '#A0AEC0' },
    name: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginTop: 2 },
    coins: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)' },
    coinsT: { color: '#FFD700', fontWeight: 'bold', fontSize: 14, marginLeft: 5 },

    // Console
    console: { backgroundColor: PASTEL.coral, borderRadius: 28, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 12, marginBottom: 16 },
    speakerRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 8 },
    spkDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.2)' },
    bezel: { backgroundColor: '#333', borderRadius: 16, padding: 6, marginBottom: 14 },
    screen: { borderRadius: 12, overflow: 'hidden', position: 'relative' },
    hud: { position: 'absolute', top: 6, left: 8, flexDirection: 'row', gap: 8 },
    hudI: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.35)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, gap: 3 },
    hudT: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

    dArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, marginBottom: 10 },
    dpad: { alignItems: 'center' },
    dRow: { flexDirection: 'row', alignItems: 'center' },
    dBtn: { width: 24, height: 24, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 3 },
    dUp: { borderTopLeftRadius: 6, borderTopRightRadius: 6 },
    dDown: { borderBottomLeftRadius: 6, borderBottomRightRadius: 6 },
    dLeft: { borderTopLeftRadius: 6, borderBottomLeftRadius: 6 },
    dRight: { borderTopRightRadius: 6, borderBottomRightRadius: 6 },
    dC: { width: 24, height: 24, backgroundColor: 'rgba(0,0,0,0.2)' },

    btns: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', maxWidth: 170 },
    cBtn: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 6, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
    cBtnL: { color: '#FFF', fontSize: 9, fontWeight: 'bold', marginTop: 2, textTransform: 'uppercase' },
    badge: { position: 'absolute', top: -8, right: -12, backgroundColor: '#FFF', borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
    badgeT: { color: '#333', fontSize: 10, fontWeight: 'bold' },

    ssRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, paddingVertical: 8 },
    ssBtn: { backgroundColor: 'rgba(0,0,0,0.25)', paddingHorizontal: 18, paddingVertical: 6, borderRadius: 10 },
    ssT: { color: '#FFF', fontSize: 10, fontWeight: 'bold', letterSpacing: 2 },

    // Panel — Game Cartridge
    cartridge: { backgroundColor: PASTEL.coral, borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 3, borderColor: 'rgba(0,0,0,0.15)' },
    cartLabel: { backgroundColor: 'rgba(0,0,0,0.2)', alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 4, borderRadius: 8, marginBottom: 12 },
    cartLabelT: { color: '#FFF', fontSize: 11, fontWeight: 'bold', letterSpacing: 3 },
    mRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
    mLabel: { color: '#FFF', fontSize: 11, width: 52, fontWeight: 'bold', textTransform: 'uppercase' },
    mTrack: { flex: 1, height: 10, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 5, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
    mFill: { height: '100%', borderRadius: 5 },
    mVal: { color: '#FFF', fontSize: 10, fontWeight: 'bold', width: 50, textAlign: 'right' },

    // Game Menu Sections
    gameMenu: { backgroundColor: 'rgba(255,107,107,0.12)', borderRadius: 20, marginBottom: 16, borderWidth: 2, borderColor: 'rgba(255,107,107,0.25)', overflow: 'hidden' },
    menuHeader: { backgroundColor: 'rgba(255,107,107,0.2)', paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    menuHeaderT: { color: '#FFF', fontSize: 13, fontWeight: 'bold', letterSpacing: 2 },
    menuDots: { flexDirection: 'row', gap: 4 },
    menuDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: PASTEL.coral },
    menuBody: { padding: 12 },
    menuBtn: { backgroundColor: PASTEL.coral, borderRadius: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    menuBtnT: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },

    // Sections
    section: { marginBottom: 16 },
    secT: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },

    // Mini Game Cartridges
    miniCart: { width: 85, borderRadius: 14, borderWidth: 2, backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden', alignItems: 'center' },
    miniCartTop: { width: '100%', height: 50, alignItems: 'center', justifyContent: 'center' },
    miniCartN: { color: '#FFF', fontSize: 11, fontWeight: 'bold', paddingVertical: 8, textTransform: 'uppercase', letterSpacing: 1 },

    // Sport
    sportRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10 },
    sportInp: { flex: 1, color: '#FFF', fontSize: 14 },
    sportErr: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,107,107,0.15)', padding: 10, borderRadius: 8, gap: 6 },
    sportErrT: { color: '#FF6B6B', fontSize: 12 },

    // BMI Game Card
    bmiGame: { backgroundColor: 'rgba(255,107,107,0.12)', borderRadius: 20, padding: 16, borderWidth: 2, borderColor: 'rgba(255,107,107,0.25)' },
    bmiGameHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    bmiGameIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: PASTEL.coral, alignItems: 'center', justifyContent: 'center' },
    bmiGameT: { color: '#FFF', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
    bmiGameS: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 },
    bmiGameResult: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
    bmiGameV: { color: '#FFF', fontSize: 32, fontWeight: 'bold' },
    bmiGameVL: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
    bmiGameBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
    bmiGameBadgeT: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },

    // Goals
    gRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.15)', padding: 14, borderRadius: 12, marginBottom: 6 },
    gDone: { opacity: 0.5 },
    gChk: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', marginRight: 12, alignItems: 'center', justifyContent: 'center' },
    gChkD: { backgroundColor: PASTEL.mint, borderColor: PASTEL.mint },
    gTxt: { flex: 1, color: '#FFF', fontSize: 14, fontWeight: '500' },
    gTxtD: { textDecorationLine: 'line-through', color: 'rgba(255,255,255,0.4)' },

    // Modals
    mo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
    mc: { backgroundColor: '#1E1E2E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    mT: { fontSize: 22, fontWeight: 'bold', color: '#FFF', marginBottom: 6 },
    mS: { fontSize: 13, color: '#A0AEC0', marginBottom: 12 },
    mI: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 14, color: '#FFF', fontSize: 15, marginBottom: 8, minHeight: 60, textAlignVertical: 'top', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    mBtn: { backgroundColor: PASTEL.mint, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 10 },
    mBtnT: { color: '#000', fontSize: 15, fontWeight: 'bold' },
    mCancel: { padding: 14, alignItems: 'center' },
    mCancelT: { color: '#A0AEC0', fontSize: 15 },
    smkBtn: { backgroundColor: 'rgba(255,118,117,0.2)', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: PASTEL.btnRed },
    smkT: { color: PASTEL.btnRed, fontSize: 18, fontWeight: 'bold' },
});
