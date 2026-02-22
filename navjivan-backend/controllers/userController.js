import User from "../models/User.js";

export const updatePushToken = async (req, res) => {
  try {
    const { pushToken } = req.body;
    const userId = req.user.id; // From auth middleware

    if (!pushToken) {
      return res.status(400).json({ message: "Push token is required" });
    }

    const user = await User.findByIdAndUpdate(
      userId, 
      { pushToken },
      { new: true }
    );

    console.log(`[User] Push token updated for ${user.email}`);
    res.status(200).json({ success: true, message: "Token saved" });
  } catch (error) {
    console.error("Update push token error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Set app mode (solo or duo)
export const setAppMode = async (req, res) => {
  try {
    const { mode } = req.body;
    const userId = req.user.id;

    if (!mode || !["solo", "duo"].includes(mode)) {
      return res.status(400).json({ success: false, message: "Invalid mode. Must be 'solo' or 'duo'" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { appMode: mode },
      { new: true }
    );

    // Sanitize user object
    const safeUser = user.toObject();
    delete safeUser.passwordHash;

    console.log(`[User] App mode set to ${mode} for ${user.email}`);
    res.json({ success: true, user: safeUser });
  } catch (error) {
    console.error("[User] setAppMode error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update smoker status
export const updateSmokerStatus = async (req, res) => {
  try {
    const { isSmoker } = req.body;
    const userId = req.user.id;

    if (typeof isSmoker !== 'boolean') {
      return res.status(400).json({ success: false, message: "isSmoker must be a boolean" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isSmoker },
      { new: true }
    );

    const safeUser = user.toObject();
    delete safeUser.passwordHash;

    console.log(`[User] Smoker status updated to ${isSmoker} for ${user.email}`);
    res.json({ success: true, user: safeUser });
  } catch (error) {
    console.error("[User] updateSmokerStatus error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update questionnaire data
export const updateQuestionnaire = async (req, res) => {
  try {
    const { isSmoker, fitnessLevel, plan, healthData, smokingData } = req.body;
    const userId = req.user.id;

    const updateData = {};
    if (typeof isSmoker === 'boolean') updateData.isSmoker = isSmoker;
    if (fitnessLevel) updateData.fitnessLevel = fitnessLevel;
    if (plan) updateData.plan = plan;
    if (healthData) updateData.healthData = healthData;
    if (smokingData) updateData.smokingData = smokingData;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );

    const safeUser = user.toObject();
    delete safeUser.passwordHash;

    console.log(`[User] Questionnaire data updated for ${user.email}`);
    res.json({ success: true, user: safeUser });
  } catch (error) {
    console.error("[User] updateQuestionnaire error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
