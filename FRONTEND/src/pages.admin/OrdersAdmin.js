import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";
import http from "../api/http";

export default function OrdersAdmin() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [stats, setStats] = useState({});

  // Fetch orders and stats
  useEffect(() => {
    fetchOrders();
    fetchOrderStats();
  }, [selectedStatus, searchTerm]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      if (searchTerm) params.append("search", searchTerm);
      
      const response = await http.get(`/api/orders/admin/all?${params.toString()}`);
      if (response.data.success) {
        setOrders(response.data.orders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderStats = async () => {
    try {
      const response = await http.get("/api/orders/admin/stats");
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const updateOrderStatus = async (orderId, newStatus, note = "") => {
    try {
      setUpdatingStatus(true);
      const response = await http.put(`/api/orders/admin/${orderId}/status`, {
        status: newStatus,
        note: note
      });
      
      if (response.data.success) {
        await fetchOrders();
        await fetchOrderStats();
        setSelectedOrder(response.data.order);
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      setError("Failed to update order status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const assignDeliveryCompany = async (orderId, companyName, trackingNumber = "") => {
    try {
      const response = await http.put(`/api/orders/admin/${orderId}/delivery`, {
        companyName: companyName,
        trackingNumber: trackingNumber
      });
      
      if (response.data.success) {
        await fetchOrders();
        setSelectedOrder(response.data.order);
      }
    } catch (error) {
      console.error("Error assigning delivery company:", error);
      setError("Failed to assign delivery company");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "#f59e0b",
      confirmed: "#3b82f6", 
      packed: "#8b5cf6",
      handed_over: "#06b6d4",
      delivered: "#10b981",
      cancelled: "#ef4444"
    };
    return colors[status] || "#6b7280";
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: "Pending",
      confirmed: "Confirmed",
      packed: "Packed",
      handed_over: "Handed Over",
      delivered: "Delivered", 
      cancelled: "Cancelled"
    };
    return labels[status] || status;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <AdminSidebar />
      
      <div style={{ flex: 1, padding: "24px" }}>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "#1e293b", margin: "0 0 8px 0" }}>
            Order Management
          </h1>
          <p style={{ color: "#64748b", fontSize: "16px", margin: 0 }}>
            Track orders, manage fulfillment, and monitor customer satisfaction
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "32px" }}>
          {stats.statusBreakdown?.map((item) => (
            <div key={item._id} style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              border: "1px solid #e2e8f0"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ margin: "0 0 4px 0", fontSize: "14px", color: "#64748b", textTransform: "capitalize" }}>
                    {getStatusLabel(item._id)}
                  </p>
                  <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold", color: "#1e293b" }}>
                    {item.count}
                  </p>
                </div>
                <div style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: getStatusColor(item._id)
                }}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ 
          backgroundColor: "white", 
          padding: "20px", 
          borderRadius: "12px", 
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          border: "1px solid #e2e8f0",
          marginBottom: "24px"
        }}>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                backgroundColor: "white",
                fontSize: "14px"
              }}
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="packed">Packed</option>
              <option value="handed_over">Handed Over</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <input
              type="text"
              placeholder="Search by order number or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #d1d5db", 
                borderRadius: "8px",
                fontSize: "14px",
                minWidth: "250px"
              }}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca", 
            color: "#dc2626",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "20px"
          }}>
            {error}
          </div>
        )}

        {/* Orders Table */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)", 
          border: "1px solid #e2e8f0",
          overflow: "hidden"
        }}>
          {loading ? (
            <div style={{ padding: "60px", textAlign: "center" }}>
              <div style={{ fontSize: "32px", marginBottom: "16px" }}>⏳</div>
              <p style={{ color: "#64748b" }}>Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div style={{ padding: "60px", textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📦</div>
              <h3 style={{ margin: "0 0 8px 0", color: "#1e293b" }}>No Orders Found</h3>
              <p style={{ color: "#64748b", margin: 0 }}>No orders match your current filters.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8fafc" }}>
                    <th style={{ padding: "16px", textAlign: "left", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e2e8f0" }}>
                      Order #
                    </th>
                    <th style={{ padding: "16px", textAlign: "left", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e2e8f0" }}>
                      Customer
                    </th>
                    <th style={{ padding: "16px", textAlign: "left", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e2e8f0" }}>
                      Items
                    </th>
                    <th style={{ padding: "16px", textAlign: "left", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e2e8f0" }}>
                      Total
                    </th>
                    <th style={{ padding: "16px", textAlign: "left", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e2e8f0" }}>
                      Status
                    </th>
                    <th style={{ padding: "16px", textAlign: "left", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e2e8f0" }}>
                      Date
                    </th>
                    <th style={{ padding: "16px", textAlign: "left", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e2e8f0" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "16px", color: "#1e293b", fontWeight: "500" }}>
                        {order.orderNumber}
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div>
                          <div style={{ fontWeight: "500", color: "#1e293b" }}>
                            {order.customerId?.name}
                          </div>
                          <div style={{ fontSize: "14px", color: "#64748b" }}>
                            {order.customerId?.email}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px", color: "#64748b" }}>
                        {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                      </td>
                      <td style={{ padding: "16px", color: "#1e293b", fontWeight: "500" }}>
                        LKR {order.totalAmount?.toLocaleString()}
                      </td>
                      <td style={{ padding: "16px" }}>
                        <span style={{
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "500",
                          backgroundColor: `${getStatusColor(order.status)}20`,
                          color: getStatusColor(order.status)
                        }}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td style={{ padding: "16px", color: "#64748b", fontSize: "14px" }}>
                        {formatDate(order.createdAt)}
                      </td>
                      <td style={{ padding: "16px" }}>
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderModal(true);
                          }}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: "#3b82f6",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "12px",
                            cursor: "pointer"
                          }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order Details Modal */}
        {showOrderModal && selectedOrder && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}>
            <div style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "800px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto"
            }}>
              {/* Modal Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h2 style={{ margin: 0, color: "#1e293b" }}>Order Details - {selectedOrder.orderNumber}</h2>
                <button
                  onClick={() => setShowOrderModal(false)}
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

              {/* Customer Info */}
              <div style={{ marginBottom: "24px", padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                <h3 style={{ margin: "0 0 12px 0", color: "#1e293b" }}>Customer Information</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <strong>Name:</strong> {selectedOrder.customerId?.name}
                  </div>
                  <div>
                    <strong>Email:</strong> {selectedOrder.customerId?.email}
                  </div>
                  <div>
                    <strong>Phone:</strong> {selectedOrder.customerId?.phoneNumber || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div style={{ marginBottom: "24px", padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                <h3 style={{ margin: "0 0 12px 0", color: "#1e293b" }}>Delivery Address</h3>
                <div>
                  <strong>{selectedOrder.deliveryAddress?.fullName}</strong><br/>
                  {selectedOrder.deliveryAddress?.address}<br/>
                  {selectedOrder.deliveryAddress?.city}, {selectedOrder.deliveryAddress?.postalCode}<br/>
                  <strong>Phone:</strong> {selectedOrder.deliveryAddress?.phoneNumber}
                </div>
              </div>

              {/* Order Items */}
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ margin: "0 0 12px 0", color: "#1e293b" }}>Order Items</h3>
                {selectedOrder.items?.map((item, index) => (
                  <div key={index} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px",
                    backgroundColor: "#f8fafc",
                    borderRadius: "8px",
                    marginBottom: "8px"
                  }}>
                    <div>
                      <strong>{item.productName}</strong><br/>
                      <span style={{ color: "#64748b" }}>Quantity: {item.quantity}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div>LKR {item.unitPrice?.toLocaleString()}</div>
                      <div style={{ color: "#64748b", fontSize: "14px" }}>
                        Total: LKR {item.totalPrice?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{ 
                  textAlign: "right", 
                  marginTop: "12px", 
                  padding: "12px", 
                  backgroundColor: "#1e293b", 
                  color: "white", 
                  borderRadius: "8px",
                  fontSize: "18px",
                  fontWeight: "bold"
                }}>
                  Total: LKR {selectedOrder.totalAmount?.toLocaleString()}
                </div>
              </div>

              {/* Status Management */}
              <div style={{ marginBottom: "24px", padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                <h3 style={{ margin: "0 0 12px 0", color: "#1e293b" }}>Status Management</h3>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                  {['confirmed', 'packed', 'handed_over', 'delivered'].map((status) => (
                    <button
                      key={status}
                      onClick={() => updateOrderStatus(selectedOrder._id, status)}
                      disabled={updatingStatus || selectedOrder.status === status}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: selectedOrder.status === status ? getStatusColor(status) : "#e2e8f0",
                        color: selectedOrder.status === status ? "white" : "#374151",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "12px",
                        cursor: updatingStatus ? "not-allowed" : "pointer",
                        opacity: updatingStatus ? 0.6 : 1
                      }}
                    >
                      {getStatusLabel(status)}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: "14px", color: "#64748b" }}>
                  Current Status: <strong style={{ color: getStatusColor(selectedOrder.status) }}>
                    {getStatusLabel(selectedOrder.status)}
                  </strong>
                </div>
              </div>

              {/* Delivery Company Assignment */}
              {(selectedOrder.status === 'packed' || selectedOrder.deliveryCompany?.companyName) && (
                <div style={{ marginBottom: "24px", padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                  <h3 style={{ margin: "0 0 12px 0", color: "#1e293b" }}>Delivery Assignment</h3>
                  {selectedOrder.deliveryCompany?.companyName ? (
                    <div>
                      <div><strong>Company:</strong> {selectedOrder.deliveryCompany.companyName}</div>
                      {selectedOrder.deliveryCompany.trackingNumber && (
                        <div><strong>Tracking:</strong> {selectedOrder.deliveryCompany.trackingNumber}</div>
                      )}
                      <div style={{ fontSize: "14px", color: "#64748b", marginTop: "8px" }}>
                        Assigned: {formatDate(selectedOrder.deliveryCompany.assignedAt)}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {['DHL Express', 'Ceylon Post', 'Kapruka Delivery', 'Pickme Delivery'].map((company) => (
                        <button
                          key={company}
                          onClick={() => assignDeliveryCompany(selectedOrder._id, company)}
                          style={{
                            padding: "8px 16px",
                            backgroundColor: "#10b981",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "14px",
                            cursor: "pointer"
                          }}
                        >
                          Assign to {company}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Status History */}
              {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                <div style={{ padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                  <h3 style={{ margin: "0 0 12px 0", color: "#1e293b" }}>Status History</h3>
                  {selectedOrder.statusHistory.map((history, index) => (
                    <div key={index} style={{
                      padding: "8px 0",
                      borderBottom: index < selectedOrder.statusHistory.length - 1 ? "1px solid #e2e8f0" : "none"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          backgroundColor: `${getStatusColor(history.status)}20`,
                          color: getStatusColor(history.status)
                        }}>
                          {getStatusLabel(history.status)}
                        </span>
                        <span style={{ fontSize: "14px", color: "#64748b" }}>
                          {formatDate(history.updatedAt)}
                        </span>
                      </div>
                      {history.note && (
                        <div style={{ fontSize: "14px", color: "#64748b", marginTop: "4px" }}>
                          {history.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
