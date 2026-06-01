import React, { useState, useEffect } from "react";
import axios from "axios";
import EmployeeAdminSidebar from "../components/EmployeeAdminSidebar";
import { FaStar, FaAward, FaChartLine, FaPlus, FaEdit, FaTrash } from "react-icons/fa";

function EmployeePerformance() {
  const [employees, setEmployees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRating, setFilterRating] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentPerformance, setCurrentPerformance] = useState({
    _id: null,
    employee_id: "",
    rating: 5,
    tasks_completed: 0,
    tasks_assigned: 0,
    attendance_rate: 0,
    review_period: "",
    comments: "",
  });

  useEffect(() => {
    fetchPerformanceData();
    fetchAllEmployees();
  }, []);

  const fetchAllEmployees = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/employee");
      setAllEmployees(res.data);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/performance/data");
      console.log("Performance data received:", res.data);
      setEmployees(res.data);
    } catch (err) {
      console.error("Error fetching performance data:", err);
      setEmployees([]); // Set empty array on error
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRating = filterRating === "all" || 
      (filterRating === "excellent" && emp.rating >= 4.5) ||
      (filterRating === "good" && emp.rating >= 4.0 && emp.rating < 4.5) ||
      (filterRating === "average" && emp.rating < 4.0);

    return matchesSearch && matchesRating;
  });

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return "#10b981";
    if (rating >= 4.0) return "#3b82f6";
    if (rating >= 3.5) return "#f59e0b";
    return "#ef4444";
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FaStar
          key={i}
          color={i <= Math.floor(rating) ? "#fbbf24" : "#cbd5e1"}
          size={16}
        />
      );
    }
    return stars;
  };

  const handleAddRating = () => {
    setEditMode(false);
    setCurrentPerformance({
      _id: null,
      employee_id: "",
      rating: 5,
      tasks_completed: 0,
      tasks_assigned: 0,
      attendance_rate: 0,
      review_period: new Date().toISOString().slice(0, 7), // Current month
      comments: "",
    });
    setShowModal(true);
  };

  const handleEditRating = (emp) => {
    console.log("Edit rating for:", emp);
    setEditMode(true);
    setCurrentPerformance({
      _id: emp._id,
      employee_id: emp.employee_id,
      rating: emp.rating,
      tasks_completed: emp.tasks_completed || 0,
      tasks_assigned: emp.tasks_assigned || 0,
      attendance_rate: emp.attendance_rate || 0,
      review_period: emp.review_period || new Date().toISOString().slice(0, 7),
      comments: emp.comments || "",
    });
    setShowModal(true);
  };

  const handleSaveRating = async () => {
    try {
      if (!currentPerformance.employee_id) {
        alert("Please select an employee");
        return;
      }

      console.log("Saving performance:", currentPerformance);
      console.log("Edit mode:", editMode);

      if (editMode && currentPerformance._id) {
        // Update existing performance
        console.log("Updating performance ID:", currentPerformance._id);
        const response = await axios.put(
          `http://localhost:5000/api/performance/${currentPerformance._id}`, 
          currentPerformance
        );
        console.log("Update response:", response.data);
        alert("Performance rating updated successfully!");
      } else {
        // Create new performance
        console.log("Creating new performance");
        const response = await axios.post("http://localhost:5000/api/performance", currentPerformance);
        console.log("Create response:", response.data);
        alert("Performance rating created successfully!");
      }
      
      // Close modal first
      setShowModal(false);
      
      // Wait a moment then refresh data
      setTimeout(() => {
        console.log("Refreshing performance data...");
        fetchPerformanceData();
      }, 300);
      
    } catch (err) {
      console.error("Error saving rating:", err);
      alert("Error saving rating: " + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteRating = async (performanceId, employeeName) => {
    if (window.confirm(`Are you sure you want to delete the performance rating for ${employeeName}?`)) {
      try {
        console.log("Deleting performance ID:", performanceId);
        await axios.delete(`http://localhost:5000/api/performance/${performanceId}`);
        alert("Performance rating deleted successfully!");
        
        // Refresh data
        setTimeout(() => {
          fetchPerformanceData();
        }, 300);
      } catch (err) {
        console.error("Error deleting rating:", err);
        alert("Error deleting rating: " + (err.response?.data?.error || err.message));
      }
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <EmployeeAdminSidebar />

      <div style={{ flex: 1, padding: "24px" }}>
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>
            📈 Employee Performance
          </h2>
          <p style={{ color: "#64748b", fontSize: "14px" }}>
            Track and evaluate employee performance metrics
          </p>
        </div>

        {/* Performance Summary Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}>
          <div style={{
            background: "linear-gradient(135deg, #10b981, #059669)",
            padding: "24px",
            borderRadius: "12px",
            color: "white",
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
          }}>
            <FaAward size={32} style={{ marginBottom: "12px" }} />
            <h3 style={{ fontSize: "32px", fontWeight: "700", margin: "8px 0" }}>
              {employees.filter(e => e.rating >= 4.5).length}
            </h3>
            <p style={{ fontSize: "14px", opacity: 0.9 }}>Top Performers</p>
          </div>

          <div style={{
            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
            padding: "24px",
            borderRadius: "12px",
            color: "white",
            boxShadow: "0 4px 12px rgba(59, 130, 246, 0.2)",
          }}>
            <FaChartLine size={32} style={{ marginBottom: "12px" }} />
            <h3 style={{ fontSize: "32px", fontWeight: "700", margin: "8px 0" }}>
              {employees.length > 0 ? (employees.reduce((sum, e) => sum + e.rating, 0) / employees.length).toFixed(1) : "0.0"}
            </h3>
            <p style={{ fontSize: "14px", opacity: 0.9 }}>Average Rating</p>
          </div>

          <div style={{
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            padding: "24px",
            borderRadius: "12px",
            color: "white",
            boxShadow: "0 4px 12px rgba(245, 158, 11, 0.2)",
          }}>
            <FaStar size={32} style={{ marginBottom: "12px" }} />
            <h3 style={{ fontSize: "32px", fontWeight: "700", margin: "8px 0" }}>
              {employees.length > 0 ? Math.round(employees.reduce((sum, e) => sum + (e.attendance_rate || e.attendance || 0), 0) / employees.length) : 0}%
            </h3>
            <p style={{ fontSize: "14px", opacity: 0.9 }}>Avg Attendance</p>
          </div>
        </div>

        {/* Add Rating Button */}
        <button
          onClick={handleAddRating}
          style={{
            background: "linear-gradient(135deg, #10b981, #059669)",
            color: "white",
            border: "none",
            padding: "12px 24px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "24px",
            boxShadow: "0 4px 6px rgba(16, 185, 129, 0.2)",
          }}
        >
          <FaPlus /> Add Performance Rating
        </button>

        {/* Filters */}
        <div style={{
          display: "flex",
          gap: "12px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}>
          <input
            type="text"
            placeholder="Search by ID or Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: "1 1 300px",
              padding: "10px 16px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "14px",
            }}
          />
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            <option value="all">All Ratings</option>
            <option value="excellent">Excellent (4.5+)</option>
            <option value="good">Good (4.0-4.5)</option>
            <option value="average">Average (&lt;4.0)</option>
          </select>
        </div>

        {/* Performance Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "white",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}>
            <thead style={{ background: "#1e293b", color: "white" }}>
              <tr>
                <th style={{ padding: "16px", textAlign: "left", fontSize: "14px", fontWeight: "600" }}>Employee ID</th>
                <th style={{ padding: "16px", textAlign: "left", fontSize: "14px", fontWeight: "600" }}>Name</th>
                <th style={{ padding: "16px", textAlign: "left", fontSize: "14px", fontWeight: "600" }}>Job Title</th>
                <th style={{ padding: "16px", textAlign: "center", fontSize: "14px", fontWeight: "600" }}>Rating</th>
                <th style={{ padding: "16px", textAlign: "center", fontSize: "14px", fontWeight: "600" }}>Tasks Completed</th>
                <th style={{ padding: "16px", textAlign: "center", fontSize: "14px", fontWeight: "600" }}>Attendance %</th>
                <th style={{ padding: "16px", textAlign: "center", fontSize: "14px", fontWeight: "600" }}>Status</th>
                <th style={{ padding: "16px", textAlign: "center", fontSize: "14px", fontWeight: "600" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                    <div style={{ fontSize: "16px", marginBottom: "8px" }}>No performance records found</div>
                    <div style={{ fontSize: "14px" }}>Click "Add Performance Rating" to create your first rating</div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp, index) => (
                  <tr
                    key={emp.employee_id}
                    style={{
                      borderBottom: "1px solid #e2e8f0",
                      background: index % 2 === 0 ? "white" : "#f9fafb",
                    }}
                  >
                    <td style={{ padding: "16px", fontSize: "14px" }}>{emp.employee_id}</td>
                    <td style={{ padding: "16px", fontSize: "14px", fontWeight: "500" }}>
                      {emp.first_name} {emp.last_name}
                    </td>
                    <td style={{ padding: "16px", fontSize: "14px", color: "#64748b" }}>{emp.job_title}</td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                      <div style={{ display: "flex", gap: "2px" }}>
                        {renderStars(emp.rating)}
                      </div>
                      <span style={{ fontSize: "14px", fontWeight: "600", color: getRatingColor(emp.rating) }}>
                        {emp.rating}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "16px", textAlign: "center", fontSize: "14px", fontWeight: "600" }}>
                    {emp.tasks_completed || emp.tasksCompleted || 0}
                  </td>
                  <td style={{ padding: "16px", textAlign: "center", fontSize: "14px", fontWeight: "600" }}>
                    {emp.attendance_rate || emp.attendance || 0}%
                  </td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <span style={{
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "600",
                      background: emp.rating >= 4.5 ? "#d1fae5" : emp.rating >= 4.0 ? "#dbeafe" : "#fed7aa",
                      color: emp.rating >= 4.5 ? "#065f46" : emp.rating >= 4.0 ? "#1e40af" : "#92400e",
                    }}>
                      {emp.rating >= 4.5 ? "Excellent" : emp.rating >= 4.0 ? "Good" : "Average"}
                    </span>
                  </td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                      <button
                        onClick={() => handleEditRating(emp)}
                        style={{
                          background: "#f59e0b",
                          color: "white",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "600",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <FaEdit /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRating(emp._id, `${emp.first_name} ${emp.last_name}`)}
                        style={{
                          background: "#ef4444",
                          color: "white",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "600",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>

        {/* Rating Modal */}
        {showModal && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}>
            <div style={{
              background: "white",
              borderRadius: "12px",
              padding: "32px",
              width: "90%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px rgba(0,0,0,0.2)",
            }}>
              <h3 style={{ marginBottom: "24px", fontSize: "20px", fontWeight: "600" }}>
                {editMode ? "Edit Performance Rating" : "Add Performance Rating"}
              </h3>

              {/* Employee Selection */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "14px" }}>
                  Employee *
                </label>
                <select
                  value={currentPerformance.employee_id}
                  onChange={(e) => setCurrentPerformance({ ...currentPerformance, employee_id: e.target.value })}
                  disabled={editMode}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    background: editMode ? "#f1f5f9" : "white",
                  }}
                >
                  <option value="">Select Employee</option>
                  {allEmployees.map((emp) => (
                    <option key={emp.employee_id} value={emp.employee_id}>
                      {emp.employee_id} - {emp.first_name} {emp.last_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "14px" }}>
                  Rating (1-5) *
                </label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.1"
                    value={currentPerformance.rating}
                    onChange={(e) => setCurrentPerformance({ ...currentPerformance, rating: parseFloat(e.target.value) })}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: "18px", fontWeight: "600", minWidth: "40px" }}>
                    {currentPerformance.rating}
                  </span>
                  <div style={{ display: "flex", gap: "2px" }}>
                    {renderStars(currentPerformance.rating)}
                  </div>
                </div>
              </div>

              {/* Tasks */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "14px" }}>
                    Tasks Completed
                  </label>
                  <input
                    type="number"
                    value={currentPerformance.tasks_completed}
                    onChange={(e) => setCurrentPerformance({ ...currentPerformance, tasks_completed: parseInt(e.target.value) || 0 })}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "14px" }}>
                    Tasks Assigned
                  </label>
                  <input
                    type="number"
                    value={currentPerformance.tasks_assigned}
                    onChange={(e) => setCurrentPerformance({ ...currentPerformance, tasks_assigned: parseInt(e.target.value) || 0 })}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>

              {/* Attendance Rate */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "14px" }}>
                  Attendance Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={currentPerformance.attendance_rate}
                  onChange={(e) => setCurrentPerformance({ ...currentPerformance, attendance_rate: parseInt(e.target.value) || 0 })}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                  }}
                />
              </div>

              {/* Review Period */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "14px" }}>
                  Review Period
                </label>
                <input
                  type="month"
                  value={currentPerformance.review_period}
                  onChange={(e) => setCurrentPerformance({ ...currentPerformance, review_period: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                  }}
                />
              </div>

              {/* Comments */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "14px" }}>
                  Comments
                </label>
                <textarea
                  value={currentPerformance.comments}
                  onChange={(e) => setCurrentPerformance({ ...currentPerformance, comments: e.target.value })}
                  rows="3"
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    resize: "vertical",
                  }}
                  placeholder="Enter performance comments..."
                />
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <button
                  onClick={handleSaveRating}
                  style={{
                    flex: 1,
                    background: "#10b981",
                    color: "white",
                    border: "none",
                    padding: "12px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Save Rating
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    background: "#64748b",
                    color: "white",
                    border: "none",
                    padding: "12px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeePerformance;
