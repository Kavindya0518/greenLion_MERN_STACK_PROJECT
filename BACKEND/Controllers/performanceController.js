const Performance = require("../Models/Performance");
const Employee = require("../Models/Employee");
const Attendance = require("../Models/Attendance");

// ---------------- CREATE ----------------
exports.createPerformance = async (req, res) => {
  try {
    const performance = new Performance(req.body);
    await performance.save();
    
    res.status(201).json({
      message: "Performance record created successfully",
      performance,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ---------------- READ ALL ----------------
exports.getAllPerformance = async (req, res) => {
  try {
    const performances = await Performance.find();
    
    // Populate employee details
    const performancesWithDetails = await Promise.all(
      performances.map(async (perf) => {
        const employee = await Employee.findOne({ employee_id: perf.employee_id });
        return {
          ...perf.toObject(),
          employee_name: employee ? `${employee.first_name} ${employee.last_name}` : "Unknown",
          job_title: employee ? employee.job_title : "N/A",
        };
      })
    );
    
    res.json(performancesWithDetails);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------- READ BY EMPLOYEE ----------------
exports.getPerformanceByEmployee = async (req, res) => {
  try {
    const performances = await Performance.find({
      employee_id: req.params.employee_id,
    }).sort({ createdAt: -1 });
    
    res.json(performances);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------- UPDATE ----------------
exports.updatePerformance = async (req, res) => {
  try {
    console.log("Updating performance ID:", req.params.id);
    console.log("Update data:", req.body);
    
    const updatedPerformance = await Performance.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!updatedPerformance) {
      console.log("Performance record not found:", req.params.id);
      return res.status(404).json({ error: "Performance record not found" });
    }
    
    console.log("Performance updated successfully:", updatedPerformance);
    
    res.json({
      message: "Performance record updated successfully",
      performance: updatedPerformance,
    });
  } catch (err) {
    console.error("Error updating performance:", err);
    res.status(400).json({ error: err.message });
  }
};

// ---------------- DELETE ----------------
exports.deletePerformance = async (req, res) => {
  try {
    const deletedPerformance = await Performance.findByIdAndDelete(req.params.id);
    
    if (!deletedPerformance) {
      return res.status(404).json({ error: "Performance record not found" });
    }
    
    res.json({ message: "Performance record deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ---------------- GET PERFORMANCE SUMMARY ----------------
exports.getPerformanceSummary = async (req, res) => {
  try {
    const performances = await Performance.find();
    
    // Calculate summary statistics
    const totalRecords = performances.length;
    const avgRating = totalRecords > 0
      ? performances.reduce((sum, p) => sum + p.rating, 0) / totalRecords
      : 0;
    
    const ratingDistribution = {
      excellent: performances.filter(p => p.rating >= 4.5).length,
      good: performances.filter(p => p.rating >= 3.5 && p.rating < 4.5).length,
      average: performances.filter(p => p.rating >= 2.5 && p.rating < 3.5).length,
      poor: performances.filter(p => p.rating < 2.5).length,
    };
    
    res.json({
      total_records: totalRecords,
      average_rating: Math.round(avgRating * 10) / 10,
      rating_distribution: ratingDistribution,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------- GET PERFORMANCE DATA (with actual records) ----------------
exports.getPerformanceData = async (req, res) => {
  try {
    // Get all performance records
    const performances = await Performance.find().sort({ createdAt: -1 });
    
    // Map performance records with employee data
    const performanceData = await Promise.all(
      performances.map(async (perf) => {
        // Get employee details
        const employee = await Employee.findOne({ employee_id: perf.employee_id });
        
        if (!employee) {
          return null; // Skip if employee not found
        }
        
        // Get attendance rate if not in performance record
        let attendanceRate = perf.attendance_rate;
        if (!attendanceRate) {
          const attendanceRecords = await Attendance.find({ 
            empId: employee.employee_id 
          }).limit(30);
          
          const presentDays = attendanceRecords.filter(a => a.status === "Present").length;
          attendanceRate = attendanceRecords.length > 0
            ? Math.round((presentDays / attendanceRecords.length) * 100)
            : 0;
        }
        
        return {
          _id: perf._id,
          employee_id: employee.employee_id,
          first_name: employee.first_name,
          last_name: employee.last_name,
          name: `${employee.first_name} ${employee.last_name}`,
          job_title: employee.job_title,
          rating: perf.rating,
          tasks_completed: perf.tasks_completed || 0,
          tasks_assigned: perf.tasks_assigned || 0,
          attendance_rate: attendanceRate,
          review_period: perf.review_period,
          comments: perf.comments,
          createdAt: perf.createdAt,
        };
      })
    );
    
    // Filter out null values (employees not found)
    const validData = performanceData.filter(data => data !== null);
    
    res.json(validData);
  } catch (err) {
    console.error("Error fetching performance data:", err);
    res.status(500).json({ error: err.message });
  }
};
