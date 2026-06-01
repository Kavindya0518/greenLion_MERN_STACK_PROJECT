import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import { 
  FaBox, FaShoppingCart, FaDollarSign, FaExclamationTriangle, 
  FaUsers, FaChartLine, FaTruck, FaCheckCircle, FaClock, FaTimes,
  FaArrowUp, FaArrowDown 
} from "react-icons/fa";
import { Card, CardHeader, CardTitle, CardContent, Badge } from "../components/ui";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 156,
    activeOrders: 23,
    totalRevenue: 12450,
    lowStockItems: 8,
    totalCustomers: 342,
    pendingDeliveries: 15
  });

  const [recentOrders, setRecentOrders] = useState([
    { id: "#ORD-001", customer: "John Doe", product: "Coco Peat Block", amount: 150, status: "delivered", date: "2024-01-15" },
    { id: "#ORD-002", customer: "Jane Smith", product: "Coconut Fiber", amount: 89, status: "pending", date: "2024-01-15" },
    { id: "#ORD-003", customer: "Mike Johnson", product: "Coco Shell Mulch", amount: 67, status: "packed", date: "2024-01-14" },
    { id: "#ORD-004", customer: "Sarah Williams", product: "Coir Mat", amount: 120, status: "handed_over", date: "2024-01-14" },
    { id: "#ORD-005", customer: "David Brown", product: "Growing Bags", amount: 95, status: "delivered", date: "2024-01-13" }
  ]);

  const navigate = useNavigate();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const statCards = [
    {
      title: "Total Products",
      value: stats.totalProducts,
      change: "+12%",
      isPositive: true,
      icon: <FaBox size={28} />,
      color: "#3B82F6",
      bgColor: "rgba(59, 130, 246, 0.1)"
    },
    {
      title: "Active Orders",
      value: stats.activeOrders,
      change: "+5%",
      isPositive: true,
      icon: <FaShoppingCart size={28} />,
      color: "#8B5CF6",
      bgColor: "rgba(139, 92, 246, 0.1)"
    },
    {
      title: "Total Revenue",
      value: `LKR ${stats.totalRevenue.toLocaleString()}`,
      change: "+18%",
      isPositive: true,
      icon: <FaDollarSign size={28} />,
      color: "#10B981",
      bgColor: "rgba(16, 185, 129, 0.1)"
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockItems,
      change: "-3%",
      isPositive: false,
      icon: <FaExclamationTriangle size={28} />,
      color: "#EF4444",
      bgColor: "rgba(239, 68, 68, 0.1)"
    },
    {
      title: "Total Customers",
      value: stats.totalCustomers,
      change: "+8%",
      isPositive: true,
      icon: <FaUsers size={28} />,
      color: "#F59E0B",
      bgColor: "rgba(245, 158, 11, 0.1)"
    },
    {
      title: "Pending Deliveries",
      value: stats.pendingDeliveries,
      change: "+2%",
      isPositive: false,
      icon: <FaTruck size={28} />,
      color: "#06B6D4",
      bgColor: "rgba(6, 182, 212, 0.1)"
    }
  ];

  const getStatusIcon = (status) => {
    switch(status) {
      case "delivered": return <FaCheckCircle color="#10B981" />;
      case "handed_over": return <FaTruck color="#06B6D4" />;
      case "packed": return <FaBox color="#8B5CF6" />;
      case "pending": return <FaClock color="#F59E0B" />;
      case "cancelled": return <FaTimes color="#EF4444" />;
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

  const quickActions = [
    { title: "View Products", icon: <FaBox />, link: "/admin/products", color: "#3B82F6" },
    { title: "Manage Orders", icon: <FaShoppingCart />, link: "/admin/orders", color: "#8B5CF6" },
    { title: "Inventory", icon: <FaChartLine />, link: "/admin/inventory", color: "#10B981" },
    { title: "Suppliers", icon: <FaTruck />, link: "/admin/suppliers/dashboard", color: "#F59E0B" }
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--color-gray-50)" }}>
      <AdminSidebar />

      {/* Main Content */}
      <div style={{ flex: 1 }}>
        {/* Header */}
        <header style={{
          backgroundColor: "white",
          padding: "32px",
          borderBottom: "1px solid var(--color-gray-200)",
          boxShadow: "var(--shadow-sm)"
        }}>
          <div>
            <h1 className="heading-2 animate-fadeIn" style={{ color: "var(--color-primary)", margin: 0 }}>
              Admin Dashboard
            </h1>
            <p style={{ color: "var(--color-gray-600)", margin: "8px 0 0 0", fontSize: "1rem" }}>
              Welcome back! Here's what's happening with your business today.
            </p>
          </div>
        </header>

        {/* Dashboard Content */}
        <main style={{ padding: "32px" }}>
          {/* Stats Cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
            marginBottom: "32px"
          }}>
            {statCards.map((stat, index) => (
              <div
                key={index}
                className="card hover-lift animate-scaleIn"
                style={{
                  padding: "28px",
                  borderTop: `4px solid ${stat.color}`,
                  animationDelay: `${index * 0.1}s`
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ 
                      color: "var(--color-gray-600)", 
                      fontSize: "0.875rem", 
                      margin: "0 0 12px 0",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}>
                      {stat.title}
                    </p>
                    <p className="heading-2" style={{ 
                      fontSize: "2.25rem", 
                      color: "var(--color-gray-900)", 
                      margin: "0 0 16px 0" 
                    }}>
                      {stat.value}
                    </p>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                      gap: "8px"
                }}>
                  <span style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        color: stat.isPositive ? "#10B981" : "#EF4444",
                        fontSize: "0.875rem",
                        fontWeight: 600
                      }}>
                        {stat.isPositive ? <FaArrowUp size={12} /> : <FaArrowDown size={12} />}
                    {stat.change}
                  </span>
                      <span style={{ 
                        color: "var(--color-gray-500)", 
                        fontSize: "0.875rem" 
                      }}>
                    from last month
                  </span>
                    </div>
                  </div>
                  <div style={{ 
                    width: "64px",
                    height: "64px",
                    backgroundColor: stat.bgColor,
                    borderRadius: "var(--radius-xl)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: stat.color,
                    flexShrink: 0
                  }}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div style={{ marginBottom: "32px" }}>
            <h2 className="heading-3" style={{ 
              marginBottom: "20px", 
              color: "var(--color-gray-900)" 
            }}>
              Quick Actions
            </h2>
          <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px"
            }}>
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    navigate(action.link);
                    setTimeout(() => window.scrollTo(0, 0), 100);
                  }}
                  className="card hover-lift animate-fadeIn"
                  style={{
                    padding: "24px",
                    textAlign: "center",
                    border: "2px solid var(--color-gray-200)",
                    cursor: "pointer",
                    background: "white",
                    animationDelay: `${idx * 0.1}s`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "12px"
                  }}
                >
            <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: `${action.color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: action.color,
                    fontSize: "20px"
                  }}>
                    {action.icon}
                  </div>
                  <span style={{ 
                    color: "var(--color-gray-900)", 
                    fontWeight: 600,
                    fontSize: "0.875rem"
                  }}>
                    {action.title}
                  </span>
                </button>
              ))}
            </div>
            </div>

          {/* Recent Orders */}
          <Card className="animate-slideInLeft">
            <CardHeader style={{ 
              borderBottom: "1px solid var(--color-gray-200)", 
              paddingBottom: "20px" 
            }}>
              <div style={{ 
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                <CardTitle>Recent Orders</CardTitle>
                <button
                  onClick={() => {
                    navigate("/admin/orders");
                    setTimeout(() => window.scrollTo(0, 0), 100);
                  }}
                  className="btn btn-outline btn-sm"
                >
                  View All
                </button>
              </div>
            </CardHeader>
            <CardContent style={{ padding: 0 }}>
              <div>
                {recentOrders.map((order, index) => (
                  <div 
                    key={index} 
                    className="hover-scale"
                    style={{
                      padding: "20px 24px",
                      borderBottom: index < recentOrders.length - 1 ? "1px solid var(--color-gray-100)" : "none",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      transition: "all 0.3s ease",
                      cursor: "pointer"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--color-gray-50)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
                      <div style={{ fontSize: "24px" }}>
                        {getStatusIcon(order.status)}
                      </div>
                      <div>
                        <p style={{ 
                          fontWeight: 700, 
                          color: "var(--color-gray-900)", 
                          margin: "0 0 4px 0",
                          fontSize: "0.9375rem"
                        }}>
                      {order.id}
                    </p>
                        <p style={{ 
                          color: "var(--color-gray-600)", 
                          fontSize: "0.875rem", 
                          margin: 0 
                        }}>
                      {order.customer} • {order.product}
                    </p>
                  </div>
                    </div>
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "24px" 
                    }}>
                  <div style={{ textAlign: "right" }}>
                        <p style={{ 
                          fontWeight: 700, 
                          color: "var(--color-primary)", 
                          margin: "0 0 4px 0",
                          fontSize: "1rem"
                        }}>
                          LKR {order.amount.toLocaleString()}
                        </p>
                        <p style={{ 
                          color: "var(--color-gray-500)", 
                          fontSize: "0.75rem", 
                          margin: 0 
                        }}>
                          {order.date}
                        </p>
                      </div>
                      {getStatusBadge(order.status)}
                  </div>
                </div>
              ))}
            </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
