import express from "express";
import { clearUserGoals, getGoalStats, trackBatchGoals, trackGoal } from "../controllers/goalController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Track a single goal
router.post("/track", authMiddleware, trackGoal);

// Track multiple goals at once
router.post("/track-batch", authMiddleware, trackBatchGoals);

// Get user's goal statistics
router.get("/stats", authMiddleware, getGoalStats);

// Clear all user goals (for testing/privacy)
router.delete("/clear", authMiddleware, clearUserGoals);

export default router;
