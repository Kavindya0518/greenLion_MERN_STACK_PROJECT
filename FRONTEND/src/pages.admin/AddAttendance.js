import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import EmployeeAdminSidebar from "../components/EmployeeAdminSidebar";

function AddAttendance() {
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState({
    empId: "",
    date: "",
    checkIn: "",
    checkOut: "",
    status: "Present",
  });

  const handleChange = (e) => {
    setAttendance({ ...attendance, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/attendance/add", attendance);
      console.log("Attendance saved:", res.data);
      alert("Attendance record added!");
      navigate("/attendance");
    } catch (err) {
      console.error("Error saving attendance:", err);
      alert("Failed to add attendance. Check console for details.");
    }
  };

  const handleCancel = () => {
    navigate("/attendance");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
    <EmployeeAdminSidebar />

    <div style={{ flex: 1 }}>
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        paddingTop: "50px",
        background: "#f3f4f6",
        minHeight: "100vh",
        marginTop:"10px"
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "white",
          padding: "30px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: "500px",
          height: "600px"
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          Add Attendance
        </h2>

        {/* Employee ID */}
        <div style={formGroup}>
          <label style={labelStyle}>Employee ID</label>
          <input
            type="text"
            name="empId"
            value={attendance.empId}
            onChange={handleChange}
            style={inputStyle}
            required
          />
        </div>

        {/* Date */}
        <div style={formGroup}>
          <label style={labelStyle}>Date</label>
          <input
            type="date"
            name="date"
            value={attendance.date}
            onChange={handleChange}
            required
            min={new Date().toISOString().split("T")[0]}
            style={inputStyle}
          />
        </div>

        {/* Check-in */}
        <div style={formGroup}>
          <label style={labelStyle}>Check-in</label>
          <input
            type="time"
            name="checkIn"
            value={attendance.checkIn}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        {/* Check-out */}
        <div style={formGroup}>
          <label style={labelStyle}>Check-out</label>
          <input
            type="time"
            name="checkOut"
            value={attendance.checkOut}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        {/* Status */}
        <div style={formGroup}>
          <label style={labelStyle}>Status</label>
          <select
            name="status"
            value={attendance.status}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Half Day">Half Day</option>
            <option value="Leave">Leave</option>
          </select>
        </div>

        {/* Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "20px",
          }}
        >
          <button
            type="submit"
            style={btnSave}
          >
            Save Attendance
          </button>
          <button
            type="button"
            onClick={handleCancel}
            style={btnCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
    </div>
    </div>
  );
}

// Styles
const formGroup = { marginBottom: "15px" };
const labelStyle = { display: "block", marginBottom: "5px", fontWeight: "bold" };
const inputStyle = { width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "5px" };
const btnSave = { background: "#16a34a", color: "white", border: "none", padding: "10px 20px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" };
const btnCancel = { background: "#ef4444", color: "white", border: "none", padding: "10px 20px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" };

export default AddAttendance;
