import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser, isLoggedIn } from "../auth";
import http from "../api/http";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  // Handle scroll effect and user state
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    
    // Check user authentication status
    const checkUser = async () => {
      const currentUser = getCurrentUser();
      setUser(currentUser);
      if (currentUser && isLoggedIn()) {
        try {
          const { data } = await http.get("/api/cart/count");
          if (data && typeof data.totalItems === 'number') {
            setCartCount(data.totalItems);
          }
        } catch (error) {
          console.error("Failed to fetch cart count:", error);
        }
      } else {
        setCartCount(0);
      }
    };
    
    checkUser();
    window.addEventListener("storage", checkUser);
    const onCartUpdated = async () => {
      if (isLoggedIn()) {
        try {
          const { data } = await http.get("/api/cart/count");
          if (data && typeof data.totalItems === 'number') {
            setCartCount(data.totalItems);
          }
        } catch (error) {
          console.error("Failed to update cart count:", error);
        }
      }
    };
    window.addEventListener("cartUpdated", onCartUpdated);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("storage", checkUser);
      window.removeEventListener("cartUpdated", onCartUpdated);
    };
  }, []);

  // Refresh cart count when route changes (e.g., after checkout navigation)
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || !isLoggedIn()) {
      setCartCount(0);
      return;
    }
    (async () => {
      try {
        const { data } = await http.get("/api/cart/count");
        if (data && typeof data.totalItems === 'number') {
          setCartCount(data.totalItems);
        }
      } catch (error) {
        console.error("Failed to fetch cart count on route change:", error);
      }
    })();
  }, [location.pathname]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setCartCount(0); // Reset cart count on logout
    navigate("/login");
  };

  // Debug function to reset cart count
  const resetCartCount = async () => {
    if (isLoggedIn()) {
      try {
        await http.delete("/api/cart/clear");
        setCartCount(0);
        console.log("Cart cleared and count reset");
      } catch (error) {
        console.error("Failed to clear cart:", error);
      }
    }
  };

  // Handle search functionality
  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const navItems = [
    { title: "Home", path: "/" },
    { title: "Products", path: "/products" },
    { title: "About", path: "/about" },
    { title: "Contact", path: "/contact" }
  ];

  const isActive = (path) => location.pathname === path;

  // Helper function to navigate with scroll to top
  const navigateWithScrollToTop = (path) => {
    navigate(path);
    setTimeout(() => window.scrollTo(0, 0), 100);
  };

  return (
    <header style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      backgroundColor: isScrolled ? "rgba(255,255,255,0.98)" : "#ffffff",
      backdropFilter: "blur(20px)",
      borderBottom: isScrolled ? "1px solid #e5e7eb" : "none",
      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      boxShadow: isScrolled ? "0 8px 24px rgba(0,0,0,0.08)" : "none"
    }}>
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "0 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "72px"
      }}>
        {/* Logo Section - Enhanced Design */}
        <button 
          onClick={() => navigateWithScrollToTop("/")} 
          style={{ 
            textDecoration: "none", 
            display: "flex", 
            alignItems: "center", 
            background: "none", 
            border: "none", 
            cursor: "pointer" 
          }}
        >
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "16px"
          }}>
            {/* Logo Image - compact size */}
            <img
              src="/logo.png"
              alt="Green Lion Logo"
              style={{
                height: "56px",
                width: "auto",
                objectFit: "contain",
                borderRadius: "12px"
              }}
            />
          </div>
        </button>

        {/* Enhanced Navigation (hidden for admin) */}
        {(!user || user?.role !== 'admin') && (
          <nav style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: "#F0FDF4",
            padding: "8px",
            borderRadius: "16px",
            border: "1px solid #DCFCE7"
          }}>
            {navItems.map((item, index) => (
              <button
                key={index}
                onClick={() => navigateWithScrollToTop(item.path)}
                style={{
                  padding: "12px 20px",
                  borderRadius: "12px",
                  textDecoration: "none",
                  color: isActive(item.path) ? "#1E7F3B" : "#4B5563",
                  backgroundColor: isActive(item.path) ? "#DCFCE7" : "transparent",
                  fontWeight: isActive(item.path) ? "700" : "500",
                  fontSize: "14px",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  position: "relative",
                  overflow: "hidden",
                  border: "none",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.path)) {
                    e.target.style.backgroundColor = "#DCFCE7";
                    e.target.style.color = "#1E7F3B";
                    e.target.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.path)) {
                    e.target.style.backgroundColor = "transparent";
                    e.target.style.color = "#4B5563";
                    e.target.style.transform = "translateY(0)";
                  }
                }}
              >
                {item.title}
              </button>
            ))}
          </nav>
        )}

        {/* Right Section - Enhanced */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "20px"
        }}>
          {/* Enhanced Search Bar (hidden for admin) */}
          {(!user || user?.role !== 'admin') && (
            <div style={{
              position: "relative",
              display: "flex",
              alignItems: "center"
            }}>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearch}
                style={{
                  padding: "14px 20px",
                  border: "2px solid #E5E7EB",
                  borderRadius: "50px",
                  fontSize: "14px",
                  width: "240px",
                  backgroundColor: "#F9FAFB",
                  color: "#4B5563",
                  outline: "none",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  fontWeight: "500"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#1E7F3B";
                  e.target.style.backgroundColor = "white";
                  e.target.style.color = "#1E7F3B";
                  e.target.style.boxShadow = "0 0 0 4px rgba(30, 127, 59, 0.1)";
                  e.target.style.transform = "scale(1.02)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#E5E7EB";
                  e.target.style.backgroundColor = "#F9FAFB";
                  e.target.style.color = "#4B5563";
                  e.target.style.boxShadow = "none";
                  e.target.style.transform = "scale(1)";
                }}
              />
            </div>
          )}

          {/* Enhanced User Actions */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "16px"
          }}>
            {/* Show actions for logged-in users */}
            {user ? (
              <>
                {/* Cart Icon (hidden for admins and suppliers) */}
                {user?.role !== 'admin' && user?.role !== 'supplier' && (
                  <Link to="/cart" style={{
                    padding: "12px",
                    borderRadius: "50%",
                    textDecoration: "none",
                    color: "#1E7F3B",
                    border: "2px solid #1E7F3B",
                    backgroundColor: "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    position: "relative"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#F0FDF4";
                    e.target.style.color = "#1E7F3B";
                    e.target.style.transform = "translateY(-2px) scale(1.05)";
                    e.target.style.boxShadow = "0 8px 25px rgba(30, 127, 59, 0.2)";
                    e.target.style.borderColor = "#16A34A";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "transparent";
                    e.target.style.color = "#1E7F3B";
                    e.target.style.transform = "translateY(0) scale(1)";
                    e.target.style.boxShadow = "none";
                    e.target.style.borderColor = "#1E7F3B";
                  }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                    </svg>
                    {cartCount > 0 && !location.pathname.startsWith('/cart') && (
                      <span style={{
                        position: "absolute",
                        top: -4,
                        right: -4,
                        minWidth: 18,
                        height: 18,
                        padding: "0 5px",
                        borderRadius: 999,
                        background: "#ef4444",
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        lineHeight: 1
                      }}>{Math.min(cartCount,99)}</span>
                    )}
                  </Link>
                )}

                {/* Admin Dashboard (only for admin role) */}
                {user?.role === 'admin' && (
                  <Link to="/admin" style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    color: "#fff",
                    backgroundColor: "#1E7F3B",
                    border: "1px solid #166534",
                    fontWeight: 700,
                    fontSize: 14,
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#166534";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#1E7F3B";
                  }}
                  >
                    Admin Dashboard
                  </Link>
                )}

                {/* Supplier Dashboard (only for supplier role) */}
                {user?.role === 'supplier' && (
                  <Link to="/supplier" style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    color: "#fff",
                    backgroundColor: "#1E7F3B",
                    border: "1px solid #166534",
                    fontWeight: 700,
                    fontSize: 14,
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#166534";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#1E7F3B";
                  }}
                  >
                    Supplier Portal
                  </Link>
                )}

                {/* Profile Icon (for customers) */}
                {user?.role !== 'admin' && (
                  <Link
                    to="/profile"
                    style={{
                      padding: "12px",
                      borderRadius: "50%",
                      textDecoration: "none",
                      color: "#1E7F3B",
                      border: "2px solid #1E7F3B",
                      backgroundColor: "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      position: "relative"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#F0FDF4";
                      e.target.style.color = "#1E7F3B";
                      e.target.style.transform = "translateY(-2px) scale(1.05)";
                      e.target.style.boxShadow = "0 8px 25px rgba(30, 127, 59, 0.2)";
                      e.target.style.borderColor = "#16A34A";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "transparent";
                      e.target.style.color = "#1E7F3B";
                      e.target.style.transform = "translateY(0) scale(1)";
                      e.target.style.boxShadow = "none";
                      e.target.style.borderColor = "#1E7F3B";
                    }}
                    title={`${user.name || user.username || 'User'} - View Profile`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </Link>
                )}

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  style={{
                    padding: "12px 24px",
                    borderRadius: "50px",
                    border: "2px solid #DC2626",
                    backgroundColor: "transparent",
                    color: "#DC2626",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    position: "relative",
                    overflow: "hidden"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#DC2626";
                    e.target.style.color = "white";
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 8px 25px rgba(220, 38, 38, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "transparent";
                    e.target.style.color = "#DC2626";
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "none";
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {/* Sign In Button - Only show when not logged in */}
                <Link to="/login" style={{
                  padding: "12px 24px",
                  borderRadius: "50px",
                  textDecoration: "none",
                  color: "#1E7F3B",
                  border: "2px solid #1E7F3B",
                  fontWeight: "600",
                  fontSize: "14px",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  backgroundColor: "transparent",
                  position: "relative",
                  overflow: "hidden"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#1E7F3B";
                  e.target.style.color = "white";
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 8px 25px rgba(30, 127, 59, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.color = "#1E7F3B";
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "none";
                }}
                >
                  Sign In
                </Link>
                
                {/* Sign Up Button - Only show when not logged in */}
                <Link to="/signup" style={{
                  padding: "12px 24px",
                  borderRadius: "50px",
                  textDecoration: "none",
                  color: "white",
                  background: "linear-gradient(135deg, #1E7F3B 0%, #16A34A 100%)",
                  fontWeight: "700",
                  fontSize: "14px",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 4px 16px rgba(30, 127, 59, 0.25)",
                  position: "relative",
                  overflow: "hidden"
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-3px) scale(1.05)";
                  e.target.style.boxShadow = "0 12px 32px rgba(30, 127, 59, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0) scale(1)";
                  e.target.style.boxShadow = "0 4px 16px rgba(30, 127, 59, 0.25)";
                }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Enhanced Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "12px",
              borderRadius: "12px",
              transition: "all 0.3s ease"
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#F3F4F6";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "transparent";
            }}
          >
            <div style={{
              width: "24px",
              height: "3px",
              backgroundColor: "#1E7F3B",
              borderRadius: "2px",
              transition: "all 0.3s ease"
            }} />
            <div style={{
              width: "24px",
              height: "3px",
              backgroundColor: "#1E7F3B",
              borderRadius: "2px",
              transition: "all 0.3s ease"
            }} />
            <div style={{
              width: "24px",
              height: "3px",
              backgroundColor: "#1E7F3B",
              borderRadius: "2px",
              transition: "all 0.3s ease"
            }} />
          </button>
        </div>
      </div>

      {/* Enhanced Mobile Navigation Menu */}
      {isMenuOpen && (
        <div style={{
          backgroundColor: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid #E5E7EB",
          padding: "32px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)"
        }}>
          <nav style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}>
            {navItems.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  navigateWithScrollToTop(item.path);
                  setIsMenuOpen(false);
                }}
                style={{
                  padding: "20px",
                  borderRadius: "16px",
                  textDecoration: "none",
                  color: isActive(item.path) ? "#1E7F3B" : "#4B5563",
                  backgroundColor: isActive(item.path) ? "#F0FDF4" : "transparent",
                  fontWeight: isActive(item.path) ? "700" : "500",
                  fontSize: "18px",
                  border: isActive(item.path) ? "2px solid #1E7F3B" : "2px solid transparent",
                  transition: "all 0.3s ease",
                  cursor: "pointer"
                }}
              >
                {item.title}
              </button>
            ))}
            
            {/* Cart link for mobile */}
            {user && user.role !== 'admin' && (
              <Link
                to="/cart"
                onClick={() => setIsMenuOpen(false)}
                style={{
                  padding: "20px",
                  borderRadius: "16px",
                  textDecoration: "none",
                  color: isActive("/cart") ? "#1E7F3B" : "#4B5563",
                  backgroundColor: isActive("/cart") ? "#F0FDF4" : "transparent",
                  fontWeight: isActive("/cart") ? "700" : "500",
                  fontSize: "18px",
                  border: isActive("/cart") ? "2px solid #1E7F3B" : "2px solid transparent",
                  transition: "all 0.3s ease"
                }}
              >
                Cart
              </Link>
            )}
          </nav>
          
          <div style={{
            marginTop: "32px",
            paddingTop: "32px",
            borderTop: "2px solid #E5E7EB",
            display: "flex",
            flexDirection: "column",
            gap: "16px"
          }}>
            {user ? (
              <>
                {/* Show user info and logout for mobile */}
                <div style={{
                  padding: "16px",
                  backgroundColor: "#F0FDF4",
                  borderRadius: "12px",
                  textAlign: "center",
                  border: "2px solid #DCFCE7"
                }}>
                  <div style={{ color: "#1E7F3B", fontWeight: "600", marginBottom: "8px" }}>
                    Welcome, {user.name || user.username}!
                  </div>
                  <div style={{ color: "#4B5563", fontSize: "14px" }}>
                    Role: {user.role}
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  style={{
                    padding: "18px 24px",
                    borderRadius: "16px",
                    border: "2px solid #DC2626",
                    backgroundColor: "transparent",
                    color: "#DC2626",
                    fontWeight: "700",
                    fontSize: "18px",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.3s ease"
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {/* Show signin/signup for mobile when not logged in */}
                <Link to="/login" style={{
                  padding: "18px 24px",
                  borderRadius: "16px",
                  textDecoration: "none",
                  color: "#1E7F3B",
                  border: "2px solid #1E7F3B",
                  fontWeight: "700",
                  fontSize: "18px",
                  textAlign: "center",
                  backgroundColor: "transparent",
                  transition: "all 0.3s ease"
                }}>
                  Sign In
                </Link>
                <Link to="/signup" style={{
                  padding: "18px 24px",
                  borderRadius: "16px",
                  textDecoration: "none",
                  color: "white",
                  background: "linear-gradient(135deg, #1E7F3B 0%, #16A34A 100%)",
                  fontWeight: "700",
                  fontSize: "18px",
                  textAlign: "center",
                  boxShadow: "0 8px 24px rgba(30, 127, 59, 0.3)"
                }}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
