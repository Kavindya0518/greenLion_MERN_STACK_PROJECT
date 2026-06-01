import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EmployeeAdminSidebar from "../components/EmployeeAdminSidebar";
import PageHeader from "../components/common/PageHeader";
import SectionCard from "../components/common/SectionCard";

function LeaveRequests() {
  const navigate = useNavigate();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPending, setShowPending] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/leaves")
      .then((res) => res.json())
      .then((data) => setLeaveRequests(data))
      .catch((err) => console.error(err));
  }, []);

  const filteredRequests = leaveRequests.filter((request) => {
    const matchesSearch =
      (request.employeeId?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (request.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (request.type?.toLowerCase() || "").includes(searchTerm.toLowerCase());

    const matchesPending = showPending ? request.status === "Pending" : true;
    return matchesSearch && matchesPending;
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <EmployeeAdminSidebar />
      <div style={{ flex: 1, padding: 20, maxWidth: 1400, margin: "0 auto" }}>
        <PageHeader title="Leave Requests" subtitle="Review and manage employee leave" />

        <SectionCard
          title="Requests"
          actions={(
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Search by Employee ID, Name, or Leave Type"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", minWidth: 260 }}
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
                  <th>Request ID</th>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Leave Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.customId} style={{ textAlign: "center", borderBottom: "1px solid #f1f5f9" }}>
                    <td>{request.customId || "—"}</td>
                    <td>{request.employeeId || "—"}</td>
                    <td>{request.name || "—"}</td>
                    <td>{request.type || "—"}</td>
                    <td>{request.from ? new Date(request.from).toLocaleDateString() : "—"}</td>
                    <td>{request.to ? new Date(request.to).toLocaleDateString() : "—"}</td>
                    <td style={{ fontWeight: "bold", color: getStatusColor(request.status) }}>
                      {request.status || "Pending"}
                    </td>
                    <td>
                      <button
                        onClick={() => navigate(`/leave-requests/${request.customId}`, { state: request })}
                        style={{ padding: "6px 12px", background: "#38bdf8", color: "white", border: "none", borderRadius: 8 }}
                      >
                        👁 View
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ padding: 16, textAlign: "center", color: "#64748b" }}>No leave requests found</td>
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

function getStatusColor(status) {
  switch (status) {
    case "Approved": return "green";
    case "Rejected": return "red";
    case "Pending": return "orange";
    default: return "black";
  }
}

export default LeaveRequests;
