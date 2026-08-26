// server.js — Entry point
const env = require("./config/env"); // validates env vars first
const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser"); // needed to read httpOnly cookies
const { connect: connectDB } = require("./config/db");
const {
  helmetMiddleware,
  corsMiddleware,
  limiter,
  sanitize,
} = require("./middleware/security");
const errorHandler = require("./middleware/errorHandler");
const authRoutes = require("./routes/auth.routes");
const logger = require("./utils/logger");

const app = express();


// ── Security headers
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(cookieParser()); // must come after cors, before routes

// ── Body parsing
app.use(express.json({ limit: "10kb" })); // reject oversized payloads
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ── NoSQL injection sanitization
app.use(sanitize);

// ── Request logging (skip in test)
if (env.nodeEnv !== "test") {
  app.use(morgan(env.isProd ? "combined" : "dev"));
}

// ── Global rate limiter
app.use("/api", limiter);

// ── Routes
app.use("/api/auth", authRoutes);

// ── Health check (no auth needed)
app.get("/health", (_, res) => res.json({ status: "ok" }));
//
const postRoutes = require("./routes/post.routes");
app.use("/api/posts", postRoutes);

// ── 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: "Route not found" }));

// ── Global error handler (must be last)
app.use(errorHandler);

// ── Start
const start = async () => {
  await connectDB();
  app.listen(env.port, () => {
    logger.info(`🚀  Server running on http://localhost:${env.port} [${env.nodeEnv}]`);
  });
};

start();
