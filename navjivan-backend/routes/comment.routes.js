import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  createComment,
  getComments,
  deleteComment,
} from "../controllers/comment.controller.js";

const router = express.Router();


router.post("/:postId", authMiddleware, createComment);


router.get("/:postId", authMiddleware, getComments);


router.delete("/delete/:commentId", authMiddleware, deleteComment);

export default router;
