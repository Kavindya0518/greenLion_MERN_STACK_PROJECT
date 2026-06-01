import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import EmployeeSidebar from "../components/EmployeeSidebar";

function EmployeeSalary() {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSalaries = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("Please login first");
          navigate("/login");
          return;
        }

        const res = await axios.get("http://localhost:5000/api/salaries/my", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setSalaries(res.data);
      } catch (err) {
        console.error("Error fetching salaries:", err);
        setError("Failed to fetch salary records. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchSalaries();
  }, [navigate]);

  // Download PDF slip using Axios
  const handleDownload = async (salaryId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login first");
        return;
      }

      const res = await axios.get(
        `http://localhost:5000/api/salaries/download/${salaryId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob", // important for PDF
        }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `SalarySlip_${salaryId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error downloading slip:", err);
      alert("Failed to download salary slip.");
    }
  };

  if (loading) return <p style={{ margin: "20px" }}>Loading salaries...</p>;

  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"]; 
  const years = Array.from(new Set(salaries.map(s => s.year))).sort();

  const filtered = salaries.filter(s => {
    const mOk = month ? s.month === month : true;
    const yOk = year ? String(s.year) === String(year) : true;
    return mOk && yOk;
  });

  const totalForYear = filtered.reduce((sum, s) => sum + (Number(s.net) || 0), 0);
  const fmt = (v) => (Number(v) || 0).toLocaleString('en-IN');

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      <EmployeeSidebar />
      <div style={{ flex: 1 ,marginTop:"0px"}}>

        <div style={{ padding: "16px 20px" }}>
          {/* Header */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <h2 style={{ margin: 0, color: '#1e293b', fontWeight: 700, fontSize: 22 }}>My Salary Records</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 13, color: '#64748b', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 9999 }}>
                {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* KPI Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 12 }}>
            {(() => {
              const paid = salaries.filter(s => (s.status || '').toLowerCase() === 'paid').length;
              const unpaid = salaries.filter(s => (s.status || '').toLowerCase() !== 'paid').length;
              const now = new Date();
              const ytd = salaries.reduce((sum, s) => (String(s.year) === String(now.getFullYear()) ? sum + (Number(s.net)||0) : sum), 0);
              const cards = [
                { title: 'Paid Slips', value: paid, color:'#10B981', bg:'#10B9811A', icon:'paid' },
                { title: 'Unpaid Slips', value: unpaid, color:'#F59E0B', bg:'#F59E0B1A', icon:'unpaid' },
                { title: 'YTD Net (Rs.)', value: ytd, color:'#3B82F6', bg:'#3B82F61A', icon:'ytd' },
              ];
              return cards.map((c,i)=> (
                <div key={i} style={{ background:'white', border:'1px solid #e5e7eb', borderTop:`4px solid ${c.color}`, borderRadius:12, padding:16, boxShadow:'0 1px 2px rgba(0,0,0,0.04)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ color:'#6b7280', fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:0.5 }}>{c.title}</div>
                      <div style={{ fontSize:24, fontWeight:800, color:'#111827', marginTop:6 }}>{c.icon === 'ytd' ? fmt(c.value) : c.value}</div>
                    </div>
                    <div style={{ width:48, height:48, borderRadius:10, background:c.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {c.icon === 'paid' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      )}
                      {c.icon === 'unpaid' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                      )}
                      {c.icon === 'ytd' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><polyline points="7 14 11 10 14 13 19 8"/></svg>
                      )}
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "10px 0 16px" }}>
            <select value={month} onChange={(e) => setMonth(e.target.value)} style={{ padding: 8, borderRadius: 8, border: "1px solid #e5e7eb" }}>
              <option value="">All Months</option>
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={year} onChange={(e) => setYear(e.target.value)} style={{ padding: 8, borderRadius: 8, border: "1px solid #e5e7eb" }}>
              <option value="">All Years</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <div style={{ marginLeft: "auto", fontWeight: 600, color: "#065f46" }}>
              Total Net{year ? ` (${year})` : ""}: Rs. {fmt(totalForYear)}
            </div>
          </div>

          {error && (
            <div
              style={{
                marginBottom: "20px",
                padding: "10px",
                backgroundColor: "#fee2e2",
                color: "#b91c1c",
                borderRadius: "8px",
                fontWeight: "bold",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ overflowX: "auto", background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', marginTop: 12 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#dcfce7" }}>
                <tr>
                  <th style={thStyle}>Month</th>
                  <th style={thStyle}>Year</th>
                  <th style={thStyle}>Basic Salary</th>
                  <th style={thStyle}>Overtime</th>
                  <th style={thStyle}>Deductions</th>
                  <th style={thStyle}>Net Salary</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && !error ? (
                  <tr>
                    <td colSpan="8" style={{ padding: "18px", textAlign: "center", color: '#64748b' }}>
                      <div style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/></svg>
                        <span>No salary records found.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((salary, index) => (
                    <tr key={index} style={index % 2 ? { background: "#f9fafb" } : {}}>
                      <td style={tdStyle}>{salary.month}</td>
                      <td style={tdStyle}>{salary.year}</td>
                      <td style={tdStyle}>Rs. {fmt(salary.basic)}</td>
                      <td style={tdStyle}>Rs. {fmt(salary.allowance)}</td>
                      <td style={tdStyle}>Rs. {fmt(salary.deduction)}</td>
                      <td style={{ ...tdStyle, fontWeight: "bold", color: "#10b981" }}>
                        Rs. {fmt(salary.net)}
                      </td>
                      <td style={{ ...tdStyle }}>
                        <span style={{
                          padding: "4px 10px",
                          borderRadius: 12,
                          fontWeight: 600,
                          background: salary.status === "Paid" ? "#dcfce7" : "#fef9c3",
                          color: salary.status === "Paid" ? "#065f46" : "#92400e",
                          border: "1px solid #e5e7eb"
                        }}>{salary.status}</span>
                      </td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => handleDownload(salary.salaryId)}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: "#3b82f6",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                          }}
                        >
                          Download Slip
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

const thStyle = {
  padding: "12px",
  textAlign: "left",
  borderBottom: "1px solid #d1d5db",
};
const tdStyle = { padding: "12px", borderBottom: "1px solid #e5e7eb" };

export default EmployeeSalary;
