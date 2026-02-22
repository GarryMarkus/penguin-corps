import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";


const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

const sanitizeUser = (user) => {
  const obj = user.toObject();
  delete obj.passwordHash;
  return obj;
};

export const signup = async (req, res) => {
  try {
    const { name, email, password, age, height, weight, plan, isSmoker, smokingData, healthData, appMode } = req.body;


    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
      age: age ? Number(age) : undefined,
      heightCm: height ? Number(height) : undefined,
      weightKg: weight ? Number(weight) : undefined,
      plan: plan === "aggressive" ? "aggressive" : plan === "gradual" ? "gradual" : "none",
      isSmoker: isSmoker === true || isSmoker === "true",
      smokingData,
      healthData,
      appMode: appMode || null
    });

    const token = createToken(user._id);
    const safeUser = sanitizeUser(user);

    return res.status(201).json({ token, user: safeUser });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ message: "Server error during signup" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = createToken(user._id);
    const safeUser = sanitizeUser(user);

    return res.status(200).json({ token, user: safeUser });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error during login" });
  }
  
};
