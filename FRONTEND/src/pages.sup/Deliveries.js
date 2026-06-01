import React, { useEffect, useState } from "react";
import http from "../api/http";
import SupplierSidebar from "./SupplierSidebar";

export default function Deliveries() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [q, setQ] = useState(""); // filter by delivery or supplier
  const [status, setStatus] = useState(""); // show all statuses by default
  const [confirmingId, setConfirmingId] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      // Load all deliveries
      const res = await http.get("/api/deliveries");
      const arr = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : []);
      setItems(arr);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load deliveries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredDeliveries = items.filter(d => {
    const s = (q || "").toLowerCase();
    const okQ = !q || (String(d.poNumber||d.poId||"").toLowerCase().includes(s)) || (String(d.supplierName||d.supplierId||"").toLowerCase().includes(s));
    const okS = !status || (d.status === status);
    return okQ && okS;
  });

  if (loading) return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f8fafb' }}>
      <SupplierSidebar />
      <div style={{ flex:1, padding:24 }}>Loading…</div>
    </div>
  );
  if (error) return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f8fafb' }}>
      <SupplierSidebar />
      <div style={{ flex:1, padding:24, color:'#b91c1c' }}>{error}</div>
    </div>
  );

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f8fafb' }}>
      <SupplierSidebar />
      <div style={{ flex:1, padding:24, maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Supplier Deliveries</h1>
      <p style={{ margin: '8px 0 0 0', fontSize: 16, color: '#64748b' }}>
        Track and manage all supplier deliveries
      </p>

      <div style={{ marginTop: 20, display:'flex', gap: 12, flexWrap:'wrap', alignItems: 'center' }}>
        <input 
          value={q} 
          onChange={(e)=>setQ(e.target.value)} 
          placeholder="Search delivery ID, PO number, or supplier name" 
          style={{ 
            padding: '12px 16px', 
            borderRadius: 8, 
            border: '1px solid #e5e7eb',
            fontSize: '14px',
            minWidth: '300px',
            flex: 1
          }} 
        />
        <select 
          value={status} 
          onChange={(e)=>setStatus(e.target.value)}
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            fontSize: '14px',
            background: 'white'
          }}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="received">Received</option>
          <option value="partial">Partial</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* All Deliveries */}
      <div style={{ marginTop: 20, background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '20px 24px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb', borderRadius: '12px 12px 0 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
                🚚 All Deliveries ({filteredDeliveries.length})
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: 14, color: '#64748b' }}>
                Track and manage all supplier deliveries
              </p>
            </div>
            <div style={{ 
              padding: '8px 16px', 
              background: '#f1f5f9', 
              borderRadius: '20px', 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#475569' 
            }}>
              Total: {filteredDeliveries.length} deliveries
            </div>
          </div>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#f9fafb', color:'#6b7280', textAlign:'left' }}>
              <th style={{ padding:16, fontSize: '14px', fontWeight: '600' }}>Delivery ID</th>
              <th style={{ padding:16, fontSize: '14px', fontWeight: '600' }}>PO Number</th>
              <th style={{ padding:16, fontSize: '14px', fontWeight: '600' }}>Supplier</th>
              <th style={{ padding:16, fontSize: '14px', fontWeight: '600' }}>Items</th>
              <th style={{ padding:16, fontSize: '14px', fontWeight: '600' }}>Status</th>
              <th style={{ padding:16, fontSize: '14px', fontWeight: '600' }}>Delivered At</th>
              <th style={{ padding:16, fontSize: '14px', fontWeight: '600', textAlign:'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeliveries.length === 0 ? (
              <tr><td colSpan={7} style={{ padding:40, textAlign: 'center', color: '#64748b', fontSize: '16px' }}>
                <div style={{ marginBottom: '12px', fontSize: '48px' }}>📦</div>
                <div>No deliveries found</div>
                <div style={{ fontSize: '14px', marginTop: '4px', opacity: 0.7 }}>
                  {q ? 'Try adjusting your search criteria' : 'No deliveries have been created yet'}
                </div>
              </td></tr>
            ) : filteredDeliveries.map(d => (
              <tr key={d._id} style={{ borderTop:'1px solid #f1f5f9', transition: 'background 0.2s' }}>
                <td style={{ padding:16, fontFamily: 'ui-monospace, monospace', fontWeight: '600', color: '#1e293b' }}>
                  {String(d._id).slice(-8).toUpperCase()}
                </td>
                <td style={{ padding:16, fontFamily: 'ui-monospace, monospace', color: '#475569' }}>
                  {d.poNumber || d.poId || '-'}
                </td>
                <td style={{ padding:16, fontWeight: '500', color: '#1e293b' }}>
                  {d.supplierName || d.supplierId || '-'}
                </td>
                <td style={{ padding:16, color: '#64748b' }}>
                  {(d.items||[]).length} items
                </td>
                <td style={{ padding:16 }}>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: d.status === 'pending' ? '#fef3c7' : 
                               d.status === 'received' ? '#d1fae5' : 
                               d.status === 'partial' ? '#fef3c7' : 
                               d.status === 'rejected' ? '#fee2e2' : '#f3f4f6',
                    color: d.status === 'pending' ? '#92400e' : 
                           d.status === 'received' ? '#065f46' : 
                           d.status === 'partial' ? '#92400e' : 
                           d.status === 'rejected' ? '#991b1b' : '#6b7280'
                  }}>
                    {d.status?.toUpperCase() || 'PENDING'}
                  </span>
                </td>
                <td style={{ padding:16, color: '#64748b', fontSize: '14px' }}>
                  {d.deliveredAt ? new Date(d.deliveredAt).toLocaleString() : '-'}
                </td>
                <td style={{ padding:16, textAlign:'right' }}>
                  <button
                    onClick={async()=>{
                      if (d.status !== 'pending') return;
                      try{
                        setConfirmingId(String(d._id));
                        await http.post(`/api/deliveries/${d._id}/receive`);
                        await load();
                      }catch(e){
                        alert(e?.response?.data?.message || e?.message || 'Failed to confirm');
                      } finally {
                        setConfirmingId("");
                      }
                    }}
                    disabled={d.status !== 'pending' || String(confirmingId)===String(d._id)}
                    style={{ 
                      background: d.status === 'pending' ? '#1E7F3B' : (d.status === 'received' ? '#10b981' : '#94a3b8'), 
                      color:'#fff', 
                      padding:'8px 16px', 
                      borderRadius:8, 
                      border:0, 
                      fontWeight:600, 
                      fontSize: '14px',
                      opacity: (String(confirmingId)===String(d._id)) ? 0.6 : 1, 
                      cursor: (d.status !== 'pending') ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {d.status === 'pending' ? (String(confirmingId)===String(d._id) ? 'Confirming…' : 'Confirm Delivery') : 
                     d.status === 'received' ? '✓ Received' : '✓ Confirmed'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}