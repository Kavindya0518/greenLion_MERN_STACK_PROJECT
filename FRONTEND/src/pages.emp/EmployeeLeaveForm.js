import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import EmployeeSidebar from "../components/EmployeeSidebar";
import EmployeeNavbar from "../components/EmployeeNavbar";

function LeaveForm() {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState({});
  const [leaveData, setLeaveData] = useState({
    type: "",
    from: "",
    to: "",
    description: "",
  });

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const token = localStorage.getItem("token"); // use JWT token
        if (!token) {
          alert("Please login first");
          navigate("/login");
          return;
        }

        const res = await axios.get("http://localhost:5000/api/employee/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEmployee(res.data);
      } catch (err) {
        console.error("Error fetching employee data:", err);
        alert("Failed to fetch employee data");
      }
    };

    fetchEmployee();
  }, [navigate]);

  const handleChange = (e) => {
    setLeaveData({ ...leaveData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        employeeId: employee.employee_id,
        name: `${employee.first_name} ${employee.last_name}`,
        position: employee.job_title,
        ...leaveData,
      };

      const token = localStorage.getItem("token");
      const res = await axios.post("http://localhost:5000/api/leaves", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert(`✅ Leave request submitted successfully: ${res.data.customId}`);
      navigate(-1); 
    } catch (err) {
      console.error("Error submitting leave:", err);
      alert("❌ Error submitting leave. Try again.");
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
      <EmployeeSidebar />
      <div style={{ flex: 1 }}>

        <div style={{ padding: "20px", maxWidth: "700px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "20px" }}>
            📝 Apply for Leave
          </h2>

          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              backgroundColor: "#ffffff",
              padding: "25px",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <input
              type="text"
              value={`${employee.first_name || ""} ${employee.last_name || ""}`}
              disabled
              style={inputStyle}
            />
            <input type="text" value={employee.employee_id || ""} disabled style={inputStyle} />
            <input type="text" value={employee.job_title || ""} disabled style={inputStyle} />

            <select name="type" value={leaveData.type} onChange={handleChange} required style={inputStyle}>
              <option value="">Select Leave Type</option>
              <option value="Casual">Casual</option>
              <option value="Sick">Sick</option>
              <option value="Maternity">Maternity</option>
              <option value="Other">Other</option>
            </select>

            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="date"
                name="from"
                value={leaveData.from}
                onChange={handleChange}
                required
                min={new Date().toISOString().split("T")[0]} 
                style={{ ...inputStyle, flex: 1 }}
              />
              <input
                type="date"
                name="to"
                value={leaveData.to}
                onChange={handleChange}
                required
                min={leaveData.from || new Date().toISOString().split("T")[0]} 
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>


            <textarea
              name="description"
              value={leaveData.description}
              onChange={handleChange}
              placeholder="Reason / Description"
              rows={4}
              required
              style={inputStyle}
            />

            <button type="submit" style={btnStyle}>
              Submit Leave Request
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "10px 15px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  fontSize: "15px",
};
const btnStyle = {
  padding: "12px 20px",
  backgroundColor: "#3b82f6",
  color: "white",
  fontWeight: "bold",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  marginTop: "10px",
  transition: "0.3s",
};

export default LeaveForm;
