import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
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
  Image as ImageIcon,
} from "lucide-react";
import EmployeeAdminSidebar from "../components/EmployeeAdminSidebar";

function EditEmployee() {
  const { employee_id } = useParams();
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
    account_number: "",
    hire_date: "",
    emergency_contact: "",
    basic_salary: "",
    profile_photo: "",
  });

  const [profileImage, setProfileImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
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

  // Fetch employee details
  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/employee/${employee_id}`)
      .then((res) => {
        const emp = res.data;

        // format dates for inputs
        const formattedEmp = {
          ...emp,
          dob: emp.dob ? emp.dob.split("T")[0] : "",
          hire_date: emp.hire_date ? emp.hire_date.split("T")[0] : "",
          department: emp.department || "",
        };

        setEmployee(formattedEmp);
        setPreview(emp.profile_photo || null);
      })
      .catch((err) => console.error(err));
  }, [employee_id]);

  // handle text input
  const handleChange = (e) => {
    setEmployee({ ...employee, [e.target.name]: e.target.value });
  };

  // handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // submit updated employee
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(employee).forEach((key) => {
        formData.append(key, employee[key]);
      });
      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      await axios.put(
        `http://localhost:5000/api/employee/${employee_id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      alert(" Employee Updated Successfully!");
      navigate("/employee");
    } catch (error) {
      setMessage("⚠️ Error: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
    <EmployeeAdminSidebar />

    <div style={{ flex: 1 }}>
    <div style={styles.container}>
      <h2 style={styles.heading}>Edit Employee</h2>
      <form onSubmit={handleSubmit} style={styles.form} encType="multipart/form-data">
        {/* Profile Image */}
        <label style={styles.label}>
          <ImageIcon size={16} style={{ marginRight: 5 }} /> Profile Image
        </label>
        <div style={styles.inputGroup}>
          <input type="file" accept="image/*" onChange={handleImageChange} style={styles.input} />
        </div>
        {preview && (
          <div style={{ textAlign: "center", margin: "10px 0" }}>
            <img
              src={preview}
              alt="Preview"
              width="100"
              height="100"
              style={{ borderRadius: "50%" }}
            />
          </div>
        )}

        {/* First & Last Name */}
        <div style={styles.row}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>
              <User size={16} style={{ marginRight: 5 }} /> First Name
            </label>
            <div style={styles.inputGroup}>
              <input
                name="first_name"
                value={employee.first_name}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>
              <User size={16} style={{ marginRight: 5 }} /> Last Name
            </label>
            <div style={styles.inputGroup}>
              <input
                name="last_name"
                value={employee.last_name}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>
          </div>
        </div>

        {/* DOB */}
        <label style={styles.label}>
          <Calendar size={16} style={{ marginRight: 5 }} /> Date of Birth
        </label>
        <div style={styles.inputGroup}>
          <input
            name="dob"
            type="date"
            value={employee.dob}
            onChange={handleChange}
            required
            style={styles.input}
          />
        </div>

        {/* Phone */}
        <label style={styles.label}>
          <Phone size={16} style={{ marginRight: 5 }} /> Phone
        </label>
        <div style={styles.inputGroup}>
          <input
            name="phone"
            value={employee.phone}
            onChange={handleChange}
            required
            style={styles.input}
          />
        </div>

        {/* Job Title */}
        <label style={styles.label}>
          <Briefcase size={16} style={{ marginRight: 5 }} /> Job Title
        </label>
        <div style={styles.inputGroup}>
          <input
            name="job_title"
            value={employee.job_title}
            onChange={handleChange}
            required
            style={styles.input}
          />
        </div>

        {/* Gender */}
        <label style={styles.label}>Gender</label>
        <select
          name="gender"
          value={employee.gender}
          onChange={handleChange}
          style={styles.input}
        >
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select>

        {/* Email */}
        <label style={styles.label}>
          <Mail size={16} style={{ marginRight: 5 }} /> Email
        </label>
        <div style={styles.inputGroup}>
          <input
            name="email"
            type="email"
            value={employee.email}
            onChange={handleChange}
            required
            style={styles.input}
          />
        </div>

        {/* Address */}
        <label style={styles.label}>
          <Home size={16} style={{ marginRight: 5 }} /> Address
        </label>
        <div style={styles.inputGroup}>
          <input
            name="address"
            value={employee.address}
            onChange={handleChange}
            required
            style={styles.input}
          />
        </div>

        {/* Status */}
        <label style={styles.label}>
          <AlertCircle size={16} style={{ marginRight: 5 }} /> Status
        </label>
        <select
          name="status"
          value={employee.status}
          onChange={handleChange}
          style={styles.input}
        >
          <option>Active</option>
          <option>Inactive</option>
        </select>

        {/* Department */}
        <label style={styles.label}>
          <Briefcase size={16} style={{ marginRight: 5 }} /> Department
        </label>
        <select
          name="department"
          value={employee.department}
          onChange={handleChange}
          style={styles.input}
        >
          <option value="">Select Department</option>
          {departments.map((dept) => (
            <option key={dept.department_id} value={dept.name}>
              {dept.name}
            </option>
          ))}
        </select>

        {/* Account Number */}
        <label style={styles.label}>
          <DollarSign size={16} style={{ marginRight: 5 }} /> Account Number
        </label>
        <div style={styles.inputGroup}>
          <input
            name="account_number"
            value={employee.account_number}
            onChange={handleChange}
            required
            style={styles.input}
          />
        </div>

        {/* Hire Date */}
        <label style={styles.label}>
          <Calendar size={16} style={{ marginRight: 5 }} /> Hire Date
        </label>
        <div style={styles.inputGroup}>
          <input
            name="hire_date"
            type="date"
            value={employee.hire_date}
            onChange={handleChange}
            required
            style={styles.input}
          />
        </div>

        {/* Emergency Contact */}
        <label style={styles.label}>
          <AlertCircle size={16} style={{ marginRight: 5 }} /> Emergency Contact
        </label>
        <div style={styles.inputGroup}>
          <input
            name="emergency_contact"
            value={employee.emergency_contact}
            onChange={handleChange}
            required
            style={styles.input}
          />
        </div>

        {/* Basic Salary */}
        <label style={styles.label}>
          <DollarSign size={16} style={{ marginRight: 5 }} /> Basic Salary
        </label>
        <div style={styles.inputGroup}>
          <input
            name="basic_salary"
            type="number"
            value={employee.basic_salary}
            onChange={handleChange}
            required
            style={styles.input}
          />
        </div>

        <button type="submit" style={styles.button}>
          <CheckCircle size={18} style={{ marginRight: "8px" }} /> Update Employee
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
  heading: { textAlign: "center", marginBottom: "15px", color: "#333" },
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
  input: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "14px",
    padding: "8px",
  },
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
};

export default EditEmployee;
