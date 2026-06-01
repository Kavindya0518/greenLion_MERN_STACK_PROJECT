// Admin Feedback page: view, filter, reply to, and delete customer feedback
import React, { useEffect, useState } from "react";
import http from "../api/http";
import { COLORS, radii, shadows } from "../theme";
import { FaReply, FaTrash } from "react-icons/fa";
import AdminSidebar from "../components/AdminSidebar";

export default function AdminFeedback() {
  // --------------- State ---------------
  // Raw feedback list fetched from backend
  const [feedbacks, setFeedbacks] = useState([]);
  // Map of feedbackId -> reply text (controlled inputs for each card)
  const [replyMap, setReplyMap] = useState({});
  // UI state (client-side features)
  // Client-only filters and sorting; no backend queries on these changes
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("All");
  const [ratingFilter, setRatingFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // --------------- Effects ---------------
  // Fetch all feedback once on mount
  useEffect(() => {
    (async () => {
      try {
        const { data } = await http.get("/feedback");
        setFeedbacks(Array.isArray(data) ? data : []);
      } catch (err) {}
    })();
  }, []);

  // --------------- Handlers ---------------
  // Delete a feedback entry by id
  const handleDelete = async (id) => {
    try {
      await http.delete(`/feedback/${id}`);
      setFeedbacks(feedbacks.filter((fb) => fb._id !== id));
    } catch (err) {}
  };

  // Save a reply for a given feedback id
  const handleReply = async (id) => {
    try {
      await http.put(`/feedback/${id}`, { reply: replyMap[id] });
      setFeedbacks(
        feedbacks.map((fb) =>
          fb._id === id ? { ...fb, reply: replyMap[id] } : fb
        )
      );
    } catch (err) {}
  };

  // --------------- Derived helpers ---------------
  // Build the product list for the filter dropdown from feedback data
  const productsList = [
    "All",
    ...Array.from(
      new Set(
        (feedbacks || []).map((f) => (f.productId && f.productId.name ? f.productId.name : "Unknown Product"))
      )
    ),
  ];

  // Apply product/rating/search filters and sorting in-memory
  const filtered = (feedbacks || [])
    .filter((f) => {
      if (productFilter !== "All") {
        const name = f.productId?.name || "Unknown Product";
        if (name !== productFilter) return false;
      }
      if (ratingFilter !== "All") {
        if (Number(f.rating) !== Number(ratingFilter)) return false;
      }
      if (search.trim() !== "") {
        const q = search.toLowerCase();
        const hay = `${f.name} ${f.email} ${f.comment || ""} ${(f.productId?.name) || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "ratingHigh") return Number(b.rating) - Number(a.rating);
      if (sortBy === "ratingLow") return Number(a.rating) - Number(b.rating);
      return 0;
    });

  // --------------- Pagination (client-side) ---------------
  const total = filtered.length;
  // Disable pagination: render all items and hide footer
  const totalPages = 1;
  const currentPage = 1;
  const pageItems = filtered;

  // Format date helper for display
  const formatDate = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return "";
    }
  };

  // Simple star renderer for ratings (0-5)
  const Stars = ({ n = 0 }) => {
    const full = Math.max(0, Math.min(5, Number(n)));
    return (
      <span aria-label={`rating ${full} of 5`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} style={{ color: i < full ? "#F59E0B" : "#E5E7EB" }}>★</span>
        ))}
      </span>
    );
  };

  return (
    // --------------- Layout with AdminSidebar ---------------
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <AdminSidebar />
      <div style={{ flex: 1, padding: 24 }}>
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
          }}
        >
      {/* Header: page title and breadcrumb */}
      <div
        style={{
          backgroundColor: COLORS.white,
          borderRadius: radii.lg,
          boxShadow: shadows.card,
          padding: 16,
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>Admin / Feedback</div>
          <h2 style={{ color: COLORS.green, fontSize: 24, fontWeight: 800, margin: 0 }}>
            Feedback Management
          </h2>
        </div>
      </div>

      {/* Empty state */}
      {feedbacks.length === 0 && (
        <div
          style={{
            backgroundColor: COLORS.white,
            borderRadius: radii.lg,
            boxShadow: shadows.card,
            padding: 24,
            textAlign: "center",
            color: "#6B7280",
          }}
        >
          No feedbacks available
        </div>
      )}

      {/* Toolbar: search, product filter, rating filter, sort */}
      {feedbacks.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, email, comment, product..."
            style={{ padding: 10, border: "1px solid #E5E7EB", borderRadius: radii.md }}
          />
          <select
            value={productFilter}
            onChange={(e) => {
              setProductFilter(e.target.value);
              setPage(1);
            }}
            style={{ padding: 10, border: "1px solid #E5E7EB", borderRadius: radii.md }}
          >
            {productsList.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value);
              setPage(1);
            }}
            style={{ padding: 10, border: "1px solid #E5E7EB", borderRadius: radii.md }}
          >
            {['All','5','4','3','2','1'].map((r) => (
              <option key={r} value={r}>{r === 'All' ? 'All ratings' : `${r} stars`}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: 10, border: "1px solid #E5E7EB", borderRadius: radii.md }}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="ratingHigh">Highest rating</option>
            <option value="ratingLow">Lowest rating</option>
          </select>
        </div>
      )}

      {/* Feedback list */}
      {pageItems.map((fb) => (
        <div
          key={fb._id}
          style={{
            border: "1px solid #E5E7EB",
            borderRadius: radii.lg,
            padding: 20,
            marginBottom: 16,
            boxShadow: shadows.card,
            backgroundColor: COLORS.white,
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.01)";
            e.currentTarget.style.boxShadow = shadows.md;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = shadows.card;
          }}
        >
          {/* Header row: author + date */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: "0 0 4px 0", fontSize: 16, color: COLORS.text }}>
                <b>{fb.name}</b> ({fb.email})
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Stars n={fb.rating} />
                <span style={{ fontSize: 12, color: "#6B7280" }}>({fb.rating}/5)</span>
              </div>
              {fb.productId?.name && (
                <p style={{ margin: 0, fontSize: 13, color: "#6B7280" }}>
                  Product: <b>{fb.productId.name}</b>
                </p>
              )}
            </div>
            <div style={{ textAlign: "right", color: "#6B7280", fontSize: 12 }}>
              {formatDate(fb.createdAt)}
            </div>
          </div>

          {/* Feedback comment */}
          <p style={{ margin: "8px 0 16px 0", fontSize: 15, color: COLORS.text, lineHeight: 1.6 }}>{fb.comment}</p>

          {/* Existing admin reply (if any) */}
          {fb.reply && (
            <p style={{ margin: "4px 0 12px 0", color: COLORS.green, fontStyle: "italic", fontSize: 14 }}>
              Admin Reply: {fb.reply}
            </p>
          )}

          {/* Reply editor */}
          <textarea
            placeholder="Write a reply..."
            value={replyMap[fb._id] || ""}
            onChange={(e) => setReplyMap({ ...replyMap, [fb._id]: e.target.value })}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: radii.md,
              border: "1px solid #E5E7EB",
              marginBottom: 12,
              resize: "vertical",
              fontSize: 14,
              fontFamily: "inherit",
              backgroundColor: "#F9FAFB",
            }}
          />

          {/* Actions: Reply / Delete */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => handleReply(fb._id)}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                backgroundColor: COLORS.green,
                color: COLORS.white,
                border: "none",
                borderRadius: radii.md,
                padding: "10px 0",
                cursor: "pointer",
                fontWeight: 600,
                transition: "background-color 0.2s, transform 0.05s",
                boxShadow: shadows.sm,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#176733")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.green)}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.99)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <FaReply /> Reply
            </button>

            <button
              onClick={() => handleDelete(fb._id)}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                backgroundColor: COLORS.brown,
                color: COLORS.white,
                border: "none",
                borderRadius: radii.md,
                padding: "10px 0",
                cursor: "pointer",
                fontWeight: 600,
                transition: "background-color 0.2s, transform 0.05s",
                boxShadow: shadows.sm,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#4B3024")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.brown)}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.99)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <FaTrash /> Delete
            </button>
          </div>
        </div>
      ))}

      {/* Pagination (disabled: keeping for future use) */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: "8px 12px",
                border: "1px solid #E5E7EB",
                backgroundColor: COLORS.white,
                color: COLORS.text,
                borderRadius: radii.md,
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
              }}
            >
              Prev
            </button>
            <span style={{ fontSize: 14, color: "#6B7280" }}>
              Page {currentPage} of {totalPages} — {total} results
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: "8px 12px",
                border: "1px solid #E5E7EB",
                backgroundColor: COLORS.white,
                color: COLORS.text,
                borderRadius: radii.md,
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              }}
            >
              Next
            </button>
          </div>
          <div>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              style={{ padding: 8, border: "1px solid #E5E7EB", borderRadius: radii.md }}
            >
              {[5,10,20,50].map((n) => (
                <option key={n} value={n}>{n} / page</option>
              ))}
            </select>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}