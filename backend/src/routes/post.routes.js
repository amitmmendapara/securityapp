// ─────────────────────────────────────────────────────────────
// COPY TO: backend/src/routes/post.routes.js
// ─────────────────────────────────────────────────────────────
//
// Endpoints:
//   POST   /api/posts          → create a post          (auth required)
//   GET    /api/posts          → list public posts       (public)
//   GET    /api/posts/mine     → my posts                (auth required)
//   GET    /api/posts/:id      → get one post            (public)
//   PUT    /api/posts/:id      → update my post          (auth + owner)
//   DELETE /api/posts/:id      → delete my post          (auth + owner)

const router = require("express").Router();
const Post   = require("../models/Post");
const { authenticate }  = require("../middleware/auth");
const { success, error } = require("../utils/apiResponse");
const {
  validate,
  postBodyRules,
  idParamRule,
  paginationRules,
} = require("../validators/post.validator");

// ── Helper: pagination defaults ────────────────────────────────────────────
const paginate = (query) => ({
  page:  Math.max(1, parseInt(query.page,  10) || 1),
  limit: Math.min(50, parseInt(query.limit, 10) || 10),
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/posts — Create a post
// ─────────────────────────────────────────────────────────────────────────
router.post(
  "/",
  authenticate,
  postBodyRules,
  validate,
  async (req, res, next) => {
    try {
      const { caption, visibility, tags, type } = req.body;

      const post = await Post.create({
        userId:     req.user.id, // always from JWT — never from body
        caption,
        visibility,
        tags:       tags ? tags.map((t) => t.trim().toLowerCase()) : [],
        type,
        // counters default to 0 in the schema
      });

      return success(res, { post }, 201);
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────
// GET /api/posts — List public posts (paginated)
// ─────────────────────────────────────────────────────────────────────────
router.get(
  "/",
  paginationRules,
  validate,
  async (req, res, next) => {
    try {
      const { page, limit } = paginate(req.query);
      const skip = (page - 1) * limit;

      const [posts, total] = await Promise.all([
        Post.find({ visibility: "public" })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("userId", "name email"), // attach author name + email
        Post.countDocuments({ visibility: "public" }),
      ]);

      return success(res, {
        posts,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────
// GET /api/posts/mine — My own posts (all visibilities)
// ─────────────────────────────────────────────────────────────────────────
router.get(
  "/mine",
  authenticate,
  paginationRules,
  validate,
  async (req, res, next) => {
    try {
      const { page, limit } = paginate(req.query);
      const skip = (page - 1) * limit;

      const [posts, total] = await Promise.all([
        Post.find({ userId: req.user.id })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Post.countDocuments({ userId: req.user.id }),
      ]);

      return success(res, {
        posts,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────
// GET /api/posts/:id — Get a single post
// ─────────────────────────────────────────────────────────────────────────
router.get(
  "/:id",
  idParamRule,
  validate,
  async (req, res, next) => {
    try {
      const post = await Post.findById(req.params.id).populate("userId", "name email");
      if (!post) return error(res, "Post not found", 404);

      // Non-public posts: only the owner can view
      if (post.visibility !== "public") {
        // Check auth header manually (don't hard-block unauthenticated users with middleware)
        const authHeader = req.headers.authorization;
        if (!authHeader) return error(res, "Post not found", 404); // intentionally vague

        try {
          const { verifyAccessToken } = require("../utils/jwt");
          const decoded = verifyAccessToken(authHeader.split(" ")[1]);
          if (decoded.id !== post.userId._id.toString()) {
            return error(res, "Post not found", 404);
          }
        } catch {
          return error(res, "Post not found", 404);
        }
      }

      return success(res, { post });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────
// PUT /api/posts/:id — Update my post
// ─────────────────────────────────────────────────────────────────────────
router.put(
  "/:id",
  authenticate,
  idParamRule,
  postBodyRules,
  validate,
  async (req, res, next) => {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) return error(res, "Post not found", 404);

      // Ownership check — only the author can edit
      if (post.userId.toString() !== req.user.id) {
        return error(res, "Not authorised to edit this post", 403);
      }

      const { caption, visibility, tags, type } = req.body;

      if (caption    !== undefined) post.caption    = caption;
      if (visibility !== undefined) post.visibility = visibility;
      if (type       !== undefined) post.type       = type;
      if (tags       !== undefined) post.tags       = tags.map((t) => t.trim().toLowerCase());

      await post.save();
      return success(res, { post });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────
// DELETE /api/posts/:id — Delete my post
// ─────────────────────────────────────────────────────────────────────────
router.delete(
  "/:id",
  authenticate,
  idParamRule,
  validate,
  async (req, res, next) => {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) return error(res, "Post not found", 404);

      if (post.userId.toString() !== req.user.id) {
        return error(res, "Not authorised to delete this post", 403);
      }

      await post.deleteOne();
      return success(res, { message: "Post deleted" });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
