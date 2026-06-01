import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import EmployeeAdminSidebar from "../components/EmployeeAdminSidebar";
import {
  User,
  Phone,
  Mail,
  Home,
  Calendar,
  Briefcase,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon
} from "lucide-react";

function AddEmployee() {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState({
    employee_id: "",
    first_name: "",
    last_name: "",
    dob: "",
    phone: "",
    job_title: "",
    gender: "Male",
    email: "",
    address: "",
    status: "Active",
    department: "",
    account_number: "",
    hire_date: "",
    emergency_contact: "",
    basic_salary: ""
  });

  const [profileImage, setProfileImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [departments, setDepartments] = useState([]);

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/departments");
        setDepartments(response.data);
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const { name } = e.target;
    let { value } = e.target;
    // Keep raw digits for salary, but show formatted in the input
    let nextValue = value;
    if (name === "basic_salary") {
      nextValue = String(value).replace(/[^0-9]/g, "");
    }
    setEmployee({ ...employee, [name]: nextValue });

    let errorMsg = "";

    if (name === "first_name" && !nextValue.trim()) {
      errorMsg = "First name is required";
    }
    if (name === "last_name" && !nextValue.trim()) {
      errorMsg = "Last name is required";
    }
    if (name === "dob" && new Date(nextValue) > new Date()) {
      errorMsg = "Date of Birth cannot be in the future";
    }
    if (name === "phone" && !/^07[0-9]{8}$/.test(nextValue)) {
      errorMsg = "Phone must start with 07 and contain 10 digits";
    }
    if (name === "emergency_contact" && !/^07[0-9]{8}$/.test(nextValue)) {
      errorMsg = "Phone must start with 07 and contain 10 digits";
    }
    if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextValue)) {
      errorMsg = "Invalid email format";
    }
    if (name === "hire_date" && new Date(nextValue) < new Date(employee.dob)) {
      errorMsg = "Hire Date cannot be before Date of Birth";
    }
    if (name === "basic_salary" && nextValue && Number(nextValue) < 10000) {
      errorMsg = "Basic salary must be at least 10,000";
    }

    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!employee.first_name.trim()) newErrors.first_name = "First name is required";
    if (!employee.last_name.trim()) newErrors.last_name = "Last name is required";
    if (new Date(employee.dob) > new Date()) newErrors.dob = "Date of Birth cannot be in the future";
    if (!/^07[0-9]{8}$/.test(employee.phone)) newErrors.phone = "Phone must start with 07 and contain 10 digits";
    if (!/^07[0-9]{8}$/.test(employee.emergency_contact)) newErrors.phone = "Phone must start with 07 and contain 10 digits";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) newErrors.email = "Invalid email format";
    if (new Date(employee.hire_date) < new Date(employee.dob)) newErrors.hire_date = "Hire Date cannot be before Date of Birth";
    if (employee.basic_salary && Number(employee.basic_salary) < 10000) newErrors.basic_salary = "Basic salary must be at least 10,000";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const formData = new FormData();
      Object.keys(employee).forEach((key) => {
        formData.append(key, employee[key]);
      });
      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      const res = await axios.post("http://localhost:5000/api/employee", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.status === 201 || res.status === 200) {
        setMessage("✅ Employee Added Successfully!");
        setEmployee({
          employee_id: "",
          first_name: "",
          last_name: "",
          dob: "",
          phone: "",
          job_title: "",
          gender: "Male",
          email: "",
          address: "",
          status: "Active",
          account_number: "",
          hire_date: "",
          emergency_contact: "",
          basic_salary: ""
        });
        setProfileImage(null);
        setPreview(null);
        alert("Employee Added successfully!");
        navigate("/employee");
      } else {
        setMessage("❌ Failed to add employee. Please check backend.");
      }
    } catch (error) {
      setMessage("⚠️ Error: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <EmployeeAdminSidebar />
      <div style={{ flex: 1 }}>
        <div style={styles.container}>
          <h2 style={styles.heading}>Add New Employee</h2>
          <form onSubmit={handleSubmit} style={styles.form} encType="multipart/form-data">
            {/* Profile Image */}
            <label style={styles.label}><ImageIcon size={16} style={{ marginRight: 5 }} /> Profile Image</label>
            <div style={styles.inputGroup}>
              <input type="file" name="profileImage" accept="image/*" onChange={handleImageChange} style={styles.input} />
            </div>
            {preview && <div style={{ textAlign: "center", margin: "10px 0" }}>
              <img src={preview} alt="Preview" width="100" height="100" style={{ borderRadius: "50%" }} />
            </div>}

            {/* First & Last Name */}
            <div style={styles.row}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}><User size={16} style={{ marginRight: 5 }} /> First Name</label>
                <div style={styles.inputGroup}>
                  <input name="first_name" placeholder="First Name" value={employee.first_name} onChange={handleChange} style={styles.input} />
                </div>
                {errors.first_name && <p style={styles.error}>{errors.first_name}</p>}
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.label}><User size={16} style={{ marginRight: 5 }} /> Last Name</label>
                <div style={styles.inputGroup}>
                  <input name="last_name" placeholder="Last Name" value={employee.last_name} onChange={handleChange} style={styles.input} />
                </div>
                {errors.last_name && <p style={styles.error}>{errors.last_name}</p>}
              </div>
            </div>

            {/* Date of Birth */}
            <label style={styles.label}><Calendar size={16} style={{ marginRight: 5 }} /> Date of Birth</label>
            <div style={styles.inputGroup}>
              <input name="dob" type="date" value={employee.dob} onChange={handleChange} style={styles.input} />
            </div>
            {errors.dob && <p style={styles.error}>{errors.dob}</p>}

            {/* Phone */}
            <label style={styles.label}><Phone size={16} style={{ marginRight: 5 }} /> Phone</label>
            <div style={styles.inputGroup}>
              <input name="phone" type="tel" placeholder="07XXXXXXXX" value={employee.phone} onChange={handleChange} style={styles.input} />
            </div>
            {errors.phone && <p style={styles.error}>{errors.phone}</p>}

            {/* Job Title */}
            <label style={styles.label}><Briefcase size={16} style={{ marginRight: 5 }} /> Job Title</label>
            <div style={styles.inputGroup}>
              <input name="job_title" placeholder="Job Title" value={employee.job_title} onChange={handleChange} style={styles.input} />
            </div>

            {/* Gender */}
            <label style={styles.label}><User size={16} style={{ marginRight: 5 }} /> Gender</label>
            <select name="gender" value={employee.gender} onChange={handleChange} style={styles.input}>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>

            {/* Email */}
            <label style={styles.label}><Mail size={16} style={{ marginRight: 5 }} /> Email</label>
            <div style={styles.inputGroup}>
              <input name="email" type="email" placeholder="Email" value={employee.email} onChange={handleChange} style={styles.input} />
            </div>
            {errors.email && <p style={styles.error}>{errors.email}</p>}

            {/* Address */}
            <label style={styles.label}><Home size={16} style={{ marginRight: 5 }} /> Address</label>
            <div style={styles.inputGroup}>
              <input name="address" placeholder="Address" value={employee.address} onChange={handleChange} style={styles.input} />
            </div>

            {/* Status */}
            <label style={styles.label}><AlertCircle size={16} style={{ marginRight: 5 }} /> Employee Status</label>
            <select name="status" value={employee.status} onChange={handleChange} style={styles.input}>
              <option>Active</option>
              <option>Inactive</option>
            </select>

            {/* Department */}
            <label style={styles.label}><Briefcase size={16} style={{ marginRight: 5 }} /> Department</label>
            <select name="department" value={employee.department} onChange={handleChange} style={styles.input}>
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept.department_id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>

            {/* Account Number */}
            <label style={styles.label}><DollarSign size={16} style={{ marginRight: 5 }} /> Account Number</label>
            <div style={styles.inputGroup}>
              <input name="account_number" placeholder="Account Number" value={employee.account_number} onChange={handleChange} style={styles.input} />
            </div>

            {/* Hire Date */}
            <label style={styles.label}><Calendar size={16} style={{ marginRight: 5 }} /> Hire Date</label>
            <div style={styles.inputGroup}>
              <input name="hire_date" type="date" value={employee.hire_date} onChange={handleChange} style={styles.input} />
            </div>
            {errors.hire_date && <p style={styles.error}>{errors.hire_date}</p>}

            {/* Emergency Contact */}
            <label style={styles.label}><AlertCircle size={16} style={{ marginRight: 5 }} /> Emergency Contact</label>
            <div style={styles.inputGroup}>
              <input name="emergency_contact" placeholder="Emergency Contact" value={employee.emergency_contact} onChange={handleChange} style={styles.input} />
            </div>
            {errors.emergency_contact && <p style={styles.error}>{errors.emergency_contact}</p>}

            {/* Basic Salary */}
            <label style={styles.label}><DollarSign size={16} style={{ marginRight: 5 }} /> Basic Salary</label>
            <div style={styles.inputGroup}>
              <input
                name="basic_salary"
                type="text"
                placeholder="Basic Salary"
                value={employee.basic_salary ? Number(employee.basic_salary).toLocaleString('en-IN') : ''}
                onChange={handleChange}
                style={styles.input}
                inputMode="numeric"
                aria-label="Basic Salary"
              />
            </div>
            {errors.basic_salary && <p style={styles.error}>{errors.basic_salary}</p>}

            <button type="submit" style={styles.button}>
              <CheckCircle size={18} style={{ marginRight: "8px" }} /> Add Employee
            </button>
          </form>
          {message && <p style={styles.message}>{message}</p>}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "500px",
    margin: "20px auto",
    padding: "20px",
    borderRadius: "10px",
    background: "#f9f9f9",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    fontFamily: "Arial, sans-serif",
  },
  heading: {
    textAlign: "center",
    color: "#333",
    marginBottom: "15px",
  },
  form: { display: "flex", flexDirection: "column" },
  row: { display: "flex", gap: "10px" },
  inputGroup: {
    display: "flex",
    alignItems: "center",
    margin: "5px 0",
    border: "1px solid #ccc",
    borderRadius: "5px",
    padding: "5px 10px",
    background: "#fff",
  },
  input: { flex: 1, border: "none", outline: "none", fontSize: "14px", padding: "8px" },
  label: {
    marginTop: "10px",
    marginBottom: "3px",
    fontWeight: "bold",
    fontSize: "14px",
    color: "#333",
    display: "flex",
    alignItems: "center",
  },
  button: {
    marginTop: "15px",
    padding: "12px",
    border: "none",
    borderRadius: "5px",
    background: "#4CAF50",
    color: "white",
    fontSize: "16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  message: { marginTop: "10px", textAlign: "center", fontWeight: "bold" },
  error: { color: "red", fontSize: "12px", marginTop: "3px" },
};

export default AddEmployee;
