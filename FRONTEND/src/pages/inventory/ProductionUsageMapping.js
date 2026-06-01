import React, { useEffect, useState } from "react";
import InventorySidebar from "../../components/InventorySidebar";
import http from "../../api/http";
import { FaPlus, FaTrash, FaSave, FaTimes, FaSyncAlt, FaEdit } from 'react-icons/fa';

const COLORS = {
  primary: "#1E7F3B",
  primaryLight: "rgba(30,127,59,0.1)",
  text: "#0f172a",
  subtext: "#475569",
  border: "#e2e8f0",
  background: "#f8fafc",
  card: "#ffffff",
  danger: "#dc2626",
  dangerLight: "rgba(220,38,38,0.1)",
  warning: "#f59e0b",
  warningLight: "rgba(245,158,11,0.1)",
  success: "#10b981",
  successLight: "rgba(16,185,129,0.1)",
};

const inputStyle = {
  padding: "10px 12px",
  border: `1px solid ${COLORS.border}`,
  borderRadius: "6px",
  fontSize: "14px",
  color: COLORS.text,
  backgroundColor: COLORS.background,
  outline: "none",
  transition: "border-color 0.2s",
};

const buttonStyle = (bgColor, textColor = "#fff") => ({
  padding: "10px 16px",
  borderRadius: "6px",
  border: "none",
  background: bgColor,
  color: textColor,
  fontSize: "14px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "background 0.2s",
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

export default function ProductionUsageMapping() {
  const [loading, setLoading] = useState(true);
  const [mappings, setMappings] = useState([]);
  const [products, setProducts] = useState([]);
  const [rawMaterialCategories, setRawMaterialCategories] = useState([]);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [rawMaterials, setRawMaterials] = useState([]);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState({ show: false, type: 'success', message: '' });
  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: 'success', message: '' }), 3000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [mappingsRes, productsRes, rawMaterialsRes] = await Promise.all([
        http.get("/api/production-usage-map"),
        http.get("/api/production-usage-map/helpers/products"),
        http.get("/api/production-usage-map/helpers/raw-materials"),
      ]);

      setMappings(mappingsRes.data?.mappings || []);
      setProducts(productsRes.data?.products || []);
      setRawMaterialCategories(rawMaterialsRes.data?.categories || []);
    } catch (e) {
      console.error("Failed to load data:", e);
      showToast('error', e?.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddRawMaterial = () => {
    setRawMaterials([...rawMaterials, {
      rawCategoryId: "",
      rawMaterialName: "",
      measurementType: "",
      quantityPerUnit: "",
    }]);
  };

  const handleRemoveRawMaterial = (index) => {
    const newRMs = [...rawMaterials];
    newRMs.splice(index, 1);
    setRawMaterials(newRMs);
  };

  const handleRawMaterialChange = (index, field, value) => {
    const newRMs = [...rawMaterials];
    if (field === "rawCategoryId") {
      const selectedCat = rawMaterialCategories.find(cat => cat.categoryId === value);
      newRMs[index] = {
        ...newRMs[index],
        rawCategoryId: value,
        rawMaterialName: selectedCat?.name || "",
        measurementType: selectedCat?.measurementType || "",
      };
    } else {
      newRMs[index][field] = value;
    }
    setRawMaterials(newRMs);
  };

  const validateForm = () => {
    if (!selectedProduct) { setFormError("Please select a Product."); return false; }
    if (rawMaterials.length === 0) { setFormError("Please add at least one Raw Material."); return false; }

    for (const rm of rawMaterials) {
      if (!rm.rawCategoryId) { setFormError("Please select a Raw Material Category for all entries."); return false; }
      if (!rm.quantityPerUnit || Number(rm.quantityPerUnit) <= 0) { setFormError("Please enter a valid Quantity per Unit (> 0) for all raw materials."); return false; }
    }
    setFormError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setFormLoading(true);
      const selectedProductObj = products.find(p => p._id === selectedProduct);
      const payload = {
        productId: selectedProduct,
        productName: selectedProductObj?.name || "",
        rawMaterials: rawMaterials.map(rm => ({
          rawCategoryId: rm.rawCategoryId,
          rawMaterialName: rm.rawMaterialName,
          measurementType: rm.measurementType,
          quantityPerUnit: Number(rm.quantityPerUnit),
        })),
      };

      const res = await http.post("/api/production-usage-map", payload);
      if (res.data?.ok) {
        showToast('success', res.data.message || "Production mapping saved successfully!");
        setShowForm(false);
        setSelectedProduct("");
        setRawMaterials([]);
        setEditingProductId(null);
        loadData();
      }
    } catch (e) {
      console.error("Failed to save mapping:", e);
      showToast('error', e?.response?.data?.message || 'Failed to save mapping');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (mapping) => {
    setEditingProductId(mapping.productId._id);
    setSelectedProduct(mapping.productId._id);
    setRawMaterials(mapping.rawMaterials.map(rm => ({
      rawCategoryId: rm.rawCategoryId,
      rawMaterialName: rm.rawMaterialName,
      measurementType: rm.measurementType,
      quantityPerUnit: rm.quantityPerUnit,
    })));
    setShowForm(true);
    setFormError("");
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this production mapping?")) return;

    try {
      setLoading(true);
      const res = await http.delete(`/api/production-usage-map/${productId}`);
      if (res.data?.ok) {
        showToast('success', res.data.message || "Production mapping deleted successfully.");
        loadData();
      }
    } catch (e) {
      console.error("Failed to delete mapping:", e);
      showToast('error', e?.response?.data?.message || 'Failed to delete mapping');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedProduct("");
    setRawMaterials([]);
    setEditingProductId(null);
    setFormError("");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: COLORS.background }}>
      <InventorySidebar />
      <div style={{ flex: 1, padding: "24px", maxWidth: "1400px", margin: "0 auto", width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "800", color: COLORS.text }}>Production Usage Mapping</h1>
            <p style={{ margin: "8px 0 0", fontSize: "15px", color: COLORS.subtext }}>Define raw material requirements for each finished product.</p>
          </div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button onClick={loadData} style={buttonStyle(COLORS.primary, COLORS.card)}>
              <FaSyncAlt /> Refresh
            </button>
            {!showForm && (
              <button onClick={() => setShowForm(true)} style={buttonStyle(COLORS.success, COLORS.card)}>
                <FaPlus /> Add New Mapping
              </button>
            )}
          </div>
        </div>

        {/* Form Section */}
        {showForm && (
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "24px", marginBottom: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "700", color: COLORS.text, marginBottom: "20px" }}>
              {editingProductId ? "Edit Production Mapping" : "Add New Production Mapping"}
            </h2>
            <form onSubmit={handleSubmit}>
              {/* Product Selection */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
                <label style={{ fontSize: "14px", fontWeight: "500", color: COLORS.subtext }}>Select Product</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  style={inputStyle}
                  required
                  disabled={editingProductId !== null}
                >
                  <option value="">Select a Product</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>{p.name} ({p.category})</option>
                  ))}
                </select>
              </div>

              {/* Raw Materials Section */}
              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "600", color: COLORS.text, marginBottom: "12px" }}>Raw Materials Required (per 1 unit)</h3>
                {rawMaterials.map((rm, index) => (
                  <div key={index} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "16px", alignItems: "center", marginBottom: "12px", background: COLORS.background, padding: "12px", borderRadius: "8px", border: `1px solid ${COLORS.border}` }}>
                    {/* Raw Material Category */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "13px", fontWeight: "500", color: COLORS.subtext }}>Raw Material</label>
                      <select
                        value={rm.rawCategoryId}
                        onChange={(e) => handleRawMaterialChange(index, "rawCategoryId", e.target.value)}
                        style={inputStyle}
                        required
                      >
                        <option value="">Select Raw Material</option>
                        {rawMaterialCategories.map(cat => (
                          <option key={cat.categoryId} value={cat.categoryId}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Measurement Type (Read-only) */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "13px", fontWeight: "500", color: COLORS.subtext }}>Unit</label>
                      <input
                        type="text"
                        value={rm.measurementType}
                        style={{ ...inputStyle, backgroundColor: "#e9ecef", cursor: "not-allowed" }}
                        readOnly
                      />
                    </div>

                    {/* Quantity per Unit */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "13px", fontWeight: "500", color: COLORS.subtext }}>Qty per Unit</label>
                      <input
                        type="number"
                        value={rm.quantityPerUnit}
                        onChange={(e) => handleRawMaterialChange(index, "quantityPerUnit", e.target.value)}
                        style={inputStyle}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveRawMaterial(index)}
                      style={{ ...buttonStyle(COLORS.danger, COLORS.card), alignSelf: "flex-end", padding: "8px 12px" }}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddRawMaterial}
                  style={{ ...buttonStyle(COLORS.primary, COLORS.card), marginTop: "12px", background: COLORS.primaryLight, color: COLORS.primary }}
                >
                  <FaPlus /> Add Raw Material
                </button>
              </div>

              {formError && (
                <div style={{ background: COLORS.dangerLight, color: COLORS.danger, padding: "12px", borderRadius: "6px", marginBottom: "20px", fontSize: "14px", fontWeight: "500" }}>
                  {formError}
                </div>
              )}

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="submit"
                  style={buttonStyle(COLORS.primary, COLORS.card)}
                  disabled={formLoading}
                >
                  {formLoading ? "Saving..." : <><FaSave /> Save Mapping</>}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={buttonStyle(COLORS.border, COLORS.text)}
                >
                  <FaTimes /> Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Mappings Table */}
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: COLORS.text, marginBottom: "20px" }}>Current Production Mappings</h2>

          {loading ? (
            <div style={{ padding: "48px", textAlign: "center", color: COLORS.subtext }}>Loading mappings...</div>
          ) : mappings.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: COLORS.subtext }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>📋</div>
              <div style={{ fontSize: "16px", fontWeight: "500", marginBottom: "4px" }}>No production mappings found</div>
              <div style={{ fontSize: "14px" }}>Start by adding a new mapping above.</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: COLORS.background, borderBottom: `1px solid ${COLORS.border}` }}>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: COLORS.subtext }}>Product Name</th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: COLORS.subtext }}>Category</th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: COLORS.subtext }}>Raw Materials Required</th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: COLORS.subtext }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mappings.map((mapping) => (
                    <tr key={mapping._id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      <td style={{ padding: "12px", fontSize: "14px", color: COLORS.text, fontWeight: "500" }}>{mapping.productName}</td>
                      <td style={{ padding: "12px", fontSize: "14px", color: COLORS.text }}>{mapping.productId?.category || "—"}</td>
                      <td style={{ padding: "12px", fontSize: "14px", color: COLORS.text }}>
                        {mapping.rawMaterials.map((rm, idx) => (
                          <div key={idx} style={{ marginBottom: "4px" }}>
                            • {rm.rawMaterialName}: <strong>{rm.quantityPerUnit} {rm.measurementType}</strong> per unit
                          </div>
                        ))}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => handleEdit(mapping)}
                            style={{ ...buttonStyle(COLORS.primary, COLORS.card), padding: "6px 12px" }}
                          >
                            <FaEdit /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(mapping.productId._id)}
                            style={{ ...buttonStyle(COLORS.danger, COLORS.card), padding: "6px 12px" }}
                          >
                            <FaTrash /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {toast.show && (
        <div style={{
          position: 'fixed', bottom: '20px', right: '20px',
          background: toast.type === 'success' ? COLORS.success : COLORS.danger,
          color: COLORS.card, padding: '12px 20px', borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000,
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}
    </div>
  );
}

