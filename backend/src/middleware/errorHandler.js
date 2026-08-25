// middleware/errorHandler.js — Catch-all Express error handler
// Never expose stack traces or internal details to the client in production.
const logger = require("../utils/logger");
const { isProd } = require("../config/env");

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logger.error(err.message);

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(400).json({ success: false, message: `${field} already exists` });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join(", ") });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }

  // Default — hide internals in production
  const statusCode = err.statusCode || 500;
  const message = isProd && statusCode === 500 ? "Internal server error" : err.message;
  res.status(statusCode).json({ success: false, message });
};

module.exports = errorHandler;
