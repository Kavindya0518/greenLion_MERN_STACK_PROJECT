// FRONTEND/src/guards/RoleRoute.js
import React from "react";
import { Navigate } from "react-router-dom";

export default function RoleRoute({ children, allow = [] }) {
  // read user + token from localStorage
  const raw = localStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : null;
  const token = localStorage.getItem("token");

  // not logged in
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // role mismatch → send to correct area
  if (allow.length && !allow.includes(user.role)) {
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    if (user.role === "supplier") return <Navigate to="/supplier" replace />;
    if (user.role === "employee") return <Navigate to="/admin/employees" replace />;
    return <Navigate to="/" replace />;
  }

  // allowed → show content
  return children;
}
