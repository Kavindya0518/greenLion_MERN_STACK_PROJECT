import React, { useState, useEffect } from "react";
import { FaLeaf, FaUsers, FaLightbulb, FaAward, FaGlobeAmericas, FaRecycle, FaBox, FaShoppingCart } from "react-icons/fa";
import http from "../api/http";
import heroImg from "../assets/slider4.jpeg";
import logoImg from "../assets/logo1.png";

export default function About() {
  const [achievements, setAchievements] = useState({ 
    products: 0, 
    orders: 0, 
    categories: 0, 
    customers: 0 
  });
  const [loading, setLoading] = useState(true);

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
        
        // Fetch feedback/testimonials for customer count estimation
        let customerCount = 0;
        try {
          const feedbackRes = await http.get("/api/feedback");
          const feedbacks = feedbackRes.data?.feedbacks || feedbackRes.data?.feedback || [];
          customerCount = feedbacks.length;
        } catch (err) {
          console.log("Feedback not available");
        }
        
        // Animate stats counter with real data
        const targets = { 
          products: productCount,
          orders: orderCount,
          categories: categoryCount,
          customers: Math.max(orderCount, customerCount) // Use higher of orders or feedback count
        };
        
        const duration = 2000;
        const steps = 60;
        const stepDuration = duration / steps;

        let step = 0;
        const timer = setInterval(() => {
          step++;
          const progress = step / steps;
          setAchievements({
            products: Math.floor(targets.products * progress),
            orders: Math.floor(targets.orders * progress),
            categories: Math.floor(targets.categories * progress),
            customers: Math.floor(targets.customers * progress),
          });
          if (step >= steps) clearInterval(timer);
        }, stepDuration);
        
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const values = [
    {
      icon: <FaLeaf size={32} />,
      title: "Sustainability",
      description: "Environmental conservation through sustainable farming practices and eco-friendly processes.",
      color: "#22C55E"
    },
    {
      icon: <FaUsers size={32} />,
      title: "Community",
      description: "Supporting local farmers and creating economic opportunities in our communities.",
      color: "#3B82F6"
    },
    {
      icon: <FaLightbulb size={32} />,
      title: "Innovation",
      description: "Developing new solutions for modern agricultural challenges and improving our processes.",
      color: "#F59E0B"
    },
    {
      icon: <FaAward size={32} />,
      title: "Quality",
      description: "Premium products meeting the highest standards of excellence and reliability.",
      color: "#8B5CF6"
    }
  ];

  return (
    <div style={{ fontFamily: "var(--font-body)", backgroundColor: "var(--color-gray-50)", minHeight: "100vh" }}>
      {/* Hero Section */}
      <div
        className="animate-fadeIn"
        style={{
          height: "60vh",
          backgroundImage: `linear-gradient(135deg, rgba(0, 0, 0, 0.5), rgba(30, 127, 59, 0.6)), url(${heroImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          color: "white",
          position: "relative",
          paddingTop: "72px",
        }}
      >
        <div style={{ maxWidth: "900px", padding: "0 20px", zIndex: 2 }}>
          <h1 className="heading-1" style={{
            fontSize: "4rem",
            fontWeight: "900",
            marginBottom: "24px",
            textShadow: "2px 4px 10px rgba(0,0,0,0.6)",
            color: "white",
            lineHeight: 1.1
          }}>
            Transforming Nature's Waste Into Valuable Resources
          </h1>

          <p style={{
            fontSize: "1.3rem",
            lineHeight: "1.7",
            maxWidth: "700px",
            margin: "0 auto",
            textShadow: "0 2px 4px rgba(0,0,0,0.5)",
            opacity: 0.95
          }}>
            Based in Kurunegala, Sri Lanka, we create premium coco peat blocks, coir products, and handcrafted goods for agriculture and gardening worldwide.
          </p>
        </div>
      </div>

      {/* Achievements Section - Real Data */}
      <section className="py-16" style={{ background: "white", marginTop: "-50px", position: "relative", zIndex: 5 }}>
        <div className="container">
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "30px",
            background: "white",
            padding: "40px",
            borderRadius: "var(--radius-2xl)",
            boxShadow: "var(--shadow-2xl)"
          }}>
            {[
              { icon: <FaBox size={32} />, value: achievements.products, label: "Products Available", suffix: "" },
              { icon: <FaShoppingCart size={32} />, value: achievements.orders, label: "Orders Completed", suffix: "+" },
              { icon: <FaGlobeAmericas size={32} />, value: achievements.categories, label: "Product Categories", suffix: "" },
              { icon: <FaUsers size={32} />, value: achievements.customers, label: "Happy Customers", suffix: "+" },
            ].map((achievement, idx) => (
              <div key={idx} className="text-center animate-scaleIn" style={{
                animationDelay: `${idx * 0.1}s`
              }}>
                <div style={{ color: "var(--color-primary)", marginBottom: "12px" }}>
                  {achievement.icon}
                </div>
                <div className="heading-2" style={{ color: "var(--color-primary)", marginBottom: "8px" }}>
                  {loading ? (
                    <div className="spinner-sm" style={{ margin: "0 auto" }} />
                  ) : (
                    <>{achievement.value}{achievement.suffix}</>
                  )}
                </div>
                <div style={{ color: "var(--color-gray-600)", fontWeight: 600, fontSize: "0.875rem" }}>
                  {achievement.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16">
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "center" }}>
            <div className="animate-slideInLeft">
              <div className="badge badge-primary" style={{ marginBottom: "20px", display: "inline-block" }}>
                Our Story
              </div>
              <h2 className="heading-2" style={{ color: "var(--color-primary)", marginBottom: "24px" }}>
                From Waste to Wonder
              </h2>
              <p style={{
                fontSize: "1.125rem",
                lineHeight: "1.8",
                color: "var(--color-gray-700)",
                marginBottom: "24px",
              }}>
                Green Lion transforms coconut waste into valuable products. We create coco peat blocks, coir products, and handcrafted goods for agriculture and gardening.
              </p>
              <p style={{
                fontSize: "1rem",
                lineHeight: "1.7",
                color: "var(--color-gray-600)",
              }}>
                We're committed to sustainability, efficient supply chain management, and transparent service. Our Centralized Online Business Management System streamlines product & order management, supplier coordination, and inventory control.
              </p>
            </div>

            <div className="card hover-lift animate-slideInRight" style={{
              background: "linear-gradient(135deg, rgba(30, 127, 59, 0.1), rgba(92, 61, 46, 0.1))",
              padding: "50px 40px",
              textAlign: "center",
              border: "2px solid var(--color-primary)",
              position: "relative"
            }}>
              <div style={{
                position: "absolute",
                top: "-40px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "80px",
                height: "80px",
                backgroundColor: "white",
                border: "3px solid var(--color-primary)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "var(--shadow-green)",
              }}>
                <img src={logoImg} alt="Green Lion Logo" style={{ width: "70%", height: "70%", objectFit: "contain" }} />
              </div>
              <h3 className="heading-3" style={{
                color: "var(--color-primary)",
                marginTop: "20px",
                marginBottom: "16px"
              }}>
                Our Mission
              </h3>
              <p style={{
                fontSize: "1.125rem",
                color: "var(--color-gray-700)",
                lineHeight: "1.7",
                margin: 0,
              }}>
                Revolutionizing sustainable agriculture through innovative coconut-based products while supporting local communities and preserving our environment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16" style={{ backgroundColor: "white" }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: "60px" }}>
            <div className="badge badge-primary" style={{ marginBottom: "16px", display: "inline-block" }}>
              Our Values
            </div>
            <h2 className="heading-2" style={{ color: "var(--color-primary)", marginBottom: "16px" }}>
              What Drives Us Forward
            </h2>
            <p style={{
              fontSize: "1.125rem",
              color: "var(--color-gray-600)",
              maxWidth: "600px",
              margin: "0 auto",
              lineHeight: "1.7",
            }}>
              Our core values guide everything we do, from product development to customer service
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "30px"
          }}>
            {values.map((value, index) => (
              <div
                key={index}
                className="card hover-lift animate-scaleIn"
                style={{
                  padding: "40px 30px",
                  textAlign: "center",
                  borderTop: `4px solid ${value.color}`,
                  animationDelay: `${index * 0.1}s`
                }}
              >
                <div style={{
                  width: "72px",
                  height: "72px",
                  backgroundColor: `${value.color}15`,
                  borderRadius: "var(--radius-xl)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                  color: value.color,
                  transition: "all 0.3s ease",
                }}>
                  {value.icon}
                </div>
                <h3 className="heading-3" style={{
                  fontSize: "1.375rem",
                  color: "var(--color-gray-900)",
                  marginBottom: "12px"
                }}>
                  {value.title}
                </h3>
                <p style={{
                  fontSize: "1rem",
                  color: "var(--color-gray-600)",
                  lineHeight: "1.7",
                  margin: 0,
                }}>
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16" style={{
        background: "var(--gradient-primary)",
        color: "white",
        textAlign: "center"
      }}>
        <div className="container">
          <h2 className="heading-2" style={{ color: "white", marginBottom: "16px" }}>
            Join Our Sustainable Journey
          </h2>
          <p style={{ fontSize: "1.125rem", marginBottom: "32px", opacity: 0.95 }}>
            Partner with us to create a greener future
          </p>
          <button className="btn btn-lg hover-lift" style={{
            background: "white",
            color: "var(--color-primary)",
            fontWeight: 700
          }}>
            Get In Touch
          </button>
        </div>
      </section>
    </div>
  );
}