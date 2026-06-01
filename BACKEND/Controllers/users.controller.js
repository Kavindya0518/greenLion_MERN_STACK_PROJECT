const bcrypt = require("bcryptjs");
const { z } = require("zod");
const User = require("../Models/User");

const createUserSchema = z.object({
  username: z.string().min(3),
  name: z.string().min(2),
  email: z.string().email().optional(),   // optional for some roles
  phone: z.string().min(7).optional(),
  password: z.string().min(6),
  role: z.enum(["employee", "supplier", "admin"]) // created by admin only
});

const resetCredsSchema = z.object({
  username: z.string().min(3).optional(),
  password: z.string().min(6).optional()
});

const statusSchema = z.object({
  status: z.enum(["active", "inactive"])
});

exports.adminCreateUser = async (req, res, next) => {
  try {
    const body = createUserSchema.parse(req.body);
    const exists = await User.findOne({ username: body.username });
    if (exists) return res.status(400).json({ ok: false, message: "Username already in use" });

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await User.create({
      username: body.username,
      name: body.name,
      email: body.email || undefined,
      phone: body.phone || undefined,
      role: body.role,         // admin/employee/supplier
      passwordHash,
      status: "active"
    });

    res.status(201).json({
      ok: true,
      user: { id: user._id, username: user.username, role: user.role, name: user.name, status: user.status }
    });
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ ok: false, message: e.issues[0]?.message || "Invalid data" });
    next(e);
  }
};

exports.adminResetCredentials = async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = resetCredsSchema.parse(req.body);

    const update = {};
    if (body.username) {
      const clash = await User.findOne({ username: body.username, _id: { $ne: id } });
      if (clash) return res.status(400).json({ ok: false, message: "Username already in use" });
      update.username = body.username;
    }
    if (body.password) {
      update.passwordHash = await bcrypt.hash(body.password, 10);
    }

    const user = await User.findByIdAndUpdate(id, update, { new: true });
    if (!user) return res.status(404).json({ ok: false, message: "User not found" });

    res.json({ ok: true, message: "Credentials updated", user: { id: user._id, username: user.username } });
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ ok: false, message: e.issues[0]?.message || "Invalid data" });
    next(e);
  }
};

exports.adminSetStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = statusSchema.parse(req.body);
    const user = await User.findByIdAndUpdate(id, { status }, { new: true });
    if (!user) return res.status(404).json({ ok: false, message: "User not found" });
    res.json({ ok: true, user: { id: user._id, username: user.username, status: user.status } });
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ ok: false, message: e.issues[0]?.message || "Invalid data" });
    next(e);
  }
};

exports.adminListUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const q = role ? { role } : {};
    // Hide hashes
    const users = await User.find(q).select("-passwordHash -password").sort({ createdAt: -1 });
    res.json({ ok: true, users });
  } catch (e) { next(e); }
};
