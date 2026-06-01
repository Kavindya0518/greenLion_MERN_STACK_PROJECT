import React, { useState } from "react";
import { FaClock, FaPhone, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";
import heroImg from "../assets/slider4.jpeg";
import { Input, Button } from "../components/ui";

export default function Contact() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    subject: "",
    message: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      alert("Message sent successfully! We'll get back to you soon.");
      setFormData({ firstName: "", lastName: "", email: "", subject: "", message: "" });
      setSubmitting(false);
    }, 1500);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const contactInfo = [
    {
      icon: <FaClock size={24} />,
      title: "Business Hours",
      content: "Monday - Friday: 8:00 AM - 5:00 PM",
      subcontent: "Saturday: 9:00 AM - 1:00 PM",
      note: "Closed on public holidays"
    },
    {
      icon: <FaPhone size={24} />,
      title: "Phone Support",
      content: "+94 77 123 4567",
      subcontent: "Available during business hours",
      link: "tel:+94771234567"
    },
    {
      icon: <FaEnvelope size={24} />,
      title: "Email Support",
      content: "support@greenlion.com",
      subcontent: "Response within 24-48 hours",
      link: "mailto:support@greenlion.com"
    },
    {
      icon: <FaMapMarkerAlt size={24} />,
      title: "Visit Us",
      content: "Kurunegala, Sri Lanka",
      subcontent: "Green Lion Manufacturing Facility",
    }
  ];

  return (
    <div style={{ backgroundColor: "var(--color-gray-50)", minHeight: "100vh" }}>
      {/* Hero Section */}
      <div
        className="animate-fadeIn"
        style={{
          position: "relative",
          height: "50vh",
          backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.6), rgba(30, 127, 59, 0.7)), url(${heroImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          color: "white",
          paddingTop: "72px",
        }}
      >
        <div style={{ maxWidth: "800px", padding: "0 20px" }}>
          <div style={{
            display: "inline-block",
            marginBottom: "20px",
            padding: "8px 20px",
            background: "rgba(34, 197, 94, 0.2)",
            backdropFilter: "blur(10px)",
            borderRadius: "50px",
            border: "2px solid rgba(255, 255, 255, 0.3)"
          }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 600, letterSpacing: "2px" }}>
              📞 GET IN TOUCH
            </span>
          </div>

          <h1 className="heading-1" style={{
            color: "white",
            fontSize: "3.5rem",
            marginBottom: "20px"
          }}>
            Contact Us
          </h1>

          <p style={{
            fontSize: "1.2rem",
            opacity: 0.95,
            lineHeight: 1.6,
            maxWidth: "600px",
            margin: "0 auto"
          }}>
            Get in touch with our team for product inquiries, partnerships, and support
          </p>
        </div>
      </div>

      {/* Contact Cards */}
      <section className="py-16">
        <div className="container">
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
            marginBottom: "60px",
          }}>
            {contactInfo.map((info, idx) => (
              <div
                key={idx}
                className="card hover-lift animate-scaleIn"
                style={{
                  padding: "32px",
                  textAlign: "center",
                  animationDelay: `${idx * 0.1}s`
                }}
              >
                <div style={{
                  width: "64px",
                  height: "64px",
                  backgroundColor: "var(--color-primary)",
                  borderRadius: "var(--radius-xl)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                  color: "white",
                  boxShadow: "var(--shadow-green)"
                }}>
                  {info.icon}
                </div>

                <h3 style={{
                  fontSize: "1.125rem",
                  color: "var(--color-gray-900)",
                  marginBottom: "12px",
                  fontWeight: 700
                }}>
                  {info.title}
                </h3>

                {info.link ? (
                  <a
                    href={info.link}
                    style={{
                      display: "block",
                      color: "var(--color-primary)",
                      textDecoration: "none",
                      fontSize: "1rem",
                      fontWeight: 600,
                      marginBottom: "8px"
                    }}
                  >
                    {info.content}
                  </a>
                ) : (
                  <p style={{
                    color: "var(--color-gray-900)",
                    fontSize: "1rem",
                    fontWeight: 600,
                    marginBottom: "8px",
                    margin: 0
                  }}>
                    {info.content}
                  </p>
                )}

                <p style={{
                  color: "var(--color-gray-600)",
                  fontSize: "0.875rem",
                  marginBottom: info.note ? "8px" : 0
                }}>
                  {info.subcontent}
                </p>

                {info.note && (
                  <p style={{
                    color: "var(--color-gray-400)",
                    fontSize: "0.75rem",
                    margin: 0
                  }}>
                    {info.note}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Service Promise */}
          <div className="card animate-fadeIn" style={{
            padding: "48px",
            textAlign: "center",
            marginBottom: "60px",
            background: "linear-gradient(135deg, rgba(30, 127, 59, 0.05), rgba(255, 255, 255, 1))"
          }}>
            <h2 className="heading-3" style={{
              color: "var(--color-gray-900)",
              marginBottom: "16px"
            }}>
              Our Commitment to You
            </h2>
            <p style={{
              color: "var(--color-gray-600)",
              fontSize: "1.125rem",
              lineHeight: "1.7",
              maxWidth: "700px",
              margin: "0 auto"
            }}>
              Our dedicated customer service team is committed to providing exceptional support.
              We respond to all inquiries within 24-48 hours and are here to help with product
              information, order assistance, and partnership opportunities.
            </p>
          </div>

          {/* Contact Form */}
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <div className="text-center" style={{ marginBottom: "40px" }}>
              <h2 className="heading-2" style={{ color: "var(--color-primary)", marginBottom: "12px" }}>
                Send us a Message
              </h2>
              <p style={{ color: "var(--color-gray-600)", fontSize: "1.125rem" }}>
                Fill out the form below and we'll get back to you promptly
              </p>
            </div>

            <form onSubmit={handleSubmit} className="card animate-slideInLeft" style={{ padding: "48px" }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "24px",
                marginBottom: "24px"
              }}>
                <Input
                  label="First Name *"
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  placeholder="John"
                />
                <Input
                  label="Last Name *"
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Doe"
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <Input
                  label="Email Address *"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="john@example.com"
                  icon={<FaEnvelope />}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <Input
                  label="Subject"
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Product inquiry"
                />
              </div>

              <div style={{ marginBottom: "32px" }}>
                <label style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--color-gray-700)",
                  marginBottom: "8px"
                }}>
                  Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  placeholder="Tell us how we can help you..."
                  className="input"
                  style={{ resize: "vertical", minHeight: "120px" }}
                />
              </div>

              <div style={{ textAlign: "center" }}>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={submitting}
                  disabled={submitting}
                >
                  {submitting ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
