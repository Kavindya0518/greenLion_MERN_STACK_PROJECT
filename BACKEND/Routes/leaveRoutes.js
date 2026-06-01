const express = require("express");
const router = express.Router();
const leaveController = require("../Controllers/leaveController");
const authMiddleware = require("../Middlewares/empAuth");

// Routes
router.post("/", leaveController.createLeave);
router.get("/", leaveController.getAllLeaves);
router.get("/my", authMiddleware, leaveController.getMyLeaves);
router.get("/:customId", leaveController.getLeaveById);
router.put("/:customId/status", leaveController.updateLeaveStatus);
router.delete("/:customId", leaveController.deleteLeave);

module.exports = router;
