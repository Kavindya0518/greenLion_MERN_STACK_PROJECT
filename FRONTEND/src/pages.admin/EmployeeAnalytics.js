import React, { useState, useEffect } from "react";
import axios from "axios";
import EmployeeAdminSidebar from "../components/EmployeeAdminSidebar";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function EmployeeAnalytics() {
  const [analyticsData, setAnalyticsData] = useState({
    departmentDistribution: [],
    monthlyAttendance: [],
    salaryDistribution: [],
    leaveStats: {},
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Use new consolidated analytics endpoint
      const res = await axios.get("http://localhost:5000/api/analytics/employee");
      const data = res.data || {};

      // Map backend fields to local state shape
      const departmentDistribution = Array.isArray(data.department_distribution)
        ? data.department_distribution.map((d) => ({
            department: d.department,
            count: d.count,
          }))
        : [];

      // Attendance trend: prefer monthly_attendance, fallback to weekly_attendance
      let monthlyAttendance = [];
      if (Array.isArray(data.monthly_attendance)) {
        monthlyAttendance = data.monthly_attendance.map((m) => ({ month: m.month, percentage: m.rate }));
      } else if (Array.isArray(data.weekly_attendance)) {
        monthlyAttendance = data.weekly_attendance.map((w) => ({ month: w.day, percentage: w.rate }));
      }

      const salaryDistribution = Array.isArray(data.salary_distribution)
        ? data.salary_distribution.map((s) => ({ range: s.range, count: s.count }))
        : [];

      const leaveStats = data.leave_status || {};

      setAnalyticsData({
        departmentDistribution,
        monthlyAttendance,
        salaryDistribution,
        leaveStats,
      });
    } catch (err) {
      console.error("Error fetching analytics:", err);
      // Do not inject mock data; keep current displayed data or empty
    }
  };

  // Department Distribution Chart
  const departmentChartData = {
    labels: analyticsData.departmentDistribution.map((d) => d.department),
    datasets: [
      {
        label: "Employees",
        data: analyticsData.departmentDistribution.map((d) => d.count),
        backgroundColor: [
          "#10b981",
          "#3b82f6",
          "#f59e0b",
          "#ef4444",
          "#8b5cf6",
        ],
        borderWidth: 0,
      },
    ],
  };

  // Monthly Attendance Chart
  const attendanceChartData = {
    labels: analyticsData.monthlyAttendance.map((m) => m.month),
    datasets: [
      {
        label: "Attendance %",
        data: analyticsData.monthlyAttendance.map((m) => m.percentage),
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Salary Distribution Chart
  const salaryChartData = {
    labels: analyticsData.salaryDistribution.map((s) => s.range),
    datasets: [
      {
        label: "Employees",
        data: analyticsData.salaryDistribution.map((s) => s.count),
        backgroundColor: "#3b82f6",
        borderRadius: 8,
      },
    ],
  };

  // Leave Stats Chart
  const leaveChartData = {
    labels: ["Approved", "Pending", "Rejected"],
    datasets: [
      {
        data: [
          analyticsData.leaveStats.approved || 0,
          analyticsData.leaveStats.pending || 0,
          analyticsData.leaveStats.rejected || 0,
        ],
        backgroundColor: ["#10b981", "#f59e0b", "#ef4444"],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
      },
    },
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <EmployeeAdminSidebar />

      <div style={{ flex: 1, padding: "24px" }}>
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>
            📊 Employee Analytics
          </h2>
          <p style={{ color: "#64748b", fontSize: "14px" }}>
            Comprehensive insights and data visualization
          </p>
        </div>

        {/* Key Metrics */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}>
          <div style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            borderLeft: "4px solid #10b981",
          }}>
            <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>Total Employees</p>
            <h3 style={{ fontSize: "32px", fontWeight: "700", color: "#1e293b", margin: "8px 0 0 0" }}>
              {analyticsData.departmentDistribution.reduce((sum, d) => sum + d.count, 0)}
            </h3>
          </div>

          <div style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            borderLeft: "4px solid #3b82f6",
          }}>
            <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>Departments</p>
            <h3 style={{ fontSize: "32px", fontWeight: "700", color: "#1e293b", margin: "8px 0 0 0" }}>
              {analyticsData.departmentDistribution.length}
            </h3>
          </div>

          <div style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            borderLeft: "4px solid #f59e0b",
          }}>
            <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>Pending Leaves</p>
            <h3 style={{ fontSize: "32px", fontWeight: "700", color: "#1e293b", margin: "8px 0 0 0" }}>
              {analyticsData.leaveStats.pending || 0}
            </h3>
          </div>

          <div style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            borderLeft: "4px solid #8b5cf6",
          }}>
            <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>Avg Attendance</p>
            <h3 style={{ fontSize: "32px", fontWeight: "700", color: "#1e293b", margin: "8px 0 0 0" }}>
              {analyticsData.monthlyAttendance.length > 0
                ? Math.round(
                    analyticsData.monthlyAttendance.reduce((sum, m) => sum + m.percentage, 0) /
                      analyticsData.monthlyAttendance.length
                  )
                : 0}%
            </h3>
          </div>
        </div>

        {/* Charts Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "24px",
        }}>
          {/* Department Distribution */}
          <div style={{
            background: "white",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}>
            <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1e293b", marginBottom: "20px" }}>
              Department Distribution
            </h3>
            <div style={{ height: "300px" }}>
              <Bar data={departmentChartData} options={chartOptions} />
            </div>
          </div>

          {/* Monthly Attendance Trend */}
          <div style={{
            background: "white",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}>
            <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1e293b", marginBottom: "20px" }}>
              Monthly Attendance Trend
            </h3>
            <div style={{ height: "300px" }}>
              <Line data={attendanceChartData} options={chartOptions} />
            </div>
          </div>

          {/* Salary Distribution */}
          <div style={{
            background: "white",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}>
            <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1e293b", marginBottom: "20px" }}>
              Salary Distribution
            </h3>
            <div style={{ height: "300px" }}>
              <Bar data={salaryChartData} options={chartOptions} />
            </div>
          </div>

          {/* Leave Statistics */}
          <div style={{
            background: "white",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}>
            <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1e293b", marginBottom: "20px" }}>
              Leave Request Status
            </h3>
            <div style={{ height: "300px" }}>
              <Doughnut data={leaveChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Insights Section */}
        <div style={{
          marginTop: "30px",
          background: "white",
          padding: "24px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}>
          <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1e293b", marginBottom: "16px" }}>
            📌 Key Insights
          </h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            <li style={{ padding: "12px 0", borderBottom: "1px solid #e2e8f0" }}>
              <span style={{ color: "#10b981", fontWeight: "600" }}>✓</span> Production department has the highest number of employees
            </li>
            <li style={{ padding: "12px 0", borderBottom: "1px solid #e2e8f0" }}>
              <span style={{ color: "#10b981", fontWeight: "600" }}>✓</span> Average attendance rate is above 90%
            </li>
            <li style={{ padding: "12px 0", borderBottom: "1px solid #e2e8f0" }}>
              <span style={{ color: "#f59e0b", fontWeight: "600" }}>⚠</span> {analyticsData.leaveStats.pending || 0} leave requests pending approval
            </li>
            <li style={{ padding: "12px 0" }}>
              <span style={{ color: "#3b82f6", fontWeight: "600" }}>ℹ</span> Most employees fall in the 20k-40k salary range
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default EmployeeAnalytics;
