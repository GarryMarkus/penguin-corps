import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";
import Animated, {
    Easing,
    FadeInDown,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSteps } from "../../context/StepsContext";

const { width } = Dimensions.get("window");

const DEMO_MODE = false;
const STEPS_PER_KM = 1300;
const DEMO_MULTIPLIER = 5;
const METERS_PER_STEP = 0.762;

const MILESTONES = [
  {
    id: 1,
    name: "Sabarmati Ashram",
    location: "Ahmedabad",
    distance: 0,
    description: "Journey begins",
  },
  {
    id: 2,
    name: "Aslali",
    location: "Gujarat",
    distance: 22,
    description: "First village",
  },
  {
    id: 3,
    name: "Bareja",
    location: "Gujarat",
    distance: 40,
    description: "Growing support",
  },
  {
    id: 4,
    name: "Nadiad",
    location: "Gujarat",
    distance: 75,
    description: "Thousands join",
  },
  {
    id: 5,
    name: "Anand",
    location: "Gujarat",
    distance: 95,
    description: "The milk city",
  },
  {
    id: 6,
    name: "Borsad",
    location: "Gujarat",
    distance: 125,
    description: "Momentum builds",
  },
  {
    id: 7,
    name: "Bharuch",
    location: "Gujarat",
    distance: 200,
    description: "River crossing",
  },
  {
    id: 8,
    name: "Surat",
    location: "Gujarat",
    distance: 260,
    description: "Diamond city",
  },
  {
    id: 9,
    name: "Navsari",
    location: "Gujarat",
    distance: 300,
    description: "Final stretch",
  },
  {
    id: 10,
    name: "Dandi",
    location: "Gujarat",
    distance: 385,
    description: "Salt Satyagraha! 🇮🇳",
  },
];

const TOTAL_DISTANCE = 385;
const STORAGE_KEY_STEPS = "@padyatra_steps";
const STORAGE_KEY_DATE = "@padyatra_date";
const STORAGE_KEY_DISTANCE = "@padyatra_distance";

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export default function PadyatraScreen() {
  const { currentSteps, distanceTraveled, isTracking } = useSteps();
  const [locationEnabled, setLocationEnabled] = useState(isTracking);
  const [totalDistance, setTotalDistance] = useState(0);
  const [unlockedMilestones, setUnlockedMilestones] = useState([1]);

  useEffect(() => {
    setLocationEnabled(isTracking);
  }, [isTracking]);

  const pulseAnim = useSharedValue(0);

  useEffect(() => {
    if (isTracking) {
      pulseAnim.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      pulseAnim.value = 0;
    }
  }, [isTracking]);

  const pulseStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulseAnim.value, [0, 1], [1, 1.2]);
    const opacity = interpolate(pulseAnim.value, [0, 1], [0.5, 1]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  useEffect(() => {
    let calculatedDistance = 0;

    if (DEMO_MODE) {
      calculatedDistance = (currentSteps / STEPS_PER_KM) * DEMO_MULTIPLIER;
    } else {
      calculatedDistance = currentSteps / STEPS_PER_KM;
    }

    setTotalDistance(calculatedDistance);

    MILESTONES.forEach((milestone) => {
      if (
        calculatedDistance >= milestone.distance &&
        !unlockedMilestones.includes(milestone.id)
      ) {
        setUnlockedMilestones((prev) => [...prev, milestone.id]);
        Alert.alert(
          "Milestone Reached!",
          `You've reached ${milestone.name}!\n${milestone.description}`,
          [{ text: "Continue Walking", style: "default" }],
        );
      }
    });
  }, [currentSteps]);

  const progressPercentage = Math.min(
    (totalDistance / TOTAL_DISTANCE) * 100,
    100,
  );
  const caloriesBurnt = Math.round(totalDistance * 50);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#FF9933", "#FFF", "#138808"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View>
            <Animated.Text
              entering={FadeInDown.delay(100)}
              style={styles.headerTitle}
            >
              🇮🇳 Dandi March Challenge
            </Animated.Text>
            <Animated.Text
              entering={FadeInDown.delay(200)}
              style={styles.headerSubtitle}
            >
              Walk with Bapu's footsteps
            </Animated.Text>
          </View>
          {DEMO_MODE && (
            <Animated.View
              entering={FadeInDown.delay(300)}
              style={styles.demoBadge}
            >
              <Text style={styles.demoText}>DEMO</Text>
            </Animated.View>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        {DEMO_MODE && (
          <View style={styles.debugPanel}>
            <Text style={styles.debugTitle}>GPS Step Tracking</Text>
            <Text style={styles.debugText}>
              {locationEnabled
                ? "GPS Active - Walk to count steps!"
                : "GPS not enabled"}
            </Text>
            <Text style={styles.debugText}>Steps: {currentSteps}</Text>
            <Text style={styles.debugText}>
              Distance: {distanceTraveled.toFixed(1)}m
            </Text>
            <Text style={styles.debugText}>Demo: 1 step = 5km</Text>
            <Text
              style={[
                styles.debugText,
                { marginTop: 8, fontSize: 10, fontStyle: "italic" },
              ]}
            >
              Start walking and watch your steps increase automatically!
            </Text>
          </View>
        )}

        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={styles.progressCard}
        >
          <Text style={styles.progressTitle}>Journey Progress</Text>
          <Text style={styles.progressDistance}>
            {totalDistance.toFixed(1)} / {TOTAL_DISTANCE} km
          </Text>
          <View style={styles.progressBarContainer}>
            <View
              style={[styles.progressBar, { width: `${progressPercentage}%` }]}
            />
          </View>
          <Text style={styles.progressPercentage}>
            {progressPercentage.toFixed(1)}% Complete
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          style={styles.statsGrid}
        >
          <View style={[styles.statCard, { backgroundColor: "#FF9933" }]}>
            <Ionicons name="footsteps" size={28} color="#FFF" />
            <Text style={styles.statValue}>
              {currentSteps.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Steps Today</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: "#138808" }]}>
            <Ionicons name="navigate" size={28} color="#FFF" />
            <Text style={styles.statValue}>{totalDistance.toFixed(1)} km</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: "#FFF" }]}>
            <Ionicons name="flame" size={28} color="#FF6B6B" />
            <Text style={[styles.statValue, { color: "#000" }]}>
              {caloriesBurnt}
            </Text>
            <Text style={[styles.statLabel, { color: "#666" }]}>Calories</Text>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(300).duration(500)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Milestones</Text>

          {MILESTONES.map((milestone, index) => {
            const isUnlocked = unlockedMilestones.includes(milestone.id);
            const isNext =
              !isUnlocked &&
              totalDistance >= (MILESTONES[index - 1]?.distance || 0);
            const isCurrent = isNext && index > 0;

            return (
              <View key={milestone.id} style={styles.milestoneContainer}>
                {index < MILESTONES.length - 1 && (
                  <View
                    style={[
                      styles.timelineLine,
                      isUnlocked && styles.timelineLineUnlocked,
                    ]}
                  />
                )}

                <View
                  style={[
                    styles.milestoneCard,
                    isUnlocked && styles.milestoneCardUnlocked,
                    isCurrent && styles.milestoneCardCurrent,
                  ]}
                >
                  <View
                    style={[
                      styles.milestoneIcon,
                      isUnlocked && styles.milestoneIconUnlocked,
                      isCurrent && styles.milestoneIconCurrent,
                    ]}
                  >
                    <Ionicons
                      name={
                        isUnlocked
                          ? "checkmark-circle"
                          : isCurrent
                            ? "walk"
                            : "location"
                      }
                      size={24}
                      color={
                        isUnlocked ? "#138808" : isCurrent ? "#FF9933" : "#666"
                      }
                    />
                  </View>

                  <View style={styles.milestoneInfo}>
                    <Text
                      style={[
                        styles.milestoneName,
                        isUnlocked && styles.milestoneNameUnlocked,
                      ]}
                    >
                      {milestone.name}
                    </Text>
                    <Text style={styles.milestoneLocation}>
                      {milestone.location}
                    </Text>
                    <Text style={styles.milestoneDescription}>
                      {milestone.description}
                    </Text>
                  </View>

                  <View style={styles.milestoneDistance}>
                    <Text
                      style={[
                        styles.milestoneDistanceText,
                        isUnlocked && styles.milestoneDistanceTextUnlocked,
                      ]}
                    >
                      {milestone.distance} km
                    </Text>
                    {isUnlocked && <Text style={styles.unlockedBadge}>✓</Text>}
                  </View>
                </View>
              </View>
            );
          })}
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerGradient: {
    paddingBottom: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    textShadowColor: "rgba(255,255,255,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#333",
    marginTop: 2,
  },
  demoBadge: {
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  demoText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  gpsIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(57,255,20,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  debugHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  debugRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#39FF14",
  },
  statLabel: {
    fontSize: 10,
    color: "#666",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  debugPanel: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  debugTitle: {
    color: "#FF9933",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  debugText: {
    color: "#999",
    fontSize: 12,
    marginBottom: 4,
  },
  progressCard: {
    backgroundColor: "#1C1C1E",
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
    marginBottom: 8,
  },
  progressDistance: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#39FF14",
    marginBottom: 16,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#39FF14",
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    color: "#999",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 16,
  },
  milestoneContainer: {
    position: "relative",
    marginBottom: 16,
  },
  timelineLine: {
    position: "absolute",
    left: 20,
    top: 50,
    width: 2,
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  timelineLineUnlocked: {
    backgroundColor: "#138808",
  },
  milestoneCard: {
    flexDirection: "row",
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  milestoneCardUnlocked: {
    borderColor: "#138808",
    backgroundColor: "rgba(19,136,8,0.1)",
  },
  milestoneCardCurrent: {
    borderColor: "#FF9933",
    backgroundColor: "rgba(255,153,51,0.1)",
  },
  milestoneIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneIconUnlocked: {
    backgroundColor: "rgba(19,136,8,0.2)",
  },
  milestoneIconCurrent: {
    backgroundColor: "rgba(255,153,51,0.2)",
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#999",
    marginBottom: 2,
  },
  milestoneNameUnlocked: {
    color: "#FFF",
  },
  milestoneLocation: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  milestoneDescription: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
  milestoneDistance: {
    alignItems: "flex-end",
  },
  milestoneDistanceText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  milestoneDistanceTextUnlocked: {
    color: "#138808",
  },
  unlockedBadge: {
    fontSize: 20,
    color: "#138808",
    marginTop: 4,
  },
  addStepsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#39FF14",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  addStepsText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
});
