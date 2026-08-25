// ─────────────────────────────────────────────────────────────
// COPY TO: backend/src/models/Post.js
// ─────────────────────────────────────────────────────────────
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    // userId is taken from the JWT (req.user.id) — never trusted from the body
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    caption: {
      type: String,
      trim: true,
      maxlength: [2200, "Caption cannot exceed 2200 characters"],
      default: "",
    },

    visibility: {
      type: String,
      enum: ["public", "friends", "private"],
      default: "public",
    },

    // tags stored as array of strings e.g. ["nodejs", "react"]
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 30,
        message: "Maximum 30 tags allowed",
      },
    },

    type: {
      type: String,
      enum: ["text", "image", "video", "link", "repost"],
      default: "text",
    },

    // Engagement counters — always updated server-side, never from the form
    likesCount:    { type: Number, default: 0, min: 0 },
    commentsCount: { type: Number, default: 0, min: 0 },
    shareCount:    { type: Number, default: 0, min: 0 },
    repostCount:   { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true, // adds createdAt + updatedAt automatically
  }
);

// Index for fast "get all posts by user" queries
postSchema.index({ userId: 1, createdAt: -1 });
// Index for public feed sorted by newest
postSchema.index({ visibility: 1, createdAt: -1 });

module.exports = mongoose.model("Post", postSchema);
