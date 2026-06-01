import React, { useEffect, useState, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { COLORS, radii, shadows } from "../theme";
import http from "../api/http";

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const receiptRef = useRef();

  useEffect(() => {
    // Get order details from location state or fetch from API
    if (location.state?.order) {
      setOrder(location.state.order);
      setPayment(location.state.payment);
      setLoading(false);
    } else if (orderId) {
      fetchOrderDetails();
    } else {
      navigate("/");
    }
  }, [orderId, location.state, navigate]);

  const fetchOrderDetails = async () => {
    try {
      const response = await http.get(`/api/orders/${orderId}`);
      if (response.data.success) {
        setOrder(response.data.order);
        setPayment(response.data.order.paymentId);
      }
    } catch (error) {
      console.error("Failed to fetch order details:", error);
      navigate("/my-orders");
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = async () => {
    setDownloading(true);
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      
      const element = receiptRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`Green-Lion-Order-${order.orderNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to download receipt. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: "60vh", 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center" 
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ 
            fontSize: "48px",
            margin: "0 auto 20px"
          }}>⏳</div>
          <p style={{ fontSize: "18px", color: "#666" }}>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ 
        minHeight: "60vh", 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center" 
      }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ color: "#f44336", marginBottom: "16px" }}>Order Not Found</h2>
          <p style={{ color: "#666", marginBottom: "20px" }}>
            The order you're looking for could not be found.
          </p>
          <button
            onClick={() => navigate("/my-orders")}
            style={{
              backgroundColor: COLORS.primary,
              color: "white",
              padding: "12px 24px",
              border: "none",
              borderRadius: radii.medium,
              cursor: "pointer",
              fontSize: "16px"
            }}
          >
            View My Orders
          </button>
        </div>
      </div>
    );
  }

  const containerStyle = {
    maxWidth: 900,
    margin: "24px auto",
    padding: "0 16px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  };

  const cardStyle = {
    backgroundColor: "white",
    borderRadius: radii.lg,
    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
    padding: "32px",
    marginBottom: "24px",
    border: "1px solid #e8e8e8",
    transition: "all 0.3s ease"
  };

  const receiptStyle = {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    margin: "20px 0"
  };

  const successStyle = {
    textAlign: "center",
    background: "linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%)",
    border: "3px solid #4CAF50",
    borderRadius: radii.lg,
    padding: "32px",
    marginBottom: "32px",
    position: "relative",
    overflow: "hidden"
  };

  const buttonStyle = {
    backgroundColor: COLORS.primary,
    color: "white",
    padding: "14px 28px",
    border: "none",
    borderRadius: radii.md,
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "600",
    textDecoration: "none",
    display: "inline-block",
    marginRight: "12px",
    marginBottom: "12px",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: "white",
    color: COLORS.primary,
    border: `2px solid ${COLORS.primary}`,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
  };

  const downloadButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#28a745",
    color: "white",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    margin: "0 auto 24px",
    fontSize: "16px",
    fontWeight: "700",
    boxShadow: "0 6px 16px rgba(40, 167, 69, 0.3)"
  };

  const CompanyHeader = () => (
    <div style={{
      textAlign: "center",
      padding: "20px 0",
      borderBottom: "3px solid #4CAF50",
      marginBottom: "20px"
    }}>
      <h1 style={{
        margin: "0",
        fontSize: "32px",
        fontWeight: "bold",
        background: "linear-gradient(135deg, #2E7D32, #4CAF50)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        textShadow: "2px 2px 4px rgba(0,0,0,0.1)"
      }}>
        🦁 GREEN LION COMPANY
      </h1>
      <p style={{
        margin: "8px 0 0 0",
        fontSize: "16px",
        color: "#666",
        fontWeight: "500"
      }}>
        Premium Quality Products & Services
      </p>
    </div>
  );

  return (
    <div style={containerStyle}>
      {/* Success Message */}
      <div style={successStyle}>
        <div style={{ 
          fontSize: "64px", 
          marginBottom: "20px",
          animation: "bounce 1s ease-in-out"
        }}>🎉</div>
        <h1 style={{ 
          color: "#2e7d32", 
          marginBottom: "12px", 
          fontSize: "32px",
          fontWeight: "bold",
          textShadow: "1px 1px 2px rgba(0,0,0,0.1)"
        }}>
          Order Placed Successfully!
        </h1>
        <p style={{ 
          color: "#388e3c", 
          fontSize: "20px", 
          margin: 0,
          fontWeight: "500"
        }}>
          Thank you for choosing Green Lion Company. We'll process your order shortly.
        </p>
      </div>

      {/* Download Receipt Button */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <button
          onClick={downloadReceipt}
          disabled={downloading}
          style={{
            ...downloadButtonStyle,
            opacity: downloading ? 0.7 : 1,
            cursor: downloading ? "not-allowed" : "pointer"
          }}
        >
          {downloading ? (
            <>
              <span>⏳</span>
              Generating PDF...
            </>
          ) : (
            <>
              <span>📄</span>
              Download Receipt
            </>
          )}
        </button>
      </div>

      {/* Receipt Content for PDF */}
      <div ref={receiptRef} style={receiptStyle}>
        <CompanyHeader />

        {/* Order Details in Receipt */}
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ 
            marginBottom: "24px", 
            color: "#2e7d32", 
            fontSize: "24px",
            fontWeight: "bold",
            borderBottom: "2px solid #4CAF50",
            paddingBottom: "8px"
          }}>Order Details</h2>
          
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr 1fr", 
            gap: "24px", 
            marginBottom: "32px",
            backgroundColor: "#f8f9fa",
            padding: "24px",
            borderRadius: "12px",
            border: "1px solid #e9ecef"
          }}>
            <div style={{ padding: "16px", backgroundColor: "white", borderRadius: "8px" }}>
              <strong style={{ color: "#495057", fontSize: "14px" }}>Order Number:</strong><br />
              <span style={{ color: COLORS.primary, fontSize: "20px", fontWeight: "bold" }}>
                #{order.orderNumber}
              </span>
            </div>
            <div style={{ padding: "16px", backgroundColor: "white", borderRadius: "8px" }}>
              <strong style={{ color: "#495057", fontSize: "14px" }}>Order Date:</strong><br />
              <span style={{ fontSize: "16px", fontWeight: "600" }}>
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <div style={{ padding: "16px", backgroundColor: "white", borderRadius: "8px" }}>
              <strong style={{ color: "#495057", fontSize: "14px" }}>Total Amount:</strong><br />
              <span style={{ fontSize: "24px", fontWeight: "bold", color: COLORS.primary }}>
                LKR {order.totalAmount.toFixed(2)}
              </span>
            </div>
            <div style={{ padding: "16px", backgroundColor: "white", borderRadius: "8px" }}>
              <strong style={{ color: "#495057", fontSize: "14px" }}>Status:</strong><br />
              <span style={{ 
                backgroundColor: order.status === 'pending' ? '#fff3cd' : '#d4edda',
                color: order.status === 'pending' ? '#856404' : '#155724',
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          </div>

          {/* Order Items */}
          <div style={{ marginTop: "32px" }}>
            <h3 style={{ 
              marginBottom: "20px", 
              color: "#2e7d32", 
              fontSize: "20px",
              fontWeight: "bold",
              borderBottom: "2px solid #4CAF50",
              paddingBottom: "8px"
            }}>Items Ordered</h3>
            <div style={{
              backgroundColor: "#f8f9fa",
              borderRadius: "12px",
              padding: "20px",
              border: "1px solid #e9ecef"
            }}>
              {order.items.map((item, index) => (
                <div key={index} style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  padding: "16px",
                  marginBottom: index < order.items.length - 1 ? "12px" : "0",
                  backgroundColor: "white",
                  borderRadius: "8px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                }}>
                  <div>
                    <div style={{ fontWeight: "700", color: "#333", fontSize: "16px", marginBottom: "4px" }}>
                      {item.productName}
                    </div>
                    <div style={{ color: "#666", fontSize: "14px", fontWeight: "500" }}>
                      Quantity: {item.quantity} × LKR {item.unitPrice.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ fontWeight: "700", color: COLORS.primary, fontSize: "18px" }}>
                    LKR {item.totalPrice.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div style={{ marginTop: "32px" }}>
          <h2 style={{ 
            marginBottom: "20px", 
            color: "#2e7d32", 
            fontSize: "20px",
            fontWeight: "bold",
            borderBottom: "2px solid #4CAF50",
            paddingBottom: "8px"
          }}>Delivery Address</h2>
          <div style={{ 
            backgroundColor: "#f8f9fa",
            padding: "24px",
            borderRadius: "12px",
            border: "1px solid #e9ecef",
            color: "#495057", 
            lineHeight: "1.8",
            fontSize: "16px"
          }}>
            <div style={{ fontWeight: "700", fontSize: "18px", color: "#2e7d32", marginBottom: "8px" }}>
              📍 {order.deliveryAddress.fullName}
            </div>
            <div style={{ fontWeight: "600", marginBottom: "4px" }}>
              📞 {order.deliveryAddress.phoneNumber}
            </div>
            <div style={{ marginBottom: "4px" }}>
              🏠 {order.deliveryAddress.address}
            </div>
            <div style={{ marginBottom: "8px" }}>
              🏙️ {order.deliveryAddress.city}, {order.deliveryAddress.postalCode}
            </div>
            {order.deliveryAddress.additionalNotes && (
              <div style={{ 
                marginTop: "12px", 
                fontStyle: "italic",
                backgroundColor: "#fff3cd",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ffeaa7"
              }}>
                📝 Note: {order.deliveryAddress.additionalNotes}
              </div>
            )}
          </div>
        </div>

        {/* Payment Information */}
        {payment && (
          <div style={{ marginTop: "32px" }}>
            <h2 style={{ 
              marginBottom: "20px", 
              color: "#2e7d32", 
              fontSize: "20px",
              fontWeight: "bold",
              borderBottom: "2px solid #4CAF50",
              paddingBottom: "8px"
            }}>Payment Information</h2>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 1fr", 
              gap: "20px",
              backgroundColor: "#f8f9fa",
              padding: "24px",
              borderRadius: "12px",
              border: "1px solid #e9ecef"
            }}>
              <div style={{ padding: "16px", backgroundColor: "white", borderRadius: "8px" }}>
                <strong style={{ color: "#495057", fontSize: "14px" }}>Payment Number:</strong><br />
                <span style={{ color: COLORS.primary, fontWeight: "bold", fontSize: "18px" }}>
                  #{payment.paymentNumber}
                </span>
              </div>
              <div style={{ padding: "16px", backgroundColor: "white", borderRadius: "8px" }}>
                <strong style={{ color: "#495057", fontSize: "14px" }}>Payment Type:</strong><br />
                <span style={{ fontSize: "16px", fontWeight: "600", textTransform: "capitalize" }}>
                  💳 {payment.paymentType.charAt(0).toUpperCase() + payment.paymentType.slice(1)}
                </span>
              </div>
              <div style={{ padding: "16px", backgroundColor: "white", borderRadius: "8px" }}>
                <strong style={{ color: "#495057", fontSize: "14px" }}>Amount:</strong><br />
                <span style={{ fontSize: "20px", fontWeight: "bold", color: COLORS.primary }}>
                  LKR {payment.amount.toFixed(2)}
                </span>
              </div>
              <div style={{ padding: "16px", backgroundColor: "white", borderRadius: "8px" }}>
                <strong style={{ color: "#495057", fontSize: "14px" }}>Status:</strong><br />
                <span style={{ 
                  backgroundColor: payment.status === 'pending' ? '#fff3cd' : 
                                 payment.status === 'approved' ? '#d4edda' : '#f8d7da',
                  color: payment.status === 'pending' ? '#856404' : 
                         payment.status === 'approved' ? '#155724' : '#721c24',
                  padding: "8px 12px",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                </span>
              </div>
            </div>
            
            {payment.paymentType === 'offline' && payment.offlinePayment?.customerNote && (
              <div style={{ marginTop: "20px" }}>
                <strong style={{ color: "#495057", fontSize: "16px" }}>Your Note:</strong><br />
                <div style={{ 
                  backgroundColor: "#fff3cd", 
                  padding: "16px", 
                  borderRadius: "8px", 
                  marginTop: "12px",
                  fontStyle: "italic",
                  border: "1px solid #ffeaa7",
                  fontSize: "15px",
                  lineHeight: "1.6"
                }}>
                  📝 {payment.offlinePayment.customerNote}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <button
          onClick={() => navigate("/my-orders")}
          style={buttonStyle}
          onMouseOver={(e) => e.target.style.transform = "translateY(-2px)"}
          onMouseOut={(e) => e.target.style.transform = "translateY(0)"}
        >
          📋 View All Orders
        </button>
        <button
          onClick={() => navigate("/products")}
          style={secondaryButtonStyle}
          onMouseOver={(e) => e.target.style.transform = "translateY(-2px)"}
          onMouseOut={(e) => e.target.style.transform = "translateY(0)"}
        >
          🛍️ Continue Shopping
        </button>
      </div>

      {/* Next Steps Info */}
      <div style={{
        background: "linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)",
        border: "2px solid #2196f3",
        borderRadius: radii.lg,
        padding: "32px",
        marginTop: "32px",
        boxShadow: "0 8px 24px rgba(33, 150, 243, 0.15)"
      }}>
        <h3 style={{ 
          color: "#1976d2", 
          marginBottom: "20px", 
          fontSize: "22px",
          fontWeight: "bold",
          textAlign: "center"
        }}>
          🚚 What's Next?
        </h3>
        <div style={{ 
          color: "#1565c0", 
          lineHeight: "2",
          fontSize: "16px",
          fontWeight: "500"
        }}>
          {payment?.paymentType === 'offline' ? (
            <>
              <p style={{ margin: "8px 0" }}>✅ Your payment is being verified by our team</p>
              <p style={{ margin: "8px 0" }}>📱 You'll receive an SMS/email once payment is confirmed</p>
              <p style={{ margin: "8px 0" }}>📦 Your order will be processed within 1-2 business days after payment confirmation</p>
              <p style={{ margin: "8px 0" }}>🚚 We'll notify you when your order is out for delivery</p>
            </>
          ) : (
            <>
              <p style={{ margin: "8px 0" }}>⚙️ Your order is being prepared</p>
              <p style={{ margin: "8px 0" }}>⏳ Processing will begin within 1-2 business days</p>
              <p style={{ margin: "8px 0" }}>🚚 We'll notify you when your order is out for delivery</p>
              <p style={{ margin: "8px 0" }}>📅 Expected delivery: 3-5 business days</p>
            </>
          )}
        </div>
        <div style={{
          textAlign: "center",
          marginTop: "24px",
          padding: "16px",
          backgroundColor: "rgba(255,255,255,0.7)",
          borderRadius: "12px",
          fontSize: "14px",
          color: "#37474f",
          fontWeight: "600"
        }}>
          📞 Need help? Contact us: support@greenlion.lk | +94 11 123 4567
        </div>
      </div>

      <style>
        {`
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
          }
        `}
      </style>
    </div>
  );
}