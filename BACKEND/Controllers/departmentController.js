const Department = require("../Models/Department");
const Employee = require("../Models/Employee");

// ---------------- Generate Department ID ----------------
const generateDepartmentId = async () => {
  const last = await Department.findOne().sort({ createdAt: -1 });
  if (!last) return "DEPT001";
  const num = parseInt(last.department_id.replace("DEPT", "")) + 1;
  return "DEPT" + num.toString().padStart(3, "0");
};

// ---------------- CREATE ----------------
exports.createDepartment = async (req, res) => {
  try {
    const department_id = await generateDepartmentId();
    
    const department = new Department({
      ...req.body,
      department_id,
    });
    
    await department.save();
    
    res.status(201).json({
      message: "Department created successfully",
      department,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ---------------- READ ALL ----------------
exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
    
    // Populate employee count for each department
    const departmentsWithCount = await Promise.all(
      departments.map(async (dept) => {
        // Count employees with exact department name match (case-insensitive)
        const count = await Employee.countDocuments({ 
          department: { $regex: new RegExp(`^${dept.name}$`, 'i') }
        });
        
        console.log(`Department: ${dept.name}, Employee Count: ${count}`);
        
        return {
          ...dept.toObject(),
          employee_count: count,
        };
      })
    );
    
    res.json(departmentsWithCount);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------- READ ONE ----------------
exports.getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findOne({
      department_id: req.params.id,
    });
    
    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }
    
    // Get employee count (case-insensitive)
    const employee_count = await Employee.countDocuments({ 
      department: { $regex: new RegExp(`^${department.name}$`, 'i') }
    });
    
    res.json({
      ...department.toObject(),
      employee_count,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------- UPDATE ----------------
exports.updateDepartment = async (req, res) => {
  try {
    const updatedDepartment = await Department.findOneAndUpdate(
      { department_id: req.params.id },
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!updatedDepartment) {
      return res.status(404).json({ error: "Department not found" });
    }
    
    res.json({
      message: "Department updated successfully",
      department: updatedDepartment,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ---------------- DELETE ----------------
exports.deleteDepartment = async (req, res) => {
  try {
    const deletedDepartment = await Department.findOneAndDelete({
      department_id: req.params.id,
    });
    
    if (!deletedDepartment) {
      return res.status(404).json({ error: "Department not found" });
    }
    
    res.json({ message: "Department deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ---------------- GET DEPARTMENT STATS ----------------
exports.getDepartmentStats = async (req, res) => {
  try {
    const departments = await Department.find();
    
    const stats = await Promise.all(
      departments.map(async (dept) => {
        // Find employees with case-insensitive department match
        const employees = await Employee.find({ 
          department: { $regex: new RegExp(`^${dept.name}$`, 'i') }
        });
        const employeeCount = employees.length;
        
        // Calculate average salary
        const avgSalary = employeeCount > 0
          ? employees.reduce((sum, emp) => sum + (emp.basic_salary || 0), 0) / employeeCount
          : 0;
        
        return {
          department_id: dept.department_id,
          name: dept.name,
          employee_count: employeeCount,
          avg_salary: Math.round(avgSalary),
          head: dept.head,
          status: dept.status,
        };
      })
    );
    
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------- DEBUG: GET EMPLOYEES BY DEPARTMENT ----------------
exports.getEmployeesByDepartment = async (req, res) => {
  try {
    const { name } = req.params;
    
    // Find all employees in this department
    const employees = await Employee.find({ 
      department: { $regex: new RegExp(`^${name}$`, 'i') }
    }).select('employee_id first_name last_name department job_title');
    
    res.json({
      department: name,
      count: employees.length,
      employees: employees,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
