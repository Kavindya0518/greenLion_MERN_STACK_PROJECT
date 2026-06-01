const express = require('express');
const router = express.Router();
const attendanceController = require('../Controllers/attendanceController');
const authMiddleware = require("../Middlewares/empAuth");

// Routes
router.post('/add', attendanceController.addAttendance);
router.get('/', attendanceController.getAllAttendance);
router.get('/recent', attendanceController.getRecentRecords);
router.get('/today/summary', attendanceController.getTodaySummary);
router.get('/weekly/trend', attendanceController.getWeeklyTrend);

router.get("/my", authMiddleware, attendanceController.getMyAttendance);
router.get("/my/monthly-summary", authMiddleware, attendanceController.getMyMonthlySummary);
router.post("/checkin", authMiddleware, attendanceController.checkIn);
router.post("/checkout", authMiddleware, attendanceController.checkOut);

router.get('/:attendance_id', attendanceController.getAttendanceById);
router.put('/update/:attendance_id', attendanceController.updateAttendance);
router.delete('/delete/:attendance_id', attendanceController.deleteAttendance);

module.exports = router;
