import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { LPColors } from '../../constants/theme';
import { AuthContext } from '../../context/AuthContext';
import { getPartnerDashboardApi, logForPartnerApi, sendEncouragementApi } from '../../services/api';
import { LPHaptics } from '../../services/haptics';

const { width: W } = Dimensions.get('window');

const PASTEL = {
  mint: '#55EFC4',
  pink: '#FF7675',
  blue: '#74B9FF',
  yellow: '#FFEAA7',
  purple: '#A29BFE',
  coral: '#FF6B61',
};

// Plant stages for duo
const PlantSVG = ({ stage }: { stage: number }) => (
  <Svg width={100} height={120} viewBox="0 0 100 120">
    {/* Pot */}
    <Rect x="25" y="85" width="50" height="30" fill="#A0522D" rx="4" />
    <Rect x="20" y="80" width="60" height="8" fill="#8B4513" rx="3" />
    <Ellipse cx="50" cy="83" rx="22" ry="5" fill="#5D3A1A" />
    
    {/* Plant stages */}
    {stage >= 1 && (
      <G>
        <Rect x="47" y="55" width="6" height="30" fill="#4CAF50" rx="2" />
        <Ellipse cx="40" cy="58" rx="8" ry="5" fill="#66BB6A" />
        <Ellipse cx="60" cy="58" rx="8" ry="5" fill="#81C784" />
      </G>
    )}
    {stage >= 2 && (
      <G>
        <Ellipse cx="35" cy="50" rx="10" ry="6" fill="#4CAF50" />
        <Ellipse cx="65" cy="50" rx="10" ry="6" fill="#66BB6A" />
      </G>
    )}
    {stage >= 3 && (
      <G>
        <Ellipse cx="30" cy="42" rx="12" ry="7" fill="#81C784" />
        <Ellipse cx="70" cy="42" rx="12" ry="7" fill="#4CAF50" />
        <Ellipse cx="50" cy="38" rx="10" ry="6" fill="#66BB6A" />
      </G>
    )}
    {stage >= 4 && (
      <G>
        {/* Flower */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const cx = 50 + Math.cos(rad) * 10;
          const cy = 25 + Math.sin(rad) * 10;
          return <Ellipse key={i} cx={cx} cy={cy} rx="8" ry="5" fill={i % 2 === 0 ? '#FFD54F' : '#FFEB3B'} />;
        })}
        <Circle cx="50" cy="25" r="6" fill="#FF9800" />
        {/* Hearts */}
        <Path d="M30 15 C26 10 18 12 18 18 C18 24 30 32 30 32 C30 32 42 24 42 18 C42 12 34 10 30 15 Z" fill="#E91E63" opacity="0.6" />
        <Path d="M70 15 C66 10 58 12 58 18 C58 24 70 32 70 32 C70 32 82 24 82 18 C82 12 74 10 70 15 Z" fill="#FF4081" opacity="0.5" />
      </G>
    )}
  </Svg>
);

// Stat card component
const StatCard = ({ icon, label, value, max, color, onPress }: any) => {
  const pct = max ? Math.min((value / max) * 100, 100) : 0;
  return (
    <TouchableOpacity 
      style={[styles.statCard, { borderColor: color }]} 
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.statIconBg, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.statLabel}>{label}</Text>
        {max ? (
          <View style={styles.statBar}>
            <View style={[styles.statFill, { width: `${pct}%`, backgroundColor: color }]} />
          </View>
        ) : null}
        <Text style={[styles.statValue, { color }]}>{value}{max ? `/${max}` : ''}</Text>
      </View>
      {onPress && <Ionicons name="add-circle" size={24} color={color} />}
    </TouchableOpacity>
  );
};

export default function PartnerDashboardScreen() {
  const auth: any = useContext(AuthContext);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);
  
  // Modals
  const [showEncourageModal, setShowEncourageModal] = useState(false);
  const [encourageMessage, setEncourageMessage] = useState('');
  const [sendingEncouragement, setSendingEncouragement] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logType, setLogType] = useState<'water' | 'meal' | 'smoke'>('water');
  const [loggingForPartner, setLoggingForPartner] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await getPartnerDashboardApi();
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch partner dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    LPHaptics.light();
    fetchDashboard();
  };

  const handleSendEncouragement = async () => {
    setSendingEncouragement(true);
    try {
      await sendEncouragementApi(encourageMessage || undefined);
      LPHaptics.success();
      Alert.alert('💪 Sent!', 'Your encouragement was sent to your partner!');
      setShowEncourageModal(false);
      setEncourageMessage('');
    } catch (err) {
      LPHaptics.error();
      Alert.alert('Failed', 'Could not send encouragement');
    } finally {
      setSendingEncouragement(false);
    }
  };

  const handleLogForPartner = async (type: 'water' | 'meal' | 'smoke') => {
    setLoggingForPartner(true);
    try {
      await logForPartnerApi(type, 1);
      LPHaptics.success();
      fetchDashboard();
      setShowLogModal(false);
      Alert.alert(
        type === 'smoke' ? '🚬 Logged' : '✅ Logged!',
        type === 'smoke' 
          ? 'Smoke logged for your partner. The plant will suffer.'
          : `${type.charAt(0).toUpperCase() + type.slice(1)} logged for your partner!`
      );
    } catch (err) {
      LPHaptics.error();
      Alert.alert('Failed', 'Could not log for partner');
    } finally {
      setLoggingForPartner(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={LPColors.primary} />
        <Text style={styles.loadingText}>Loading partner data...</Text>
      </View>
    );
  }

  // No duo or not active
  if (!data?.hasDuo || data.status !== 'active' || !data.partner) {
    return (
      <View style={[styles.container, styles.centered]}>
        <StatusBar style="light" />
        <SafeAreaView style={styles.centered}>
          <Ionicons name="people-outline" size={80} color="#555" />
          <Text style={styles.noPartnerTitle}>No Active Partner</Text>
          <Text style={styles.noPartnerDesc}>
            You're not paired with anyone yet.{'\n'}Go to Duo settings to connect!
          </Text>
          <TouchableOpacity 
            style={styles.setupBtn}
            onPress={() => router.push('/duo' as any)}
          >
            <LinearGradient colors={[LPColors.primary, '#00B894']} style={styles.setupBtnGradient}>
              <Ionicons name="people" size={20} color="#FFF" />
              <Text style={styles.setupBtnText}>Setup Duo</Text>
            </LinearGradient>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  const { partner, myStats, plantStage } = data;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PASTEL.mint} />}
        >
          {/* Header */}
          <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Partner Dashboard</Text>
              <Text style={styles.headerSub}>Your duo journey together 💕</Text>
            </View>
          </Animated.View>

          {/* Partner Info Card */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.partnerCard}>
            <LinearGradient colors={['rgba(116,185,255,0.2)', 'rgba(162,155,254,0.1)']} style={styles.partnerGradient}>
              <View style={styles.partnerRow}>
                <View style={styles.partnerAvatar}>
                  <Text style={styles.partnerInitial}>{partner.name?.charAt(0)?.toUpperCase() || '?'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.partnerName}>{partner.name}</Text>
                  <View style={styles.partnerBadges}>
                    {partner.isSmoker && (
                      <View style={[styles.badge, { backgroundColor: 'rgba(255,118,117,0.2)' }]}>
                        <Text style={[styles.badgeText, { color: PASTEL.pink }]}>Smoker</Text>
                      </View>
                    )}
                    <View style={[styles.badge, { backgroundColor: 'rgba(85,239,196,0.2)' }]}>
                      <Ionicons name="flame" size={12} color={PASTEL.mint} />
                      <Text style={[styles.badgeText, { color: PASTEL.mint }]}>{partner.streak || 0}d streak</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.encourageBtn}
                  onPress={() => setShowEncourageModal(true)}
                >
                  <Ionicons name="heart" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Shared Plant */}
          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.plantCard}>
            <Text style={styles.sectionTitle}>🌱 Shared Plant - Level {plantStage}</Text>
            <View style={styles.plantContainer}>
              <PlantSVG stage={plantStage} />
            </View>
            <Text style={styles.plantHint}>
              Both of you contribute to this plant's growth!
            </Text>
          </Animated.View>

          {/* Partner Stats */}
          <Animated.View entering={FadeInDown.delay(400).duration(500)}>
            <Text style={styles.sectionTitle}>📊 {partner.name}'s Activity Today</Text>
            
            <StatCard
              icon="water"
              label="Water Intake"
              value={partner.stats.water}
              max={8}
              color={PASTEL.blue}
              onPress={() => { setLogType('water'); setShowLogModal(true); }}
            />
            
            <StatCard
              icon="restaurant"
              label="Meals Logged"
              value={partner.stats.meals}
              max={4}
              color={PASTEL.mint}
              onPress={() => { setLogType('meal'); setShowLogModal(true); }}
            />
            
            {partner.isSmoker && (
              <StatCard
                icon="cloud"
                label="Smokes Today"
                value={partner.stats.smokes}
                max={undefined}
                color={PASTEL.pink}
                onPress={() => { setLogType('smoke'); setShowLogModal(true); }}
              />
            )}
            
            <StatCard
              icon="trophy"
              label="Goals Completed"
              value={partner.stats.goalsCompleted}
              max={partner.stats.goalsTotal || 1}
              color={PASTEL.yellow}
            />
            
            <StatCard
              icon="footsteps"
              label="Steps"
              value={partner.stats.steps}
              max={10000}
              color={PASTEL.purple}
            />
            
            <StatCard
              icon="flame"
              label="Calories Burnt"
              value={partner.stats.calories}
              max={500}
              color={PASTEL.coral}
            />
          </Animated.View>

          {/* Comparison */}
          <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.comparisonCard}>
            <Text style={styles.sectionTitle}>⚔️ Today's Comparison</Text>
            
            <View style={styles.compareRow}>
              <View style={styles.compareItem}>
                <Text style={styles.compareLabel}>You</Text>
                <Text style={[styles.compareValue, { color: PASTEL.mint }]}>{myStats.water}💧</Text>
              </View>
              <Text style={styles.compareVs}>vs</Text>
              <View style={styles.compareItem}>
                <Text style={styles.compareLabel}>{partner.name.split(' ')[0]}</Text>
                <Text style={[styles.compareValue, { color: PASTEL.blue }]}>{partner.stats.water}💧</Text>
              </View>
            </View>
            
            <View style={styles.compareRow}>
              <View style={styles.compareItem}>
                <Text style={[styles.compareValue, { color: PASTEL.mint }]}>{myStats.meals}🍽️</Text>
              </View>
              <Text style={styles.compareVs}>meals</Text>
              <View style={styles.compareItem}>
                <Text style={[styles.compareValue, { color: PASTEL.blue }]}>{partner.stats.meals}🍽️</Text>
              </View>
            </View>
            
            <View style={styles.compareRow}>
              <View style={styles.compareItem}>
                <Text style={[styles.compareValue, { color: PASTEL.mint }]}>{myStats.steps}👣</Text>
              </View>
              <Text style={styles.compareVs}>steps</Text>
              <View style={styles.compareItem}>
                <Text style={[styles.compareValue, { color: PASTEL.blue }]}>{partner.stats.steps}👣</Text>
              </View>
            </View>
          </Animated.View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Encouragement Modal */}
      <Modal visible={showEncourageModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>💬 Send Encouragement</Text>
            <Text style={styles.modalSub}>Send a supportive message to {partner.name}!</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="You got this! Keep going! 💪"
              placeholderTextColor="#888"
              value={encourageMessage}
              onChangeText={setEncourageMessage}
              multiline
            />
            
            <TouchableOpacity 
              style={[styles.modalBtn, sendingEncouragement && { opacity: 0.6 }]}
              onPress={handleSendEncouragement}
              disabled={sendingEncouragement}
            >
              {sendingEncouragement ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.modalBtnText}>Send Love ❤️</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setShowEncourageModal(false)} style={styles.modalCancel}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Log for Partner Modal */}
      <Modal visible={showLogModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {logType === 'water' && '💧 Log Water'}
              {logType === 'meal' && '🍽️ Log Meal'}
              {logType === 'smoke' && '🚬 Log Smoke'}
            </Text>
            <Text style={styles.modalSub}>
              {logType === 'smoke' 
                ? `Log a smoke for ${partner.name}. This will hurt your shared plant.`
                : `Log ${logType} intake for ${partner.name}!`
              }
            </Text>
            
            <TouchableOpacity 
              style={[
                styles.modalBtn, 
                logType === 'smoke' && { backgroundColor: PASTEL.pink },
                loggingForPartner && { opacity: 0.6 }
              ]}
              onPress={() => handleLogForPartner(logType)}
              disabled={loggingForPartner}
            >
              {loggingForPartner ? (
                <ActivityIndicator color={logType === 'smoke' ? '#FFF' : '#000'} />
              ) : (
                <Text style={[styles.modalBtnText, logType === 'smoke' && { color: '#FFF' }]}>
                  {logType === 'smoke' ? 'Log Smoke 🚬' : `Add +1 ${logType === 'water' ? '💧' : '🍽️'}`}
                </Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setShowLogModal(false)} style={styles.modalCancel}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E2E',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#A0AEC0',
    fontSize: 14,
    marginTop: 12,
  },
  noPartnerTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
  },
  noPartnerDesc: {
    color: '#A0AEC0',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
  setupBtn: {
    marginTop: 30,
    borderRadius: 14,
    overflow: 'hidden',
  },
  setupBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 30,
    gap: 10,
  },
  setupBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scroll: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: 'bold',
  },
  headerSub: {
    color: '#A0AEC0',
    fontSize: 14,
    marginTop: 4,
  },
  partnerCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  partnerGradient: {
    padding: 16,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  partnerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PASTEL.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerInitial: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  partnerName: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  partnerBadges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  encourageBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E91E63',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plantCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  plantContainer: {
    marginVertical: 10,
  },
  plantHint: {
    color: '#A0AEC0',
    fontSize: 12,
    textAlign: 'center',
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    gap: 12,
  },
  statIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    color: '#A0AEC0',
    fontSize: 12,
    marginBottom: 4,
  },
  statBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginBottom: 4,
  },
  statFill: {
    height: '100%',
    borderRadius: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  comparisonCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  compareItem: {
    flex: 1,
    alignItems: 'center',
  },
  compareLabel: {
    color: '#A0AEC0',
    fontSize: 12,
    marginBottom: 4,
  },
  compareValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  compareVs: {
    color: '#555',
    fontSize: 12,
    paddingHorizontal: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E1E2E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 13,
    color: '#A0AEC0',
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 14,
    color: '#FFF',
    fontSize: 15,
    marginBottom: 16,
    minHeight: 80,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    textAlignVertical: 'top',
  },
  modalBtn: {
    backgroundColor: PASTEL.mint,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalCancel: {
    padding: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#A0AEC0',
    fontSize: 15,
  },
});
