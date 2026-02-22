import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { LPColors } from "../../constants/theme";
import { AuthContext } from "../../context/AuthContext";

interface SettingItem {
  icon: string;
  name: string;
  route?: string;
}

export default function FitnessProfileScreen() {
  const { logout, user }: any = useContext(AuthContext);
  const router = useRouter();

  const [stats, setStats] = useState({
    streakDays: 1,
    activeMinutes: 120,
    caloriesBurned: 540,
    goalsCompleted: 2,
  });

  const settings: SettingItem[] = [
    { icon: "person-outline", name: "Edit Profile" },
    { icon: "notifications-outline", name: "Notification Settings" },
    { icon: "flag-outline", name: "Fitness Goals" },
    { icon: "lock-closed-outline", name: "Privacy & Security" },
    { icon: "people-outline", name: "Community Preferences" },
    { icon: "help-circle-outline", name: "Help & Support" },
    { icon: "information-circle-outline", name: "About Navjivan" },
  ];

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).getFullYear()
    : "2024";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <View style={styles.profileHeader}>
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
              Fitness Journey Member since {memberSince}
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          style={styles.statsContainer}
        >
          <View style={styles.statBox}>
            <Ionicons name="flame-outline" size={20} color={LPColors.primary} />
            <Text style={styles.statLabel}>Streak</Text>
            <Text style={styles.statValue}>{stats.streakDays} days</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="time-outline" size={20} color={LPColors.primary} />
            <Text style={styles.statLabel}>Active</Text>
            <Text style={styles.statValue}>{stats.activeMinutes}m</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons
              name="bonfire-outline"
              size={20}
              color={LPColors.primary}
            />
            <Text style={styles.statLabel}>Burned</Text>
            <Text style={styles.statValue}>{stats.caloriesBurned}</Text>
          </View>
        </Animated.View>

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
              <Text style={styles.overviewLabel}>Workouts</Text>
              <Text style={styles.overviewValue}>3</Text>
            </LinearGradient>

            <LinearGradient
              colors={[LPColors.primary, "#006400"]}
              style={styles.overviewBox}
            >
              <Text style={styles.overviewLabel}>Steps</Text>
              <Text style={styles.overviewValue}>12k</Text>
            </LinearGradient>
          </View>
        </Animated.View>

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
              <Ionicons name="walk" size={24} color="#000" />
              <Text style={styles.badgeText}>10k</Text>
            </LinearGradient>
            <LinearGradient
              colors={["#C0C0C0", "#A9A9A9"]}
              style={styles.badge}
            >
              <Ionicons name="barbell" size={24} color="#000" />
              <Text style={styles.badgeText}>Strong</Text>
            </LinearGradient>
            <LinearGradient
              colors={["#CD7F32", "#8B4513"]}
              style={styles.badge}
            >
              <Ionicons name="water" size={24} color="#000" />
              <Text style={styles.badgeText}>Hydro</Text>
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
              <Text style={styles.badgeTextLocked}>Elite</Text>
            </LinearGradient>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(500).duration(500)}
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

        <Animated.View entering={FadeInDown.delay(600).duration(500)}>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
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
});
