import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUser, FaRegCalendarCheck, FaMoneyCheckAlt, FaRegFileAlt, FaBell, FaCheckCircle, FaChartLine } from "react-icons/fa";
import EmployeeSidebar from "../components/EmployeeSidebar";
// EmployeeNavbar removed per new layout

function EmployeeDashboard() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({});
  const [attendance, setAttendance] = useState([]);
  const [salary, setSalary] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [kpis, setKpis] = useState({ pendingLeaves: 0, lastAttendanceStatus: "—", lastIn: "—", lastOut: "—", latestPayslip: "—" });

  useEffect(() => {
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login first");
        navigate("/login");
        return;
      }

      // Fetch employee profile
      const profileRes = await axios.get("http://localhost:5000/api/employee/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const profileData = profileRes.data;
      profileData.name = `${profileData.first_name} ${profileData.last_name}`;
      setProfile(profileData);

      // Fetch attendance
      const attendanceRes = await axios.get("http://localhost:5000/api/attendance/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAttendance(attendanceRes.data);

      // Fetch salary
      const salaryRes = await axios.get("http://localhost:5000/api/salaries/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSalary(salaryRes.data);

      // Fetch leaves
      const leavesRes = await axios.get("http://localhost:5000/api/leaves/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeaves(leavesRes.data);

    } catch (err) {
      console.error("❌ Error fetching employee dashboard data:", err.response?.data || err.message);
    }
  };

  fetchData();
}, [navigate]);

  // Compute KPIs
  useEffect(() => {
    const pendingLeaves = Array.isArray(leaves) ? leaves.filter(l => l.status === "Pending").length : 0;
    const lastAttendance = Array.isArray(attendance) && attendance.length ? attendance.slice().sort((a,b)=>new Date(b.date)-new Date(a.date))[0] : null;
    const lastAttendanceStatus = lastAttendance ? (lastAttendance.status || "—") : "—";
    const lastIn = lastAttendance?.checkIn || "—";
    const lastOut = lastAttendance?.checkOut || "—";
    const latest = Array.isArray(salary) && salary.length ? salary[0] : null;
    const latestPayslip = latest ? `${latest.month} ${latest.year}` : "—";
    setKpis({ pendingLeaves, lastAttendanceStatus, lastIn, lastOut, latestPayslip });
  }, [attendance, salary, leaves]);

  // Widget helpers
  const todayRecord = (attendance || []).find((a) => {
    const d = new Date(a.date);
    const n = new Date();
    return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
  });
  const leaveCounts = (leaves || []).reduce((acc, l) => {
    const s = (l.status || "").toLowerCase();
    if (s === "pending") acc.pending += 1;
    else if (s === "approved") acc.approved += 1;
    else if (s === "rejected") acc.rejected += 1;
    return acc;
  }, { pending: 0, approved: 0, rejected: 0 });
  const latestPay = Array.isArray(salary) && salary.length ? salary[0] : null;
  // Build last 7 days attendance trend (Present=1, Absent/Leave=0)
  const trendDays = (() => {
    const days = [];
    const map = new Map();
    (attendance || []).forEach(a => {
      const d = new Date(a.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const val = (a.status || "").toLowerCase() === "present" ? 1 : 0;
      if (!map.has(key)) map.set(key, val);
    });
    // Start week on Monday
    const today = new Date();
    const weekday = today.getDay(); // 0=Sun,1=Mon,...
    const daysFromMonday = (weekday + 6) % 7; // Mon=0, Sun=6
    const start = new Date(today);
    start.setDate(today.getDate() - daysFromMonday);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const label = d.toLocaleDateString(undefined, { weekday: "short" });
      days.push({ label, value: map.get(key) || 0 });
    }
    return days;
  })();
  // Upcoming approved leaves (next 3)
  const upcomingLeaves = (leaves || [])
    .filter(l => (l.status || "").toLowerCase() === "approved")
    .filter(l => new Date(l.from) >= new Date())
    .sort((a,b) => new Date(a.from) - new Date(b.from))
    .slice(0,3);
  const attRate7d = trendDays.length ? Math.round((trendDays.reduce((s,d)=>s + (d.value ? 1 : 0), 0) / trendDays.length) * 100) : 0;
  const totalPayslips = Array.isArray(salary) ? salary.length : 0;

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f1f5f9" }}>
      <EmployeeSidebar />
      <div style={{ flex: 1 ,marginTop:"0px"}}>
        {/* Header (Medium Green) */}
        <div style={{ 
          background: 'linear-gradient(135deg,#097005ff,#d1fae5)',
          border: '1px solid #bbf7d0',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 6px 14px rgba(6,95,70,0.12)',
          margin: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h2 style={{ margin: 0, color: '#ffffff', fontWeight: 800, fontSize: '24px' }}>Welcome {profile.name || 'Employee'}</h2>
            <p style={{ margin: '6px 0 0 0', color: 'rgba(255,255,255,0.9)' }}>Overview of your work status and recent activities</p>
          </div>
        </div>

        {/* Stat Cards (Admin-style) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, padding: "0 20px", marginBottom: 16 }}>
          {[
            { title: "Last Status", value: kpis.lastAttendanceStatus || "—", color: "#10B981", bg: "#10B9811A", icon: <FaCheckCircle size={22} /> },
            { title: "Pending Leaves", value: kpis.pendingLeaves, color: "#F59E0B", bg: "#F59E0B1A", icon: <FaRegFileAlt size={22} /> },
            { title: "Attendance 7d", value: attRate7d + "%", color: "#3B82F6", bg: "#3B82F61A", icon: <FaChartLine size={22} /> },
            { title: "Payslips", value: totalPayslips, color: "#8B5CF6", bg: "#8B5CF61A", icon: <FaMoneyCheckAlt size={22} /> }
          ].map((s, i) => (
            <div key={i} style={{ background: "white", border: "1px solid #e5e7eb", borderTop: `4px solid ${s.color}`, borderRadius: 12, padding: 20, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ color: "#6b7280", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.title}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#111827", marginTop: 6 }}>{s.value}</div>
                </div>
                <div style={{ width: 56, height: 56, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>
                  {s.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Links (Admin-style) */}
        <div style={{ padding: "0 20px", marginBottom: 16 }}>
          <h2 style={{ margin: "0 0 12px 0", fontSize: 18, color: "#111827" }}>Quick Links</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            {[
              { title: "My Profile", link: "/empProfile", color: "#3B82F6", icon: <FaUser /> },
              { title: "Attendance", link: "/empAttendance", color: "#10B981", icon: <FaRegCalendarCheck /> },
              { title: "My Leaves", link: "/empLeave", color: "#F59E0B", icon: <FaRegFileAlt /> },
              { title: "Payslips", link: "/empSalaries", color: "#8B5CF6", icon: <FaMoneyCheckAlt /> }
            ].map((q, idx) => (
              <button key={idx} onClick={() => navigate(q.link)} style={{ padding: 16, background: "white", border: "2px solid #e5e7eb", borderRadius: 12, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
                <div style={{ width: 44, height: 44, borderRadius: 22, background: q.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: q.color }}>{q.icon}</div>
                <span style={{ fontWeight: 600, color: "#111827", fontSize: 14 }}>{q.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Analytics Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(260px, 1fr))", gap: 20, margin: "20px" }}>
          {/* Attendance Today */}
          <div style={{ ...cardStyle, textAlign: "left", background: "#ecfdf5", color: "#065f46", border: "1px solid #d1fae5" }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Attendance Today</h3>
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ padding: "4px 10px", borderRadius: 10, background: todayRecord ? (todayRecord.status === "Present" ? "#dcfce7" : "#fee2e2") : "#f1f5f9", color: todayRecord ? (todayRecord.status === "Present" ? "#065f46" : "#7f1d1d") : "#64748b", border: "1px solid #e5e7eb", fontWeight: 700 }}>
                {todayRecord ? todayRecord.status : "No record"}
              </span>
              <span style={{ color: "#065f46" }}>In <strong>{todayRecord?.checkIn || "—"}</strong> · Out <strong>{todayRecord?.checkOut || "—"}</strong></span>
            </div>
          </div>

          {/* 7-day Attendance Trend */}
          <div style={{ ...cardStyle, textAlign: "left", background: "#ecfdf5", color: "#065f46", border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Attendance · 7 days</h3>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 80, marginTop: 10 }}>
              {trendDays.map((d, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 16, height: Math.max(8, d.value ? 70 : 12), background: d.value ? "#22c55e" : "#e5e7eb", border: `1px solid ${d.value ? "#16a34a" : "#e5e7eb"}`, borderRadius: 4 }} />
                  <div style={{ fontSize: 11, color: "#64748b" }}>{d.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Leave Balance */}
          <div style={{ ...cardStyle, textAlign: "left", background: "#ecfdf5", color: "#166534", border: "1px solid #bbf7d0" }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Leave Balance</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 10 }}>
              <div style={{ background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 12, color: "#065f46" }}>Pending</div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>{leaveCounts.pending}</div>
              </div>
              <div style={{ background: "#ecfdf5", border: "1px solid #d1fae5", borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 12, color: "#065f46" }}>Approved</div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>{leaveCounts.approved}</div>
              </div>
              <div style={{ background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 12, color: "#7f1d1d" }}>Rejected</div>
                <div style={{ fontWeight: 800, fontSize: 18, color: "#991b1b" }}>{leaveCounts.rejected}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Detail Row */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, margin: "20px" }}>
          {/* Upcoming Leaves */}
          <div style={{ ...cardStyle, background: "#ffffff", color: "#111827", border: "1px solid #e2e8f0", textAlign: "left" }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, color: "#065f46" }}>Upcoming Leaves</h3>
            {upcomingLeaves.length ? (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {upcomingLeaves.map((l, i) => (
                  <li key={i} style={{ padding: "10px 0", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between" }}>
                    <span><strong>{l.type}</strong> • {new Date(l.from).toLocaleDateString()} → {new Date(l.to || l.from).toLocaleDateString()}</span>
                    <span style={{ padding: "2px 8px", borderRadius: 10, background: "#dcfce7", color: "#065f46", border: "1px solid #bbf7d0", fontWeight: 700 }}>Approved</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ color: "#64748b" }}>No upcoming leaves</div>
            )}
          </div>

          {/* Latest Payslip (compact) */}
          <div style={{ ...cardStyle, background: "#ffffff", color: "#065f46", border: "1px solid #d1fae5", textAlign: "left" }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Latest Payslip</h3>
            {latestPay ? (
              <div>
                <div style={{ fontSize: 13, color: "#047857" }}>{latestPay.month} {latestPay.year}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#064e3b", marginTop: 6 }}>Rs. {(Number(latestPay.net) || 0).toLocaleString('en-IN')}</div>
                <div style={{ marginTop: 6 }}>
                  <span style={{ padding: "4px 10px", borderRadius: 12, fontWeight: 700, background: latestPay.status === "Paid" ? "#dcfce7" : "#fef9c3", color: latestPay.status === "Paid" ? "#065f46" : "#92400e", border: "1px solid #e5e7eb" }}>{latestPay.status}</span>
                </div>
              </div>
            ) : (
              <div style={{ color: "#64748b" }}>No payslips yet</div>
            )}
          </div>
        </div>

        <div style={{ margin: "20px", display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
          <div style={{ ...cardStyle, background: "#ffffff", color: "#111827", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12, color: "#065f46" }}>Recent Activity</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {
                [
                  ...(attendance || []).map(a => ({ type: "Attendance", when: new Date(a.date), text: `${new Date(a.date).toLocaleDateString()} • ${a.status}` })),
                  ...(leaves || []).map(l => ({ type: "Leave", when: new Date(l.from), text: `${l.type} • ${l.status}` })),
                  ...(salary || []).map(s => ({ type: "Salary", when: new Date(`${s.year}-${s.month}-01`), text: `${s.month} ${s.year} • ${s.status}` }))
                ]
                .sort((a,b)=>b.when-a.when)
                .slice(0,6)
                .map((item, idx) => (
                  <li key={idx} style={{ position: "relative", padding: "10px 0 10px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ position: "absolute", left: 0, top: 18, width: 8, height: 8, background: "#16a34a", borderRadius: "50%" }} />
                    <span><strong>{item.type}:</strong> {item.text}</span>
                    <span style={{ color: "#64748b" }}>{item.when.toLocaleDateString()}</span>
                  </li>
                ))
              }
              {(!attendance?.length && !leaves?.length && !salary?.length) && (
                <li style={{ padding: "10px 0", color: "#64748b" }}>No recent activity</li>
              )}
            </ul>
          </div>
          <div style={{ ...cardStyle, background: "#ffffff", color: "#111827", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: "#065f46" }}><FaBell /> Announcements</h3>
            <p style={{ color: "#065f46", margin: 0 }}>🎉 Company Annual Meetup on <b>25th September</b>! Don’t forget to RSVP.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const cardStyle = { borderRadius: "15px", padding: "25px", textAlign: "center", boxShadow: "0 6px 15px rgba(0,0,0,0.1)", transition: "transform 0.3s ease, box-shadow 0.3s ease", cursor: "pointer" };
const imgStyle = { width: "70px", height: "70px", marginBottom: "15px", borderRadius: "50%", objectFit: "cover" };
const titleStyle = { fontSize: "20px", fontWeight: "bold", marginBottom: "10px" };
const descStyle = { fontSize: "15px", marginBottom: "15px" };
const btnStyle = { background: "#ffffff", color: "#1f2937", border: "1px solid #d1d5db", borderRadius: "8px", padding: "8px 15px", cursor: "pointer", fontSize: "14px", transition: "0.3s" };

const kpiPill = (accent) => ({ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 12, padding: 12, minWidth: 140, boxShadow: `inset 0 0 0 1px ${accent}22` });
const kpiLabel = () => ({ fontSize: 12, opacity: 0.9 });
const kpiValue = () => ({ fontSize: 16, fontWeight: 800 });
const qaBtn = (bg) => ({ padding: "10px 12px", background: bg, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" });

export default EmployeeDashboard;
