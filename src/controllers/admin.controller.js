import asyncHandler from "../middlewares/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import {
  loginAdminService,
  logoutAdminService,
  refreshAdminTokenService,
  getAdminProfileService,
  getDashboardStatsService,
  getDashboardOverviewService,
  forgotPasswordService,
  verifyResetOtpService,
  resetPasswordService,
} from "../services/admin.service.js";

const isProduction = process.env.NODE_ENV === "production";

// Cookie options for Refresh Token
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "strict" : "lax",
  maxAge: 24 * 60 * 60 * 1000, // 1 day
};

export const loginAdmin = asyncHandler(async (req, res) => {
  const result = await loginAdminService(req.body);

  res.cookie("adminRefreshToken", result.refreshToken, cookieOptions);

  return res.status(200).json({
    success: true,
    message: "Admin logged in successfully",
    accessToken: result.accessToken,
    admin: result.admin,
  });
});

export const LogoutAdmin = asyncHandler(async (req, res) => {
  const adminId = req.admin?._id;
  await logoutAdminService(adminId);

  res.clearCookie("adminRefreshToken", cookieOptions);

  return res.status(200).json({
    success: true,
    message: "Admin logged out successfully",
  });
});

export const logoutAdmin = LogoutAdmin;

export const refreshAdminToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.adminRefreshToken || req.headers["x-refresh-token"] || req.body?.refreshToken;

  const result = await refreshAdminTokenService(incomingRefreshToken);

  return res.status(200).json({
    success: true,
    message: "Token refreshed successfully",
    accessToken: result.accessToken,
  });
});

export const getAdminProfile = asyncHandler(async (req, res) => {
  const admin = await getAdminProfileService(req.admin._id);

  return res.status(200).json({
    success: true,
    data: admin,
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await forgotPasswordService(req.body.email);

  return res.status(200).json({
    success: true,
    message: "Password reset OTP sent to your admin email.",
  });
});

export const verifyResetOtp = asyncHandler(async (req, res) => {
  const result = await verifyResetOtpService(req.body.email, req.body.otp);

  return res.status(200).json({
    success: true,
    message: "OTP verified successfully.",
    data: result,
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await resetPasswordService(req.body);

  return res.status(200).json({
    success: true,
    message: "Password reset successfully. You can now log in.",
  });
});

export const getDashboardStats = asyncHandler(async (req, res) => {
  const data = await getDashboardStatsService(req.query);
  return ApiResponse.success(res, "Dashboard stats retrieved successfully", data);
});

export const getDashboardOverview = asyncHandler(async (req, res) => {
  const data = await getDashboardOverviewService(req.query);
  return ApiResponse.success(res, "Dashboard overview retrieved successfully", data);
});
