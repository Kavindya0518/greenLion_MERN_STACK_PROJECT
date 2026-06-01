import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import http from "../api/http";
import SupplierSidebar from "./SupplierSidebar";
// Import jsPDF
import { jsPDF } from 'jspdf';

export default function SuppliersList() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [success, setSuccess] = useState("");
  const [actionError, setActionError] = useState("");
  const [workingId, setWorkingId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [edit, setEdit] = useState({ name: "", contactPerson: "", username: "", category: "", email: "", phone: "", status: "Active" });
  const [categories, setCategories] = useState([]);
  const [editErrors, setEditErrors] = useState({});
  const [q, setQ] = useState("");
  
  // Debug: Log when q state changes
  useEffect(() => {
    console.log('Search state changed:', q, 'Length:', q.length);
  }, [q]);
  
  // Debug: Log items when they change
  useEffect(() => {
    console.log('=== SUPPLIERS DATA ===');
    console.log('Total suppliers:', items.length);
    if (items.length > 0) {
      console.log('First supplier sample:', {
        name: items[0].name || items[0].companyName,
        category: items[0].category,
        status: items[0].status
      });
    }
    console.log('=== END SUPPLIERS DATA ===');
  }, [items]);
  const [sort, setSort] = useState("name-asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [confirm, setConfirm] = useState({ open: false, id: "", title: "", message: "" });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await http.get("/api/suppliers");
        if (!mounted) return;
        const arr = Array.isArray(res?.data?.suppliers)
          ? res.data.suppliers
          : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.data?.data)
              ? res.data.data
              : [];
        setItems(arr);
        // load categories for dropdown
        const rc = await http.get("/api/material-categories").catch(()=>({ data: [] }));
        const cats = Array.isArray(rc?.data?.categories)
          ? rc.data.categories
          : Array.isArray(rc?.data)
            ? rc.data
            : Array.isArray(rc?.data?.data)
              ? rc.data.data
              : [];
        setCategories(cats);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e?.message || "Failed to load suppliers");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (location.state?.success) {
      setSuccess(location.state.success);
      // clear success after display so it doesn't persist across navigation
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const filtered = useMemo(() => {
    console.log('=== FILTERING DEBUG ===');
    console.log('Raw search query (q):', q);
    console.log('Search query type:', typeof q);
    console.log('Search query length:', q ? q.length : 'undefined');
    
    const searchTerm = q ? q.toLowerCase() : '';
    console.log('Processed search term:', searchTerm);
    
    let data = items.filter(s => filter === 'all' || (s.status || 'Active') === filter);
    console.log('Items after status filter:', data.length);
    
    // Search by Company Name and Category - works from first letter
    if (searchTerm.length > 0) {
      const beforeFilter = data.length;
      data = data.filter(s => {
        const companyName = (s.name || s.companyName || '').toLowerCase();
        const category = (s.category || '').toLowerCase();
        
        const matchesCompany = companyName.includes(searchTerm);
        const matchesCategory = category.includes(searchTerm);
        
        if (matchesCompany || matchesCategory) {
          console.log('Match found:', {
            company: companyName,
            category: category,
            searchTerm: searchTerm
          });
        }
        
        return matchesCompany || matchesCategory;
      });
      
      console.log('Items before search filter:', beforeFilter);
      console.log('Items after search filter:', data.length);
    } else {
      console.log('No search term, showing all items');
    }
    
    // Apply sorting
    if (sort === 'name-asc') data = [...data].sort((a,b)=> (a.name||a.companyName||'').localeCompare(b.name||b.companyName||''));
    if (sort === 'name-desc') data = [...data].sort((a,b)=> (b.name||b.companyName||'').localeCompare(a.name||a.companyName||''));
    if (sort === 'recent') data = [...data].sort((a,b)=> new Date(b.createdAt||0) - new Date(a.createdAt||0));
    
    console.log('Final filtered data length:', data.length);
    console.log('=== END FILTERING DEBUG ===');
    
    return data;
  }, [items, filter, q, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages, page]);

  const startEdit = (s) => {
    setActionError("");
    setEditingId(s._id);
    setEditErrors({});
    setEdit({
      name: s.name || s.companyName || "",
      contactPerson: s.contactPerson || "",
      username: s.user?.username || s.username || "",
      category: s.category || "",
      email: s.email || "",
      phone: s.phone || "",
      status: s.status || "Active",
    });
  };

  const cancelEdit = () => {
    setEditingId("");
    setEdit({ name: "", contactPerson: "", username: "", category: "", email: "", phone: "", status: "Active" });
  };

  const saveEdit = async (id) => {
    try {
      setActionError("");
      setWorkingId(id);
      // inline validation
      const errs = {};
      if (!String(edit.name || '').trim()) errs.name = 'Company name is required';
      const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRx.test(String(edit.email || '').trim())) errs.email = 'Valid email is required';
      if (!String(edit.phone || '').trim()) errs.phone = 'Phone is required';
      setEditErrors(errs);
      if (Object.keys(errs).length) { setWorkingId(""); return; }
      const payload = {
        name: String(edit.name || "").trim(),
        contactPerson: String(edit.contactPerson || "").trim(),
        email: String(edit.email || "").trim(),
        phone: String(edit.phone || "").trim(),
        category: String(edit.category || "").trim(),
        status: edit.status || "Active",
      };
      // optimistic
      setItems(prev => prev.map(s => s._id === id ? { ...s, ...payload } : s));
      await http.patch(`/suppliers/${id}`, payload);
      setSuccess("Supplier updated");
      cancelEdit();
    } catch (e) {
      setActionError(e?.response?.data?.message || e?.message || "Failed to update supplier");
    } finally {
      setWorkingId("");
    }
  };

  const openConfirmDelete = (id, name) => setConfirm({ open: true, id, title: 'Delete Supplier', message: `Are you sure you want to delete “${name}”? This cannot be undone.` });
  const closeConfirm = () => setConfirm({ open: false, id: '', title: '', message: '' });
  const exportToPDF = async () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    const title = 'SUPPLIER DIRECTORY';
    const companyName = 'GREEN LION COMPANY';
    const headers = [
      { header: 'COMPANY', dataKey: 'company' },
      { header: 'CONTACT PERSON', dataKey: 'contact' },
      { header: 'USERNAME', dataKey: 'username' },
      { header: 'CATEGORY', dataKey: 'category' },
      { header: 'EMAIL', dataKey: 'email' },
      { header: 'PHONE', dataKey: 'phone' },
      { header: 'STATUS', dataKey: 'status' }
    ];
    
    // Set document properties
    doc.setProperties({
      title: `${companyName} - ${title}`,
      subject: 'Supplier Directory',
      author: 'Green Lion',
      keywords: 'suppliers, directory, green lion',
      creator: 'Green Lion System'
    });
    
    // Add header with company name and logo
    doc.setFillColor(46, 125, 50); // Brand green color
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 25, 'F');
    
    // Add company name
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, 15, 16);
    
    // Add logo to the right corner
    try {
      const logoPath = '/logo.png'; // Use the logo from public folder
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = () => {
          try {
            // Add logo to the right side of header
            const pageWidth = doc.internal.pageSize.getWidth();
            const logoWidth = 20; // Logo width in mm
            const logoHeight = 15; // Logo height in mm
            const logoX = pageWidth - logoWidth - 10; // 10mm from right edge
            const logoY = 5; // 5mm from top
            
            doc.addImage(img, 'PNG', logoX, logoY, logoWidth, logoHeight);
            resolve();
          } catch (error) {
            console.warn('Could not add logo to PDF:', error);
            resolve(); // Continue without logo if there's an error
          }
        };
        img.onerror = () => {
          console.warn('Could not load logo image');
          resolve(); // Continue without logo if image fails to load
        };
        img.src = logoPath;
      });
    } catch (error) {
      console.warn('Logo loading failed:', error);
    }
    
    // Add document title
    doc.setFontSize(14);
    doc.setTextColor(60, 60, 60);
    doc.text(title, 15, 35);
    
    // Add generation info
    doc.setFontSize(9);
    doc.setTextColor(100);
    const date = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Generated: ${date}`, 15, 42);
    
    // Prepare data for the table
    const data = items.map(supplier => {
      // Format phone number if needed
      const formatPhone = (phone) => {
        if (!phone) return '';
        // Add formatting logic here if needed
        return phone;
      };
      
      return {
        company: supplier.name || supplier.companyName || 'N/A',
        contact: supplier.contactPerson || 'N/A',
        username: (supplier.user && supplier.user.username) || supplier.username || 'N/A',
        category: supplier.category ? supplier.category.charAt(0).toUpperCase() + supplier.category.slice(1).toLowerCase() : 'N/A',
        email: supplier.email || 'N/A',
        phone: formatPhone(supplier.phone) || 'N/A',
        status: supplier.status || 'Inactive'
      };
    });
    
    // Table configuration
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const headerY = 50; // Start table below header
    
    // Column configuration
    const columns = [
      { header: 'COMPANY', dataKey: 'company', width: 45 },
      { header: 'CONTACT PERSON', dataKey: 'contact', width: 35 },
      { header: 'USERNAME', dataKey: 'username', width: 30 },
      { header: 'CATEGORY', dataKey: 'category', width: 25 },
      { header: 'EMAIL', dataKey: 'email', width: 50 },
      { header: 'PHONE', dataKey: 'phone', width: 30 },
      { header: 'STATUS', dataKey: 'status', width: 20 }
    ];
    
    // Calculate column positions
    let currentX = margin;
    const columnPositions = columns.map(col => {
      const pos = currentX;
      currentX += col.width;
      return { ...col, x: pos };
    });
    
    // Table drawing function
    const drawTable = (startY) => {
      let y = startY;
      const rowHeight = 8;
      
      // Draw header
      doc.setFillColor(46, 125, 50);
      doc.rect(margin, y, pageWidth - (margin * 2), rowHeight + 2, 'F');
      
      // Draw header text
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      
      columnPositions.forEach(col => {
        doc.text(col.header, col.x + 2, y + rowHeight - 2);
      });
      
      y += rowHeight + 4;
      
      // Draw rows
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      data.forEach((row, rowIndex) => {
        // Check for page break
        if (y > pageHeight - 20) {
          doc.addPage();
          y = margin + 20;
          
          // Draw header on new page
          doc.setFillColor(46, 125, 50);
          doc.rect(0, 0, pageWidth, 25, 'F');
          doc.setFontSize(18);
          doc.setTextColor(255, 255, 255);
          doc.text(companyName, 15, 16);
          
          // Add logo to new page header (synchronous loading for performance)
          try {
            const logoPath = '/logo.png';
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
              try {
                const logoWidth = 20;
                const logoHeight = 15;
                const logoX = pageWidth - logoWidth - 10;
                const logoY = 5;
                doc.addImage(img, 'PNG', logoX, logoY, logoWidth, logoHeight);
              } catch (error) {
                console.warn('Could not add logo to new page:', error);
              }
            };
            img.onerror = () => {
              console.warn('Could not load logo for new page');
            };
            img.src = logoPath;
          } catch (error) {
            console.warn('Logo loading failed for new page:', error);
          }
          
          doc.setFontSize(9);
          
          // Draw table header
          doc.setFillColor(46, 125, 50);
          doc.rect(margin, y, pageWidth - (margin * 2), rowHeight + 2, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 255, 255);
          columnPositions.forEach(col => {
            doc.text(col.header, col.x + 2, y + rowHeight - 2);
          });
          doc.setFont('helvetica', 'normal');
          y += rowHeight + 4;
        }
        
        // Alternate row color
        if (rowIndex % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, y - 2, pageWidth - (margin * 2), rowHeight + 2, 'F');
        }
        
        // Draw row data
        columnPositions.forEach(col => {
          const value = row[col.dataKey] || '';
          
          // Set text color based on status
          if (col.dataKey === 'status') {
            doc.setTextColor(value.toLowerCase() === 'active' ? 46 : 200, 
                            value.toLowerCase() === 'active' ? 125 : 50, 
                            value.toLowerCase() === 'active' ? 50 : 50);
          } else {
            doc.setTextColor(40, 40, 40);
          }
          
          doc.text(String(value), col.x + 2, y + rowHeight - 3, {
            maxWidth: col.width - 4,
            ellipsis: '...'
          });
        });
        
        y += rowHeight + 2;
      });
      
      return y;
    };
    
    // Draw the table
    drawTable(headerY);
    
    // Add footer to each page
    const pageCount = doc.internal.getNumberOfPages();
    const footerY = pageHeight - 15;
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Add footer line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin, footerY, pageWidth - margin, footerY);
      
      // Add page info
      doc.setFontSize(8);
      doc.setTextColor(100);
      
      // Left footer
      doc.text(
        `${companyName} • CONFIDENTIAL`,
        margin,
        footerY + 5
      );
      
      // Center footer
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        footerY + 5,
        { align: 'center' }
      );
      
      // Right footer
      doc.text(
        `Generated: ${new Date().toLocaleString()}`,
        pageWidth - margin,
        footerY + 5,
        { align: 'right' }
      );
    }
    
    // Save the PDF
    doc.save('suppliers-list.pdf');
  };

  const confirmDelete = async () => {
    const id = confirm.id;
    closeConfirm();
    try {
      setActionError("");
      const prev = items;
      setItems(prev.filter(s => s._id !== id));
      await http.delete(`/suppliers/${id}`);
      setSuccess("Supplier deleted");
    } catch (e) {
      setActionError(e?.response?.data?.message || e?.message || "Failed to delete supplier");
      // recover list
      try {
        const res = await http.get("/api/suppliers");
        const arr = Array.isArray(res?.data?.suppliers)
          ? res.data.suppliers
          : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.data?.data)
              ? res.data.data
              : [];
        setItems(arr);
      } catch {}
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', minHeight: '100vh', background:'#f8fafb' }}>
      <SupplierSidebar />
      <div style={{ flex:1, padding:24 }}>
        Loading…
      </div>
    </div>
  );
  if (error) return (
    <div style={{ display: 'flex', minHeight: '100vh', background:'#f8fafb' }}>
      <SupplierSidebar />
      <div style={{ flex:1, padding:24, color:'#b91c1c' }}>
        {error}
      </div>
    </div>
  );

  return (
    <>
    <div style={{ display:'flex', minHeight:'100vh', background:'#f8f9fa' }}>
      <SupplierSidebar />
      <div style={{ flex:1, padding:20, maxWidth:1200, margin:'0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h1 className="text-2xl font-bold" style={{ margin: 0, color: '#2c3e50' }}>Manage Suppliers</h1>
        <button 
          onClick={() => exportToPDF()}
          style={{
            padding: '8px 16px',
            background: '#2e7d32',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px'
          }}
        >
          <span>Export to PDF</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 15V3M12 15L8 11M12 15L16 11M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      {success && (
        <div style={{ marginTop:12, background:'#ecfdf5', border:'1px solid #a7f3d0', color:'#065f46', borderRadius:12, padding:12 }}>
          {success}
        </div>
      )}
      <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems:'center', flexWrap:'wrap', marginBottom: '15px' }}>
        <input
          type="text"
          value={q}
          onChange={(e)=>{ 
            const newValue = e.target.value;
            console.log('=== INPUT CHANGE ===');
            console.log('New input value:', newValue);
            console.log('New input length:', newValue.length);
            setQ(newValue); 
            setPage(1); 
            console.log('State updated');
          }}
          placeholder="Search by company name or category..."
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            flex: '1 1 250px',
            fontSize: '14px'
          }}
        />
        <select 
          value={sort} 
          onChange={(e)=>setSort(e.target.value)} 
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            background: 'white',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
          <option value="recent">Recently Added</option>
        </select>
        <select 
          value={filter} 
          onChange={(e)=>setFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            background: 'white',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          <option value="all">All</option>
          <option value="Active">Active</option>
          <option value="Pending">Pending</option>
          <option value="Inactive">Inactive</option>
        </select>
        <Link 
          to="/admin/suppliers/new" 
          style={{ 
            background: '#2e7d32', 
            color: '#fff', 
            border: 'none', 
            padding: '8px 16px', 
            borderRadius: '4px', 
            textDecoration: 'none',
            fontWeight: '500',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            ':hover': {
              background: '#218838'
            }
          }}
        >
          <span>+</span> Add Supplier
        </Link>
      </div>
      {actionError && (
        <div style={{ marginTop:12, background:'#fef2f2', border:'1px solid #fecaca', color:'#991b1b', borderRadius:12, padding:12 }}>
          {actionError}
        </div>
      )}
      <div style={{ 
        marginTop: 12, 
        background: '#fff', 
        border: '1px solid #ddd', 
        borderRadius: '4px',
        overflow: 'auto'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ 
              background: '#f8f9fa', 
              color: '#333', 
              textAlign: 'left'
            }}>
              <th style={{ padding: '12px', fontWeight: '600', fontSize: '13px' }}>Company</th>
              <th style={{ padding: '12px', fontWeight: '600', fontSize: '13px' }}>Contact</th>
              <th style={{ padding: '12px', fontWeight: '600', fontSize: '13px' }}>Username</th>
              <th style={{ padding: '12px', fontWeight: '600', fontSize: '13px' }}>Category</th>
              <th style={{ padding: '12px', fontWeight: '600', fontSize: '13px' }}>Email</th>
              <th style={{ padding: '12px', fontWeight: '600', fontSize: '13px' }}>Phone</th>
              <th style={{ padding: '12px', fontWeight: '600', fontSize: '13px' }}>Status</th>
              <th style={{ padding: '12px', width: 200, fontWeight: '600', fontSize: '13px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '24px 16px', textAlign: 'center', color: '#718096' }}>No suppliers found</td></tr>
            ) : pageData.map((s) => (
              <tr 
                key={s._id} 
                style={{ 
                  borderBottom: '1px solid #f1f5f9',
                  transition: 'background-color 0.2s ease',
                  ':hover': {
                    backgroundColor: '#f8fafc'
                  }
                }}
              >
                <td style={{ padding: '12px', color: '#333' }}>
                  {editingId === s._id ? (
                    <div>
                      <input 
                        value={edit.name} 
                        onChange={(e)=>setEdit({...edit, name: e.target.value})} 
                        style={{ 
                          padding: '8px 12px', 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '6px', 
                          width: '100%',
                          fontSize: '14px',
                          transition: 'all 0.2s ease',
                          ':focus': {
                            outline: 'none',
                            borderColor: '#3b82f6',
                            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                          }
                        }} 
                      />
                      {editErrors.name && (
                        <div style={{ color: '#e53e3e', fontSize: '12px', marginTop: '4px' }}>
                          {editErrors.name}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: '#2d3748', fontWeight: '500' }}>{s.name || s.companyName}</span>
                  )}
                </td>
                <td style={{ padding: '12px', color: '#555' }}>
                  {editingId === s._id ? (
                    <input 
                      value={edit.contactPerson} 
                      onChange={(e)=>setEdit({...edit, contactPerson: e.target.value})} 
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        width: '100%',
                        fontSize: '14px',
                        transition: 'all 0.2s ease',
                        ':focus': {
                          outline: 'none',
                          borderColor: '#3b82f6',
                          boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                        }
                      }} 
                    />
                  ) : (
                    <span style={{ color: '#4a5568' }}>{s.contactPerson || '-'}</span>
                  )}
                </td>
                <td style={{ padding: '16px', color: '#4a5568', fontFamily: 'monospace' }}>
                  {s.user?.username || s.username || '-'}
                </td>
                <td style={{ padding: '12px' }}>
                  {editingId === s._id ? (
                    <select 
                      value={edit.category} 
                      onChange={(e)=>setEdit({...edit, category: e.target.value})} 
                      style={{ 
                        padding: '8px 12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        width: '100%',
                        background: '#fff',
                        fontSize: '14px',
                        color: '#4a5568',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        ':focus': {
                          outline: 'none',
                          borderColor: '#3b82f6',
                          boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                        }
                      }}
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => (
                        <option key={c._id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span style={{ 
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: '#e8f5e9',
                      color: '#2e7d32',
                      fontSize: '12px'
                    }}>
                      {s.category || '-'}
                    </span>
                  )}
                </td>
                <td style={{ padding: '12px' }}>
                  {editingId === s._id ? (
                    <div>
                      <input 
                        type="email" 
                        value={edit.email} 
                        onChange={(e)=>setEdit({...edit, email: e.target.value})} 
                        style={{ 
                          padding: '8px 12px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          width: '100%',
                          fontSize: '14px',
                          transition: 'all 0.2s ease',
                          ':focus': {
                            outline: 'none',
                            borderColor: '#3b82f6',
                            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                          }
                        }} 
                      />
                      {editErrors.email && (
                        <div style={{ color: '#e53e3e', fontSize: '12px', marginTop: '4px' }}>
                          {editErrors.email}
                        </div>
                      )}
                    </div>
                  ) : (
                    <a 
                      href={`mailto:${s.email}`} 
                      style={{ 
                        color: '#3b82f6',
                        textDecoration: 'none',
                        ':hover': {
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      {s.email}
                    </a>
                  )}
                </td>
                <td style={{ padding: '12px' }}>
                  {editingId === s._id ? (
                    <div>
                      <input 
                        value={edit.phone} 
                        onChange={(e)=>setEdit({...edit, phone: e.target.value})} 
                        style={{ 
                          padding: '8px 12px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          width: '100%',
                          fontSize: '14px',
                          transition: 'all 0.2s ease',
                          ':focus': {
                            outline: 'none',
                            borderColor: '#3b82f6',
                            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                          }
                        }} 
                      />
                      {editErrors.phone && (
                        <div style={{ color: '#e53e3e', fontSize: '12px', marginTop: '4px' }}>
                          {editErrors.phone}
                        </div>
                      )}
                    </div>
                  ) : (
                    <a 
                      href={`tel:${s.phone}`}
                      style={{ 
                        color: '#4a5568',
                        textDecoration: 'none',
                        ':hover': {
                          color: '#3b82f6',
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      {s.phone}
                    </a>
                  )}
                </td>
                <td style={{ padding: '12px' }}>
                  {editingId === s._id ? (
                    <select 
                      value={edit.status} 
                      onChange={(e)=>setEdit({...edit, status: e.target.value})} 
                      style={{ 
                        padding: '8px 12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        ':focus': {
                          outline: 'none',
                          borderColor: '#3b82f6',
                          boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                        }
                      }}
                    >
                      <option value="Active">Active</option>
                      <option value="Pending">Pending</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  ) : (
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      background: (s.status || 'Active') === 'Active' ? '#e8f5e9' : 
                                (s.status === 'Pending' ? '#fff3e0' : '#ffebee'),
                      color: (s.status || 'Active') === 'Active' ? '#2e7d32' : 
                            (s.status === 'Pending' ? '#e65100' : '#c62828')
                    }}>
                      {s.status || 'Active'}
                    </span>
                  )}
                </td>
                <td style={{ padding: '12px' }}>
                  {editingId === s._id ? (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button 
                        type="button" 
                        disabled={workingId === s._id} 
                        onClick={() => saveEdit(s._id)} 
                        style={{ 
                          background: '#2e7d32', 
                          color: '#fff', 
                          border: 'none', 
                          padding: '6px 12px', 
                          borderRadius: '4px', 
                          cursor: 'pointer',
                          fontSize: '13px',
                          marginRight: '5px',
                          ':hover': {
                            background: '#218838'
                          },
                          ':disabled': {
                            opacity: '0.6',
                            cursor: 'not-allowed'
                          }
                        }}
                      >
                        Save
                      </button>
                      <button 
                        type="button" 
                        onClick={cancelEdit} 
                        style={{ 
                          background: '#fff', 
                          border: '1px solid #ddd', 
                          padding: '6px 12px', 
                          borderRadius: '4px', 
                          cursor: 'pointer',
                          fontSize: '13px',
                          color: '#333',
                          ':hover': {
                            background: '#f8f9fa'
                          }
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button 
                        type="button" 
                        onClick={() => startEdit(s)} 
                        style={{ 
                          background: '#2e7d32', 
                          color: '#fff', 
                          border: 'none', 
                          padding: '6px 12px', 
                          borderRadius: '4px', 
                          cursor: 'pointer',
                          fontSize: '13px',
                          marginRight: '5px',
                          ':hover': {
                            background: '#218838'
                          }
                        }}
                      >
                        Edit
                      </button>
                      <button 
                        type="button" 
                        disabled={workingId === s._id} 
                        onClick={() => openConfirmDelete(s._id, s.name || s.companyName || 'this supplier')} 
                        style={{ 
                          background: '#fff', 
                          color: '#dc3545', 
                          border: '1px solid #dc3545', 
                          padding: '6px 12px', 
                          borderRadius: '4px', 
                          cursor: 'pointer',
                          fontSize: '13px',
                          ':hover': {
                            background: '#f8f9fa'
                          },
                          ':disabled': {
                            opacity: '0.6',
                            cursor: 'not-allowed'
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div style={{ 
        marginTop: '15px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '10px',
        background: '#fff',
        border: '1px solid #ddd',
        borderRadius: '4px'
      }}>
        <div style={{ color: '#555', fontSize: '13px' }}>
          Page {page} of {totalPages} • {filtered.length} total
        </div>
        <div style={{ display: 'flex', gap: '5px' }}>
          <button 
            type="button" 
            disabled={page <= 1} 
            onClick={() => setPage(p => Math.max(1, p - 1))} 
            style={{ 
              background: page <= 1 ? '#f8f9fa' : '#fff', 
              border: '1px solid #ddd', 
              padding: '5px 10px', 
              borderRadius: '4px', 
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
              color: page <= 1 ? '#aaa' : '#333',
              fontSize: '13px',
              ':hover:not(:disabled)': {
                background: '#f8f9fa'
              }
            }}
          >
            Previous
          </button>
          <button 
            type="button" 
            disabled={page >= totalPages} 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
            style={{ 
              background: page >= totalPages ? '#f8f9fa' : '#fff', 
              border: '1px solid #ddd', 
              padding: '5px 10px', 
              borderRadius: '4px', 
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              color: page >= totalPages ? '#aaa' : '#333',
              fontSize: '13px',
              ':hover:not(:disabled)': {
                background: '#f8f9fa'
              }
            }}
          >
            Next
          </button>
        </div>
      </div>
      </div>
    </div>

    {/* Confirm Modal */}
    {confirm.open && (
      <div style={{ 
        position: 'fixed', 
        inset: 0, 
        background: 'rgba(0,0,0,0.5)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 1000,
        backdropFilter: 'blur(4px)'
      }}>
        <div style={{ 
          background: '#fff', 
          borderRadius: '12px', 
          padding: '24px', 
          width: 'min(480px, 92vw)', 
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '16px',
            color: '#ef4444'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h3 style={{ 
              margin: '0 0 0 12px', 
              fontSize: '18px', 
              fontWeight: '600',
              color: '#1a202c'
            }}>
              {confirm.title}
            </h3>
          </div>
          <p style={{ 
            margin: '0 0 24px 0', 
            color: '#4a5568',
            lineHeight: '1.6'
          }}>
            {confirm.message}
          </p>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '12px', 
            marginTop: '24px'
          }}>
            <button 
              type="button" 
              onClick={closeConfirm} 
              style={{ 
                background: '#fff', 
                border: '1px solid #e2e8f0', 
                padding: '8px 16px', 
                borderRadius: '6px', 
                cursor: 'pointer',
                color: '#4a5568',
                fontWeight: '500',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                ':hover': {
                  background: '#f8fafc',
                  borderColor: '#cbd5e0',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={confirmDelete} 
              style={{ 
                background: '#ef4444', 
                color: '#fff', 
                border: 'none', 
                padding: '8px 16px', 
                borderRadius: '6px', 
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                ':hover': {
                  background: '#dc2626',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
