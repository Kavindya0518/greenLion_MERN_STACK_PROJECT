function EmployeeNavbar() {

  return (
    <div
      style={{
        width: "97%",
        height: "70px",
        padding: "0 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#f5f3e8ff",
        top: 0,
        zIndex: 1000,
        marginLeft: "2px",
      }}
    >
      <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#040505ff", margin: 0 }}>
        Welcome Employee!
      </h2>

    </div>
  );
}

export default EmployeeNavbar;
