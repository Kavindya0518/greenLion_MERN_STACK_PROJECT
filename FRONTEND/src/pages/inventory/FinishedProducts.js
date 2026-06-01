import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../api/http";
import InventorySidebar from "../../components/InventorySidebar";
import { FaPlus, FaSearch, FaBoxOpen, FaArrowUp, FaArrowDown, FaFileExport, FaFilter, FaTachometerAlt } from 'react-icons/fa';
import { InventoryHeader } from '../../styles/inventoryStyles';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function FinishedProducts() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [toast, setToast] = useState({ show:false, type:'success', message:'' });
  
  // Stock adjustment modal states
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockOperation, setStockOperation] = useState(''); // 'in' or 'out'
  const [stockQuantity, setStockQuantity] = useState('');
  const [stockReason, setStockReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [stockError, setStockError] = useState('');
  const [stockLoading, setStockLoading] = useState(false);

  // Predefined reasons for stock operations
  const stockInReasons = [
    'Production completed',
    'Purchase received',
    'Return from customer',
    'Transfer from warehouse',
    'Quality inspection passed',
    'Manual adjustment',
    'Initial stock setup',
    'Bulk import'
  ];

  const stockOutReasons = [
    'Customer order',
    'Quality issue',
    'Expired/damaged',
    'Transfer to warehouse',
    'Production usage',
    'Return to supplier',
    'Manual adjustment',
    'Theft/loss'
  ];

  const load = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      const res = await http.get(`/api/finishedproducts${params.toString() ? `?${params.toString()}` : ''}`);
      const arr = res?.data?.items || res?.data?.data || res?.data || [];
      setItems(arr);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };
  useEffect(()=>{ load(); },[category]);

  // Load categories from products list (derive unique categories)
  useEffect(()=>{
    (async ()=>{
      try {
        const r = await http.get('/products');
        const arr = r?.data?.products || r?.data || [];
        const uniq = Array.from(new Set(arr.map(p=>String(p.category||'').trim()).filter(Boolean)));
        setCategories(uniq);
      } catch(_){}
    })();
  },[]);

  const filtered = useMemo(()=>{
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter(it =>
      String(it.itemCode||'').toLowerCase().includes(term) ||
      String(it.name||'').toLowerCase().includes(term)
    );
  }, [q, items]);

  // Stock adjustment functions
  const openStockModal = (product, operation) => {
    setSelectedProduct(product);
    setStockOperation(operation);
    setStockQuantity('');
    setStockReason('');
    setCustomReason('');
    setStockError('');
    setStockModalOpen(true);
  };

  const closeStockModal = () => {
    setStockModalOpen(false);
    setSelectedProduct(null);
    setStockOperation('');
    setStockQuantity('');
    setStockReason('');
    setCustomReason('');
    setStockError('');
  };

  const submitStockAdjustment = async () => {
    try {
      setStockError('');
      setStockLoading(true);
      
      const quantity = Number(stockQuantity);
      if (!quantity || quantity <= 0) {
        setStockError('Please enter a valid quantity greater than 0');
        return;
      }

      // Determine the final reason to use
      const finalReason = stockReason === 'custom' ? customReason : stockReason;
      if (!finalReason) {
        setStockError('Please select or enter a reason for this stock adjustment');
        return;
      }

      const hasCode = !!(selectedProduct.itemCode && String(selectedProduct.itemCode).trim());
      
      if (hasCode) {
        await http.put(`/api/finishedproducts/${encodeURIComponent(selectedProduct.itemCode)}/stock`, { 
          operation: stockOperation, 
          quantity: quantity, 
          reason: finalReason
        });
      } else if (selectedProduct._id) {
        if (stockOperation === 'in') {
          await http.post(`/api/finishedproducts/${encodeURIComponent(selectedProduct._id)}/increase-stock`, { quantity, reason: finalReason });
        } else {
          await http.post(`/api/finishedproducts/${encodeURIComponent(selectedProduct._id)}/decrease-stock`, { quantity, reason: finalReason });
        }
      } else {
        throw new Error('Missing product identifier');
      }
      
      setToast({ show: true, type: 'success', message: `Stock ${stockOperation === 'in' ? 'added' : 'reduced'} successfully!` });
      closeStockModal();
      load();
    } catch (e) {
      setStockError(e?.response?.data?.message || e?.message || 'Stock adjustment failed');
    } finally {
      setStockLoading(false);
    }
  };

  const exportPDF = async () => {
    try {
      const doc = new jsPDF();
      // Try to load logo from public/logo.png
      try {
        const resp = await fetch("/logo.png");
        if (resp.ok) {
          const blob = await resp.blob();
          const reader = new FileReader();
          const dataUrl = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          // Place logo at top-right
          // Parameters: image, format auto, x, y, width, height keep aspect
          doc.addImage(dataUrl, 'PNG', 180, 8, 16, 16);
        }
      } catch (_) { /* ignore logo load errors */ }

      // Header 1: Company name (green)
      doc.setTextColor(30, 127, 59); // #1E7F3B
      doc.setFontSize(16);
      doc.text("Green Lion Company", 14, 16);
      // Header 2: Section title (green)
      doc.setFontSize(12);
      doc.text("Inventory Management – Finished Products", 14, 24);
      // Printed date (right under headers)
      doc.setTextColor(55, 65, 81); // gray-700
      doc.setFontSize(10);
      doc.text(`Printed on: ${new Date().toLocaleString()}`, 14, 28);

      // Reset text color to default for table/body
      doc.setTextColor(0, 0, 0);
      autoTable(doc, {
        startY: 34,
        head: [["Item Code", "Name", "Description", "Category", "Unit", "Unit Price", "Stock", "Updated"]],
        headStyles: { fillColor: [30, 127, 59], textColor: [0, 0, 0] }, // green background, black text
        body: filtered.map((it) => {
          const code = it.itemCode ? String(it.itemCode).toUpperCase() : (it._id ? `ID…${String(it._id).slice(-6)}` : "-");
          const name = it.name || "-";
          const rawDesc = String(it.description || "-");
          const desc = rawDesc.length > 60 ? rawDesc.slice(0, 60) + "…" : rawDesc;
          const cat = it.category || "-";
          const unit = it.unit || "-";
          const price = typeof it.sellingPrice === "number" ? `LKR ${it.sellingPrice.toFixed(2)}` : "-";
          const stock = `${it.quantity ?? 0} ${it.unit || ""}`.trim();
          const updated = new Date(it.updatedAt || it.createdAt).toLocaleString();
          return [code, name, desc, cat, unit, price, stock, updated];
        }),
      });
      doc.save("Green_Lion_Inventory_Management_Finished_Products.pdf");
    } catch (e) {
      alert(e?.message || "Failed to export PDF");
    }
  };


  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f7fa' }}>
      <InventorySidebar />
      <div style={{ flex: 1, padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <InventoryHeader 
          title="Finished Products"
          subtitle="Add, edit, and manage finished products"
          actions={[
            
            {
              label: 'Export PDF',
              icon: '📄',
              onClick: exportPDF,
              primary: false,
            },
           
          ]}
        />

        <div style={{ 
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
          marginBottom: '24px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ 
              fontSize: '14px', 
              color: '#64748b',
              background: '#f8fafc',
              padding: '6px 12px',
              borderRadius: '20px',
              fontWeight: '500'
            }}>
              Total: {filtered.length} items
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <FaSearch style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  fontSize: '14px'
                }} />
                <input 
                  value={q} 
                  onChange={e => setQ(e.target.value)} 
                  placeholder="Search by code or name" 
                  style={{ 
                    padding: '10px 12px 10px 36px', 
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
              <div style={{ position: 'relative' }}>
                <FaFilter style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  fontSize: '14px',
                  pointerEvents: 'none'
                }} />
                <select 
                  value={category} 
                  onChange={e => setCategory(e.target.value)} 
                  style={{ 
                    padding: '10px 12px 10px 36px', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px',
                    minWidth: '200px',
                    fontSize: '14px',
                    appearance: 'none',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    ':focus': {
                      outline: 'none',
                      borderColor: '#93c5fd',
                      boxShadow: '0 0 0 3px rgba(147, 197, 253, 0.3)'
                    }
                  }}
                >
                  <option value="">All Categories</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', minWidth: '1200px', borderCollapse: 'collapse' }}>
              <colgroup>
                <col style={{ width: '140px' }} />
                <col style={{ width: '200px' }} />
                <col style={{ width: '280px' }} />
                <col style={{ width: '200px' }} />
                <col style={{ width: '100px' }} />
                <col style={{ width: '140px' }} />
                <col style={{ width: '140px' }} />
                <col style={{ width: '180px' }} />
                <col style={{ width: 'auto', minWidth: '320px' }} />
              </colgroup>
              <thead>
                <tr style={{ 
                  background: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  textAlign: 'left'
                }}>
                  <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>Item Code</th>
                  <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>Name</th>
                  <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>Description</th>
                  <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>Category</th>
                  <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>Unit</th>
                  <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600', fontSize: '13px', textAlign: 'right' }}>Unit Price (LKR)</th>
                  <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600', fontSize: '13px', textAlign: 'right' }}>Stock</th>
                  <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>Updated</th>
                  <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600', fontSize: '13px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                      Loading finished products...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ 
                      padding: '32px 16px', 
                      textAlign: 'center', 
                      color: '#64748b',
                      background: '#f8fafc',
                      border: '1px dashed #e2e8f0',
                      borderRadius: '8px'
                    }}>
                      No finished products found
                    </td>
                  </tr>
                ) : filtered.map((it, idx) => {
                  const hasCode = !!(it.itemCode && String(it.itemCode).trim());
                  const displayCode = hasCode ? String(it.itemCode).toUpperCase() : (it._id ? `ID…${String(it._id).slice(-6)}` : "-");
                  const isLow = Number(it.quantity ?? 0) <= Number((it.reOrderLevel ?? it.uol ?? 0) || 0);
                  
                  return (
                    <tr 
                      key={it._id} 
                      style={{ 
                        borderBottom: '1px solid #f1f5f9',
                        background: isLow ? '#fffbeb' : (idx % 2 ? '#f9fafb' : 'white'),
                        transition: 'background 0.2s',
                        ':hover': {
                          background: isLow ? '#fef3c7' : '#f8fafc'
                        }
                      }}
                    >
                      <td style={{ 
                        padding: '16px', 
                        fontFamily: 'ui-monospace, monospace',
                        fontSize: '14px',
                        color: '#1e293b',
                        fontWeight: '500'
                      }}>
                        {displayCode}
                      </td>
                      <td style={{ 
                        padding: '16px',
                        color: '#1e293b',
                        fontWeight: '500',
                        fontSize: '14px'
                      }}>
                        <span style={{ 
                          display: 'block', 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis' 
                        }}>
                          {it.name}
                        </span>
                      </td>
                      <td style={{ 
                        padding: '16px',
                        color: '#475569',
                        fontSize: '14px'
                      }}>
                        <span style={{ 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          display: 'inline-block', 
                          maxWidth: '240px',
                          color: it.description ? '#475569' : '#94a3b8'
                        }}>
                          {it.description || 'No description'}
                        </span>
                      </td>
                      <td style={{ 
                        padding: '16px',
                        color: '#475569',
                        fontSize: '14px'
                      }}>
                        <span style={{ 
                          display: 'block', 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          color: it.category ? '#475569' : '#94a3b8'
                        }}>
                          {it.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td style={{ 
                        padding: '16px',
                        color: '#475569',
                        fontSize: '14px'
                      }}>
                        <span style={{
                          background: '#f1f5f9',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '13px',
                          color: '#475569'
                        }}>
                          {it.unit || 'N/A'}
                        </span>
                      </td>
                      <td style={{ 
                        padding: '16px',
                        textAlign: 'right',
                        fontFamily: 'ui-monospace, monospace',
                        fontSize: '14px',
                        color: '#1e40af',
                        fontWeight: '500'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                          <span>LKR {typeof it.sellingPrice === 'number' ? it.sellingPrice.toFixed(2) : '0.00'}</span>
                        </div>
                      </td>
                      <td style={{ 
                        padding: '16px',
                        textAlign: 'right',
                        fontFamily: 'ui-monospace, monospace',
                        fontSize: '14px',
                        color: isLow ? '#b45309' : '#1e40af',
                        fontWeight: '600'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                          <span>{it.quantity ?? 0}</span>
                          <span style={{ 
                            color: isLow ? '#b45309' : '#64748b',
                            fontSize: '13px',
                            fontWeight: '400'
                          }}>
                            {it.unit}
                          </span>
                          {isLow && (
                            <span style={{
                              background: '#fef3c7',
                              color: '#92400e',
                              fontSize: '11px',
                              padding: '2px 6px',
                              borderRadius: '9999px',
                              marginLeft: '6px'
                            }}>
                              Low Stock
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ 
                        padding: '16px',
                        color: '#64748b',
                        fontSize: '13px',
                        whiteSpace: 'nowrap'
                      }}>
                        {new Date(it.updatedAt || it.createdAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td style={{ 
                        padding: '16px',
                        whiteSpace: 'nowrap',
                        overflow: 'visible'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          gap: '8px', 
                          alignItems: 'center', 
                          flexWrap: 'wrap',
                          justifyContent: 'center'
                        }}>
                          <button 
                            onClick={() => openStockModal(it, 'in')} 
                            style={{ 
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#10b981', 
                              color: 'white', 
                              border: 'none', 
                              padding: '6px 12px', 
                              borderRadius: '6px', 
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '500',
                              transition: 'all 0.2s',
                              ':hover': {
                                background: '#059669',
                                transform: 'translateY(-1px)'
                              }
                            }}
                          >
                            <FaArrowUp size={12} />
                            Stock In
                          </button>
                          <button 
                            onClick={() => openStockModal(it, 'out')}
                            style={{ 
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#f59e0b', 
                              color: '#78350f', 
                              border: 'none', 
                              padding: '6px 12px', 
                              borderRadius: '6px', 
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '500',
                              transition: 'all 0.2s',
                              ':hover': {
                                background: '#d97706',
                                color: 'white',
                                transform: 'translateY(-1px)'
                              }
                            }}
                          >
                            <FaArrowDown size={12} />
                            Stock Out
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        {toast.show && (
          <div style={{ 
            position: 'fixed', 
            right: '20px', 
            bottom: '20px', 
            background: toast.type === 'success' ? '#f0fdf4' : '#fef2f2', 
            border: `1px solid ${toast.type === 'success' ? '#86efac' : '#fecaca'}`, 
            color: toast.type === 'success' ? '#166534' : '#b91c1c', 
            padding: '12px 16px', 
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 50,
            maxWidth: '360px',
            animation: 'slideIn 0.3s ease-out forwards',
            '@keyframes slideIn': {
              '0%': { transform: 'translateX(100%)', opacity: 0 },
              '100%': { transform: 'translateX(0)', opacity: 1 }
            }
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: toast.type === 'success' ? '#22c55e' : '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {toast.type === 'success' ? '✓' : '!'}
            </div>
            <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
              {toast.message}
            </div>
          </div>
        )}

        {/* Stock Adjustment Modal */}
        {stockModalOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              width: '90%',
              maxWidth: '500px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px'
              }}>
                <h2 style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#1e293b'
                }}>
                  {stockOperation === 'in' ? '📦 Stock In' : '📤 Stock Out'}
                </h2>
                <button
                  onClick={closeStockModal}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#6b7280',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  ×
                </button>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Product
                </label>
                <div style={{
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px',
                  color: '#374151'
                }}>
                  <strong>{selectedProduct?.name || 'Unknown Product'}</strong>
                  {selectedProduct?.itemCode && (
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                      Code: {selectedProduct.itemCode}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                    Current Stock: {selectedProduct?.quantity || 0} {selectedProduct?.unit || 'units'}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Quantity
                </label>
                <input
                  type="number"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  placeholder={`Enter quantity to ${stockOperation === 'in' ? 'add' : 'subtract'}`}
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Reason
                </label>
                <select
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                >
                  <option value="">Select a reason</option>
                  {(stockOperation === 'in' ? stockInReasons : stockOutReasons).map((reason, index) => (
                    <option key={index} value={reason}>
                      {reason}
                    </option>
                  ))}
                  <option value="custom">Other (specify below)</option>
                </select>
                
                {stockReason === 'custom' && (
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Enter custom reason"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      marginTop: '8px',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                )}
              </div>

              {stockQuantity && (
                <div style={{
                  background: stockOperation === 'in' ? '#f0fdf4' : '#fef3c7',
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  fontSize: '13px',
                  color: stockOperation === 'in' ? '#065f46' : '#92400e'
                }}>
                  {stockOperation === 'in' ? (
                    <>New quantity will be: <strong>{(selectedProduct?.quantity || 0) + Number(stockQuantity)} {selectedProduct?.unit || 'units'}</strong></>
                  ) : (
                    Number(stockQuantity) > (selectedProduct?.quantity || 0) ? (
                      <>⚠️ Insufficient stock! Current: {selectedProduct?.quantity || 0}</>
                    ) : (
                      <>New quantity will be: <strong>{(selectedProduct?.quantity || 0) - Number(stockQuantity)} {selectedProduct?.unit || 'units'}</strong></>
                    )
                  )}
                </div>
              )}

              {stockError && (
                <div style={{
                  padding: '12px',
                  background: '#fee2e2',
                  color: '#991b1b',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  fontSize: '13px'
                }}>
                  {stockError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={closeStockModal}
                  disabled={stockLoading}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    background: 'white',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: stockLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: stockLoading ? 0.6 : 1
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={submitStockAdjustment}
                  disabled={stockLoading || !stockQuantity}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    background: stockOperation === 'in' ? '#10b981' : '#f59e0b',
                    color: stockOperation === 'in' ? 'white' : '#78350f',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: (stockLoading || !stockQuantity) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: (stockLoading || !stockQuantity) ? 0.6 : 1
                  }}
                >
                  {stockLoading ? 'Processing...' : `${stockOperation === 'in' ? 'Add' : 'Remove'} Stock`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
