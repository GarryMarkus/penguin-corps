import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useContext, useState } from "react";
import {
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { LPColors } from "../../constants/theme";
import { AuthContext } from "../../context/AuthContext";
import { useGoals } from "../../context/GoalsContext";
import { useSteps } from "../../context/StepsContext";

const { width } = Dimensions.get("window");

export default function StatsScreen() {
  const auth: any = useContext(AuthContext);
  const userName = auth?.user?.name || "User";
  const { streak } = useGoals();
  const { currentSteps, caloriesBurnt, distanceTraveled } = useSteps();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  const daysSmokeFree = 5;
  const cigarettesAvoided = 75;
  const moneySaved = 1500;
  const healthImprovement = 68;

  const weeklyData = [
    { day: "Mon", cigarettes: 0, cravings: 3 },
    { day: "Tue", cigarettes: 0, cravings: 2 },
    { day: "Wed", cigarettes: 0, cravings: 4 },
    { day: "Thu", cigarettes: 0, cravings: 1 },
    { day: "Fri", cigarettes: 0, cravings: 2 },
    { day: "Sat", cigarettes: 0, cravings: 1 },
    { day: "Sun", cigarettes: 0, cravings: 0 },
  ];

  const maxCravings = Math.max(...weeklyData.map((d) => d.cravings));

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
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={styles.header}
        >
          <View>
            <Text style={styles.greeting}>Your Progress</Text>
            <Text style={styles.headerTitle}>{userName}</Text>
          </View>
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={20} color="#FF6B6B" />
            <Text style={styles.streakText}>{streak} days</Text>
          </View>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
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
          {}
          <Animated.View
            entering={FadeInDown.delay(200)}
            style={styles.mainStatsGrid}
          >
            <LinearGradient
              colors={["#39FF14", "#138808"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mainStatCard}
            >
              <Ionicons name="calendar" size={32} color="#000" />
              <Text style={styles.mainStatValue}>{daysSmokeFree}</Text>
              <Text style={styles.mainStatLabel}>Days Smoke Free</Text>
            </LinearGradient>

            <LinearGradient
              colors={["#FF6B6B", "#C92A2A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mainStatCard}
            >
              <Ionicons name="close-circle" size={32} color="#FFF" />
              <Text style={styles.mainStatValue}>{cigarettesAvoided}</Text>
              <Text style={styles.mainStatLabel}>Cigarettes Avoided</Text>
            </LinearGradient>
          </Animated.View>

          {}
          <Animated.View
            entering={FadeInDown.delay(300)}
            style={styles.secondaryGrid}
          >
            <View style={styles.secondaryCard}>
              <View style={styles.secondaryIconContainer}>
                <Ionicons name="cash" size={24} color="#39FF14" />
              </View>
              <Text style={styles.secondaryValue}>₹{moneySaved}</Text>
              <Text style={styles.secondaryLabel}>Money Saved</Text>
            </View>

            <View style={styles.secondaryCard}>
              <View style={styles.secondaryIconContainer}>
                <Ionicons name="heart" size={24} color="#FF6B6B" />
              </View>
              <Text style={styles.secondaryValue}>{healthImprovement}%</Text>
              <Text style={styles.secondaryLabel}>Health Score</Text>
            </View>
          </Animated.View>

          {}
          <Animated.View
            entering={FadeInDown.delay(400)}
            style={styles.chartSection}
          >
            <Text style={styles.sectionTitle}>Weekly Cravings</Text>
            <View style={styles.chartCard}>
              <View style={styles.chartContainer}>
                {weeklyData.map((data, index) => (
                  <View key={index} style={styles.chartBar}>
                    <View style={styles.barContainer}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: `${(data.cravings / maxCravings) * 100}%`,
                            backgroundColor:
                              data.cravings === 0
                                ? LPColors.primary
                                : "#FF6B6B",
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{data.day}</Text>
                    <Text style={styles.barValue}>{data.cravings}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.chartNote}>Lower is better!</Text>
            </View>
          </Animated.View>

          {}
          <Animated.View
            entering={FadeInDown.delay(500)}
            style={styles.fitnessSection}
          >
            <Text style={styles.sectionTitle}>Today's Activity</Text>
            <View style={styles.fitnessGrid}>
              <View style={styles.fitnessCard}>
                <Ionicons name="footsteps" size={28} color={LPColors.primary} />
                <Text style={styles.fitnessValue}>
                  {currentSteps.toLocaleString()}
                </Text>
                <Text style={styles.fitnessLabel}>Steps</Text>
              </View>

              <View style={styles.fitnessCard}>
                <Ionicons name="navigate" size={28} color="#4A90E2" />
                <Text style={styles.fitnessValue}>
                  {(distanceTraveled / 1000).toFixed(2)}
                </Text>
                <Text style={styles.fitnessLabel}>km</Text>
              </View>

              <View style={styles.fitnessCard}>
                <Ionicons name="flame" size={28} color="#FF6B6B" />
                <Text style={styles.fitnessValue}>{caloriesBurnt}</Text>
                <Text style={styles.fitnessLabel}>kcal</Text>
              </View>
            </View>
          </Animated.View>

          {}
          <Animated.View
            entering={FadeInDown.delay(600)}
            style={styles.milestonesSection}
          >
            <Text style={styles.sectionTitle}>Achievements</Text>
            <View style={styles.milestonesCard}>
              <View style={styles.milestoneItem}>
                <View
                  style={[
                    styles.milestoneIcon,
                    { backgroundColor: "rgba(57,255,20,0.2)" },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={LPColors.primary}
                  />
                </View>
                <View style={styles.milestoneInfo}>
                  <Text style={styles.milestoneTitle}>First Day Completed</Text>
                  <Text style={styles.milestoneDate}>5 days ago</Text>
                </View>
              </View>

              <View style={styles.milestoneItem}>
                <View
                  style={[
                    styles.milestoneIcon,
                    { backgroundColor: "rgba(57,255,20,0.2)" },
                  ]}
                >
                  <Ionicons name="trophy" size={24} color="#FFD700" />
                </View>
                <View style={styles.milestoneInfo}>
                  <Text style={styles.milestoneTitle}>5 Day Streak</Text>
                  <Text style={styles.milestoneDate}>Today</Text>
                </View>
              </View>

              <View style={styles.milestoneItem}>
                <View
                  style={[
                    styles.milestoneIcon,
                    { backgroundColor: "rgba(255,255,255,0.05)" },
                  ]}
                >
                  <Ionicons
                    name="star-outline"
                    size={24}
                    color={LPColors.textGray}
                  />
                </View>
                <View style={styles.milestoneInfo}>
                  <Text
                    style={[
                      styles.milestoneTitle,
                      { color: LPColors.textGray },
                    ]}
                  >
                    One Week Smoke Free
                  </Text>
                  <Text style={styles.milestoneDate}>2 days to go</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LPColors.bg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 14,
    color: LPColors.textGray,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: LPColors.text,
    marginTop: 4,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LPColors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: "#FF6B6B",
  },
  streakText: {
    fontSize: 14,
    fontWeight: "bold",
    color: LPColors.text,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  mainStatsGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  mainStatCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  mainStatValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFF",
  },
  mainStatLabel: {
    fontSize: 12,
    color: "#FFF",
    opacity: 0.9,
    textAlign: "center",
  },
  secondaryGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  secondaryCard: {
    flex: 1,
    backgroundColor: LPColors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: LPColors.border,
  },
  secondaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  secondaryValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: LPColors.text,
  },
  secondaryLabel: {
    fontSize: 12,
    color: LPColors.textGray,
    marginTop: 4,
  },
  chartSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: LPColors.text,
    marginBottom: 12,
  },
  chartCard: {
    backgroundColor: LPColors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: LPColors.border,
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
    marginBottom: 12,
  },
  chartBar: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  barContainer: {
    flex: 1,
    width: "80%",
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    borderRadius: 4,
    minHeight: 8,
  },
  barLabel: {
    fontSize: 10,
    color: LPColors.textGray,
  },
  barValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: LPColors.text,
  },
  chartNote: {
    fontSize: 12,
    color: LPColors.textGray,
    textAlign: "center",
    fontStyle: "italic",
  },
  fitnessSection: {
    marginTop: 24,
  },
  fitnessGrid: {
    flexDirection: "row",
    gap: 12,
  },
  fitnessCard: {
    flex: 1,
    backgroundColor: LPColors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: LPColors.border,
    gap: 8,
  },
  fitnessValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: LPColors.text,
  },
  fitnessLabel: {
    fontSize: 11,
    color: LPColors.textGray,
  },
  milestonesSection: {
    marginTop: 24,
  },
  milestonesCard: {
    backgroundColor: LPColors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: LPColors.border,
    gap: 16,
  },
  milestoneItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  milestoneIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: LPColors.text,
  },
  milestoneDate: {
    fontSize: 12,
    color: LPColors.textGray,
    marginTop: 2,
  },
});
