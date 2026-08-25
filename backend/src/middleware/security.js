// middleware/security.js — All security middleware in one place
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const { rateLimit: rlConfig, cors: corsConfig } = require("../config/env");
const cors = require("cors");

// ── Helmet: sets secure HTTP headers (XSS, clickjacking, MIME sniffing, etc.)
const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
    },
  },
  crossOriginEmbedderPolicy: false, // set true if you need COEP
});

// ── CORS: only allow configured frontend origins
// credentials:true is required so the browser sends the httpOnly refresh-token cookie
const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin || corsConfig.origins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,           // ← must be true for cookies to work cross-origin
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

// ── Rate limiting: 100 requests per 15 minutes per IP by default
const limiter = rateLimit({
  windowMs: rlConfig.windowMs,
  max: rlConfig.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests — please try again later." },
});

// ── Auth-specific limiter: tighter limit for login/register
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  message: { success: false, message: "Too many auth attempts — try again in 15 minutes." },
});

// ── NoSQL injection prevention: strips $ and . from request body/params/query
const sanitize = mongoSanitize();

module.exports = {
  helmetMiddleware,
  corsMiddleware,
  limiter,
  authLimiter,
  sanitize,
};
