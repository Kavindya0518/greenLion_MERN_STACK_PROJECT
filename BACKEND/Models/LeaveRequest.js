const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema({
  customId: String,
  employeeId: String,
  name: String,
  position: String,
  description: String,
  type: String,
  from: Date,
  to: Date,
  status: { type: String, default: "Pending" }
}, { timestamps: true });

module.exports = mongoose.model("LeaveRequest", leaveSchema);
