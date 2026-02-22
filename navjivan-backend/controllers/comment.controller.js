import { Comment } from "../models/comment.model.js";
import { Post } from "../models/post.model.js";
import mongoose from "mongoose";


export const createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0)
      return res.status(400).json({ success: false, message: "Comment cannot be empty" });

    if (!mongoose.Types.ObjectId.isValid(postId))
      return res.status(400).json({ success: false, message: "Invalid post id" });

    const post = await Post.findById(postId);
    if (!post || post.isDeleted)
      return res.status(404).json({ success: false, message: "Post not found" });

    const comment = await Comment.create({
      post: postId,
      author: req.user._id,
      content,
    });


    post.commentsCount += 1;
    await post.save();

    return res.status(201).json({ success: true, comment });
  } catch (error) {
    console.error("CreateComment Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


export const getComments = async (req, res) => {
  try {
    const { postId } = req.params;

    const comments = await Comment.find({ post: postId, isDeleted: false })
      .populate("author", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, comments });
  } catch (error) {
    console.error("GetComments Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment || comment.isDeleted)
      return res.status(404).json({ success: false, message: "Comment not found" });

    if (!comment.author.equals(req.user._id))
      return res.status(403).json({ success: false, message: "Not allowed" });

    await Comment.deleteOne({ _id: commentId });


    await Post.updateOne(
      { _id: comment.post },
      { $inc: { commentsCount: -1 } }
    );

    res.status(200).json({ success: true, message: "Comment deleted" });
  } catch (error) {
    console.error("DeleteComment Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
