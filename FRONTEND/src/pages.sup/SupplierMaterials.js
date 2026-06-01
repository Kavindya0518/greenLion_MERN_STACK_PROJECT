// FRONTEND/src/pages.sup/SupplierMaterials.js
import React, { useEffect, useState } from "react";
import http from "../api/http";
import SupplierSidebar from "./SupplierSidebar";
import { jsPDF } from 'jspdf';

export default function SupplierMaterials() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState("");
  
  // View modal
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Reject modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  
  // Accept confirmation
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

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
      
      setOrders(ordersArr);
      setCategories(categoriesArr);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load supplier orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const formatMoney = (n) => {
    if (n === null || n === undefined || n === '' || n === 'N/A') return '-';
    const num = Number(n);
    return isNaN(num) || num === 0 
      ? "-" 
      : new Intl.NumberFormat("en-LK", {
          style: "currency",
          currency: "LKR",
          maximumFractionDigits: 0,
        }).format(num);
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setViewModalOpen(true);
  };

  const handleAcceptClick = (order) => {
    setSelectedOrder(order);
    setAcceptModalOpen(true);
  };

  const handleRejectClick = (order) => {
    setSelectedOrder(order);
    setRejectionReason("");
    setRejectModalOpen(true);
  };

  const handleAcceptOrder = async () => {
    if (!selectedOrder) return;
    
    try {
      setActionLoading(true);
      setActionError("");
      
      await http.patch(`/api/suppliers/orders/${selectedOrder._id}/status`, {
        status: "confirmed"
      });
      
      alert("Order accepted successfully!");
      setAcceptModalOpen(false);
      setViewModalOpen(false);
      load(); // Reload orders
    } catch (e) {
      setActionError(e?.response?.data?.message || "Failed to accept order");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectOrder = async () => {
    if (!selectedOrder) return;
    
    try {
      setActionLoading(true);
      setActionError("");
      
      await http.patch(`/api/suppliers/orders/${selectedOrder._id}/status`, {
        status: "rejected",
        rejectionReason: rejectionReason.trim()
      });
      
      alert("Order rejected successfully!");
      setRejectModalOpen(false);
      setViewModalOpen(false);
      load(); // Reload orders
    } catch (e) {
      setActionError(e?.response?.data?.message || "Failed to reject order");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter orders by search query (Order ID, Supplier Name, Category)
  const filteredOrders = orders.filter((order) => {
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
      new: { bg: "rgba(59,130,246,0.12)", color: "#3B82F6", text: "Pending / New" },
      confirmed: { bg: "rgba(16,185,129,0.12)", color: "#10B981", text: "Accepted" },
      rejected: { bg: "rgba(239,68,68,0.12)", color: "#EF4444", text: "Rejected" },
      completed: { bg: "rgba(107,114,128,0.12)", color: "#6B7280", text: "Completed" },
    };
    
    const style = styles[status] || styles.new;
    
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

  // Export to PDF function
  const exportToPDF = async () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    const title = 'SUPPLIER ORDERS REPORT';
    const companyName = 'GREEN LION COMPANY';
    
    // Set document properties
    doc.setProperties({
      title: `${companyName} - ${title}`,
      subject: 'Supplier Orders Report',
      author: 'Green Lion',
      keywords: 'supplier orders, report, green lion',
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
        quantity: formatQuantity(order.quantity || order.amount || order.qty),
        unitPrice: formatMoney(order.unitPrice || order.price || order.unitCost),
        totalAmount: formatMoney(order.totalAmount || order.total || order.amount),
        status: order.status || 'N/A',
        date: formatDate(order.createdAt || order.date || order.orderDate)
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
          
          // Add logo to new page header
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
            doc.setTextColor(value.toLowerCase() === 'confirmed' ? 46 : 
                            value.toLowerCase() === 'new' ? 59 : 200, 
                            value.toLowerCase() === 'confirmed' ? 125 : 
                            value.toLowerCase() === 'new' ? 130 : 50, 
                            value.toLowerCase() === 'confirmed' ? 50 : 
                            value.toLowerCase() === 'new' ? 246 : 50);
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
    doc.save('supplier-orders-report.pdf');
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      <SupplierSidebar />
      
      <div style={{ flex: 1, padding: "24px" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "700", color: "#0f172a" }}>
              Supplier Orders
            </h1>
            <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: "14px" }}>
              Review and manage orders submitted by suppliers
            </p>
          </div>
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
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "400px", maxWidth: "50%" }}>
              <input
                type="text"
                placeholder="Search by Order ID, Supplier, or Category..."
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
            <div style={{ 
              fontSize: "13px", 
              color: "#64748b",
              whiteSpace: "nowrap"
            }}>
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
              Loading orders...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>📦</div>
              <div style={{ fontSize: "16px", fontWeight: "500", marginBottom: "4px" }}>
                No orders found
              </div>
              <div style={{ fontSize: "14px" }}>
                {orders.length === 0 ? "No supplier orders yet" : "No orders match your search"}
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
                            View
                          </button>
                          {order.status === "new" && (
                            <>
                              <button
                                onClick={() => handleAcceptClick(order)}
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
                                Accept
                              </button>
                              <button
                                onClick={() => handleRejectClick(order)}
                                style={{
                                  padding: "6px 12px",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                  color: "#fff",
                                  background: "#EF4444",
                                  border: "none",
                                  borderRadius: "6px",
                                  cursor: "pointer"
                                }}
                              >
                                Reject
                              </button>
                            </>
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
              maxWidth: "600px",
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
                    <span style={{ fontSize: "14px", color: "#64748b" }}>Status:</span>
                    {getStatusBadge(selectedOrder.status)}
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
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "14px", color: "#64748b" }}>Address:</span>
                      <span style={{ fontSize: "14px", fontWeight: "500", textAlign: "right", maxWidth: "60%" }}>
                        {selectedOrder.supplier?.address || "-"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "14px", color: "#64748b" }}>Category:</span>
                      <span style={{ fontSize: "14px", fontWeight: "500" }}>
                        {selectedOrder.supplier?.category || "-"}
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
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "14px", color: "#64748b" }}>Date Submitted:</span>
                      <span style={{ fontSize: "14px", fontWeight: "500" }}>
                        {formatDate(selectedOrder.submissionDate || selectedOrder.createdAt)}
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

                {/* Rejection Reason */}
                {selectedOrder.status === "rejected" && selectedOrder.rejectionReason && (
                  <div style={{
                    background: "#fee2e2",
                    padding: "16px",
                    borderRadius: "8px",
                    marginBottom: "20px",
                    border: "1px solid #fecaca"
                  }}>
                    <h3 style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: "600", color: "#991b1b" }}>
                      Rejection Reason
                    </h3>
                    <p style={{ margin: 0, fontSize: "14px", color: "#991b1b", lineHeight: "1.6" }}>
                      {selectedOrder.rejectionReason}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                {selectedOrder.status === "new" && (
                  <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                    <button
                      onClick={() => handleAcceptClick(selectedOrder)}
                      style={{
                        flex: 1,
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
                      ✓ Accept Order
                    </button>
                    <button
                      onClick={() => handleRejectClick(selectedOrder)}
                      style={{
                        flex: 1,
                        padding: "12px",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#fff",
                        background: "#EF4444",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer"
                      }}
                    >
                      ✕ Reject Order
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Accept Confirmation Modal */}
        {acceptModalOpen && selectedOrder && (
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
            zIndex: 1001,
            padding: "20px"
          }}>
            <div style={{
              background: "#fff",
              borderRadius: "12px",
              maxWidth: "400px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)"
            }}>
              <h3 style={{ margin: "0 0 12px", fontSize: "18px", fontWeight: "600" }}>
                Accept Order?
              </h3>
              <p style={{ margin: "0 0 20px", fontSize: "14px", color: "#64748b" }}>
                Are you sure you want to accept this order from <strong>{selectedOrder.supplier?.name}</strong>?
              </p>
              
              {actionError && (
                <div style={{
                  padding: "12px",
                  background: "#fee2e2",
                  color: "#991b1b",
                  borderRadius: "6px",
                  marginBottom: "16px",
                  fontSize: "13px"
                }}>
                  {actionError}
                </div>
              )}
              
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => setAcceptModalOpen(false)}
                  disabled={actionLoading}
                  style={{
                    flex: 1,
                    padding: "10px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#64748b",
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    cursor: actionLoading ? "not-allowed" : "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAcceptOrder}
                  disabled={actionLoading}
                  style={{
                    flex: 1,
                    padding: "10px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#fff",
                    background: actionLoading ? "#9ca3af" : "#10B981",
                    border: "none",
                    borderRadius: "6px",
                    cursor: actionLoading ? "not-allowed" : "pointer"
                  }}
                >
                  {actionLoading ? "Accepting..." : "Yes, Accept"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {rejectModalOpen && selectedOrder && (
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
            zIndex: 1001,
            padding: "20px"
          }}>
            <div style={{
              background: "#fff",
              borderRadius: "12px",
              maxWidth: "400px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)"
            }}>
              <h3 style={{ margin: "0 0 12px", fontSize: "18px", fontWeight: "600" }}>
                Reject Order?
              </h3>
              <p style={{ margin: "0 0 16px", fontSize: "14px", color: "#64748b" }}>
                Are you sure you want to reject this order from <strong>{selectedOrder.supplier?.name}</strong>?
              </p>
              
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500" }}>
                  Reason for rejection (optional):
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Price too high, Low demand, etc."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "14px",
                    outline: "none",
                    resize: "vertical"
                  }}
                />
              </div>
              
              {actionError && (
                <div style={{
                  padding: "12px",
                  background: "#fee2e2",
                  color: "#991b1b",
                  borderRadius: "6px",
                  marginBottom: "16px",
                  fontSize: "13px"
                }}>
                  {actionError}
                </div>
              )}
              
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => setRejectModalOpen(false)}
                  disabled={actionLoading}
                  style={{
                    flex: 1,
                    padding: "10px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#64748b",
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    cursor: actionLoading ? "not-allowed" : "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectOrder}
                  disabled={actionLoading}
                  style={{
                    flex: 1,
                    padding: "10px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#fff",
                    background: actionLoading ? "#9ca3af" : "#EF4444",
                    border: "none",
                    borderRadius: "6px",
                    cursor: actionLoading ? "not-allowed" : "pointer"
                  }}
                >
                  {actionLoading ? "Rejecting..." : "Yes, Reject"}
                </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
