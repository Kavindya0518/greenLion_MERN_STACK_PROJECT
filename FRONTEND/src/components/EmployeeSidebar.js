import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function EmployeeSidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const menuItems = [
    { title: "Dashboard", path: "/empDashboard", icon: "🏠", active: location.pathname === "/empDashboard" },
    { title: "Profile", path: "/empProfile", icon: "👤", active: location.pathname === "/empProfile" },
    { title: "Attendance", path: "/empAttendance", icon: "📅", active: location.pathname === "/empAttendance" },
    { title: "My Leaves", path: "/empLeave", icon: "📄", active: location.pathname === "/empLeave" },
    { title: "My Salary", path: "/empSalaries", icon: "💰", active: location.pathname === "/empSalaries" },
  ];

  return (
    <div style={{
      width: sidebarOpen ? "280px" : "80px",
      backgroundColor: "#1e293b",
      color: "white",
      transition: "width 0.3s ease",
      height: "100vh",
      paddingTop: "60px",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
      position: "sticky",
      top: 0,
      overflowY: "auto",
      overflowX: "hidden"
    }}>
      {/* Logo */}
      <div style={{
        padding: "24px",
        borderBottom: "1px solid #334155",
        display: "flex",
        alignItems: "center",
        justifyContent: sidebarOpen ? "flex-start" : "center"
      }}>
        <div style={{ fontSize: "24px", marginRight: sidebarOpen ? "12px" : "0" }}>🧑‍💼</div>
        {sidebarOpen && (
          <div style={{ fontSize: "20px", fontWeight: "bold" }}>Employee</div>
        )}
      </div>

      {/* Menu Items */}
      <nav style={{ padding: "16px 0", flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {menuItems.map((item, index) => {
          const active = item.active;
          return (
            <Link
              key={index}
              to={item.path}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "16px 24px",
                color: active ? "#fbbf24" : "#cbd5e1",
                textDecoration: "none",
                backgroundColor: active ? "#334155" : "transparent",
                borderRight: active ? "3px solid #fbbf24" : "none",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.backgroundColor = "#334155";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <span style={{ fontSize: "20px", marginRight: sidebarOpen ? "16px" : "0" }}>
                {item.icon}
              </span>
              {sidebarOpen && (
                <span style={{ fontSize: "16px", fontWeight: "500" }}>{item.title}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          margin: "24px",
          backgroundColor: "#475569",
          border: "none",
          color: "white",
          padding: "8px",
          borderRadius: "6px",
          cursor: "pointer",
          transition: "all 0.2s ease"
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#64748b"}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#475569"}
      >
        {sidebarOpen ? "◀" : "▶"}
      </button>
    </div>
  );
}
