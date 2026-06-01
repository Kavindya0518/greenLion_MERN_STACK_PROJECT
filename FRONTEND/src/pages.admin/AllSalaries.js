import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import EmployeeAdminSidebar from "../components/EmployeeAdminSidebar";
import PageHeader from "../components/common/PageHeader";
import SectionCard from "../components/common/SectionCard";

function SalaryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showPending, setShowPending] = useState(false);
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch all salaries (from DB, no month/year filter)
  const fetchAllSalaries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/salaries/all");
      setSalaries(res.data);
    } catch (err) {
      console.error("Error fetching salaries:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAllSalaries();
  }, [fetchAllSalaries]);

  // Filter salaries
  const filteredSalaries = salaries.filter((sal) => {
    const matchesSearch =
      sal.empId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sal.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPending = showPending ? sal.status === "Pending" : true;
    return matchesSearch && matchesPending;
  });

  // Mark salary as paid
  const handlePaySalary = async (salaryId) => {
    try {
      await axios.patch(`http://localhost:5000/api/salaries/pay/${salaryId}`);
      fetchAllSalaries();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete salary with confirmation
  const handleDeleteSalary = async (salaryId) => {
    if (!window.confirm("Are you sure you want to delete this salary record?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/salaries/${salaryId}`);
      fetchAllSalaries();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <EmployeeAdminSidebar />
      <div style={{ flex: 1, padding: 20, maxWidth: 1400, margin: "0 auto" }}>
        <PageHeader
          title="All Salaries"
          subtitle="Browse and manage all generated salaries"
          actions={[
            {
              label: "Generate Salary",
              primary: true,
              onClick: () => navigate("/salary"),
            },
          ]}
        />

        <SectionCard
          title="Salaries"
          actions={
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Search by Employee ID or Name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  minWidth: 240,
                }}
              />
              <button
                onClick={() => setShowPending(!showPending)}
                style={{
                  padding: "8px 16px",
                  background: showPending ? "#f59e0b" : "#16a34a",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {showPending ? "Show All" : "Pending Only"}
              </button>
            </div>
          }
        >
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                background: "white",
              }}
            >
              <thead style={{ background: "#1e293b", color: "white" }}>
                <tr>
                  <th style={thStyle}>Salary ID</th>
                  <th style={thStyle}>Employee ID</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Month</th>
                  <th style={thStyle}>Year</th>
                  <th style={thStyle}>Basic Salary</th>
                  <th style={thStyle}>Allowance</th>
                  <th style={thStyle}>Deductions</th>
                  <th style={thStyle}>Net Salary</th>
                  <th style={thStyle}>Payment Status</th>
                  <th style={thStyle}>Payment Date</th>
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="12"
                      style={{
                        textAlign: "center",
                        padding: 16,
                        color: "#64748b",
                      }}
                    >
                      Loading salaries...
                    </td>
                  </tr>
                ) : filteredSalaries.length === 0 ? (
                  <tr>
                    <td
                      colSpan="12"
                      style={{
                        textAlign: "center",
                        padding: 16,
                        color: "#64748b",
                      }}
                    >
                      No salary records found
                    </td>
                  </tr>
                ) : (
                  filteredSalaries.map((sal, index) => (
                    <tr key={index} style={{ borderBottom: "1px solid #ddd" }}>
                      <td style={tdStyle}>{sal.salaryId}</td>
                      <td style={tdStyle}>{sal.empId}</td>
                      <td style={tdStyle}>{sal.name}</td>
                      <td style={tdStyle}>{sal.month}</td>
                      <td style={tdStyle}>{sal.year}</td>
                      <td style={tdStyle}>Rs. {(Number(sal.basic) || 0).toLocaleString('en-IN')}</td>
                      <td style={tdStyle}>Rs. {(Number(sal.allowance) || 0).toLocaleString('en-IN')}</td>
                      <td style={tdStyle}>Rs. {(Number(sal.deduction) || 0).toLocaleString('en-IN')}</td>
                      <td style={{ ...tdStyle, fontWeight: "bold" }}>
                        Rs. {(Number(sal.net) || 0).toLocaleString('en-IN')}
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          color: sal.status === "Paid" ? "green" : "red",
                          fontWeight: "bold",
                        }}
                      >
                        {sal.status}
                      </td>
                      <td style={tdStyle}>{sal.date}</td>
                      <td style={tdStyle}>
                        <button
                          style={btnDelete}
                          onClick={() => handleDeleteSalary(sal.salaryId)}
                        >
                          Delete
                        </button>
                        {sal.status === "Pending" && (
                          <button
                            style={btnGreen}
                            onClick={() => handlePaySalary(sal.salaryId)}
                          >
                            Mark as Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
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
const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  background: "white",
  borderRadius: "8px",
  overflow: "hidden",
  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  marginBottom: "20px",
};
const thStyle = { padding: "10px", textAlign: "left", fontSize: "14px" };
const tdStyle = { padding: "10px", fontSize: "14px" };
const btnDelete = {
  background: "#ef4444",
  color: "white",
  border: "none",
  padding: "5px 10px",
  borderRadius: "5px",
  cursor: "pointer",
  marginRight: "5px",
};
const btnGreen = {
  background: "#16a34a",
  color: "white",
  border: "none",
  padding: "6px 12px",
  borderRadius: "5px",
  cursor: "pointer",
};

export default SalaryPage;
