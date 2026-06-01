const express = require("express");
const router = express.Router();
const performanceController = require("../Controllers/performanceController");

// CRUD Routes
router.post("/", performanceController.createPerformance);
router.get("/", performanceController.getAllPerformance);
router.get("/data", performanceController.getPerformanceData);
router.get("/summary", performanceController.getPerformanceSummary);
router.get("/employee/:employee_id", performanceController.getPerformanceByEmployee);
router.put("/:id", performanceController.updatePerformance);
router.delete("/:id", performanceController.deletePerformance);

module.exports = router;
