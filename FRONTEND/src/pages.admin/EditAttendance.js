import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import EmployeeAdminSidebar from "../components/EmployeeAdminSidebar";

function EditAttendance() {
  const { attendance_id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    empId: "",
    date: "",
    checkIn: "",
    checkOut: "",
    status: "",
    hours: 0,
  });

  // Fetch existing record
  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/attendance/${attendance_id}`)
      .then((res) => {
        const data = res.data;
        if (data.date) {
          data.date = new Date(data.date).toISOString().split("T")[0];
        }
        setForm(data);
      })
      .catch((err) => console.error("Error fetching record:", err));
  }, [attendance_id]);

  // Handle update
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/attendance/update/${attendance_id}`, form);
      alert("Attendance updated successfully!");
      navigate("/attendance");
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
    <EmployeeAdminSidebar />

    <div style={{ flex: 1}}>
    <div style={{ marginLeft: "400px", padding: "20px", marginTop: "20px", background: "#f3f4f6", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", justifyContent: "center", width: "520px" }}>
      <h2>Edit Attendance</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: "500px" }}>
        <label>Employee ID</label>
        <input
          type="text"
          value={form.empId}
          onChange={(e) => setForm({ ...form, empId: e.target.value })}
          style={inputStyle}
        />

        <label>Date</label>
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          style={inputStyle}
        />

        <label>Check In</label>
        <input
          type="time"
          value={form.checkIn}
          onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
          style={inputStyle}
        />

        <label>Check Out</label>
        <input
          type="time"
          value={form.checkOut}
          onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
          style={inputStyle}
        />

        <label>Status</label>
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          style={inputStyle}
        >
          <option>Present</option>
          <option>Absent</option>
          <option>Leave</option>
          <option>Half Day</option>
        </select>

        <div style={{ display: "flex", gap: "10px" }}>
          <button type="submit" style={btnSave}>Update</button>
          <button
            type="button"
            style={btnCancel}
            onClick={() => navigate("/attendance")}
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

const inputStyle = {
  width: "100%",
  padding: "8px",
  marginBottom: "10px",
  borderRadius: "5px",
  border: "1px solid #ccc",
};

const btnSave = {
  background: "#16a34a",
  color: "white",
  border: "none",
  padding: "10px 15px",
  borderRadius: "5px",
  cursor: "pointer",
};

const btnCancel = {
  background: "#ef4444",
  color: "white",
  border: "none",
  padding: "10px 15px",
  borderRadius: "5px",
  cursor: "pointer",
};

export default EditAttendance;
