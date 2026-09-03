import express from "express";
import {
  forgotPassword,
  getAdminProfile,
  getDashboardStats,
  getDashboardOverview,
  loginAdmin,
  LogoutAdmin,
  refreshAdminToken,
  resetPassword,
  verifyResetOtp,
} from "../controllers/admin.controller.js";
import protect from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { adminAuthLimiter } from "../middlewares/rateLimiter.middleware.js";
import {
  loginAdminSchema,
  forgotPasswordSchema,
  verifyAdminEmailSchema,
  resetPasswordSchema,
} from "../validations/admin.validation.js";

const router = express.Router();

// Login Admin (Strict Rate Limiting & Validation)
// POST -> /api/v1/admin/login
router.post("/login", adminAuthLimiter, validate({ body: loginAdminSchema }), loginAdmin);

// Logout Admin
// POST -> /api/v1/admin/logout
router.post("/logout", protect, LogoutAdmin);

// Refresh Access Token
// POST -> /api/v1/admin/refresh-token
router.post("/refresh-token", adminAuthLimiter, refreshAdminToken);

// Admin Profile
// GET -> /api/v1/admin/profile
router.get("/profile", protect, getAdminProfile);

// Unified Dashboard Overview BFF (Protected)
// GET -> /api/v1/admin/dashboard/overview
router.get("/dashboard/overview", protect, getDashboardOverview);

// Dashboard Analytics Stats (Protected)
// GET -> /api/v1/admin/dashboard-stats
router.get("/dashboard-stats", protect, getDashboardStats);

// Forgot Password (Send OTP)
// POST -> /api/v1/admin/forgot-password
router.post("/forgot-password", adminAuthLimiter, validate({ body: forgotPasswordSchema }), forgotPassword);

// Verify Reset OTP
// POST -> /api/v1/admin/verify-reset-otp
router.post("/verify-reset-otp", adminAuthLimiter, validate({ body: verifyAdminEmailSchema }), verifyResetOtp);

// Reset Password
// POST -> /api/v1/admin/reset-password
router.post("/reset-password", adminAuthLimiter, validate({ body: resetPasswordSchema }), resetPassword);

export default router;
