const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema({
  department_id: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true },
  description: { type: String },
  head: { type: String }, // Employee ID of department head
  employee_count: { type: Number, default: 0 },
  budget: { type: Number, default: 0 },
  location: { type: String },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update timestamp on save
departmentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Department", departmentSchema);
