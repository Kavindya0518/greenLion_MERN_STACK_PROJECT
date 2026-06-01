const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../Middlewares/auth.middleware");

// Placeholder route - will be implemented later
router.get("/", requireAuth, requireRole("admin"), (req, res) => {
  res.json({ message: "Users route working" });
});

export default router;