import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import EmployeeSidebar from "../components/EmployeeSidebar";

function LeaveRequests() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Fetch Leaves
  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("Please login first");
          navigate("/login");
          return;
        }

        const res = await axios.get("http://localhost:5000/api/leaves/my", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setLeaves(res.data);
      } catch (err) {
        console.error("Error fetching leaves:", err);
        setError("Failed to fetch leave requests. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaves();
  }, [navigate]);

  // Cancel Leave (remove from table)
  const handleCancel = async (leaveId) => {
    if (!window.confirm("Are you sure you want to cancel this leave?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/leaves/${leaveId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Remove cancelled leave from table
      setLeaves((prev) => prev.filter((leave) => leave.customId !== leaveId));
    } catch (err) {
      console.error("Error cancelling leave:", err);
      alert("Failed to cancel leave. Please try again.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "#10b981"; // Green
      case "Rejected":
        return "#ef4444"; // Red
      case "Cancelled":
        return "#6b7280"; // Gray
      default:
        return "#fbbf24"; // Yellow (Pending)
    }
  };

  if (loading) return <p style={{ margin: "20px" }}>Loading leave requests...</p>;

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      <EmployeeSidebar />
      <div style={{ flex: 1}}>

        <div style={{ padding: "16px 20px" }}>
          {/* Header */}
          <div style={{ 
            background: 'white',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap'
          }}>
            <h2 style={{ margin: 0, color: '#1e293b', fontWeight: 700, fontSize: 22 }}>My Leave Requests</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => navigate("/empLeaveForm")}
                style={{ padding: '10px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer' }}
              >
                + Request Leave
              </button>
              
            </div>
          </div>

          {/* KPI Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 12 }}>
            {(() => {
              const pending = leaves.filter(l => (l.status || '').toLowerCase() === 'pending').length;
              const approved = leaves.filter(l => (l.status || '').toLowerCase() === 'approved').length;
              const rejected = leaves.filter(l => (l.status || '').toLowerCase() === 'rejected').length;
              const cards = [
                { title: 'Pending', value: pending, color:'#F59E0B', bg:'#F59E0B1A', icon:'pending' },
                { title: 'Approved', value: approved, color:'#10B981', bg:'#10B9811A', icon:'approved' },
                { title: 'Rejected', value: rejected, color:'#EF4444', bg:'#EF44441A', icon:'rejected' },
              ];
              return cards.map((c,i)=> (
                <div key={i} style={{ background:'white', border:'1px solid #e5e7eb', borderTop:`4px solid ${c.color}`, borderRadius:12, padding:16, boxShadow:'0 1px 2px rgba(0,0,0,0.04)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ color:'#6b7280', fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:0.5 }}>{c.title}</div>
                      <div style={{ fontSize:24, fontWeight:800, color:'#111827', marginTop:6 }}>{c.value}</div>
                    </div>
                    <div style={{ width:48, height:48, borderRadius:10, background:c.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {c.icon === 'approved' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      )}
                      {c.icon === 'pending' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                      )}
                      {c.icon === 'rejected' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                      )}
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>

          {error && (
            <div
              style={{
                marginBottom: "20px",
                padding: "10px",
                backgroundColor: "#fee2e2",
                color: "#b91c1c",
                borderRadius: "8px",
                fontWeight: "bold",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ overflowX: "auto", background: 'white', borderRadius: 16, boxShadow: '0 4px 10px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', marginTop: 12 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#e0f2fe" }}>
                <tr>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>From</th>
                  <th style={thStyle}>To</th>
                  <th style={thStyle}>Description</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>
              <tbody>
                {leaves.length === 0 && !error ? (
                  <tr>
                    <td colSpan="6" style={{ padding: "18px", textAlign: "center", color: '#64748b' }}>
                      <div style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/></svg>
                        <span>No leave requests found.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  leaves.map((leave, index) => (
                    <tr key={index} style={index % 2 ? { background: "#f9fafb" } : {}}>
                      <td style={tdStyle}>{leave.type}</td>
                      <td style={tdStyle}>{new Date(leave.from).toLocaleDateString()}</td>
                      <td style={tdStyle}>{new Date(leave.to).toLocaleDateString()}</td>
                      <td style={tdStyle}>{leave.description}</td>
                      <td
                        style={{
                          ...tdStyle,
                          color: getStatusColor(leave.status),
                          fontWeight: "bold",
                        }}
                      >
                        {leave.status}
                      </td>
                      <td style={tdStyle}>
                        {leave.status === "Pending" && (
                          <button
                            onClick={() => handleCancel(leave.customId)}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#ef4444",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                            }}
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

const thStyle = {
  padding: "12px",
  textAlign: "left",
  borderBottom: "1px solid #d1d5db",
};
const tdStyle = { padding: "12px", borderBottom: "1px solid #e5e7eb" };

export default LeaveRequests;
