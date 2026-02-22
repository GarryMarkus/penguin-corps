import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createDuo,
  joinDuo,
  getDuoStatus,
  updateStats,
  logSmoke,
  sendEncouragement,
  leaveDuo,
} from "../controllers/duoController.js";

const router = express.Router();

router.post("/create", protect, createDuo);
router.post("/join", protect, joinDuo);
router.get("/status", protect, getDuoStatus);
router.post("/update-stats", protect, updateStats);
router.post("/log-smoke", protect, logSmoke);
router.post("/encourage", protect, sendEncouragement);
router.post("/leave", protect, leaveDuo);

export default router;
