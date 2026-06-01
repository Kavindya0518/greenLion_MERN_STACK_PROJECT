import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const location = useLocation();

  const menuItems = [
    { path: "/admin/employees", label: "Dashboard", icon: "🏠" },
    { path: "/employee", label: "Employees", icon: "👨‍💼" },
    { path: "/attendance", label: "Attendance", icon: "📅" },
    { path: "/leave", label: "Leave Requests", icon: "📄" },
    { path: "/allSalaries", label: "Salary", icon: "💰" },
  ];

  return (
    <div
      style={{
        width: "98%",
        height: "70px",
        padding: "0 20px",
        fontFamily: "Arial, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#e4f7e8ff",
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        top: 0,
        zIndex: 1000,
        borderBottom: "1px solid #ccc",
        marginLeft:"2px",
        marginTop:"25px"
      }}
    >
      <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#0a0a0cff", margin: 0 }}>
        Hello Admin!
      </h2>

      <ul style={{ listStyle: "none", display: "flex", gap: "20px", margin: 0, padding: 0 }}>
        {menuItems.map((item, index) => {
          const active = location.pathname.startsWith(item.path);
          return (
            <li key={index}>
              <Link
                to={item.path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontSize: "16px",
                  fontWeight: 500,
                  color: active ? "#08681bff" : "#080707ff",
                  background: active ? "#dbeafe" : "transparent",
                  transition: "all 0.3s ease",
                }}
              >
                <span style={{ fontSize: "18px" }}>{item.icon}</span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default Navbar;
