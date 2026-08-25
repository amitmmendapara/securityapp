// ─────────────────────────────────────────────────────────────
// COPY TO: backend/src/validators/post.validator.js
// ─────────────────────────────────────────────────────────────
const { body, param, query, validationResult } = require("express-validator");

// Run accumulated rules and return 422 with field-level errors if any fail
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ── Create / Update shared rules ──────────────────────────────────────────
const postBodyRules = [
  body("caption")
    .optional()
    .isString().withMessage("Caption must be a string")
    .trim()
    .isLength({ max: 2200 }).withMessage("Caption max 2200 characters"),

  body("visibility")
    .optional()
    .isIn(["public", "friends", "private"])
    .withMessage("visibility must be public, friends, or private"), 

  body("tags")
    .optional()
    .isArray({ max: 30 }).withMessage("tags must be an array of up to 30 items")
    .custom((arr) => arr.every((t) => typeof t === "string" && t.length <= 50))
    .withMessage("Each tag must be a string ≤ 50 characters"),

  body("type")
    .optional()
    .isIn(["text", "image", "video", "link", "repost"])
    .withMessage("type must be text | image | video | link | repost"),

  // Counters are server-controlled — reject if someone tries to send them
  body(["likesCount", "commentsCount", "shareCount", "repostCount"])
    .not().exists()
    .withMessage("Engagement counters are managed by the server"),
];

// ── MongoDB ObjectId param rule ───────────────────────────────────────────
const idParamRule = [
  param("id").isMongoId().withMessage("Invalid post id"),
];

// ── Pagination query rules ─────────────────────────────────────────────────
const paginationRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("page must be ≥ 1").toInt(),
  query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("limit must be 1–50").toInt(),
];

module.exports = { validate, postBodyRules, idParamRule, paginationRules };
