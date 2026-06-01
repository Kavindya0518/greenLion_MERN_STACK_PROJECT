const Employee = require("../Models/Employee");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

// ---------------- Generate Employee ID ----------------
const generateEmployeeId = async () => {
  const last = await Employee.findOne().sort({ createdAt: -1 });
  if (!last) return "EMP001";
  const num = parseInt(last.employee_id.replace("EMP", "")) + 1;
  return "EMP" + num.toString().padStart(3, "0");
};

// ---------------- Generate Random Password ----------------
const generatePassword = () => {
  return crypto.randomBytes(4).toString("hex"); // 8-char password
};

// ---------------- CREATE ----------------
exports.createEmployee = async (req, res) => {
  try {
    const employee_id = await generateEmployeeId();
    const password = generatePassword();

    const employeeData = {
      ...req.body,
      employee_id,
      password,
    };

    if (req.file) {
      employeeData.profileImage = req.file.filename; 
    }

    const employee = new Employee(employeeData);
    await employee.save();

    res.status(201).json({
      message: "Employee added successfully",
      employee,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ---------------- READ ALL ----------------
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------- READ ONE ----------------
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      employee_id: req.params.employee_id,
    });
    if (!employee) return res.status(404).json({ error: "Employee not found" });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------- UPDATE ----------------
exports.updateEmployee = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file) {
      updateData.profileImage = req.file.filename; 
    }

    const updatedEmployee = await Employee.findOneAndUpdate(
      { employee_id: req.params.employee_id },
      updateData,
      { new: true }
    );

    if (!updatedEmployee)
      return res.status(404).json({ error: "Employee not found" });

    res.json({
      message: "Employee updated successfully",
      employee: updatedEmployee,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ---------------- DELETE ----------------
exports.deleteEmployee = async (req, res) => {
  try {
    const deletedEmployee = await Employee.findOneAndDelete({
      employee_id: req.params.employee_id,
    });
    if (!deletedEmployee)
      return res.status(404).json({ error: "Employee not found" });
    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ---------------- COUNT ----------------
exports.getEmployeeCount = async (req, res) => {
  try {
    const count = await Employee.countDocuments();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
// ---------------- LOGIN ----------------
exports.loginEmployee = async (req, res) => {
  try {
    const { employee_id, password } = req.body;

    if (!employee_id || !password) {
      return res.status(400).json({ ok: false, message: "Employee ID and password required" });
    }

    const employee = await Employee.findOne({ employee_id });

    if (!employee) {
      return res.status(401).json({ ok: false, message: "Invalid credentials" });
    }

    if (employee.password !== password) { 
      return res.status(401).json({ ok: false, message: "Invalid credentials" });
    }

    // Create JWT token with consistent format
    const token = jwt.sign(
      { id: employee.employee_id, role: "employee" },
      process.env.JWT_SECRET || "your_jwt_secret_key",
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.json({
      ok: true,
      message: "Login successful",
      token,
      user: {
        id: employee.employee_id,
        name: employee.name,
        email: employee.email,
        role: "employee",
      },
      employeeId: employee.employee_id,
    });
  } catch (err) {
    console.error("Employee login error:", err);
    res.status(500).json({ ok: false, message: "Login failed" });
  }
};

// ---------------- GET LOGGED IN EMPLOYEE ----------------
exports.getMe = async (req, res) => {
  try {
    const employee = await Employee.findOne({ employee_id: req.employeeId });
    if (!employee) return res.status(404).json({ error: "Employee not found" });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
