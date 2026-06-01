const express = require("express");
const router = express.Router();
const analyticsController = require("../Controllers/analyticsController");

// Analytics Routes
router.get("/employee", analyticsController.getEmployeeAnalytics);
router.get("/dashboard", analyticsController.getDashboardData);
router.get("/attendance/summary", analyticsController.getAttendanceSummary);
router.get("/leaves/pending/count", analyticsController.getPendingLeaveCount);

// Summaries
router.get("/salary/summary", analyticsController.getSalarySummary);
router.get("/departments/summary", analyticsController.getDepartmentSummary);
router.get("/leaves/summary", analyticsController.getLeaveSummary);
router.get("/employees/summary", analyticsController.getEmployeeSummary);

// Snapshots
router.post("/snapshots", analyticsController.createAnalyticsSnapshot);
router.get("/snapshots", analyticsController.getAnalyticsSnapshots);
router.get("/snapshots/:id", analyticsController.getAnalyticsSnapshotById);

module.exports = router;
