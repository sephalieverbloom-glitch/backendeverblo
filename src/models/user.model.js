import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Home", trim: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pinCode: { type: String, required: true, trim: true, match: [/^\d{6}$/, "PIN code must be 6 digits"] },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true }
);

const sessionSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true },
    deviceType: { type: String, enum: ["web", "android", "ios"], default: "web" },
    refreshToken: { type: String },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    // ==========================================
    // BASIC INFO
    // ==========================================
    fullName: {
      type: String,
      required: [true, "Full Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 60,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      unique: true,
      lowercase: true,
    },

    mobile: {
      type: String,
      trim: true,
      sparse: true,
      default: null,
    },

    secondaryMobile: {
      type: String,
      trim: true,
      default: null,
    },

    city: {
      type: String,
      trim: true,
      default: "",
    },

    state: {
      type: String,
      trim: true,
      default: "",
    },

    password: {
      type: String,
      trim: true,
      select: false,
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    googleId: {
      type: String,
      trim: true,
      sparse: true,
      select: false,
    },

    address: {
      type: String,
      trim: true,
      maxlength: 300,
    },

    addresses: [addressSchema],

    pinCode: {
      type: String,
      trim: true,
      match: [/^\d{6}$/, "PIN code must be exactly 6 digits"],
    },

    dob: {
      type: Date,
    },

    avatar: {
      public_id: {
        type: String,
        default: "",
      },
      url: {
        type: String,
        default: "",
      },
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },

    // ==========================================
    // TOKEN VERSION (Global session invalidation)
    // ==========================================
    tokenVersion: {
      type: Number,
      default: 0,
    },

    // ==========================================
    // SESSIONS (Max 2 concurrent device sessions)
    // ==========================================
    sessions: [sessionSchema],

    // ==========================================
    // VERIFICATION FLAGS & OTPS
    // ==========================================
    isMobileVerified: {
      type: Boolean,
      default: false,
    },

    mobileVerificationOTP: {
      type: String,
      select: false,
    },

    mobileVerificationOTPExpires: {
      type: Date,
      select: false,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationOTP: {
      type: String,
      select: false,
    },

    emailVerificationOTPExpires: {
      type: Date,
      select: false,
    },

    otpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },

    // ==========================================
    // PASSWORD RESET
    // ==========================================
    resetPasswordToken: {
      type: String,
      select: false,
    },

    resetPasswordExpires: {
      type: Date,
      select: false,
    },

    // ==========================================
    // AUTH TOKENS
    // ==========================================
    refreshToken: {
      type: String,
      default: "",
      select: false,
    },

    // ==========================================
    // ACCOUNT STATUS & ACTIVITY
    // ==========================================
    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: {
      type: Date,
    },

    loginCount: {
      type: Number,
      default: 0,
    },

    notificationEnabled: {
      type: Boolean,
      default: true,
    },

    acceptedTerms: {
      type: Boolean,
      default: false,
    },

    acceptedTermsAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
userSchema.index({ fullName: "text", email: "text", mobile: "text" });

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.password || !this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;