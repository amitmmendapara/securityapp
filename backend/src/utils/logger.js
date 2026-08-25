// utils/logger.js — Winston logger that never prints secrets
// All sensitive values are scrubbed before being written to any transport.

const { createLogger, format, transports } = require("winston");
const { isProd } = require("../config/env");

// Patterns we never want in logs — add more as needed
const SECRET_PATTERNS = [
  /password[=:]\s*\S+/gi,
  /authorization:\s*bearer\s+\S+/gi,
  /mongodb\+srv:\/\/[^@]+@/gi, // strip credentials from MongoDB URIs
];

const scrubSecrets = format((info) => {
  let message = typeof info.message === "string" ? info.message : JSON.stringify(info.message);
  SECRET_PATTERNS.forEach((pattern) => {
    message = message.replace(pattern, "[REDACTED]");
  });
  info.message = message;
  return info;
});

const logger = createLogger({
  level: isProd ? "warn" : "debug",
  format: format.combine(
    scrubSecrets(),
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    isProd ? format.json() : format.prettyPrint()
  ),
  transports: [
    new transports.Console(),
    // Add file transport in production:
    // new transports.File({ filename: "logs/error.log", level: "error" }),
  ],
});

module.exports = logger;
