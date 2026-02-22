import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LPColors } from "../../constants/theme";
import { AuthContext } from "../../context/AuthContext";
import { PlanType, useGoals } from "../../context/GoalsContext";
import API from "../../services/api";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu & Kashmir",
  "Ladakh",
  "Puducherry",
  "Chandigarh",
];

const SMOKER_QUESTION = {
  id: "isSmoker",
  text: "Welcome to Navjivan – your personalized path to a healthier, stronger you. What's your aim?",
  options: ["Quit Smoking & Rebuild My Health", "Boost My Fitness"],
};

const HEALTH_QUESTIONS = [
  {
    id: "height",
    text: "What is your height?",
    options: [
      "Below 150 cm",
      "150-160 cm",
      "161-170 cm",
      "171-180 cm",
      "Above 180 cm",
    ],
  },
  {
    id: "weight",
    text: "What is your current weight?",
    options: [
      "Below 50 kg",
      "50-60 kg",
      "61-70 kg",
      "71-80 kg",
      "81-90 kg",
      "Above 90 kg",
    ],
  },
  {
    id: "workoutHours",
    text: "How many hours do you work out weekly?",
    options: [
      "0 hours (None)",
      "1-2 hours",
      "3-5 hours",
      "6-8 hours",
      "More than 8 hours",
    ],
  },
  {
    id: "diabetic",
    text: "Are you diabetic?",
    options: ["No", "Pre-diabetic", "Type 1 Diabetes", "Type 2 Diabetes"],
  },
  {
    id: "heartCondition",
    text: "Do you have any heart-related medical condition?",
    options: [
      "No",
      "Mild condition",
      "Moderate condition",
      "Severe condition",
      "Prefer not to say",
    ],
  },
  {
    id: "sleepHours",
    text: "How many hours do you sleep daily?",
    options: [
      "Less than 5 hours",
      "5-6 hours",
      "6-7 hours",
      "7-8 hours",
      "More than 8 hours",
    ],
  },
  {
    id: "bloodPressure",
    text: "What is your blood pressure condition?",
    options: [
      "Normal",
      "Low (Hypotension)",
      "High (Hypertension)",
      "Don't know",
    ],
  },
  {
    id: "state",
    text: "Which Indian state do you live in?",
    options: INDIAN_STATES,
  },
];

const SMOKING_QUESTIONS = [
  {
    id: "cigarettesPerDay",
    text: "How many cigarettes do you smoke per day?",
    options: ["1-5", "6-10", "11-20", "20+"],
  },
  {
    id: "firstCigarette",
    text: "How soon after waking do you smoke your first cigarette?",
    options: ["Within 5 mins", "6-30 mins", "31-60 mins", "After 60 mins"],
  },
  {
    id: "cravingStrength",
    text: "How strong are your cravings?",
    options: ["Weak", "Moderate", "Strong", "Unbearable"],
  },
  {
    id: "irritation",
    text: "Do you become irritated or restless without smoking?",
    options: ["No", "Slightly", "Very often", "Always"],
  },
  {
    id: "trigger",
    text: "What triggers your smoking the most?",
    options: ["Stress", "Boredom", "Social / Friends", "Habits (Meals/Coffee)"],
  },
  {
    id: "stressSmoking",
    text: "Do you smoke more when stressed or emotional?",
    options: ["No", "Sometimes", "Yes", "Always"],
  },
  {
    id: "quitAttempts",
    text: "Have you tried quitting before?",
    options: ["Never", "Once", "A few times", "Many times"],
  },
  {
    id: "motivation",
    text: "How motivated are you to quit? (Scale 1–10)",
    options: ["Low (1-3)", "Medium (4-6)", "High (7-8)", "Very High (9-10)"],
  },
  {
    id: "preferredApproach",
    text: "Do you want to quit immediately or slowly?",
    options: ["Immediately (Cold Turkey)", "Slowly (Gradual)", "Not sure"],
  },
  {
    id: "withdrawalSymptoms",
    text: "Do you experience withdrawal symptoms when reducing cigarettes?",
    options: ["None", "Mild", "Moderate", "Severe"],
  },
];

type QuestionPhase =
  | "smoker-check"
  | "health"
  | "smoking"
  | "analyzing"
  | "recommendation";

interface HealthData {
  height: string;
  weight: string;
  workoutHours: string;
  diabetic: string;
  heartCondition: string;
  sleepHours: string;
  bloodPressure: string;
  state: string;
}

interface SmokingData {
  cigarettesPerDay: string;
  firstCigarette: string;
  cravingStrength: string;
  irritation: string;
  trigger: string;
  stressSmoking: string;
  quitAttempts: string;
  motivation: string;
  preferredApproach: string;
  withdrawalSymptoms: string;
}

interface AIRecommendation {
  fitnessLevel: "beginner" | "intermediate" | "advanced";
  smokingPlan: "cold-turkey" | "gradual" | null;
  reasoning: string;
  goals: Array<{ text: string; icon: string }>;
}

interface SignupResponse {
  user: any;
  token: string;
}

export default function QuestionnaireScreen() {
  const {
    setPlan,
    setGoalsFromAI,
    setHealthData,
    setFitnessLevel,
    generateInitialGoals,
  } = useGoals();
  const auth: any = useContext(AuthContext);
  const params = useLocalSearchParams();

  const [phase, setPhase] = useState<QuestionPhase>("smoker-check");
  const [currentStep, setCurrentStep] = useState(0);
  const [healthAnswers, setHealthAnswers] = useState<Partial<HealthData>>({});
  const [smokingAnswers, setSmokingAnswers] = useState<Partial<SmokingData>>(
    {},
  );
  const [isSmoker, setIsSmoker] = useState<boolean | null>(null);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(
    null,
  );
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [signupData, setSignupData] = useState<any>(null);
  const [showStateSelector, setShowStateSelector] = useState(false);

  useEffect(() => {
    if (params.signupData) {
      try {
        const parsed = JSON.parse(params.signupData as string);
        setSignupData(parsed);
      } catch (e) {
        console.error("[Questionnaire] Failed to parse signupData:", e);
      }
    }
  }, [params.signupData]);

  const getCurrentQuestions = () => {
    if (phase === "smoker-check") return [SMOKER_QUESTION];
    if (phase === "health") return HEALTH_QUESTIONS;
    if (phase === "smoking") return SMOKING_QUESTIONS;
    return [];
  };

  const getTotalSteps = () => {
    if (phase === "smoker-check") return 1;
    if (phase === "health") return 1 + HEALTH_QUESTIONS.length;
    if (phase === "smoking") return 1 + SMOKING_QUESTIONS.length;
    return 1;
  };

  const getCurrentStepNumber = () => {
    if (phase === "smoker-check") return 1;
    if (phase === "health") return 1 + currentStep + 1;
    if (phase === "smoking") return 1 + currentStep + 1;
    return 1;
  };

  const progress = (getCurrentStepNumber() / getTotalSteps()) * 100;

  const handleSmokerAnswer = (answer: string) => {
    const userIsSmoker = answer === "Quit Smoking & Rebuild My Health";
    setIsSmoker(userIsSmoker);

    setCurrentStep(0);

    if (userIsSmoker) {
      setPhase("smoking");
    } else {
      setPhase("health");
    }
  };

  const handleHealthAnswer = (questionId: string, answer: string) => {
    const newAnswers = { ...healthAnswers, [questionId]: answer };
    setHealthAnswers(newAnswers);

    if (currentStep < HEALTH_QUESTIONS.length - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 250);
    } else {
      // Finished Health Questions - Submit All Data
      // If smoker, we have smokingAnswers. If not, pass null.
      analyzeAndRecommend(
        newAnswers as HealthData,
        isSmoker ? (smokingAnswers as SmokingData) : null,
      );
    }
  };

  const handleSmokingAnswer = (questionId: string, answer: string) => {
    const newAnswers = { ...smokingAnswers, [questionId]: answer };
    setSmokingAnswers(newAnswers);

    if (currentStep < SMOKING_QUESTIONS.length - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 250);
    } else {
      // Finished Smoking Questions -> Move to Health Questions
      setPhase("health");
      setCurrentStep(0);
    }
  };

  const analyzeAndRecommend = async (
    health: HealthData | null,
    smoking: SmokingData | null,
  ) => {
    setPhase("analyzing");

    try {
      const response = await API.post("/ai-coach/analyze-questionnaire", {
        healthData: health,
        smokingData: smoking,
      });

      setRecommendation(response.data);
      setPhase("recommendation");
    } catch (error) {
      console.error("Error analyzing questionnaire:", error);
      setRecommendation({
        fitnessLevel: "beginner",
        smokingPlan: smoking ? "gradual" : null,
        reasoning:
          "Based on your profile, we recommend starting with a beginner-friendly approach.",
        goals: [],
      });
      setPhase("recommendation");
    }
  };

  const handleAcceptRecommendation = async () => {
    if (!recommendation) return;

    const plan: PlanType = recommendation.smokingPlan || "gradual";

    if (signupData) {
      setIsCreatingAccount(true);
      try {
        const finalSignupData = {
          ...signupData,
          isSmoker: isSmoker,
          fitnessLevel: recommendation.fitnessLevel,
          plan: recommendation.smokingPlan || "none",
          healthData: healthAnswers,
          smokingData: smokingAnswers,
        };

        const res = await API.post<SignupResponse>(
          "/auth/signup",
          finalSignupData,
        );
        const { user, token } = res.data;

        await auth.loginUser(user, token);
        setPlan(plan);

        if (healthAnswers) {
          setHealthData(healthAnswers as any);
        }
        if (recommendation.fitnessLevel) {
          setFitnessLevel(recommendation.fitnessLevel);
        }

        console.log("[Questionnaire] Generating initial AI goals...");
        await generateInitialGoals();

        setTimeout(() => {
          if (user.isSmoker === false) {
            router.replace("/fitness");
          } else {
            router.replace("/(tabs)");
          }
        }, 100);
      } catch (err: any) {
        console.error(
          "[Questionnaire] Signup error:",
          err.response?.data || err.message,
        );
        setIsCreatingAccount(false);
        Alert.alert(
          "Signup Failed",
          err.response?.data?.message ||
            "Could not create your account. Please try again.",
          [
            { text: "Try Again", style: "cancel" },
            { text: "Go Back", onPress: () => router.replace("/auth/signup") },
          ],
        );
      }
    } else {
      setPlan(plan);

      if (healthAnswers) {
        setHealthData(healthAnswers as any);
      }
      if (recommendation.fitnessLevel) {
        setFitnessLevel(recommendation.fitnessLevel);
      }

      console.log(
        "[Questionnaire] Generating initial AI goals for existing user...",
      );
      await generateInitialGoals();
    }
  };

  const questions = getCurrentQuestions();
  const currentQuestion =
    phase === "smoker-check" ? SMOKER_QUESTION : questions[currentStep];
  const isStateQuestion = phase === "health" && currentQuestion?.id === "state";

  if (phase === "analyzing") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={LPColors.primary} />
          <Text style={styles.loadingTitle}>Analyzing Your Profile</Text>
          <Text style={styles.loadingSubtitle}>
            Our AI is creating personalized recommendations just for you...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === "recommendation" && recommendation) {
    const fitnessInfo = recommendation.fitnessLevel
      ? {
          beginner: {
            icon: "leaf-outline",
            color: "#4CAF50",
            title: "Beginner",
            description: "Start with light activities.",
          },
          intermediate: {
            icon: "fitness-outline",
            color: "#FF9800",
            title: "Intermediate",
            description: "Moderate workout plan.",
          },
          advanced: {
            icon: "barbell-outline",
            color: "#F44336",
            title: "Advanced",
            description: "Intense workout plan.",
          },
        }[recommendation.fitnessLevel]
      : null;

    const smokingInfo = recommendation.smokingPlan
      ? {
          "cold-turkey": {
            icon: "flash",
            color: "#FF3B30",
            title: "Cold Turkey",
            description: "Stop smoking completely.",
          },
          gradual: {
            icon: "trending-down",
            color: LPColors.primary,
            title: "Gradual Reduction",
            description: "Slowly reduce cigarettes.",
          },
        }[recommendation.smokingPlan]
      : null;

    return (
      <SafeAreaView style={styles.container}>
        {isCreatingAccount && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={LPColors.primary} />
            <Text style={styles.loadingText}>Creating your account...</Text>
          </View>
        )}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.recommendationTitle}>Your Personalized Plan</Text>
          <Text style={styles.recommendationSubtitle}>
            Based on your answers, here's what we recommend:
          </Text>

          {}
          {Object.keys(healthAnswers).length > 0 && fitnessInfo && (
            <View style={styles.recommendationCard}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: `${fitnessInfo.color}20` },
                ]}
              >
                <Ionicons
                  name={fitnessInfo.icon as any}
                  size={32}
                  color={fitnessInfo.color}
                />
              </View>
              <Text style={styles.cardLabel}>FITNESS LEVEL</Text>
              <Text style={styles.cardTitle}>{fitnessInfo.title}</Text>
              <Text style={styles.cardDesc}>{fitnessInfo.description}</Text>
            </View>
          )}

          {smokingInfo && (
            <View style={styles.recommendationCard}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: `${smokingInfo.color}20` },
                ]}
              >
                <Ionicons
                  name={smokingInfo.icon as any}
                  size={32}
                  color={smokingInfo.color}
                />
              </View>
              <Text style={styles.cardLabel}>QUIT SMOKING PLAN</Text>
              <Text style={styles.cardTitle}>{smokingInfo.title}</Text>
              <Text style={styles.cardDesc}>{smokingInfo.description}</Text>
            </View>
          )}

          {recommendation.goals && recommendation.goals.length > 0 && (
            <View style={styles.goalsSection}>
              <Text style={styles.goalsSectionTitle}>Your Daily Goals</Text>
              {recommendation.goals.map((goal, index) => (
                <View key={index} style={styles.goalItem}>
                  <View style={styles.goalIcon}>
                    <Ionicons
                      name={(goal.icon || "checkmark-circle") as any}
                      size={20}
                      color={LPColors.primary}
                    />
                  </View>
                  <Text style={styles.goalText}>{goal.text}</Text>
                </View>
              ))}
            </View>
          )}

          {recommendation.reasoning && (
            <View style={styles.reasoningBox}>
              <Ionicons
                name="bulb-outline"
                size={20}
                color={LPColors.primary}
              />
              <Text style={styles.reasoningText}>
                {recommendation.reasoning}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.acceptButton,
              isCreatingAccount && styles.buttonDisabled,
            ]}
            onPress={handleAcceptRecommendation}
            disabled={isCreatingAccount}
          >
            <Text style={styles.acceptButtonText}>
              {isCreatingAccount ? "Creating Account..." : "Accept & Continue"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              Alert.alert(
                "Cancel Signup?",
                "Your account will not be created. You'll be taken back to the login screen.",
                [
                  { text: "Continue Signup", style: "cancel" },
                  {
                    text: "Cancel",
                    style: "destructive",
                    onPress: () => router.replace("/auth/login"),
                  },
                ],
              );
            }}
            disabled={isCreatingAccount}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (showStateSelector) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setShowStateSelector(false)}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={28} color={LPColors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select State</Text>
          <View style={{ width: 44 }} />
        </View>
        <ScrollView style={styles.stateScrollView}>
          {INDIAN_STATES.map((state, index) => (
            <TouchableOpacity
              key={index}
              style={styles.stateOption}
              onPress={() => {
                setShowStateSelector(false);
                handleHealthAnswer("state", state);
              }}
            >
              <Text style={styles.stateOptionText}>{state}</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={LPColors.textGray}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const handleCancel = () => {
    Alert.alert(
      "Cancel Signup?",
      "Your account will not be created. You'll be taken back to the login screen.",
      [
        { text: "Continue Signup", style: "cancel" },
        {
          text: "Cancel",
          style: "destructive",
          onPress: () => router.replace("/auth/login"),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.backBtn}>
          <Ionicons name="close" size={28} color={LPColors.text} />
        </TouchableOpacity>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {getCurrentStepNumber()}/{getTotalSteps()}
        </Text>
      </View>

      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{currentQuestion?.text}</Text>

        {isStateQuestion ? (
          <TouchableOpacity
            style={styles.stateSelectButton}
            onPress={() => setShowStateSelector(true)}
          >
            <Text style={styles.stateSelectText}>
              {healthAnswers.state || "Tap to select your state"}
            </Text>
            <Ionicons name="chevron-down" size={24} color={LPColors.primary} />
          </TouchableOpacity>
        ) : (
          <ScrollView
            style={styles.optionsScrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.optionsContainer}>
              {currentQuestion?.options.map((option: string, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={styles.optionButton}
                  onPress={() => {
                    if (phase === "smoker-check") {
                      handleSmokerAnswer(option);
                    } else if (phase === "health") {
                      handleHealthAnswer(currentQuestion.id, option);
                    } else if (phase === "smoking") {
                      handleSmokingAnswer(currentQuestion.id, option);
                    }
                  }}
                >
                  <Text style={styles.optionText}>{option}</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={LPColors.textGray}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LPColors.bg,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: LPColors.text,
    textAlign: "center",
  },
  backBtn: {
    padding: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: LPColors.surfaceLight,
    borderRadius: 3,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: LPColors.primary,
    borderRadius: 3,
  },
  progressText: {
    color: LPColors.textGray,
    fontSize: 12,
    fontWeight: "600",
    minWidth: 40,
    textAlign: "right",
  },
  questionContainer: {
    flex: 1,
    padding: 24,
  },
  questionText: {
    fontSize: 26,
    fontWeight: "bold",
    color: LPColors.text,
    marginBottom: 30,
    lineHeight: 34,
  },
  optionsScrollView: {
    flex: 1,
  },
  optionsContainer: {
    gap: 12,
    paddingBottom: 20,
  },
  optionButton: {
    backgroundColor: LPColors.surface,
    padding: 18,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: LPColors.border,
  },
  optionText: {
    fontSize: 16,
    color: LPColors.text,
    fontWeight: "500",
    flex: 1,
  },
  stateSelectButton: {
    backgroundColor: LPColors.surface,
    padding: 20,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 2,
    borderColor: LPColors.primary,
    borderStyle: "dashed",
  },
  stateSelectText: {
    fontSize: 16,
    color: LPColors.text,
    fontWeight: "500",
  },
  stateScrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  stateOption: {
    backgroundColor: LPColors.surface,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: LPColors.border,
  },
  stateOptionText: {
    fontSize: 16,
    color: LPColors.text,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: LPColors.text,
    marginTop: 24,
    textAlign: "center",
  },
  loadingSubtitle: {
    fontSize: 16,
    color: LPColors.textGray,
    marginTop: 12,
    textAlign: "center",
    lineHeight: 22,
  },
  recommendationTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: LPColors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  recommendationSubtitle: {
    fontSize: 16,
    color: LPColors.textGray,
    textAlign: "center",
    marginBottom: 30,
  },
  recommendationCard: {
    backgroundColor: LPColors.surface,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: LPColors.border,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: LPColors.textGray,
    letterSpacing: 1,
    marginBottom: 4,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: LPColors.text,
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 14,
    color: LPColors.textGray,
    lineHeight: 20,
  },
  goalsSection: {
    backgroundColor: LPColors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: LPColors.border,
  },
  goalsSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: LPColors.text,
    marginBottom: 16,
  },
  goalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: LPColors.border,
  },
  goalIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${LPColors.primary}20`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  goalText: {
    fontSize: 15,
    color: LPColors.text,
    flex: 1,
  },
  reasoningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: `${LPColors.primary}15`,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  reasoningText: {
    flex: 1,
    fontSize: 14,
    color: LPColors.text,
    lineHeight: 20,
  },
  acceptButton: {
    backgroundColor: LPColors.primary,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  acceptButtonText: {
    color: "#000",
    fontSize: 17,
    fontWeight: "bold",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    zIndex: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: LPColors.text,
    fontSize: 16,
    marginTop: 16,
    fontWeight: "500",
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    color: LPColors.textGray,
    fontSize: 16,
    fontWeight: "500",
  },
});
