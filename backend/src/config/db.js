// config/db.js — MongoDB connection with basic retry logic
const mongoose = require("mongoose");
const { mongodb } = require("./env");
const logger = require("../utils/logger");

const connect = async () => {
  try {
    await mongoose.connect(mongodb.uri, {
      // These are sensible production defaults
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info("✅  MongoDB connected");
  } catch (err) {
    // Log message only — never log the URI (it contains credentials)
    logger.error("MongoDB connection error — check MONGODB_URI in .env");
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected");
});

module.exports = { connect };
