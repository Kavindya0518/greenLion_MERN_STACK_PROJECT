// BACKEND/Models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,        // DB-level unique
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      unique: true,        // allow unique if present
      sparse: true,        // but permit many docs with no phone
      trim: true,
    },

    username: {
      type: String,
      unique: true,        // DB-level unique
      sparse: true,        // allows null/undefined across docs
      lowercase: true,
      trim: true,
    },

    password: { type: String, required: true, select: false }, // hidden by default

    role: {
      type: String,
      enum: ["customer", "supplier", "employee", "admin"],
      default: "customer",
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ---- Explicit indexes (ensure uniqueness at DB) ----
userSchema.index({ username: 1 }, { unique: true, sparse: true });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true, sparse: true });

// ---- Hash password before save ----
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// ---- Helper for login ----
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
