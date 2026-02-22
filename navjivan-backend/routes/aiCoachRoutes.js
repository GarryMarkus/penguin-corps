import express from "express";
import { analyzeFood, analyzeQuestionnaire, chatWithCoach, generateAgenticGoals, generateGoals, generatePantryRecipes, generateSportsTraining, suggestSmartMeal, verifyWaterImage } from "../controllers/aiCoachController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/chat", authMiddleware, chatWithCoach);

router.post("/analyze-food", authMiddleware, analyzeFood);

router.post("/suggest-smart-meal", authMiddleware, suggestSmartMeal);

router.post("/pantry-recipes", authMiddleware, generatePantryRecipes);

router.post("/analyze-questionnaire", analyzeQuestionnaire);

router.post("/generate-goals", generateGoals);

router.post("/generate-agentic-goals", authMiddleware, generateAgenticGoals);

router.post("/generate-training", generateSportsTraining);

router.post("/verify-water", authMiddleware, verifyWaterImage);

router.post("/test-chat", chatWithCoach);

export default router;
