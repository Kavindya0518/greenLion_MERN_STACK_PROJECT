import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaPhone, FaEdit, FaKey, FaCamera, FaSave, FaTimes } from "react-icons/fa";
import http from "../../api/http";
import { getCurrentUser } from "../../auth";
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Spinner } from "../../components/ui";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // Helper function to navigate with scroll to top
  const navigateWithScrollToTop = (path) => {
    navigate(path);
    setTimeout(() => window.scrollTo(0, 0), 100);
  };

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    username: ""
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data } = await http.get("/api/profile");
        if (data.success) {
          setUser(data.user);
          setFormData({
            name: data.user.name || "",
            phone: data.user.phone || "",
            username: data.user.username || ""
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        if (error.response?.status === 401) {
          navigateWithScrollToTop("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditToggle = () => {
    if (editing) {
      // Cancel editing - reset form data
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        username: user.username || ""
      });
    }
    setEditing(!editing);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      console.log("Saving profile with data:", formData);
      
      const { data } = await http.put("/api/profile", formData);
      console.log("Profile update response:", data);
      
      if (data.success) {
        setUser(data.user);
        setEditing(false);
        alert("Profile updated successfully!");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      const errorMessage = error.response?.data?.message || "Failed to update profile";
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: <FaUser /> },
    { id: "security", label: "Security", icon: <FaKey /> }
  ];

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "100vh",
        paddingTop: "72px"
      }}>
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "100vh",
        paddingTop: "72px"
      }}>
        <div className="text-center">
          <h2>Failed to load profile</h2>
          <Button onClick={() => navigateWithScrollToTop("/login")}>Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ minHeight: "100vh", backgroundColor: "#F8F9FA" }}>
        {/* Creative Header Section */}
        <div style={{
          paddingTop: "60px",
          paddingBottom: "32px",
          background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 50%, #ffffff 100%)",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Decorative Background Elements */}
          <div style={{
            position: "absolute",
            top: "-50px",
            right: "-50px",
            width: "200px",
            height: "200px",
            background: "linear-gradient(135deg, rgba(30, 127, 59, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)",
            borderRadius: "50%",
            filter: "blur(40px)"
          }} />
          <div style={{
            position: "absolute",
            bottom: "-30px",
            left: "-30px",
            width: "150px",
            height: "150px",
            background: "linear-gradient(135deg, rgba(30, 127, 59, 0.03) 0%, rgba(16, 185, 129, 0.03) 100%)",
            borderRadius: "50%",
            filter: "blur(30px)"
          }} />

          <div style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "0 24px",
            position: "relative",
            zIndex: 1
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start"
            }}>
              {/* Title & Description */}
              <div>
                <h1 style={{
                  fontSize: "2rem",
                  fontWeight: "800",
                  background: "linear-gradient(135deg, #111827 0%, #1E7F3B 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  margin: 0,
                  marginBottom: "10px"
                }}>
                  My Profile
                </h1>
                <p style={{
                  fontSize: "0.95rem",
                  color: "#6B7280"
                }}>
                  Manage your account settings and preferences ✨
                </p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "24px" }}>
          {/* Modern Sidebar */}
          <div>
            <div style={{
              background: "white",
              borderRadius: "16px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
              border: "1px solid #E5E7EB",
              overflow: "hidden"
            }}>
              {tabs.map((tab, index) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      width: "100%",
                    padding: "20px 24px",
                      border: "none",
                    background: activeTab === tab.id ? "#F0FDF4" : "transparent",
                    color: activeTab === tab.id ? "#1E7F3B" : "#6B7280",
                      display: "flex",
                      alignItems: "center",
                    gap: "16px",
                      cursor: "pointer",
                    transition: "all 0.2s ease",
                    textAlign: "left",
                    fontSize: "0.95rem",
                    fontWeight: activeTab === tab.id ? "600" : "500",
                    borderBottom: index < tabs.length - 1 ? "1px solid #F3F4F6" : "none",
                    position: "relative"
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.id) {
                      e.target.style.background = "#F9FAFB";
                      e.target.style.color = "#374151";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.id) {
                      e.target.style.background = "transparent";
                      e.target.style.color = "#6B7280";
                    }
                  }}
                >
                  <div style={{
                    fontSize: "1.125rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    {tab.icon}
                  </div>
                    {tab.label}
                  {activeTab === tab.id && (
                    <div style={{
                      position: "absolute",
                      right: "0",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "4px",
                      height: "24px",
                      background: "#1E7F3B",
                      borderRadius: "2px"
                    }} />
                  )}
                  </button>
                ))}
            </div>
          </div>

          {/* Main Content */}
          <div>
            {activeTab === "profile" && (
              <div style={{
                background: "white",
                borderRadius: "16px",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                border: "1px solid #E5E7EB",
                overflow: "hidden"
              }}>
                <div style={{
                  padding: "32px",
                  borderBottom: "1px solid #F3F4F6",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <h2 style={{
                    fontSize: "1.5rem",
                    fontWeight: "700",
                    color: "#111827",
                    margin: 0
                  }}>
                    Personal Information
                  </h2>
                  <div style={{ display: "flex", gap: "12px" }}>
                    {editing ? (
                      <>
                        <button
                          onClick={handleEditToggle}
                          disabled={saving}
                          style={{
                            padding: "10px 20px",
                            background: "#F3F4F6",
                            color: "#6B7280",
                            border: "1px solid #D1D5DB",
                            borderRadius: "8px",
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            transition: "all 0.2s ease"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = "#E5E7EB";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = "#F3F4F6";
                          }}
                        >
                          <FaTimes size={14} /> Cancel
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          disabled={saving}
                          style={{
                            padding: "10px 20px",
                            background: saving ? "#9CA3AF" : "#1E7F3B",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            cursor: saving ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            transition: "all 0.2s ease"
                          }}
                          onMouseEnter={(e) => {
                            if (!saving) {
                              e.target.style.background = "#166534";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!saving) {
                              e.target.style.background = "#1E7F3B";
                            }
                          }}
                        >
                          {saving ? (
                            <div style={{
                              width: "14px",
                              height: "14px",
                              border: "2px solid transparent",
                              borderTop: "2px solid white",
                              borderRadius: "50%",
                              animation: "spin 1s linear infinite"
                            }} />
                          ) : (
                            <FaSave size={14} />
                          )}
                          {saving ? "Saving..." : "Save Changes"}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleEditToggle}
                        style={{
                          padding: "10px 20px",
                          background: "#1E7F3B",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          fontSize: "0.875rem",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = "#166534";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = "#1E7F3B";
                        }}
                      >
                        <FaEdit size={14} /> Edit Profile
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ padding: "32px" }}>
                  <div style={{ display: "grid", gap: "32px" }}>
                    {/* Modern Profile Picture Section */}
                    <div style={{ textAlign: "center", padding: "24px 0" }}>
                      <div style={{
                        width: "140px",
                        height: "140px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #1E7F3B 0%, #10B981 100%)",
                        margin: "0 auto 20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "3.5rem",
                        fontWeight: "800",
                        position: "relative",
                        boxShadow: "0 8px 24px rgba(30, 127, 59, 0.2)"
                      }}>
                        {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                        <button
                          style={{
                            position: "absolute",
                            bottom: "8px",
                            right: "8px",
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: "white",
                            border: "2px solid #1E7F3B",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            color: "#1E7F3B",
                            transition: "all 0.2s ease",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = "scale(1.1)";
                            e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = "scale(1)";
                            e.target.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
                          }}
                        >
                          <FaCamera size={16} />
                        </button>
                      </div>
                      <p style={{ 
                        color: "#6B7280", 
                        fontSize: "0.9rem",
                        fontWeight: "500"
                      }}>
                        Click to change profile picture
                      </p>
                    </div>

                    {/* Modern Form Fields */}
                    <div style={{ display: "grid", gap: "24px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                        <div>
                          <label style={{
                            display: "block",
                            fontSize: "0.9rem",
                            fontWeight: "600",
                            color: "#374151",
                            marginBottom: "10px"
                          }}>
                            Full Name *
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            disabled={!editing}
                            style={{
                              width: "100%",
                              padding: "12px 16px",
                              border: editing ? "2px solid #1E7F3B" : "2px solid #E5E7EB",
                              borderRadius: "10px",
                              fontSize: "0.95rem",
                              background: editing ? "white" : "#F9FAFB",
                              color: "#111827",
                              transition: "all 0.2s ease",
                              outline: "none"
                            }}
                            onFocus={(e) => {
                              if (editing) {
                                e.target.style.borderColor = "#10B981";
                                e.target.style.boxShadow = "0 0 0 3px rgba(16, 185, 129, 0.1)";
                              }
                            }}
                            onBlur={(e) => {
                              if (editing) {
                                e.target.style.borderColor = "#1E7F3B";
                                e.target.style.boxShadow = "none";
                              }
                            }}
                          />
                        </div>
                        <div>
                          <label style={{
                            display: "block",
                            fontSize: "0.9rem",
                            fontWeight: "600",
                            color: "#374151",
                            marginBottom: "10px"
                          }}>
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={user.email}
                            disabled
                            style={{
                              width: "100%",
                              padding: "12px 16px",
                              border: "2px solid #E5E7EB",
                              borderRadius: "10px",
                              fontSize: "0.95rem",
                              background: "#F9FAFB",
                              color: "#6B7280",
                              cursor: "not-allowed"
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                        <div>
                          <label style={{
                            display: "block",
                            fontSize: "0.9rem",
                            fontWeight: "600",
                            color: "#374151",
                            marginBottom: "10px"
                          }}>
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            disabled={!editing}
                            placeholder="Enter your phone number"
                            style={{
                              width: "100%",
                              padding: "12px 16px",
                              border: editing ? "2px solid #1E7F3B" : "2px solid #E5E7EB",
                              borderRadius: "10px",
                              fontSize: "0.95rem",
                              background: editing ? "white" : "#F9FAFB",
                              color: "#111827",
                              transition: "all 0.2s ease",
                              outline: "none"
                            }}
                            onFocus={(e) => {
                              if (editing) {
                                e.target.style.borderColor = "#10B981";
                                e.target.style.boxShadow = "0 0 0 3px rgba(16, 185, 129, 0.1)";
                              }
                            }}
                            onBlur={(e) => {
                              if (editing) {
                                e.target.style.borderColor = "#1E7F3B";
                                e.target.style.boxShadow = "none";
                              }
                            }}
                          />
                        </div>
                        <div>
                          <label style={{
                            display: "block",
                            fontSize: "0.9rem",
                            fontWeight: "600",
                            color: "#374151",
                            marginBottom: "10px"
                          }}>
                            Username
                          </label>
                          <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            disabled={!editing}
                            placeholder="Choose a username"
                            style={{
                              width: "100%",
                              padding: "12px 16px",
                              border: editing ? "2px solid #1E7F3B" : "2px solid #E5E7EB",
                              borderRadius: "10px",
                              fontSize: "0.95rem",
                              background: editing ? "white" : "#F9FAFB",
                              color: "#111827",
                              transition: "all 0.2s ease",
                              outline: "none"
                            }}
                            onFocus={(e) => {
                              if (editing) {
                                e.target.style.borderColor = "#10B981";
                                e.target.style.boxShadow = "0 0 0 3px rgba(16, 185, 129, 0.1)";
                              }
                            }}
                            onBlur={(e) => {
                              if (editing) {
                                e.target.style.borderColor = "#1E7F3B";
                                e.target.style.boxShadow = "none";
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Modern Account Info */}
                    <div style={{
                      padding: "24px",
                      background: "#F8F9FA",
                      borderRadius: "12px",
                      border: "1px solid #E5E7EB"
                    }}>
                      <h3 style={{ 
                        fontSize: "1.125rem", 
                        fontWeight: "700", 
                        marginBottom: "16px", 
                        color: "#111827" 
                      }}>
                        Account Information
                      </h3>
                      <div style={{ 
                        display: "grid", 
                        gridTemplateColumns: "1fr 1fr", 
                        gap: "20px", 
                        fontSize: "0.9rem" 
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ color: "#6B7280", fontWeight: "500" }}>Member since:</span>
                          <span style={{ 
                            color: "#111827", 
                            fontWeight: "600",
                            background: "#E5E7EB",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "0.85rem"
                          }}>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ color: "#6B7280", fontWeight: "500" }}>Account status:</span>
                          <span style={{ 
                            color: user.isActive ? "#059669" : "#DC2626", 
                            fontWeight: "600",
                            background: user.isActive ? "#D1FAE5" : "#FEE2E2",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "0.85rem"
                          }}>
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}


            {activeTab === "security" && (
              <div style={{
                background: "white",
                borderRadius: "16px",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                border: "1px solid #E5E7EB",
                overflow: "hidden"
              }}>
                <div style={{
                  padding: "32px",
                  borderBottom: "1px solid #F3F4F6"
                }}>
                  <h2 style={{
                    fontSize: "1.5rem",
                    fontWeight: "700",
                    color: "#111827",
                    margin: 0
                  }}>
                    Security Settings
                  </h2>
                </div>
                <div style={{ padding: "48px 32px", textAlign: "center" }}>
                  <div style={{
                    width: "80px",
                    height: "80px",
                    background: "linear-gradient(135deg, #1E7F3B 0%, #10B981 100%)",
                    borderRadius: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 24px",
                    boxShadow: "0 8px 24px rgba(30, 127, 59, 0.2)"
                  }}>
                    <FaKey size={32} style={{ color: "white" }} />
                  </div>
                  <h3 style={{ 
                    color: "#111827", 
                    marginBottom: "12px",
                    fontSize: "1.25rem",
                    fontWeight: "700"
                  }}>
                    Change Password
                  </h3>
                  <p style={{ 
                    color: "#6B7280", 
                    marginBottom: "32px",
                    fontSize: "0.95rem",
                    maxWidth: "400px",
                    margin: "0 auto 32px"
                  }}>
                    Update your password to keep your account secure and protected
                  </p>
                  <button
                    onClick={() => navigateWithScrollToTop("/change-password")}
                    style={{
                      padding: "14px 28px",
                      background: "#1E7F3B",
                      color: "white",
                      border: "none",
                      borderRadius: "10px",
                      fontSize: "0.95rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "#166534";
                      e.target.style.transform = "translateY(-2px)";
                      e.target.style.boxShadow = "0 8px 24px rgba(30, 127, 59, 0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "#1E7F3B";
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "none";
                    }}
                  >
                    <FaKey size={16} />
                    Change Password
                  </button>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    </>
  );
}