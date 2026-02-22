import mongoose from "mongoose";

const duoSchema = new mongoose.Schema(
  {
    userA: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userB: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    inviteCode: { type: String, unique: true, required: true },
    status: { type: String, enum: ["pending", "active", "ended"], default: "pending" },

    sharedPlant: {
      waterA: { type: Number, default: 0 },
      waterB: { type: Number, default: 0 },
      mealsA: { type: Number, default: 0 },
      mealsB: { type: Number, default: 0 },
      goalsCompletedA: { type: Number, default: 0 },
      goalsCompletedB: { type: Number, default: 0 },
      goalsTotalA: { type: Number, default: 0 },
      goalsTotalB: { type: Number, default: 0 },
      smokesA: { type: Number, default: 0 },
      smokesB: { type: Number, default: 0 },
      stepsA: { type: Number, default: 0 },
      stepsB: { type: Number, default: 0 },
      caloriesA: { type: Number, default: 0 },
      caloriesB: { type: Number, default: 0 },
      lastResetDate: { type: String, default: null },
    },
  },
  { timestamps: true }
);

// Generate a 6-char alphanumeric invite code
duoSchema.statics.generateInviteCode = function () {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing chars (0/O, 1/I)
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Calculate shared plant stage (0-4)
duoSchema.methods.getPlantStage = function () {
  const p = this.sharedPlant;
  const totalWater = (p.waterA || 0) + (p.waterB || 0);
  const totalMeals = (p.mealsA || 0) + (p.mealsB || 0);
  const totalGoalsDone = (p.goalsCompletedA || 0) + (p.goalsCompletedB || 0);
  const totalGoalsAll = (p.goalsTotalA || 0) + (p.goalsTotalB || 0);
  const totalSmokes = (p.smokesA || 0) + (p.smokesB || 0);

  let score = 0;
  score += Math.min(totalWater, 16) * 2;    // max 32 (both drink 8)
  score += Math.min(totalMeals, 6) * 5;     // max 30 (both eat 3)
  if (totalGoalsAll > 0) score += (totalGoalsDone / totalGoalsAll) * 25; // max 25
  score -= totalSmokes * 10;
  score = Math.max(0, Math.min(100, score));

  if (score >= 70) return 4;
  if (score >= 45) return 3;
  if (score >= 25) return 2;
  if (score >= 10) return 1;
  return 0;
};

// Auto-reset daily stats
duoSchema.methods.resetIfNewDay = function () {
  const today = new Date().toISOString().split("T")[0];
  if (this.sharedPlant.lastResetDate !== today) {
    this.sharedPlant.waterA = 0;
    this.sharedPlant.waterB = 0;
    this.sharedPlant.mealsA = 0;
    this.sharedPlant.mealsB = 0;
    this.sharedPlant.goalsCompletedA = 0;
    this.sharedPlant.goalsCompletedB = 0;
    this.sharedPlant.goalsTotalA = 0;
    this.sharedPlant.goalsTotalB = 0;
    this.sharedPlant.smokesA = 0;
    this.sharedPlant.smokesB = 0;
    this.sharedPlant.stepsA = 0;
    this.sharedPlant.stepsB = 0;
    this.sharedPlant.caloriesA = 0;
    this.sharedPlant.caloriesB = 0;
    this.sharedPlant.lastResetDate = today;
    return true;
  }
  return false;
};

export default mongoose.model("Duo", duoSchema);
