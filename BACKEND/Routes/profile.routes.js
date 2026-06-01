const express = require("express");
const router = express.Router();
const { auth } = require("../Middlewares/auth");
const {
  getProfile,
  updateProfile,
  changePassword,
  uploadProfilePicture,
  deleteAccount
} = require("../Controllers/profileController");

// All routes require authentication
router.use(auth);

// GET /api/profile - Get current user's profile
router.get("/", getProfile);

// PUT /api/profile - Update user profile
router.put("/", updateProfile);

// PUT /api/profile/password - Change password
router.put("/password", changePassword);

// POST /api/profile/picture - Upload profile picture
router.post("/picture", uploadProfilePicture);

// DELETE /api/profile - Delete/deactivate account
router.delete("/", deleteAccount);

module.exports = router;
