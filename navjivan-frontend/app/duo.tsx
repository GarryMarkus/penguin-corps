import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { AuthContext } from '../context/AuthContext';
import {
    createDuoApi,
    getDuoStatusApi,
    joinDuoApi,
    leaveDuoApi,
    sendEncouragementApi,
    updateDuoStatsApi,
} from '../services/api';
import { LPHaptics } from '../services/haptics';

const { width: W } = Dimensions.get('window');
const CORAL = '#FF6B6B';

const MiniPlant = ({ stage }: { stage: number }) => {
    const lc = stage >= 3 ? '#2ECC71' : '#7EC8A0';
    return (
        <Svg width={120} height={140} viewBox="0 0 120 140">
            <Rect x="0" y="100" width="120" height="40" fill="#7EC8A0" rx="8" />
            <Rect x="0" y="120" width="120" height="20" fill="#5C4033" rx="8" />
            <G transform="translate(60, 100)">
                {stage >= 1 && <Rect x="-2" y={String(-8 - stage * 16)} width="4" height={String(8 + stage * 16)} fill="#5D4037" rx="2" />}
                {stage === 0 && <Ellipse cx="0" cy="-3" rx="8" ry="5" fill="#8B5E3C" />}
                {stage >= 1 && <G><Ellipse cx="-10" cy="-22" rx="8" ry="5" fill={lc} /><Ellipse cx="10" cy="-22" rx="8" ry="5" fill={lc} /></G>}
                {stage >= 2 && <G><Ellipse cx="-14" cy="-38" rx="10" ry="6" fill={lc} /><Ellipse cx="14" cy="-38" rx="10" ry="6" fill={lc} /><Ellipse cx="0" cy="-44" rx="10" ry="7" fill={lc} /></G>}
                {stage >= 3 && <G><Ellipse cx="-18" cy="-55" rx="14" ry="9" fill={lc} /><Ellipse cx="18" cy="-55" rx="14" ry="9" fill={lc} /><Ellipse cx="0" cy="-65" rx="16" ry="10" fill={lc} /></G>}
                {stage >= 4 && <G><Ellipse cx="0" cy="-78" rx="24" ry="15" fill="#27AE60" /><Circle cx="-10" cy="-82" r="3" fill="#FF6F61" /><Circle cx="8" cy="-75" r="3" fill="#FFB7B2" /><Circle cx="0" cy="-90" r="2.5" fill="#FFDAC1" /></G>}
            </G>
        </Svg>
    );
};

const StatBar = ({ label, valueA, valueB, max, color }: any) => {
    const total = (valueA || 0) + (valueB || 0);
    const pct = Math.min((total / max) * 100, 100);
    return (
        <View style={s.statRow}>
            <Text style={s.statLabel}>{label}</Text>
            <View style={s.statTrack}>
                <View style={[s.statFillA, { width: `${Math.min((valueA / max) * 100, pct)}%`, backgroundColor: color }]} />
                <View style={[s.statFillB, { width: `${Math.min((valueB / max) * 100, 100 - pct)}%`, backgroundColor: color, opacity: 0.5 }]} />
            </View>
            <Text style={s.statVal}>{total}/{max}</Text>
        </View>
    );
};

export default function DuoScreen() {
    const auth: any = useContext(AuthContext);
    const router = useRouter();
    const userName = auth?.user?.name || 'You';

    const [loading, setLoading] = useState(true);
    const [hasDuo, setHasDuo] = useState(false);
    const [duoData, setDuoData] = useState<any>(null);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [joiningLoading, setJoiningLoading] = useState(false);
    const [creatingLoading, setCreatingLoading] = useState(false);
    const [inviteCode, setInviteCode] = useState('');

    const fetchDuoStatus = useCallback(async () => {
        try {
            const res = await getDuoStatusApi();
            const d: any = res.data;
            setHasDuo(d.hasDuo);
            if (d.hasDuo) {
                setDuoData(d);
                setInviteCode(d.inviteCode || '');
            }
        } catch (e: any) {
            console.error('[Duo] Fetch error:', e.response?.data || e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchDuoStatus(); }, [fetchDuoStatus]);

    const handleCreate = async () => {
        setCreatingLoading(true);
        try {
            const res = await createDuoApi();
            setInviteCode((res.data as any).inviteCode);
            setHasDuo(false); // still pending until partner joins
            LPHaptics.success();
            Alert.alert('🎉 Duo Created!', `Share this code with your friend:\n\n${(res.data as any).inviteCode}`);
        } catch (e: any) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to create');
            LPHaptics.error();
        } finally {
            setCreatingLoading(false);
        }
    };

    const handleJoin = async () => {
        if (joinCode.length !== 6) { Alert.alert('Error', 'Enter a 6-character code'); return; }
        setJoiningLoading(true);
        try {
            const res = await joinDuoApi(joinCode.toUpperCase());
            LPHaptics.success();
            setShowJoinModal(false);
            setJoinCode('');
            Alert.alert('🤝 Duo Activated!', `You and ${(res.data as any).partner?.name} are now partners!`);
            fetchDuoStatus();
        } catch (e: any) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to join');
            LPHaptics.error();
        } finally {
            setJoiningLoading(false);
        }
    };

    const handleLeave = () => {
        Alert.alert('Leave Duo?', 'Your shared plant will be lost. This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Leave', style: 'destructive', onPress: async () => {
                    try {
                        await leaveDuoApi();
                        setHasDuo(false);
                        setDuoData(null);
                        setInviteCode('');
                        LPHaptics.success();
                    } catch (e: any) { Alert.alert('Error', e.response?.data?.message || 'Failed'); }
                }
            },
        ]);
    };

    const handleEncourage = async () => {
        try {
            await sendEncouragementApi();
            LPHaptics.success();
            Alert.alert('💪 Sent!', 'Your partner received your encouragement!');
        } catch (e: any) {
            Alert.alert('Error', 'Could not send');
        }
    };

    const handleShareCode = async () => {
        if (!inviteCode) return;
        await Share.share({ message: `Join my Duo on Navjivan! Code: ${inviteCode}` });
    };

    if (loading) {
        return (
            <View style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={CORAL} />
            </View>
        );
    }

    // ── Active Duo View ──
    if (hasDuo && duoData?.status === 'active') {
        const p = duoData.sharedPlant || {};
        const partner = duoData.partner;
        const myRole = duoData.myRole;

        return (
            <View style={s.root}>
                <StatusBar style="light" />
                <SafeAreaView style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
                        {/* Header */}
                        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={s.header}>
                            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                                <Ionicons name="arrow-back" size={22} color="#FFF" />
                            </TouchableOpacity>
                            <Text style={s.title}>🤝 Duo Mode</Text>
                            <TouchableOpacity onPress={handleLeave}><Ionicons name="exit-outline" size={22} color="#FF6B6B" /></TouchableOpacity>
                        </Animated.View>

                        {/* Partner Card */}
                        <Animated.View entering={FadeInDown.delay(150).duration(500)} style={s.partnerCard}>
                            <View style={s.partnerRow}>
                                <View style={s.avatar}><Text style={s.avatarT}>{userName[0]}</Text></View>
                                <View style={s.partnerLine} />
                                <View style={s.plantMini}><MiniPlant stage={duoData.plantStage || 0} /></View>
                                <View style={s.partnerLine} />
                                <View style={[s.avatar, { backgroundColor: '#74B9FF' }]}><Text style={s.avatarT}>{partner?.name?.[0] || '?'}</Text></View>
                            </View>
                            <View style={s.namesRow}>
                                <Text style={s.nameT}>{userName}</Text>
                                <Text style={s.nameT}>{partner?.name || 'Partner'}</Text>
                            </View>
                            {partner?.isSmoker && <View style={s.smokerBadge}><Ionicons name="warning" size={12} color="#FFD700" /><Text style={s.smokerBadgeT}>Smoker</Text></View>}
                        </Animated.View>

                        {/* Shared Plant Stats */}
                        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={s.statsCard}>
                            <View style={s.statsHeader}><Text style={s.statsHeaderT}>🌱 SHARED PLANT</Text><Text style={s.stageBadge}>Lv {duoData.plantStage}</Text></View>
                            <StatBar label="💧 Water" valueA={p[`water${myRole}`]} valueB={p[`water${myRole === 'A' ? 'B' : 'A'}`]} max={16} color="#74B9FF" />
                            <StatBar label="🍽️ Meals" valueA={p[`meals${myRole}`]} valueB={p[`meals${myRole === 'A' ? 'B' : 'A'}`]} max={6} color="#55EFC4" />
                            <StatBar label="🏆 Goals" valueA={p[`goalsCompleted${myRole}`]} valueB={p[`goalsCompleted${myRole === 'A' ? 'B' : 'A'}`]} max={(p[`goalsTotal${myRole}`] || 0) + (p[`goalsTotal${myRole === 'A' ? 'B' : 'A'}`] || 0) || 1} color="#FFEAA7" />
                            <StatBar label="👟 Steps" valueA={p[`steps${myRole}`]} valueB={p[`steps${myRole === 'A' ? 'B' : 'A'}`]} max={20000} color="#A8E6CF" />
                            {(p.smokesA > 0 || p.smokesB > 0) && (
                                <View style={s.smokeAlert}>
                                    <Ionicons name="warning" size={16} color="#FF6B6B" />
                                    <Text style={s.smokeAlertT}>🚬 {p.smokesA + p.smokesB} cigarettes today – plant is hurting</Text>
                                </View>
                            )}
                        </Animated.View>

                        {/* Action Buttons */}
                        <Animated.View entering={FadeInDown.delay(450).duration(500)} style={{ gap: 10 }}>
                            <TouchableOpacity style={s.encourageBtn} onPress={handleEncourage}>
                                <Ionicons name="heart" size={18} color="#FFF" />
                                <Text style={s.encourageBtnT}>Send Encouragement 💪</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </ScrollView>
                </SafeAreaView>
            </View>
        );
    }

    // ── No Duo / Setup View ──
    return (
        <View style={s.root}>
            <StatusBar style="light" />
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
                    <Animated.View entering={FadeInDown.delay(50).duration(400)} style={s.header}>
                        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                            <Ionicons name="arrow-back" size={22} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={s.title}>🤝 Duo Mode</Text>
                        <View style={{ width: 30 }} />
                    </Animated.View>

                    {/* Hero */}
                    <Animated.View entering={FadeInDown.delay(150).duration(500)} style={s.heroCard}>
                        <MiniPlant stage={2} />
                        <Text style={s.heroTitle}>Grow Together</Text>
                        <Text style={s.heroSub}>Pair with a friend to co-parent a plant.{'\n'}Both contribute — shared accountability keeps you healthy!</Text>
                    </Animated.View>

                    {/* Features */}
                    <Animated.View entering={FadeInDown.delay(300).duration(500)} style={s.featuresCard}>
                        {[
                            { i: 'leaf', t: 'Shared Plant', d: 'Both of you water & feed the same plant' },
                            { i: 'notifications', t: 'Smoke Alerts', d: 'Get notified when your partner smokes' },
                            { i: 'heart', t: 'Encouragement', d: 'Send support when they need it most' },
                            { i: 'stats-chart', t: 'Daily Stats', d: 'Track each other\'s progress' },
                        ].map((f, i) => (
                            <View key={i} style={s.featureRow}>
                                <View style={s.featureIcon}><Ionicons name={f.i as any} size={18} color={CORAL} /></View>
                                <View style={{ flex: 1 }}><Text style={s.featureT}>{f.t}</Text><Text style={s.featureD}>{f.d}</Text></View>
                            </View>
                        ))}
                    </Animated.View>

                    {/* Invite Code Display (if pending) */}
                    {inviteCode ? (
                        <Animated.View entering={FadeInDown.delay(400).duration(500)} style={s.codeCard}>
                            <Text style={s.codeLabel}>Your Invite Code</Text>
                            <Text style={s.codeValue}>{inviteCode}</Text>
                            <Text style={s.codeSub}>Waiting for your friend to join...</Text>
                            <TouchableOpacity style={s.shareBtn} onPress={handleShareCode}>
                                <Ionicons name="share-social" size={16} color="#FFF" />
                                <Text style={s.shareBtnT}>Share Code</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    ) : null}

                    {/* Buttons */}
                    <Animated.View entering={FadeInDown.delay(inviteCode ? 500 : 400).duration(500)} style={{ gap: 12, marginTop: 16 }}>
                        {!inviteCode && (
                            <TouchableOpacity style={s.createBtn} onPress={handleCreate} disabled={creatingLoading}>
                                {creatingLoading ? <ActivityIndicator color="#FFF" /> : <><Ionicons name="add-circle" size={20} color="#FFF" /><Text style={s.createBtnT}>Create Duo</Text></>}
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={s.joinBtn} onPress={() => setShowJoinModal(true)}>
                            <Ionicons name="enter" size={20} color={CORAL} />
                            <Text style={s.joinBtnT}>Join with Code</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </SafeAreaView>

            {/* Join Modal */}
            <Modal visible={showJoinModal} transparent animationType="slide">
                <View style={s.mo}><View style={s.mc}>
                    <Text style={s.mT}>Enter Invite Code</Text>
                    <Text style={s.mSub}>Ask your friend for their 6-character code</Text>
                    <TextInput
                        style={s.codeInput}
                        placeholder="XXXXXX"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={joinCode}
                        onChangeText={t => setJoinCode(t.toUpperCase().slice(0, 6))}
                        autoCapitalize="characters"
                        maxLength={6}
                    />
                    <TouchableOpacity style={s.joinConfirmBtn} onPress={handleJoin} disabled={joiningLoading}>
                        {joiningLoading ? <ActivityIndicator color="#FFF" /> : <Text style={s.joinConfirmT}>Join Duo</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowJoinModal(false)} style={s.cancelBtn}><Text style={s.cancelT}>Cancel</Text></TouchableOpacity>
                </View></View>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#1A1A2E' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    title: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },

    // Hero
    heroCard: { backgroundColor: 'rgba(255,107,107,0.12)', borderRadius: 24, padding: 24, alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,107,107,0.25)', marginBottom: 16 },
    heroTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginTop: 12 },
    heroSub: { color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },

    // Features
    featuresCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 16, marginBottom: 16, gap: 14 },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    featureIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,107,107,0.15)', alignItems: 'center', justifyContent: 'center' },
    featureT: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
    featureD: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 },

    // Code
    codeCard: { backgroundColor: CORAL, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16 },
    codeLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 'bold', letterSpacing: 2, textTransform: 'uppercase' },
    codeValue: { color: '#FFF', fontSize: 36, fontWeight: 'bold', letterSpacing: 8, marginVertical: 8 },
    codeSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
    shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, marginTop: 12 },
    shareBtnT: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },

    // Buttons
    createBtn: { backgroundColor: CORAL, borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    createBtnT: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    joinBtn: { backgroundColor: 'rgba(255,107,107,0.12)', borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 2, borderColor: 'rgba(255,107,107,0.3)' },
    joinBtnT: { color: CORAL, fontSize: 16, fontWeight: 'bold' },

    // Partner Card (active)
    partnerCard: { backgroundColor: 'rgba(255,107,107,0.12)', borderRadius: 24, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,107,107,0.25)', marginBottom: 16 },
    partnerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: CORAL, alignItems: 'center', justifyContent: 'center' },
    avatarT: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
    partnerLine: { width: 20, height: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
    plantMini: { transform: [{ scale: 0.6 }], marginHorizontal: -20 },
    namesRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 10 },
    nameT: { color: '#FFF', fontSize: 14, fontWeight: '600' },
    smokerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,215,0,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
    smokerBadgeT: { color: '#FFD700', fontSize: 11, fontWeight: 'bold' },

    // Stats
    statsCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 16, marginBottom: 16 },
    statsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    statsHeaderT: { color: '#FFF', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
    stageBadge: { color: CORAL, fontSize: 13, fontWeight: 'bold', backgroundColor: 'rgba(255,107,107,0.15)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
    statRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
    statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, width: 70 },
    statTrack: { flex: 1, height: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 5, overflow: 'hidden', flexDirection: 'row' },
    statFillA: { height: '100%', borderRadius: 5 },
    statFillB: { height: '100%' },
    statVal: { color: '#FFF', fontSize: 11, fontWeight: 'bold', width: 45, textAlign: 'right' },

    smokeAlert: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,107,107,0.15)', padding: 12, borderRadius: 12, marginTop: 6 },
    smokeAlertT: { color: '#FF6B6B', fontSize: 12, flex: 1 },

    // Encourage
    encourageBtn: { backgroundColor: CORAL, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    encourageBtnT: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },

    // Modal
    mo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
    mc: { backgroundColor: '#1E1E2E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    mT: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
    mSub: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 20 },
    codeInput: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 20, color: '#FFF', fontSize: 28, fontWeight: 'bold', textAlign: 'center', letterSpacing: 8, borderWidth: 2, borderColor: 'rgba(255,107,107,0.3)' },
    joinConfirmBtn: { backgroundColor: CORAL, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 16 },
    joinConfirmT: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    cancelBtn: { padding: 14, alignItems: 'center' },
    cancelT: { color: 'rgba(255,255,255,0.5)', fontSize: 15 },
});
