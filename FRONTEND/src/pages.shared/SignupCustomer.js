// src/pages.shared/SignupCustomer.js
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import http from "../api/http";
import { COLORS, shadows, radii } from "../theme";
import logoImage from "../assets/logo1.png";

export default function SignupCustomer() {
  const [form, setForm] = useState({
    username: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""   // ✅ add confirmPassword
  });
  const [msg, setMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const nav = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    if (!form.username.trim()) newErrors.username = "Username is required";
    if (!form.name.trim()) newErrors.name = "Full name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Please enter a valid email";
    if (!form.phone.trim()) newErrors.phone = "Phone number is required";
    if (!form.password) newErrors.password = "Password is required";
    else if (form.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (!form.confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    else if (form.confirmPassword !== form.password) newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    setErrors({});
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // ✅ match backend field names and normalize
      const payload = {
        username: form.username.trim(),
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword, // ✅ send confirmPassword
        // role not sent → backend defaults to "customer"
      };

      // ❗️FIX: correct endpoint
      const { data } = await http.post("/auth/signup", payload);

      if (data.ok) {
        setMsg(data.message || "Signup successful! Redirecting to login...");
        setTimeout(() => nav("/login"), 1500);
      } else {
        setMsg(data.message || "Signup failed. Please try again.");
      }
    } catch (e) {
      // show the backend's real reason (duplicate email/username, etc.)
      console.error("Signup error:", e.response?.data || e.message);
      setMsg(e.response?.data?.message || e.message || "Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // ===== styles (unchanged from yours) =====
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
    maxWidth: "480px",
    position: "relative",
    overflow: "hidden"
  };
  const headerStyle = { textAlign: "center", marginBottom: "32px" };
  const logoStyle = {
    width: "64px", height: "64px",
    background: `linear-gradient(135deg, ${COLORS.green}, ${COLORS.brown})`,
    borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 16px", overflow: "hidden", border: "3px solid rgba(255,255,255,0.2)"
  };
  const logoImageStyle = { width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" };
  const titleStyle = { color: COLORS.text, fontSize: "28px", fontWeight: "700", margin: "0 0 8px 0" };
  const subtitleStyle = { color: COLORS.muted, fontSize: "16px", margin: "0" };
  const formStyle = { display: "flex", flexDirection: "column", gap: "20px" };
  const inputGroupStyle = { position: "relative" };
  const inputStyle = {
    width: "100%", padding: "16px 20px",
    border: `2px solid #E5E7EB`, borderRadius: radii.md,
    fontSize: "16px", transition: "all 0.3s ease", outline: "none", boxSizing: "border-box"
  };
  const inputErrorStyle = { borderColor: "#DC2626", boxShadow: "0 0 0 3px #DC262620" };
  const inputFocusStyle = { borderColor: COLORS.green, boxShadow: `0 0 0 3px ${COLORS.green}20` };
  const passwordToggleStyle = {
    position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)",
    background: "none", border: "none", cursor: "pointer", color: COLORS.muted,
    fontSize: "18px", padding: "4px", borderRadius: "4px", transition: "all 0.2s ease"
  };
  const errorTextStyle = { color: "#DC2626", fontSize: "14px", marginTop: "4px", marginLeft: "4px" };
  const buttonStyle = {
    background: `linear-gradient(135deg, ${COLORS.green}, ${COLORS.brown})`,
    color: COLORS.white, border: "none", padding: "16px 24px",
    borderRadius: radii.md, fontSize: "16px", fontWeight: "600",
    cursor: "pointer", transition: "all 0.3s ease", position: "relative", overflow: "hidden"
  };
  const buttonDisabledStyle = { opacity: 0.6, cursor: "not-allowed", transform: "none" };
  const messageStyle = { padding: "12px 16px", borderRadius: radii.sm, fontSize: "14px", textAlign: "center", marginTop: "16px" };
  const errorStyle = { background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" };
  const successStyle = { background: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0" };
  const footerStyle = { textAlign: "center", marginTop: "24px", paddingTop: "24px", borderTop: "1px solid #E5E7EB" };
  const linkStyle = { color: COLORS.green, textDecoration: "none", fontWeight: "500", transition: "color 0.2s ease" };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "100px", height: "100px",
          background: `linear-gradient(135deg, ${COLORS.green}10, ${COLORS.brown}10)`, borderRadius: "50%", zIndex: 0 }} />
        <div style={{ position: "absolute", bottom: "-30px", left: "-30px", width: "60px", height: "60px",
          background: `linear-gradient(135deg, ${COLORS.brown}10, ${COLORS.green}10)`, borderRadius: "50%", zIndex: 0 }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={headerStyle}>
            <div style={logoStyle}><img src={logoImage} alt="Green Lion Logo" style={logoImageStyle} /></div>
            <h1 style={titleStyle}>Create Account</h1>
            <p style={subtitleStyle}>Join Green Lion and start your journey</p>
          </div>

          <form onSubmit={submit} style={formStyle}>
            <div style={inputGroupStyle}>
              <input
                style={{ ...inputStyle, ...(errors.username ? inputErrorStyle : {}), ...(form.username && !errors.username ? inputFocusStyle : {}) }}
                placeholder="Username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
              {errors.username && <div style={errorTextStyle}>{errors.username}</div>}
            </div>

            <div style={inputGroupStyle}>
              <input
                style={{ ...inputStyle, ...(errors.name ? inputErrorStyle : {}), ...(form.name && !errors.name ? inputFocusStyle : {}) }}
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              {errors.name && <div style={errorTextStyle}>{errors.name}</div>}
            </div>

            <div style={inputGroupStyle}>
              <input
                style={{ ...inputStyle, ...(errors.email ? inputErrorStyle : {}), ...(form.email && !errors.email ? inputFocusStyle : {}) }}
                type="email"
                placeholder="Email Address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              {errors.email && <div style={errorTextStyle}>{errors.email}</div>}
            </div>

            <div style={inputGroupStyle}>
              <input
                style={{ ...inputStyle, ...(errors.phone ? inputErrorStyle : {}), ...(form.phone && !errors.phone ? inputFocusStyle : {}) }}
                placeholder="Phone Number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
              {errors.phone && <div style={errorTextStyle}>{errors.phone}</div>}
            </div>

            <div style={inputGroupStyle}>
              <input
                style={{ ...inputStyle, paddingRight: "50px", ...(errors.password ? inputErrorStyle : {}), ...(form.password && !errors.password ? inputFocusStyle : {}) }}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
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
              {errors.password && <div style={errorTextStyle}>{errors.password}</div>}
            </div>

            {/* ✅ Confirm Password */}
            <div style={inputGroupStyle}>
              <input
                style={{ ...inputStyle, ...(errors.confirmPassword ? inputErrorStyle : {}), ...(form.confirmPassword && !errors.confirmPassword ? inputFocusStyle : {}) }}
                type="password"
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
              />
              {errors.confirmPassword && <div style={errorTextStyle}>{errors.confirmPassword}</div>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{ ...buttonStyle, ...(isLoading ? buttonDisabledStyle : {}) }}
              onMouseEnter={(e) => !isLoading && (e.target.style.transform = "translateY(-2px)")}
              onMouseLeave={(e) => !isLoading && (e.target.style.transform = "translateY(0)")}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {msg && (
            <div style={{ ...messageStyle, ...(msg.toLowerCase().includes("success") ? successStyle : errorStyle) }}>
              {msg}
            </div>
          )}

          <div style={footerStyle}>
            <p style={{ margin: "0 0 16px 0", color: COLORS.muted }}>
              Already have an account?{" "}
              <Link to="/login" style={linkStyle} onMouseEnter={(e) => (e.target.style.color = COLORS.brown)}>
                Sign in here
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

      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
