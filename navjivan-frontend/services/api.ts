import axios from "axios";
import { DeviceEventEmitter, Platform } from "react-native";

const LOCAL_IP = "10.47.0.89";

let BASE_URL = `http://${LOCAL_IP}:5000`;
// let BASE_URL = "https://navjivan-backend.onrender.com";

const API = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      const AsyncStorage = require("@react-native-async-storage/async-storage").default;
      console.warn("401 Unauthorized detected. Clearing async storage.");
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      delete API.defaults.headers.common["Authorization"];
      DeviceEventEmitter.emit("LOGOUT");
    }
    return Promise.reject(error);
  }
);

export const setAuthToken = (token: string | null) => {
  if (token) {
    API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common["Authorization"];
  }
};

export const login = (email: string, password: string) =>
  API.post("/auth/login", { email, password });

export const signup = (
  name: string,
  email: string,
  password: string,
  age?: number,
  height?: number,
  weight?: number,
  isSmoker?: boolean,
  plan?: string,
) =>
  API.post("/auth/signup", {
    name,
    email,
    password,
    age,
    height,
    weight,
    isSmoker,
    plan,
  });

export const fetchDashboardSummary = () => API.get("/dashboard/summary");

export const updateDailyGoals = (goalsCompleted: number) =>
  API.post("/dashboard/update-goals", { goalsCompleted });

interface ChatMessage {
  text: string;
  sender: "user" | "ai";
}

export const chatWithAICoach = (message: string, chatHistory: ChatMessage[]) =>
  API.post("/ai-coach/chat", { message, chatHistory });

export const analyzeFoodApi = (foodText: string) =>
  API.post("/ai-coach/analyze-food", { foodText });

export const suggestSmartMealApi = (history: string[], currentHour: number) =>
  API.post("/ai-coach/suggest-smart-meal", { history, currentHour });

interface HealthData {
  height?: string;
  weight?: string;
  workoutHours?: string;
  sleepHours?: string;
  diabetic?: string;
  heartCondition?: string;
  bloodPressure?: string;
}

export const generateAgenticGoalsApi = (
  healthData: HealthData | null,
  completedGoals: string[],
  fitnessLevel: string,
  currentStreak: number,
  bmi: number | null,
) =>
  API.post("/ai-coach/generate-agentic-goals", {
    healthData,
    completedGoals,
    fitnessLevel,
    currentStreak,
    bmi,
  });

export default API;
