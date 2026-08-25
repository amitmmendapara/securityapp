// utils/jwt.js — Access token + Refresh token helpers
//
// ACCESS TOKEN  (15 min) — signed with JWT_ACCESS_SECRET
//   → sent in Authorization header, stored in JS memory on the frontend
//
// REFRESH TOKEN (30 days) — signed with JWT_REFRESH_SECRET
//   → sent/received via httpOnly cookie only, JS never touches it

const jwt = require("jsonwebtoken");
const { jwt: jwtConfig } = require("../config/env");

// ── Access token ─────────────────────────────────────────
const signAccessToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    jwtConfig.accessSecret,
    { expiresIn: jwtConfig.accessExpiresIn }   // 15m
  );

const verifyAccessToken = (token) =>
  jwt.verify(token, jwtConfig.accessSecret);

// ── Refresh token ─────────────────────────────────────────
const signRefreshToken = (user) =>
  jwt.sign(
    { id: user._id },                          // minimal payload
    jwtConfig.refreshSecret,
    { expiresIn: jwtConfig.refreshExpiresIn }  // 30d
  );

const verifyRefreshToken = (token) =>
  jwt.verify(token, jwtConfig.refreshSecret);

module.exports = {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
};
