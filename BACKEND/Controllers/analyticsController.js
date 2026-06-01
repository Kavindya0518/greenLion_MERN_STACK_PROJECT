const Employee = require("../Models/Employee");
const Attendance = require("../Models/Attendance");
const Salary = require("../Models/Salary");
const LeaveRequest = require("../Models/LeaveRequest");
const Department = require("../Models/Department");
const AnalyticsSnapshot = require("../Models/AnalyticsSnapshot");

// ---------------- GET EMPLOYEE ANALYTICS ----------------
exports.getEmployeeAnalytics = async (req, res) => {
  try {
    // Get all employees
    const employees = await Employee.find();
    const totalEmployees = employees.length;
    
    // Department distribution (from Department DB, counting employees per department)
    const departments = await Department.find();
    const departmentDistribution = await Promise.all(
      departments.map(async (dept) => {
        const count = employees.filter(
          (e) => (e.department || "").toLowerCase() === (dept.name || "").toLowerCase()
        ).length;
        return { department: dept.name, count };
      })
    );
    // Optionally include Unassigned bucket
    const unassignedCount = employees.filter((e) => !e.department).length;
    if (unassignedCount > 0) {
      departmentDistribution.push({ department: "Unassigned", count: unassignedCount });
    }
    
    // Monthly attendance trend (last 6 months)
    const today = new Date();
    const monthly_attendance = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const monthAttendance = await Attendance.find({
        date: { $gte: monthStart, $lte: monthEnd },
      });

      const present = monthAttendance.filter((a) => a.status === "Present").length;
      const rate = monthAttendance.length > 0
        ? Math.round((present / monthAttendance.length) * 100)
        : 0;

      const label = d.toLocaleString("en-US", { month: "short" });
      monthly_attendance.push({ month: label, rate });
    }
    
    // Salary distribution by range
    const salaryRanges = {
      "0-30k": 0,
      "30k-50k": 0,
      "50k-70k": 0,
      "70k+": 0,
    };
    
    employees.forEach(emp => {
      const salary = emp.basic_salary || 0;
      if (salary < 30000) salaryRanges["0-30k"]++;
      else if (salary < 50000) salaryRanges["30k-50k"]++;
      else if (salary < 70000) salaryRanges["50k-70k"]++;
      else salaryRanges["70k+"]++;
    });
    
    const salaryDistribution = Object.keys(salaryRanges).map(range => ({
      range,
      count: salaryRanges[range],
    }));
    
    // Leave request status
    const leaveRequests = await LeaveRequest.find();
    const leaveStatus = {
      pending: leaveRequests.filter(l => l.status === "Pending").length,
      approved: leaveRequests.filter(l => l.status === "Approved").length,
      rejected: leaveRequests.filter(l => l.status === "Rejected").length,
    };
    
    // Key metrics
    const activeEmployees = employees.filter(e => e.status === "Active").length;
    const avgSalary = totalEmployees > 0
      ? Math.round(employees.reduce((sum, e) => sum + (e.basic_salary || 0), 0) / totalEmployees)
      : 0;
    
    // Get today's attendance
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));
    const todayAttendance = await Attendance.find({
      date: { $gte: todayStart, $lt: todayEnd },
    });
    
    const presentToday = todayAttendance.filter(a => a.status === "Present").length;
    const attendanceRate = todayAttendance.length > 0
      ? Math.round((presentToday / todayAttendance.length) * 100)
      : 0;
    
    res.json({
      key_metrics: {
        total_employees: totalEmployees,
        active_employees: activeEmployees,
        average_salary: avgSalary,
        attendance_rate: attendanceRate,
      },
      department_distribution: departmentDistribution,
      monthly_attendance,
      salary_distribution: salaryDistribution,
      leave_status: leaveStatus,
      insights: [
        `${activeEmployees} active employees out of ${totalEmployees} total`,
        `Average salary is Rs. ${avgSalary.toLocaleString()}`,
        `Current attendance rate is ${attendanceRate}%`,
        `${leaveStatus.pending} leave requests pending approval`,
      ],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------- GET DASHBOARD DATA ----------------
exports.getDashboardData = async (req, res) => {
  try {
    // Total employees
    const totalEmployees = await Employee.countDocuments();
    
    // Today's attendance
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));
    
    const todayAttendance = await Attendance.find({
      date: { $gte: todayStart, $lt: todayEnd },
    });
    
    const present = todayAttendance.filter(a => a.status === "Present").length;
    const absent = todayAttendance.filter(a => a.status === "Absent").length;
    
    // Pending salaries
    const pendingSalaries = await Salary.countDocuments({ status: "Pending" });
    
    // Pending leaves
    const pendingLeaves = await LeaveRequest.countDocuments({ status: "Pending" });
    
    // Recent attendance (last 10 records)
    const recentAttendance = await Attendance.find()
      .sort({ date: -1 })
      .limit(10);
    
    res.json({
      total_employees: totalEmployees,
      attendance_today: {
        present,
        absent,
      },
      pending_salaries: pendingSalaries,
      pending_leaves: pendingLeaves,
      recent_attendance: recentAttendance,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------- GET ATTENDANCE SUMMARY ----------------
exports.getAttendanceSummary = async (req, res) => {
  try {
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));
    
    const todayAttendance = await Attendance.find({
      date: { $gte: todayStart, $lt: todayEnd },
    });
    
    const present = todayAttendance.filter(a => a.status === "Present").length;
    const absent = todayAttendance.filter(a => a.status === "Absent").length;
    
    res.json({ present, absent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------- GET PENDING LEAVE COUNT ----------------
exports.getPendingLeaveCount = async (req, res) => {
  try {
    const pending = await LeaveRequest.countDocuments({ status: "Pending" });
    res.json({ pending });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------- SALARY SUMMARY ----------------
exports.getSalarySummary = async (req, res) => {
  try {
    const employees = await Employee.find();
    const totalEmployees = employees.length;
    const totalBasic = employees.reduce((sum, e) => sum + (e.basic_salary || 0), 0);
    const avgBasic = totalEmployees > 0 ? Math.round(totalBasic / totalEmployees) : 0;

    const salaryRangesAcc = { "0-30k": 0, "30k-50k": 0, "50k-70k": 0, "70k+": 0 };
    employees.forEach((e) => {
      const s = e.basic_salary || 0;
      if (s < 30000) salaryRangesAcc["0-30k"]++;
      else if (s < 50000) salaryRangesAcc["30k-50k"]++;
      else if (s < 70000) salaryRangesAcc["50k-70k"]++;
      else salaryRangesAcc["70k+"]++;
    });

    const salary_distribution = Object.keys(salaryRangesAcc).map((range) => ({ range, count: salaryRangesAcc[range] }));

    // Optional: pending/paid salary records
    const pendingSalaries = await Salary.countDocuments({ status: "Pending" }).catch(() => 0);
    const paidSalaries = await Salary.countDocuments({ status: "Paid" }).catch(() => 0);

    res.json({
      total_employees: totalEmployees,
      total_basic_salary: totalBasic,
      average_basic_salary: avgBasic,
      salary_distribution,
      salary_status: { pending: pendingSalaries, paid: paidSalaries },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------- DEPARTMENT SUMMARY ----------------
exports.getDepartmentSummary = async (req, res) => {
  try {
    const departments = await Department.find();
    const employees = await Employee.find();

    const byDept = departments.map((d) => {
      const count = employees.filter((e) => (e.department || "").toLowerCase() === (d.name || "").toLowerCase()).length;
      return { department_id: d.department_id, name: d.name, employee_count: count };
    });

    const unassigned = employees.filter((e) => !e.department).length;

    res.json({
      total_departments: departments.length,
      total_employees: employees.length,
      unassigned_employees: unassigned,
      departments: byDept,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------- LEAVE SUMMARY ----------------
exports.getLeaveSummary = async (req, res) => {
  try {
    const leaveRequests = await LeaveRequest.find();
    const summary = {
      total: leaveRequests.length,
      pending: leaveRequests.filter((l) => l.status === "Pending").length,
      approved: leaveRequests.filter((l) => l.status === "Approved").length,
      rejected: leaveRequests.filter((l) => l.status === "Rejected").length,
    };

    // Optional grouping by type
    const byTypeAcc = {};
    leaveRequests.forEach((l) => {
      const t = l.type || "Unknown";
      byTypeAcc[t] = (byTypeAcc[t] || 0) + 1;
    });
    const by_type = Object.keys(byTypeAcc).map((k) => ({ type: k, count: byTypeAcc[k] }));

    res.json({ ...summary, by_type });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------- EMPLOYEE SUMMARY ----------------
exports.getEmployeeSummary = async (req, res) => {
  try {
    const employees = await Employee.find();
    const total = employees.length;
    const active = employees.filter((e) => e.status === "Active").length;
    const inactive = total - active;

    const genderAcc = {};
    employees.forEach((e) => {
      const g = (e.gender || "Unknown").toString();
      genderAcc[g] = (genderAcc[g] || 0) + 1;
    });
    const by_gender = Object.keys(genderAcc).map((k) => ({ gender: k, count: genderAcc[k] }));

    res.json({ total, active, inactive, by_gender });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------- SNAPSHOTS: CREATE & VIEW ----------------
exports.createAnalyticsSnapshot = async (req, res) => {
  try {
    // Reuse existing employee analytics pieces
    const employees = await Employee.find();
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter((e) => e.status === "Active").length;
    const avgSalary = totalEmployees > 0
      ? Math.round(employees.reduce((sum, e) => sum + (e.basic_salary || 0), 0) / totalEmployees)
      : 0;

    // Department distribution
    const departmentCounts = {};
    employees.forEach((emp) => {
      const dept = emp.department || "Unassigned";
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
    });
    const department_distribution = Object.keys(departmentCounts).map((dept) => ({ department: dept, count: departmentCounts[dept] }));

    // Weekly attendance (last 7 days)
    const today = new Date();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]; // use native getDay()
    const weekly_attendance = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const start = new Date(d.setHours(0, 0, 0, 0));
      const end = new Date(d.setHours(23, 59, 59, 999));
      const daily = await Attendance.find({ date: { $gte: start, $lt: end } });
      const present = daily.filter((a) => a.status === "Present").length;
      const rate = daily.length > 0 ? Math.round((present / daily.length) * 100) : 0;
      weekly_attendance.push({ day: days[d.getDay()], rate });
    }

    // Salary distribution
    const salaryRanges = { "0-30k": 0, "30k-50k": 0, "50k-70k": 0, "70k+": 0 };
    employees.forEach((e) => {
      const s = e.basic_salary || 0;
      if (s < 30000) salaryRanges["0-30k"]++;
      else if (s < 50000) salaryRanges["30k-50k"]++;
      else if (s < 70000) salaryRanges["50k-70k"]++;
      else salaryRanges["70k+"]++;
    });
    const salary_distribution = Object.keys(salaryRanges).map((r) => ({ range: r, count: salaryRanges[r] }));

    // Leave status
    const leaves = await LeaveRequest.find();
    const leave_status = {
      pending: leaves.filter((l) => l.status === "Pending").length,
      approved: leaves.filter((l) => l.status === "Approved").length,
      rejected: leaves.filter((l) => l.status === "Rejected").length,
    };

    // Today's attendance rate
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const todayEnd = new Date(new Date().setHours(23, 59, 59, 999));
    const todayAttendance = await Attendance.find({ date: { $gte: todayStart, $lt: todayEnd } });
    const presentToday = todayAttendance.filter((a) => a.status === "Present").length;
    const attendance_rate = todayAttendance.length > 0 ? Math.round((presentToday / todayAttendance.length) * 100) : 0;

    const payload = {
      total_employees: totalEmployees,
      active_employees: activeEmployees,
      attendance_rate,
      average_salary: avgSalary,
      department_distribution,
      weekly_attendance,
      salary_distribution,
      leave_status,
      insights: [
        `${activeEmployees} active employees out of ${totalEmployees} total`,
        `Average salary is Rs. ${avgSalary.toLocaleString()}`,
        `Current attendance rate is ${attendance_rate}%`,
        `${leave_status.pending} leave requests pending approval`,
      ],
      generated_by: req.user?.username || "system",
      period_label: req.body?.period_label || "point-in-time",
    };

    const created = await AnalyticsSnapshot.create(payload);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAnalyticsSnapshots = async (req, res) => {
  try {
    const list = await AnalyticsSnapshot.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAnalyticsSnapshotById = async (req, res) => {
  try {
    const doc = await AnalyticsSnapshot.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Snapshot not found" });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
