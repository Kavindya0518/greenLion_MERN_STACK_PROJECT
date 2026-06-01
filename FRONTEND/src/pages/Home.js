import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaLeaf, FaIndustry, FaGlobe, FaCheckCircle, FaStar, FaArrowRight, FaUsers, FaShoppingCart, FaTrophy } from "react-icons/fa";
import http from "../api/http";

// Import images from assets folder
import slider1Image from "../assets/slider4.jpeg";
import slider2Image from "../assets/slider2.jpeg";
import slider3Image from "../assets/slider3.jpeg";

export default function Home() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentWord, setCurrentWord] = useState(0);
  const [stats, setStats] = useState({ 
    customers: 0, 
    products: 0, 
    orders: 0, 
    categories: 0 
  });
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper function to navigate with scroll to top
  const navigateWithScrollToTop = (path) => {
    navigate(path);
    setTimeout(() => window.scrollTo(0, 0), 100);
  };

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Slider Images
  const sliderImages = [
    {
      id: 1,
      image: slider1Image,
      title: "Premium Cocopeat Products",
      subtitle: "Sustainable Growing Solutions for Modern Agriculture",
      description:
        "High-quality cocopeat substrates for hydroponics, gardening, and commercial farming",
    },
    {
      id: 2,
      image: slider2Image,
      title: "Natural Coir Fiber Solutions",
      subtitle: "Eco-Friendly Textiles and Industrial Applications",
      description:
        "Durable coir fibers for ropes, mats, erosion control, and sustainable packaging",
    },
    {
      id: 3,
      image: slider3Image,
      title: "Advanced Processing Technology",
      subtitle: "State-of-the-Art Manufacturing Facilities",
      description:
        "Modern processing plants ensuring consistent quality and sustainable production",
    },
  ];

  // Fetch real data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch products
        const productsRes = await http.get("/products");
        const products = productsRes.data?.products || [];
        const productCount = products.length;
        
        // Get unique categories
        const categories = [...new Set(products.map(p => p.category))];
        const categoryCount = categories.length;
        
        // Fetch orders (if available)
        let orderCount = 0;
        try {
          const ordersRes = await http.get("/api/orders");
          orderCount = ordersRes.data?.orders?.length || 0;
        } catch (err) {
          console.log("Orders not available");
        }
        
        // Fetch feedback/testimonials (if available)
        let feedbackList = [];
        try {
          const feedbackRes = await http.get("/api/feedback");
          feedbackList = feedbackRes.data?.feedbacks || feedbackRes.data?.feedback || [];
        } catch (err) {
          console.log("Feedback not available");
        }
        
        // Animate stats counter with real data
        const targets = { 
          products: productCount,
          orders: orderCount,
          categories: categoryCount,
          customers: orderCount // Approximate customers from orders
        };
        
        const duration = 2000;
        const steps = 60;
        const stepDuration = duration / steps;

        let step = 0;
        const timer = setInterval(() => {
          step++;
          const progress = step / steps;
          setStats({
            products: Math.floor(targets.products * progress),
            orders: Math.floor(targets.orders * progress),
            categories: Math.floor(targets.categories * progress),
            customers: Math.floor(targets.customers * progress),
          });
          if (step >= steps) clearInterval(timer);
        }, stepDuration);

        // Set testimonials from real feedback
        if (feedbackList.length > 0) {
          const formattedTestimonials = feedbackList.slice(0, 3).map(feedback => ({
            name: feedback.customerName || feedback.name || "Customer",
            role: "Verified Customer",
            content: feedback.comment || feedback.message || feedback.feedback,
            rating: feedback.rating || 5,
            avatar: (feedback.customerName || feedback.name || "C").substring(0, 2).toUpperCase()
          }));
          setTestimonials(formattedTestimonials);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Auto slide
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [sliderImages.length]);

  // Word slider in hero
  const words = ["Eco-Friendly", "Sustainable", "Premium Quality", "Trusted"];
  useEffect(() => {
    const wordTimer = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % words.length);
    }, 2000);
    return () => clearInterval(wordTimer);
  }, [words.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + sliderImages.length) % sliderImages.length
    );
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const features = [
    { 
      icon: <FaLeaf size={36} />, 
      title: "Eco-Friendly", 
      text: "100% sustainable and biodegradable products made from natural coconut fibers.",
      color: "#22C55E"
    },
    { 
      icon: <FaIndustry size={36} />, 
      title: "Modern Tech", 
      text: "State-of-the-art manufacturing facilities with ISO certified processes.",
      color: "#3B82F6"
    },
    { 
      icon: <FaGlobe size={36} />, 
      title: "Global Reach", 
      text: "Supplying premium coir products to customers worldwide.",
      color: "#F59E0B"
    },
    { 
      icon: <FaCheckCircle size={36} />, 
      title: "Quality Assured", 
      text: "Rigorous testing and quality control at every stage of production.",
      color: "#8B5CF6"
    },
  ];

  return (
    <>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ minHeight: "100vh", backgroundColor: "#F8F9FA" }}>
      {/* Hero Slider */}
      <section style={{ position: "relative", height: "60vh", overflow: "hidden" }}>
        <div style={{ position: "relative", height: "100%" }}>
          {sliderImages.map((slide, index) => (
            <div
              key={slide.id}
              className={index === currentSlide ? "animate-fadeIn" : ""}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                opacity: index === currentSlide ? 1 : 0,
                transition: "opacity 1s ease-in-out",
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url(${slide.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  color: "white",
                  maxWidth: "900px",
                  padding: "0 20px",
                }}
              >
                
                <h1
                  className="heading-1"
                  style={{
                    fontSize: "4rem",
                    fontWeight: "900",
                    margin: "0 0 20px 0",
                    textShadow: "2px 4px 10px rgba(0,0,0,0.6)",
                    color: "white",
                    lineHeight: 1.1
                  }}
                >
                  {slide.title}
                </h1>
                
                <div style={{ 
                  height: "60px", 
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <h2
                    className="animate-pulse"
                    style={{
                      fontSize: "2.5rem",
                      fontWeight: "800",
                      margin: 0,
                      background: "linear-gradient(135deg, #C6F6D5 0%, #22C55E 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {words[currentWord]}
                  </h2>
                </div>
                
                <p
                  style={{
                    fontSize: "1.3rem",
                    margin: "0 0 40px 0",
                    lineHeight: "1.7",
                    color: "#E5E7EB",
                    fontWeight: 400
                  }}
                >
                  {slide.description}
                </p>
                
                <div
                  style={{
                    display: "flex",
                    gap: "20px",
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={() => navigateWithScrollToTop("/products")}
                    className="btn btn-primary btn-lg hover-lift"
                    style={{
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "10px",
                      cursor: "pointer"
                    }}
                  >
                    Explore Products <FaArrowRight />
                  </button>
                  <button
                    onClick={() => navigateWithScrollToTop("/contact")}
                    className="btn btn-outline btn-lg"
                    style={{
                      textDecoration: "none",
                      background: "rgba(255, 255, 255, 0.1)",
                      backdropFilter: "blur(10px)",
                      border: "2px solid white",
                      color: "white",
                      cursor: "pointer"
                    }}
                  >
                    Get Quote
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {/* Slide Indicators */}
          <div
              style={{
                position: "absolute",
                bottom: "50px",
                left: "50%",
                transform: "translateX(-50%)",
              display: "flex",
              gap: "15px",
              zIndex: 10,
              padding: "10px 20px",
              background: "rgba(0, 0, 0, 0.3)",
              borderRadius: "25px",
              backdropFilter: "blur(10px)"
            }}
          >
            {sliderImages.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className="hover-scale"
                style={{
                  width: index === currentSlide ? "35px" : "15px",
                  height: "15px",
                  borderRadius: "8px",
                  border: "2px solid rgba(255, 255, 255, 0.8)",
                  background: index === currentSlide ? "white" : "rgba(255, 255, 255, 0.3)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)"
                }}
              />
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <button
          onClick={prevSlide}
          className="hover-scale"
          style={{
            position: "absolute",
            left: "30px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "rgba(255, 255, 255, 0.95)",
            border: "none",
            borderRadius: "50%",
            width: "60px",
            height: "60px",
            cursor: "pointer",
            fontSize: "24px",
            color: "var(--color-primary)",
            boxShadow: "var(--shadow-xl)",
            transition: "all 0.3s ease",
            zIndex: 10
          }}
        >
          ‹
        </button>
        <button
          onClick={nextSlide}
          className="hover-scale"
          style={{
            position: "absolute",
            right: "30px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "rgba(255, 255, 255, 0.95)",
            border: "none",
            borderRadius: "50%",
            width: "60px",
            height: "60px",
            cursor: "pointer",
            fontSize: "24px",
            color: "var(--color-primary)",
            boxShadow: "var(--shadow-xl)",
            transition: "all 0.3s ease",
            zIndex: 10
          }}
        >
          ›
        </button>
      </section>

      {/* Modern Stats Section */}
      <section style={{ 
        background: "white", 
        paddingTop: "80px", 
        paddingBottom: "80px",
        marginTop: "-40px", 
        position: "relative", 
        zIndex: 5 
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "32px",
            background: "white",
            padding: "60px 40px",
            borderRadius: "20px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
            border: "1px solid #F3F4F6"
          }}>
            {[
              { icon: <FaShoppingCart size={28} />, value: stats.products, label: "Products Available", suffix: "", color: "#1E7F3B" },
              { icon: <FaTrophy size={28} />, value: stats.orders, label: "Orders Completed", suffix: "+", color: "#3B82F6" },
              { icon: <FaGlobe size={28} />, value: stats.categories, label: "Product Categories", suffix: "", color: "#F59E0B" },
              { icon: <FaUsers size={28} />, value: stats.customers, label: "Happy Customers", suffix: "+", color: "#8B5CF6" },
            ].map((stat, idx) => (
              <div key={idx} style={{
                textAlign: "center",
                padding: "20px",
                borderRadius: "16px",
                background: "#F8F9FA",
                transition: "all 0.3s ease",
                border: "1px solid #E5E7EB"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 12px 24px rgba(0, 0, 0, 0.1)";
                e.currentTarget.style.background = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.background = "#F8F9FA";
              }}
              >
                <div style={{ 
                  color: stat.color, 
                  marginBottom: "16px",
                  display: "flex",
                  justifyContent: "center"
                }}>
                  {stat.icon}
                </div>
                <div style={{ 
                  fontSize: "2.5rem", 
                  fontWeight: "800", 
                  color: "#111827", 
                  marginBottom: "8px",
                  letterSpacing: "-0.02em"
                }}>
                  {loading ? (
                    <div style={{ 
                      width: "60px", 
                      height: "60px", 
                      border: "3px solid #E5E7EB",
                      borderTop: "3px solid #1E7F3B",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                      margin: "0 auto"
                    }} />
                  ) : (
                    <>{stat.value}{stat.suffix}</>
                  )}
                </div>
                <div style={{ 
                  color: "#6B7280", 
                  fontWeight: "600", 
                  fontSize: "0.9rem",
                  letterSpacing: "0.025em"
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modern Features Section */}
      <section style={{ 
        background: "linear-gradient(135deg, #F8F9FA 0%, #F0FDF4 100%)", 
        paddingTop: "80px", 
        paddingBottom: "80px" 
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <h2 style={{ 
              fontSize: "2.5rem", 
              fontWeight: "800", 
              color: "#111827", 
              marginBottom: "16px",
              letterSpacing: "-0.02em"
            }}>
              Why Choose Green Lion?
            </h2>
            <p style={{ 
              fontSize: "1.125rem", 
              color: "#6B7280", 
              maxWidth: "700px", 
              margin: "0 auto",
              lineHeight: "1.7"
            }}>
              We're committed to providing the highest quality coir products with exceptional service and sustainable practices
            </p>
          </div>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px"
          }}>
            {features.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: "white",
                  padding: "32px",
                  borderRadius: "20px",
                  textAlign: "center",
                  border: "1px solid #E5E7EB",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  position: "relative",
                  overflow: "hidden"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-8px)";
                  e.currentTarget.style.boxShadow = "0 20px 40px rgba(0, 0, 0, 0.12)";
                  e.currentTarget.style.borderColor = item.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "#E5E7EB";
                }}
              >
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "4px",
                  background: `linear-gradient(90deg, ${item.color} 0%, ${item.color}CC 100%)`
                }} />
                <div style={{ 
                  width: "72px",
                  height: "72px",
                  background: `${item.color}15`,
                  borderRadius: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                  border: `2px solid ${item.color}20`
                }}>
                  <div style={{ color: item.color, fontSize: "32px" }}>
                    {item.icon}
                  </div>
                </div>
                <h3 style={{ 
                  fontSize: "1.375rem", 
                  fontWeight: "700", 
                  marginBottom: "12px", 
                  color: "#111827",
                  letterSpacing: "-0.01em"
                }}>
                  {item.title}
                </h3>
                <p style={{ 
                  color: "#6B7280", 
                  lineHeight: "1.7",
                  fontSize: "0.95rem"
                }}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modern Testimonials Section */}
      {testimonials.length > 0 && (
        <section style={{ 
          background: "white", 
          paddingTop: "80px", 
          paddingBottom: "80px" 
        }}>
          <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 24px" }}>
            <div style={{ textAlign: "center", marginBottom: "64px" }}>
              <h2 style={{ 
                fontSize: "2.5rem", 
                fontWeight: "800", 
                color: "#111827", 
                marginBottom: "16px",
                letterSpacing: "-0.02em"
              }}>
                What Our Clients Say
              </h2>
              <p style={{ 
                fontSize: "1.125rem", 
                color: "#6B7280",
                maxWidth: "600px",
                margin: "0 auto"
              }}>
                Trusted by businesses worldwide for quality and reliability
              </p>
            </div>
            
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "24px"
            }}>
              {testimonials.map((testimonial, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#F8F9FA",
                    padding: "32px",
                    borderRadius: "20px",
                    border: "1px solid #E5E7EB",
                    transition: "all 0.3s ease",
                    position: "relative"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 16px 32px rgba(0, 0, 0, 0.1)";
                    e.currentTarget.style.background = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.background = "#F8F9FA";
                  }}
                >
                  <div style={{ 
                    display: "flex", 
                    gap: "4px", 
                    marginBottom: "20px", 
                    color: "#FBBF24" 
                  }}>
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <FaStar key={i} size={18} />
                    ))}
                  </div>
                  <p style={{ 
                    fontSize: "1rem", 
                    color: "#374151", 
                    marginBottom: "24px",
                    lineHeight: "1.7",
                    fontStyle: "italic",
                    position: "relative"
                  }}>
                    <span style={{
                      position: "absolute",
                      top: "-8px",
                      left: "-8px",
                      fontSize: "2rem",
                      color: "#E5E7EB",
                      fontWeight: "bold"
                    }}>
                      "
                    </span>
                    {testimonial.content}
                    <span style={{
                      position: "absolute",
                      bottom: "-12px",
                      right: "0",
                      fontSize: "2rem",
                      color: "#E5E7EB",
                      fontWeight: "bold"
                    }}>
                      "
                    </span>
                  </p>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "16px",
                    paddingTop: "16px",
                    borderTop: "1px solid #E5E7EB"
                  }}>
                    <div style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "16px",
                      background: "linear-gradient(135deg, #1E7F3B 0%, #10B981 100%)",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "700",
                      fontSize: "1.25rem",
                      boxShadow: "0 4px 12px rgba(30, 127, 59, 0.2)"
                    }}>
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div style={{ 
                        fontWeight: "700", 
                        color: "#111827",
                        fontSize: "1.125rem",
                        marginBottom: "4px"
                      }}>
                        {testimonial.name}
                      </div>
                      <div style={{ 
                        fontSize: "0.875rem", 
                        color: "#6B7280",
                        fontWeight: "500"
                      }}>
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Modern CTA Section */}
      <section style={{
        background: "linear-gradient(135deg, #1E7F3B 0%, #10B981 100%)",
        color: "white",
        textAlign: "center",
        paddingTop: "80px",
        paddingBottom: "80px",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Decorative Background Elements */}
        <div style={{
          position: "absolute",
          top: "-100px",
          right: "-100px",
          width: "300px",
          height: "300px",
          background: "rgba(255, 255, 255, 0.05)",
          borderRadius: "50%",
          filter: "blur(60px)"
        }} />
        <div style={{
          position: "absolute",
          bottom: "-80px",
          left: "-80px",
          width: "200px",
          height: "200px",
          background: "rgba(255, 255, 255, 0.03)",
          borderRadius: "50%",
          filter: "blur(40px)"
        }} />

        <div style={{ 
          maxWidth: "1400px", 
          margin: "0 auto", 
          padding: "0 24px",
          position: "relative",
          zIndex: 1
        }}>
          <h2 style={{ 
            fontSize: "2.75rem", 
            fontWeight: "800", 
            color: "white", 
            marginBottom: "20px",
            letterSpacing: "-0.02em"
          }}>
            Ready to Get Started?
          </h2>
          <p style={{ 
            fontSize: "1.25rem", 
            marginBottom: "48px", 
            opacity: 0.95,
            maxWidth: "600px",
            margin: "0 auto 48px",
            lineHeight: "1.6"
          }}>
            Explore our premium coir products or contact us for custom solutions tailored to your needs
          </p>
          <div style={{ 
            display: "flex", 
            gap: "20px", 
            justifyContent: "center", 
            flexWrap: "wrap" 
          }}>
            <button
              onClick={() => navigateWithScrollToTop("/products")}
              style={{
                padding: "16px 32px",
                background: "white",
                color: "#1E7F3B",
                border: "none",
                borderRadius: "12px",
                fontSize: "1.125rem",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)"
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.1)";
              }}
            >
              View All Products
            </button>
            <button
              onClick={() => navigateWithScrollToTop("/contact")}
              style={{
                padding: "16px 32px",
                background: "rgba(255, 255, 255, 0.1)",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                color: "white",
                borderRadius: "12px",
                fontSize: "1.125rem",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.3s ease",
                backdropFilter: "blur(10px)"
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(255, 255, 255, 0.2)";
                e.target.style.borderColor = "rgba(255, 255, 255, 0.5)";
                e.target.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "rgba(255, 255, 255, 0.1)";
                e.target.style.borderColor = "rgba(255, 255, 255, 0.3)";
                e.target.style.transform = "translateY(0)";
              }}
            >
              Contact Sales Team
            </button>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}
