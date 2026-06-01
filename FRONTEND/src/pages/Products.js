import { useEffect, useState } from "react";
import http from "../api/http";
import { COLORS, radii, shadows } from "../theme";
import { FaShoppingCart, FaSearch, FaFilter, FaTimes, FaHeart, FaStar } from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CardSkeleton } from "../components/ui/Loading";

export default function Products() {
  const [list, setList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [adding, setAdding] = useState({}); // productId => boolean
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState({});
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [sortBy, setSortBy] = useState("name");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
      const { data } = await http.get("/products");
      if (data.ok) {
        setList(data.products);
        setFilteredList(data.products);
        const cats = ["All", ...new Set(data.products.map(p => p.category))];
        setCategories(cats);
          
          // Calculate price range
          const prices = data.products.map(p => p.unitPrice);
          setPriceRange({
            min: Math.min(...prices),
            max: Math.max(...prices)
          });
        }
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Handle search parameter from URL
  useEffect(() => {
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      setSearch(searchQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    let temp = [...list];

    // Filter by category
    if (selectedCategory !== "All") {
      temp = temp.filter(p => p.category === selectedCategory);
    }

    // Filter by search
    if (search.trim() !== "") {
      temp = temp.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sort
    temp.sort((a, b) => {
      if (sortBy === "price-low") return a.unitPrice - b.unitPrice;
      if (sortBy === "price-high") return b.unitPrice - a.unitPrice;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

    setFilteredList(temp);
  }, [list, selectedCategory, search, sortBy]);

  const addToCart = async (productId, qty = 1) => {
    // Require customer login
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      setAdding(prev => ({ ...prev, [productId]: true }));
      await http.post("/api/cart/add", { productId, quantity: qty });
      // Notify header to refresh badge
      try { window.dispatchEvent(new Event("cartUpdated")); } catch {}
      
      // Show success feedback
      alert("Product added to cart!");
    } catch (err) {
      const serverMsg = err?.response?.data?.message;
      const msg = serverMsg ? `Failed to add to cart: ${serverMsg}` : (err?.message || "Failed to add to cart");
      alert(msg);
    } finally {
      setAdding(prev => ({ ...prev, [productId]: false }));
    }
  };

  const toggleWishlist = (productId) => {
    setWishlist(prev => ({ ...prev, [productId]: !prev[productId] }));
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("All");
    setSortBy("name");
  };

  const calculateDiscount = (price, discountPercent) => {
    if (!discountPercent || discountPercent === 0) return null;
    return price - (price * discountPercent / 100);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F8F9FA" }}>
      {/* Creative Header Section */}
      <div style={{
        paddingTop: "60px",
        paddingBottom: "32px",
        background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 50%, #ffffff 100%)",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Decorative Background Elements */}
        <div style={{
          position: "absolute",
          top: "-50px",
          right: "-50px",
          width: "200px",
          height: "200px",
          background: "linear-gradient(135deg, rgba(30, 127, 59, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)",
          borderRadius: "50%",
          filter: "blur(40px)"
        }} />
        <div style={{
          position: "absolute",
          bottom: "-30px",
          left: "-30px",
          width: "150px",
          height: "150px",
          background: "linear-gradient(135deg, rgba(30, 127, 59, 0.03) 0%, rgba(16, 185, 129, 0.03) 100%)",
          borderRadius: "50%",
          filter: "blur(30px)"
        }} />

        <div style={{ 
          maxWidth: "1400px", 
          margin: "0 auto", 
          padding: "0 24px",
          position: "relative",
          zIndex: 1
        }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "20px"
          }}>
            {/* Left Side - Title & Description */}
            <div>
              <h1 style={{
                fontSize: "2rem",
                fontWeight: "800",
                background: "linear-gradient(135deg, #111827 0%, #1E7F3B 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                margin: 0,
                marginBottom: "10px"
              }}>
                Our Products
              </h1>
              <p style={{
                fontSize: "0.95rem",
                color: "#6B7280"
              }}>
                Discover eco-friendly solutions for your needs ✨
              </p>
            </div>

            {/* Right Side - Stats */}
            <div style={{ 
              display: "flex", 
              gap: "24px",
              flexWrap: "wrap"
            }}>
              <div style={{
                background: "white",
                padding: "12px 20px",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                border: "1px solid #E5E7EB"
              }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#1E7F3B" }}>
                  {list.length}+
                </div>
                <div style={{ fontSize: "0.75rem", color: "#6B7280", fontWeight: "600" }}>
                  Products
                </div>
              </div>
              <div style={{
                background: "white",
                padding: "12px 20px",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                border: "1px solid #E5E7EB"
              }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#1E7F3B" }}>
                  {categories.length - 1}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#6B7280", fontWeight: "600" }}>
                  Categories
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px 24px 48px" }}>
        {/* Modern Filters Bar */}
        <div style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "28px",
          padding: "20px",
          background: "white",
          borderRadius: "12px",
          border: "1px solid #E5E7EB",
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)"
        }}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", flex: 1, alignItems: "center" }}>
            {/* Search Bar */}
            <div style={{ position: "relative", flex: "1 1 280px", minWidth: "200px" }}>
                <FaSearch style={{
                  position: "absolute",
                left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                color: "#9CA3AF",
                fontSize: "14px"
                }} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "11px 14px 11px 40px",
                  border: "1px solid #E5E7EB",
                  borderRadius: "10px",
                  fontSize: "0.9rem",
                  outline: "none",
                  transition: "all 0.2s ease",
                  background: "#F9FAFB"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#1E7F3B";
                  e.target.style.background = "white";
                  e.target.style.boxShadow = "0 0 0 3px rgba(30, 127, 59, 0.08)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#E5E7EB";
                  e.target.style.background = "#F9FAFB";
                  e.target.style.boxShadow = "none";
                }}
                />
              </div>

            {/* Category Dropdown */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: "11px 36px 11px 14px",
                border: "1px solid #E5E7EB",
                borderRadius: "10px",
                fontSize: "0.9rem",
                fontWeight: "500",
                color: "#374151",
                cursor: "pointer",
                outline: "none",
                background: "#F9FAFB",
                transition: "all 0.2s ease",
                minWidth: "140px"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#1E7F3B";
                e.target.style.background = "white";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#E5E7EB";
                e.target.style.background = "#F9FAFB";
              }}
        >
          {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

            {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "11px 36px 11px 14px",
                border: "1px solid #E5E7EB",
                borderRadius: "10px",
                fontSize: "0.9rem",
                fontWeight: "500",
                color: "#374151",
                cursor: "pointer",
                outline: "none",
                background: "#F9FAFB",
                transition: "all 0.2s ease",
                minWidth: "160px"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#1E7F3B";
                e.target.style.background = "white";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#E5E7EB";
                e.target.style.background = "#F9FAFB";
              }}
            >
              <option value="name">Sort: A-Z</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>

            {/* Clear Filters Button */}
            {(search || selectedCategory !== "All" || sortBy !== "name") && (
              <button
                onClick={clearFilters}
                style={{
                  padding: "11px 18px",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#6B7280",
                  background: "#F3F4F6",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#E5E7EB";
                  e.target.style.color = "#374151";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "#F3F4F6";
                  e.target.style.color = "#6B7280";
                }}
              >
                <FaTimes size={12} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div style={{ 
          marginBottom: "28px", 
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px"
        }}>
          <div style={{
            color: "#374151", 
            fontSize: "0.9rem",
            fontWeight: "500"
          }}>
            <strong style={{ color: "#111827", fontWeight: "700", fontSize: "1.05rem" }}>{filteredList.length}</strong> {filteredList.length === 1 ? 'Product' : 'Products'} Found
          </div>
      </div>

        {/* Loading Skeletons */}
        {loading && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px"
          }}>
            {[1, 2, 3, 4, 5, 6].map(i => <CardSkeleton key={i} />)}
          </div>
        )}

      {/* Products Grid */}
        {!loading && (
          <div style={{
          display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px",
          }}>
            {filteredList.map((p, idx) => {
              const discountedPrice = calculateDiscount(p.unitPrice, p.discountPercent);
              
              return (
          <div
            key={p._id}
            style={{
                    padding: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
                    position: "relative",
                    background: "white",
                    borderRadius: "12px",
                    border: "1px solid #E5E7EB",
                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
                    cursor: "pointer"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-6px)";
                    e.currentTarget.style.boxShadow = "0 20px 40px rgba(0, 0, 0, 0.12)";
                    e.currentTarget.style.borderColor = "#D1D5DB";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.04)";
                    e.currentTarget.style.borderColor = "#E5E7EB";
                  }}
                >
                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(p._id);
                    }}
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      background: "rgba(255, 255, 255, 0.95)",
                      backdropFilter: "blur(8px)",
                      border: "none",
                      borderRadius: "50%",
                      width: "36px",
                      height: "36px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                      zIndex: 2,
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "scale(1.1)";
                      e.target.style.background = "white";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "scale(1)";
                      e.target.style.background = "rgba(255, 255, 255, 0.95)";
                    }}
                  >
                    <FaHeart 
                      size={16} 
                      color={wishlist[p._id] ? "#EF4444" : "#9CA3AF"}
                      style={{ transition: "color 0.2s ease" }}
                    />
                  </button>

                  {/* Discount Badge */}
                  {p.discountPercent > 0 && (
                    <div style={{
                      position: "absolute",
                      top: "10px",
                      left: "10px",
                      background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
                      color: "white",
                      padding: "6px 10px",
                      borderRadius: "8px",
                      fontSize: "0.7rem",
                      fontWeight: "700",
                      zIndex: 2,
                      boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
                      letterSpacing: "0.5px"
                    }}>
                      -{p.discountPercent}% OFF
                    </div>
                  )}

                  {/* Product Image */}
                  <div
                    onClick={() => {
                      navigate(`/products/${p._id}`);
                      // Scroll to top when navigating to product details
                      setTimeout(() => window.scrollTo(0, 0), 100);
                    }}
              style={{
                      height: "260px",
                      background: "#F9FAFB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                      cursor: "pointer",
                      overflow: "hidden",
                      position: "relative"
              }}
            >
              {p.file && (
                p.file.toLowerCase().endsWith(".pdf") ? (
                        <div style={{ 
                          textAlign: "center",
                          color: "#1E7F3B",
                          fontWeight: 600,
                          fontSize: "0.9rem"
                        }}>
                          📄 PDF Available
                        </div>
                ) : (
                  <img
                    src={`http://localhost:5000/${p.file}`}
                    alt={p.name}
                    style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                          }}
                          onMouseEnter={(e) => e.target.style.transform = "scale(1.08)"}
                          onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                  />
                )
              )}
            </div>

            {/* Product Details */}
                  <div style={{ padding: "18px", flex: 1, display: "flex", flexDirection: "column" }}>
                    {/* Category Badge */}
                    <div style={{ marginBottom: "10px" }}>
                      <span style={{
                        background: "#F3F4F6",
                        color: "#6B7280",
                        fontSize: "0.7rem",
                        fontWeight: "600",
                        padding: "5px 10px",
                        borderRadius: "6px",
                        display: "inline-block",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px"
                      }}>
                        {p.category}
                      </span>
                    </div>

                    {/* Product Name */}
                    <h3
                      onClick={() => {
                        navigate(`/products/${p._id}`);
                        // Scroll to top when navigating to product details
                        setTimeout(() => window.scrollTo(0, 0), 100);
                      }}
              style={{
                        fontWeight: 700,
                        fontSize: "1.05rem",
                        marginBottom: "8px",
                        color: "#111827",
                        cursor: "pointer",
                        lineHeight: 1.3,
                        transition: "color 0.2s ease",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                  }}
                  onMouseEnter={(e) => e.target.style.color = "#1E7F3B"}
                  onMouseLeave={(e) => e.target.style.color = "#111827"}
                >
                  {p.name}
                    </h3>

                    {/* Description */}
                    {p.description && (
                      <p style={{
                        color: "#6B7280",
                        fontSize: "0.85rem",
                        marginBottom: "14px",
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}>
                        {p.description}
                      </p>
                    )}

                    {/* Rating (Mock) */}
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "14px" }}>
                      <div style={{ display: "flex", gap: "1px", color: "#FBBF24" }}>
                        {[1, 2, 3, 4, 5].map(i => <FaStar key={i} size={12} />)}
                      </div>
                      <span style={{ 
                        marginLeft: "2px", 
                        color: "#6B7280", 
                        fontSize: "0.8rem",
                        fontWeight: "600"
                      }}>
                        4.9 <span style={{ color: "#9CA3AF", fontWeight: "400" }}>(128)</span>
                      </span>
                </div>

                    {/* Stock Status */}
                    <div style={{ marginBottom: "12px" }}>
                      {p.inStock ? (
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}>
                          <div style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: "#10B981"
                          }} />
                          <span style={{
                            fontSize: "0.8rem",
                            color: "#10B981",
                            fontWeight: "600"
                          }}>
                            In Stock {p.stockQuantity > 0 && p.stockQuantity <= 10 ? `(${p.stockQuantity} left)` : ''}
                          </span>
                        </div>
                      ) : (
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}>
                          <div style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: "#EF4444"
                          }} />
                          <span style={{
                            fontSize: "0.8rem",
                            color: "#EF4444",
                            fontWeight: "600"
                          }}>
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Price */}
                    <div style={{ marginBottom: "16px", marginTop: "auto" }}>
                      {discountedPrice ? (
                        <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                          <div style={{
                            fontWeight: 800,
                            fontSize: "1.4rem",
                            color: "#1E7F3B",
                            letterSpacing: "-0.5px"
                          }}>
                            LKR {Number(discountedPrice).toFixed(2)}
                </div>
                          <div style={{
                            fontSize: "0.85rem",
                            color: "#9CA3AF",
                            textDecoration: "line-through",
                            fontWeight: "500"
                          }}>
                  LKR {Number(p.unitPrice).toFixed(2)}
                </div>
                        </div>
                      ) : (
                        <div style={{
                          fontWeight: 800,
                          fontSize: "1.4rem",
                          color: "#1E7F3B",
                          letterSpacing: "-0.5px"
                        }}>
                          LKR {Number(p.unitPrice).toFixed(2)}
                        </div>
                      )}
              </div>

              {/* Action Buttons */}
                    <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!p.inStock) {
                      alert("This product is currently out of stock");
                      return;
                    }
                    addToCart(p._id, 1);
                  }}
                        disabled={!!adding[p._id] || !p.inStock}
                  style={{
                    flex: 1,
                          fontSize: "0.85rem",
                          fontWeight: "600",
                          padding: "12px 16px",
                          background: (!p.inStock || adding[p._id]) ? "#9CA3AF" : "#1E7F3B",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          cursor: (!p.inStock || adding[p._id]) ? "not-allowed" : "pointer",
                          transition: "all 0.2s ease",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          opacity: !p.inStock ? 0.6 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (!adding[p._id] && p.inStock) {
                            e.target.style.background = "#166534";
                            e.target.style.transform = "translateY(-1px)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!adding[p._id] && p.inStock) {
                            e.target.style.background = "#1E7F3B";
                            e.target.style.transform = "translateY(0)";
                          }
                        }}
                      >
                        {adding[p._id] ? (
                          <span className="spinner-sm" />
                        ) : !p.inStock ? (
                          "Out of Stock"
                        ) : (
                          <>
                            <FaShoppingCart size={14} /> Add
                          </>
                        )}
                </button>

                <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/products/${p._id}`);
                          // Scroll to top when navigating to product details
                          setTimeout(() => window.scrollTo(0, 0), 100);
                        }}
                  style={{
                          padding: "12px 16px",
                          background: "#F3F4F6",
                          color: "#374151",
                          border: "none",
                          borderRadius: "8px",
                          fontSize: "0.85rem",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = "#E5E7EB";
                          e.target.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = "#F3F4F6";
                          e.target.style.transform = "translateY(0)";
                        }}
                      >
                        View
                </button>
              </div>
                  </div>
            </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredList.length === 0 && (
          <div style={{
            padding: "80px 40px",
            textAlign: "center",
            background: "white",
            borderRadius: "12px",
            border: "1px solid #E5E7EB"
          }}>
            <div style={{ 
              fontSize: "4rem", 
              marginBottom: "20px", 
              opacity: 0.4,
              filter: "grayscale(100%)"
            }}>
              📦
            </div>
            <h3 style={{ 
              fontSize: "1.4rem", 
              fontWeight: "700", 
              color: "#111827",
              marginBottom: "10px",
              letterSpacing: "-0.02em"
            }}>
            No Products Found
            </h3>
            <p style={{ 
              color: "#6B7280", 
              marginBottom: "28px", 
              fontSize: "0.95rem",
              maxWidth: "400px",
              margin: "0 auto 28px"
            }}>
              We couldn't find any products matching your criteria. Try adjusting your filters.
          </p>
            <button 
              onClick={clearFilters}
              style={{
                padding: "12px 28px",
                fontSize: "0.9rem",
                fontWeight: "600",
                background: "#1E7F3B",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#166534";
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 4px 12px rgba(30, 127, 59, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "#1E7F3B";
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
              }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
