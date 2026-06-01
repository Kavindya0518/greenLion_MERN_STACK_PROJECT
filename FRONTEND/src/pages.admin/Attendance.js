import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import EmployeeAdminSidebar from "../components/EmployeeAdminSidebar";
import PageHeader from "../components/common/PageHeader";
import SectionCard from "../components/common/SectionCard";

function AttendancePage() {
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch attendance records from backend
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/attendance")
      .then((res) => setAttendance(res.data))
      .catch((err) => console.error("Error fetching attendance:", err));
  }, []);

  // Delete record
  const handleDelete = async (attendance_id) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/attendance/delete/${attendance_id}`
      );
      setAttendance(
        attendance.filter((att) => att.attendance_id !== attendance_id)
      );
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // Filter attendance based on search
  const filteredAttendance = attendance.filter(
    (att) =>
      att.attendance_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      att.empId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort so newest dates (including today's) appear first
  const sortedFilteredAttendance = [...filteredAttendance].sort((a, b) => {
    const da = new Date(a.date);
    const db = new Date(b.date);
    if (isNaN(da.getTime()) || isNaN(db.getTime())) return 0;
    return db - da; // descending
  });

  // Format date to DD/MM/YYYY
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr; 
    return date.toLocaleDateString("en-GB");
  };

 
  const formatTime = (timeStr) => {
    if (!timeStr) return "";

    // If it's a valid Date string
    const date = new Date(timeStr);
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    // If it's plain "HH:mm" format → return as-is
    if (/^\d{2}:\d{2}$/.test(timeStr)) {
      return timeStr;
    }

    return "";
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <EmployeeAdminSidebar />
      <div style={{ flex: 1, padding: 20, maxWidth: 1400, margin: "0 auto" }}>
        <PageHeader title="Attendance Records" subtitle="Track and manage attendance" actions={[{ label: "+ Add Attendance", primary: true, onClick: () => navigate("/add-attendance") }]} />

        <SectionCard
          title="All Records"
          actions={(
            <input
              type="text"
              placeholder="Search by Attendance ID or Employee ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", minWidth: 280 }}
            />
          )}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "white" }}>
              <thead style={{ background: "#1e293b", color: "white" }}>
                <tr>
                  <th style={thStyle}>Attendance ID</th>
                  <th style={thStyle}>Employee ID</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Check-in</th>
                  <th style={thStyle}>Check-out</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Working Hours</th>
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedFilteredAttendance.map((att, index) => (
                  <tr key={index} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={tdStyle}>{att.attendance_id}</td>
                    <td style={tdStyle}>{att.empId}</td>
                    <td style={tdStyle}>{formatDate(att.date)}</td>
                    <td style={tdStyle}>{formatTime(att.checkIn)}</td>
                    <td style={tdStyle}>{formatTime(att.checkOut)}</td>
                    <td style={{ ...tdStyle, color: att.status === "Present" ? "green" : att.status === "Absent" ? "red" : "#f59e0b", fontWeight: "bold" }}>{att.status}</td>
                    <td style={tdStyle}>{att.hours} hrs</td>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                      <button style={btnEdit} onClick={() => navigate(`/edit-attendance/${att.attendance_id}`)}>Edit</button>
                      <button style={btnDelete} onClick={() => handleDelete(att.attendance_id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {filteredAttendance.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ padding: 16, textAlign: "center", color: "#64748b" }}>No attendance records found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// Styles
const thStyle = {
  padding: "10px",
  textAlign: "left",
  fontSize: "14px",
};
const tdStyle = { padding: "10px", fontSize: "14px" };
const btnEdit = {
  background: "#f59e0b",
  color: "white",
  border: "none",
  padding: "5px 10px",
  marginRight: "5px",
  borderRadius: "5px",
  cursor: "pointer",
};
const btnDelete = {
  background: "#ef4444",
  color: "white",
  border: "none",
  padding: "5px 10px",
  borderRadius: "5px",
  cursor: "pointer",
};

export default AttendancePage;
