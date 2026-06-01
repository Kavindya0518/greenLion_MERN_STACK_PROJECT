// models/Salary.js
const mongoose = require("mongoose");

const salarySchema = new mongoose.Schema({
  salaryId: { type: String, required: true, unique: true },
  empId: { type: String, required: true },
  name: { type: String, required: true },
  month: { type: String, required: true },
  year: { type: String, required: true },
  basic: { type: Number, required: true },
  allowance: { type: Number, required: true }, 
  deduction: { type: Number, required: true }, 
  net: { type: Number, required: true },
  status: { type: String, enum: ["Pending", "Paid"], default: "Pending" },
  date: { type: String, default: "-" },
}, { timestamps: true });

module.exports = mongoose.model("Salary", salarySchema);
