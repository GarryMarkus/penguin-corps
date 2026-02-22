import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";
import { generateAgenticGoalsApi } from "../services/api";

export interface Goal {
  id: number;
  text: string;
  completed: boolean;
  icon?: string;
  isCustom?: boolean;
}

export interface HealthData {
  height?: string;
  weight?: string;
  workoutHours?: string;
  sleepHours?: string;
  diabetic?: string;
  heartCondition?: string;
  bloodPressure?: string;
  state?: string;
}

export type PlanType = "cold-turkey" | "gradual" | null;
export type FitnessLevel = "beginner" | "intermediate" | "advanced" | null;

interface GoalsContextType {
  goals: Goal[];
  plan: PlanType;
  fitnessLevel: FitnessLevel;
  waterIntake: number;
  streak: number;
  lastStreakDate: string | null;
  healthData: HealthData | null;
  isLoadingGoals: boolean;
  setPlan: (plan: PlanType) => void;
  setFitnessLevel: (level: FitnessLevel) => void;
  setHealthData: (data: HealthData) => void;
  setGoalsFromAI: (aiGoals: Array<{ text: string; icon: string }>) => void;
  updateWaterIntake: (count: number) => void;
  addGoal: (goal: Omit<Goal, "id">) => void;
  deleteGoal: (id: number) => void;
  toggleGoalCompletion: (id: number) => void;
  refreshGoalsWithAI: () => Promise<void>;
  generateInitialGoals: () => Promise<void>;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

const STORAGE_KEY_WATER = "@daily_water";
const STORAGE_KEY_WATER_DATE = "@daily_water_date";
const STORAGE_KEY_GOALS = "@daily_goals";
const STORAGE_KEY_GOALS_DATE = "@daily_goals_date";
const STORAGE_KEY_STREAK = "@streak_count";
const STORAGE_KEY_STREAK_DATE = "@streak_last_date";
const STORAGE_KEY_HEALTH_DATA = "@health_data";
const STORAGE_KEY_COMPLETED_HISTORY = "@completed_goals_history";
const STORAGE_KEY_FITNESS_LEVEL = "@fitness_level";
const STORAGE_KEY_BMI = "@saved_bmi";

const DEFAULT_GOALS: Omit<Goal, "id">[] = [
  { text: "Drink 8 glasses of water", completed: false, icon: "water-outline" },
  { text: "Walk 15 minutes", completed: false, icon: "walk-outline" },
  { text: "Sleep 7+ hours", completed: false, icon: "bed-outline" },
  { text: "Eat a healthy meal", completed: false, icon: "restaurant-outline" },
  { text: "Stretch for 5 mins", completed: false, icon: "fitness-outline" },
  { text: "Practice mindfulness", completed: false, icon: "leaf-outline" },
];

export const GoalsProvider = ({ children }: { children: ReactNode }) => {
  const [plan, setPlanState] = useState<PlanType>(null);
  const [fitnessLevel, setFitnessLevelState] = useState<FitnessLevel>(null);
  const [waterIntake, setWaterIntake] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastStreakDate, setLastStreakDate] = useState<string | null>(null);
  const [healthData, setHealthDataState] = useState<HealthData | null>(null);
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);
  const [goals, setGoals] = useState<Goal[]>(
    DEFAULT_GOALS.map((g, i) => ({ ...g, id: i + 1 })),
  );

  const fetchAgenticGoals = async (currentStreak: number): Promise<Goal[]> => {
    try {
      setIsLoadingGoals(true);
      console.log("[GoalsContext] Fetching AI goals...");

      const storedHealthData = await AsyncStorage.getItem(
        STORAGE_KEY_HEALTH_DATA,
      );
      const storedFitnessLevel = await AsyncStorage.getItem(
        STORAGE_KEY_FITNESS_LEVEL,
      );
      const storedBMI = await AsyncStorage.getItem(STORAGE_KEY_BMI);
      const storedCompletedHistory = await AsyncStorage.getItem(
        STORAGE_KEY_COMPLETED_HISTORY,
      );

      const parsedHealthData = storedHealthData
        ? JSON.parse(storedHealthData)
        : null;
      const parsedFitnessLevel = storedFitnessLevel || "beginner";
      const parsedBMI = storedBMI ? parseFloat(storedBMI) : null;
      const completedHistory = storedCompletedHistory
        ? JSON.parse(storedCompletedHistory)
        : [];

      const recentCompleted = completedHistory.slice(-10);

      const response = await generateAgenticGoalsApi(
        parsedHealthData,
        recentCompleted,
        parsedFitnessLevel,
        currentStreak,
        parsedBMI,
      );

      const responseData = response.data as {
        goals?: Array<{ text: string; icon: string }>;
      };
      if (responseData?.goals && Array.isArray(responseData.goals)) {
        const aiGoals = responseData.goals.map((g, i) => ({
          id: i + 1,
          text: g.text,
          completed: false,
          icon: g.icon || "checkmark-circle-outline",
          isCustom: false,
        }));
        console.log("[GoalsContext] AI Goals received:", aiGoals);
        return aiGoals;
      }
    } catch (error) {
      console.error("[GoalsContext] Failed to fetch AI goals:", error);
    } finally {
      setIsLoadingGoals(false);
    }

    return DEFAULT_GOALS.map((g, i) => ({ ...g, id: i + 1 }));
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const today = new Date().toDateString();

        const storedHealthData = await AsyncStorage.getItem(
          STORAGE_KEY_HEALTH_DATA,
        );
        if (storedHealthData) setHealthDataState(JSON.parse(storedHealthData));

        const storedFitnessLevel = await AsyncStorage.getItem(
          STORAGE_KEY_FITNESS_LEVEL,
        );
        if (storedFitnessLevel)
          setFitnessLevelState(storedFitnessLevel as FitnessLevel);

        const storedWaterDate = await AsyncStorage.getItem(
          STORAGE_KEY_WATER_DATE,
        );
        if (storedWaterDate !== today) {
          setWaterIntake(0);
          await AsyncStorage.setItem(STORAGE_KEY_WATER, "0");
          await AsyncStorage.setItem(STORAGE_KEY_WATER_DATE, today);
        } else {
          const storedWater = await AsyncStorage.getItem(STORAGE_KEY_WATER);
          if (storedWater) setWaterIntake(parseInt(storedWater));
        }

        let currentStreak = 0;
        const storedStreak = await AsyncStorage.getItem(STORAGE_KEY_STREAK);
        const storedStreakDate = await AsyncStorage.getItem(
          STORAGE_KEY_STREAK_DATE,
        );

        if (storedStreak) {
          currentStreak = parseInt(storedStreak);
          setStreak(currentStreak);
        }
        if (storedStreakDate) {
          setLastStreakDate(storedStreakDate);

          const lastDate = new Date(storedStreakDate);
          const todayDate = new Date(today);
          const daysDiff = Math.floor(
            (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
          );

          if (daysDiff > 1) {
            console.log("[Streak] Reset - missed", daysDiff, "days");
            currentStreak = 0;
            setStreak(0);
            await AsyncStorage.setItem(STORAGE_KEY_STREAK, "0");
          }
        }

        const storedGoalsDate = await AsyncStorage.getItem(
          STORAGE_KEY_GOALS_DATE,
        );
        if (storedGoalsDate !== today) {
          console.log("[GoalsContext] New day! Fetching fresh AI goals...");
          const aiGoals = await fetchAgenticGoals(currentStreak);
          setGoals(aiGoals);
          await AsyncStorage.setItem(
            STORAGE_KEY_GOALS,
            JSON.stringify(aiGoals),
          );
          await AsyncStorage.setItem(STORAGE_KEY_GOALS_DATE, today);
        } else {
          const storedGoals = await AsyncStorage.getItem(STORAGE_KEY_GOALS);
          if (storedGoals) setGoals(JSON.parse(storedGoals));
        }
      } catch (error) {
        console.error("Failed to load data", error);
      }
    };
    loadData();
  }, []);

  const checkAndUpdateStreak = async (updatedGoals: Goal[]) => {
    const allCompleted = updatedGoals.every((g) => g.completed);
    const today = new Date().toDateString();

    console.log("[Streak] Checking:", {
      allCompleted,
      completedCount: updatedGoals.filter((g) => g.completed).length,
      totalGoals: updatedGoals.length,
      lastStreakDate,
      today,
      currentStreak: streak,
    });

    if (allCompleted && lastStreakDate !== today) {
      const newStreak = streak + 1;
      console.log("[Streak] All goals completed! New streak:", newStreak);

      setStreak(newStreak);
      setLastStreakDate(today);

      await AsyncStorage.setItem(STORAGE_KEY_STREAK, newStreak.toString());
      await AsyncStorage.setItem(STORAGE_KEY_STREAK_DATE, today);
    } else if (allCompleted && lastStreakDate === today) {
      console.log("[Streak] Already counted for today");
    } else {
      console.log("[Streak] Not all goals completed yet");
    }
  };

  const saveCompletedGoalToHistory = async (goalText: string) => {
    try {
      const storedHistory = await AsyncStorage.getItem(
        STORAGE_KEY_COMPLETED_HISTORY,
      );
      const history = storedHistory ? JSON.parse(storedHistory) : [];

      history.push(goalText);
      const trimmedHistory = history.slice(-50);

      await AsyncStorage.setItem(
        STORAGE_KEY_COMPLETED_HISTORY,
        JSON.stringify(trimmedHistory),
      );
    } catch (error) {
      console.error("Failed to save completed goal history", error);
    }
  };

  const setPlan = (newPlan: PlanType) => {
    setPlanState(newPlan);
  };

  const setFitnessLevel = async (level: FitnessLevel) => {
    setFitnessLevelState(level);
    if (level) {
      await AsyncStorage.setItem(STORAGE_KEY_FITNESS_LEVEL, level);
    }
  };

  const setHealthData = async (data: HealthData) => {
    setHealthDataState(data);
    await AsyncStorage.setItem(STORAGE_KEY_HEALTH_DATA, JSON.stringify(data));
  };

  const updateWaterIntake = async (count: number) => {
    setWaterIntake(count);
    await AsyncStorage.setItem(STORAGE_KEY_WATER, count.toString());
    await AsyncStorage.setItem(
      STORAGE_KEY_WATER_DATE,
      new Date().toDateString(),
    );
  };

  const setGoalsFromAI = (aiGoals: Array<{ text: string; icon: string }>) => {
    if (aiGoals && aiGoals.length > 0) {
      const newGoals = aiGoals.map((g, i) => ({
        id: i + 1,
        text: g.text,
        completed: false,
        icon: g.icon || "checkmark-circle-outline",
        isCustom: false,
      }));
      setGoals(newGoals);
    }
  };

  const addGoal = (newGoal: Omit<Goal, "id">) => {
    const id = Math.max(0, ...goals.map((g) => g.id)) + 1;
    setGoals([...goals, { ...newGoal, id }]);
  };

  const deleteGoal = (id: number) => {
    setGoals(goals.filter((g) => g.id !== id));
  };

  const toggleGoalCompletion = async (id: number) => {
    const goal = goals.find((g) => g.id === id);
    const updatedGoals = goals.map((g) =>
      g.id === id ? { ...g, completed: !g.completed } : g,
    );
    setGoals(updatedGoals);

    await AsyncStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(updatedGoals));

    if (goal && !goal.completed) {
      await saveCompletedGoalToHistory(goal.text);
    }

    await checkAndUpdateStreak(updatedGoals);
  };

  const refreshGoalsWithAI = async () => {
    console.log("[GoalsContext] Manual refresh of AI goals...");
    const aiGoals = await fetchAgenticGoals(streak);
    setGoals(aiGoals);
    await AsyncStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(aiGoals));
    await AsyncStorage.setItem(
      STORAGE_KEY_GOALS_DATE,
      new Date().toDateString(),
    );
  };

  const generateInitialGoals = async () => {
    console.log("[GoalsContext] Generating initial AI goals for day one...");
    const aiGoals = await fetchAgenticGoals(0);
    setGoals(aiGoals);
    await AsyncStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(aiGoals));
    await AsyncStorage.setItem(
      STORAGE_KEY_GOALS_DATE,
      new Date().toDateString(),
    );
  };

  return (
    <GoalsContext.Provider
      value={{
        goals,
        plan,
        fitnessLevel,
        waterIntake,
        streak,
        lastStreakDate,
        healthData,
        isLoadingGoals,
        setPlan,
        setFitnessLevel,
        setHealthData,
        setGoalsFromAI,
        updateWaterIntake,
        addGoal,
        deleteGoal,
        toggleGoalCompletion,
        refreshGoalsWithAI,
        generateInitialGoals,
      }}
    >
      {children}
    </GoalsContext.Provider>
  );
};

export const useGoals = () => {
  const context = useContext(GoalsContext);
  if (!context) {
    throw new Error("useGoals must be used within a GoalsProvider");
  }
  return context;
};
