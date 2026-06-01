// Product Details page
// Shows a single product, image/PDF, pricing with discount, and customer feedback.
// Also lets users navigate to leave feedback for this product.
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import http from "../api/http";
import { COLORS, radii, shadows } from "../theme";
import Logo from "../assets/logo.png";
import { FaShoppingCart } from "react-icons/fa";
import { getCurrentUser, isLoggedIn } from "../auth";

export default function ProductDetails() {
  // --------------- Routing & State ---------------
  const { id } = useParams(); // product id from route (/products/:id)
  const navigate = useNavigate();
  const [product, setProduct] = useState(null); // loaded product
  const [error, setError] = useState(null); // error string for fetch failures
  const [feedbacks, setFeedbacks] = useState([]); // feedback list for this product
  const [addingToCart, setAddingToCart] = useState(false); // loading state for add to cart
  const [quantity, setQuantity] = useState(1); // quantity selector

  // --------------- Data loaders ---------------
  // Fetch feedbacks for this product
  const fetchFeedbacks = async () => {
    try {
      const { data } = await http.get(`/feedback`, { params: { productId: id } });
      setFeedbacks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch product & feedbacks whenever id changes
  useEffect(() => {
    // Fetch product
    (async () => {
      try {
        const { data } = await http.get(`/products/${id}`);
        if (data.ok) setProduct(data.product);
        else setError("Product not found");
      } catch (err) {
        console.error(err);
        setError("Failed to fetch product");
      }
    })();

    // Fetch feedbacks
    fetchFeedbacks();

    // When returning from feedback form, refetch on page visibility
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchFeedbacks();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [id]);

  // --------------- Early returns (loading/error) ---------------
  if (error)
    return <p style={{ textAlign: "center", marginTop: 50 }}>{error}</p>;
  if (!product)
    return <p style={{ textAlign: "center", marginTop: 50 }}>Loading product...</p>;

  // --------------- Cart handlers ---------------
  const handleAddToCart = async () => {
    if (!isLoggedIn()) {
      alert("Please login to add items to cart");
      navigate("/login");
      return;
    }

    if (!product || !product._id) {
      alert("Product information is not available");
      return;
    }

    if (!product.inStock) {
      alert("This product is currently out of stock");
      return;
    }

    setAddingToCart(true);
    try {
      const { data } = await http.post("/api/cart/add", {
        productId: product._id,
        quantity: quantity
      });

      if (data.success) {
        alert("Item added to cart successfully!");
        // Trigger cart count update
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        alert(data.message || "Failed to add item to cart");
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert("Please login to add items to cart");
        navigate("/login");
      } else {
        alert(error.response?.data?.message || "Failed to add item to cart");
      }
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isLoggedIn()) {
      alert("Please login to make a purchase");
      navigate("/login");
      return;
    }

    if (!product || !product._id) {
      alert("Product information is not available");
      return;
    }

    if (!product.inStock) {
      alert("This product is currently out of stock");
      return;
    }

    // Add to cart first, then navigate to checkout
    try {
      const { data } = await http.post("/api/cart/add", {
        productId: product._id,
        quantity: quantity
      });

      if (data.success) {
        // Navigate to checkout page
        navigate("/checkout");
      } else {
        alert(data.message || "Failed to add item to cart");
      }
    } catch (error) {
      console.error("Buy now error:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert("Please login to make a purchase");
        navigate("/login");
      } else {
        alert(error.response?.data?.message || "Failed to process request");
      }
    }
  };

  // --------------- Derived values & helpers ---------------
  const finalPrice =
    Number(product.unitPrice) - (Number(product.unitPrice) * Number(product.discountPercent || 0)) / 100;

  const getFileUrl = (filepath) => `${http.defaults.baseURL}/${filepath}`;

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: 24,
      }}
    >
      {/* Page Header: breadcrumb + title */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: 13,
            color: COLORS.muted,
            marginBottom: 8,
          }}
        >
          Home / Products / <span style={{ color: COLORS.text }}>{product.name}</span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: COLORS.green, margin: 0 }}>{product.name}</h1>
      </div>

      {/* Main content grid: left (media) | right (details) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 28,
          marginBottom: 40,
          backgroundColor: COLORS.white,
          borderRadius: radii.lg,
          boxShadow: shadows.card,
          padding: 20,
        }}
      >
        {/* Left Side - File (Image or PDF) */}
        <div>
          <div
            style={{
              width: "100%",
              height: 480,
              backgroundColor: "#f8fafc",
              borderRadius: radii.lg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
              overflow: "hidden",
              border: "1px solid #e5e7eb",
            }}
          >
            {product.file ? (
              product.file.toLowerCase().endsWith(".pdf") ? (
                <a
                  href={getFileUrl(product.file)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: COLORS.white,
                    backgroundColor: COLORS.green,
                    padding: "10px 16px",
                    borderRadius: radii.md,
                    fontWeight: 700,
                    textDecoration: "none",
                    boxShadow: shadows.sm,
                  }}
                >
                  View PDF
                </a>
              ) : (
                <img
                  src={getFileUrl(product.file)}
                  alt={product.name}
                  style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                />
              )
            ) : (
              <p style={{ color: COLORS.muted }}>No File Available</p>
            )}
          </div>
          {/* Thumbnails removed because backend stores a single file string */}
        </div>

        {/* Right Side - Product Details */}
        <div>
          {/* Category pill */}
          <div
            style={{
              display: "inline-block",
              padding: "6px 10px",
              borderRadius: 9999,
              backgroundColor: "#E8F5E8",
              color: COLORS.green,
              fontWeight: 700,
              fontSize: 12,
              marginBottom: 12,
              border: `1px solid ${COLORS.green}`,
            }}
          >
            {product.category}
          </div>

          {/* Stock Status */}
          <div style={{ marginBottom: 16 }}>
            {product.inStock ? (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 14px",
                background: "#ECFDF5",
                borderRadius: "8px",
                border: "1px solid #A7F3D0",
                width: "fit-content"
              }}>
                <div style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#10B981"
                }} />
                <span style={{
                  fontSize: "14px",
                  color: "#059669",
                  fontWeight: "700"
                }}>
                  In Stock {product.stockQuantity > 0 && product.stockQuantity <= 10 ? `(Only ${product.stockQuantity} left!)` : ''}
                </span>
              </div>
            ) : (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 14px",
                background: "#FEF2F2",
                borderRadius: "8px",
                border: "1px solid #FECACA",
                width: "fit-content"
              }}>
                <div style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#EF4444"
                }} />
                <span style={{
                  fontSize: "14px",
                  color: "#DC2626",
                  fontWeight: "700"
                }}>
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.text }}>
                LKR {finalPrice.toFixed(2)}
              </div>
              {product.discountPercent > 0 && (
                <span
                  style={{
                    backgroundColor: "#FEF2F2",
                    color: "#DC2626",
                    border: "1px solid #FECACA",
                    fontWeight: 800,
                    fontSize: 12,
                    padding: "4px 8px",
                    borderRadius: 9999,
                  }}
                >
                  -{product.discountPercent}%
                </span>
              )}
            </div>
            <div style={{ color: COLORS.muted, marginTop: 6, fontSize: 14 }}>
              <span style={{ textDecoration: product.discountPercent ? "line-through" : "none" }}>
                LKR {Number(product.unitPrice).toFixed(2)}
              </span>
            </div>
          </div>

          {product.description && (
            <div
              style={{
                backgroundColor: "#F9FAFB",
                padding: 16,
                borderRadius: radii.md,
                marginBottom: 24,
                lineHeight: 1.7,
                border: "1px solid #E5E7EB",
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, color: COLORS.text }}>
                Product Description
              </h2>
              <p style={{ fontSize: 15, whiteSpace: "pre-line", color: COLORS.text }}>{product.description}</p>
            </div>
          )}

          {/* Quantity Selector */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ 
              display: "block", 
              fontSize: 14, 
              fontWeight: 600, 
              color: COLORS.text, 
              marginBottom: 8 
            }}>
              Quantity:
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={!product.inStock}
                style={{
                  width: 36,
                  height: 36,
                  border: "1px solid #E5E7EB",
                  backgroundColor: COLORS.white,
                  borderRadius: radii.md,
                  cursor: product.inStock ? "pointer" : "not-allowed",
                  fontSize: 16,
                  fontWeight: 700,
                  opacity: product.inStock ? 1 : 0.5
                }}
              >
                -
              </button>
              <span style={{ 
                minWidth: 40, 
                textAlign: "center", 
                fontSize: 16, 
                fontWeight: 600 
              }}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                disabled={!product.inStock || (product.stockQuantity > 0 && quantity >= product.stockQuantity)}
                style={{
                  width: 36,
                  height: 36,
                  border: "1px solid #E5E7EB",
                  backgroundColor: COLORS.white,
                  borderRadius: radii.md,
                  cursor: (product.inStock && (product.stockQuantity === 0 || quantity < product.stockQuantity)) ? "pointer" : "not-allowed",
                  fontSize: 16,
                  fontWeight: 700,
                  opacity: (product.inStock && (product.stockQuantity === 0 || quantity < product.stockQuantity)) ? 1 : 0.5
                }}
              >
                +
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleAddToCart}
              disabled={addingToCart || !product.inStock}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                backgroundColor: (addingToCart || !product.inStock) ? "#9CA3AF" : COLORS.green,
                color: COLORS.white,
                border: "none",
                borderRadius: radii.md,
                padding: "12px 0",
                cursor: (addingToCart || !product.inStock) ? "not-allowed" : "pointer",
                fontWeight: 700,
                fontSize: 16,
                boxShadow: shadows.sm,
                opacity: !product.inStock ? 0.6 : 1
              }}
            >
              <FaShoppingCart /> {addingToCart ? "Adding..." : !product.inStock ? "Out of Stock" : "Add to Cart"}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={!product.inStock}
              style={{
                flex: 1,
                backgroundColor: !product.inStock ? "#9CA3AF" : "#3b82f6",
                color: COLORS.white,
                border: "none",
                borderRadius: radii.md,
                padding: "12px 0",
                cursor: product.inStock ? "pointer" : "not-allowed",
                fontWeight: 700,
                fontSize: 16,
                boxShadow: shadows.sm,
                opacity: !product.inStock ? 0.6 : 1
              }}
            >
              {!product.inStock ? "Out of Stock" : "Buy Now"}
            </button>
          </div>
        </div>
      </div>

      {/* --- Feedback Section --- */}
      <div
        style={{
          marginTop: 32,
          backgroundColor: COLORS.white,
          borderRadius: radii.lg,
          boxShadow: shadows.card,
          padding: 20,
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 800, color: COLORS.text, marginBottom: 16 }}>
          Customer Feedback
        </h2>
        {feedbacks.length > 0 ? (
          feedbacks.map((fb) => (
            <div
              key={fb._id}
              style={{ borderBottom: "1px solid #E5E7EB", padding: "10px 0" }}
            >
              <p>
                <b>{fb.name}</b> ({fb.email}) rated <b>{fb.rating}/5</b>
              </p>
              <p>{fb.comment}</p>
              {fb.reply && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    marginTop: 6,
                    backgroundColor: "#F9FAFB",
                    border: "1px solid #E5E7EB",
                    borderRadius: radii.md,
                    padding: 10,
                  }}
                >
                  <img
                    src={Logo}
                    alt="Green Lion"
                    style={{
                      width: 36,
                      height: 36,
                      objectFit: "contain",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E5E7EB",
                      borderRadius: 6,
                      padding: 4,
                    }}
                  />
                  <div style={{ color: COLORS.text, fontStyle: "italic", marginTop: 2 }}>{fb.reply}</div>
                </div>
              )}
            </div>
          ))
        ) : (
          <p>No feedbacks yet. Be the first to review!</p>
        )}

        <div style={{ marginTop: 20 }}>
          <button
            onClick={() => navigate(`/feedback/${product._id}`)}
            style={{
              backgroundColor: COLORS.green,
              color: COLORS.white,
              border: "none",
              padding: "10px 20px",
              borderRadius: radii.md,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: shadows.sm,
            }}
          >
            Leave Feedback
          </button>
        </div>
      </div>
    </div>
  );
}