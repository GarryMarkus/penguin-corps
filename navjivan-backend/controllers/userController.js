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
