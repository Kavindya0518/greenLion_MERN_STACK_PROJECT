const LeaveRequest = require("../Models/LeaveRequest");
const Employee = require("../Models/Employee"); 

// ---------------- Generate Custom Leave ID ----------------
const generateLeaveId = async () => {
  const last = await LeaveRequest.findOne().sort({ createdAt: -1 });
  if (!last) return "LEAVE001";
  const num = parseInt(last.customId.replace("LEAVE", "")) + 1;
  return "LEAVE" + num.toString().padStart(3, "0");
};

// ---------------- CREATE ----------------
exports.createLeave = async (req, res) => {
  try {
    const { employeeId, ...rest } = req.body;

    // find employee by ID
    const employee = await Employee.findOne({ employee_id: employeeId });
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const customId = await generateLeaveId();

    // fill employee name automatically
    const newLeave = new LeaveRequest({
      customId,
      employeeId,
      name: `${employee.first_name} ${employee.last_name}`, 
      position: employee.job_title, 
      ...rest,
    });

    await newLeave.save();
    res.status(201).json(newLeave.toJSON());
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


// ---------------- READ ALL ----------------
exports.getAllLeaves = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find();
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------- READ ONE ----------------
exports.getLeaveById = async (req, res) => {
  try {
    const leave = await LeaveRequest.findOne({ customId: req.params.customId });
    if (!leave) return res.status(404).json({ error: "Leave not found" });
    res.json(leave);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------- UPDATE STATUS ----------------
exports.updateLeaveStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Pending", "Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const leave = await LeaveRequest.findOneAndUpdate(
      { customId: req.params.customId },
      { status },
      { new: true }
    );

    if (!leave) return res.status(404).json({ error: "Leave not found" });
    res.json(leave);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------- DELETE ----------------
exports.deleteLeave = async (req, res) => {
  try {
    const deletedLeave = await LeaveRequest.findOneAndDelete({ customId: req.params.customId });
    if (!deletedLeave) return res.status(404).json({ error: "Leave not found" });
    res.json({ message: `Leave request ${deletedLeave.customId} deleted successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// ---------------- READ MY LEAVES ----------------
exports.getMyLeaves = async (req, res) => {
  try {
    const employeeId = req.employeeId; 
    const leaves = await LeaveRequest.find({ employeeId }).sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
