import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { COLORS, radii, shadows } from "../theme";
import http from "../api/http";

export default function Checkout() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Form states
  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: "",
    phoneNumber: "",
    address: "",
    city: "",
    postalCode: "",
    additionalNotes: ""
  });

  const [paymentMethod, setPaymentMethod] = useState("offline");
  const [bankSlipFile, setBankSlipFile] = useState(null);

  // Check if user is logged in
  const isLoggedIn = localStorage.getItem("token");

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    fetchCart();
  }, [isLoggedIn, navigate]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await http.get("/api/cart");
      
      // Filter out items with null productId before validation
      const validItems = response.data.cart ? response.data.cart.items.filter(item => item.productId) : [];
      
      if (!response.data.cart || validItems.length === 0) {
        navigate("/cart");
        return;
      }
      
      setCart(response.data.cart);
      setError("");
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      setError("Failed to load cart. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddressChange = (field, value) => {
    setDeliveryAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type - only JPG, JPEG, and PDF
      const allowedTypes = ['image/jpeg', 'image/jpg', 'application/pdf'];
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const allowedExtensions = ['jpg', 'jpeg', 'pdf'];
      
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        alert('Please select only JPG, JPEG, or PDF files');
        e.target.value = '';
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        e.target.value = '';
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        setBankSlipFile(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const requiredFields = ['fullName', 'phoneNumber', 'address', 'city', 'postalCode'];
    const missing = requiredFields.filter(field => !deliveryAddress[field].trim());
    
    if (missing.length > 0) {
      setError(`Please fill in all required fields: ${missing.join(', ')}`);
      return false;
    }

    if (paymentMethod === 'offline' && !bankSlipFile) {
      setError('Please upload your bank slip for offline payment');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setCreating(true);
      setError("");

      const orderData = {
        deliveryAddress: deliveryAddress,
        paymentData: {
          paymentType: paymentMethod,
          bankSlipImage: bankSlipFile,
          customerNote: ""
        }
      };

      const response = await http.post("/api/orders", orderData);
      
      if (response.data.success) {
        navigate(`/order-confirmation/${response.data.order._id}`, {
          state: { 
            order: response.data.order,
            payment: response.data.payment
          }
        });
      }
    } catch (error) {
      console.error("Failed to create order:", error);
      setError(
        error.response?.data?.message || 
        "Failed to create order. Please try again."
      );
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 600, margin: "48px auto", padding: "24px", textAlign: "center" }}>
        <div style={{ fontSize: "18px", color: COLORS.muted }}>Loading checkout...</div>
      </div>
    );
  }

  if (!cart) {
    return (
      <div style={{ maxWidth: 600, margin: "48px auto", padding: "24px", textAlign: "center" }}>
        <div style={{
          background: "#fff",
          padding: "32px",
          borderRadius: radii.md,
          boxShadow: shadows.card
        }}>
          <h2>Cart is Empty</h2>
          <p>Please add items to your cart before checkout.</p>
          <button onClick={() => navigate("/cart")} style={{
            background: COLORS.green,
            color: "#fff",
            border: 0,
            padding: "14px 24px",
            borderRadius: radii.sm,
            fontWeight: "600",
            cursor: "pointer",
            fontSize: "16px",
            width: "100%"
          }}>
            Go to Cart
          </button>
        </div>
      </div>
    );
  }

  // Filter out items with null productId to prevent runtime errors
  const validItems = cart ? cart.items.filter(item => item.productId) : [];

  return (
    <div style={{
      width: "60%",
      margin: "0 auto",
      padding: "20px",
      background: "#f8fafb",
      minHeight: "100vh",
      display: "grid",
      gridTemplateRows: "auto auto auto",
      gap: "15px",
      alignContent: "start"
    }}>
      <div style={{
        textAlign: "center",
        marginBottom: "20px"
      }}>
        <h1 style={{ 
          color: COLORS.green, 
          margin: 0,
          fontSize: "28px",
          fontWeight: "800"
        }}>Checkout</h1>
      </div>
      
      {error && (
        <div style={{
          background: "#ffebee",
          color: "#d32f2f",
          padding: "12px",
          borderRadius: radii.sm,
          marginBottom: "16px",
          border: "1px solid #ffcdd2"
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateRows: "auto auto auto", gap: "15px" }}>
        {/* Row 1 - Order Details */}
        <div style={{
          display: "flex",
          justifyContent: "center"
        }}>
          <div style={{
            width: "40%",
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            borderRadius: "16px",
            boxShadow: "0 8px 24px rgba(16, 185, 129, 0.2)",
            padding: "20px",
            color: "white"
          }}>
          <h3 style={{ 
            color: "#ffffff", 
            margin: "0 0 16px 0",
            fontSize: "20px",
            fontWeight: "700",
            textAlign: "center"
          }}>🛒 Order Summary</h3>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "12px",
            marginBottom: "16px"
          }}>
            {validItems.map((item) => {
              const hasDiscount = item.productId.discountPercent > 0;
              const originalPrice = item.productId.unitPrice;
              const discountedPrice = hasDiscount 
                ? originalPrice * (1 - item.productId.discountPercent / 100)
                : originalPrice;
              const totalItemPrice = discountedPrice * item.quantity;
              const savings = (originalPrice - discountedPrice) * item.quantity;
              
              return (
                <div key={item.productId._id} style={{
                  padding: "12px",
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.1)"
                }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: hasDiscount ? "4px" : "0"
                  }}>
                    <div>
                      <div style={{ fontWeight: "600", fontSize: "14px" }}>{item.productId.name}</div>
                      <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px" }}>
                        Qty: {item.quantity} {hasDiscount && (
                          <span style={{
                            backgroundColor: "#ff4757",
                            color: "white",
                            fontSize: "10px",
                            padding: "2px 4px",
                            borderRadius: "3px",
                            marginLeft: "6px"
                          }}>
                            -{item.productId.discountPercent}% OFF
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {hasDiscount && (
                        <div style={{
                          fontSize: "11px",
                          color: "rgba(255,255,255,0.6)",
                          textDecoration: "line-through",
                          marginBottom: "2px"
                        }}>
                          LKR {(originalPrice * item.quantity).toFixed(2)}
                        </div>
                      )}
                      <div style={{ fontWeight: "700", fontSize: "14px" }}>
                        LKR {totalItemPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  {hasDiscount && (
                    <div style={{
                      fontSize: "10px",
                      color: "#4ade80",
                      textAlign: "right",
                      fontWeight: "600"
                    }}>
                      You save: LKR {savings.toFixed(2)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {(() => {
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
              <div>
                {totalSavings > 0 && (
                  <div style={{
                    textAlign: "center",
                    padding: "8px 12px",
                    background: "rgba(255, 71, 87, 0.2)",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: "600",
                    marginBottom: "8px",
                    border: "1px solid rgba(255, 71, 87, 0.3)"
                  }}>
                    💰 Total Savings: LKR {totalSavings.toFixed(2)}
                  </div>
                )}
                <div style={{
                  textAlign: "center",
                  padding: "12px",
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "8px",
                  fontSize: "18px",
                  fontWeight: "800"
                }}>
                  Total: LKR {finalTotal.toFixed(2)}
                </div>
              </div>
            );
          })()}
          </div>
        </div>

        {/* Row 2 - Two Columns: Delivery Details + Payment Method */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "28px",
          alignItems: "start"
        }}>
          {/* Left Column - Delivery Details */}
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            padding: "28px",
            border: "1px solid #f0f4f8"
          }}>
            <h3 style={{ 
              color: "#059669", 
              margin: "0 0 20px 0",
              fontSize: "22px",
              fontWeight: "700",
              textAlign: "center",
              background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid #a7f3d0"
            }}>🏠 Delivery Address</h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <input
                type="text"
                placeholder="Full Name *"
                value={deliveryAddress.fullName}
                onChange={(e) => handleAddressChange('fullName', e.target.value)}
                style={{
                  padding: "14px 16px",
                  border: "1px solid #a7f3d0",
                  borderRadius: "8px",
                  fontSize: "16px",
                  background: "#f0fdf4",
                  outline: "none"
                }}
                required
              />
              <input
                type="tel"
                placeholder="Phone Number *"
                value={deliveryAddress.phoneNumber}
                onChange={(e) => handleAddressChange('phoneNumber', e.target.value)}
                style={{
                  padding: "14px 16px",
                  border: "1px solid #a7f3d0",
                  borderRadius: "8px",
                  fontSize: "16px",
                  background: "#f0fdf4",
                  outline: "none"
                }}
                required
              />
            </div>

            <input
              type="text"
              placeholder="Address *"
              value={deliveryAddress.address}
              onChange={(e) => handleAddressChange('address', e.target.value)}
              style={{
                width: "100%",
                padding: "14px 16px",
                border: "1px solid #a7f3d0",
                borderRadius: "8px",
                fontSize: "16px",
                background: "#f0fdf4",
                marginBottom: "16px",
                outline: "none"
              }}
              required
            />

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <input
                type="text"
                placeholder="City *"
                value={deliveryAddress.city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                style={{
                  padding: "14px 16px",
                  border: "1px solid #a7f3d0",
                  borderRadius: "8px",
                  fontSize: "16px",
                  background: "#f0fdf4",
                  outline: "none"
                }}
                required
              />
              <input
                type="text"
                placeholder="Postal Code *"
                value={deliveryAddress.postalCode}
                onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                style={{
                  padding: "14px 16px",
                  border: "1px solid #a7f3d0",
                  borderRadius: "8px",
                  fontSize: "16px",
                  background: "#f0fdf4",
                  outline: "none"
                }}
                maxLength={5}
                pattern="[0-9]{5}"
                required
              />
            </div>

            <textarea
              placeholder="Additional Notes (Optional)"
              value={deliveryAddress.additionalNotes}
              onChange={(e) => handleAddressChange('additionalNotes', e.target.value)}
              style={{
                width: "100%",
                padding: "14px 16px",
                border: "1px solid #a7f3d0",
                borderRadius: "8px",
                fontSize: "16px",
                background: "#f0fdf4",
                outline: "none",
                height: "80px",
                resize: "none"
              }}
            />
          </div>

          {/* Right Column - Payment Method */}
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            padding: "28px",
            border: "1px solid #f0f4f8"
          }}>
            <h3 style={{ 
              color: "#059669", 
              margin: "0 0 20px 0",
              fontSize: "22px",
              fontWeight: "700",
              textAlign: "center",
              background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid #a7f3d0"
            }}>💳 Payment Method</h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <button
                type="button"
                disabled={true}
                style={{
                  padding: "16px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  cursor: "not-allowed",
                  textAlign: "center",
                  backgroundColor: "#f9fafb",
                  color: "#9ca3af",
                  fontSize: "14px"
                }}
              >
                <div style={{ fontSize: "24px", marginBottom: "6px" }}>💳</div>
                <div style={{ fontSize: "16px", fontWeight: "600" }}>Online Payment</div>
                <div style={{ color: "#ef4444", fontSize: "14px" }}>Coming Soon</div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("offline")}
                style={{
                  padding: "16px",
                  border: `2px solid ${paymentMethod === "offline" ? COLORS.green : "#e5e7eb"}`,
                  borderRadius: "8px",
                  cursor: "pointer",
                  textAlign: "center",
                  backgroundColor: paymentMethod === "offline" ? "#f0fdf4" : "#ffffff",
                  color: paymentMethod === "offline" ? COLORS.green : "#374151",
                  fontSize: "14px"
                }}
              >
                <div style={{ fontSize: "24px", marginBottom: "6px" }}>🏦</div>
                <div style={{ fontSize: "16px", fontWeight: "600" }}>Offline Payment</div>
                {paymentMethod === "offline" && <div style={{ fontWeight: "600", fontSize: "14px" }}>✓ Selected</div>}
              </button>
            </div>

            {paymentMethod === "offline" && (
              <div style={{
                backgroundColor: "#f8fafc",
                padding: "16px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                fontSize: "14px"
              }}>
                <div style={{ marginBottom: "12px", fontWeight: "600", fontSize: "16px" }}>Bank Details:</div>
                <div style={{ lineHeight: "1.6", marginBottom: "16px", fontSize: "14px" }}>
                  <div>Bank: Commercial Bank</div>
                  <div>Account: 8001234567</div>
                  <div>Name: Green Lion Pvt Ltd</div>
                </div>

                <label style={{
                  display: "block",
                  marginBottom: "10px",
                  fontWeight: "600",
                  color: "#059669",
                  fontSize: "16px"
                }}>
                  📎 Upload Bank Slip: *
                </label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.pdf"
                  onChange={handleFileUpload}
                  style={{
                    padding: "12px",
                    border: "1px solid #a7f3d0",
                    borderRadius: "6px",
                    width: "100%",
                    fontSize: "14px"
                  }}
                  required
                />
                <div style={{ marginTop: "6px", fontSize: "12px", color: "#666" }}>
                  JPG, JPEG, PDF | Max 5MB
                </div>
                {bankSlipFile && (
                  <div style={{ marginTop: "8px", fontSize: "12px", color: COLORS.green, fontWeight: "600" }}>
                    ✅ Uploaded successfully
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Place Order Button */}
        <div style={{
          display: "flex",
          justifyContent: "center"
        }}>
          <div style={{
            width: "40%",
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            borderRadius: "16px",
            boxShadow: "0 8px 32px rgba(16, 185, 129, 0.3)",
            padding: "24px",
            marginBottom: "24px",
            border: "none",
            textAlign: "center"
          }}>
          <button
            type="submit"
            disabled={creating}
            style={{
              background: creating ? "#6b7280" : "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)",
              color: creating ? "#ffffff" : "#059669",
              border: creating ? "none" : "3px solid rgba(255,255,255,0.4)",
              padding: "18px 32px",
              borderRadius: "12px",
              fontWeight: 800,
              width: "100%",
              cursor: creating ? "not-allowed" : "pointer",
              fontSize: "18px",
              boxShadow: creating ? "none" : "0 6px 20px rgba(255,255,255,0.3)",
              transition: "all 0.3s ease",
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}
          >
            {creating ? "Creating Order..." : `Place Order - LKR ${validItems.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)}`}
          </button>
          
          <div style={{
            textAlign: "center",
            marginTop: "16px",
            fontSize: "13px",
            color: "#ffffff",
            background: "rgba(255,255,255,0.15)",
            padding: "8px 12px",
            borderRadius: "8px",
            fontWeight: "500"
          }}>
            🔒 Your payment information is secure and encrypted
          </div>
          </div>
        </div>
      </form>
    </div>
  );
}