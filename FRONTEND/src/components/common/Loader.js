import React from "react";

export default function Loader({ label = "Loading..." }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 18, height: 18, borderRadius: "50%", border: "3px solid #e5e7eb", borderTopColor: "#2563eb", animation: "spin 1s linear infinite" }} />
        <span style={{ color: "#475569" }}>{label}</span>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }`}</style>
    </div>
  );
}
