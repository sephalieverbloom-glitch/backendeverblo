import crypto from "crypto";
import jwt from "jsonwebtoken";
import AdminModel from "../models/admin.model.js";
import MenuItem from "../models/menu.model.js";
import Reservation from "../models/reservation.model.js";
import Contact from "../models/contact.model.js";
import { generateAdminAccessToken } from "../utils/generateAccessToken.js";
import { generateAdminRefreshToken } from "../utils/generateRefreshToken.js";
import { generateOTP } from "../utils/generateOTP.js";
import { sendEmailOTP } from "../utils/sendEmailOTP.js";

/**
 * Hash OTP using timing-safe HMAC-SHA256
 */
const hashAdminOTP = (otp) => {
  const secret = process.env.ACCESS_TOKEN_SECRET || "everbloom-admin-otp-secret";
  return crypto.createHmac("sha256", secret).update(String(otp)).digest("hex");
};

// ======================================================
// LOGIN ADMIN SERVICE
// ======================================================
export const loginAdminService = async (data) => {
  const { email, password } = data;

  if (!email || !password) {
    const error = new Error("Email and password are required");
    error.statusCode = 400;
    throw error;
  }

  const admin = await AdminModel.findOne({ email: email.toLowerCase() }).select("+password");

  if (!admin) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  if (admin.isBlocked) {
    const error = new Error("Account is blocked. Please contact system administrator.");
    error.statusCode = 403;
    throw error;
  }

  const isPasswordMatched = await admin.comparePassword(password);
  if (!isPasswordMatched) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const accessToken = generateAdminAccessToken(admin);
  const refreshToken = generateAdminRefreshToken(admin._id);

  admin.refreshToken = refreshToken;
  await admin.save();

  const adminData = admin.toObject();
  delete adminData.password;
  delete adminData.refreshToken;

  return {
    accessToken,
    refreshToken,
    admin: adminData,
  };
};

// ======================================================
// LOGOUT ADMIN SERVICE
// ======================================================
export const logoutAdminService = async (adminId) => {
  if (!adminId) return;
  await AdminModel.findByIdAndUpdate(adminId, {
    $set: { refreshToken: null },
  });
};

// ======================================================
// REFRESH ADMIN TOKEN SERVICE
// ======================================================
export const refreshAdminTokenService = async (refreshToken) => {
  if (!refreshToken) {
    const error = new Error("Refresh token required");
    error.statusCode = 401;
    throw error;
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch {
    const error = new Error("Invalid or expired refresh token");
    error.statusCode = 401;
    throw error;
  }

  const admin = await AdminModel.findById(decoded.id);
  if (!admin || admin.refreshToken !== refreshToken) {
    const error = new Error("Invalid session. Please login again.");
    error.statusCode = 401;
    throw error;
  }

  const newAccessToken = generateAdminAccessToken(admin);
  return { accessToken: newAccessToken };
};

// ======================================================
// GET ADMIN PROFILE
// ======================================================
export const getAdminProfileService = async (adminId) => {
  const admin = await AdminModel.findById(adminId).select("-password -refreshToken").lean();
  if (!admin) {
    const error = new Error("Admin not found");
    error.statusCode = 404;
    throw error;
  }
  return admin;
};

// ======================================================
// FORGOT & RESET PASSWORD
// ======================================================
export const forgotPasswordService = async (email) => {
  const admin = await AdminModel.findOne({ email: email.toLowerCase() });
  if (!admin) {
    // Return gracefully to prevent email enumeration
    return { success: true };
  }

  const otp = generateOTP();
  admin.otp = hashAdminOTP(otp);
  admin.otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
  await admin.save();

  try {
    await sendEmailOTP({
      email: admin.email,
      otp,
      name: admin.name,
      purpose: "password_reset",
    });
  } catch (err) {
    console.error("Failed to send reset email:", err.message);
  }

  return { success: true };
};

export const verifyResetOtpService = async (email, otp) => {
  const admin = await AdminModel.findOne({ email: email.toLowerCase() });
  if (!admin || !admin.otp || !admin.otpExpiry) {
    const error = new Error("Invalid or expired OTP");
    error.statusCode = 400;
    throw error;
  }

  if (Date.now() > admin.otpExpiry) {
    const error = new Error("OTP has expired. Please request a new one.");
    error.statusCode = 400;
    throw error;
  }

  const hashedInput = hashAdminOTP(otp);
  if (hashedInput !== admin.otp) {
    const error = new Error("Invalid OTP");
    error.statusCode = 400;
    throw error;
  }

  return { verified: true };
};

export const resetPasswordService = async ({ email, otp, newPassword }) => {
  const admin = await AdminModel.findOne({ email: email.toLowerCase() });
  if (!admin || !admin.otp || !admin.otpExpiry) {
    const error = new Error("Invalid request");
    error.statusCode = 400;
    throw error;
  }

  if (Date.now() > admin.otpExpiry) {
    const error = new Error("OTP has expired");
    error.statusCode = 400;
    throw error;
  }

  const hashedInput = hashAdminOTP(otp);
  if (hashedInput !== admin.otp) {
    const error = new Error("Invalid OTP");
    error.statusCode = 400;
    throw error;
  }

  admin.password = newPassword;
  admin.otp = undefined;
  admin.otpExpiry = undefined;
  admin.tokenVersion = (admin.tokenVersion || 0) + 1;
  await admin.save();

  return { success: true };
};

// ======================================================
// CAFE DASHBOARD STATS & OVERVIEW
// ======================================================
export const getDashboardStatsService = async () => {
  const [
    totalMenuItems,
    availableItems,
    totalReservations,
    pendingReservations,
    totalMessages,
  ] = await Promise.all([
    MenuItem.countDocuments(),
    MenuItem.countDocuments({ isAvailable: true }),
    Reservation.countDocuments(),
    Reservation.countDocuments({ status: "pending" }),
    Contact.countDocuments(),
  ]);

  return {
    totalMenuItems,
    availableItems,
    outOfStockItems: totalMenuItems - availableItems,
    totalReservations,
    pendingReservations,
    totalMessages,
  };
};

export const getDashboardOverviewService = async () => {
  const [stats, recentReservations, recentMessages] = await Promise.all([
    getDashboardStatsService(),
    Reservation.find().sort({ createdAt: -1 }).limit(5).lean(),
    Contact.find().sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  return {
    stats,
    recentReservations,
    recentMessages,
  };
};
