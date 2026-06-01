import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import EmployeeAdminSidebar from "../components/EmployeeAdminSidebar";

function LeaveRequestView() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state) return <h2 style={{ textAlign: "center", marginTop: "50px" }}>No request data found.</h2>;

  const handleAction = async (action) => {
    const res = await fetch(`http://localhost:5000/api/leaves/${state.customId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: action }),
    });
    if (res.ok) {
      alert(`Leave request ${state.customId} has been ${action}`);
      navigate("/leave");
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#edf2f7" }}>
      <EmployeeAdminSidebar />

      <div style={{ flex: 1 }}>
        <div style={styles.wrapper}>
          {/* Back button */}
          <button onClick={() => navigate("/leave")} style={styles.backBtn}>
            Back
          </button>

          {/* Card */}
          <div style={styles.card}>
            <h2 style={styles.title}>🌿 Leave Request</h2>

            {/* Employee Info */}
            <div style={styles.section}>
              <h3 style={{ ...styles.sectionTitle, color: "#04420eff" }}>👤 Employee Info</h3>
              <DetailRow label="Name" value={state.name} />
              <DetailRow label="Employee ID" value={state.employeeId} />
              <DetailRow label="Position" value={state.position} />
            </div>

            {/* Leave Details */}
            <div style={styles.section}>
              <h3 style={{ ...styles.sectionTitle, color: "#04420eff" }}>📝 Leave Details</h3>
              <DetailRow label="Type" value={state.type} />
              <DetailRow label="Description" value={state.description} />
              <DetailRow label="From" value={new Date(state.from).toLocaleDateString()} />
              <DetailRow label="To" value={new Date(state.to).toLocaleDateString()} />
            </div>

            {/* Status */}
            <div style={styles.section}>
              <h3 style={{ ...styles.sectionTitle, color: "#04420eff" }}>📌 Status</h3>
              <p style={{ fontWeight: "700", fontSize: "16px", color: getStatusColor(state.status) }}>
                {state.status}
              </p>
            </div>

            {/* Actions */}
            {state.status === "Pending" && (
              <div style={styles.actions}>
                <button onClick={() => handleAction("Approved")} style={styles.approveBtn}>
                  Approve
                </button>
                <button onClick={() => handleAction("Rejected")} style={styles.rejectBtn}>
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const DetailRow = ({ label, value }) => (
  <div style={styles.row}>
    <span style={styles.label}>{label}:</span>
    <span style={styles.value}>{value}</span>
  </div>
);

function getStatusColor(status) {
  switch (status) {
    case "Approved": return "#16a34a";
    case "Rejected": return "#dc2626";
    case "Pending": return "#f59e0b";
    default: return "#374151";
  }
}

const styles = {
  wrapper: {
    maxWidth: "750px",
    margin: "40px auto",
    padding: "20px",
  },
  backBtn: {
    marginBottom: "20px",
    padding: "8px 16px",
    cursor: "pointer",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    transition: "0.2s",
  },
  card: {
    background: "linear-gradient(135deg, #e5f5e4ff, #f9fafb)",
    borderRadius: "14px",
    padding: "30px 35px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
    border: "1px solid #e5e7eb",
  },
  title: {
    fontSize: "24px",
    fontWeight: "700",
    marginBottom: "25px",
    textAlign: "center",
    color: "#111827",
  },
  section: {
    marginBottom: "20px",
    paddingBottom: "15px",
    borderBottom: "2px dashed #e5e7eb",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    marginBottom: "12px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 0",
  },
  label: {
    fontWeight: "600",
    color: "#374151",
  },
  value: {
    color: "#1f2937",
    fontWeight: "500",
  },
  actions: {
    display: "flex",
    justifyContent: "center",
    gap: "15px",
    marginTop: "20px",
  },
  approveBtn: {
    padding: "12px 22px",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "15px",
    transition: "0.2s",
  },
  rejectBtn: {
    padding: "12px 22px",
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "15px",
    transition: "0.2s",
  },
};

export default LeaveRequestView;
