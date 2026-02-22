import mongoose from "mongoose";

const dailyStatsSchema = new mongoose.Schema({
  date: { type: String, required: true },
  cigarettesAvoided: { type: Number, default: 0 },
  moneySaved: { type: Number, default: 0 },
  goalsCompleted: { type: Number, default: 0 },
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },

    age: { type: Number },
    heightCm: { type: Number },
    weightKg: { type: Number },

    isSmoker: { type: Boolean, default: true },

    plan: { type: String, enum: ["gradual", "aggressive", "none"], default: "none" },

    streak: { type: Number, default: 0 },
    lastStreakUpdateDate: { type: String, default: null },

    puffCoins: { type: Number, default: 0 },
    totalRelapses: { type: Number, default: 0 },
    
    // Flexible objects for questionnaire data
    smokingData: { type: Object, default: {} },
    healthData: { type: Object, default: {} },
    
    pushToken: { type: String, default: null },

    // Duo Mode
    duoId: { type: mongoose.Schema.Types.ObjectId, ref: "Duo", default: null },

    dailyStats: [dailyStatsSchema],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);