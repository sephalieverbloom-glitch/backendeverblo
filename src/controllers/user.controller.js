import asyncHandler from "../middlewares/asyncHandler.js";
import {
  googleAuthService,
  registerUserService,
  verifyEmailOTPService,
  resendEmailOTPService,
  sendMobileOTPService,
  verifyMobileOTPService,
  loginUserService,
  forgotPasswordUserService,
  resetPasswordUserService,
  refreshAccessTokenService,
  logoutUserService,
  getMyProfileService,
  updateProfileService,
} from "../services/user.service.js";

const isProduction = process.env.NODE_ENV === "production";

const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "strict" : "lax",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// Google OAuth Handler
export const googleAuth = asyncHandler(async (req, res) => {
  const { idToken, deviceId, deviceType } = req.body;
  const result = await googleAuthService({ idToken, deviceId, deviceType });

  res.cookie("refreshToken", result.refreshToken, refreshTokenCookieOptions);

  return res.status(200).json({
    success: true,
    message: "Google authentication successful",
    accessToken: result.accessToken,
    user: result.user,
  });
});

// Manual Registration Handler
export const registerUser = asyncHandler(async (req, res) => {
  const result = await registerUserService(req.body);

  return res.status(201).json({
    success: true,
    message: "Registration successful. Please verify your email with the OTP sent to your inbox.",
    data: result,
  });
});

// Verify Email OTP Handler
export const verifyEmailOTP = asyncHandler(async (req, res) => {
  const result = await verifyEmailOTPService(req.body);

  return res.status(200).json({
    success: true,
    message: "Email verified successfully.",
    data: result,
  });
});

// Resend Email OTP Handler
export const resendEmailOTP = asyncHandler(async (req, res) => {
  await resendEmailOTPService(req.body);

  return res.status(200).json({
    success: true,
    message: "Verification OTP resent to your email.",
  });
});

// Send Mobile OTP Handler (Optional Mobile Verification)
export const resendMobileOTP = asyncHandler(async (req, res) => {
  await sendMobileOTPService(req.body);

  return res.status(200).json({
    success: true,
    message: "SMS OTP sent to your mobile number.",
  });
});

// Verify Mobile OTP Handler
export const verifyMobileOTP = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const result = await verifyMobileOTPService({ userId, ...req.body });

  return res.status(200).json({
    success: true,
    message: "Mobile number verified successfully.",
    data: result,
  });
});

// Manual Login Handler
export const loginUser = asyncHandler(async (req, res) => {
  const result = await loginUserService(req.body);

  res.cookie("refreshToken", result.refreshToken, refreshTokenCookieOptions);

  return res.status(200).json({
    success: true,
    message: "Login successful.",
    accessToken: result.accessToken,
    user: result.user,
  });
});

// Forgot Password Handler
export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await forgotPasswordUserService(req.body);

  return res.status(200).json({
    success: true,
    message: result.message,
  });
});

// Reset Password Handler
export const resetPassword = asyncHandler(async (req, res) => {
  const result = await resetPasswordUserService(req.body);

  return res.status(200).json({
    success: true,
    message: result.message,
  });
});

// Logout Handler
export const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.headers["x-refresh-token"] || req.body?.refreshToken;

  await logoutUserService(userId, incomingRefreshToken);

  res.clearCookie("refreshToken", refreshTokenCookieOptions);

  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
});

// Refresh Access Token Handler
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.headers["x-refresh-token"] || req.body?.refreshToken;

  const result = await refreshAccessTokenService(incomingRefreshToken);

  return res.status(200).json({
    success: true,
    message: "Access token refreshed successfully.",
    accessToken: result.accessToken,
  });
});

// Get User Profile Handler
export const getMyProfile = asyncHandler(async (req, res) => {
  const user = await getMyProfileService(req.user._id);

  return res.status(200).json({
    success: true,
    data: user,
  });
});

// Update Profile Handler
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await updateProfileService(req.user._id, req.body);

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully.",
    data: user,
  });
});
