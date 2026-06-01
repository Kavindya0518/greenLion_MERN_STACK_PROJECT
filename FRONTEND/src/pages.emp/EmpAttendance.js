import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import EmployeeSidebar from "../components/EmployeeSidebar";

function EmployeeAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [monthly, setMonthly] = useState(null);
  const navigate = useNavigate();

  // Fetch attendance
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("Please login first");
          navigate("/login");
          return;
        }

        const res = await axios.get("http://localhost:5000/api/attendance/my", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const rows = Array.isArray(res.data) ? res.data : [];
        // sort newest first
        rows.sort((a, b) => new Date(b.date) - new Date(a.date));
        setAttendance(rows);
      } catch (err) {
        console.error("Error fetching attendance:", err);
        setError("Failed to fetch attendance records. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [navigate]);

  // Fetch monthly summary (present days, leave days, hours)
  useEffect(() => {
    const fetchMonthly = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get("http://localhost:5000/api/attendance/my/monthly-summary", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMonthly(res.data);
      } catch (e) {
        console.error("Monthly summary error", e);
      }
    };
    fetchMonthly();
  }, []);

  // Handle Check-In
  const handleCheckIn = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/attendance/checkin",
        {},
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          } 
        }
      );
      console.log('Check-in response:', response.data);
      // Force refresh the attendance data
      const res = await axios.get("http://localhost:5000/api/attendance/my", {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });
      setAttendance(res.data);
    } catch (err) {
      console.error('Check-in error:', err);
      alert("Check-In failed: " + (err.response?.data?.error || err.message));
    }
  };

  // Handle Check-Out
  const handleCheckOut = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/attendance/checkout",
        {},
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          } 
        }
      );
      console.log('Check-out response:', response.data);
      // Force refresh the attendance data
      const res = await axios.get("http://localhost:5000/api/attendance/my", {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });
      setAttendance(res.data);
    } catch (err) {
      console.error('Check-out error:', err);
      alert("Check-Out failed: " + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <p style={{ margin: "20px" }}>Loading attendance...</p>;

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  // Find today's record
  const todayRecord = attendance.find(a => {
    const recordDate = new Date(a.date).toISOString().split('T')[0];
    return recordDate === today;
  });
  
  console.log('Today:', today);
  console.log('Today\'s record:', todayRecord);
  
  // Check if checked in/out
  const checkedIn = todayRecord && todayRecord.checkIn && todayRecord.checkIn !== '-' && todayRecord.checkIn !== '';
  const checkedOut = todayRecord && todayRecord.checkOut && todayRecord.checkOut !== '-' && todayRecord.checkOut !== '';
  
  console.log('Checked In:', checkedIn, 'Checked Out:', checkedOut);

  const filtered = attendance.filter((att) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (att.status || "").toLowerCase().includes(s) ||
      (att.checkIn || "").toLowerCase().includes(s) ||
      (att.checkOut || "").toLowerCase().includes(s) ||
      new Date(att.date).toLocaleDateString().toLowerCase().includes(s)
    );
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      <EmployeeSidebar />
      <div style={{ flex: 1 ,marginTop:"0px"}}>

        <div style={{ padding: "16px 20px" }}>
          <div style={{ 
            background: 'white',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <h2 style={{ margin: 0, color: '#1e293b', fontWeight: 700, fontSize: '22px' }}>My Attendance</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 13, color: '#64748b', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 9999 }}>
                {new Date().toLocaleDateString()}
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="44" viewBox="0 0 64 44" style={{ opacity: 0.95 }}>
                <rect x="2" y="8" width="60" height="34" rx="6" stroke="#065f46" strokeWidth="2" fill="#ffffff" />
                <rect x="2" y="8" width="60" height="8" rx="6" fill="#dcfce7" />
                <line x1="16" y1="2" x2="16" y2="12" stroke="#065f46" strokeWidth="3" />
                <line x1="48" y1="2" x2="48" y2="12" stroke="#065f46" strokeWidth="3" />
                <circle cx="16" cy="26" r="2" fill="#065f46" />
                <circle cx="26" cy="26" r="2" fill="#065f46" />
                <circle cx="36" cy="26" r="2" fill="#065f46" />
                <circle cx="46" cy="26" r="2" fill="#065f46" />
              </svg>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 12 }}>
            {(() => {
              // Fallback from client-side if monthly not loaded
              const presentDaysFallback = attendance.filter(a => (a.status || "").toLowerCase() === 'present').length;
              const leaveDaysFallback = attendance.filter(a => (a.status || "").toLowerCase() === 'leave').length;
              const now = new Date();
              const monthHoursFallback = attendance.reduce((sum,a) => {
                const d = new Date(a.date);
                return (d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear()) ? sum + (Number(a.hours)||0) : sum;
              }, 0);
              const cards = [
                { title: 'Days Present', value: monthly?.presentDays ?? presentDaysFallback, color:'#10B981', bg:'#10B9811A', icon:'present' },
                { title: 'Leave Days', value: monthly?.leaveDays ?? leaveDaysFallback, color:'#3B82F6', bg:'#3B82F61A', icon:'leave' },
                { title: 'Hours (This Month)', value: monthly?.totalHours ?? monthHoursFallback, color:'#8B5CF6', bg:'#8B5CF61A', icon:'hours' },
              ];
              return cards.map((c,i)=> (
                <div key={i} style={{ background:'white', border:'1px solid #e5e7eb', borderTop:`4px solid ${c.color}`, borderRadius:12, padding:16, boxShadow:'0 1px 2px rgba(0,0,0,0.04)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ color:'#6b7280', fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:0.5 }}>{c.title}</div>
                      <div style={{ fontSize:24, fontWeight:800, color:'#111827', marginTop:6 }}>{c.value}</div>
                    </div>
                    <div style={{ width:48, height:48, borderRadius:10, background:c.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {c.icon === 'present' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      )}
                      {c.icon === 'leave' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M7 14h10"/></svg>
                      )}
                      {c.icon === 'hours' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      )}
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>

          <div style={{ marginTop: 16 }}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1f2937", margin: 0 }}>
              📅 My Attendance
            </h2>
          </div>

          {/* Today status banner */}
          <div style={{
            marginTop: 8,
            marginBottom: 16,
            padding: "10px 12px",
            background: "#eef2ff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            color: "#1f2937"
          }}>
            {todayRecord ? (
              <div>
                <strong>Today:</strong> {todayRecord.status || "—"} {todayRecord.checkIn ? `• In: ${todayRecord.checkIn}` : ""} {todayRecord.checkOut ? `• Out: ${todayRecord.checkOut}` : ""}
              </div>
            ) : (
              <div>No record for today yet.</div>
            )}
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

          <div style={{ display: "flex", gap: 10, alignItems: "center", margin: "15px 0" }}>
            <button
              onClick={handleCheckIn}
              disabled={checkedIn}
              style={{
                opacity: checkedIn ? 0.6 : 1,
                padding: "10px 18px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Check-In
            </button>
            <button
              onClick={handleCheckOut}
              disabled={!checkedIn || checkedOut}
              style={{
                opacity: !checkedIn || checkedOut ? 0.6 : 1,
                padding: "10px 18px",
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Check-Out
            </button>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search date, time or status"
              style={{ flex: 1, minWidth: 220, padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
            />
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
              }}
            >
              <thead style={{ background: "#dcfce7" }}>
                <tr>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Check-In</th>
                  <th style={thStyle}>Check-Out</th>
                  <th style={thStyle}>Hours</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && !error ? (
                  <tr>
                    <td colSpan="5" style={{ padding: "20px", textAlign: "center", color:'#64748b' }}>
                      <div style={{ display:'inline-flex', alignItems:'center', gap:10 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 8v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8"/>
                          <path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/>
                          <rect x="3" y="8" width="18" height="5" rx="1"/>
                        </svg>
                        <span>No attendance records found.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((att, index) => (
                    <tr key={index} style={index % 2 ? { background: "#f9fafb" } : {}}>
                      <td style={tdStyle}>
                        {new Date(att.date).toLocaleDateString()}
                      </td>
                      <td style={tdStyle}>{att.checkIn}</td>
                      <td style={tdStyle}>{att.checkOut}</td>
                      <td style={tdStyle}>{att.hours} hrs</td>
                      <td
                        style={{
                          ...tdStyle,
                          fontWeight: "bold",
                          color:
                            att.status === "Present"
                              ? "#10b981"
                              : att.status === "Leave"
                              ? "#3b82f6"
                              : att.status === "Half Day"
                              ? "#fbbf24"
                              : "#ef4444",
                        }}
                      >
                        {att.status}
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

export default EmployeeAttendance;
