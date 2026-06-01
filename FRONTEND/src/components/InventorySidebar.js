import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

export default function InventorySidebar() {
  const [open, setOpen] = useState(true);
  const location = useLocation();

  const itemStyle = (isActive) => ({
    display: "flex",
    alignItems: "center",
    padding: "14px 20px",
    color: isActive ? "#fbbf24" : "#cbd5e1",
    textDecoration: "none",
    backgroundColor: isActive ? "#334155" : "transparent",
    borderRight: isActive ? "3px solid #fbbf24" : "none",
    transition: "all 0.2s ease",
    borderRadius: 6,
    margin: "4px 8px",
  });

  const iconWrap = { fontSize: 18, width: 24, textAlign: "center", marginRight: open ? 12 : 0 };

  // Custom isActive function to fix Dashboard always being highlighted
  const isActive = (path, currentPath) => {
    if (path === "/admin/inventory") {
      // For Dashboard, only active if exactly on the inventory base path
      return currentPath === "/admin/inventory" || currentPath === "/admin/inventory/";
    }
    // For other links, use startsWith logic
    return currentPath.startsWith(path);
  };

  const links = [
    { to: "/admin/inventory", label: "Dashboard", icon: "📊" },
    { to: "/admin/inventory/finished", label: "Finished Products", icon: "✅" },
    { to: "/admin/inventory/raw-materials", label: "Raw Materials", icon: "🧱" },
    { to: "/admin/inventory/production-usage-mapping", label: "Production Mapping", icon: "🔗" },
    { to: "/admin/inventory/movements", label: "Stock Movements", icon: "🔃" },
    { to: "/admin/inventory/alerts", label: "Low Stock Alerts", icon: "⚠️" },
    { to: "/admin/inventory/analytics", label: "Analytics", icon: "📈" },
    
  ];

  return (
    <aside style={{
      width: open ? 280 : 80,
      backgroundColor: "#1e293b",
      color: "#fff",
      transition: "width 0.3s ease",
      height: "100vh",
      paddingTop: 16,
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
      position: "sticky",
      top: 0,
    }}>
      {/* Back to Admin Dashboard Button */}
      <NavLink 
        to="/admin"
        style={{
          display: "flex",
          alignItems: "center",
          padding: "14px 20px",
          margin: "16px 8px 8px 8px",
          color: "#cbd5e1",
          textDecoration: "none",
          backgroundColor: "#0f172a",
          border: "1px solid #334155",
          borderRadius: 6,
          transition: "all 0.2s ease",
          justifyContent: open ? "flex-start" : "center",
          gap: open ? 12 : 0
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#1e293b";
          e.currentTarget.style.borderColor = "#fbbf24";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#0f172a";
          e.currentTarget.style.borderColor = "#334155";
        }}
      >
        <span style={{ fontSize: 18 }}>⬅️</span>
        {open && <span style={{ fontSize: 14, fontWeight: 600 }}>Back to Admin Dashboard</span>}
      </NavLink>

      <div style={{
        padding: "20px 16px",
        borderBottom: "1px solid #334155",
        display: "flex",
        alignItems: "center",
        justifyContent: open ? "flex-start" : "center",
        gap: 10,
      }}>
        <div style={{ fontSize: 22 }}>📦</div>
        {open && <div style={{ fontSize: 18, fontWeight: 700 }}>Inventory</div>}
      </div>

      <nav style={{ padding: "12px 0", flex: 1 }}>
        {links.map((l) => {
          const active = isActive(l.to, location.pathname);
          return (
            <NavLink key={l.to} to={l.to}
              style={() => itemStyle(active)}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = "#334155"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = "transparent"; }}
              className={active ? "active" : ""}
            >
            <span style={iconWrap}>{l.icon}</span>
            {open && <span style={{ fontSize: 14, fontWeight: 500 }}>{l.label}</span>}
          </NavLink>
          );
        })}
      </nav>

      <button
        onClick={() => setOpen(!open)}
        style={{
          margin: 16,
          backgroundColor: "#475569",
          border: "none",
          color: "white",
          padding: 8,
          borderRadius: 6,
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#64748b"}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#475569"}
      >
        {open ? "◀" : "▶"}
      </button>
    </aside>
  );
}
