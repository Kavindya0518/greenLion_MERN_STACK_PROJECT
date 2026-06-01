import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import EmployeeAdminSidebar from "../components/EmployeeAdminSidebar";

function ViewEmployee() {
  const { employee_id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/employee/${employee_id}`)
      .then((res) => setEmployee(res.data))
      .catch((err) => console.error(err));
  }, [employee_id]);

  if (!employee) return <p style={{ textAlign: "center", marginTop: "50px" }}>Loading...</p>;

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <EmployeeAdminSidebar />
      <div style={{ flex: 1 }}>
        <div style={styles.container}>
          <button style={styles.buttonBack} onClick={() => navigate(-1)}>
            Back
          </button>

          <div style={styles.profileCard}>
            <div style={styles.header}>
              <img
                src={
                  employee.profileImage
                    ? `http://localhost:5000/uploads/${employee.profileImage}`
                    : "https://via.placeholder.com/120"
                }
                alt="Profile"
                style={styles.profileImage}
              />
              <div>
                <h2 style={styles.name}>
                  {employee.first_name} {employee.last_name}
                </h2>
                <p style={styles.jobTitle}>{employee.job_title}</p>
              </div>
            </div>

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Personal Information</h3>
              <DetailRow label="Employee ID" value={employee.employee_id} />
              <DetailRow label="Date of Birth" value={employee.dob?.split("T")[0]} />
              <DetailRow label="Gender" value={employee.gender} />
              <DetailRow label="Email" value={employee.email} />
              <DetailRow label="Phone" value={employee.phone} />
              <DetailRow label="Address" value={employee.address} />
            </div>

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Work Information</h3>
              <DetailRow label="Status" value={employee.status} />
              <DetailRow label="Hire Date" value={employee.hire_date?.split("T")[0]} />
              <DetailRow label="Job Title" value={employee.job_title} />
              <DetailRow label="Department" value={employee.department || "Not Assigned"} />
              <DetailRow label="Basic Salary" value={`Rs. ${employee.basic_salary}`} />
            </div>

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Other Details</h3>
              <DetailRow label="Account Number" value={employee.account_number} />
              <DetailRow label="Emergency Contact" value={employee.emergency_contact} />
            </div>

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Account Details</h3>
              <DetailRow label="Password" value={employee.password} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const DetailRow = ({ label, value }) => (
  <div style={styles.row}>
    <span style={styles.label}>{label}</span>
    <span style={styles.value}>{value || "-"}</span>
  </div>
);

const styles = {
  container: {
    maxWidth: "800px",
    margin: "40px auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },
  buttonBack: {
    marginBottom: "20px",
    padding: "10px 16px",
    cursor: "pointer",
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontWeight: "500",
    transition: "all 0.2s ease",
  },
  profileCard: {
    background: "#ffffff",
    borderRadius: "12px",
    padding: "30px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    marginBottom: "30px",
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: "20px",
  },
  profileImage: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "4px solid #16a34a20",
  },
  name: { margin: "0", fontSize: "24px", fontWeight: "700", color: "#111827" },
  jobTitle: { margin: "5px 0 0", color: "#6b7280", fontSize: "16px" },
  section: { marginBottom: "20px" },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    marginBottom: "12px",
    color: "#0ba01fff",
    borderLeft: "4px solid #16a34a",
    paddingLeft: "10px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid #f1f5f9",
  },
  label: { fontWeight: "600", color: "#374151" },
  value: { color: "#111827" },
};

export default ViewEmployee;
