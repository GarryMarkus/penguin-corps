import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { router } from "expo-router";
import React, { useState } from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from "react-native-safe-area-context";
import { LPColors } from "../constants/theme";
import { useGoals } from "../context/GoalsContext";


const compulsoryGoalsList = [
  { icon: "ban-outline", text: "Take 10,000 steps" },
  { icon: "water-outline", text: "Drink 3 glasses of water" },
  { icon: "flash-outline", text: "10 min breathing exercise" },
  { icon: "wallet-outline", text: "Do 10 pushups" },
  { icon: "walk-outline", text: "Walk 10 minutes" },
];


const suggestedGoalsList = [
  { icon: "game-controller-outline", text: "Play 1 focus game" },
  { icon: "bed-outline", text: "Sleep 7 hours" },
  { icon: "heart-outline", text: "Avoid sugar cravings" },
  { icon: "barbell-outline", text: "Exercise 15 minutes" },
];

export default function GoalsScreen() {
  const { goals, addGoal, deleteGoal } = useGoals();
  const [modalVisible, setModalVisible] = useState(false);
  const [customGoal, setCustomGoal] = useState("");

  const handleAddGoal = (goalData: { icon: string; text: string }) => {
    addGoal({ ...goalData, completed: false, isCustom: true });
    setModalVisible(false);
    setCustomGoal("");
  };

  return (
    <LinearGradient
      colors={[LPColors.bg, '#000000']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={LPColors.primary} />
        </TouchableOpacity>

        <Text style={styles.title}>Goals</Text>
        <Text style={styles.subtitle}>Daily and Weekly targets to stay on track</Text>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily Goals</Text>

          {}
          {goals.map((goal) => (
            <View key={goal.id} style={styles.goalItem}>
              <Ionicons name={(goal.icon || "create-outline") as any} size={22} color={LPColors.primary} />
              <Text style={[styles.goalText, goal.completed && { textDecorationLine: 'line-through', opacity: 0.6 }]}>
                {goal.text}
              </Text>
              {goal.completed && (
                <Ionicons name="checkmark-circle" size={20} color={LPColors.primary} style={{ marginLeft: 'auto' }} />
              )}
              {goal.isCustom && !goal.completed && (
                <TouchableOpacity onPress={() => deleteGoal(goal.id)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={20} color="#ff3b30" />
                </TouchableOpacity>
              )}
            </View>
          ))}

          {}
          <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.addButtonText}>Add Daily Goal</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Goal</Text>

            {}
            {suggestedGoalsList.map((goal, index) => (
              <TouchableOpacity
                key={index}
                style={styles.modalGoalItem}
                onPress={() => handleAddGoal(goal)}
              >
                <Ionicons name={goal.icon as any} size={22} color={LPColors.primary} />
                <Text style={styles.modalGoalText}>{goal.text}</Text>
              </TouchableOpacity>
            ))}

            {}
            <TextInput
              placeholder="Write your goal..."
              placeholderTextColor="#666"
              style={styles.input}
              value={customGoal}
              onChangeText={setCustomGoal}
            />

            <TouchableOpacity
              style={[styles.addButton, { marginTop: 10 }]}
              onPress={() =>
                customGoal.trim() && handleAddGoal({ icon: "create-outline", text: customGoal })
              }
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>

            {}
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LPColors.bg, paddingHorizontal: 20 },
  backBtn: { marginTop: 10, marginBottom: 10, width: 40 },
  title: { color: LPColors.primary, fontSize: 32, fontWeight: "bold", marginBottom: 6 },
  subtitle: { color: LPColors.text, fontSize: 14, marginBottom: 20 },
  scrollContent: { paddingBottom: 80 },

  card: { backgroundColor: LPColors.surface, borderRadius: 16, padding: 16, marginBottom: 20 },
  cardTitle: { fontSize: 20, fontWeight: "bold", color: LPColors.text, marginBottom: 16 },

  goalItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LPColors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  goalText: { flex: 1, fontSize: 16, color: LPColors.text, marginLeft: 12 },
  deleteBtn: { padding: 4 },

  addButton: {
    backgroundColor: LPColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 16,
    alignItems: "center",
  },
  addButtonText: { color: "#000", fontWeight: "600" },

  modalContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: LPColors.surface,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: { fontSize: 22, color: LPColors.text, fontWeight: "bold", marginBottom: 16 },
  modalGoalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  modalGoalText: { color: LPColors.text, fontSize: 16, marginLeft: 10 },
  input: {
    backgroundColor: LPColors.surfaceLight,
    color: LPColors.text,
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  cancelBtn: { marginTop: 10, alignItems: "center" },
  cancelText: { color: "#ff3b30", fontSize: 16 },
});
