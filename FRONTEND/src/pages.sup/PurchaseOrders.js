// FRONTEND/src/pages.sup/PurchaseOrders.js
import React, { useEffect, useState } from "react";
import http from "../api/http";
import SupplierSidebar from "./SupplierSidebar";
import { jsPDF } from 'jspdf';

export default function PurchaseOrders() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  
  // View modal
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      
      const [ordersRes, categoriesRes] = await Promise.all([
        http.get("/api/suppliers/orders"),
        http.get("/api/material-categories")
      ]);
      
      const ordersArr = ordersRes.data?.orders || [];
      const categoriesArr = categoriesRes.data?.categories || [];
      
      // Filter to show only accepted orders (not new or rejected)
      const acceptedOrders = ordersArr.filter(o => 
        ['confirmed', 'supplier_accepted', 'delivered', 'completed'].includes(o.status)
      );
      
      setOrders(acceptedOrders);
      setCategories(categoriesArr);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load accepted orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const formatMoney = (n) =>
    isNaN(Number(n))
      ? "-"
      : new Intl.NumberFormat("en-LK", {
          style: "currency",
          currency: "LKR",
          maximumFractionDigits: 0,
        }).format(Number(n));

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setViewModalOpen(true);
  };

  const handleMarkConfirmed = async (order) => {
    if (!window.confirm(`Confirm delivery of Order ${order.orderId || order._id}?\n\nThis will mark the order as "Confirmed" and complete the order process.`)) return;
    
    try {
      const response = await http.patch(`/api/suppliers/orders/${order._id}/status`, {
        status: "completed"
      });
      
      if (response.data?.ok) {
        alert(`✅ Order ${order.orderId || order._id} confirmed successfully!\n\nThe order is now marked as "Confirmed" and the process is complete.`);
        load(); // Reload orders
      }
    } catch (e) {
      alert("❌ " + (e?.response?.data?.message || "Failed to confirm order"));
    }
  };

  // Filter orders by search query and category
  const filteredOrders = orders.filter((order) => {
    // Category filter
    if (categoryFilter && order.category !== categoryFilter) return false;
    
    // Search query filter
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const orderId = (order.orderId || '').toLowerCase();
    const supplierName = (order.supplier?.name || '').toLowerCase();
    const category = (order.category || '').toLowerCase();
    
    return orderId.includes(query) || 
           supplierName.includes(query) || 
           category.includes(query);
  });

  const getStatusBadge = (status) => {
    const styles = {
      confirmed: { bg: 'rgba(59,130,246,0.12)', color: '#3B82F6', text: 'Accepted' },
      supplier_accepted: { bg: 'rgba(20,184,166,0.12)', color: '#14B8A6', text: 'Supplier Accepted' },
      delivered: { bg: 'rgba(249,115,22,0.12)', color: '#F97316', text: 'Delivered' },
      completed: { bg: 'rgba(16,185,129,0.12)', color: '#10B981', text: 'Confirmed' },
    };
    
    const style = styles[status] || { bg: 'rgba(107,114,128,0.12)', color: '#6B7280', text: 'Waiting for Supplier' };
    
    return (
      <span style={{
        display: "inline-block",
        padding: "4px 8px",
        borderRadius: "4px",
        fontSize: "12px",
        fontWeight: "600",
        background: style.bg,
        color: style.color,
      }}>
        {style.text}
      </span>
    );
  };

  const getCategoryMeasurement = (categoryName) => {
    const category = categories.find(c => c.name === categoryName);
    return category?.measurementType || "-";
  };

  const getTimeline = (order) => {
    const timeline = [];
    
    timeline.push({
      label: "Order Placed",
      date: order.submissionDate || order.createdAt,
      status: "completed"
    });
    
    timeline.push({
      label: "Accepted by Admin",
      date: order.updatedAt,
      status: order.status === 'confirmed' || order.status === 'supplier_accepted' || order.status === 'delivered' || order.status === 'completed' ? "completed" : "pending"
    });
    
    timeline.push({
      label: "Supplier Accepted",
      date: order.supplierAcceptedAt,
      status: order.status === 'supplier_accepted' || order.status === 'delivered' || order.status === 'completed' ? "completed" : "pending"
    });
    
    timeline.push({
      label: "Delivered",
      date: order.deliveredAt,
      status: order.status === 'delivered' || order.status === 'completed' ? "completed" : "pending"
    });
    
    timeline.push({
      label: "Confirmed by Admin",
      date: order.status === 'completed' ? order.updatedAt : null,
      status: order.status === 'completed' ? "completed" : "pending"
    });
    
    return timeline;
  };

  // Export to PDF function
  const exportToPDF = async () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    const title = 'PURCHASE ORDERS REPORT';
    const companyName = 'GREEN LION COMPANY';
    
    // Set document properties
    doc.setProperties({
      title: `${companyName} - ${title}`,
      subject: 'Purchase Orders Report',
      author: 'Green Lion',
      keywords: 'purchase orders, report, green lion',
      creator: 'Green Lion System'
    });
    
    // Add header with company name and logo
    doc.setFillColor(46, 125, 50); // Brand green color
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 25, 'F');
    
    // Add company name
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, 15, 15);
    
    // Add report title
    doc.setFontSize(14);
    doc.text(title, 15, 22);
    
    // Add logo to the right corner (async for first page)
    try {
      const logoPath = '/logo.png';
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve) => {
        img.onload = () => {
          try {
            const pageWidth = doc.internal.pageSize.getWidth();
            const logoWidth = 20;
            const logoHeight = 15;
            const logoX = pageWidth - logoWidth - 10;
            const logoY = 5;
            doc.addImage(img, 'PNG', logoX, logoY, logoWidth, logoHeight);
          } catch (error) { 
            console.warn('Could not add logo to PDF:', error); 
          }
          resolve();
        };
        img.onerror = () => resolve();
        img.src = logoPath;
      });
    } catch (error) { 
      console.warn('Logo loading failed:', error); 
    }
    
    // Add generation date
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Generated: ${date}`, 15, 42);
    
    // Prepare data for the table
    const data = filteredOrders.map(order => {
      // Helper function to format quantity
      const formatQuantity = (qty) => {
        if (qty === null || qty === undefined || qty === '') return '-';
        const num = Number(qty);
        return isNaN(num) ? '-' : num.toString();
      };
      
      return {
        orderId: order.orderId || order._id || 'N/A',
        supplier: order.supplier?.name || order.supplierName || 'N/A',
        category: order.category || order.materialCategory || 'N/A',
        quantity: formatQuantity(order.amount || order.quantity || order.qty),
        unitPrice: formatMoney(order.price || order.unitPrice || order.unitCost),
        totalAmount: formatMoney(order.discountedTotal || order.originalTotal || order.total || order.amount),
        status: order.status || 'N/A',
        date: formatDate(order.submissionDate || order.createdAt || order.date)
      };
    });
    
    // Table configuration
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const headerY = 50;
    
    // Column configuration
    const columns = [
      { header: 'ORDER ID', dataKey: 'orderId', width: 25 },
      { header: 'SUPPLIER', dataKey: 'supplier', width: 35 },
      { header: 'CATEGORY', dataKey: 'category', width: 25 },
      { header: 'QTY', dataKey: 'quantity', width: 15 },
      { header: 'UNIT PRICE', dataKey: 'unitPrice', width: 20 },
      { header: 'TOTAL', dataKey: 'totalAmount', width: 20 },
      { header: 'STATUS', dataKey: 'status', width: 20 },
      { header: 'DATE', dataKey: 'date', width: 25 }
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
      doc.rect(margin, y, pageWidth - 2 * margin, rowHeight, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      
      columnPositions.forEach(col => {
        doc.text(col.header, col.x + 2, y + 5);
      });
      
      y += rowHeight;
      
      // Draw data rows
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      data.forEach((row, index) => {
        if (y > pageHeight - 20) {
          doc.addPage();
          // Add header to new page
          doc.setFillColor(46, 125, 50);
          doc.rect(0, 0, pageWidth, 25, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(18);
          doc.setFont('helvetica', 'bold');
          doc.text(companyName, 15, 15);
          doc.setFontSize(14);
          doc.text(title, 15, 22);
          
          // Add logo to new page (synchronous)
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
          
          doc.setFillColor(46, 125, 50);
          doc.rect(margin, 30, pageWidth - 2 * margin, rowHeight, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          
          columnPositions.forEach(col => {
            doc.text(col.header, col.x + 2, 35);
          });
          
          y = 38;
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
        }
        
        // Alternate row colors
        if (index % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, y, pageWidth - 2 * margin, rowHeight, 'F');
        }
        
        columnPositions.forEach(col => {
          const value = row[col.dataKey] || '-';
          doc.text(String(value), col.x + 2, y + 5);
        });
        
        y += rowHeight;
      });
    };
    
    // Draw the table
    drawTable(headerY);
    
    // Add footer
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
      doc.text('Generated by Green Lion System', margin, pageHeight - 10);
    }
    
    // Save the PDF
    doc.save(`purchase-orders-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };


  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      <SupplierSidebar />
      
      <div style={{ flex: 1, padding: "24px" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "700", color: "#0f172a" }}>
              Accepted Orders
            </h1>
            <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: "14px" }}>
              Orders that have been accepted by Admin and are being processed by suppliers
            </p>
          </div>
          <button 
            onClick={() => exportToPDF()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              backgroundColor: "#1E7F3B",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#166534";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#1E7F3B";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
            }}
          >
            <span>Export to PDF</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15V3M12 15L8 11M12 15L16 11M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Status Legend */}
        <div style={{
          background: "#fff",
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "16px",
          border: "1px solid #e5e7eb",
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
          alignItems: "center"
        }}>
          <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Status Legend:</span>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px" }}>
              {getStatusBadge('confirmed')} Accepted by Admin
            </span>
            <span style={{ fontSize: "12px" }}>
              {getStatusBadge('supplier_accepted')} Supplier Accepted
            </span>
            <span style={{ fontSize: "12px" }}>
              {getStatusBadge('delivered')} Delivered
            </span>
            <span style={{ fontSize: "12px" }}>
              {getStatusBadge('completed')} Confirmed
            </span>
          </div>
      </div>

        {/* Error message */}
        {error && (
          <div style={{
            padding: "12px 16px",
            background: "#fee2e2",
            color: "#991b1b",
            borderRadius: "8px",
            marginBottom: "16px",
            border: "1px solid #fecaca"
          }}>
            {error}
          </div>
        )}

        {/* Search */}
        <div style={{
          background: "#fff",
          padding: "16px",
          borderRadius: "8px",
          marginBottom: "16px",
          border: "1px solid #e5e7eb"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ width: "350px", maxWidth: "40%" }}>
              <input
                type="text"
                placeholder="Search by Order ID, Supplier Name, or Category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  fontSize: "14px",
                  outline: "none",
                  transition: "border-color 0.2s ease"
                }}
                onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>
            <div style={{ width: "200px", maxWidth: "25%" }}>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  fontSize: "14px",
                  outline: "none",
                  backgroundColor: "#fff",
                  cursor: "pointer",
                  transition: "border-color 0.2s ease"
                }}
                onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category._id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "500", flex: 1, minWidth: "150px" }}>
              {filteredOrders.length} of {orders.length} orders
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div style={{
          background: "#fff",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          overflow: "hidden"
        }}>
          {loading ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
              Loading accepted orders...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>📦</div>
              <div style={{ fontSize: "16px", fontWeight: "500", marginBottom: "4px" }}>
                No accepted orders found
              </div>
              <div style={{ fontSize: "14px" }}>
                {orders.length === 0 ? "No orders have been accepted yet" : "No orders match your search"}
              </div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
                  <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Order ID</th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Supplier Name</th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Category</th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Quantity</th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Unit</th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Unit Price</th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Offer</th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Total Price</th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Delivery (Days)</th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Status</th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order._id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "12px", fontFamily: "ui-monospace, monospace", fontWeight: "600", fontSize: "13px" }}>
                        {order.orderId || `ORD-${order._id.slice(-6)}`}
                      </td>
                      <td style={{ padding: "12px", fontSize: "14px" }}>
                        {order.supplier?.name || "-"}
                      </td>
                      <td style={{ padding: "12px", fontSize: "14px" }}>
                        {order.category || "-"}
                      </td>
                      <td style={{ padding: "12px", fontSize: "14px" }}>
                        {order.amount || 0}
                      </td>
                      <td style={{ padding: "12px", fontSize: "14px" }}>
                        {getCategoryMeasurement(order.category)}
                      </td>
                      <td style={{ padding: "12px", fontSize: "14px" }}>
                        {formatMoney(order.price)}
                      </td>
                      <td style={{ padding: "12px", fontSize: "14px" }}>
                        {order.offers || "-"}
                      </td>
                      <td style={{ padding: "12px", fontSize: "14px", fontWeight: "600", color: "#1E7F3B" }}>
                        {formatMoney(order.discountedTotal || order.originalTotal)}
                      </td>
                      <td style={{ padding: "12px", fontSize: "14px" }}>
                        {order.deliveryWithinDays ? `${order.deliveryWithinDays} days` : "-"}
                      </td>
                      <td style={{ padding: "12px" }}>
                        {getStatusBadge(order.status)}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <button
                            onClick={() => handleViewOrder(order)}
                            style={{
                              padding: "6px 12px",
                              fontSize: "12px",
                              fontWeight: "500",
                              color: "#3B82F6",
                              background: "#fff",
                              border: "1px solid #3B82F6",
                              borderRadius: "6px",
                              cursor: "pointer"
                            }}
                          >
                            View Details
                          </button>
                          {order.status === "delivered" && (
                            <button
                              onClick={() => handleMarkConfirmed(order)}
                              style={{
                                padding: "6px 12px",
                                fontSize: "12px",
                                fontWeight: "500",
                                color: "#fff",
                                background: "#10B981",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer"
                              }}
                            >
                              ✓ Confirm Delivery
                            </button>
                          )}
                        </div>
                      </td>
                </tr>
              ))}
            </tbody>
          </table>
            </div>
          )}
        </div>

        {/* View Order Modal */}
        {viewModalOpen && selectedOrder && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px"
          }}>
            <div style={{
              background: "#fff",
              borderRadius: "12px",
              maxWidth: "700px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)"
            }}>
              {/* Modal Header */}
              <div style={{
                padding: "20px 24px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "600" }}>
                  Order Details
                </h2>
                <button
                  onClick={() => setViewModalOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "24px",
                    cursor: "pointer",
                    color: "#64748b"
                  }}
                >
                  ×
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: "24px" }}>
                {/* Order ID and Status */}
                <div style={{ marginBottom: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "14px", color: "#64748b" }}>Order ID:</span>
                    <span style={{ fontFamily: "ui-monospace, monospace", fontWeight: "600", fontSize: "16px" }}>
                      {selectedOrder.orderId || `ORD-${selectedOrder._id.slice(-6)}`}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "14px", color: "#64748b" }}>Current Status:</span>
                    {getStatusBadge(selectedOrder.status)}
        </div>
      </div>

                {/* Timeline */}
                <div style={{
                  background: "#f9fafb",
                  padding: "16px",
                  borderRadius: "8px",
                  marginBottom: "20px"
                }}>
                  <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "600" }}>
                    Order Timeline
                  </h3>
                  <div style={{ position: "relative", paddingLeft: "24px" }}>
                    {getTimeline(selectedOrder).map((step, index) => (
                      <div key={index} style={{ position: "relative", paddingBottom: index < 4 ? "20px" : "0" }}>
                        {/* Line */}
                        {index < 4 && (
                          <div style={{
                            position: "absolute",
                            left: "-16px",
                            top: "20px",
                            bottom: "-4px",
                            width: "2px",
                            background: step.status === "completed" ? "#10B981" : "#e5e7eb"
                          }} />
                        )}
                        
                        {/* Dot */}
                        <div style={{
                          position: "absolute",
                          left: "-21px",
                          top: "4px",
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          background: step.status === "completed" ? "#10B981" : "#e5e7eb",
                          border: "2px solid #fff"
                        }} />
                        
                        {/* Content */}
                        <div>
                          <div style={{ 
                            fontSize: "14px", 
                            fontWeight: step.status === "completed" ? "600" : "400",
                            color: step.status === "completed" ? "#0f172a" : "#9ca3af"
                          }}>
                            {step.label}
                          </div>
                          {step.date && (
                            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                              {formatDate(step.date)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Supplier Information */}
                <div style={{
                  background: "#f9fafb",
                  padding: "16px",
                  borderRadius: "8px",
                  marginBottom: "20px"
                }}>
                  <h3 style={{ margin: "0 0 12px", fontSize: "16px", fontWeight: "600" }}>
                    Supplier Information
                  </h3>
                  <div style={{ display: "grid", gap: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "14px", color: "#64748b" }}>Name:</span>
                      <span style={{ fontSize: "14px", fontWeight: "500" }}>
                        {selectedOrder.supplier?.name || "-"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "14px", color: "#64748b" }}>Contact Person:</span>
                      <span style={{ fontSize: "14px", fontWeight: "500" }}>
                        {selectedOrder.supplier?.contactPerson || "-"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "14px", color: "#64748b" }}>Phone:</span>
                      <span style={{ fontSize: "14px", fontWeight: "500" }}>
                        {selectedOrder.supplier?.phone || "-"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "14px", color: "#64748b" }}>Email:</span>
                      <span style={{ fontSize: "14px", fontWeight: "500" }}>
                        {selectedOrder.supplier?.email || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Details */}
                <div style={{
                  background: "#f9fafb",
                  padding: "16px",
                  borderRadius: "8px",
                  marginBottom: "20px"
                }}>
                  <h3 style={{ margin: "0 0 12px", fontSize: "16px", fontWeight: "600" }}>
                    Order Details
                  </h3>
                  <div style={{ display: "grid", gap: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "14px", color: "#64748b" }}>Category:</span>
                      <span style={{ fontSize: "14px", fontWeight: "500" }}>
                        {selectedOrder.category || "-"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "14px", color: "#64748b" }}>Quantity:</span>
                      <span style={{ fontSize: "14px", fontWeight: "500" }}>
                        {selectedOrder.amount || 0}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "14px", color: "#64748b" }}>Measurement Type:</span>
                      <span style={{ fontSize: "14px", fontWeight: "500" }}>
                        {getCategoryMeasurement(selectedOrder.category)}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "14px", color: "#64748b" }}>Unit Price:</span>
                      <span style={{ fontSize: "14px", fontWeight: "500" }}>
                        {formatMoney(selectedOrder.price)}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "14px", color: "#64748b" }}>Offer / Discount:</span>
                      <span style={{ fontSize: "14px", fontWeight: "500" }}>
                        {selectedOrder.offers || "No offer"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid #e5e7eb" }}>
                      <span style={{ fontSize: "14px", color: "#64748b" }}>Original Total:</span>
                      <span style={{ fontSize: "14px", fontWeight: "500" }}>
                        {formatMoney(selectedOrder.originalTotal)}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "16px", fontWeight: "600" }}>Total Price:</span>
                      <span style={{ fontSize: "16px", fontWeight: "700", color: "#1E7F3B" }}>
                        {formatMoney(selectedOrder.discountedTotal || selectedOrder.originalTotal)}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid #e5e7eb" }}>
                      <span style={{ fontSize: "14px", color: "#64748b" }}>Delivery Within:</span>
                      <span style={{ fontSize: "14px", fontWeight: "500" }}>
                        {selectedOrder.deliveryWithinDays ? `${selectedOrder.deliveryWithinDays} days` : "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                {selectedOrder.note && (
                  <div style={{
                    background: "#f9fafb",
                    padding: "16px",
                    borderRadius: "8px",
                    marginBottom: "20px"
                  }}>
                    <h3 style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: "600" }}>
                      Additional Notes
                    </h3>
                    <p style={{ margin: 0, fontSize: "14px", color: "#475569", lineHeight: "1.6" }}>
                      {selectedOrder.note}
                    </p>
                  </div>
                )}

                {/* Action Button */}
                {selectedOrder.status === "delivered" && (
                  <div style={{ marginTop: "24px" }}>
                    <button
                      onClick={() => {
                        setViewModalOpen(false);
                        handleMarkConfirmed(selectedOrder);
                      }}
                      style={{
                        width: "100%",
                        padding: "12px",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#fff",
                        background: "#10B981",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer"
                      }}
                    >
                      ✓ Confirm Delivery
                    </button>
                  </div>
                )}
              </div>
            </div>
      </div>
        )}
      </div>
    </div>
  );
}
