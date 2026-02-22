
import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    content: {
      type: String,
      default: "",
      trim: true,
    },

    images: [
      {
        public_id: { type: String },
        url: { type: String },
      },
    ],

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    likesCount: {
      type: Number,
      default: 0,
    },

    commentsCount: {
      type: Number,
      default: 0,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);


postSchema.set("toJSON", { virtuals: true, versionKey: false });
postSchema.set("toObject", { virtuals: true, versionKey: false });

export const Post = mongoose.model("Post", postSchema);
