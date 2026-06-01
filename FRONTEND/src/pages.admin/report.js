import { useEffect, useState } from "react";
import axios from "axios";
import EmployeeAdminSidebar from "../components/EmployeeAdminSidebar";
import PageHeader from "../components/common/PageHeader";
import SectionCard from "../components/common/SectionCard";

function Reports() {
  const [report, setReport] = useState([]);
  const [totals, setTotals] = useState({ totalEPF: 0, totalETF: 0, totalBoth: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5000/api/salaries/epf-report");
        const data = res.data.report || [];

        const totalBoth = data.reduce((sum, r) => sum + (r.epf + r.etf), 0);

        setReport(data);
        setTotals({
          totalEPF: res.data.totals?.totalEPF || 0,
          totalETF: res.data.totals?.totalETF || 0,
          totalBoth,
        });
      } catch (err) {
        console.error("Error fetching report:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <EmployeeAdminSidebar />
      <div style={{ flex: 1, padding: 24, maxWidth: 1400, margin: "0 auto" }}>
        <PageHeader title="ETF/EPF Reports" subtitle="Contribution breakdown by employee" />

        <SectionCard title="Report">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "white" }}>
              <thead>
                <tr style={{ background: "#f9fafb", textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: 10 }}>Employee ID</th>
                  <th style={{ padding: 10 }}>Name</th>
                  <th style={{ padding: 10 }}>Basic Salary</th>
                  <th style={{ padding: 10 }}>EPF (8%)</th>
                  <th style={{ padding: 10 }}>ETF (12%)</th>
                  <th style={{ padding: 10 }}>Total (EPF + ETF)</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ textAlign: "center", padding: 12, color: "#64748b" }}>Loading...</td></tr>
                ) : report.length > 0 ? (
                  report.map((r, i) => (
                    <tr key={i} style={i % 2 ? { background: "#f9fafb" } : {}}>
                      <td style={{ padding: 10 }}>{r.empId}</td>
                      <td style={{ padding: 10 }}>{r.name}</td>
                      <td style={{ padding: 10 }}>Rs. {r.basic}</td>
                      <td style={{ padding: 10 }}>Rs. {r.epf}</td>
                      <td style={{ padding: 10 }}>Rs. {r.etf}</td>
                      <td style={{ padding: 10, fontWeight: 600 }}>Rs. {r.epf + r.etf}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6" style={{ textAlign: "center", padding: 12, color: "#64748b" }}>No report available</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 16, textAlign: "right" }}>
            <h4 style={{ color: "#2563eb", margin: 0 }}>
              Total EPF: Rs. {totals.totalEPF} | Total ETF: Rs. {totals.totalETF} | {" "}
              <span style={{ fontWeight: 700 }}>Grand Total: Rs. {totals.totalBoth}</span>
            </h4>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

export default Reports;