const express = require("express");
const router = express.Router();
const salaryController = require("../Controllers/salaryController");
const authMiddleware = require("../Middlewares/empAuth");

// GET salaries dynamically
router.get("/", salaryController.getSalaries);

// Fetch all salaries (no filter)
router.get("/all", salaryController.getAllSalaries);

// PATCH to mark salary as Paid
router.patch("/pay/:salaryId", salaryController.paySalary);

// DELETE a salary record
router.delete("/:salaryId", salaryController.deleteSalary);

// routes/salary.js
router.get("/pending/count", salaryController.countPendingSalaries);


// GET logged-in employee's salaries
router.get("/my", authMiddleware, salaryController.getMySalaries);

// Download salary slip (only if it belongs to logged-in employee)
router.get("/download/:salaryId", authMiddleware, salaryController.downloadSalarySlip);

router.get("/epf-report", salaryController.getEpfReport);

module.exports = router;
