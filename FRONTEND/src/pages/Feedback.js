// Customer Feedback page
// Allows a user to submit feedback for a specific product (pulled via :productId route param).
// Includes: product fetch, optional user prefill, client-side validation, and submit.

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import http from "../api/http";
import { COLORS, radii, shadows } from "../theme";
import HeroImg from "../assets/logo1.png";

export default function Feedback() {
  // --------------- Routing ---------------
  // productId comes from the route (e.g., /feedback/:productId)
  const { productId } = useParams();
  const navigate = useNavigate();

  // --------------- State ---------------
  // Product loaded from backend
  const [product, setProduct] = useState(null);
  // Displayable error state during product fetch
  const [error, setError] = useState(null);
  // Submitting guard to disable the button while posting
  const [submitting, setSubmitting] = useState(false);
  // Controlled form state for new feedback
  const [newFeedback, setNewFeedback] = useState({
    name: "",
    email: "",
    rating: 5,
    comment: "",
  });
  // If user is logged in (stored in localStorage), we prefill name/email
  const [prefilledUser, setPrefilledUser] = useState(null);

  // Fetch product by id (runs when productId changes)
  useEffect(() => {
    (async () => {
      try {
        const { data } = await http.get(`/products/${productId}`);
        if (data?.ok) setProduct(data.product);
        else setError("Product not found");
      } catch (err) {
        console.error(err);
        setError("Failed to fetch product");
      }
    })();
  }, [productId]);

  // Prefill name and email from logged-in user (if available)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const user = JSON.parse(raw);
        const name = user?.name || user?.fullName || user?.username || "";
        const email = user?.email || "";
        if (name || email) {
          setPrefilledUser(user);
          setNewFeedback((prev) => ({ ...prev, name, email }));
        }
      }
    } catch {}
  }, []);

  // --------------- Handlers ---------------
  // Submit feedback to backend with minimal client-side validation
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();

    // basic client-side guards
    if (!productId || !/^[0-9a-fA-F]{24}$/.test(productId)) {
      return alert("Invalid product. Please re-open this page from a product.");
    }
    if (!(Number(newFeedback.rating) >= 1 && Number(newFeedback.rating) <= 5)) {
      return alert("Rating must be between 1 and 5.");
    }

    setSubmitting(true);
    try {
      const payload = {
        ...newFeedback,
        productId,                    // REQUIRED by your schema
        rating: Number(newFeedback.rating),
      };
      const { data } = await http.post("/feedback", payload); // ✅ correct route
      if (data?.ok) {
        alert("Feedback submitted ✅");
        navigate(`/products/${productId}`);
      } else {
        alert(data?.error || "Failed to submit feedback");
      }
    } catch (err) {
      console.error(err?.response?.data || err.message);
      alert(err?.response?.data?.error || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  if (error) return <p style={{ textAlign: "center", marginTop: 50 }}>{error}</p>;
  if (!product) return <p style={{ textAlign: "center", marginTop: 50 }}>Loading...</p>;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        minHeight: "70vh",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: 0,
          backgroundColor: COLORS.white,
          border: "1px solid #E5E7EB",
          borderRadius: radii.lg,
          boxShadow: shadows.card,
          overflow: "hidden",
          width: "100%",
        }}
      >
      {/* Two-column layout: left hero, right feedback form */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 0,
          alignItems: "stretch",
        }}
      >
        {/* Left: Hero Panel */}
        <div
          style={{
            backgroundColor: "#FAF7F4",
            padding: 32,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: 16,
          }}
        >
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: COLORS.brown, margin: 0 }}>
              We Value Your Feedback
            </h2>
            <p style={{ marginTop: 12, color: COLORS.muted }}>
              Help us improve our products and service. Your opinion matters.
            </p>
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <img
              src={HeroImg}
              alt="Green Lion"
              style={{ maxWidth: "100%", maxHeight: 280, objectFit: "contain" }}
            />
          </div>
        </div>

        {/* Right: Form Card */}
        <form
          onSubmit={handleFeedbackSubmit}
          style={{
            backgroundColor: COLORS.white,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <h1 style={{ fontSize: 22, fontWeight: 800, color: COLORS.text, margin: 0 }}>
            Leave Feedback for {product.name}
          </h1>
          <div style={{ height: 6 }} />
        {/* Name */}
        <input
          type="text"
          placeholder="Your Name"
          value={newFeedback.name}
          onChange={(e) => setNewFeedback({ ...newFeedback, name: e.target.value })}
          required
          readOnly={!!prefilledUser}
          style={{
            padding: 8,
            borderRadius: radii.md,
            border: "1px solid #ccc",
            backgroundColor: prefilledUser ? "#F3F4F6" : "white",
          }}
        />
        {/* Email */}
        <input
          type="email"
          placeholder="Your Email"
          value={newFeedback.email}
          onChange={(e) => setNewFeedback({ ...newFeedback, email: e.target.value })}
          required
          readOnly={!!prefilledUser}
          style={{
            padding: 8,
            borderRadius: radii.md,
            border: "1px solid #ccc",
            backgroundColor: prefilledUser ? "#F3F4F6" : "white",
          }}
        />
        {/* Rating */}
        <select
          value={newFeedback.rating}
          onChange={(e) => setNewFeedback({ ...newFeedback, rating: Number(e.target.value) })}
          style={{ padding: 8, borderRadius: radii.md, border: "1px solid #ccc" }}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        {/* Comment */}
        <textarea
          placeholder="Your Comment"
          value={newFeedback.comment}
          onChange={(e) => setNewFeedback({ ...newFeedback, comment: e.target.value })}
          rows={4}
          style={{ padding: 8, borderRadius: radii.md, border: "1px solid #ccc" }}
        />
        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          style={{
            backgroundColor: COLORS.green,
            color: COLORS.white,
            border: "none",
            padding: "10px 0",
            borderRadius: radii.md,
            fontWeight: 600,
            cursor: "pointer",
            marginTop: 10,
            opacity: submitting ? 0.8 : 1,
          }}
        >
          {submitting ? "Submitting..." : "Submit Feedback"}
        </button>
      </form>
    </div>
  </div>
  </div>
  );
}