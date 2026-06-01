// FRONTEND/src/pages.shared/OrderFormPage.js
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import http from "../api/http";

const COLORS = {
  bg: "#f8fafc",
  card: "#ffffff",
  text: "#0f172a",
  sub: "#475569",
  line: "#e5e7eb",
  brand: "#1E7F3B",
};

export default function OrderFormPage() {
  const [form, setForm] = useState({
    category: "",
    amount: "",
    price: "",
    canDeliver: false,
    note: "",
    offers: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { id } = useParams(); // if present => edit mode
  const nav = useNavigate();

  const pageTitle = id ? "Edit Order" : "Add New Order";

  useEffect(() => {
    async function loadOne() {
      if (!id) return;
      setLoading(true);
      try {
        const { data } = await http.get(`/supplier-self/orders/${id}`);
        if (data?.ok && data.order) {
          const o = data.order;
          setForm({
            category: o.category || "",
            amount: String(o.amount ?? ""),
            price: String(o.price ?? ""),
            canDeliver: !!o.canDeliver,
            note: o.note || "",
            offers: o.offers || "",
          });
        }
      } finally {
        setLoading(false);
      }
    }
    loadOne();
  }, [id]);

  async function save(e) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      category: form.category.trim(),
      amount: Number(form.amount),
      price: Number(form.price),
      canDeliver: !!form.canDeliver,
      note: form.note.trim(),
      offers: form.offers.trim(),
    };

    if (!payload.category) { alert("Category is required"); setSaving(false); return; }
    if (!Number.isFinite(payload.amount) || payload.amount <= 0) { alert("Amount must be a positive number"); setSaving(false); return; }
    if (!Number.isFinite(payload.price) || payload.price < 0) { alert("Price must be 0 or more"); setSaving(false); return; }

    try {
      if (id) {
        const { data } = await http.put(`/supplier-self/orders/${id}`, payload);
        if (data?.ok) nav("/supplier");
      } else {
        const { data, status } = await http.post("/supplier-self/orders", payload);
        if (data?.ok || status === 201) nav("/supplier");
      }
    } catch (e2) {
      alert(e2?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  // ---------- simple, aligned styles ----------
  const pageWrap = { maxWidth: 720, margin: "0 auto" };    // header + form same width
  const card = {
    background: COLORS.card,
    border: `1px solid ${COLORS.line}`,
    borderRadius: 12,
    boxShadow: "0 6px 16px rgba(0,0,0,0.04)",
  };
  const input = {
    height: 44,
    padding: "10px 12px",
    border: `1px solid ${COLORS.line}`,
    borderRadius: 8,
    fontSize: 14,
    width: "100%",
    background: "#fff",
    color: COLORS.text,
  };
  const textarea = {
    padding: "10px 12px",
    border: `1px solid ${COLORS.line}`,
    borderRadius: 8,
    fontSize: 14,
    width: "100%",
    background: "#fff",
    color: COLORS.text,
    resize: "vertical",
  };
  const label = { fontSize: 13, marginBottom: 6, color: COLORS.sub, display: "block" };
  const btn = (bg, color = "#fff") => ({
    padding: "10px 14px",
    background: bg,
    color,
    border: 0,
    borderRadius: 8,
    fontWeight: 700,
    cursor: "pointer",
  });

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, padding: 24 }}>
      {/* header (aligned with form width) */}
      <div style={{ ...pageWrap, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={() => nav(-1)} style={btn("#64748b")}>← Back</button>
        <h2 style={{ margin: 0 }}>{pageTitle}</h2>
      </div>

      {/* form card (centered, single column for perfect alignment) */}
      <form onSubmit={save} style={{ ...pageWrap, ...card, padding: 20 }}>
        {loading ? (
          <div style={{ color: COLORS.sub }}>Loading…</div>
        ) : (
          <>
            {/* Category */}
            <div style={{ marginBottom: 14 }}>
              <label style={label}>Category *</label>
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
                placeholder="e.g. Coir Pith"
                style={input}
              />
            </div>

            {/* Amount */}
            <div style={{ marginBottom: 14 }}>
              <label style={label}>Amount *</label>
              <input
                type="number"
                min="1"
                step="1"
                value={form.amount}
                onKeyDown={(e) => {
                  // Prevent typing minus sign, decimal point, and letters
                  if (['-', '.', 'e', 'E', '+'].includes(e.key) || /[a-zA-Z]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow positive integers
                  if (value === '' || (Number(value) > 0 && Number.isInteger(Number(value)))) {
                    setForm({ ...form, amount: value });
                  }
                }}
                required
                placeholder="Enter amount"
                style={input}
              />
            </div>

            {/* Price */}
            <div style={{ marginBottom: 14 }}>
              <label style={label}>Price (LKR) *</label>
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
                placeholder="e.g. 1500"
                style={input}
              />
            </div>

            {/* Can deliver */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={form.canDeliver}
                  onChange={(e) => setForm({ ...form, canDeliver: e.target.checked })}
                />
                Supplier can deliver to us
              </label>
            </div>

            {/* Note */}
            <div style={{ marginBottom: 14 }}>
              <label style={label}>Note</label>
              <textarea
                rows={3}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Any extra details…"
                style={textarea}
              />
            </div>

            {/* Offers */}
            <div style={{ marginBottom: 18 }}>
              <label style={label}>Offers</label>
              <textarea
                rows={2}
                value={form.offers}
                onChange={(e) => setForm({ ...form, offers: e.target.value })}
                placeholder="Discounts, transport included, credit terms…"
                style={textarea}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button type="button" onClick={() => nav(-1)} style={btn("#64748b")}>Cancel</button>
              <button type="submit" style={btn(COLORS.brand)} disabled={saving}>
                {id ? "Save" : "Add Order"}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
