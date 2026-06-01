import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { COLORS, radii, shadows } from "../theme";
import http from "../api/http";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const navigate = useNavigate();

  // Check if user is logged in
  const isLoggedIn = localStorage.getItem("token");

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    fetchOrders();
  }, [isLoggedIn, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = selectedStatus !== "all" ? { status: selectedStatus } : {};
      const response = await http.get("/api/orders", { params });
      setOrders(response.data.orders || []);
      setError("");
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchOrders();
    }
  }, [selectedStatus, isLoggedIn]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'confirmed': return '#2196f3';
      case 'packed': return '#9c27b0';
      case 'handed_over': return '#673ab7';
      case 'delivered': return '#4caf50';
      case 'cancelled': return '#f44336';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'confirmed': return '✅';
      case 'packed': return '📦';
      case 'handed_over': return '🚚';
      case 'delivered': return '🎉';
      case 'cancelled': return '❌';
      default: return '📋';
    }
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

  const handleViewOrder = (orderId) => {
    navigate(`/order-details/${orderId}`);
  };

  // Styles (variables removed as they're now using inline styles)

  if (!isLoggedIn) {
    return (
      <div style={{ maxWidth: 600, margin: "48px auto", padding: "24px", textAlign: "center" }}>
        <div style={{
          background: "#fff",
          padding: "32px",
          borderRadius: radii.md,
          boxShadow: shadows.card
        }}>
          <h2>Login Required</h2>
          <p>Please login to view your orders.</p>
          <button
            onClick={() => navigate("/login")}
            style={{
              background: COLORS.green,
              color: "#fff",
              border: 0,
              padding: "12px 24px",
              borderRadius: radii.sm,
              cursor: "pointer"
            }}
          >
            Login Now
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 600, margin: "48px auto", padding: "24px", textAlign: "center" }}>
        <div style={{ fontSize: "18px", color: COLORS.muted }}>Loading orders...</div>
      </div>
    );
  }

  return (
    <div style={{
      width: "90%",
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "20px",
      background: "#f8fafb",
      minHeight: "100vh"
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        borderRadius: "20px",
        padding: "30px",
        marginBottom: "30px",
        boxShadow: "0 10px 30px rgba(16, 185, 129, 0.2)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        color: "white"
      }}>
        <div>
          <h1 style={{ 
            margin: "0 0 8px 0", 
            fontSize: "32px",
            fontWeight: "800"
          }}>🛍️ My Orders</h1>
          <p style={{ 
            margin: 0, 
            fontSize: "16px", 
            opacity: 0.9 
          }}>Track and manage your orders</p>
        </div>
        <button
          onClick={() => navigate("/cart")}
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            color: "white",
            border: "2px solid rgba(255, 255, 255, 0.3)",
            padding: "12px 20px",
            borderRadius: "12px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px",
            transition: "all 0.3s ease",
            backdropFilter: "blur(10px)"
          }}
          onMouseOver={(e) => {
            e.target.style.background = "rgba(255, 255, 255, 0.3)";
            e.target.style.transform = "translateY(-2px)";
          }}
          onMouseOut={(e) => {
            e.target.style.background = "rgba(255, 255, 255, 0.2)";
            e.target.style.transform = "translateY(0)";
          }}
        >
          🛒 Continue Shopping
        </button>
      </div>

      {/* Status Filter */}
      <div style={{
        background: "white",
        borderRadius: "16px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        padding: "24px",
        marginBottom: "30px",
        border: "1px solid #f0f4f8"
      }}>
        <h3 style={{ 
          margin: "0 0 20px 0", 
          color: "#059669", 
          fontSize: "20px",
          fontWeight: "700",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          🎯 Filter by Status
        </h3>
        <div style={{ 
          display: "flex", 
          flexWrap: "wrap",
          gap: "12px",
          justifyContent: "center"
        }}>
          {[
            { value: "all", label: "All Orders", icon: "📋" },
            { value: "pending", label: "Pending", icon: "⏳" },
            { value: "confirmed", label: "Confirmed", icon: "✅" },
            { value: "packed", label: "Packed", icon: "📦" },
            { value: "handed_over", label: "Shipped", icon: "🚚" },
            { value: "delivered", label: "Delivered", icon: "🎉" },
            { value: "cancelled", label: "Cancelled", icon: "❌" }
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSelectedStatus(filter.value)}
              style={{
                background: selectedStatus === filter.value 
                  ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" 
                  : "white",
                color: selectedStatus === filter.value ? "white" : "#374151",
                border: selectedStatus === filter.value 
                  ? "2px solid transparent" 
                  : "2px solid #e5e7eb",
                padding: "14px 16px",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: selectedStatus === filter.value ? "700" : "500",
                fontSize: "14px",
                transition: "all 0.3s ease",
                textAlign: "center",
                boxShadow: selectedStatus === filter.value 
                  ? "0 4px 12px rgba(16, 185, 129, 0.3)" 
                  : "0 2px 4px rgba(0,0,0,0.05)"
              }}
              onMouseOver={(e) => {
                if (selectedStatus !== filter.value) {
                  e.target.style.borderColor = "#10b981";
                  e.target.style.transform = "translateY(-2px)";
                }
              }}
              onMouseOut={(e) => {
                if (selectedStatus !== filter.value) {
                  e.target.style.borderColor = "#e5e7eb";
                  e.target.style.transform = "translateY(0)";
                }
              }}
            >
              <div style={{ fontSize: "18px", marginBottom: "4px" }}>{filter.icon}</div>
              <div>{filter.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          background: "#ffebee",
          color: "#d32f2f",
          padding: "12px",
          borderRadius: radii.sm,
          marginBottom: "24px",
          border: "1px solid #ffcdd2"
        }}>
          {error}
          <button
            onClick={fetchOrders}
            style={{
              marginLeft: "12px",
              background: "#d32f2f",
              color: "#fff",
              border: 0,
              padding: "4px 8px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px"
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Orders List */}
      {orders.length === 0 ? (
        <div style={{
          background: "white",
          padding: "60px 40px",
          borderRadius: "20px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          textAlign: "center",
          border: "1px solid #f0f4f8",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Decorative background pattern */}
          <div style={{
            position: "absolute",
            top: "-50%",
            left: "-50%",
            right: "-50%",
            bottom: "-50%",
            background: "linear-gradient(45deg, transparent 30%, rgba(16, 185, 129, 0.03) 50%, transparent 70%)",
            transform: "rotate(-12deg)"
          }}></div>
          
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ 
              fontSize: "80px", 
              marginBottom: "24px",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 2px 4px rgba(16, 185, 129, 0.2))"
            }}>
              {selectedStatus === "all" ? "🛍️" : "📋"}
            </div>
            <h3 style={{ 
              color: "#374151", 
              marginBottom: "16px",
              fontSize: "24px",
              fontWeight: "700"
            }}>
              {selectedStatus === "all" ? "No orders yet!" : `No ${selectedStatus} orders`}
            </h3>
            <p style={{ 
              color: "#6b7280", 
              marginBottom: "32px",
              fontSize: "16px",
              lineHeight: "1.6",
              maxWidth: "400px",
              margin: "0 auto 32px auto"
            }}>
              {selectedStatus === "all" 
                ? "You haven't placed any orders yet. Discover our amazing products and start your shopping journey!"
                : "No orders with this status found. Try selecting a different filter."
              }
            </p>
            {selectedStatus === "all" && (
              <button
                onClick={() => navigate("/products")}
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "white",
                  border: "none",
                  padding: "16px 32px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontWeight: "700",
                  fontSize: "16px",
                  boxShadow: "0 4px 16px rgba(16, 185, 129, 0.3)",
                  transition: "all 0.3s ease"
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 20px rgba(16, 185, 129, 0.4)";
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 16px rgba(16, 185, 129, 0.3)";
                }}
              >
                🛒 Start Shopping Now
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "20px" }}>
          {orders.map((order) => (
            <div key={order._id} style={{
              background: "white",
              borderRadius: "20px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
              padding: "28px",
              border: "1px solid #f0f4f8",
              transition: "all 0.3s ease",
              position: "relative",
              overflow: "hidden"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.12)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)";
            }}
            >
              {/* Decorative gradient bar */}
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)"
              }}></div>

              {/* Order Header */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "20px"
              }}>
                <div>
                  <h3 style={{
                    margin: "0 0 8px 0",
                    color: "#059669",
                    fontSize: "22px",
                    fontWeight: "700"
                  }}>
                    🧾 {order.orderNumber}
                  </h3>
                  <div style={{
                    fontSize: "14px",
                    color: "#6b7280",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                    📅 Placed on {formatDate(order.createdAt)}
                  </div>
                </div>
                
                <div style={{
                  background: `linear-gradient(135deg, ${getStatusColor(order.status)} 0%, ${getStatusColor(order.status)}cc 100%)`,
                  color: "#fff",
                  padding: "10px 16px",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: `0 4px 12px ${getStatusColor(order.status)}40`
                }}>
                  <span style={{ fontSize: "16px" }}>{getStatusIcon(order.status)}</span>
                  {order.status.replace('_', ' ').toUpperCase()}
                </div>
              </div>

              {/* Order Items Summary */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ 
                  fontSize: "16px", 
                  color: "#374151", 
                  marginBottom: "12px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}>
                  📦 Items ({order.totalItems}):
                </div>
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "10px" 
                }}>
                  {order.items.slice(0, 4).map((item, index) => (
                    <div
                      key={index}
                      style={{
                        background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
                        border: "1px solid #a7f3d0",
                        padding: "12px 16px",
                        borderRadius: "12px",
                        fontSize: "14px",
                        color: "#059669",
                        fontWeight: "600",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <span>{item.productName}</span>
                      <span style={{
                        background: "#10b981",
                        color: "white",
                        padding: "2px 8px",
                        borderRadius: "8px",
                        fontSize: "12px"
                      }}>
                        x{item.quantity}
                      </span>
                    </div>
                  ))}
                  {order.items.length > 4 && (
                    <div style={{
                      background: "#f3f4f6",
                      border: "2px dashed #d1d5db",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      fontSize: "14px",
                      color: "#6b7280",
                      fontWeight: "600",
                      textAlign: "center",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      +{order.items.length - 4} more items
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Information */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ 
                  fontSize: "16px", 
                  color: "#374151", 
                  marginBottom: "12px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}>
                  🏠 Delivery Address:
                </div>
                <div style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  padding: "16px",
                  borderRadius: "12px",
                  fontSize: "14px",
                  color: "#374151",
                  lineHeight: "1.5"
                }}>
                  <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                    {order.deliveryAddress.fullName}
                  </div>
                  <div style={{ color: "#6b7280", marginBottom: "4px" }}>
                    📞 {order.deliveryAddress.phoneNumber}
                  </div>
                  <div>
                    📍 {order.deliveryAddress.address}, {order.deliveryAddress.city} {order.deliveryAddress.postalCode}
                  </div>
                </div>
              </div>

              {/* Delivery Company (if assigned) */}
              {order.deliveryCompany && order.deliveryCompany.companyName && (
                <div style={{ marginBottom: "24px" }}>
                  <div style={{ 
                    fontSize: "16px", 
                    color: "#374151", 
                    marginBottom: "12px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                    🚚 Delivery Company:
                  </div>
                  <div style={{
                    background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
                    padding: "16px",
                    borderRadius: "12px",
                    border: "1px solid #a7f3d0",
                    boxShadow: "0 2px 8px rgba(16, 185, 129, 0.1)"
                  }}>
                    <div style={{ 
                      fontWeight: "700", 
                      color: "#059669",
                      fontSize: "16px",
                      marginBottom: "4px"
                    }}>
                      {order.deliveryCompany.companyName}
                    </div>
                    {order.deliveryCompany.trackingNumber && (
                      <div style={{ 
                        fontSize: "14px", 
                        color: "#6b7280",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}>
                        📋 Tracking: <span style={{ fontWeight: "600" }}>{order.deliveryCompany.trackingNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Order Footer */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "24px",
                borderTop: "2px solid #f0f4f8",
                marginTop: "8px"
              }}>
                <div style={{
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "white",
                  padding: "12px 20px",
                  borderRadius: "12px",
                  fontSize: "18px",
                  fontWeight: "800",
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)"
                }}>
                  💰 Total: LKR {order.totalAmount.toFixed(2)}
                </div>
                
                <button
                  onClick={() => handleViewOrder(order._id)}
                  style={{
                    background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                    color: "#059669",
                    border: "2px solid #10b981",
                    padding: "12px 24px",
                    borderRadius: "12px",
                    cursor: "pointer",
                    fontWeight: "700",
                    fontSize: "14px",
                    transition: "all 0.3s ease",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
                    e.target.style.color = "white";
                    e.target.style.transform = "translateY(-2px)";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)";
                    e.target.style.color = "#059669";
                    e.target.style.transform = "translateY(0)";
                  }}
                >
                  📋 View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}