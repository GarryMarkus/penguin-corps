import express from "express";
import { updatePushToken } from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.put("/push-token", protect, updatePushToken);

export default router;
