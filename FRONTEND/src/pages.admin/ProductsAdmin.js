// Admin Products page
// Manages product CRUD, category management (inline modal), validations, filtering,
// analytics (pie chart), and PDF export. UI uses inline styles for simplicity.
import React, { useState, useEffect, useMemo, useRef } from "react";
import http from "../api/http";
import AdminSidebar from "../components/AdminSidebar";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function ProductsAdmin() {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    unitPrice: "",
    addDate: new Date().toISOString().slice(0, 10),
    discountPercent: "0",
  });
  const [file, setFile] = useState(null); // updated to handle PDF or image
  const [searchText, setSearchText] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [errors, setErrors] = useState({}); // <-- validation errors
  const pieChartRef = useRef(null);
  
  // === Category Management (state + effects)
  // Categories are managed inline via a small modal. We fetch the list for
  // select dropdowns and allow creating/deleting categories without navigating.
  // Categories from backend
  const [categories, setCategories] = useState([]);
  // Modal visibility
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  // Modal form state
  const [catName, setCatName] = useState("");
  const [catError, setCatError] = useState("");
  const [editingCategoryName, setEditingCategoryName] = useState(null);
  const [editCatInput, setEditCatInput] = useState("");
  const [editCatError, setEditCatError] = useState("");

  const finalPrice = useMemo(() => {
    const price = Number(form.unitPrice || 0);
    const disc = Number(form.discountPercent || 0);
    return Math.max(0, price - (price * disc) / 100).toFixed(2);
  }, [form.unitPrice, form.discountPercent]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await http.get("/products");
      if (res.data.ok) setProducts(res.data.products);
      else alert("Failed to fetch products");
    } catch (err) {
      console.error(err);
      alert("Error fetching products");
    }
  };

  // Fetch categories once and reuse for refresh
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await http.get("/product-categories");
      setCategories(res.data?.categories || []);
    } catch (e) {
      console.error(e);
      alert("Failed to load categories");
    }
  };

  // When we need IDs (for delete)
  const fetchCategoriesFull = async () => {
    const res = await http.get("/product-categories?full=1");
    return res.data?.items || []; // [{ id, name, slug }]
  };

  // Edit category name by existing name
  const handleEditCategoryByName = async (oldName) => {
    try {
      const full = await fetchCategoriesFull(); // [{id, name, slug}]
      const hit = full.find((x) => x.name === oldName);
      if (!hit) return alert("Could not find category id. Please refresh.");

      const input = window.prompt(`Rename category "${oldName}" to:`, oldName);
      if (input === null) return; // cancelled
      const n = normalize(input);
      if (!isValidName(n)) {
        return alert("Only letters allowed (2–60 chars, must start with a letter)");
      }

      const res = await http.patch(`/product-categories/${hit.id}`, { name: n });
      if (res.data?.ok) {
        await fetchCategories();
        alert("Category renamed successfully");
      } else {
        alert(res.data?.message || "Update failed");
      }
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Update failed");
    }
  };

  // Validation helpers mirroring backend rules
  // Note: As per requirement, category names are restricted to letters and spaces only (2â€“60 chars).
  const normalize = (s) => String(s || "").trim().replace(/\s+/g, " ");
  // Product/category name validation (kept simple and predictable for UX)
  const isValidName = (name) => {
    const n = normalize(name);
    if (!n || n.length < 2 || n.length > 60) return false;
    if (!/^[A-Za-z]/.test(n)) return false; // must start with a letter
    if (!/^[A-Za-z][A-Za-z ]*$/.test(n)) return false; // letters and spaces only
    return true;
  };

  // Create new category
  // Submits a new category name after client-side validation. On success,
  // we refresh the categories list so the new option appears immediately.
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    const n = normalize(catName);
    if (!isValidName(n)) {
      setCatError("Only letters and spaces allowed (2–60 chars, must start with a letter)");
      return;
    }
    try {
      const res = await http.post("/product-categories", { name: n });
      if (res.data?.ok) {
        setCatName("");
        setCatError("");
        await fetchCategories();
      } else {
        alert(res.data?.message || "Create failed");
      }
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Create failed");
    }
  };

  // Delete by finding ID via ?full=1
  const handleDeleteCategoryByName = async (name) => {
    try {
      const full = await fetchCategoriesFull(); // [{id, name}]
      const hit = full.find((x) => x.name === name);
      if (!hit) return alert("Could not find category id. Please refresh.");
      if (!window.confirm(`Delete category "${hit.name}"?`)) return;
      const delRes = await http.delete(`/product-categories/${hit.id}`);
      if (delRes.data?.ok) {
        await fetchCategories();
      } else {
        alert(delRes.data?.message || "Delete failed");
      }
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Delete failed");
    }
  };
  const startEditCategory = (name) => {
    setEditingCategoryName(name);
    setEditCatInput(name);
    setEditCatError("");
  };

  const cancelEditCategory = () => {
    setEditingCategoryName(null);
    setEditCatInput("");
    setEditCatError("");
  };

  const saveEditCategory = async () => {
    if (!editingCategoryName) return;
    const n = normalize(editCatInput);
    if (!isValidName(n)) {
      setEditCatError("Only letters and spaces allowed (2–60 chars, must start with a letter)");
      return;
    }
    // No change — do nothing
    if (n === editingCategoryName) {
      cancelEditCategory();
      return;
    }
    try {
      const full = await fetchCategoriesFull();
      const hit = full.find((x) => x.name === editingCategoryName);
      if (!hit) {
        alert("Could not find category id. Please refresh.");
        return;
      }
      const res = await http.patch(`/product-categories/${hit.id}`, { name: n });
      if (res.data?.ok) {
        await fetchCategories();
        cancelEditCategory();
        alert("Category renamed successfully");
      } else {
        alert(res.data?.message || "Update failed");
      }
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Update failed");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const res = await http.delete(`/products/${id}`);
        if (res.data.ok) {
          alert("Product deleted successfully");
          fetchProducts();
        } else alert(res.data.message || "Delete failed");
      } catch (err) {
        console.error(err);
        alert("Error deleting product");
      }
    }
  };

  // Validate product form fields before submit (client-side checks for UX)
  const validateForm = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Product name is required";
    else if (!/^[A-Za-z]/.test(form.name)) newErrors.name = "Product name must start with a letter";
    else if (!/^[A-Za-z][A-Za-z0-9\s\*]*$/.test(form.name)) newErrors.name = "Product name can only contain letters, numbers, spaces and * symbol after the first letter";
    if (!form.category.trim()) newErrors.category = "Please select a category";
    if (!form.description.trim() || form.description.trim().length < 10) newErrors.description = "Description must be at least 10 characters";
    if (!form.unitPrice || isNaN(form.unitPrice) || Number(form.unitPrice) <= 0) newErrors.unitPrice = "Unit price must be greater than 0";
    if (form.discountPercent === "" || isNaN(form.discountPercent) || Number(form.discountPercent) < 0 || Number(form.discountPercent) > 95) newErrors.discountPercent = "Discount percent must be between 0 and 95";
    if (!form.addDate) newErrors.addDate = "Add date is required";

    const selectedDate = new Date(form.addDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) newErrors.addDate = "Add date cannot be in the past";

    if (!editingProduct && !file) newErrors.file = "Please upload a PDF or image";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("category", form.category);
      formData.append("description", form.description);
      formData.append("unitPrice", form.unitPrice);
      formData.append("addDate", form.addDate);
      formData.append("discountPercent", form.discountPercent);

      if (file) formData.append("file", file);

      if (editingProduct) {
        await http.patch(`/products/${editingProduct._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await http.post("/products", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      alert(editingProduct ? "Product updated successfully!" : "Product added successfully!");
      setShowForm(false);
      setEditingProduct(null);
      setForm({
        name: "",
        category: "",
        description: "",
        unitPrice: "",
        addDate: new Date().toISOString().slice(0, 10),
        discountPercent: "0",
      });
      setFile(null);
      setErrors({});
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Action failed. Make sure you are logged in as admin.");
    }
  };

  const openEditForm = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      category: product.category,
      description: product.description,
      unitPrice: product.unitPrice,
      addDate: product.addDate ? product.addDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
      discountPercent: product.discountPercent || "0",
    });
    setFile(null);
    setErrors({});
    setShowForm(true);
  };

  const filteredProducts = products.filter((p) => {
    const matchesName = p.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = filterCategory === "" || p.category === filterCategory;
    return matchesName && matchesCategory;
  });

  const pieData = categories.map((cat) => ({
    name: cat,
    value: products.filter((p) => p.category === cat).length,
  }));
  // Generate a simple products PDF report using jsPDF + autoTable
  const generatePDFReport = () => {
    try {
      const pdf = new jsPDF();
      // Title & metadata
      pdf.setFontSize(20);
      pdf.text('Green Lion Company', 105, 16, { align: 'center' });
      pdf.setFontSize(14);
      pdf.text('Product Report', 105, 24, { align: 'center' });
      const generatedAt = new Date().toLocaleString();
      pdf.setFontSize(10);
      pdf.text(`Generated: ${generatedAt}`, 14, 32);
      // Build rows: [Name, Category, Price, Add Date]
      const rows = products.map((p) => ([
        p.name || 'N/A',
        p.category || 'N/A',
        `LKR ${Number(p.unitPrice || 0).toFixed(2)}`,
        p.addDate ? p.addDate.slice(0, 10) : 'N/A',
      ]));
      // Table (call the function, not pdf.autoTable)
      autoTable(pdf, {
        head: [['Name', 'Category', 'Price', 'Add Date']],
        body: rows,
        startY: 38,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [30, 127, 59] },
      });
      // Save with requested filename
      pdf.save('Green Lion - Product Details.pdf');
    } catch (e) {
      console.error('PDF generation error:', e);
      alert('Failed to generate PDF');
    }
  };
  
  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <AdminSidebar />
      <div style={{ flex: 1, padding: "24px" }}>
        <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "#1A1A1A", margin: "0 0 8px 0" }}>
          Product Management
        </h1>
        <p style={{ color: "#6B7280", fontSize: "16px", margin: 0 }}>
            Manage your product catalog, pricing, and inventory
          </p>
        </div>

        <div style={{ marginBottom: "24px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            style={{
              backgroundColor: "#E8F5E8",
              color: "#1E7F3B",
              padding: "12px 20px",
              border: "2px solid #1E7F3B",
              borderRadius: "10px",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              fontSize: "14px",
              fontWeight: "500",
            }}
            onClick={() => {
              setShowForm(true);
              setEditingProduct(null);
              setForm({
                name: "",
                category: "",
                description: "",
                unitPrice: "",
                addDate: new Date().toISOString().slice(0, 10),
                discountPercent: "0",
              });
              setFile(null);
              setErrors({});
            }}
          >
            Add New Product
          </button>

          <button
            style={{
              backgroundColor: "#F5F1ED",
              color: "#5C3D2E",
              padding: "12px 20px",
              border: "2px solid #5C3D2E",
              borderRadius: "10px",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              fontSize: "14px",
              fontWeight: "500",
            }}
            // Open the inline Category Manager modal (kept in this file for viva simplicity)
            onClick={() => setShowCategoryModal(true)}
          >
            Manage Categories
          </button>

          <button
            style={{
              backgroundColor: "#E3F2FD",
              color: "#1565C0",
              padding: "12px 20px",
              border: "2px solid #1565C0",
              borderRadius: "10px",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              fontSize: "14px",
              fontWeight: "500",
            }}
            onClick={() => generatePDFReport()}
          >
            Generate Report
          </button>

          <button
            style={{
              backgroundColor: "#FFF3E0",
              color: "#F57C00",
              padding: "12px 20px",
              border: "2px solid #F57C00",
              borderRadius: "10px",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              fontSize: "14px",
              fontWeight: "500",
            }}
            onClick={() => {
              pieChartRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Product Analytics
          </button>

          <input
            type="text"
            placeholder="Search product by name..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
          />

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* === Category Manager Modal (opened in-place; no route change) === */}
        {showCategoryModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.3)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
            }}
          >
            <div style={{ background: "#fff", padding: 20, borderRadius: 12, width: 520, boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
              <h2 style={{ marginTop: 0 }}>Manage Categories</h2>

              {/* Create form */}
              <form onSubmit={handleCreateCategory} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
                <input
                  value={catName}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const cleaned = raw.replace(/[^A-Za-z\s]/g, ""); // allow letters and spaces only
                    if (raw !== cleaned) {
                      setCatError("Only letters and spaces allowed");
                    } else {
                      setCatError("");
                    }
                    setCatName(cleaned);
                  }}
                  onKeyDown={(e) => {
                    const allowedControl = [
                      "Backspace",
                      "Delete",
                      "Tab",
                      "Enter",
                      "ArrowLeft",
                      "ArrowRight",
                      "Home",
                      "End"
                    ];
                    if (!/^[A-Za-z ]$/.test(e.key) && !allowedControl.includes(e.key)) {
                      e.preventDefault();
                      setCatError("Only letters and spaces allowed");
                    }
                  }}
                  placeholder="New category name"
                  style={{ flex: 1, padding: 8, borderRadius: 8, border: `1px solid ${catError ? "red" : "#cbd5e1"}` }}
                />
                <button type="submit" style={{ padding: "8px 12px", border: "none", borderRadius: 8, background: "#1E7F3B", color: "#fff" }}>
                  Add
                </button>
              </form>
              {catError && <div style={{ color: "red", marginBottom: 8, fontSize: 12 }}>{catError}</div>}

            {/* List with delete (simple for viva) */}
            <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, maxHeight: 260, overflowY: "auto" }}>
              {categories.length === 0 ? (
                <div style={{ padding: 12, textAlign: "center", color: "#64748b" }}>No categories</div>
              ) : (
                categories.map((c) => (
                  <div key={c} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>
                    {editingCategoryName === c ? (
                      <>
                        <input
                          value={editCatInput}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const cleaned = raw.replace(/[^A-Za-z\s]/g, "");
                            if (raw !== cleaned) {
                              setEditCatError("Only letters and spaces allowed");
                            } else {
                              setEditCatError("");
                            }
                            setEditCatInput(cleaned);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              saveEditCategory();
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              cancelEditCategory();
                            }
                          }}
                          placeholder="Edit category name"
                          style={{ flex: 1, padding: 8, borderRadius: 8, border: `1px solid ${editCatError ? "red" : "#cbd5e1"}` }}
                        />
                        <button type="button" onClick={saveEditCategory} style={{ padding: "6px 10px", border: "none", borderRadius: 6, background: "#1E7F3B", color: "#fff" }}>
                          Save
                        </button>
                        <button type="button" onClick={cancelEditCategory} style={{ padding: "6px 10px", border: "none", borderRadius: 6, background: "#6B7280", color: "#fff" }}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <span style={{ flex: 1 }}>{c}</span>
                        <button
                          type="button"
                          onClick={() => startEditCategory(c)}
                          style={{ padding: "6px 10px", border: "none", borderRadius: 6, background: "#f59e0b", color: "#fff" }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategoryByName(c)}
                          style={{ padding: "6px 10px", border: "none", borderRadius: 6, background: "#ef4444", color: "#fff" }}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Close */}
            <div style={{ marginTop: 12, textAlign: "right" }}>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                style={{ padding: "8px 12px", border: "none", borderRadius: 8, background: "#6B7280", color: "#fff" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

        {showForm && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0,0,0,0.3)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
            }}
          >
            <form
              onSubmit={handleSubmit}
              style={{
                backgroundColor: "#FFFFFF",
                padding: "20px",
                borderRadius: "14px",
                width: "600px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
              }}
            >
              <h2 style={{ marginBottom: "16px", color: "#1A1A1A" }}>
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {/* Name */}
                <div>
                  <label>Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => {
                      const value = e.target.value;
                      
                      // If it's the first character and not a letter, don't allow it
                      if (value.length === 1 && !/^[A-Za-z]$/.test(value)) {
                        setErrors((prev) => ({ ...prev, name: "Product name must start with a letter" }));
                        return; // Don't update the form
                      }
                      
                      // If it's not the first character, check the full pattern
                      if (value.length > 1 && !/^[A-Za-z][A-Za-z0-9\s\*]*$/.test(value)) {
                        setErrors((prev) => ({ ...prev, name: "Only letters, numbers, spaces and * allowed after first letter" }));
                        return; // Don't update the form
                      }
                      
                      // If we reach here, the input is valid
                      setForm({ ...form, name: value });
                      
                      // Live validation
                      if (!value.trim()) {
                        setErrors((prev) => ({ ...prev, name: "Product name is required" }));
                      } else {
                        setErrors((prev) => ({ ...prev, name: "" }));
                      }
                    }}
                    onKeyDown={(e) => {
                      // If it's the first character and not a letter, prevent it
                      if (form.name.length === 0 && !/^[A-Za-z]$/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'Enter') {
                        e.preventDefault();
                        setErrors((prev) => ({ ...prev, name: "Product name must start with a letter" }));
                      }
                      // If it's not the first character, check if the resulting value would be valid
                      else if (form.name.length > 0 && !/^[A-Za-z0-9\s\*]$/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'Enter' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'ArrowUp' && e.key !== 'ArrowDown') {
                        e.preventDefault();
                        setErrors((prev) => ({ ...prev, name: "Only letters, numbers, spaces and * allowed after first letter" }));
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "8px",
                      border: `1px solid ${errors.name ? "red" : "#cbd5e1"}`,
                    }}
                  />
                  {errors.name && <p style={{ color: "red", fontSize: "12px", margin: "4px 0 0 0" }}>{errors.name}</p>}
                </div>

                {/* Category */}
                <div>
                  <label>Category</label>
                  <select
                    required
                    value={form.category}
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm({ ...form, category: value });
                      if (!value.trim()) setErrors((prev) => ({ ...prev, category: "Please select a category" }));
                      else setErrors((prev) => ({ ...prev, category: "" }));
                    }}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "8px",
                      border: `1px solid ${errors.category ? "red" : "#cbd5e1"}`,
                    }}
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.category && <p style={{ color: "red", fontSize: "12px", margin: "4px 0 0 0" }}>{errors.category}</p>}
                </div>

                {/* Description */}
                <div style={{ gridColumn: "1 / span 2" }}>
                  <label>Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm({ ...form, description: value });
                      if (!value.trim() || value.trim().length < 10) setErrors((prev) => ({ ...prev, description: "Description must be at least 10 characters" }));
                      else setErrors((prev) => ({ ...prev, description: "" }));
                    }}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "8px",
                      border: `1px solid ${errors.description ? "red" : "#cbd5e1"}`,
                      minHeight: "80px"
                    }}
                  />
                  {errors.description && <p style={{ color: "red", fontSize: "12px", margin: "4px 0 0 0" }}>{errors.description}</p>}
                </div>

                {/* Unit Price */}
                <div>
                  <label>Unit Price</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={form.unitPrice}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Prevent negative values and zero
                      if (value === '' || (Number(value) > 0)) {
                        setForm({ ...form, unitPrice: value });
                        if (!value || Number(value) <= 0) {
                          setErrors((prev) => ({ ...prev, unitPrice: "Unit price must be greater than 0" }));
                        } else {
                          setErrors((prev) => ({ ...prev, unitPrice: "" }));
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      // Prevent typing minus sign
                      if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                        e.preventDefault();
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "8px",
                      border: `1px solid ${errors.unitPrice ? "red" : "#cbd5e1"}`
                    }}
                  />
                  {errors.unitPrice && <p style={{ color: "red", fontSize: "12px", margin: "4px 0 0 0" }}>{errors.unitPrice}</p>}
                </div>

                {/* Add Date */}
                <div>
                  <label>Add Date</label>
                  <input
                    type="date"
                    required
                    value={form.addDate}
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm({ ...form, addDate: value });
                      const selected = new Date(value);
                      const today = new Date();
                      today.setHours(0,0,0,0);
                      if (!value) setErrors((prev) => ({ ...prev, addDate: "Add date is required" }));
                      else if (selected < today) setErrors((prev) => ({ ...prev, addDate: "Cannot be in the past" }));
                      else setErrors((prev) => ({ ...prev, addDate: "" }));
                    }}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "8px",
                      border: `1px solid ${errors.addDate ? "red" : "#cbd5e1"}`
                    }}
                    min={new Date().toISOString().slice(0, 10)}
                  />
                  {errors.addDate && <p style={{ color: "red", fontSize: "12px", margin: "4px 0 0 0" }}>{errors.addDate}</p>}
                </div>

                {/* File */}
                <div style={{ gridColumn: "1 / span 2" }}>
                  <label>Upload Product PDF or Image</label>
                  <input
                    type="file"
                    accept="application/pdf, image/*"
                    onChange={(e) => {
                      setFile(e.target.files[0]);
                      if (!e.target.files[0] && !editingProduct) setErrors((prev) => ({ ...prev, file: "Please upload a file" }));
                      else setErrors((prev) => ({ ...prev, file: "" }));
                    }}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "8px",
                      border: `1px solid ${errors.file ? "red" : "#cbd5e1"}`
                    }}
                  />
                  {errors.file && <p style={{ color: "red", fontSize: "12px", margin: "4px 0 0 0" }}>{errors.file}</p>}
                </div>

                {/* Discount */}
                <div>
                  <label>Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="95"
                    value={form.discountPercent}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d{0,2}$/.test(value) && Number(value) <= 95) {
                        setForm({ ...form, discountPercent: value });
                        setErrors((prev) => ({ ...prev, discountPercent: "" }));
                      } else setErrors((prev) => ({ ...prev, discountPercent: "Discount must be 0-95%" }));
                    }}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "8px",
                      border: `1px solid ${errors.discountPercent ? "red" : "#cbd5e1"}`
                    }}
                  />
                  {errors.discountPercent && <p style={{ color: "red", fontSize: "12px", margin: "4px 0 0 0" }}>{errors.discountPercent}</p>}
                </div>

                {/* Final Price Preview */}
                <div>
                  <label>Final Price Preview</label>
                  <input
                    type="text"
                    disabled
                    value={`LKR ${finalPrice}`}
                    style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#f3f4f6" }}
                  />
                </div>
              </div>

              <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button
                  type="submit"
                  style={{ backgroundColor: "#1E7F3B", color: "#FFFFFF", padding: "8px 16px", border: "none", borderRadius: "8px", cursor: "pointer" }}
                >
                  {editingProduct ? "Update Product" : "Add Product"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{ backgroundColor: "#ef4444", color: "#FFFFFF", padding: "8px 16px", border: "none", borderRadius: "8px", cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Rest of your table and pie chart remains unchanged */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#FFFFFF", borderRadius: "10px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
            <thead>
              <tr style={{ backgroundColor: "#e2e8f0" }}>
                <th style={{ padding: "12px", textAlign: "left" }}>Name</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Category</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Unit Price</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Discount</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Final Price</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Added Date</th>
                <th style={{ padding: "12px", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: "12px", textAlign: "center", color: "#6B7280" }}>
                    No products found
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const final = (Number(p.unitPrice) - (Number(p.unitPrice) * Number(p.discountPercent || 0)) / 100).toFixed(2);
                  return (
                    <tr key={p._id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "12px" }}>{p.name}</td>
                      <td style={{ padding: "12px" }}>{p.category}</td>
                      <td style={{ padding: "12px" }}>LKR {Number(p.unitPrice).toFixed(2)}</td>
                      <td style={{ padding: "12px" }}>{p.discountPercent || 0}%</td>
                      <td style={{ padding: "12px" }}>LKR {final}</td>
                      <td style={{ padding: "12px" }}>{p.addDate ? p.addDate.slice(0, 10) : "N/A"}</td>
                      <td style={{ padding: "12px", textAlign: "center", display: "flex", gap: "8px", justifyContent: "center" }}>
                        <button
                          onClick={() => openEditForm(p)}
                          style={{ backgroundColor: "#f59e0b", color: "#FFFFFF", border: "none", borderRadius: "8px", padding: "6px 12px", cursor: "pointer" }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p._id)}
                          style={{ backgroundColor: "#ef4444", color: "#FFFFFF", border: "none", borderRadius: "8px", padding: "6px 12px", cursor: "pointer" }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div
          ref={pieChartRef}
          style={{
            width: "100%",
            height: "300px",
            backgroundColor: "#FFFFFF",
            borderRadius: "10px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            padding: "16px",
            marginTop: "32px",
          }}
        >
          <h3 style={{ marginBottom: "16px", color: "#1A1A1A" }}>Product Category Analysis</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}