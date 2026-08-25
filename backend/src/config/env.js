// config/env.js — Validate all env vars at startup so the app fails fast
// if anything is missing, rather than crashing later at runtime.

require("dotenv").config();

const required = [
  "MONGODB_URI",
  "JWT_ACCESS_SECRET",   // signs 15-min access tokens
  "JWT_REFRESH_SECRET",  // signs 30-day refresh tokens (different secret!)
];

required.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌  Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  isProd: process.env.NODE_ENV === "production",

  mongodb: {
    // uri: process.env.MONGODB_URI,
    uri: "mongodb+srv://amitpaneli:6a2d1a1ba80130d7@amcluster.jgyvb.mongodb.net/?appName=AMCluster",
  },

  jwt: {
    accessSecret:  process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn:  "15m",   // short-lived — lives in JS memory only
    refreshExpiresIn: "30d",   // long-lived  — lives in httpOnly cookie only
  },

  cookie: {
    // In production set to true (requires HTTPS)
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
  },

  cors: {
    origins: (process.env.ALLOWED_ORIGINS || "http://localhost:3000")
      .split(",")
      .map((o) => o.trim()),
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  },
};
