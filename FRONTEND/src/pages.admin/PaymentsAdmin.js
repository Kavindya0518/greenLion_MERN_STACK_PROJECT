import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";
import http from "../api/http";

export default function PaymentsAdmin() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPaymentType, setSelectedPaymentType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBankSlip, setShowBankSlip] = useState(false);
  const [bankSlipImage, setBankSlipImage] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [stats, setStats] = useState({});
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch payments and stats
  useEffect(() => {
    fetchPayments();
    fetchPaymentStats();
  }, [selectedStatus, selectedPaymentType, searchTerm]);

  const fetchPayments = async (retryCount = 0) => {
    try {
      setLoading(true);
      if (retryCount === 0) setError(""); // Only clear errors on first try
      
      const params = new URLSearchParams();
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      if (selectedPaymentType !== "all") params.append("paymentType", selectedPaymentType);
      if (searchTerm && searchTerm.trim()) params.append("search", searchTerm.trim());
      
      const response = await http.get(`/api/payments/admin/all?${params.toString()}`);
      if (response.data.success) {
        setPayments(response.data.payments || []);
      } else {
        throw new Error(response.data.message || "Failed to fetch payments");
      }
    } catch (error) {
      console.error(`Error fetching payments (attempt ${retryCount + 1}):`, error);
      
      // Retry once on failure, but only if it's the first attempt
      if (retryCount === 0 && error.response?.status !== 401) {
        setTimeout(() => fetchPayments(1), 1000);
        return;
      }
      
      // Show error only if not a retry
      if (retryCount === 0) {
        setError(error.response?.data?.message || "Failed to load payments. Please try again.");
      }
      setPayments([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      const response = await http.get("/api/payments/admin/stats");
      if (response.data.success) {
        setStats(response.data.stats || {});
      } else {
        console.warn("Failed to fetch payment stats:", response.data.message);
        setStats({}); // Set empty stats on error
      }
    } catch (error) {
      console.error("Error fetching payment stats:", error);
      setStats({}); // Set empty stats on error
    }
  };

  const approvePayment = async (paymentId) => {
    try {
      setProcessingPayment(true);
      setError(""); // Clear any previous errors
      
      const response = await http.put(`/api/payments/admin/${paymentId}/approve`, {
        adminNote: adminNote.trim()
      });
      
      if (response.data.success) {
        // Update the selected payment immediately
        setSelectedPayment(response.data.payment);
        setAdminNote("");
        
        // Show success message immediately
        setSuccessMessage("Payment approved successfully!");
        setTimeout(() => setSuccessMessage(""), 3000); // Clear after 3 seconds
        
        // Add delay before refreshing to ensure database is updated
        setTimeout(async () => {
          try {
            await Promise.all([fetchPayments(), fetchPaymentStats()]);
          } catch (refreshError) {
            console.warn("Error refreshing data:", refreshError);
            // Don't show error to user for refresh issues
          }
        }, 500); // 500ms delay
        
      } else {
        throw new Error(response.data.message || "Failed to approve payment");
      }
    } catch (error) {
      console.error("Error approving payment:", error);
      setError(error.response?.data?.message || error.message || "Failed to approve payment");
    } finally {
      setProcessingPayment(false);
    }
  };

  const rejectPayment = async (paymentId) => {
    if (!rejectionReason.trim()) {
      setError("Please provide a rejection reason");
      return;
    }

    try {
      setProcessingPayment(true);
      setError(""); // Clear any previous errors
      
      const response = await http.put(`/api/payments/admin/${paymentId}/reject`, {
        rejectionReason: rejectionReason.trim(),
        adminNote: adminNote.trim()
      });
      
      if (response.data.success) {
        // Update the selected payment immediately
        setSelectedPayment(response.data.payment);
        setRejectionReason("");
        setAdminNote("");
        
        // Show success message immediately
        setSuccessMessage("Payment rejected successfully!");
        setTimeout(() => setSuccessMessage(""), 3000); // Clear after 3 seconds
        
        // Add delay before refreshing to ensure database is updated
        setTimeout(async () => {
          try {
            await Promise.all([fetchPayments(), fetchPaymentStats()]);
          } catch (refreshError) {
            console.warn("Error refreshing data:", refreshError);
            // Don't show error to user for refresh issues
          }
        }, 500); // 500ms delay
        
      } else {
        throw new Error(response.data.message || "Failed to reject payment");
      }
    } catch (error) {
      console.error("Error rejecting payment:", error);
      setError(error.response?.data?.message || error.message || "Failed to reject payment");
    } finally {
      setProcessingPayment(false);
    }
  };

  const viewBankSlip = async (paymentId) => {
    try {
      const response = await http.get(`/api/payments/admin/${paymentId}/bank-slip`);
      if (response.data.success) {
        setBankSlipImage(response.data.bankSlipImage);
        setShowBankSlip(true);
      }
    } catch (error) {
      console.error("Error fetching bank slip:", error);
      setError("Failed to load bank slip");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "#f59e0b",
      confirmed: "#10b981", 
      rejected: "#ef4444"
    };
    return colors[status] || "#6b7280";
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: "Pending",
      confirmed: "Confirmed",
      rejected: "Rejected"
    };
    return labels[status] || status;
  };

  const getPaymentTypeLabel = (type) => {
    const labels = {
      online: "Online Payment",
      offline: "Bank Transfer"
    };
    return labels[type] || type;
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
            Payment Management
          </h1>
          <p style={{ color: "#64748b", fontSize: "16px", margin: 0 }}>
            Monitor transactions, approve payments, and track financial performance
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "32px" }}>
          <div style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e2e8f0"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ margin: "0 0 4px 0", fontSize: "14px", color: "#64748b" }}>
                  Total Revenue
                </p>
                <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold", color: "#1e293b" }}>
                  LKR {stats.totalRevenue?.toLocaleString() || '0'}
                </p>
              </div>
              <div style={{ fontSize: "24px" }}>💰</div>
            </div>
          </div>

          <div style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e2e8f0"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ margin: "0 0 4px 0", fontSize: "14px", color: "#64748b" }}>
                  Pending Payments
                </p>
                <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold", color: "#f59e0b" }}>
                  {stats.pendingPayments || 0}
                </p>
              </div>
              <div style={{ fontSize: "24px" }}>⏳</div>
            </div>
          </div>

          <div style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e2e8f0"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ margin: "0 0 4px 0", fontSize: "14px", color: "#64748b" }}>
                  Total Payments
                </p>
                <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold", color: "#1e293b" }}>
                  {stats.totalPayments || 0}
                </p>
              </div>
              <div style={{ fontSize: "24px" }}>📊</div>
            </div>
          </div>
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
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={selectedPaymentType}
              onChange={(e) => setSelectedPaymentType(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                backgroundColor: "white",
                fontSize: "14px"
              }}
            >
              <option value="all">All Types</option>
              <option value="online">Online Payment</option>
              <option value="offline">Bank Transfer</option>
            </select>

            <input
              type="text"
              placeholder="Search by payment number..."
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

        {/* Success Message */}
        {successMessage && (
          <div style={{
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0", 
            color: "#16a34a",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "20px"
          }}>
            ✅ {successMessage}
          </div>
        )}

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
            ❌ {error}
          </div>
        )}

        {/* Payments Table */}
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
              <p style={{ color: "#64748b" }}>Loading payments...</p>
            </div>
          ) : payments.length === 0 ? (
            <div style={{ padding: "60px", textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>💳</div>
              <h3 style={{ margin: "0 0 8px 0", color: "#1e293b" }}>No Payments Found</h3>
              <p style={{ color: "#64748b", margin: 0 }}>No payments match your current filters.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8fafc" }}>
                    <th style={{ padding: "16px", textAlign: "left", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e2e8f0" }}>
                      Payment #
                    </th>
                    <th style={{ padding: "16px", textAlign: "left", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e2e8f0" }}>
                      Order #
                    </th>
                    <th style={{ padding: "16px", textAlign: "left", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e2e8f0" }}>
                      Customer
                    </th>
                    <th style={{ padding: "16px", textAlign: "left", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e2e8f0" }}>
                      Amount
                    </th>
                    <th style={{ padding: "16px", textAlign: "left", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e2e8f0" }}>
                      Type
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
                  {payments.map((payment) => (
                    <tr key={payment._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "16px", color: "#1e293b", fontWeight: "500" }}>
                        {payment.paymentNumber}
                      </td>
                      <td style={{ padding: "16px", color: "#1e293b", fontWeight: "500" }}>
                        {payment.orderId?.orderNumber}
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div>
                          <div style={{ fontWeight: "500", color: "#1e293b" }}>
                            {payment.customerId?.name}
                          </div>
                          <div style={{ fontSize: "14px", color: "#64748b" }}>
                            {payment.customerId?.email}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px", color: "#1e293b", fontWeight: "500" }}>
                        LKR {payment.amount?.toLocaleString()}
                      </td>
                      <td style={{ padding: "16px" }}>
                        <span style={{
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "500",
                          backgroundColor: payment.paymentType === 'online' ? "#dbeafe" : "#f3e8ff",
                          color: payment.paymentType === 'online' ? "#3b82f6" : "#8b5cf6"
                        }}>
                          {getPaymentTypeLabel(payment.paymentType)}
                        </span>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <span style={{
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "500",
                          backgroundColor: `${getStatusColor(payment.status)}20`,
                          color: getStatusColor(payment.status)
                        }}>
                          {getStatusLabel(payment.status)}
                        </span>
                      </td>
                      <td style={{ padding: "16px", color: "#64748b", fontSize: "14px" }}>
                        {formatDate(payment.createdAt)}
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowPaymentModal(true);
                              setError(""); // Clear errors when opening modal
                              setSuccessMessage(""); // Clear success messages
                              setRejectionReason("");
                              setAdminNote("");
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
                            View
                          </button>
                          {payment.paymentType === 'offline' && payment.status === 'pending' && (
                            <button
                              onClick={() => viewBankSlip(payment._id)}
                              style={{
                                padding: "6px 12px",
                                backgroundColor: "#8b5cf6",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "12px",
                                cursor: "pointer"
                              }}
                            >
                              Bank Slip
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

        {/* Payment Details Modal */}
        {showPaymentModal && selectedPayment && (
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
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto"
            }}>
              {/* Modal Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h2 style={{ margin: 0, color: "#1e293b" }}>Payment Details - {selectedPayment.paymentNumber}</h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
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

              {/* Payment Info */}
              <div style={{ marginBottom: "24px", padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                <h3 style={{ margin: "0 0 12px 0", color: "#1e293b" }}>Payment Information</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <strong>Amount:</strong> LKR {selectedPayment.amount?.toLocaleString()}
                  </div>
                  <div>
                    <strong>Type:</strong> {getPaymentTypeLabel(selectedPayment.paymentType)}
                  </div>
                  <div>
                    <strong>Status:</strong> 
                    <span style={{
                      marginLeft: "8px",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      backgroundColor: `${getStatusColor(selectedPayment.status)}20`,
                      color: getStatusColor(selectedPayment.status)
                    }}>
                      {getStatusLabel(selectedPayment.status)}
                    </span>
                  </div>
                  <div>
                    <strong>Date:</strong> {formatDate(selectedPayment.createdAt)}
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div style={{ marginBottom: "24px", padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                <h3 style={{ margin: "0 0 12px 0", color: "#1e293b" }}>Customer Information</h3>
                <div>
                  <strong>{selectedPayment.customerId?.name}</strong><br/>
                  {selectedPayment.customerId?.email}<br/>
                  {selectedPayment.customerId?.phoneNumber && (
                    <>Phone: {selectedPayment.customerId.phoneNumber}</>
                  )}
                </div>
              </div>

              {/* Bank Slip Info (for offline payments) */}
              {selectedPayment.paymentType === 'offline' && (
                <div style={{ marginBottom: "24px", padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                  <h3 style={{ margin: "0 0 12px 0", color: "#1e293b" }}>Bank Transfer Details</h3>
                  {selectedPayment.offlinePayment?.customerNote && (
                    <div style={{ marginBottom: "12px" }}>
                      <strong>Customer Note:</strong><br/>
                      {selectedPayment.offlinePayment.customerNote}
                    </div>
                  )}
                  <button
                    onClick={() => viewBankSlip(selectedPayment._id)}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#8b5cf6",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "14px",
                      cursor: "pointer"
                    }}
                  >
                    View Bank Slip
                  </button>
                </div>
              )}

              {/* Admin Actions (for pending payments) */}
              {selectedPayment.status === 'pending' && (
                <div style={{ padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                  <h3 style={{ margin: "0 0 16px 0", color: "#1e293b" }}>Admin Actions</h3>
                  
                  {/* Admin Note */}
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500" }}>
                      Admin Note (Optional):
                    </label>
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Add any notes about this payment..."
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "14px",
                        resize: "vertical",
                        minHeight: "60px"
                      }}
                    />
                  </div>

                  {/* Rejection Reason (for rejections) */}
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500" }}>
                      Rejection Reason (if rejecting):
                    </label>
                    <input
                      type="text"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Reason for rejection..."
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "14px"
                      }}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button
                      onClick={() => approvePayment(selectedPayment._id)}
                      disabled={processingPayment}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: "#10b981",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "14px",
                        cursor: processingPayment ? "not-allowed" : "pointer",
                        opacity: processingPayment ? 0.6 : 1
                      }}
                    >
                      {processingPayment ? "Processing..." : "Approve Payment"}
                    </button>
                    
                    <button
                      onClick={() => rejectPayment(selectedPayment._id)}
                      disabled={processingPayment}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "14px",
                        cursor: processingPayment ? "not-allowed" : "pointer",
                        opacity: processingPayment ? 0.6 : 1
                      }}
                    >
                      {processingPayment ? "Processing..." : "Reject Payment"}
                    </button>
                  </div>
                </div>
              )}

              {/* Admin Actions History */}
              {selectedPayment.adminActions && (selectedPayment.adminActions.approvedAt || selectedPayment.adminActions.rejectedAt) && (
                <div style={{ marginTop: "16px", padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                  <h3 style={{ margin: "0 0 12px 0", color: "#1e293b" }}>Admin Actions History</h3>
                  {selectedPayment.adminActions.approvedAt && (
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Approved:</strong> {formatDate(selectedPayment.adminActions.approvedAt)}
                    </div>
                  )}
                  {selectedPayment.adminActions.rejectedAt && (
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Rejected:</strong> {formatDate(selectedPayment.adminActions.rejectedAt)}
                    </div>
                  )}
                  {selectedPayment.adminActions.rejectionReason && (
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Rejection Reason:</strong> {selectedPayment.adminActions.rejectionReason}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bank Slip Modal */}
        {showBankSlip && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.8)",
            zIndex: 1001,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}>
            <div style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "90vw",
              maxHeight: "90vh",
              overflow: "auto"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, color: "#1e293b" }}>Bank Slip</h3>
                <button
                  onClick={() => {
                    setShowBankSlip(false);
                    setBankSlipImage("");
                  }}
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
              {bankSlipImage && (
                <img 
                  src={bankSlipImage} 
                  alt="Bank Slip"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "70vh",
                    objectFit: "contain"
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
