import React from "react";

export default function SectionCard({ title, actions = null, children, style }) {
  return (
    <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", ...style }}>
      {(title || actions) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          {title && <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#0f172a" }}>{title}</h3>}
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
