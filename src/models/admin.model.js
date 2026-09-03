import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Admin Name is Required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Admin Email is Required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Admin Password is Required"],
      minlength: 6,
      select: false,
    },

    role: {
      type: String,
      enum: ["admin", "superadmin"],
      default: "admin",
    },

    tokenVersion: {
      type: Number,
      default: 0,
    },

    isEmailVerified: {
      type: Boolean,
      default: true,
    },

    emailVerificationOtp: {
      type: String,
      select: false,
    },

    emailVerificationOtpExpire: {
      type: Date,
      select: false,
    },

    resetOtp: {
      type: String,
      select: false,
    },

    resetOtpExpire: {
      type: Date,
      select: false,
    },

    otpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },

    refreshToken: {
      type: String,
      default: "",
      select: false,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    userId: {
      type: String,
      trim: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

// HASH PASSWORD BEFORE SAVE
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// COMPARE PASSWORD METHOD
adminSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const AdminModel = mongoose.model("Admin", adminSchema);

export default AdminModel;
