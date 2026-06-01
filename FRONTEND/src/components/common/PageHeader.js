import React from "react";

export default function PageHeader({ title, subtitle, actions = [] }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", margin: 0 }}>{title}</h1>
          {subtitle && <p style={{ color: "#64748b", marginTop: 6 }}>{subtitle}</p>}
        </div>
        {actions?.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {actions.map((a, idx) => (
              <button key={idx} onClick={a.onClick} style={{
                background: a.primary ? "#2563eb" : "#0ea5e9",
                color: "white",
                border: "none",
                padding: "10px 14px",
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: 600
              }}>{a.label}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
