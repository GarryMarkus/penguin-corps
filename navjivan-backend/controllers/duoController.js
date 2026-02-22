import Duo from "../models/Duo.js";
import User from "../models/User.js";
import { sendPushNotification } from "../services/pushNotificationService.js";

// Create a new Duo and generate invite code
export const createDuo = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user is already in a duo
    const existingUser = await User.findById(userId);
    if (existingUser.duoId) {
      const existingDuo = await Duo.findById(existingUser.duoId);
      if (existingDuo && existingDuo.status === "active") {
        return res.status(400).json({ success: false, message: "You are already in an active Duo." });
      }
      if (existingDuo && existingDuo.status === "pending") {
        // Return existing pending invite code
        return res.json({ success: true, inviteCode: existingDuo.inviteCode, status: "pending", duoId: existingDuo._id });
      }
    }

    // Generate unique invite code
    let inviteCode;
    let isUnique = false;
    while (!isUnique) {
      inviteCode = Duo.generateInviteCode();
      const existing = await Duo.findOne({ inviteCode });
      if (!existing) isUnique = true;
    }

    const duo = await Duo.create({ userA: userId, inviteCode });
    existingUser.duoId = duo._id;
    await existingUser.save();

    console.log(`[Duo] Created: ${inviteCode} by ${existingUser.name}`);
    res.status(201).json({ success: true, inviteCode, duoId: duo._id, status: "pending" });
  } catch (error) {
    console.error("[Duo] Create error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Join a Duo using an invite code
export const joinDuo = async (req, res) => {
  try {
    const userId = req.user.id;
    const { inviteCode } = req.body;

    if (!inviteCode || inviteCode.length !== 6) {
      return res.status(400).json({ success: false, message: "Invalid invite code." });
    }

    const joiningUser = await User.findById(userId);
    if (joiningUser.duoId) {
      const existingDuo = await Duo.findById(joiningUser.duoId);
      if (existingDuo && existingDuo.status === "active") {
        return res.status(400).json({ success: false, message: "You are already in an active Duo. Leave first." });
      }
    }

    const duo = await Duo.findOne({ inviteCode: inviteCode.toUpperCase(), status: "pending" });
    if (!duo) {
      return res.status(404).json({ success: false, message: "Invalid or expired invite code." });
    }

    if (duo.userA.toString() === userId) {
      return res.status(400).json({ success: false, message: "You cannot join your own Duo." });
    }

    // Activate the duo
    duo.userB = userId;
    duo.status = "active";
    duo.sharedPlant.lastResetDate = new Date().toISOString().split("T")[0];
    await duo.save();

    joiningUser.duoId = duo._id;
    await joiningUser.save();

    // Notify partner A
    const partnerA = await User.findById(duo.userA);
    if (partnerA?.pushToken) {
      await sendPushNotification(
        partnerA.pushToken,
        "🤝 Duo Activated!",
        `${joiningUser.name} joined your Duo! Your shared plant is ready to grow.`,
        { type: "duo_joined" }
      );
    }

    console.log(`[Duo] ${joiningUser.name} joined ${partnerA.name}'s Duo (${inviteCode})`);
    res.json({
      success: true,
      message: "Duo activated!",
      duoId: duo._id,
      partner: { name: partnerA.name, isSmoker: partnerA.isSmoker },
    });
  } catch (error) {
    console.error("[Duo] Join error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get full Duo status + partner info
export const getDuoStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user.duoId) {
      return res.json({ success: true, hasDuo: false });
    }

    const duo = await Duo.findById(user.duoId)
      .populate("userA", "name email isSmoker streak")
      .populate("userB", "name email isSmoker streak");

    if (!duo || duo.status === "ended") {
      return res.json({ success: true, hasDuo: false });
    }

    // Auto-reset daily stats
    if (duo.resetIfNewDay()) {
      await duo.save();
    }

    const isUserA = duo.userA?._id.toString() === userId;
    const partner = isUserA ? duo.userB : duo.userA;
    const myRole = isUserA ? "A" : "B";

    res.json({
      success: true,
      hasDuo: true,
      status: duo.status,
      inviteCode: duo.inviteCode,
      myRole,
      partner: partner
        ? { name: partner.name, isSmoker: partner.isSmoker, streak: partner.streak }
        : null,
      sharedPlant: duo.sharedPlant,
      plantStage: duo.getPlantStage(),
    });
  } catch (error) {
    console.error("[Duo] Status error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update stats for the calling user's side
export const updateStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { water, meals, goalsCompleted, goalsTotal, smokes, steps, calories } = req.body;

    const user = await User.findById(userId);
    if (!user.duoId) {
      return res.status(400).json({ success: false, message: "Not in a Duo." });
    }

    const duo = await Duo.findById(user.duoId);
    if (!duo || duo.status !== "active") {
      return res.status(400).json({ success: false, message: "Duo is not active." });
    }

    duo.resetIfNewDay();

    const isUserA = duo.userA.toString() === userId;
    const suffix = isUserA ? "A" : "B";

    if (water !== undefined) duo.sharedPlant[`water${suffix}`] = water;
    if (meals !== undefined) duo.sharedPlant[`meals${suffix}`] = meals;
    if (goalsCompleted !== undefined) duo.sharedPlant[`goalsCompleted${suffix}`] = goalsCompleted;
    if (goalsTotal !== undefined) duo.sharedPlant[`goalsTotal${suffix}`] = goalsTotal;
    if (smokes !== undefined) duo.sharedPlant[`smokes${suffix}`] = smokes;
    if (steps !== undefined) duo.sharedPlant[`steps${suffix}`] = steps;
    if (calories !== undefined) duo.sharedPlant[`calories${suffix}`] = calories;

    await duo.save();

    res.json({
      success: true,
      sharedPlant: duo.sharedPlant,
      plantStage: duo.getPlantStage(),
    });
  } catch (error) {
    console.error("[Duo] Update stats error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Log smoke and notify partner
export const logSmoke = async (req, res) => {
  try {
    const userId = req.user.id;
    const { count = 1 } = req.body;

    const user = await User.findById(userId);
    if (!user.duoId) {
      return res.status(400).json({ success: false, message: "Not in a Duo." });
    }

    const duo = await Duo.findById(user.duoId).populate("userA", "name pushToken").populate("userB", "name pushToken");
    if (!duo || duo.status !== "active") {
      return res.status(400).json({ success: false, message: "Duo not active." });
    }

    duo.resetIfNewDay();

    const isUserA = duo.userA._id.toString() === userId;
    const suffix = isUserA ? "A" : "B";
    duo.sharedPlant[`smokes${suffix}`] = (duo.sharedPlant[`smokes${suffix}`] || 0) + count;
    await duo.save();

    // Notify partner
    const partner = isUserA ? duo.userB : duo.userA;
    const smokerName = isUserA ? duo.userA.name : duo.userB.name;

    if (partner?.pushToken) {
      const totalSmokes = duo.sharedPlant[`smokes${suffix}`];
      await sendPushNotification(
        partner.pushToken,
        "🚬 Smoke Alert",
        `${smokerName} smoked (${totalSmokes} today). Your shared plant is hurting. Send support!`,
        { type: "duo_smoke_alert", smokes: totalSmokes }
      );
    }

    console.log(`[Duo] Smoke logged: ${smokerName} +${count} (total: ${duo.sharedPlant[`smokes${suffix}`]})`);
    res.json({
      success: true,
      sharedPlant: duo.sharedPlant,
      plantStage: duo.getPlantStage(),
    });
  } catch (error) {
    console.error("[Duo] Log smoke error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Send encouragement to partner
export const sendEncouragement = async (req, res) => {
  try {
    const userId = req.user.id;
    const { message } = req.body;

    const user = await User.findById(userId);
    if (!user.duoId) return res.status(400).json({ success: false, message: "Not in a Duo." });

    const duo = await Duo.findById(user.duoId).populate("userA", "name pushToken").populate("userB", "name pushToken");
    if (!duo || duo.status !== "active") return res.status(400).json({ success: false, message: "Duo not active." });

    const isUserA = duo.userA._id.toString() === userId;
    const partner = isUserA ? duo.userB : duo.userA;
    const senderName = isUserA ? duo.userA.name : duo.userB.name;

    if (partner?.pushToken) {
      await sendPushNotification(
        partner.pushToken,
        `💪 ${senderName} says:`,
        message || "You got this! Keep going! 🌱",
        { type: "duo_encouragement" }
      );
    }

    res.json({ success: true, message: "Encouragement sent!" });
  } catch (error) {
    console.error("[Duo] Encouragement error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Leave Duo
export const leaveDuo = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user.duoId) return res.status(400).json({ success: false, message: "Not in a Duo." });

    const duo = await Duo.findById(user.duoId).populate("userA", "name pushToken").populate("userB", "name pushToken");
    if (!duo) return res.status(404).json({ success: false, message: "Duo not found." });

    // Notify partner
    const isUserA = duo.userA?._id.toString() === userId;
    const partner = isUserA ? duo.userB : duo.userA;
    const leaverName = user.name;

    if (partner?.pushToken) {
      await sendPushNotification(partner.pushToken, "😢 Duo Ended", `${leaverName} left the Duo.`, { type: "duo_left" });
    }

    // Clear both users
    duo.status = "ended";
    await duo.save();

    user.duoId = null;
    await user.save();

    if (partner) {
      await User.findByIdAndUpdate(partner._id, { duoId: null });
    }

    console.log(`[Duo] ${leaverName} left duo ${duo.inviteCode}`);
    res.json({ success: true, message: "Duo ended." });
  } catch (error) {
    console.error("[Duo] Leave error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get detailed partner dashboard info
export const getPartnerDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user.duoId) {
      return res.json({ success: true, hasDuo: false });
    }

    const duo = await Duo.findById(user.duoId)
      .populate("userA", "name email isSmoker streak profileImage")
      .populate("userB", "name email isSmoker streak profileImage");

    if (!duo || duo.status !== "active") {
      return res.json({ success: true, hasDuo: false });
    }

    // Auto-reset daily stats
    if (duo.resetIfNewDay()) {
      await duo.save();
    }

    const isUserA = duo.userA?._id.toString() === userId;
    const partner = isUserA ? duo.userB : duo.userA;
    const partnerSuffix = isUserA ? "B" : "A";
    const mySuffix = isUserA ? "A" : "B";

    if (!partner) {
      return res.json({ success: true, hasDuo: true, status: "pending", partner: null });
    }

    // Extract partner's stats from sharedPlant
    const partnerStats = {
      water: duo.sharedPlant[`water${partnerSuffix}`] || 0,
      meals: duo.sharedPlant[`meals${partnerSuffix}`] || 0,
      goalsCompleted: duo.sharedPlant[`goalsCompleted${partnerSuffix}`] || 0,
      goalsTotal: duo.sharedPlant[`goalsTotal${partnerSuffix}`] || 0,
      smokes: duo.sharedPlant[`smokes${partnerSuffix}`] || 0,
      steps: duo.sharedPlant[`steps${partnerSuffix}`] || 0,
      calories: duo.sharedPlant[`calories${partnerSuffix}`] || 0,
    };

    // My stats
    const myStats = {
      water: duo.sharedPlant[`water${mySuffix}`] || 0,
      meals: duo.sharedPlant[`meals${mySuffix}`] || 0,
      goalsCompleted: duo.sharedPlant[`goalsCompleted${mySuffix}`] || 0,
      goalsTotal: duo.sharedPlant[`goalsTotal${mySuffix}`] || 0,
      smokes: duo.sharedPlant[`smokes${mySuffix}`] || 0,
      steps: duo.sharedPlant[`steps${mySuffix}`] || 0,
      calories: duo.sharedPlant[`calories${mySuffix}`] || 0,
    };

    res.json({
      success: true,
      hasDuo: true,
      status: duo.status,
      partner: {
        name: partner.name,
        email: partner.email,
        isSmoker: partner.isSmoker,
        streak: partner.streak,
        profileImage: partner.profileImage,
        stats: partnerStats,
      },
      myStats,
      plantStage: duo.getPlantStage(),
      sharedPlant: duo.sharedPlant,
    });
  } catch (error) {
    console.error("[Duo] Partner dashboard error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Log water/meal/smoke for partner (support feature)
export const logForPartner = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, value } = req.body; // type: "water" | "meal" | "smoke", value: number

    if (!["water", "meal", "smoke"].includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid type. Must be water, meal, or smoke." });
    }

    const user = await User.findById(userId);
    if (!user.duoId) {
      return res.status(400).json({ success: false, message: "Not in a Duo." });
    }

    const duo = await Duo.findById(user.duoId)
      .populate("userA", "name pushToken")
      .populate("userB", "name pushToken");

    if (!duo || duo.status !== "active") {
      return res.status(400).json({ success: false, message: "Duo not active." });
    }

    duo.resetIfNewDay();

    const isUserA = duo.userA._id.toString() === userId;
    const partnerSuffix = isUserA ? "B" : "A";
    const partner = isUserA ? duo.userB : duo.userA;
    const loggerName = user.name;

    const amount = value || 1;

    // Update partner's stats
    switch (type) {
      case "water":
        duo.sharedPlant[`water${partnerSuffix}`] = (duo.sharedPlant[`water${partnerSuffix}`] || 0) + amount;
        break;
      case "meal":
        duo.sharedPlant[`meals${partnerSuffix}`] = (duo.sharedPlant[`meals${partnerSuffix}`] || 0) + amount;
        break;
      case "smoke":
        duo.sharedPlant[`smokes${partnerSuffix}`] = (duo.sharedPlant[`smokes${partnerSuffix}`] || 0) + amount;
        break;
    }

    await duo.save();

    // Notify partner
    if (partner?.pushToken) {
      const messages = {
        water: `💧 ${loggerName} logged water for you! Stay hydrated! 🌱`,
        meal: `🍽️ ${loggerName} logged a meal for you! Great nutrition! 🌱`,
        smoke: `🚬 ${loggerName} logged a smoke for you. Your plant is hurting. 😔`,
      };
      await sendPushNotification(
        partner.pushToken,
        type === "smoke" ? "🚬 Smoke Logged" : "📝 Activity Logged",
        messages[type],
        { type: "duo_partner_log", logType: type }
      );
    }

    console.log(`[Duo] ${loggerName} logged ${type} for partner ${partner.name}`);
    res.json({
      success: true,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} logged for partner!`,
      sharedPlant: duo.sharedPlant,
      plantStage: duo.getPlantStage(),
    });
  } catch (error) {
    console.error("[Duo] Log for partner error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
