const mongoose = require("mongoose");

const performanceSchema = new mongoose.Schema({
  employee_id: { type: String, required: true, ref: "Employee" },
  rating: { type: Number, min: 1, max: 5, required: true },
  tasks_completed: { type: Number, default: 0 },
  tasks_assigned: { type: Number, default: 0 },
  attendance_rate: { type: Number, default: 0 }, // Percentage
  review_period: { type: String }, // e.g., "Q1 2025", "January 2025"
  reviewer: { type: String }, // Employee ID of reviewer
  comments: { type: String },
  strengths: [{ type: String }],
  areas_for_improvement: [{ type: String }],
  goals: [{ type: String }],
  status: { type: String, enum: ["Draft", "Submitted", "Approved"], default: "Draft" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update timestamp on save
performanceSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster queries
performanceSchema.index({ employee_id: 1, review_period: 1 });

module.exports = mongoose.model("Performance", performanceSchema);
