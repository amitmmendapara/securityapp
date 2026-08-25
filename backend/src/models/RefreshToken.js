// models/RefreshToken.js
// Stores issued refresh tokens so we can invalidate them on logout
// or rotate them. This lets us do true "logout everywhere" if needed.

const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema({
  token:     { type: String, required: true, unique: true },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  expiresAt: { type: Date, required: true },
  // createdAt is added by { timestamps: true } below
}, { timestamps: true });

// Auto-delete expired documents from MongoDB (TTL index)
// MongoDB checks every 60 seconds, so cleanup is automatic.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("RefreshToken", refreshTokenSchema);
