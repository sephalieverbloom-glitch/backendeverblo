import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";

import router from "./routes/index.routes.js";
import connectToDb from "./configs/db/db.js";
import { globalErrorHandler } from "./middlewares/globalErrorHandler.js";
import { globalLimiter } from "./middlewares/rateLimiter.middleware.js";

const app = express();

// Trust proxy for Vercel / Nginx / Cloudflare edge proxies
app.set("trust proxy", 1);

// HTTP Payload Compression
app.use(compression());

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Dynamic CORS configuration (supporting localhost, custom client URL, and *.vercel.app preview URLs)
const allowedOrigin = process.env.CLIENT_URL || "http://localhost:3000";
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      // Allow local development ports
      if (
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:") ||
        origin === allowedOrigin ||
        origin.endsWith(".vercel.app") // Vercel preview environments
      ) {
        return callback(null, true);
      }

      if (process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }

      return callback(new Error("CORS policy violation: Unauthorized origin"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-refresh-token"],
  })
);

// Body Parsers & Cookie Parser (1mb limit suitable for serverless)
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

// Request logging (clean dev logs, compact combined in prod)
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Serverless DB Connection Middleware (connects on cold start, reuses cached connection on warm runs)
app.use(async (req, res, next) => {
  // Skip DB connection for root health ping
  if (req.path === "/" || req.path === "/health") {
    return next();
  }
  try {
    await connectToDb();
    next();
  } catch (error) {
    console.error("Database connection failure:", error.message);
    return res.status(503).json({
      success: false,
      message: "Database service temporarily unavailable. Please try again shortly.",
    });
  }
});

// Root ping
app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Everbloom Café API is alive and running.",
    docs: "/api/v1/health",
  });
});

// Global API Rate Limiter & Cafe Router
app.use("/api/v1", globalLimiter, router);

// Centralized Error Handling Middleware
app.use(globalErrorHandler);

export default app;
