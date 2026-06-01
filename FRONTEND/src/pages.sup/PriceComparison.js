import React, { useEffect, useMemo, useState } from "react";
import http from "../api/http";
import SupplierSidebar from "./SupplierSidebar";

export default function PriceComparison() {
  const [q, setQ] = useState(""); // materialCode search
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [offers, setOffers] = useState([]);

  const fetchOffers = async (code) => {
    if (!code) { setOffers([]); return; }
    try {
      setLoading(true);
      setError("");
      const res = await http.get(`/api/price-comparison?materialCode=${encodeURIComponent(code)}`);
      const arr = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : []);
      setOffers(arr);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load offers");
    } finally {
      setLoading(false);
    }
  };

  const best = useMemo(() => {
    if (!offers.length) return null;
    return [...offers].sort((a,b)=> (a.price||Infinity) - (b.price||Infinity))[0];
  }, [offers]);

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f8fafb' }}>
      <SupplierSidebar />
      <div style={{ flex:1, padding:24, maxWidth: 1000, margin: '0 auto' }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Price Comparison</h1>
        <div style={{ marginTop: 12, display:'flex', gap: 8 }}>
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Enter material code (e.g., CNH001)" style={{ padding:10, borderRadius:8, border:'1px solid #e5e7eb', flex:1 }} />
          <button onClick={()=>fetchOffers(q)} style={{ background:'#1E7F3B', color:'#fff', border:'none', borderRadius:8, padding:'10px 14px', fontWeight:600, cursor:'pointer' }}>Search</button>
        </div>

        {loading && <div style={{ marginTop: 12, border:'1px solid #e5e7eb', borderRadius:12, padding:12, background:'#fff' }}>Loading…</div>}
        {error && <div style={{ marginTop: 12, color:'#b91c1c' }}>{error}</div>}

        {!loading && !error && (
          <div style={{ marginTop: 12, background:'#fff', border:'1px solid #e5e7eb', borderRadius:12 }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#f9fafb', color:'#6b7280', textAlign:'left' }}>
                  <th style={{ padding:12 }}>Supplier</th>
                  <th style={{ padding:12 }}>Material</th>
                  <th style={{ padding:12 }}>Price</th>
                  <th style={{ padding:12 }}>Lead Time</th>
                  <th style={{ padding:12 }}>Availability</th>
                </tr>
              </thead>
              <tbody>
                {offers.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding:16 }}>No offers</td></tr>
                ) : offers.map((o, i) => (
                  <tr key={i} style={{ borderTop:'1px solid #f1f5f9', background: best && best.supplierId === o.supplierId && best.price === o.price ? '#f0fdf4' : 'transparent' }}>
                    <td style={{ padding:12 }}>{o.supplierName || o.supplierId}</td>
                    <td style={{ padding:12 }}>{o.materialCode}</td>
                    <td style={{ padding:12, fontWeight:700 }}>{o.price}</td>
                    <td style={{ padding:12 }}>{o.leadTimeDays} days</td>
                    <td style={{ padding:12 }}>{o.available ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
