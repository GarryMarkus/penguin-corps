import express from "express";
import { analyzeFood, analyzeQuestionnaire, chatWithCoach, generateAgenticGoals, generateGoals, generateSportsTraining, suggestSmartMeal } from "../controllers/aiCoachController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/chat", authMiddleware, chatWithCoach);

router.post("/analyze-food", authMiddleware, analyzeFood);

router.post("/suggest-smart-meal", authMiddleware, suggestSmartMeal);

router.post("/analyze-questionnaire", analyzeQuestionnaire);

router.post("/generate-goals", generateGoals);

router.post("/generate-agentic-goals", authMiddleware, generateAgenticGoals);

router.post("/generate-training", generateSportsTraining);

router.post("/test-chat", chatWithCoach);

export default router;
