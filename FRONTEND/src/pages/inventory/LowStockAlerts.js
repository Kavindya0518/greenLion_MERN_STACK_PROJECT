import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../api/http";
import InventorySidebar from "../../components/InventorySidebar";
import { FaBox, FaBoxes, FaExclamationTriangle, FaSearch, FaArrowRight, FaArrowUp, FaArrowDown, FaSync, FaBoxOpen } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { InventoryHeader } from '../../styles/inventoryStyles';

export default function LowStockAlerts() {
  const [tab, setTab] = useState("raw"); // 'raw' | 'finished'
  const [loading, setLoading] = useState(true);
  const [raw, setRaw] = useState([]);
  const [prod, setProd] = useState([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      // Fetch all and filter client-side using a fixed threshold: quantity < 10
      const r1 = await http.get("/api/rawmaterials");
      const allRaw = r1?.data?.items || r1?.data?.data || r1?.data || [];
      setRaw(allRaw.filter((it) => (Number(it.quantity ?? 0) || 0) < 10));

      const r2 = await http.get("/api/finishedproducts");
      const allProd = r2?.data?.items || r2?.data?.data || r2?.data || [];
      setProd(allProd.filter((it) => (Number(it.quantity ?? 0) || 0) < 10));
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const list = tab === "raw" ? raw : prod;
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return list;
    return list.filter((it) =>
      String(it.itemCode || "").toLowerCase().includes(t) ||
      String(it.name || "").toLowerCase().includes(t)
    );
  }, [q, list, tab]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9' }}>
        <InventorySidebar />
        <div style={{ flex: 1, padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ 
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <h2 style={{ margin: 0, color: '#1e293b', fontWeight: '600', fontSize: '24px' }}>Low Stock Alerts</h2>
          </div>
          <div style={{ 
            background: 'white', 
            borderRadius: '16px', 
            padding: '60px 24px', 
            boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
            textAlign: 'center',
            color: '#64748b',
            fontSize: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              border: '4px solid #e2e8f0',
              borderTopColor: '#2563eb',
              animation: 'spin 1s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }}></div>
            <div>Loading low stock alerts...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f7fa' }}>
      <InventorySidebar />
      <div style={{ flex: 1, padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <InventoryHeader 
          title="Low Stock Alerts"
          subtitle="Items at or below reorder level"
          actions={[
            {
              label: 'Refresh',
              icon: '🔄',
              onClick: load,
              primary: true
            },
           
          ]}
        />

        <motion.div 
          initial="hidden"
          animate="show"
          variants={containerVariants}
          style={{ 
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
            marginBottom: '24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setTab('raw')} 
                style={{ 
                  background: tab === 'raw' ? '#1e40af' : 'white', 
                  color: tab === 'raw' ? 'white' : '#1e293b',
                  border: tab === 'raw' ? '1px solid #1e40af' : '1px solid #e2e8f0',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  ':hover': {
                    background: tab === 'raw' ? '#1e3a8a' : '#f8fafc',
                    borderColor: tab === 'raw' ? '#1e3a8a' : '#cbd5e1'
                  }
                }}
              >
                <FaBox size={14} />
                Raw Materials ({raw.length})
              </button>
              <button 
                onClick={() => setTab('finished')} 
                style={{ 
                  background: tab === 'finished' ? '#1e40af' : 'white', 
                  color: tab === 'finished' ? 'white' : '#1e293b',
                  border: tab === 'finished' ? '1px solid #1e40af' : '1px solid #e2e8f0',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  ':hover': {
                    background: tab === 'finished' ? '#1e3a8a' : '#f8fafc',
                    borderColor: tab === 'finished' ? '#1e3a8a' : '#cbd5e1'
                  }
                }}
              >
                <FaBoxes size={14} />
                Finished Products ({prod.length})
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                value={q} 
                onChange={(e) => setQ(e.target.value)} 
                placeholder="Search by code or name..." 
                style={{ 
                  padding: '10px 16px 10px 40px', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px', 
                  minWidth: '280px',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                  ':focus': {
                    outline: 'none',
                    borderColor: '#93c5fd',
                    boxShadow: '0 0 0 3px rgba(147, 197, 253, 0.3)'
                  }
                }} 
              />
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ 
                padding: '12px 16px', 
                background: '#fef2f2', 
                color: '#991b1b', 
                border: '1px solid #fecaca', 
                borderRadius: '8px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FaExclamationTriangle />
              {error}
            </motion.div>
          )}

          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ 
                  background: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  color: '#64748b',
                  fontSize: '13px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  textAlign: 'left'
                }}>
                  <th style={{ padding: '12px 16px', minWidth: '120px' }}>Item Code</th>
                  <th style={{ padding: '12px 16px', minWidth: '180px' }}>Name</th>
                  <th style={{ padding: '12px 16px', minWidth: '200px' }}>Description</th>
                  <th style={{ padding: '12px 16px', minWidth: '100px' }}>Unit</th>
                  <th style={{ padding: '12px 16px', minWidth: '120px' }}>Stock Level</th>
                  <th style={{ padding: '12px 16px', minWidth: '160px' }}>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ 
                      padding: '40px 20px', 
                      color: '#64748b', 
                      textAlign: 'center',
                      background: 'white'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        gap: '12px',
                        padding: '24px',
                        borderRadius: '8px',
                        border: '1px dashed #e2e8f0'
                      }}>
                        <FaBoxOpen size={32} color="#cbd5e1" />
                        <div style={{ fontSize: '16px', fontWeight: '500' }}>No low stock items found</div>
                        <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                          {q ? 'Try a different search term' : 'All items are sufficiently stocked'}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((it, index) => {
                    const code = it.itemCode ? String(it.itemCode).toUpperCase() : (it._id ? `ID…${String(it._id).slice(-6)}` : "-");
                    const qty = Number(it.quantity ?? 0) || 0;
                    const isCritical = qty === 0 || qty < 5; // critical: below 5
                    const isWarning = !isCritical && qty < 10; // warning: below 10
                    
                    // Calculate percentage for the stock level indicator
                    const maxStock = 20; // This is just for visualization
                    const stockPercentage = Math.min(100, Math.round((qty / maxStock) * 100));
                    
                    return (
                      <motion.tr 
                        key={it._id || it.itemCode || index}
                        variants={itemVariants}
                        style={{ 
                          background: 'white',
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'all 0.2s',
                          ':hover': {
                            background: '#f8fafc'
                          }
                        }}
                      >
                        <td style={{ 
                          padding: '16px',
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                          fontWeight: '500',
                          color: '#334155',
                          borderLeft: `4px solid ${isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981'}`
                        }}>
                          {code}
                        </td>
                        <td style={{ 
                          padding: '16px',
                          fontWeight: '500',
                          color: '#1e293b'
                        }}>
                          {it.name || '-'}
                        </td>
                        <td style={{ 
                          padding: '16px',
                          color: '#64748b',
                          maxWidth: '300px'
                        }}>
                          <div style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '300px'
                          }}>
                            {it.description || '-'}
                          </div>
                        </td>
                        <td style={{ 
                          padding: '16px',
                          color: '#64748b',
                          textTransform: 'uppercase',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}>
                          {it.unit || '-'}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            gap: '4px'
                          }}>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              gap: '8px',
                              fontWeight: '600',
                              color: isCritical ? '#dc2626' : isWarning ? '#d97706' : '#059669'
                            }}>
                              {qty.toLocaleString()}
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                fontSize: '12px',
                                background: isCritical ? '#fee2e2' : isWarning ? '#fef3c7' : '#d1fae5',
                                color: isCritical ? '#991b1b' : isWarning ? '#92400e' : '#065f46',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: '500'
                              }}>
                                {isCritical ? 'Critical' : isWarning ? 'Low' : 'Warning'}
                              </div>
                            </div>
                            <div style={{
                              height: '4px',
                              background: '#e2e8f0',
                              borderRadius: '2px',
                              overflow: 'hidden',
                              width: '100%'
                            }}>
                              <div style={{
                                height: '100%',
                                width: `${stockPercentage}%`,
                                background: isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981',
                                transition: 'width 0.3s ease'
                              }} />
                            </div>
                          </div>
                        </td>
                        <td style={{ 
                          padding: '16px',
                          color: '#64748b',
                          fontSize: '14px'
                        }}>
                          {new Date(it.updatedAt || it.lastUpdated || it.createdAt).toLocaleString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
