// BACKEND/Controllers/AuthController.js
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../Models/User");
const Supplier = require("../Models/supplier.model"); // <-- add this
const Employee = require("../Models/Employee"); // <-- add this

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

exports.signup = async (req, res) => {
  try {
    let { name, email, phone, username, password, confirmPassword, role = "customer", adminCode } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ ok: false, message: "Missing required fields" });
    }
    if (password.length < 6) {
      return res.status(400).json({ ok: false, message: "Password must be at least 6 characters" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ ok: false, message: "Passwords do not match" });
    }

    name = String(name).trim();
    email = String(email).trim().toLowerCase();
    username = username ? String(username).trim().toLowerCase() : undefined;
    phone = phone ? String(phone).trim() : undefined;
    role = String(role || "customer").trim().toLowerCase();

    if (!["customer", "admin"].includes(role)) {
      return res.status(400).json({ ok: false, message: "Invalid signup role" });
    }

    if (role === "admin") {
      const adminSignupCode = process.env.ADMIN_SIGNUP_CODE;
      if (!adminSignupCode) {
        return res.status(500).json({ ok: false, message: "Admin signup is not configured" });
      }
      if (!adminCode || String(adminCode).trim() !== adminSignupCode) {
        return res.status(403).json({ ok: false, message: "Invalid admin signup code" });
      }
    }

    const exists = await User.findOne({
      $or: [
        { email },
        ...(username ? [{ username }] : []),
        ...(phone ? [{ phone }] : []),
      ],
    });
    if (exists) {
      return res.status(409).json({ ok: false, message: "Account already exists with these details" });
    }

    // Model pre-save hook hashes password
    const user = await User.create({ name, email, phone, username, password, role });

    const token = signToken({ id: user._id, role: user.role });
    res.status(201).json({
      ok: true,
      message: "Signup successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        supplierProfileId: null,
      },
    });
  } catch (e) {
    console.error("SIGNUP error:", e);
    if (e?.code === 11000) {
      const key = Object.keys(e.keyPattern || {})[0] || "field";
      return res.status(409).json({ ok: false, message: `Duplicate ${key}: already in use` });
    }
    res.status(500).json({ ok: false, message: "Signup failed" });
  }
};

exports.login = async (req, res) => {
  try {
    const { identity, password } = req.body;
    if (!identity || !password) {
      return res.status(400).json({ ok: false, message: "identity and password required" });
    }

    const ident = String(identity).trim();
    const lower = ident.toLowerCase();

    // 1) Try User login
    let user = await User.findOne({
      $or: [{ email: lower }, { username: lower }, { phone: ident }]
    }).select("+password");

    if (user) {
      if (!user.isActive) return res.status(403).json({ ok: false, message: "Account disabled" });

      const ok = await user.comparePassword(password);
      if (!ok) return res.status(401).json({ ok: false, message: "Invalid credentials" });

      const token = signToken({ id: user._id.toString(), role: user.role });

      let supplierProfileId = null;
      if (user.role === "supplier") {
        const profile = await Supplier.findOne({ user: user._id }).select("_id");
        supplierProfileId = profile?._id || null;
      }

      return res.json({
        ok: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.role,
          supplierProfileId,
        },
      });
    }

    // 2) Try Employee login
    const employee = await Employee.findOne({ employee_id: ident });
    if (employee && employee.password === password) {
      const token = signToken({ id: employee.employee_id, role: "employee" });

      return res.json({
        ok: true,
        token,
        user: {
          id: employee.employee_id,
          name: employee.name,
          role: "employee",
        },
      });
    }

    return res.status(401).json({ ok: false, message: "Invalid credentials" });






  } catch (e) {
    console.error("LOGIN error:", e);
    res.status(500).json({ ok: false, message: "Login failed" });
  }
};
