import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaShoppingCart, FaCheckCircle, FaTruck, FaBox, FaClock, FaTimes, FaEye } from "react-icons/fa";
import http from "../../api/http";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Spinner } from "../../components/ui";

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await http.get("/api/orders");
      if (data.success || data.orders) {
        setOrders(data.orders || data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case "delivered": return <FaCheckCircle color="#10B981" />;
      case "handed_over": return <FaTruck color="#06B6D4" />;
      case "packed": return <FaBox color="#8B5CF6" />;
      case "pending": return <FaClock color="#F59E0B" />;
      case "cancelled": return <FaTimes color="#EF4444" />;
      case "confirmed": return <FaCheckCircle color="#10B981" />;
      default: return <FaClock color="#9CA3AF" />;
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      delivered: { variant: "success", label: "Delivered" },
      handed_over: { variant: "primary", label: "Handed Over" },
      packed: { variant: "primary", label: "Packed" },
      pending: { variant: "warning", label: "Pending" },
      cancelled: { variant: "error", label: "Cancelled" },
      confirmed: { variant: "success", label: "Confirmed" }
    };
    const config = statusMap[status] || { variant: "primary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredOrders = orders.filter(order => {
    if (filter === "all") return true;
    return order.status === filter;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "100vh",
        paddingTop: "72px"
      }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: "var(--color-gray-50)", 
      paddingTop: "72px" 
    }}>
      <div className="container py-8">
        <div style={{ marginBottom: "32px" }}>
          <h1 className="heading-2" style={{ color: "var(--color-primary)", marginBottom: "8px" }}>
            Order History
          </h1>
          <p style={{ color: "var(--color-gray-600)" }}>
            Track and manage your orders
          </p>
        </div>

        {/* Filter Tabs */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{
            display: "flex",
            gap: "8px",
            background: "white",
            padding: "8px",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-sm)",
            border: "1px solid var(--color-gray-200)"
          }}>
            {[
              { id: "all", label: "All Orders" },
              { id: "pending", label: "Pending" },
              { id: "confirmed", label: "Confirmed" },
              { id: "packed", label: "Packed" },
              { id: "delivered", label: "Delivered" },
              { id: "cancelled", label: "Cancelled" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                style={{
                  padding: "12px 20px",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  background: filter === tab.id ? "var(--color-primary)" : "transparent",
                  color: filter === tab.id ? "white" : "var(--color-gray-700)",
                  fontWeight: filter === tab.id ? 600 : 500,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  fontSize: "0.875rem"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent style={{ textAlign: "center", padding: "60px" }}>
              <FaShoppingCart size={64} style={{ color: "var(--color-gray-400)", marginBottom: "20px" }} />
              <h3 style={{ color: "var(--color-gray-600)", marginBottom: "8px" }}>
                {filter === "all" ? "No Orders Yet" : `No ${filter} Orders`}
              </h3>
              <p style={{ color: "var(--color-gray-500)", marginBottom: "24px" }}>
                {filter === "all" 
                  ? "You haven't placed any orders yet. Start shopping to see your order history here."
                  : `You don't have any ${filter} orders at the moment.`
                }
              </p>
              {filter === "all" && (
                <Button onClick={() => navigate("/products")}>
                  Start Shopping
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div style={{ display: "grid", gap: "16px" }}>
            {filteredOrders.map((order) => (
              <Card key={order._id} className="hover-lift">
                <CardContent style={{ padding: "24px" }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "16px"
                  }}>
                    <div>
                      <h3 style={{
                        fontSize: "1.125rem",
                        fontWeight: 700,
                        color: "var(--color-gray-900)",
                        margin: "0 0 4px 0"
                      }}>
                        Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                      </h3>
                      <p style={{
                        fontSize: "0.875rem",
                        color: "var(--color-gray-600)",
                        margin: 0
                      }}>
                        Placed on {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {getStatusIcon(order.status)}
                      {getStatusBadge(order.status)}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div style={{ marginBottom: "16px" }}>
                    <h4 style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--color-gray-700)",
                      margin: "0 0 8px 0"
                    }}>
                      Items ({order.items?.length || 0}):
                    </h4>
                    <div style={{ display: "grid", gap: "8px" }}>
                      {order.items?.slice(0, 3).map((item, idx) => (
                        <div key={idx} style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "0.875rem",
                          color: "var(--color-gray-600)"
                        }}>
                          <span>{item.productName} x {item.quantity}</span>
                          <span>LKR {item.totalPrice?.toFixed(2) || "0.00"}</span>
                        </div>
                      ))}
                      {order.items?.length > 3 && (
                        <div style={{
                          fontSize: "0.875rem",
                          color: "var(--color-gray-500)",
                          fontStyle: "italic"
                        }}>
                          +{order.items.length - 3} more items
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "16px",
                    borderTop: "1px solid var(--color-gray-200)"
                  }}>
                    <div>
                      <div style={{
                        fontSize: "1.25rem",
                        fontWeight: 700,
                        color: "var(--color-primary)"
                      }}>
                        LKR {order.totalAmount?.toFixed(2) || "0.00"}
                      </div>
                      <div style={{
                        fontSize: "0.75rem",
                        color: "var(--color-gray-500)"
                      }}>
                        Total Amount
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/order-confirmation/${order._id}`)}
                      style={{ display: "flex", alignItems: "center", gap: "8px" }}
                    >
                      <FaEye />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
