import { useEffect, useState } from "react";
import axios from "axios";
import EmployeeSidebar from "../components/EmployeeSidebar";

function EmployeeProfile() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Get token from localStorage (set after login)
        const token = localStorage.getItem("token");
        if (!token) {
          alert("Please login first");
          return;
        }

        const res = await axios.get("http://localhost:5000/api/employee/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setProfile(res.data);
      } catch (err) {
        console.error("Error fetching profile", err);
        alert("Failed to fetch profile");
      }
    };

    fetchProfile();
  }, []);

  if (!profile) return <p>Loading...</p>;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f9fafb" }}>
      <EmployeeSidebar />
      <div style={{ flex: 1 ,marginTop:"0px"}}>
        <div style={{ position: 'relative', margin: '0 0 70px' }}>
          <div style={{ background: 'linear-gradient(135deg,#bbf7d0,#bbf7d0)', height: 140 }} />
          <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 20px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'absolute', left: 20, bottom: -40 }}>
              <img
                src={
                  profile.profileImage
                    ? `http://localhost:5000/uploads/${profile.profileImage}`
                    : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                }
                alt="Profile"
                style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '4px solid white', boxShadow: '0 6px 14px rgba(0,0,0,0.1)' }}
              />
              <div style={{ background: 'white', borderRadius: 12, padding: '12px 16px', boxShadow: '0 4px 10px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>{profile.first_name} {profile.last_name}</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{profile.job_title || 'Employee'}</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1000, margin: '0 auto 30px', padding: '0 20px', display: 'grid', gap: 20 }}>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, boxShadow: '0 4px 10px rgba(0,0,0,0.05)', padding: 20 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#065f46' }}>Personal Details</h3>
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
              <Info label="First Name" value={profile.first_name} />
              <Info label="Last Name" value={profile.last_name} />
              <Info label="Gender" value={profile.gender} />
              <Info label="Date of Birth" value={profile.dob?.substring(0, 10)} />
              <Info label="Address" value={profile.address} />
              <Info label="Emergency Contact" value={profile.emergency_contact} />
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, boxShadow: '0 4px 10px rgba(0,0,0,0.05)', padding: 20 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#065f46' }}>Employment</h3>
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
              <Info label="Employee ID" value={profile.employee_id} />
              <Info label="Job Title" value={profile.job_title} />
              <Info label="Department" value={profile.department} />
              <Info label="Hire Date" value={profile.hire_date?.substring(0, 10)} />
              <Info label="Status" value={profile.status} />
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, boxShadow: '0 4px 10px rgba(0,0,0,0.05)', padding: 20 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#065f46' }}>Contact</h3>
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
              <Info label="Email" value={profile.email} />
              <Info label="Phone" value={profile.phone} />
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, boxShadow: '0 4px 10px rgba(0,0,0,0.05)', padding: 20 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#065f46' }}>Payroll</h3>
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
              <Info label="Account Number" value={profile.account_number} />
              <Info label="Basic Salary" value={`Rs. ${(Number(profile.basic_salary) || 0).toLocaleString('en-IN')}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div
      style={{
        padding: "15px",
        borderRadius: "10px",
        background: "#f3f4f6",
        fontSize: "15px",
      }}
    >
      <span style={{ fontWeight: "600", color: "#374151" }}>{label}: </span>
      <span style={{ color: "#4b5563" }}>{value || "N/A"}</span>
    </div>
  );
}

export default EmployeeProfile;
