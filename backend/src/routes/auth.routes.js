// routes/auth.routes.js
//
// Token strategy:
//   ACCESS TOKEN  (15 min) → returned in JSON body → frontend keeps in memory
//   REFRESH TOKEN (30 days)→ set as httpOnly cookie → JS can never read it
//
// Endpoints:
//   POST /api/auth/register  → create account, return both tokens
//   POST /api/auth/login     → verify credentials, return both tokens
//   POST /api/auth/refresh   → use cookie to issue a new access token
//   POST /api/auth/logout    → clear cookie + delete refresh token from DB
//   GET  /api/auth/me        → return current user (access token required)

const router = require("express").Router();
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../utils/jwt");
const { success, error } = require("../utils/apiResponse");
const { authenticate } = require("../middleware/auth");
const { authLimiter } = require("../middleware/security");
const { registerRules, loginRules, validate } = require("../validators/auth.validator");
const { cookie: cookieConfig, jwt: jwtConfig } = require("../config/env");
const logger = require("../utils/logger");

// ── Helper: set the refresh token as a secure httpOnly cookie ──────────────
const setRefreshCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,           // JS cannot access this cookie at all
    secure: cookieConfig.secure,     // true in production (HTTPS only)
    sameSite: cookieConfig.sameSite, // "strict" — blocks CSRF from other sites
    maxAge: cookieConfig.maxAge,     // 30 days in ms
    path: "/api/auth",        // cookie only sent to auth routes, nowhere else
  });
};

// ── Helper: save refresh token to DB ──────────────────────────────────────
const saveRefreshToken = async (userId, token) => {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  await RefreshToken.create({ token, userId, expiresAt });
};

// ── Helper: issue both tokens and send response ────────────────────────────
const issueTokens = async (res, user, statusCode = 200) => {
  const accessToken  = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await saveRefreshToken(user._id, refreshToken);
  setRefreshCookie(res, refreshToken);

  return success(res, {
    accessToken, // frontend stores this in memory (React state)
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  }, statusCode);
};

// ── POST /api/auth/register ────────────────────────────────────────────────
router.post("/register", authLimiter, registerRules, validate, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return error(res, "Email already in use", 409);

    const user = await User.create({ name, email, password });
    return issueTokens(res, user, 201);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/login ───────────────────────────────────────────────────
router.post("/login", authLimiter, loginRules, validate, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return error(res, "Invalid credentials", 401);
    }
    return issueTokens(res, user);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/refresh ─────────────────────────────────────────────────
// Called automatically by the frontend when an API call returns 401.
// The browser sends the httpOnly cookie automatically — no JS token needed.
router.post("/refresh", async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return error(res, "No refresh token", 401);

    // 1. Verify the JWT signature and expiry
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      return error(res, "Invalid or expired refresh token", 401);
    }

    // 2. Check the token exists in DB (not logged out / revoked)
    const stored = await RefreshToken.findOne({ token });
    if (!stored) return error(res, "Refresh token revoked", 401);

    // 3. Load user
    const user = await User.findById(payload.id);
    if (!user) return error(res, "User not found", 401);

    // 4. Rotate: delete old refresh token, issue new pair
    //    Rotation means each refresh token can only be used once.
    //    If an attacker steals a refresh token, it stops working after one use.
    await RefreshToken.deleteOne({ token });
    return issueTokens(res, user);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/logout ──────────────────────────────────────────────────
router.post("/logout", async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      // Delete from DB so the token can never be used again
      await RefreshToken.deleteOne({ token });
    }

    // Clear the cookie on the browser
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: cookieConfig.secure,
      sameSite: cookieConfig.sameSite,
      path: "/api/auth",
    });

    return success(res, { message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/auth/me ───────────────────────────────────────────────────────
router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return error(res, "User not found", 404);
    return success(res, { id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
