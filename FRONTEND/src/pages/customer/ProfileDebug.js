import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../api/http";

export default function ProfileDebug() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    username: ""
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        console.log("Fetching profile...");
        setLoading(true);
        const { data } = await http.get("/api/profile");
        console.log("Profile data received:", data);
        
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
        console.error("Error response:", error.response);
        if (error.response?.status === 401) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Input changed: ${name} = ${value}`);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
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
      console.error("Error response:", error.response);
      const errorMessage = error.response?.data?.message || "Failed to update profile";
      alert(errorMessage);
    }
  };

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (!user) {
    return <div>Failed to load profile</div>;
  }

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Profile Debug</h1>
      
      <div style={{ marginBottom: "20px", padding: "10px", background: "#f0f0f0" }}>
        <h3>Current User Data:</h3>
        <pre>{JSON.stringify(user, null, 2)}</pre>
      </div>

      <div style={{ marginBottom: "20px", padding: "10px", background: "#f0f0f0" }}>
        <h3>Form Data:</h3>
        <pre>{JSON.stringify(formData, null, 2)}</pre>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <button onClick={() => setEditing(!editing)}>
          {editing ? "Cancel Edit" : "Edit Profile"}
        </button>
        {editing && (
          <button onClick={handleSaveProfile} style={{ marginLeft: "10px" }}>
            Save Profile
          </button>
        )}
      </div>

      <div style={{ display: "grid", gap: "10px" }}>
        <div>
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            disabled={!editing}
            style={{ width: "100%", padding: "5px" }}
          />
        </div>

        <div>
          <label>Phone:</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            disabled={!editing}
            style={{ width: "100%", padding: "5px" }}
          />
        </div>

        <div>
          <label>Username:</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            disabled={!editing}
            style={{ width: "100%", padding: "5px" }}
          />
        </div>

        <div>
          <label>Email (read-only):</label>
          <input
            type="email"
            value={user.email}
            disabled
            style={{ width: "100%", padding: "5px", background: "#f0f0f0" }}
          />
        </div>
      </div>
    </div>
  );
}
