import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import HealthSyncSettings from "../../components/HealthSyncSettings";
import { LPColors } from "../../constants/theme";
import { AuthContext } from "../../context/AuthContext";
import { fetchDashboardSummary } from "../../services/api";

export default function ProfileScreen() {
  const { logout, user }: any = useContext(AuthContext);
  const router = useRouter();

  const [stats, setStats] = useState({
    streakDays: 0,
    cravingsHandled: 0,
    moneySaved: 0,
    goalsCompleted: 0,
  });

  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      const res = await fetchDashboardSummary();
    } catch (err) {
      console.log("Dashboard error:", err);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, []);

  const settings: { icon: any; name: string; route?: string }[] = [
    { icon: "person-outline", name: "Edit Profile" },
    { icon: "notifications-outline", name: "Notification Settings" },
    { icon: "flag-outline", name: "Manage Goals" },
    { icon: "lock-closed-outline", name: "Privacy & Security" },
    { icon: "people-outline", name: "Community Preferences" },
    { icon: "help-circle-outline", name: "Help & Support" },
    { icon: "information-circle-outline", name: "About Navjivan" },
  ];

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).getFullYear()
    : "2024";

  return (
    <LinearGradient
      colors={[LPColors.bg, "#000000"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: "transparent" }]}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={LPColors.primary}
              colors={[LPColors.primary]}
            />
          }
        >
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            {}
            <View style={styles.profileHeader}>
              {}
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitial}>
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </Text>
                </View>
              )}

              <TouchableOpacity style={styles.editIcon}>
                <Ionicons name="pencil" size={18} color={LPColors.text} />
              </TouchableOpacity>

              <Text style={styles.name}>{user?.name}</Text>
              <Text style={styles.since}>
                Quit Journey Member since {memberSince}
              </Text>
            </View>
          </Animated.View>

          {}
          <Animated.View
            entering={FadeInDown.delay(200).duration(500)}
            style={styles.statsContainer}
          >
            <View style={styles.statBox}>
              <Ionicons
                name="flame-outline"
                size={20}
                color={LPColors.primary}
              />
              <Text style={styles.statLabel}>Streak</Text>
              <Text style={styles.statValue}>{stats.streakDays} days</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons
                name="leaf-outline"
                size={20}
                color={LPColors.primary}
              />
              <Text style={styles.statLabel}>Cravings</Text>
              <Text style={styles.statValue}>{stats.cravingsHandled}</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons
                name="wallet-outline"
                size={20}
                color={LPColors.primary}
              />
              <Text style={styles.statLabel}>Saved</Text>
              <Text style={styles.statValue}>₹{stats.moneySaved}</Text>
            </View>
          </Animated.View>

          {}
          <Animated.View
            entering={FadeInDown.delay(300).duration(500)}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>Your Journey Overview</Text>

            <View style={styles.overviewContainer}>
              <LinearGradient
                colors={[LPColors.primary, "#006400"]}
                style={styles.overviewBox}
              >
                <Text style={styles.overviewLabel}>Goals completed</Text>
                <Text style={styles.overviewValue}>{stats.goalsCompleted}</Text>
              </LinearGradient>

              <LinearGradient
                colors={[LPColors.primary, "#006400"]}
                style={styles.overviewBox}
              >
                <Text style={styles.overviewLabel}>Cravings handled</Text>
                <Text style={styles.overviewValue}>
                  {stats.cravingsHandled}
                </Text>
              </LinearGradient>

              <LinearGradient
                colors={[LPColors.primary, "#006400"]}
                style={styles.overviewBox}
              >
                <Text style={styles.overviewLabel}>Money saved</Text>
                <Text style={styles.overviewValue}>₹{stats.moneySaved}</Text>
              </LinearGradient>
            </View>
          </Animated.View>

          {}
          <Animated.View
            entering={FadeInDown.delay(400).duration(500)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Badges Earned</Text>
              <Text style={styles.keepGoing}>Keep going</Text>
            </View>

            <View style={styles.badgesContainer}>
              <LinearGradient
                colors={["#FFD700", "#DAA520"]}
                style={styles.badge}
              >
                <Ionicons name="sparkles-outline" size={24} color="#000" />
                <Text style={styles.badgeText}>3-day</Text>
              </LinearGradient>
              <LinearGradient
                colors={["#C0C0C0", "#A9A9A9"]}
                style={styles.badge}
              >
                <Ionicons name="calendar-outline" size={24} color="#000" />
                <Text style={styles.badgeText}>7-day</Text>
              </LinearGradient>
              <LinearGradient
                colors={["#CD7F32", "#8B4513"]}
                style={styles.badge}
              >
                <Ionicons name="infinite-outline" size={24} color="#000" />
                <Text style={styles.badgeText}>14-day</Text>
              </LinearGradient>
              <LinearGradient
                colors={[LPColors.surfaceLight, LPColors.surface]}
                style={styles.badgeLocked}
              >
                <Ionicons
                  name="trophy-outline"
                  size={24}
                  color={LPColors.textGray}
                />
                <Text style={styles.badgeTextLocked}>1-month</Text>
              </LinearGradient>
            </View>
          </Animated.View>

          {user?.smokingData && (
            <Animated.View
              entering={FadeInDown.delay(450).duration(500)}
              style={styles.section}
            >
              <Text style={styles.sectionTitle}>Smoker Profile</Text>
              <View style={styles.smokerProfileCard}>
                <View style={styles.smokerRow}>
                  <View style={styles.smokerItem}>
                    <Text style={styles.smokerLabel}>Daily Cigarettes</Text>
                    <Text style={styles.smokerValue}>
                      {user.smokingData.cigarettesPerDay || "N/A"}
                    </Text>
                  </View>
                  <View style={styles.smokerDivider} />
                  <View style={styles.smokerItem}>
                    <Text style={styles.smokerLabel}>Main Trigger</Text>
                    <Text style={styles.smokerValue}>
                      {user.smokingData.trigger || "N/A"}
                    </Text>
                  </View>
                </View>

                <View style={styles.smokerRowSeparator} />

                <View style={styles.smokerRow}>
                  <View style={styles.smokerItem}>
                    <Text style={styles.smokerLabel}>Motivation</Text>
                    <Text style={styles.smokerValue}>
                      {user.smokingData.motivation || "N/A"}
                    </Text>
                  </View>
                  <View style={styles.smokerDivider} />
                  <View style={styles.smokerItem}>
                    <Text style={styles.smokerLabel}>Quit Attempts</Text>
                    <Text style={styles.smokerValue}>
                      {user.smokingData.quitAttempts || "N/A"}
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}

          {}
          <Animated.View
            entering={FadeInDown.delay(500).duration(500)}
            style={{ paddingHorizontal: 16 }}
          >
            <HealthSyncSettings />
          </Animated.View>

          {}
          <Animated.View
            entering={FadeInDown.delay(550).duration(500)}
            style={styles.settingsContainer}
          >
            {settings.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.settingItem}
                onPress={() => item.route && router.push(item.route as any)}
              >
                <Ionicons
                  name={item.icon as any}
                  size={22}
                  color={LPColors.primary}
                />
                <Text style={styles.settingName}>{item.name}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={LPColors.textGray}
                />
              </TouchableOpacity>
            ))}
          </Animated.View>

          {}
          <Animated.View entering={FadeInDown.delay(600).duration(500)}>
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },

  profileHeader: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: LPColors.surfaceLight,
    margin: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: LPColors.primary,
    marginBottom: 12,
  },

  avatarFallback: {
    backgroundColor: LPColors.surface,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarInitial: {
    fontSize: 36,
    color: LPColors.primary,
    fontWeight: "700",
  },

  editIcon: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 8,
    borderRadius: 20,
  },

  name: { fontSize: 22, fontWeight: "bold", color: LPColors.text },
  since: { fontSize: 14, color: LPColors.textGray, marginTop: 4 },

  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    marginTop: 16,
  },

  statBox: {
    backgroundColor: LPColors.surfaceLight,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: "center",
    width: "31%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  statLabel: { fontSize: 12, color: LPColors.textGray, marginTop: 4 },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: LPColors.text,
    marginTop: 2,
  },

  section: { marginTop: 24, paddingHorizontal: 16 },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  sectionTitle: { fontSize: 20, fontWeight: "bold", color: LPColors.text },
  keepGoing: { fontSize: 14, color: LPColors.primary, fontWeight: "600" },

  overviewContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },

  overviewBox: {
    borderRadius: 16,
    padding: 16,
    width: "32%",
    alignItems: "center",
  },

  overviewLabel: {
    fontSize: 11,
    color: "#000",
    marginBottom: 8,
    textAlign: "center",
    fontWeight: "500",
  },
  overviewValue: { fontSize: 18, fontWeight: "800", color: "#000" },

  badgesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  badge: {
    borderRadius: 16,
    padding: 16,
    width: "23%",
    alignItems: "center",
  },

  badgeLocked: {
    borderRadius: 16,
    padding: 16,
    width: "23%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  badgeText: { fontSize: 11, color: "#000", marginTop: 8, fontWeight: "bold" },
  badgeTextLocked: { fontSize: 11, color: LPColors.textGray, marginTop: 8 },

  settingsContainer: {
    marginTop: 20,
    marginHorizontal: 16,
    backgroundColor: LPColors.surfaceLight,
    borderRadius: 20,
    marginBottom: 20,
    overflow: "hidden",
  },

  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },

  settingName: {
    fontSize: 16,
    color: LPColors.text,
    marginLeft: 16,
    flex: 1,
  },

  logoutButton: {
    backgroundColor: "#2C0000",
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 40,
    borderWidth: 1,
    borderColor: "#FF3B30",
  },

  logoutText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF3B30",
  },

  smokerProfileCard: {
    backgroundColor: LPColors.surfaceLight,
    borderRadius: 16,
    padding: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  smokerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  smokerItem: {
    flex: 1,
    alignItems: "center",
  },

  smokerLabel: {
    fontSize: 12,
    color: LPColors.textGray,
    marginBottom: 4,
    fontWeight: "500",
  },

  smokerValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: LPColors.text,
    textAlign: "center",
  },

  smokerDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginHorizontal: 16,
  },

  smokerRowSeparator: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 16,
  },
});
