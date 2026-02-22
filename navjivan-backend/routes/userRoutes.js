import express from "express";
import { updatePushToken, setAppMode, updateSmokerStatus, updateQuestionnaire } from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.put("/push-token", protect, updatePushToken);
router.post("/set-mode", protect, setAppMode);
router.post("/update-smoker-status", protect, updateSmokerStatus);
router.post("/update-questionnaire", protect, updateQuestionnaire);

export default router;
