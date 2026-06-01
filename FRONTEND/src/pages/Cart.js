import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { COLORS, radii, shadows } from "../theme";
import http from "../api/http";

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  // Helper function to navigate with scroll to top
  const navigateWithScrollToTop = (path) => {
    navigate(path);
    setTimeout(() => window.scrollTo(0, 0), 100);
  };

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Check if user is logged in and listen for changes
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      
      if (!token) {
        setIsLoggedIn(false);
        setLoading(false);
        setCart(null);
        return;
      }

      // Check user role
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          
          // Redirect non-customer users to their appropriate dashboards
          if (user.role === 'admin') {
            navigateWithScrollToTop('/admin');
            return;
          } else if (user.role === 'supplier') {
            navigateWithScrollToTop('/admin/suppliers');
            return;
          } else if (user.role === 'employee') {
            navigateWithScrollToTop('/admin/employees');
            return;
          }
        } catch (e) {
          console.error("Error parsing user data:", e);
        }
      }
      
      setIsLoggedIn(true);
      fetchCart();
    };

    // Check auth on mount
    checkAuth();

    // Listen for storage changes (when user logs in/out in another tab)
    window.addEventListener('storage', checkAuth);
    
    // Listen for custom login events
    window.addEventListener('userLogin', checkAuth);
    window.addEventListener('userLogout', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('userLogin', checkAuth);
      window.removeEventListener('userLogout', checkAuth);
    };
  }, [navigate]);

  const cleanupInvalidCartItems = async () => {
    try {
      await http.post("/api/cart/cleanup");
      console.log('Invalid cart items cleaned up');
    } catch (error) {
      console.warn('Could not cleanup invalid cart items:', error.message);
    }
  };

  const fetchCart = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoggedIn(false);
      setLoading(false);
      try { window.dispatchEvent(new Event('cartUpdated')); } catch {}
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await http.get("/api/cart");
      // Check for and clean up invalid items
      if (response.data.cart && response.data.cart.items.some(item => !item.productId)) {
        console.warn('Cleaning up cart items with null productId...');
        cleanupInvalidCartItems();
      }
      setCart(response.data.cart);
      // Notify header to refresh cart count badge
      try { window.dispatchEvent(new Event('cartUpdated')); } catch {}
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      
      // Check if it's an authentication error
      if (error.response?.status === 401) {
        localStorage.removeItem("token"); // Clear invalid token
        setIsLoggedIn(false);
        setError("Session expired. Please login again.");
      } else {
        setError(error.response?.data?.message || "Failed to load cart. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      setUpdating(prev => ({ ...prev, [productId]: true }));
      await http.put("/api/cart/update", {
        productId,
        quantity: newQuantity
      });
      await fetchCart(); // Refresh cart
    } catch (error) {
      console.error("Failed to update quantity:", error);
      const errorMessage = error.response?.data?.message || "Failed to update quantity. Please try again.";
      alert(errorMessage);
      // Refresh cart to reset to actual available quantity
      await fetchCart();
    } finally {
      setUpdating(prev => ({ ...prev, [productId]: false }));
    }
  };

  const removeItem = async (productId) => {
    if (!window.confirm("Remove this item from cart?")) return;
    
    try {
      setUpdating(prev => ({ ...prev, [productId]: true }));
      await http.delete(`/api/cart/remove/${productId}`);
      await fetchCart(); // Refresh cart
    } catch (error) {
      console.error("Failed to remove item:", error);
      alert("Failed to remove item. Please try again.");
    } finally {
      setUpdating(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleCheckout = () => {
    const validItems = cart ? cart.items.filter(item => item.productId) : [];
    if (!cart || validItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    navigateWithScrollToTop("/checkout");
  };

  const handleMyOrders = () => {
    navigateWithScrollToTop("/my-orders");
  };

  // Check if mobile view
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Styles
  const containerStyle = {
    maxWidth: 1200,
    margin: "24px auto",
    padding: "0 16px",
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1fr 360px",
    gap: isMobile ? 12 : 16
  };

  const itemStyle = {
    display: "grid",
    gridTemplateColumns: "140px 1fr 120px 40px",
    gap: 16,
    alignItems: "start",
    padding: 20,
    background: "#fff",
    borderRadius: radii.md,
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    marginBottom: 16,
    border: "1px solid #e8f4f8",
    transition: "all 0.3s ease",
    position: "relative"
  };

  const buttonStyle = {
    background: COLORS.brown,
    color: "#fff",
    border: 0,
    padding: "8px 12px",
    borderRadius: radii.sm,
    cursor: "pointer",
    fontSize: "14px",
    transition: "background 0.2s"
  };

  const quantityButtonStyle = {
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    border: "none",
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "18px",
    fontWeight: "bold",
    color: "white",
    transition: "all 0.3s ease",
    boxShadow: "0 2px 6px rgba(16, 185, 129, 0.2)"
  };

  // Login required message (customers only)
  if (!isLoggedIn) {
    return (
      <div style={{ maxWidth: 600, margin: "48px auto", padding: "24px", textAlign: "center" }}>
        <div style={{
          background: "#fff",
          padding: "32px",
          borderRadius: radii.md,
          boxShadow: shadows.card,
          border: "1px solid #f0f0f0"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🛒</div>
          <h2 style={{ color: COLORS.green, marginBottom: "16px" }}>Customer Login Required</h2>
          <p style={{ color: COLORS.muted, marginBottom: "24px" }}>
            Please login with a customer account to access the shopping cart. Admin, supplier, and employee accounts will be redirected to their respective dashboards.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button
              onClick={() => navigateWithScrollToTop("/login")}
              style={{
                background: COLORS.green,
                color: "#fff",
                border: 0,
                padding: "12px 24px",
                borderRadius: radii.sm,
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "16px"
              }}
            >
              Login Now
            </button>
            <button
              onClick={() => {
                const token = localStorage.getItem("token");
                if (token) {
                  setIsLoggedIn(true);
                  fetchCart();
                }
              }}
              style={{
                background: "#fff",
                color: COLORS.green,
                border: `2px solid ${COLORS.green}`,
                padding: "12px 24px",
                borderRadius: radii.sm,
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "16px"
              }}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: "24px auto", padding: "24px", textAlign: "center" }}>
        <div style={{ fontSize: "18px", color: COLORS.muted }}>Loading cart...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ maxWidth: 600, margin: "48px auto", padding: "24px" }}>
        <div style={{
          background: "#fff",
          padding: "24px",
          borderRadius: radii.md,
          boxShadow: shadows.card,
          border: "1px solid #ffebee",
          textAlign: "center"
        }}>
          <div style={{ color: "#d32f2f", marginBottom: "16px" }}>❌ {error}</div>
          <button onClick={fetchCart} style={buttonStyle}>Try Again</button>
        </div>
      </div>
    );
  }

  // Filter out items with null productId to prevent runtime errors
  const validItems = cart ? cart.items.filter(item => item.productId) : [];
  
  // Debug: Show item count mismatch if it exists
  const hasInvalidItems = cart && cart.totalItems !== validItems.length;
  if (hasInvalidItems) {
    console.warn(`Item count mismatch: Backend has ${cart.totalItems} items, but ${validItems.length} are valid (${cart.totalItems - validItems.length} items have null productId)`);
  }

  return (
    <div style={containerStyle}>
      {/* Left Side - Cart Items */}
      <div>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px"
        }}>
          <h2 style={{ color: COLORS.green, margin: 0 }}>My Cart</h2>
          <button
            onClick={handleMyOrders}
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              border: "none",
              color: "white",
              padding: "12px 24px",
              borderRadius: "12px",
              cursor: "pointer",
              fontWeight: "700",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              boxShadow: "0 4px 15px rgba(16, 185, 129, 0.4)",
              transition: "all 0.3s ease",
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}
            onMouseOver={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 20px rgba(16, 185, 129, 0.6)";
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 15px rgba(16, 185, 129, 0.4)";
            }}
          >
            📋 My Orders
          </button>
        </div>

        {!cart || validItems.length === 0 ? (
          <div style={{
            background: "#fff",
            padding: "48px 24px",
            borderRadius: radii.md,
            boxShadow: shadows.card,
            textAlign: "center",
            border: "1px solid #f0f0f0"
          }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>🛒</div>
            <h3 style={{ color: COLORS.muted, marginBottom: "16px" }}>Your cart is empty</h3>
            <p style={{ color: COLORS.muted, marginBottom: "24px" }}>
              Add some products to your cart to get started!
            </p>
            <button
              onClick={() => navigateWithScrollToTop("/products")}
              style={{
                background: COLORS.green,
                color: "#fff",
                border: 0,
                padding: "12px 24px",
                borderRadius: radii.sm,
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div>
            {validItems.map((item) => (
              <div 
                key={item.productId._id} 
                style={itemStyle}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                }}
              >
                {/* Product Image */}
                <div style={{
                  width: "120px",
                  height: "120px",
                  background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
                  borderRadius: radii.md,
                  overflow: "hidden",
                  border: "2px solid #e8f4f8",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                }}>
                  {item.productId.file ? (
                    <img
                      src={(() => {
                        const imagePath = item.productId.file;
                        if (!imagePath) return '';
                        
                        // Handle different path formats
                        if (imagePath.startsWith('http')) {
                          return imagePath;
                        }
                        
                        // Clean up the path - remove any leading slashes or 'uploads/'
                        const cleanPath = imagePath.replace(/^\/+/, '').replace(/^uploads\//, '');
                        return `http://localhost:5000/uploads/${cleanPath}`;
                      })()}
                      alt={item.productId.name}
                      onError={(e) => {
                        // Try alternative backend port once
                        if (e.target.src.includes('5000') && !e.target.dataset.triedAlt) {
                          e.target.dataset.triedAlt = 'true';
                          e.target.src = e.target.src.replace('5000', '3001');
                        } else {
                          // Show placeholder
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }
                      }}
                      onLoad={() => {}}
                      style={{ 
                        width: "100%", 
                        height: "100%", 
                        objectFit: "cover",
                        transition: "transform 0.3s ease"
                      }}
                      onMouseOver={(e) => e.target.style.transform = "scale(1.05)"}
                      onMouseOut={(e) => e.target.style.transform = "scale(1)"}
                    />
                  ) : null}
                  <div style={{
                    width: "100%",
                    height: "100%",
                    display: (!item.productId.file) ? "flex" : "none",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    color: COLORS.muted,
                    fontSize: "14px",
                    textAlign: "center",
                    padding: "8px"
                  }}>
                    <div style={{ fontSize: "32px", marginBottom: "8px" }}>�️</div>
                    <div style={{ fontSize: "12px", color: "#666" }}>No Image</div>
                  </div>
                </div>

                {/* Product Details */}
                <div style={{ paddingTop: "8px" }}>
                  <div style={{ 
                    fontWeight: 600, 
                    fontSize: "16px",
                    marginBottom: "8px",
                    color: COLORS.text,
                    lineHeight: "1.4"
                  }}>
                    {item.productId.name}
                  </div>
                  {/* Price Section with Discount Logic */}
                  <div style={{ marginBottom: "12px" }}>
                    {item.productId.discountPercent > 0 ? (
                      <div>
                        {/* Original Price with strikethrough */}
                        <div style={{
                          color: "#999",
                          fontSize: "13px",
                          textDecoration: "line-through",
                          marginBottom: "2px"
                        }}>
                          LKR {item.productId.unitPrice.toFixed(2)} each
                        </div>
                        {/* Discount Badge */}
                        <div style={{
                          display: "inline-block",
                          backgroundColor: "#ff4757",
                          color: "white",
                          fontSize: "11px",
                          fontWeight: "bold",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          marginBottom: "4px"
                        }}>
                          -{item.productId.discountPercent}% OFF
                        </div>
                        {/* Final Discounted Price */}
                        <div style={{
                          color: COLORS.green,
                          fontSize: "15px",
                          fontWeight: "600"
                        }}>
                          LKR {(item.productId.unitPrice * (1 - item.productId.discountPercent / 100)).toFixed(2)} each
                        </div>
                      </div>
                    ) : (
                      <div style={{ 
                        color: COLORS.green, 
                        fontSize: "15px", 
                        fontWeight: "600"
                      }}>
                        LKR {item.productId.unitPrice.toFixed(2)} each
                      </div>
                    )}
                  </div>
                  
                  {/* Quantity Controls */}
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "12px",
                    marginTop: "16px"
                  }}>
                    <span style={{ 
                      fontSize: "14px", 
                      color: COLORS.muted,
                      fontWeight: "500"
                    }}>Quantity:</span>
                    <button
                      onClick={() => updateQuantity(item.productId._id, item.quantity - 1)}
                      disabled={updating[item.productId._id] || item.quantity <= 1}
                      style={{
                        ...quantityButtonStyle,
                        opacity: item.quantity <= 1 ? 0.5 : 1,
                        cursor: item.quantity <= 1 ? "not-allowed" : "pointer"
                      }}
                    >
                      -
                    </button>
                    <span style={{ 
                      minWidth: "50px", 
                      textAlign: "center", 
                      fontWeight: "600",
                      fontSize: "16px",
                      padding: "8px 12px",
                      background: "#f8f9fa",
                      borderRadius: "6px",
                      border: "1px solid #e9ecef"
                    }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId._id, item.quantity + 1)}
                      disabled={updating[item.productId._id]}
                      style={quantityButtonStyle}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Price & Remove */}
                <div style={{ 
                  textAlign: "right",
                  paddingTop: "8px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: "12px"
                }}>
                  <div>
                    {/* Show savings if there's a discount */}
                    {item.productId.discountPercent > 0 && (
                      <div style={{
                        fontSize: "12px",
                        color: "#ff4757",
                        fontWeight: "600",
                        marginBottom: "4px",
                        textAlign: "right"
                      }}>
                        You save: LKR {((item.productId.unitPrice * item.productId.discountPercent / 100) * item.quantity).toFixed(2)}
                      </div>
                    )}
                    {/* Total Price */}
                    <div style={{ 
                      fontWeight: 700, 
                      fontSize: "18px",
                      color: COLORS.green,
                      background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text"
                    }}>
                      LKR {item.productId.discountPercent > 0 
                        ? ((item.productId.unitPrice * (1 - item.productId.discountPercent / 100)) * item.quantity).toFixed(2)
                        : (item.productId.unitPrice * item.quantity).toFixed(2)
                      }
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId._id)}
                    disabled={updating[item.productId._id]}
                    style={{
                      ...buttonStyle,
                      background: updating[item.productId._id] ? "#ccc" : "linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)",
                      cursor: updating[item.productId._id] ? "not-allowed" : "pointer",
                      border: "none",
                      borderRadius: "8px",
                      padding: "8px 16px",
                      fontSize: "13px",
                      fontWeight: "600",
                      transition: "all 0.3s ease",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
                    }}
                    onMouseOver={(e) => !updating[item.productId._id] && (e.target.style.transform = "translateY(-1px)")}
                    onMouseOut={(e) => e.target.style.transform = "translateY(0)"}
                  >
                    {updating[item.productId._id] ? "⏳" : "🗑️ Remove"}
                  </button>
                </div>

                {/* Loading indicator */}
                {updating[item.productId._id] && (
                  <div style={{
                    position: "absolute",
                    right: "8px",
                    top: "8px",
                    color: COLORS.green,
                    fontSize: "12px"
                  }}>
                    ⏳
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Side - Order Summary */}
      {cart && validItems.length > 0 && (
        <div style={{
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          borderRadius: "16px",
          boxShadow: "0 8px 32px rgba(16, 185, 129, 0.3)",
          padding: "24px",
          height: "fit-content",
          border: "none",
          color: "white"
        }}>
          <h3 style={{ 
            marginTop: 0, 
            color: "#ffffff", 
            marginBottom: "24px",
            fontSize: "26px",
            fontWeight: "800",
            textAlign: "center",
            textShadow: "0 3px 6px rgba(0,0,0,0.4)",
            background: "rgba(255,255,255,0.1)",
            padding: "12px",
            borderRadius: "12px",
            border: "2px solid rgba(255,255,255,0.2)"
          }}>
            💰 Order Summary
          </h3>
          
          <div style={{ marginBottom: "20px" }}>
            {(() => {
              // Calculate totals
              const originalTotal = validItems.reduce((total, item) => 
                total + (item.productId.unitPrice * item.quantity), 0);
              const finalTotal = validItems.reduce((total, item) => {
                const discountedPrice = item.productId.discountPercent > 0 
                  ? item.productId.unitPrice * (1 - item.productId.discountPercent / 100)
                  : item.productId.unitPrice;
                return total + (discountedPrice * item.quantity);
              }, 0);
              const totalSavings = originalTotal - finalTotal;
              
              return (
                <>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                    padding: "12px",
                    fontSize: "16px",
                    fontWeight: "600",
                    background: "rgba(255,255,255,0.2)",
                    borderRadius: "8px",
                    color: "#ffffff"
                  }}>
                    <span>🛍️ Items ({validItems.length})</span>
                    <span>LKR {originalTotal.toFixed(2)}</span>
                  </div>
                  
                  {/* Show discount savings if any */}
                  {totalSavings > 0 && (
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "12px",
                      padding: "12px",
                      fontSize: "15px",
                      background: "rgba(255, 71, 87, 0.2)",
                      borderRadius: "8px",
                      color: "#ffffff",
                      border: "1px solid rgba(255, 71, 87, 0.3)"
                    }}>
                      <span>💰 Discount Savings</span>
                      <span style={{ color: "#4ade80", fontWeight: "700" }}>-LKR {totalSavings.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                    padding: "12px",
                    fontSize: "15px",
                    background: "rgba(255,255,255,0.15)",
                    borderRadius: "8px",
                    color: "#ffffff"
                  }}>
                    <span>🚚 Delivery</span>
                    <span style={{ color: "#4ade80", fontWeight: "600" }}>Free</span>
                  </div>
                </>
              );
            })()}
            <hr style={{ border: "none", borderTop: "2px solid rgba(255,255,255,0.3)", margin: "16px 0" }} />
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: "700",
              fontSize: "22px",
              padding: "16px",
              background: "rgba(255,255,255,0.25)",
              borderRadius: "12px",
              color: "#ffffff",
              border: "2px solid rgba(255,255,255,0.3)"
            }}>
              <span>💳 Total</span>
              <span style={{ color: "#ffffff", textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
                LKR {validItems.reduce((total, item) => {
                  const discountedPrice = item.productId.discountPercent > 0 
                    ? item.productId.unitPrice * (1 - item.productId.discountPercent / 100)
                    : item.productId.unitPrice;
                  return total + (discountedPrice * item.quantity);
                }, 0).toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            style={{
              background: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)",
              color: "#059669",
              border: "3px solid rgba(255,255,255,0.4)",
              padding: "18px 24px",
              borderRadius: "12px",
              fontWeight: 800,
              width: "100%",
              cursor: "pointer",
              fontSize: "18px",
              marginBottom: "16px",
              boxShadow: "0 6px 20px rgba(255,255,255,0.3)",
              transition: "all 0.3s ease",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              textShadow: "0 1px 2px rgba(0,0,0,0.1)"
            }}
            onMouseOver={(e) => {
              e.target.style.transform = "translateY(-3px)";
              e.target.style.boxShadow = "0 8px 25px rgba(255,255,255,0.5)";
              e.target.style.background = "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)";
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 6px 20px rgba(255,255,255,0.3)";
              e.target.style.background = "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)";
            }}
          >
            🛒 Proceed to Checkout
          </button>

          <div style={{ 
            fontSize: "13px", 
            color: "#ffffff", 
            textAlign: "center",
            background: "rgba(255,255,255,0.15)",
            padding: "8px 12px",
            borderRadius: "8px",
            fontWeight: "500",
            textShadow: "0 1px 2px rgba(0,0,0,0.3)"
          }}>
            🔒 Secure checkout with SSL encryption
          </div>
        </div>
      )}
    </div>
  );
}
