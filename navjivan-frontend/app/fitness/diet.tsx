import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { LPColors } from "../../constants/theme";
import { useGoals } from "../../context/GoalsContext";
import { analyzeFoodApi, suggestSmartMealApi } from "../../services/api";
import { LPHaptics } from "../../services/haptics";

interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  time: string;
}

const STORAGE_KEY_MEALS = "@daily_meals";
const STORAGE_KEY_DATE = "@daily_date";

export default function FitnessDietScreen() {
  const { waterIntake, updateWaterIntake } = useGoals();
  const params = useLocalSearchParams<{ openAdd?: string }>();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealInput, setMealInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Auto-open modal when navigated from home Meal button
  useEffect(() => {
    if (params.openAdd === '1') {
      setShowAddModal(true);
    }
  }, [params.openAdd]);

  const getRandomFallback = () => {
    const hour = new Date().getHours();
    const fallbackOptions = [
      {
        mealName: "Masala Omelette with Toast",
        reason: "High protein start to fuel your day.",
        calories: 320,
        protein: 18,
      },
      {
        mealName: "Vegetable Upma",
        reason: "Fibre-rich and easy on digestion.",
        calories: 250,
        protein: 7,
      },
      {
        mealName: "Dal Tadka with Rice",
        reason: "Balanced meal with protein-rich lentils.",
        calories: 450,
        protein: 18,
      },
      {
        mealName: "Paneer Bhurji with Roti",
        reason: "Excellent source of calcium and protein.",
        calories: 420,
        protein: 22,
      },
      {
        mealName: "Mixed Fruit Chaat",
        reason: "Light, refreshing and easy to digest.",
        calories: 120,
        protein: 2,
      },
      {
        mealName: "Besan Chilla",
        reason: "Protein-packed vegetarian breakfast.",
        calories: 220,
        protein: 12,
      },
    ];
    return fallbackOptions[Math.floor(Math.random() * fallbackOptions.length)];
  };

  const [suggestion, setSuggestion] = useState<any>(getRandomFallback());
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  useEffect(() => {
    const init = async () => {
      await loadDailyData();
    };
    init();
  }, []);

  useEffect(() => {
    fetchSmartSuggestion();
  }, [meals.length]);

  const loadDailyData = async () => {
    try {
      const today = new Date().toDateString();
      const storedDate = await AsyncStorage.getItem(STORAGE_KEY_DATE);

      if (storedDate !== today) {
        await AsyncStorage.setItem(STORAGE_KEY_DATE, today);
        await AsyncStorage.setItem(STORAGE_KEY_MEALS, JSON.stringify([]));
        setMeals([]);
      } else {
        const storedMeals = await AsyncStorage.getItem(STORAGE_KEY_MEALS);
        if (storedMeals) setMeals(JSON.parse(storedMeals));
      }
    } catch (e) {
      console.error("Failed to load diet data", e);
    }
  };

  const fetchSmartSuggestion = async () => {
    setLoadingSuggestion(true);
    try {
      const history = meals.map((m) => `${m.name} (${m.calories}kcal)`);
      const currentHour = new Date().getHours();

      console.log("[Diet] Fetching meal suggestion...", {
        historyCount: history.length,
        currentHour,
      });
      const res = await suggestSmartMealApi(history, currentHour);
      console.log("[Diet] Suggestion received:", res.data);

      if (res.data) {
        setSuggestion(res.data);
      }
    } catch (error: any) {
      console.error(
        "[Diet] Failed to fetch suggestion:",
        error.response?.data || error.message,
      );
      setSuggestion(getRandomFallback());
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const updateWater = async (newCount: number) => {
    LPHaptics.light();
    updateWaterIntake(newCount);
  };

  const handleAddMeal = async () => {
    if (!mealInput.trim()) return;

    setIsAnalyzing(true);
    try {
      const res = await analyzeFoodApi(mealInput);
      const data: any = res.data;

      const newMeal: Meal = {
        id: Date.now().toString(),
        name: data.name || mealInput,
        calories: data.calories || 0,
        protein: data.protein || 0,
        carbs: data.carbs || 0,
        fats: data.fats || 0,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      const updatedMeals = [newMeal, ...meals];
      setMeals(updatedMeals);
      await AsyncStorage.setItem(
        STORAGE_KEY_MEALS,
        JSON.stringify(updatedMeals),
      );

      setMealInput("");
      setShowAddModal(false);
      LPHaptics.success();
      fetchSmartSuggestion();
      Alert.alert(
        "Meal Added",
        `Logged ${newMeal.name} (${newMeal.calories} kcal)`,
      );
    } catch (error: any) {
      LPHaptics.error();
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Could not analyze food. Please check your connection.";
      Alert.alert("Analysis Failed", errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteMeal = async (id: string) => {
    LPHaptics.medium();
    const updatedMeals = meals.filter((m) => m.id !== id);
    setMeals(updatedMeals);
    await AsyncStorage.setItem(STORAGE_KEY_MEALS, JSON.stringify(updatedMeals));
  };

  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);
  const totalCarbs = meals.reduce((sum, m) => sum + m.carbs, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Diet & Nutrition</Text>
          <Text style={styles.headerSubtitle}>
            Fuel your body for performance
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          style={styles.addBtn}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        { }
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={styles.suggestionCard}
        >
          <LinearGradient
            colors={[LPColors.primary, "#004d2c"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.suggestionGradient}
          >
            <View style={styles.suggestionIcon}>
              <Ionicons name="sparkles" size={20} color="#000" />
            </View>
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={styles.suggestionTitle}>
                  Chef's Recommendation
                </Text>
                {loadingSuggestion && (
                  <ActivityIndicator size="small" color="#FFF" />
                )}
              </View>

              {suggestion ? (
                <>
                  <Text style={styles.suggestionMealName}>
                    {suggestion.mealName}
                  </Text>
                  <Text style={styles.suggestionText}>{suggestion.reason}</Text>
                </>
              ) : (
                <Text style={styles.suggestionText}>
                  Loading personalized tip...
                </Text>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        { }
        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          style={styles.summaryContainer}
        >
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Calories</Text>
            <Text style={styles.summaryValue}>{totalCalories}</Text>
            <Text style={styles.summarySub}>kcal</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Protein</Text>
            <Text style={styles.summaryValue}>{totalProtein}g</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Carbs</Text>
            <Text style={styles.summaryValue}>{totalCarbs}g</Text>
          </View>
        </Animated.View>

        { }
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Meals</Text>
            {meals.length === 0 && (
              <Text style={styles.emptyText}>No meals logged yet</Text>
            )}
          </View>

          {meals.map((meal, index) => (
            <Animated.View
              key={meal.id}
              entering={FadeInDown.delay(300 + index * 50).duration(400)}
              style={styles.mealItem}
            >
              <View style={styles.mealInfo}>
                <Text style={styles.mealName}>{meal.name}</Text>
                <Text style={styles.mealDetails}>
                  {meal.calories} kcal • {meal.protein}g protein
                </Text>
              </View>
              <View style={styles.mealRight}>
                <Text style={styles.mealTime}>{meal.time}</Text>
                <TouchableOpacity
                  onPress={() => handleDeleteMeal(meal.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            </Animated.View>
          ))}

          <TouchableOpacity
            style={styles.logMealBtn}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.logMealText}>+ Log Meal</Text>
          </TouchableOpacity>
        </View>

        { }
        <Animated.View
          entering={FadeInDown.delay(400).duration(500)}
          style={styles.section}
        >
          <LinearGradient
            colors={["#1E3A8A", "#3B82F6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.waterCard}
          >
            <View style={styles.waterHeader}>
              <View>
                <Text style={styles.waterTitle}>Water Tracker</Text>
                <Text style={styles.waterSubtitle}>
                  Stay hydrated & energized
                </Text>
              </View>
              <View style={styles.waterBubble}>
                <Ionicons name="water" size={24} color="#FFF" />
              </View>
            </View>

            <View style={styles.waterControls}>
              <TouchableOpacity
                onPress={() => waterIntake > 0 && updateWater(waterIntake - 1)}
                style={styles.controlBtn}
              >
                <Ionicons name="remove" size={24} color="#FFF" />
              </TouchableOpacity>

              <View style={styles.waterCountContainer}>
                <Text style={styles.waterCount}>{waterIntake}</Text>
                <Text style={styles.waterTarget}>/ 8 glasses</Text>
              </View>

              <TouchableOpacity
                onPress={() => waterIntake < 12 && updateWater(waterIntake + 1)}
                style={[styles.controlBtn, { backgroundColor: "#FFF" }]}
              >
                <Ionicons name="add" size={24} color={LPColors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.glassesContainer}>
              {[...Array(8)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.glassIndicator,
                    i < waterIntake ? styles.glassFilled : styles.glassEmpty,
                  ]}
                />
              ))}
            </View>
          </LinearGradient>
        </Animated.View>

        { }
        <Animated.View
          entering={FadeInDown.delay(500).duration(500)}
          style={[styles.section, { marginBottom: 100 }]}
        >
          <Text style={styles.sectionTitle}>Healthy Swaps</Text>

          <View style={styles.swapCard}>
            <View style={styles.swapItem}>
              <Text style={styles.swapLabel}>Instead of</Text>
              <Text style={styles.swapFood}>Coffee</Text>
              <Text style={styles.swapReason}>Triggers cravings</Text>
            </View>
            <Ionicons
              name="arrow-forward"
              size={24}
              color={LPColors.textGray}
            />
            <View style={styles.swapItem}>
              <Text style={styles.swapLabel}>Try</Text>
              <Text style={[styles.swapFood, { color: LPColors.primary }]}>
                Green Tea
              </Text>
              <Text style={styles.swapReason}>Calming effect</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      { }
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log a Meal</Text>
            <Text style={styles.modalSub}>
              Describe what you ate, and our AI will calculate the nutrients.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="e.g. Grilled chicken salad with avocado"
              placeholderTextColor="#666"
              value={mealInput}
              onChangeText={setMealInput}
              multiline
              maxLength={100}
            />

            <TouchableOpacity
              style={[styles.analyzeBtn, isAnalyzing && styles.btnDisabled]}
              onPress={handleAddMeal}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.analyzeText}>Analyze & Add</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowAddModal(false)}
            >
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFF",
  },
  headerSubtitle: {
    fontSize: 14,
    color: LPColors.textGray,
    marginTop: 4,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
  },
  emptyText: {
    fontSize: 12,
    color: LPColors.textGray,
  },
  suggestionCard: {
    marginBottom: 20,
  },
  suggestionGradient: {
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  suggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  suggestionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "rgba(255,255,255,0.8)",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  suggestionMealName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    fontStyle: "italic",
  },
  summaryContainer: {
    flexDirection: "row",
    backgroundColor: "#1C1C1E",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    justifyContent: "space-around",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  summaryCard: {
    alignItems: "center",
  },
  divider: {
    width: 1,
    height: "80%",
    backgroundColor: "rgba(255,255,255,0.1)",
    alignSelf: "center",
  },
  summaryLabel: {
    fontSize: 12,
    color: LPColors.textGray,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
  },
  summarySub: {
    fontSize: 10,
    color: LPColors.textGray,
  },
  mealItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LPColors.surfaceLight,
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 4,
  },
  mealDetails: {
    fontSize: 12,
    color: LPColors.primary,
  },
  mealRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  mealTime: {
    fontSize: 10,
    color: LPColors.textGray,
  },
  logMealBtn: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderStyle: "dashed",
    alignItems: "center",
    marginTop: 8,
  },
  logMealText: {
    fontSize: 14,
    color: LPColors.textGray,
    fontWeight: "600",
  },
  waterCard: {
    borderRadius: 24,
    padding: 24,
  },
  waterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  waterTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFF",
  },
  waterSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  waterBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  waterControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  controlBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  waterCountContainer: {
    alignItems: "center",
  },
  waterCount: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FFF",
  },
  waterTarget: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  glassesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  glassIndicator: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  glassFilled: {
    backgroundColor: "#FFF",
  },
  glassEmpty: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  swapCard: {
    backgroundColor: "#1C1C1E",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  swapItem: {
    flex: 1,
    alignItems: "center",
  },
  swapLabel: {
    fontSize: 10,
    color: LPColors.textGray,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  swapFood: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 4,
    textAlign: "center",
  },
  swapReason: {
    fontSize: 11,
    color: LPColors.textGray,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1C1C1E",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 14,
    color: LPColors.textGray,
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#2C2C2E",
    borderRadius: 12,
    padding: 16,
    color: "#FFF",
    fontSize: 16,
    marginBottom: 20,
    minHeight: 100,
    textAlignVertical: "top",
  },
  analyzeBtn: {
    backgroundColor: LPColors.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    marginBottom: 12,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  analyzeText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  closeBtn: {
    padding: 16,
    alignItems: "center",
  },
  closeText: {
    color: LPColors.textGray,
    fontSize: 16,
  },
});
