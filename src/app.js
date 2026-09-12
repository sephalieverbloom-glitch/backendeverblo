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

// Dynamic CORS configuration (supporting everbloomcafe.com, localhost, custom client URLs, and *.vercel.app preview URLs)
const defaultAllowedOrigins = [
  "https://everbloomcafe.com",
  "https://www.everbloomcafe.com",
  "http://everbloomcafe.com",
  "http://www.everbloomcafe.com",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080",
];

if (process.env.CLIENT_URL) {
  const envOrigins = process.env.CLIENT_URL.split(",").map((s) => s.trim().replace(/\/$/, ""));
  defaultAllowedOrigins.push(...envOrigins);
}

const isOriginAllowed = (origin) => {
  if (!origin) return true; // Allow non-browser requests (mobile, curl, Postman, server-to-server)
  const cleanOrigin = origin.replace(/\/$/, "");

  if (defaultAllowedOrigins.includes(cleanOrigin)) return true;
  if (cleanOrigin.startsWith("http://localhost:") || cleanOrigin.startsWith("http://127.0.0.1:")) return true;
  if (cleanOrigin.endsWith(".vercel.app") || cleanOrigin.endsWith("vercel.app")) return true;
  if (cleanOrigin.endsWith("everbloomcafe.com") || cleanOrigin.includes("everbloomcafe")) return true;
  if (process.env.NODE_ENV !== "production") return true;

  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-refresh-token",
    "X-Requested-With",
    "Accept",
    "Origin",
    "x-access-token",
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

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
