const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  attendance_id: {
    type: String,
    required: true,
    unique: true
  },
  empId: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  checkIn: {
    type: String,
    default: "-"
  },
  checkOut: {
    type: String,
    default: "-"
  },
  status: {
    type: String,
    enum: ["Present", "Absent", "Half Day", "Leave"],
    default: "Present"
  },
  hours: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
