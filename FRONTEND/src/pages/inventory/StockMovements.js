import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import InventorySidebar from "../../components/InventorySidebar";
import http from "../../api/http";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function StockMovements() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [type, setType] = useState(""); // all | raw_material | finished_product
  const [ttype, setTtype] = useState(""); // all | in | out
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [limit, setLimit] = useState(25); // page size
  const [q, setQ] = useState(""); // search by code/reason/user
  const [page, setPage] = useState(1);

  // Category filter and maps
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]); // for selected type
  const [catMap, setCatMap] = useState({}); // itemCode -> category (for filtering)

  // Build categories and itemCode->category map based on selected item type
  const loadCategoryData = async () => {
    try {
      // Reset first
      setCategories([]);
      setCatMap({});

      if (type === 'finished_product') {
        // Map itemCode -> category from inventory
        const [finRes, prodRes] = await Promise.all([
          http.get('/api/finishedproducts'),
          http.get('/api/products'), // admin-managed products list with categories
        ]);
        const finArr = finRes?.data?.items || finRes?.data?.data || finRes?.data || [];
        const m = {};
        finArr.forEach(it => {
          const code = String(it.itemCode || '').toUpperCase();
          const c = String(it.category || '').trim();
          if (code) m[code] = c || 'Uncategorized';
        });
        setCatMap(m);

        // Build category list from Product management
        const prods = prodRes?.data?.products || prodRes?.data?.items || [];
        const set = new Set();
        prods.forEach(p => { const c = String(p?.category || '').trim(); if (c) set.add(c); });
        setCategories(Array.from(set));
      } else if (type === 'raw_material') {
        // Infer raw material categories via supplier materials + material categories
        const [sm, mc] = await Promise.all([
          http.get('/api/supplier-materials'),
          http.get('/api/material-categories'),
        ]);
        const catById = {};
        const mcList = mc?.data?.categories || mc?.data?.items || mc?.data?.data || [];
        mcList.forEach(c => { if (c && c._id) catById[c._id] = c.name; });
        const m = {}; const set = new Set();
        (sm?.data?.items || sm?.data?.data || sm?.data || []).forEach(s => {
          const code = String(s.materialCode || '').toUpperCase();
          const name = catById[s.categoryId] || 'Uncategorized';
          if (code) m[code] = name;
          if (name && name !== 'Uncategorized') set.add(name);
        });
        setCatMap(m);
        setCategories(Array.from(set));
      }
    } catch (e) {
      console.error('Failed to load categories', e);
      setCategories([]);
      setCatMap({});
    }
  };

  // When item type changes, refresh categories for the dropdown
  useEffect(() => {
    if (!type) { setCategories([]); setCatMap({}); return; }
    loadCategoryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const load = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (type && type !== 'all') params.set('itemType', type);
      if (ttype && ttype !== 'all') params.set('transactionType', ttype);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      // Request a generous number so client-side pagination/search works smoothly
      params.set('limit', String(Math.max(100, limit * 10)));
      const res = await http.get(`/api/stock-transactions?${params.toString()}`);
      setItems(res?.data?.items || []);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  // Initialize filters from URL params and load
  useEffect(()=>{
    const params = new URLSearchParams(location.search || "");
    const pType = params.get('itemType');
    const pTType = params.get('transactionType');
    const pFrom = params.get('dateFrom');
    const pTo = params.get('dateTo');
    const pLimit = params.get('limit');
    const pCat = params.get('category');
    if (pType !== null) setType(pType);
    if (pTType !== null) setTtype(pTType);
    if (pFrom !== null) setDateFrom(pFrom);
    if (pTo !== null) setDateTo(pTo);
    if (pLimit !== null && !Number.isNaN(Number(pLimit))) setLimit(Number(pLimit));
    if (pCat !== null) setCategory(pCat);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const onFilter = (e) => { e.preventDefault(); setPage(1); load(); };

  const prettyDate = (s) => new Date(s).toLocaleString();

  // Client-side search & pagination
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let arr = items;
    if (term) {
      arr = items.filter(t =>
        String(t.itemCode||'').toLowerCase().includes(term) ||
        String(t.reason||'').toLowerCase().includes(term) ||
        String(t.performedBy||'').toLowerCase().includes(term) ||
        String(t.referenceId||'').toLowerCase().includes(term)
      );
    }
    // Category filter (only when selected)
    if (category) {
      arr = arr.filter(t => {
        const c = catMap[String(t.itemCode||"").toUpperCase()] || "";
        return c === category;
      });
    }
    return arr;
  }, [items, q, category, catMap]);

  const totalIn = useMemo(() => filtered.filter(t=>t.transactionType==='in').reduce((s,t)=>s+Number(t.quantity||0),0), [filtered]);
  const totalOut = useMemo(() => filtered.filter(t=>t.transactionType==='out').reduce((s,t)=>s+Number(t.quantity||0),0), [filtered]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / limit));
  const pageItems = useMemo(() => {
    const start = (page - 1) * limit;
    return filtered.slice(start, start + limit);
  }, [filtered, page, limit]);

  const exportPDF = () => {
    const doc = new jsPDF('l', 'pt', 'a4');
    // Header
    doc.setTextColor(30, 127, 59); // green
    doc.setFontSize(16);
    doc.text('Green Lion Company', 40, 30);
    doc.setFontSize(12);
    doc.text('Inventory – Stock Movements', 40, 46);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Printed on: ${new Date().toLocaleString()}`, 40, 62);

    const body = filtered.map(t => ([
      prettyDate(t.timestamp || t.createdAt),
      t.itemCode || '',
      catMap[String(t.itemCode || '').toUpperCase()] || '-',
      t.itemType || '',
      t.transactionType || '',
      String(t.quantity ?? ''),
      String(t.previousStock ?? ''),
      String(t.newStock ?? ''),
      t.reason || '',
      (t.notes || '').replace(/\n/g, ' '),
    ]));

    autoTable(doc, {
      startY: 76,
      head: [[ 'Time','Item Code','Category','Item Type','Transaction','Quantity','Prev','New','Reason','Notes' ]],
      body,
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [30,127,59], textColor: [0,0,0] },
      columnStyles: { 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' } },
    });

    doc.save(`stock_movements_${Date.now()}.pdf`);
  };

  // Import the InventoryHeader component
  const { InventoryHeader } = require('../../styles/inventoryStyles');

  return (
    <div style={{ display: 'flex', minHeight:'100vh', background:'#f5f7fa' }}>
      <InventorySidebar />
      <div style={{ flex:1, padding:'24px', maxWidth:'1400px', margin:'0 auto', width:'100%' }}>
        <InventoryHeader 
          title="Stock Movements"
          subtitle="Track and analyze all inventory transactions"
          actions={[
            {
              label: 'Refresh',
              icon: '🔄',
              onClick: load,
              primary: true
            },
            {
              label: 'Export PDF',
              icon: '📄',
              onClick: exportPDF,
              primary: false
            }
          ]}
        />

        {/* Filter Form */}
        <form 
          onSubmit={onFilter} 
          style={{ 
            display:'grid', 
            gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', 
            gap:'16px', 
            background:'#ffffff', 
            border:'1px solid #e5e9f2', 
            borderRadius:'10px', 
            padding:'20px', 
            marginBottom:'20px', 
            boxShadow:'0 2px 10px rgba(0,0,0,0.04)'
          }}
        >
          <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
            <label style={{ color:'#4a5568', fontSize:'14px', fontWeight:500 }}>Item Type</label>
            <select 
              value={type} 
              onChange={e=>{ setType(e.target.value); setCategory(''); }} 
              style={{ 
                padding:'10px 12px', 
                border:'1px solid #e2e8f0', 
                borderRadius:'6px', 
                backgroundColor:'#f8fafc', 
                fontSize:'14px', 
                transition:'all 0.2s',
                color:'#2d3748',
                outline:'none',
                cursor:'pointer'
              }}
            >
              <option value="">All Types</option>
              <option value="raw_material">Raw Material</option>
              <option value="finished_product">Finished Product</option>
            </select>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
            <label style={{ color:'#4a5568', fontSize:'14px', fontWeight:500 }}>Category</label>
            <select 
              value={category} 
              onChange={e=>{ setCategory(e.target.value); setPage(1); }} 
              disabled={!type || type==='all' || categories.length===0} 
              style={{ 
                padding:'10px 12px', 
                border:'1px solid #e2e8f0', 
                borderRadius:'6px', 
                backgroundColor:'#f8fafc',
                fontSize:'14px',
                color:'#2d3748',
                outline:'none',
                cursor:'pointer',
                opacity: (!type || type==='all' || categories.length===0) ? 0.7 : 1
              }}
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
            <label style={{ color:'#4a5568', fontSize:'14px', fontWeight:500 }}>Transaction</label>
            <select 
              value={ttype} 
              onChange={e=>setTtype(e.target.value)} 
              style={{ 
                padding:'10px 12px', 
                border:'1px solid #e2e8f0', 
                borderRadius:'6px', 
                backgroundColor:'#f8fafc',
                fontSize:'14px',
                color:'#2d3748',
                outline:'none',
                cursor:'pointer'
              }}
            >
              <option value="">All Transactions</option>
              <option value="in">Incoming</option>
              <option value="out">Outgoing</option>
            </select>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
            <label style={{ color:'#4a5568', fontSize:'14px', fontWeight:500 }}>Date From</label>
            <input 
              type="date" 
              value={dateFrom} 
              onChange={e=>setDateFrom(e.target.value)} 
              style={{ 
                padding:'10px 12px', 
                border:'1px solid #e2e8f0', 
                borderRadius:'6px',
                backgroundColor:'#f8fafc',
                fontSize:'14px',
                color:'#2d3748',
                outline:'none',
                fontFamily:'inherit'
              }} 
            />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
            <label style={{ color:'#4a5568', fontSize:'14px', fontWeight:500 }}>Date To</label>
            <input 
              type="date" 
              value={dateTo} 
              onChange={e=>setDateTo(e.target.value)} 
              style={{ 
                padding:'10px 12px', 
                border:'1px solid #e2e8f0', 
                borderRadius:'6px',
                backgroundColor:'#f8fafc',
                fontSize:'14px',
                color:'#2d3748',
                outline:'none',
                fontFamily:'inherit'
              }} 
            />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
            <label style={{ color:'#4a5568', fontSize:'14px', fontWeight:500 }}>Items per page</label>
            <input 
              type="number" 
              min="5" 
              max="100" 
              value={limit} 
              onChange={e=>setLimit(Number(e.target.value)||25)} 
              style={{ 
                padding:'10px 12px', 
                border:'1px solid #e2e8f0', 
                borderRadius:'6px',
                backgroundColor:'#f8fafc',
                fontSize:'14px',
                color:'#2d3748',
                outline:'none',
                fontFamily:'inherit'
              }} 
            />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
            <label style={{ color:'#4a5568', fontSize:'14px', fontWeight:500 }}>Search</label>
            <input 
              placeholder="Code, reason, user, or reference" 
              value={q} 
              onChange={e=>{ setQ(e.target.value); setPage(1); }} 
              style={{ 
                padding:'10px 12px', 
                border:'1px solid #e2e8f0', 
                borderRadius:'6px',
                backgroundColor:'#f8fafc',
                fontSize:'14px',
                color:'#2d3748',
                outline:'none',
                fontFamily:'inherit'
              }} 
            />
          </div>
          <div style={{ display:'flex', alignItems:'flex-end' }}>
            <button 
              type="submit" 
              style={{ 
                background:'#1E7F3B', 
                color:'#fff', 
                border:'none',
                padding:'10px 16px', 
                borderRadius:'6px', 
                cursor:'pointer',
                fontWeight:500,
                fontSize:'14px',
                transition:'all 0.2s',
                height:'40px',
                width:'100%',
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                gap:'8px'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#166f33'}
              onMouseOut={(e) => e.currentTarget.style.background = '#1E7F3B'}
            >
              <span>🔍</span> Apply Filters
            </button>
          </div>
        </form>

        {/* Summary Cards */}
        <div style={{ display:'flex', gap:'16px', flexWrap:'wrap', marginBottom:'20px' }}>
          <div style={{ 
            background:'#f0fdf4', 
            border:'1px solid #bbf7d0', 
            color:'#166534', 
            padding:'14px 20px', 
            borderRadius:'10px', 
            fontWeight:500, 
            display:'flex', 
            alignItems:'center', 
            gap:'10px',
            flex:1,
            minWidth:'200px',
            boxShadow:'0 2px 4px rgba(0,0,0,0.03)'
          }}>
            <div style={{ 
              width:'40px', 
              height:'40px', 
              borderRadius:'50%', 
              background:'#dcfce7',
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              color:'#16a34a',
              fontSize:'18px'
            }}>↑</div>
            <div>
              <div style={{ fontSize:'14px', color:'#4b5563' }}>Total In</div>
              <div style={{ fontSize:'20px', fontWeight:600, color:'#166534' }}>{totalIn}</div>
            </div>
          </div>
          <div style={{ 
            background:'#fef2f2', 
            border:'1px solid #fecaca', 
            color:'#991b1b', 
            padding:'14px 20px', 
            borderRadius:'10px', 
            fontWeight:500, 
            display:'flex', 
            alignItems:'center', 
            gap:'10px',
            flex:1,
            minWidth:'200px',
            boxShadow:'0 2px 4px rgba(0,0,0,0.03)'
          }}>
            <div style={{ 
              width:'40px', 
              height:'40px', 
              borderRadius:'50%', 
              background:'#fee2e2',
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              color:'#dc2626',
              fontSize:'18px'
            }}>↓</div>
            <div>
              <div style={{ fontSize:'14px', color:'#4b5563' }}>Total Out</div>
              <div style={{ fontSize:'20px', fontWeight:600, color:'#991b1b' }}>{totalOut}</div>
            </div>
          </div>
          <div style={{ 
            background:'#eff6ff', 
            border:'1px solid #bfdbfe', 
            color:'#1e40af', 
            padding:'14px 20px', 
            borderRadius:'10px', 
            fontWeight:500, 
            display:'flex', 
            alignItems:'center', 
            gap:'10px',
            flex:1,
            minWidth:'200px',
            boxShadow:'0 2px 4px rgba(0,0,0,0.03)'
          }}>
            <div style={{ 
              width:'40px', 
              height:'40px', 
              borderRadius:'50%', 
              background:'#dbeafe',
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              color:'#3b82f6',
              fontSize:'18px'
            }}>↔</div>
            <div>
              <div style={{ fontSize:'14px', color:'#4b5563' }}>Net Movement</div>
              <div style={{ fontSize:'20px', fontWeight:600, color:'#1e40af' }}>{totalIn - totalOut}</div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div style={{ 
          background:'#fff', 
          border:'1px solid #e5e9f2', 
          borderRadius:'10px', 
          padding:0, 
          overflow:'hidden', 
          boxShadow:'0 2px 10px rgba(0,0,0,0.04)'
        }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
              <thead>
                <tr style={{ 
                  background:'#f8fafc', 
                  color:'#4a5568', 
                  textAlign:'left', 
                  borderBottom:'1px solid #e2e8f0',
                  fontSize:'13px',
                  textTransform:'uppercase',
                  letterSpacing:'0.5px',
                  fontWeight:600
                }}>
                  <th style={{ padding:'14px 16px', borderBottom:'1px solid #e2e8f0' }}>Time</th>
                  <th style={{ padding:'14px 16px', borderBottom:'1px solid #e2e8f0' }}>Item Code</th>
                  <th style={{ padding:'14px 16px', borderBottom:'1px solid #e2e8f0' }}>Category</th>
                  <th style={{ padding:'14px 16px', borderBottom:'1px solid #e2e8f0' }}>Type</th>
                  <th style={{ padding:'14px 16px', borderBottom:'1px solid #e2e8f0' }}>Transaction</th>
                  <th style={{ padding:'14px 16px', borderBottom:'1px solid #e2e8f0', textAlign:'right' }}>Qty</th>
                  <th style={{ padding:'14px 16px', borderBottom:'1px solid #e2e8f0', textAlign:'center' }}>Prev → New</th>
                  <th style={{ padding:'14px 16px', borderBottom:'1px solid #e2e8f0' }}>Reason</th>
                  <th style={{ padding:'14px 16px', borderBottom:'1px solid #e2e8f0' }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} style={{ padding:'32px', textAlign:'center', color:'#718096' }}>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'12px' }}>
                        <div style={{ width:'40px', height:'40px', borderRadius:'50%', border:'3px solid #e2e8f0', borderTopColor:'#1E7F3B', animation:'spin 1s linear infinite' }}></div>
                        <div>Loading transactions...</div>
                      </div>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding:'40px', textAlign:'center', color:'#718096' }}>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'12px' }}>
                        <div style={{ width:'60px', height:'60px', borderRadius:'50%', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <span style={{ fontSize:'28px' }}>📭</span>
                        </div>
                        <div style={{ fontSize:'16px', fontWeight:500, color:'#4a5568' }}>No transactions found</div>
                        <div style={{ maxWidth:'400px', color:'#718096', lineHeight:'1.5' }}>
                          Try adjusting your filters or add a new transaction to get started.
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : pageItems.map((t, index) => {
                  const isEven = index % 2 === 0;
                  return (
                    <tr 
                      key={t._id} 
                      style={{ 
                        background: isEven ? '#fff' : '#f8fafc',
                        transition:'all 0.2s',
                        borderBottom:'1px solid #f0f4f8'
                      }} 
                      onMouseEnter={e => e.currentTarget.style.background = isEven ? '#f8fafc' : '#f1f5f9'}
                      onMouseLeave={e => e.currentTarget.style.background = isEven ? '#fff' : '#f8fafc'}
                    >
                      <td style={{ 
                        padding:'14px 16px', 
                        fontSize:'13px', 
                        color:'#4a5568',
                        whiteSpace:'nowrap'
                      }}>
                        {prettyDate(t.timestamp || t.createdAt)}
                      </td>
                      <td style={{ 
                        padding:'14px 16px', 
                        fontFamily:'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        fontSize:'13px',
                        color:'#2d3748',
                        fontWeight:500
                      }}>
                        {t.itemCode}
                      </td>
                      <td style={{ 
                        padding:'14px 16px', 
                        fontSize:'13px',
                        color:'#4a5568'
                      }}>
                        {t.category || catMap[String(t.itemCode||'').toUpperCase()] || '-'}
                      </td>
                      <td style={{ 
                        padding:'14px 16px', 
                        fontSize:'13px',
                        color:'#4a5568',
                        textTransform:'capitalize'
                      }}>
                        {t.itemType ? t.itemType.replace('_', ' ') : '-'}
                      </td>
                      <td style={{ padding:'14px 16px' }}>
                        <span style={{ 
                          padding:'4px 10px 4px 8px', 
                          borderRadius:'4px', 
                          background: t.transactionType === 'in' ? '#f0fdf4' : 
                                    t.transactionType === 'adjustment' ? '#fef3c7' : '#fef2f2', 
                          color: t.transactionType === 'in' ? '#166534' : 
                                t.transactionType === 'adjustment' ? '#92400e' : '#991b1b', 
                          fontSize:'12px',
                          fontWeight:500,
                          display:'inline-flex',
                          alignItems:'center',
                          gap:'4px',
                          border:'1px solid',
                          borderColor: t.transactionType === 'in' ? '#bbf7d0' : 
                                     t.transactionType === 'adjustment' ? '#fde68a' : '#fecaca',
                          whiteSpace:'nowrap'
                        }}>
                          {t.transactionType === 'in' ? (
                            <span style={{ fontSize:'14px' }}>⬆</span>
                          ) : t.transactionType === 'adjustment' ? (
                            <span style={{ fontSize:'14px' }}>⚙</span>
                          ) : (
                            <span style={{ fontSize:'14px' }}>⬇</span>
                          )}
                          {t.transactionType === 'in' ? 'Incoming' : 
                           t.transactionType === 'adjustment' ? 'Adjustment' : 'Outgoing'}
                        </span>
                      </td>
                      <td style={{ 
                        padding:'14px 16px', 
                        fontSize:'13px',
                        textAlign:'right',
                        fontWeight:500,
                        color: t.transactionType === 'in' ? '#166534' : 
                               t.transactionType === 'adjustment' ? '#92400e' : '#991b1b',
                        fontVariantNumeric:'tabular-nums'
                      }}>
                        {t.quantity}
                      </td>
                      <td style={{ 
                        padding:'14px 16px', 
                        fontSize:'13px',
                        textAlign:'center',
                        color:'#4a5568',
                        fontVariantNumeric:'tabular-nums',
                        whiteSpace:'nowrap'
                      }}>
                        <span style={{ 
                          display:'inline-flex', 
                          alignItems:'center', 
                          gap:'4px',
                          background:'#f8fafc',
                          padding:'4px 8px',
                          borderRadius:'4px',
                          border:'1px solid #e2e8f0'
                        }}>
                          <span style={{ color:'#718096' }}>{t.previousStock ?? '0'}</span>
                          <span style={{ color:'#cbd5e0' }}>→</span>
                          <span style={{ color:'#1E7F3B', fontWeight:600 }}>{t.newStock ?? '0'}</span>
                        </span>
                      </td>
                      <td style={{ 
                        padding:'14px 16px', 
                        fontSize:'13px',
                        color:'#4a5568',
                        maxWidth:'200px',
                        whiteSpace:'nowrap',
                        overflow:'hidden',
                        textOverflow:'ellipsis'
                      }}>
                        {t.reason || '-'}
                      </td>
                      <td style={{ 
                        padding:'14px 16px', 
                        fontSize:'13px',
                        color:'#4a5568',
                        maxWidth:'240px',
                        whiteSpace:'nowrap',
                        overflow:'hidden',
                        textOverflow:'ellipsis'
                      }}>
                        {t.notes || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <style jsx global>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </table>
          </div>
          <div style={{ 
            display:'flex', 
            alignItems:'center', 
            justifyContent:'space-between', 
            padding:'14px 20px', 
            borderTop:'1px solid #e2e8f0', 
            gap:16, 
            flexWrap:'wrap',
            background:'#f8fafc',
            borderBottomLeftRadius:'10px',
            borderBottomRightRadius:'10px'
          }}>
            <div style={{ fontSize:'13px', color:'#64748b' }}>
              Showing <span style={{ fontWeight:600, color:'#334155' }}>{Math.min((page-1)*limit+1, filtered.length) || 0}</span> to <span style={{ fontWeight:600, color:'#334155' }}>{Math.min(page*limit, filtered.length)}</span> of <span style={{ fontWeight:600, color:'#334155' }}>{filtered.length}</span> results
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <button 
                disabled={page<=1} 
                onClick={()=>setPage(p=>Math.max(1,p-1))} 
                style={{ 
                  background:'#fff', 
                  border:'1px solid #e2e8f0',
                  color: page<=1 ? '#cbd5e1' : '#4a5568',
                  padding:'8px 12px', 
                  borderRadius:'6px', 
                  cursor: page<=1 ? 'not-allowed' : 'pointer',
                  fontSize:'13px',
                  fontWeight:500,
                  display:'flex',
                  alignItems:'center',
                  gap:'6px',
                  transition:'all 0.2s',
                  boxShadow:'0 1px 2px rgba(0,0,0,0.03)'
                }}
                onMouseOver={e => {
                  if (page > 1) e.currentTarget.style.background = '#f8fafc';
                }}
                onMouseOut={e => {
                  if (page > 1) e.currentTarget.style.background = '#fff';
                }}
              >
                <span>←</span> Previous
              </button>
              <div style={{ 
                display:'flex', 
                alignItems:'center', 
                gap:8,
                fontSize:'13px',
                color:'#64748b',
                padding:'0 8px'
              }}>
                <span>Page</span>
                <span style={{ fontWeight:600, color:'#1E7F3B' }}>{page}</span>
                <span>of</span>
                <span>{pageCount}</span>
              </div>
              <button 
                disabled={page>=pageCount} 
                onClick={()=>setPage(p=>Math.min(pageCount,p+1))} 
                style={{ 
                  background: page>=pageCount ? '#f5f5f5' : '#f5f5f5', 
                  color: page>=pageCount ? '#9e9e9e' : '#424242',
                  border:'1px solid #e0e0e0', 
                  padding:'6px 12px', 
                  borderRadius:4, 
                  cursor: page>=pageCount ? 'not-allowed' : 'pointer',
                  display:'flex',
                  alignItems:'center',
                  gap:6,
                  transition:'all 0.2s'
                }}
              >
                Next <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
