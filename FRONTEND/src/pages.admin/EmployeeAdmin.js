import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaUsers,
  FaRegCalendarCheck,
  FaMoneyCheckAlt,
  FaPlusCircle,
  FaRegFileAlt,
  FaUserTie,
  FaChartLine,
  FaClipboardList,
  FaExclamationTriangle,
} from "react-icons/fa";
import { Pie, Line } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from "chart.js";
import EmployeeAdminSidebar from "../components/EmployeeAdminSidebar";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

function Dashboard() {
  const navigate = useNavigate();

  const [totalEmployees, setTotalEmployees] = useState(0);
  const [attendanceToday, setAttendanceToday] = useState({ present: 0, absent: 0 });
  const [pendingSalaries, setPendingSalaries] = useState(0);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [weeklyAttendance, setWeeklyAttendance] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const empRes = await axios.get("http://localhost:5000/api/employee/count/all");
        setTotalEmployees(empRes.data.count);

        const attRes = await axios.get("http://localhost:5000/api/attendance/today/summary");
        setAttendanceToday(attRes.data);

        const salRes = await axios.get("http://localhost:5000/api/salaries/pending/count");
        setPendingSalaries(salRes.data.pending);

        const recentRes = await axios.get("http://localhost:5000/api/attendance/recent");
        setRecentAttendance(recentRes.data);

        // Fetch pending leaves
        const leaveRes = await axios.get("http://localhost:5000/api/leaves/pending/count");
        setPendingLeaves(leaveRes.data.pending || 0);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };
    fetchData();
  }, []);

  // Fetch weekly attendance trend in a separate effect so it always runs
  useEffect(() => {
    let cancelled = false;
    const fetchWeekly = async () => {
      try {
        const weeklyRes = await axios.get("http://localhost:5000/api/attendance/weekly/trend");
        const weekly = Array.isArray(weeklyRes.data) ? weeklyRes.data : [];
        if (!cancelled) {
          console.log("Weekly attendance trend:", weekly);
          setWeeklyAttendance(weekly);
        }
      } catch (weeklyErr) {
        if (!cancelled) {
          console.error("Failed to fetch weekly attendance trend:", weeklyErr);
          setWeeklyAttendance([]);
        }
      }
    };
    fetchWeekly();
    return () => { cancelled = true; };
  }, []);

  // Chart Data
  const attendanceChartData = {
    labels: ["Present", "Absent"],
    datasets: [
      {
        data: [attendanceToday.present, attendanceToday.absent],
        backgroundColor: ["#10b981", "#ef4444"],
        borderWidth: 0,
      },
    ],
  };

  const safeWeeklyLabels = weeklyAttendance.length
    ? weeklyAttendance.map(d => d.day)
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const safeWeeklyData = weeklyAttendance.length
    ? weeklyAttendance.map(d => d.rate)
    : [0, 0, 0, 0, 0, 0, 0];

  const weeklyAttendanceChart = {
    labels: safeWeeklyLabels,
    datasets: [
      {
        label: "Attendance Rate (%)",
        data: safeWeeklyData,
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: "#10b981",
      },
    ],
  };

  // Helpers
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? dateStr : date.toLocaleDateString("en-GB");
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const date = new Date(timeStr);
    return isNaN(date.getTime())
      ? timeStr
      : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f1f5f9" }}>
      <EmployeeAdminSidebar />

      <div style={{ flex: 1, padding: "32px", maxWidth: "1600px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>
            Employee Management Dashboard
          </h1>
          <p style={{ fontSize: "15px", color: "#64748b" }}>
            Overview of your workforce and key metrics
          </p>
        </div>

        {/* Top Stats Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "24px",
            marginBottom: "32px",
          }}
        >
          {/* Total Employees */}
          <div
            onClick={() => navigate("/employee")}
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "16px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              border: "1px solid #e2e8f0",
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div
                style={{
                  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                  padding: "14px",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FaUsers size={24} color="white" />
              </div>
              <FaChartLine size={20} color="#10b981" />
            </div>
            <p style={{ margin: 0, fontSize: "14px", color: "#64748b", fontWeight: "500" }}>Total Employees</p>
            <h2 style={{ margin: "8px 0 0 0", fontSize: "36px", fontWeight: "700", color: "#0f172a" }}>
              {totalEmployees}
            </h2>
          </div>

          {/* Attendance Today */}
          <div
            onClick={() => navigate("/attendance")}
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "16px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              border: "1px solid #e2e8f0",
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div
                style={{
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  padding: "14px",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FaRegCalendarCheck size={24} color="white" />
              </div>
            </div>
            <p style={{ margin: 0, fontSize: "14px", color: "#64748b", fontWeight: "500" }}>Attendance Today</p>
            <h2 style={{ margin: "8px 0 0 0", fontSize: "28px", fontWeight: "700", color: "#0f172a" }}>
              {attendanceToday.present} / {attendanceToday.present + attendanceToday.absent}
            </h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#10b981", fontWeight: "600" }}>
              {attendanceToday.present + attendanceToday.absent > 0 
                ? Math.round((attendanceToday.present / (attendanceToday.present + attendanceToday.absent)) * 100)
                : 0}% Present
            </p>
          </div>

          {/* Salaries Pending */}
          <div
            onClick={() => navigate("/allSalaries")}
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "16px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              border: "1px solid #e2e8f0",
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div
                style={{
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  padding: "14px",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FaMoneyCheckAlt size={24} color="white" />
              </div>
              {pendingSalaries > 0 && <FaExclamationTriangle size={20} color="#f59e0b" />}
            </div>
            <p style={{ margin: 0, fontSize: "14px", color: "#64748b", fontWeight: "500" }}>Pending Salaries</p>
            <h2 style={{ margin: "8px 0 0 0", fontSize: "36px", fontWeight: "700", color: "#0f172a" }}>
              {pendingSalaries}
            </h2>
          </div>

          {/* Pending Leaves */}
          <div
            onClick={() => navigate("/leave")}
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "16px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              border: "1px solid #e2e8f0",
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div
                style={{
                  background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                  padding: "14px",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FaClipboardList size={24} color="white" />
              </div>
            </div>
            <p style={{ margin: 0, fontSize: "14px", color: "#64748b", fontWeight: "500" }}>Pending Leaves</p>
            <h2 style={{ margin: "8px 0 0 0", fontSize: "36px", fontWeight: "700", color: "#0f172a" }}>
              {pendingLeaves}
            </h2>
          </div>
        </div>

        {/* Charts Section */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "24px", marginBottom: "32px" }}>
          {/* Weekly Attendance Trend */}
          <div style={{
            background: "white",
            padding: "24px",
            borderRadius: "16px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e2e8f0",
          }}>
            <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#0f172a", marginBottom: "20px" }}>
              📈 Weekly Attendance Trend
            </h3>
            <div style={{ height: "250px" }}>
              <Line 
                data={weeklyAttendanceChart} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { beginAtZero: true, max: 100 }
                  }
                }} 
              />
            </div>
          </div>

          {/* Today's Attendance */}
          <div style={{
            background: "white",
            padding: "24px",
            borderRadius: "16px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e2e8f0",
          }}>
            <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#0f172a", marginBottom: "20px" }}>
              📊 Today's Attendance
            </h3>
            <div style={{ height: "250px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Pie 
                data={attendanceChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: "bottom" } }
                }} 
              />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#0f172a", marginBottom: "16px" }}>
          ⚡ Quick Actions
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #3b82f6, #2563eb)",
              borderRadius: "12px",
              padding: "20px",
              textAlign: "center",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
              transition: "all 0.3s ease",
            }}
            onClick={() => navigate("/add-employee")}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            <FaPlusCircle size={32} color="white" />
            <p style={{ marginTop: "12px", fontWeight: "600", color: "white", fontSize: "15px" }}>Add Employee</p>
          </div>

          <div
            style={{
              background: "linear-gradient(135deg, #10b981, #059669)",
              borderRadius: "12px",
              padding: "20px",
              textAlign: "center",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
              transition: "all 0.3s ease",
            }}
            onClick={() => navigate("/add-attendance")}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            <FaRegCalendarCheck size={32} color="white" />
            <p style={{ marginTop: "12px", fontWeight: "600", color: "white", fontSize: "15px" }}>
              Mark Attendance
            </p>
          </div>

          <div
            style={{
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              borderRadius: "12px",
              padding: "20px",
              textAlign: "center",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
              transition: "all 0.3s ease",
            }}
            onClick={() => navigate("/salary")}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            <FaMoneyCheckAlt size={32} color="white" />
            <p style={{ marginTop: "12px", fontWeight: "600", color: "white", fontSize: "15px" }}>
              Generate Salary
            </p>
          </div>
          <div
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
              borderRadius: "12px",
              padding: "20px",
              textAlign: "center",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
              transition: "all 0.3s ease",
            }}
            onClick={() => navigate("/employee-analytics")}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            <FaChartLine size={32} color="white" />
            <p style={{ marginTop: "12px", fontWeight: "600", color: "white", fontSize: "15px" }}>
              View Analytics
            </p>
          </div>

        </div>

        {/* Recent Attendance */}
        <div style={{
          background: "white",
          padding: "24px",
          borderRadius: "16px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          border: "1px solid #e2e8f0",
          marginBottom: "32px"
        }}>
          <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#0f172a", marginBottom: "20px" }}>
            📝 Recent Attendance Records
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr
                  style={{
                    textAlign: "left",
                    borderBottom: "2px solid #e2e8f0",
                  }}
                >
                  <th style={{ padding: "12px", fontSize: "14px", fontWeight: "600", color: "#64748b" }}>Employee ID</th>
                  <th style={{ padding: "12px", fontSize: "14px", fontWeight: "600", color: "#64748b" }}>Date</th>
                  <th style={{ padding: "12px", fontSize: "14px", fontWeight: "600", color: "#64748b" }}>Check-in</th>
                  <th style={{ padding: "12px", fontSize: "14px", fontWeight: "600", color: "#64748b" }}>Check-out</th>
                  <th style={{ padding: "12px", fontSize: "14px", fontWeight: "600", color: "#64748b" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAttendance.length > 0 ? (
                  recentAttendance.map((record, index) => (
                    <tr key={index} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px", fontSize: "14px", color: "#0f172a", fontWeight: "500" }}>{record.empId}</td>
                      <td style={{ padding: "12px", fontSize: "14px", color: "#64748b" }}>{formatDate(record.date)}</td>
                      <td style={{ padding: "12px", fontSize: "14px", color: "#64748b" }}>{formatTime(record.checkIn)}</td>
                      <td style={{ padding: "12px", fontSize: "14px", color: "#64748b" }}>{formatTime(record.checkOut)}</td>
                      <td style={{ padding: "12px" }}>
                        <span style={{
                          padding: "4px 12px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "600",
                          background: record.status === "Present" ? "#d1fae5" : "#fee2e2",
                          color: record.status === "Present" ? "#065f46" : "#991b1b"
                        }}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
                      No recent records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;