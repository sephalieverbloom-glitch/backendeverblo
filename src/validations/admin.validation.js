import { z } from "zod";

export const registerAdminSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(1, "Name cannot be empty"),

  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email("Enter a valid email address")
    .toLowerCase(),

  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters"),
});

export const loginAdminSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email("Enter a valid email address")
    .toLowerCase(),

  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password cannot be empty"),
});

export const refreshAdminTokenSchema = z.object({
  refreshToken: z.string().trim().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email("Enter a valid email address")
    .toLowerCase(),
});

export const resetPasswordSchema = z
  .object({
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .email("Enter a valid email address")
      .toLowerCase(),

    otp: z
      .string({ required_error: "OTP is required" })
      .trim()
      .regex(/^[0-9]{6}$/, "OTP must be exactly 6 digits"),

    password: z
      .string({ required_error: "Password is required" })
      .min(6, "Password must be at least 6 characters"),

    confirmPassword: z
      .string({ required_error: "Confirm password is required" })
      .min(6, "Confirm password must be at least 6 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password and Confirm Password must match",
    path: ["confirmPassword"],
  });

export const verifyAdminEmailSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email("Enter a valid email address")
    .toLowerCase(),

  otp: z
    .string({ required_error: "OTP is required" })
    .trim()
    .regex(/^[0-9]{6}$/, "OTP must be exactly 6 digits"),
});

export const resendAdminOtpSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email("Enter a valid email address")
    .toLowerCase(),
});
