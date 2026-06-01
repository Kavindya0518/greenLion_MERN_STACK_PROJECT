import React, { useState, useEffect } from "react";
import axios from "axios";
import EmployeeAdminSidebar from "../components/EmployeeAdminSidebar";
import { FaUsers, FaPlus, FaEdit, FaTrash } from "react-icons/fa";

function EmployeeDepartments() {
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentDept, setCurrentDept] = useState({ name: "", head: "", employeeCount: 0 });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/departments");
      setDepartments(res.data);
    } catch (err) {
      console.error("Error fetching departments:", err);
      // Mock data for demonstration
      setDepartments([
        { _id: "1", name: "Human Resources", head: "John Doe", employeeCount: 12 },
        { _id: "2", name: "Production", head: "Jane Smith", employeeCount: 45 },
        { _id: "3", name: "Quality Control", head: "Mike Johnson", employeeCount: 8 },
        { _id: "4", name: "Sales & Marketing", head: "Sarah Williams", employeeCount: 15 },
        { _id: "5", name: "Finance", head: "Robert Brown", employeeCount: 6 },
      ]);
    }
  };

  const handleAddDepartment = () => {
    setEditMode(false);
    setCurrentDept({ name: "", head: "", employeeCount: 0 });
    setShowModal(true);
  };

  const handleEditDepartment = (dept) => {
    setEditMode(true);
    setCurrentDept(dept);
    setShowModal(true);
  };

  const handleSaveDepartment = async () => {
    try {
      if (editMode) {
        // Use department_id for update
        await axios.put(`http://localhost:5000/api/departments/${currentDept.department_id}`, currentDept);
        alert("Department updated successfully!");
      } else {
        await axios.post("http://localhost:5000/api/departments", currentDept);
        alert("Department created successfully!");
      }
      fetchDepartments();
      setShowModal(false);
    } catch (err) {
      console.error("Error saving department:", err);
      alert("Error saving department: " + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteDepartment = async (deptId) => {
    if (window.confirm("Are you sure you want to delete this department?")) {
      try {
        await axios.delete(`http://localhost:5000/api/departments/${deptId}`);
        alert("Department deleted successfully!");
        fetchDepartments();
      } catch (err) {
        console.error("Error deleting department:", err);
        alert("Error deleting department: " + (err.response?.data?.error || err.message));
      }
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <EmployeeAdminSidebar />

      <div style={{ flex: 1, padding: "24px" }}>
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>
            🏢 Department Management
          </h2>
          <p style={{ color: "#64748b", fontSize: "14px" }}>
            Manage organizational departments and their structure
          </p>
        </div>

        <button
          onClick={handleAddDepartment}
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
          <FaPlus /> Add New Department
        </button>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "20px",
        }}>
          {departments.map((dept) => (
            <div
              key={dept.department_id || dept._id}
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                transition: "all 0.3s ease",
                border: "1px solid #e2e8f0",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1e293b", margin: 0 }}>
                  {dept.name}
                </h3>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => handleEditDepartment(dept)}
                    style={{
                      background: "#f59e0b",
                      color: "white",
                      border: "none",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDeleteDepartment(dept.department_id)}
                    style={{
                      background: "#ef4444",
                      color: "white",
                      border: "none",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0" }}>
                  <strong>Department Head:</strong> {dept.head || "Not Assigned"}
                </p>
              </div>

              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px",
                background: "#f1f5f9",
                borderRadius: "8px",
              }}>
                <FaUsers color="#10b981" size={20} />
                <span style={{ fontSize: "14px", color: "#334155", fontWeight: "600" }}>
                  {dept.employee_count || dept.employeeCount || 0} Employees
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
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
              maxWidth: "500px",
              boxShadow: "0 20px 25px rgba(0,0,0,0.2)",
            }}>
              <h3 style={{ marginBottom: "24px", fontSize: "20px", fontWeight: "600" }}>
                {editMode ? "Edit Department" : "Add New Department"}
              </h3>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "14px" }}>
                  Department Name
                </label>
                <input
                  type="text"
                  value={currentDept.name}
                  onChange={(e) => setCurrentDept({ ...currentDept, name: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "14px" }}>
                  Department Head
                </label>
                <input
                  type="text"
                  value={currentDept.head}
                  onChange={(e) => setCurrentDept({ ...currentDept, head: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <button
                  onClick={handleSaveDepartment}
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
                  Save
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

export default EmployeeDepartments;
