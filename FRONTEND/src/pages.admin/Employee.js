import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import EmployeeAdminSidebar from "../components/EmployeeAdminSidebar";
import PageHeader from "../components/common/PageHeader";
import SectionCard from "../components/common/SectionCard";

function EmployeeTable() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [employees, setEmployees] = useState([]);

  // Fetch employees from backend
  useEffect(() => {
  axios
    .get("http://localhost:5000/api/employee")
    .then((res) => {
      console.log("Employees:", res.data);
      setEmployees(res.data);
    })
    .catch((err) => console.error("Error fetching employees:", err));
}, []);


  // Delete employee
  const handleDelete = async (employee_id) => {
  if (window.confirm("Are you sure you want to delete this employee?")) {
    try {
      await axios.delete(`http://localhost:5000/api/employee/${employee_id}`);
      setEmployees(employees.filter((emp) => emp.employee_id !== employee_id));
      alert("Employee deleted successfully!");
    } catch (err) {
      alert(err.response?.data?.error || "Error deleting employee");
    }
  }
};

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.job_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <EmployeeAdminSidebar />
      <div style={{ flex: 1, padding: 20, maxWidth: 1400, margin: "0 auto" }}>
        <PageHeader title="Employee Information" subtitle="Manage your workforce records" actions={[{ label: "+ Add Employee", primary: true, onClick: () => navigate("/add-employee") }]} />

        <SectionCard
          title="Directory"
          actions={(
            <input
              type="text"
              placeholder="Search by ID, Name, or Job Title"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", minWidth: 240 }}
            />
          )}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#1e293b", color: "white" }}>
                <tr>
                  <th style={thStyle}>Employee ID</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Job Title</th>
                  <th style={thStyle}>Department</th>
                  <th style={thStyle}>Basic Salary</th>
                  <th style={thStyle}>Password</th>
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={tdStyle}>{emp.employee_id}</td>
                    <td style={tdStyle}>{emp.first_name} {emp.last_name}</td>
                    <td style={tdStyle}>{emp.job_title}</td>
                    <td style={tdStyle}>{emp.department || "Not Assigned"}</td>
                    <td style={tdStyle}>Rs. {(Number(emp.basic_salary) || 0).toLocaleString('en-IN')}</td>
                    <td style={tdStyle}>{emp.password}</td>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                      <button style={btnView} onClick={() => navigate(`/view-employee/${emp.employee_id}`)}>View</button>
                      <button style={btnEdit} onClick={() => navigate(`/edit-employee/${emp.employee_id}`)}>Edit</button>
                      <button style={btnDelete} onClick={() => handleDelete(emp.employee_id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ padding: 16, textAlign: "center", color: "#64748b" }}>No employees found</td>
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

const thStyle = { padding: "10px", textAlign: "left", fontSize: "14px" };
const tdStyle = { padding: "10px", fontSize: "14px" };
const btnView = { background: "#3b82f6", color: "white", border: "none", padding: "5px 10px", marginRight: "5px", borderRadius: "5px", cursor: "pointer" };
const btnEdit = { background: "#f59e0b", color: "white", border: "none", padding: "5px 10px", marginRight: "5px", borderRadius: "5px", cursor: "pointer" };
const btnDelete = { background: "#ef4444", color: "white", border: "none", padding: "5px 10px", borderRadius: "5px", cursor: "pointer" };

export default EmployeeTable;
