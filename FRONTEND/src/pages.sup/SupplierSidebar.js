import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import http from "../api/http";

// A professional, accessible, responsive sidebar for Supplier Management
// Props:
// - base (string): base path for links. Defaults to "/admin/suppliers".
// - collapsedInitially (boolean): start in collapsed state on desktop
export default function SupplierSidebar({ base = "/admin/suppliers", collapsedInitially = false }) {
  const [open, setOpen] = useState(!collapsedInitially);
  const [pendingCount, setPendingCount] = useState(0);
  const location = useLocation();

  // Fetch pending suppliers count for badge
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await http.get("/api/suppliers").catch(() => ({ data: [] }));
        const arr = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : []);
        const count = Array.isArray(arr) ? arr.filter(s => (s.status || "active") === "pending").length : 0;
        if (mounted) setPendingCount(count);
      } catch {
        if (mounted) setPendingCount(0);
      }
    };
    load();
    const id = setInterval(load, 60_000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

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
    if (path === `${base}`) {
      // For Dashboard, only active if exactly on the base path
      return currentPath === `${base}` || currentPath === `${base}/`;
    }
    // For other links, use startsWith logic
    return currentPath.startsWith(path);
  };

  const links = useMemo(() => ([
    { label: "Dashboard", icon: "📊", to: `${base}` },
    { label: "Manage Suppliers", icon: "🏢", to: `${base}/manage`, badge: pendingCount },
    { label: "Material Categories", icon: "🏷️", to: `${base}/categories` },
    { label: "Supplier Orders", icon: "📦", to: `${base}/materials` },
    { label: "Price Comparison", icon: "⚖️", to: `${base}/compare` },
    { label: "Purchase Orders", icon: "🧾", to: `/admin/purchase-orders` },
    { label: "Delivery Tracking", icon: "🚚", to: `/admin/deliveries` },
  ]), [base, pendingCount]);

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
        <div style={{ fontSize: 22 }}>🤝</div>
        {open && <div style={{ fontSize: 18, fontWeight: 700 }}>Suppliers</div>}
      </div>

      <nav style={{ padding: "12px 0", flex: 1 }}>
        {links.map((item) => {
          const active = isActive(item.to, location.pathname);
          return (
            <NavLink key={item.to} to={item.to}
              style={() => itemStyle(active)}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = "#334155"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = "transparent"; }}
              className={active ? "active" : ""}
            >
            <span style={iconWrap}>{item.icon}</span>
            {open && (
              <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>{item.label}</span>
            )}
            {item.badge > 0 && open && (
              <span style={{ background: "#ef4444", color: "#fff", padding: "0 6px", borderRadius: 999, fontSize: 12, lineHeight: "18px", minWidth: 22, textAlign: "center" }}>
                {item.badge}
              </span>
            )}
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
