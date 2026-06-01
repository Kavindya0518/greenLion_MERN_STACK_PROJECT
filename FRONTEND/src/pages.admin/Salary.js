import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import EmployeeAdminSidebar from "../components/EmployeeAdminSidebar";
import PageHeader from "../components/common/PageHeader";
import SectionCard from "../components/common/SectionCard";

function SalaryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showPending, setShowPending] = useState(false);
  const [salaries, setSalaries] = useState([]);
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];
  const availableYears = ["2024", "2025", "2026","2027","2028"];

  // Fetch & generate salaries for selected month/year
  const fetchSalaries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/salaries?month=${month}&year=${year}`);
      setSalaries(res.data);
    } catch (err) {
      console.error("Error fetching salaries:", err);
      setSalaries([]);
    }
    setLoading(false);
  }, [month, year]);

  // Automatically fetch salaries when month or year changes
  useEffect(() => {
    fetchSalaries();
  }, [fetchSalaries]);

  // Filter salaries for search/pending
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
      fetchSalaries();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete salary
  const handleDeleteSalary = async (salaryId) => {
    if (!window.confirm("Are you sure you want to delete this salary record?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/salaries/${salaryId}`);
      fetchSalaries();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <EmployeeAdminSidebar />
      <div style={{ flex: 1, padding: 20, maxWidth: 1400, margin: "0 auto" }}>
        <PageHeader title="Salary Management" subtitle="Review and manage employee payroll" />

        <SectionCard
          title="Filters"
          actions={(
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <select value={month} onChange={(e) => setMonth(e.target.value)} style={{ padding: 8, borderRadius: 8, border: "1px solid #e5e7eb" }}>
                {monthNames.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={year} onChange={(e) => setYear(e.target.value)} style={{ padding: 8, borderRadius: 8, border: "1px solid #e5e7eb" }}>
                {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <input
                type="text"
                placeholder="Search by Employee ID or Name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", minWidth: 240 }}
              />
              <button
                onClick={() => setShowPending(!showPending)}
                style={{ padding: "8px 16px", background: showPending ? "#f59e0b" : "#16a34a", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}
              >
                {showPending ? "Show All" : "Pending Only"}
              </button>
            </div>
          )}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "white" }}>
              <thead style={{ background: "#1e293b", color: "white" }}>
                <tr>
                  <th style={{ padding: "10px", textAlign: "left", fontSize: "14px" }}>Salary ID</th>
                  <th style={{ padding: "10px", textAlign: "left", fontSize: "14px" }}>Employee ID</th>
                  <th style={{ padding: "10px", textAlign: "left", fontSize: "14px" }}>Name</th>
                  <th style={{ padding: "10px", textAlign: "left", fontSize: "14px" }}>Month</th>
                  <th style={{ padding: "10px", textAlign: "left", fontSize: "14px" }}>Year</th>
                  <th style={{ padding: "10px", textAlign: "left", fontSize: "14px" }}>Basic Salary</th>
                  <th style={{ padding: "10px", textAlign: "left", fontSize: "14px" }}>Allowance</th>
                  <th style={{ padding: "10px", textAlign: "left", fontSize: "14px" }}>Deductions</th>
                  <th style={{ padding: "10px", textAlign: "left", fontSize: "14px" }}>Net Salary</th>
                  <th style={{ padding: "10px", textAlign: "left", fontSize: "14px" }}>Payment Status</th>
                  <th style={{ padding: "10px", textAlign: "left", fontSize: "14px" }}>Payment Date</th>
                  <th style={{ padding: "10px", textAlign: "left", fontSize: "14px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="12" style={{ textAlign: "center", padding: 16, color: "#64748b" }}>Loading salaries...</td></tr>
                ) : filteredSalaries.length === 0 ? (
                  <tr><td colSpan="12" style={{ textAlign: "center", padding: 16, color: "#64748b" }}>No salary records found</td></tr>
                ) : (
                  filteredSalaries.map((sal, index) => (
                    <tr key={index} style={{ borderBottom: "1px solid #ddd" }}>
                      <td style={{ padding: "10px", fontSize: "14px" }}>{sal.salaryId}</td>
                      <td style={{ padding: "10px", fontSize: "14px" }}>{sal.empId}</td>
                      <td style={{ padding: "10px", fontSize: "14px" }}>{sal.name}</td>
                      <td style={{ padding: "10px", fontSize: "14px" }}>{sal.month}</td>
                      <td style={{ padding: "10px", fontSize: "14px" }}>{sal.year}</td>
                      <td style={{ padding: "10px", fontSize: "14px" }}>Rs. {(Number(sal.basic) || 0).toLocaleString('en-IN')}</td>
                      <td style={{ padding: "10px", fontSize: "14px" }}>Rs. {(Number(sal.allowance) || 0).toLocaleString('en-IN')}</td>
                      <td style={{ padding: "10px", fontSize: "14px" }}>Rs. {(Number(sal.deduction) || 0).toLocaleString('en-IN')}</td>
                      <td style={{ padding: "10px", fontSize: "14px", fontWeight: "bold" }}>Rs. {(Number(sal.net) || 0).toLocaleString('en-IN')}</td>
                      <td style={{ padding: "10px", fontSize: "14px", color: sal.status === "Paid" ? "green" : "red", fontWeight: "bold" }}>{sal.status}</td>
                      <td style={{ padding: "10px", fontSize: "14px" }}>{sal.date}</td>
                      <td style={{ padding: "10px", fontSize: "14px" }}>
                        <button style={{ background: "#ef4444", color: "white", border: "none", padding: "5px 10px", borderRadius: "5px", cursor: "pointer", marginRight: "5px" }} onClick={() => handleDeleteSalary(sal.salaryId)}>Delete</button>
                        {sal.status === "Pending" && <button style={{ background: "#16a34a", color: "white", border: "none", padding: "6px 12px", borderRadius: "5px", cursor: "pointer" }} onClick={() => handlePaySalary(sal.salaryId)}>Mark as Paid</button>}
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

const thStyle = { padding: "10px", textAlign: "left", fontSize: "14px" };
const tdStyle = { padding: "10px", fontSize: "14px" };
const btnDelete = { background: "#ef4444", color: "white", border: "none", padding: "5px 10px", borderRadius: "5px", cursor: "pointer", marginRight: "5px" };
const btnGreen = { background: "#16a34a", color: "white", border: "none", padding: "6px 12px", borderRadius: "5px", cursor: "pointer" };

export default SalaryPage;
