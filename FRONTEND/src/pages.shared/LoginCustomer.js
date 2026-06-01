// src/pages.shared/LoginCustomer.js
import { useState } from "react";
import { Link } from "react-router-dom";
import http from "../api/http";
import { COLORS, shadows, radii } from "../theme";
import logoImage from "../assets/logo1.png";

export default function LoginCustomer() {
  const [form, setForm] = useState({ identity: "", password: "" });
  const [msg, setMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    setIsLoading(true);

    try {
      // trim identity before sending
      const payload = { identity: form.identity.trim(), password: form.password };
      const { data } = await http.post("/auth/login", payload);

      if (data.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        const role = data.user.role;
        if (role === "admin") window.location.href = "/admin";
        else if (role === "supplier") window.location.href = "/supplier";
        else if (role === "employee") window.location.href = "/empDashboard";
        else window.location.href = "/"; // customer
      }
    } catch (e) {
      setMsg(e.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  }

  const containerStyle = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: `linear-gradient(135deg, ${COLORS.green}15 0%, ${COLORS.brown}15 100%)`,
    padding: "20px"
  };

  const cardStyle = {
    background: COLORS.white,
    borderRadius: radii.lg,
    boxShadow: shadows.card,
    padding: "48px 40px",
    width: "100%",
    maxWidth: "420px",
    position: "relative",
    overflow: "hidden"
  };

  const headerStyle = { textAlign: "center", marginBottom: "32px" };

  const logoStyle = {
    width: "64px",
    height: "64px",
    background: `linear-gradient(135deg, ${COLORS.green}, ${COLORS.brown})`,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
    overflow: "hidden",
    border: "3px solid rgba(255,255,255,0.2)"
  };

  const logoImageStyle = { width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" };
  const titleStyle = { color: COLORS.text, fontSize: "28px", fontWeight: "700", margin: "0 0 8px 0" };
  const subtitleStyle = { color: COLORS.muted, fontSize: "16px", margin: 0 };
  const formStyle = { display: "flex", flexDirection: "column", gap: "20px" };
  const inputGroupStyle = { position: "relative" };

  const inputStyle = {
    width: "100%",
    padding: "16px 20px",
    border: "2px solid #E5E7EB",
    borderRadius: radii.md,
    fontSize: "16px",
    transition: "all 0.3s ease",
    outline: "none",
    boxSizing: "border-box"
  };

  const inputFocusStyle = { borderColor: COLORS.green, boxShadow: `0 0 0 3px ${COLORS.green}20` };

  const passwordToggleStyle = {
    position: "absolute",
    right: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: COLORS.muted,
    fontSize: "18px",
    padding: "4px",
    borderRadius: "4px",
    transition: "all 0.2s ease"
  };

  const buttonStyle = {
    background: `linear-gradient(135deg, ${COLORS.green}, ${COLORS.brown})`,
    color: COLORS.white,
    border: "none",
    padding: "16px 24px",
    borderRadius: radii.md,
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    position: "relative",
    overflow: "hidden"
  };

  const buttonDisabledStyle = { opacity: 0.6, cursor: "not-allowed", transform: "none" };

  const messageStyle = {
    padding: "12px 16px",
    borderRadius: radii.sm,
    fontSize: "14px",
    textAlign: "center",
    marginTop: "16px"
  };

  const errorStyle = { background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" };
  const successStyle = { background: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0" };
  const footerStyle = { textAlign: "center", marginTop: "24px", paddingTop: "24px", borderTop: "1px solid #E5E7EB" };
  const linkStyle = { color: COLORS.green, textDecoration: "none", fontWeight: "500", transition: "color 0.2s ease" };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{
          position: "absolute", top: "-50px", right: "-50px", width: "100px", height: "100px",
          background: `linear-gradient(135deg, ${COLORS.green}10, ${COLORS.brown}10)`,
          borderRadius: "50%", zIndex: 0
        }} />
        <div style={{
          position: "absolute", bottom: "-30px", left: "-30px", width: "60px", height: "60px",
          background: `linear-gradient(135deg, ${COLORS.brown}10, ${COLORS.green}10)`,
          borderRadius: "50%", zIndex: 0
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={headerStyle}>
            <div style={logoStyle}>
              <img src={logoImage} alt="Green Lion Logo" style={logoImageStyle} />
            </div>
            <h1 style={titleStyle}>Welcome Back</h1>
            <p style={subtitleStyle}>Sign in to your Green Lion account</p>
          </div>

          <form onSubmit={submit} style={formStyle}>
            <div style={inputGroupStyle}>
              <input
                style={{ ...inputStyle, ...(form.identity ? inputFocusStyle : {}) }}
                placeholder="Username, Email, Phone or Employee ID"
                value={form.identity}
                onChange={(e) => setForm({ ...form, identity: e.target.value })}
                onFocus={(e) => (e.target.style.borderColor = COLORS.green)}
                onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                required
              />
            </div>

            <div style={inputGroupStyle}>
              <input
                style={{ ...inputStyle, paddingRight: "50px", ...(form.password ? inputFocusStyle : {}) }}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onFocus={(e) => (e.target.style.borderColor = COLORS.green)}
                onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                required
              />
              <button
                type="button"
                style={passwordToggleStyle}
                onClick={() => setShowPassword(!showPassword)}
                onMouseEnter={(e) => (e.target.style.color = COLORS.green)}
                onMouseLeave={(e) => (e.target.style.color = COLORS.muted)}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{ ...buttonStyle, ...(isLoading ? buttonDisabledStyle : {}) }}
              onMouseEnter={(e) => !isLoading && (e.target.style.transform = "translateY(-2px)")}
              onMouseLeave={(e) => !isLoading && (e.target.style.transform = "translateY(0)")}>
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {msg && (
            <div style={{ ...messageStyle, ...(msg.toLowerCase().includes("success") ? successStyle : errorStyle) }}>
              {msg}
            </div>
          )}

          <div style={footerStyle}>
            <p style={{ margin: "0 0 16px 0", color: COLORS.muted }}>
              Don't have an account?{" "}
              <Link to="/signup" style={linkStyle} onMouseEnter={(e) => (e.target.style.color = COLORS.brown)}>
                Sign up here
              </Link>
            </p>
            <p style={{ margin: "0", fontSize: "14px", color: COLORS.muted }}>
              <Link to="/" style={linkStyle} onMouseEnter={(e) => (e.target.style.color = COLORS.brown)}>
                ← Back to Home
              </Link>
            </p>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
