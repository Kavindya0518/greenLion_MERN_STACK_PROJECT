import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaKey, FaEye, FaEyeSlash } from "react-icons/fa";
import http from "../../api/http";
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from "../../components/ui";

export default function ChangePassword() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = "New password must be different from current password";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const { data } = await http.put("/api/profile/password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      if (data.success) {
        alert("Password changed successfully!");
        navigate("/profile");
      }
    } catch (error) {
      console.error("Failed to change password:", error);
      const errorMessage = error.response?.data?.message || "Failed to change password";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: "var(--color-gray-50)", 
      paddingTop: "72px" 
    }}>
      <div className="container py-8">
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <div style={{ marginBottom: "32px", textAlign: "center" }}>
            <h1 className="heading-2" style={{ color: "var(--color-primary)", marginBottom: "8px" }}>
              Change Password
            </h1>
            <p style={{ color: "var(--color-gray-600)" }}>
              Update your password to keep your account secure
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <FaKey />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} style={{ display: "grid", gap: "24px" }}>
                {/* Current Password */}
                <div style={{ position: "relative" }}>
                  <label style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--color-gray-700)",
                    marginBottom: "8px"
                  }}>
                    Current Password *
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      className="input"
                      placeholder="Enter your current password"
                      style={{
                        paddingRight: "50px",
                        borderColor: errors.currentPassword ? "var(--color-error)" : undefined
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("current")}
                      style={{
                        position: "absolute",
                        right: "16px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "var(--color-gray-400)",
                        cursor: "pointer",
                        padding: "4px"
                      }}
                    >
                      {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.currentPassword && (
                    <span style={{ 
                      fontSize: "0.75rem", 
                      color: "var(--color-error)",
                      marginTop: "4px",
                      display: "block"
                    }}>
                      {errors.currentPassword}
                    </span>
                  )}
                </div>

                {/* New Password */}
                <div style={{ position: "relative" }}>
                  <label style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--color-gray-700)",
                    marginBottom: "8px"
                  }}>
                    New Password *
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      className="input"
                      placeholder="Enter your new password"
                      style={{
                        paddingRight: "50px",
                        borderColor: errors.newPassword ? "var(--color-error)" : undefined
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("new")}
                      style={{
                        position: "absolute",
                        right: "16px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "var(--color-gray-400)",
                        cursor: "pointer",
                        padding: "4px"
                      }}
                    >
                      {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <span style={{ 
                      fontSize: "0.75rem", 
                      color: "var(--color-error)",
                      marginTop: "4px",
                      display: "block"
                    }}>
                      {errors.newPassword}
                    </span>
                  )}
                </div>

                {/* Confirm Password */}
                <div style={{ position: "relative" }}>
                  <label style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--color-gray-700)",
                    marginBottom: "8px"
                  }}>
                    Confirm New Password *
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="input"
                      placeholder="Confirm your new password"
                      style={{
                        paddingRight: "50px",
                        borderColor: errors.confirmPassword ? "var(--color-error)" : undefined
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("confirm")}
                      style={{
                        position: "absolute",
                        right: "16px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "var(--color-gray-400)",
                        cursor: "pointer",
                        padding: "4px"
                      }}
                    >
                      {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <span style={{ 
                      fontSize: "0.75rem", 
                      color: "var(--color-error)",
                      marginTop: "4px",
                      display: "block"
                    }}>
                      {errors.confirmPassword}
                    </span>
                  )}
                </div>

                {/* Password Requirements */}
                <div style={{
                  padding: "16px",
                  background: "var(--color-gray-50)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-gray-200)"
                }}>
                  <h4 style={{ 
                    fontSize: "0.875rem", 
                    fontWeight: 600, 
                    color: "var(--color-gray-900)",
                    marginBottom: "8px"
                  }}>
                    Password Requirements:
                  </h4>
                  <ul style={{ 
                    fontSize: "0.75rem", 
                    color: "var(--color-gray-600)",
                    margin: 0,
                    paddingLeft: "16px"
                  }}>
                    <li>At least 6 characters long</li>
                    <li>Must be different from your current password</li>
                    <li>Should contain a mix of letters and numbers</li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div style={{ 
                  display: "flex", 
                  gap: "16px", 
                  justifyContent: "flex-end",
                  paddingTop: "8px"
                }}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/profile")}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                  >
                    Change Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
