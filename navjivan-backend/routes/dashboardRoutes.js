import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { getDashboardSummary, updateGoalProgress } from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/summary", authMiddleware, getDashboardSummary);
router.post("/update-goals", authMiddleware, updateGoalProgress);

export default router;
