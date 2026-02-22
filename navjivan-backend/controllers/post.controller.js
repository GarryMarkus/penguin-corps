
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";
import { Comment } from "../models/comment.model.js";
import { Post } from "../models/post.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";


export const createPost = async (req, res) => {
  try {
    const rawContent = req.body.content;
    const content = rawContent ? rawContent.trim() : "";
    const authorId = req.user?._id;

    if (!authorId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    if (!content && (!req.files || req.files.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "Post must contain text or images",
      });
    }

    const images = [];
    if (req.files && req.files.length) {
      for (const file of req.files) {
        const uploaded = await uploadToCloudinary(
          file.buffer,
          "navjivan-posts"
        );
        images.push({
          public_id: uploaded.public_id,
          url: uploaded.secure_url,
        });
      }
    }

    const post = await Post.create({
      author: authorId,
      content,
      images,
    });

    return res
      .status(201)
      .json({ success: true, message: "Post created", post });
  } catch (error) {
    console.error("CreatePost Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};


export const getFeed = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(50, parseInt(req.query.limit || "10", 10));
    const skip = (page - 1) * limit;

    const posts = await Post.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "name email")
      .lean();

    const userId = req.user?._id?.toString();

    const updated = posts.map((post) => ({
      ...post,
      isLiked: post.likes.some((id) => id.toString() === userId),
    }));

    return res.status(200).json({
      success: true,
      page,
      limit,
      posts: updated,
    });
  } catch (error) {
    console.error("GetFeed Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};


export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid post id" });

    const post = await Post.findOne({ _id: id, isDeleted: false })
      .populate("author", "name email")
      .lean();

    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    const userId = req.user?._id?.toString();

    return res.status(200).json({
      success: true,
      post: {
        ...post,
        isLiked: post.likes.some((x) => x.toString() === userId),
      },
    });
  } catch (error) {
    console.error("GetPost Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};


export const getUserPosts = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!mongoose.Types.ObjectId.isValid(userId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid user id" });

    const posts = await Post.find({ author: userId, isDeleted: false })
      .sort({ createdAt: -1 })
      .populate("author", "name email")
      .lean();

    const loggedInId = req.user?._id?.toString();

    const updated = posts.map((post) => ({
      ...post,
      isLiked: post.likes.some((id) => id.toString() === loggedInId),
    }));

    return res.status(200).json({
      success: true,
      posts: updated,
    });
  } catch (error) {
    console.error("GetUserPosts Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};


export const toggleLike = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user?._id;

    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    if (!mongoose.Types.ObjectId.isValid(postId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid post id" });

    const post = await Post.findOne({ _id: postId, isDeleted: false });
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    const hasLiked = post.likes.some((id) => id.equals(userId));

    if (hasLiked) {
      post.likes = post.likes.filter((id) => !id.equals(userId));
      post.likesCount = Math.max(0, post.likesCount - 1);
      await post.save();

      return res.status(200).json({
        success: true,
        message: "Post unliked",
        likesCount: post.likesCount,
      });
    } else {
      post.likes.push(userId);
      post.likesCount = post.likes.length;
      await post.save();

      return res.status(200).json({
        success: true,
        message: "Post liked",
        likesCount: post.likesCount,
      });
    }
  } catch (error) {
    console.error("ToggleLike Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};


export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user?._id;

    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    if (!mongoose.Types.ObjectId.isValid(postId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid post id" });

    const post = await Post.findById(postId);
    if (!post || post.isDeleted)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    if (!post.author.equals(userId)) {
      return res.status(403).json({
        success: false,
        message: "Not allowed to delete this post",
      });
    }


    if (post.images && post.images.length) {
      for (const img of post.images) {
        try {
          if (img.public_id) {
            await cloudinary.uploader.destroy(img.public_id);
          }
        } catch (err) {
          console.warn("Cloudinary destroy warning:", err);
        }
      }
    }


    await Comment.deleteMany({ post: post._id });
    await Post.deleteOne({ _id: post._id });

    return res
      .status(200)
      .json({ success: true, message: "Post deleted" });
  } catch (error) {
    console.error("DeletePost Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
