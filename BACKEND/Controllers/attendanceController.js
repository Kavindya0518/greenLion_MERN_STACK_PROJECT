const Attendance = require('../Models/Attendance');
const Employee = require('../Models/Employee');
const LeaveRequest = require('../Models/LeaveRequest');
const moment = require("moment");

// Generate next attendance_id
const generateAttendanceId = async () => {
  const last = await Attendance.findOne().sort({ createdAt: -1 });
  if (!last) return "ATT001";
  const num = parseInt(last.attendance_id.replace("ATT", "")) + 1;
  return "ATT" + num.toString().padStart(3, "0");
};

// ------------------ ADD ATTENDANCE ------------------
exports.addAttendance = async (req, res) => {
  try {
    const { empId, date, checkIn, checkOut, status } = req.body;

    // Prevent duplicate record (emp + date)
    const existingRecord = await Attendance.findOne({ empId, date });
    if (existingRecord) {
      return res.status(400).json({ error: "Attendance already recorded for this employee on this date" });
    }

    // Calculate working hours
    let hours = 0;
    if (checkIn && checkOut) {
      const [inH, inM] = checkIn.split(':').map(Number);
      const [outH, outM] = checkOut.split(':').map(Number);
      hours = (outH + outM / 60) - (inH + inM / 60);
      if (hours < 0) hours = 0;
    }

    const attendance_id = await generateAttendanceId();

    const newRecord = new Attendance({
      attendance_id,
      empId,
      date,
      checkIn,
      checkOut,
      status,
      hours
    });

    await newRecord.save();
    res.status(201).json(newRecord);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ------------------ GET ALL ------------------
exports.getAllAttendance = async (req, res) => {
  try {
    const records = await Attendance.find();
    res.json(records);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ------------------ GET ONE ------------------
exports.getAttendanceById = async (req, res) => {
  try {
    const record = await Attendance.findOne({ attendance_id: req.params.attendance_id });
    if (!record) return res.status(404).json({ error: "Attendance not found" });
    res.json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ------------------ UPDATE ------------------
exports.updateAttendance = async (req, res) => {
  try {
    const { empId, date, checkIn, checkOut, status } = req.body;

    // Recalculate hours
    let hours = 0;
    if (checkIn && checkOut) {
      const [inH, inM] = checkIn.split(':').map(Number);
      const [outH, outM] = checkOut.split(':').map(Number);
      hours = (outH + outM / 60) - (inH + inM / 60);
      if (hours < 0) hours = 0;
    }

    const updated = await Attendance.findOneAndUpdate(
      { attendance_id: req.params.attendance_id },
      { empId, date, checkIn, checkOut, status, hours },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Attendance not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ------------------ DELETE ------------------
exports.deleteAttendance = async (req, res) => {
  try {
    const deleted = await Attendance.findOneAndDelete({ attendance_id: req.params.attendance_id });
    if (!deleted) return res.status(404).json({ error: "Attendance not found" });
    res.json({ message: "Attendance deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ------------------ TODAY'S SUMMARY ------------------
exports.getTodaySummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // start of today
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // start of tomorrow

    const present = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      status: "Present"
    });

    const absent = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      status: "Absent"
    });

    res.json({ present, absent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ------------------ WEEKLY ATTENDANCE TREND (current week: Mon-Sun) ------------------
exports.getWeeklyTrend = async (req, res) => {
  try {
    const today = new Date();
    // Compute Monday of current week (Mon=0 .. Sun=6)
    const dowMon0 = (today.getDay() + 6) % 7; // Sun=6, Mon=0
    const monday = new Date(today);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(today.getDate() - dowMon0);

    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const result = [];
    // Total employees for denominator
    const totalEmployees = await Employee.countDocuments();

    for (let i = 0; i < 7; i++) {
      const dayStart = moment.utc(monday).add(i, 'days').startOf('day').toDate();
      const nextDay = moment.utc(monday).add(i + 1, 'days').startOf('day').toDate();

      // Count Present for the day; rate based on total employees
      const present = await Attendance.countDocuments({ date: { $gte: dayStart, $lt: nextDay }, status: "Present" });
      const rate = totalEmployees > 0 ? Math.round((present / totalEmployees) * 100) : 0;
      // Debug
      console.log(`[WeeklyTrend] ${labels[i]}: present=${present}, totalEmployees=${totalEmployees}, rate=${rate}%`);
      result.push({ day: labels[i], rate });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------ RECENT 5 RECORDS ------------------
exports.getRecentRecords = async (req, res) => {
  try {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const records = await Attendance.find({
      date: { $gte: start, $lte: end }
    }).sort({ date: -1 });

    if (!records || records.length === 0) {
      return res.status(404).json({ error: "Attendance not found" });
    }

    console.log("Today's records fetched:", records); 
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET logged-in employee attendance
exports.getMyAttendance = async (req, res) => {
  try {
    const employeeId = req.employeeId; // comes from empAuth middleware
    if (!employeeId) return res.status(401).json({ error: "Unauthorized" });

    const attendance = await Attendance.find({ empId: employeeId }).sort({ date: -1 });
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// Helper to format time as HH:mm
/*function formatTime(date) {
  return date.toTimeString().slice(0, 5);
}*/

// mark check in 
exports.checkIn = async (req, res) => {
  try {
    const today = moment().format('YYYY-MM-DD');
    const currentTime = moment().format('HH:mm');

    // Check if already checked in today
    const existing = await Attendance.findOne({
      empId: req.employeeId,
      date: today,
      checkIn: { $ne: "-" }
    });

    if (existing) {
      return res.status(400).json({ error: "Already checked in today" });
    }

    // Create new attendance record
    const attendance_id = await generateAttendanceId();
    const record = new Attendance({
      attendance_id,
      empId: req.employeeId,
      date: today,
      checkIn: currentTime,
      checkOut: "-",
      status: "Present",
      hours: 0
    });

    await record.save();
    return res.json({ message: "Check-In successful", record });

    return res.status(400).json({ error: "Already checked in" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ------------------ MY MONTHLY SUMMARY (Present days, Leave days, Total hours) ------------------
exports.getMyMonthlySummary = async (req, res) => {
  try {
    const employeeId = req.employeeId;
    if (!employeeId) return res.status(401).json({ error: 'Unauthorized' });

    // Parse month/year from query (1-indexed month), default: current
    const now = new Date();
    const monthQ = parseInt(req.query.month, 10); // 1-12
    const yearQ = parseInt(req.query.year, 10);
    const year = Number.isInteger(yearQ) ? yearQ : now.getFullYear();
    const monthIdx = Number.isInteger(monthQ) ? Math.max(1, Math.min(12, monthQ)) - 1 : now.getMonth();

    const monthStart = new Date(year, monthIdx, 1, 0, 0, 0, 0);
    const monthEnd = new Date(year, monthIdx + 1, 1, 0, 0, 0, 0); // exclusive

    // Attendance: get all for month for this employee
    const att = await Attendance.find({
      empId: employeeId,
      date: { $gte: monthStart, $lt: monthEnd }
    });

    const presentDays = att.reduce((n, a) => n + ((a.status || '') === 'Present' ? 1 : 0), 0);
    const totalHours = att.reduce((s, a) => s + (Number(a.hours) || 0), 0);

    // Leaves: approved that overlap month
    const leaves = await LeaveRequest.find({
      employeeId: employeeId,
      status: 'Approved',
      $or: [
        { from: { $lt: monthEnd }, to: { $gte: monthStart } },
        { from: { $lte: monthEnd }, to: null }
      ]
    });

    // Compute leave days overlapped within the month
    const dayMs = 24 * 60 * 60 * 1000;
    const leaveDays = leaves.reduce((sum, l) => {
      const from = new Date(l.from || monthStart);
      const to = new Date(l.to || l.from || monthEnd);
      const start = from < monthStart ? monthStart : from;
      const end = to > monthEnd ? new Date(monthEnd.getTime() - 1) : to; // inclusive
      const diff = Math.floor((end.setHours(0,0,0,0) - start.setHours(0,0,0,0)) / dayMs) + 1;
      return sum + (diff > 0 ? diff : 0);
    }, 0);

    return res.json({
      month: monthIdx + 1,
      year,
      presentDays,
      leaveDays,
      totalHours: Number(totalHours.toFixed(2))
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// mark checkout
exports.checkOut = async (req, res) => {
  try {
    const today = moment().format('YYYY-MM-DD');

    // Find today's record for employee
    let record = await Attendance.findOne({
      empId: req.employeeId,
      date: today
    });

    if (!record || record.checkIn === "-" || !record.checkIn) {
      return res.status(400).json({ error: "No check-in record found" });
    }

    if (record.checkOut === "-" || !record.checkOut) {
      const checkInTime = moment(record.checkIn, "HH:mm");
      const checkOutTime = moment();
      const hoursWorked = checkOutTime.diff(checkInTime, "hours", true);

      record.checkOut = checkOutTime.format("HH:mm");
      record.hours = hoursWorked.toFixed(2);
      await record.save();
      return res.json({ message: "Check-Out successful", record });
    }

    return res.status(400).json({ error: "Already checked out" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};