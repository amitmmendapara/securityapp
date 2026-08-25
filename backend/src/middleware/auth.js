// middleware/auth.js — Protect routes by verifying the JWT
const { verifyAccessToken } = require("../utils/jwt");
const { error } = require("../utils/apiResponse");
const logger = require("../utils/logger");

/**
 * authenticate — attach decoded user to req.user, or reject with 401.
 * Expects: Authorization: Bearer <token>
 */

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return error(res, "No token provided", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token); // throws if expired / invalid
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    logger.warn(`Auth failed: ${err.message}`);
    return error(res, "Invalid or expired token", 401);
  }
}; 

/**
 * authorize — restrict access by role.
 * Usage: router.get("/admin", authenticate, authorize("admin"), handler)
 */

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return error(res, "You do not have permission for this action", 403);
  }
  next();
};

module.exports = { authenticate, authorize };