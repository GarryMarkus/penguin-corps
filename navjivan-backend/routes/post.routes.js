
import express from "express";
import {
  createPost,
  getFeed,
  getPostById,
  getUserPosts,
  toggleLike,
  deletePost,
} from "../controllers/post.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();


router.post("/", authMiddleware, upload.array("images", 5), createPost);


router.get("/feed", authMiddleware, getFeed);


router.get("/:id", authMiddleware, getPostById);


router.get("/user/:userId", authMiddleware, getUserPosts);


router.post("/:id/like", authMiddleware, toggleLike);


router.delete("/:id", authMiddleware, deletePost);

export default router;