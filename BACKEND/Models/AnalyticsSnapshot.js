const mongoose = require("mongoose");

const AnalyticsSnapshotSchema = new mongoose.Schema(
  {
    // High-level KPIs
    total_employees: { type: Number, default: 0 },
    active_employees: { type: Number, default: 0 },
    attendance_rate: { type: Number, default: 0 }, // %
    average_salary: { type: Number, default: 0 },

    // Aggregates
    department_distribution: [
      {
        department: { type: String },
        count: { type: Number, default: 0 },
      },
    ],

    salary_distribution: [
      {
        range: { type: String },
        count: { type: Number, default: 0 },
      },
    ],

    leave_status: {
      pending: { type: Number, default: 0 },
      approved: { type: Number, default: 0 },
      rejected: { type: Number, default: 0 },
    },

    weekly_attendance: [
      {
        day: { type: String },
        rate: { type: Number, default: 0 },
      },
    ],

    // Optional notes/insights
    insights: [{ type: String }],

    // Meta
    generated_by: { type: String, default: "system" },
    period_label: { type: String, default: "point-in-time" }, // e.g., "2025-10", "Q3-2025"
  },
  { timestamps: true }
);

module.exports = mongoose.model("AnalyticsSnapshot", AnalyticsSnapshotSchema);
