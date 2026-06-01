// FRONTEND/src/pages.shared/SupplierPortal.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../api/http";

const COLORS = {
  bg: "#f8fafc",
  card: "#ffffff",
  text: "#0f172a",
  sub: "#475569",
  line: "#e5e7eb",
  brand: "#1E7F3B",
  brandBg: "rgba(30,127,59,0.10)",
  red: "#dc2626",
  redBg: "rgba(220,38,38,0.08)",
};

export default function SupplierPortal() {
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [poList, setPoList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [defaultCategoryId, setDefaultCategoryId] = useState("");
  const [materials, setMaterials] = useState([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [qMat, setQMat] = useState("");
  const [sortMat, setSortMat] = useState("name-asc");
  const [currentTab, setCurrentTab] = useState("materials"); // materials | orders | purchaseOrders | profile
  const [matModalOpen, setMatModalOpen] = useState(false);
  const [matModalMode, setMatModalMode] = useState("add"); // add | edit
  const emptyMat = { 
    categoryId: "", 
    quantity: "", 
    measurementType: "", 
    unitPrice: "", 
    offerDiscount: "", 
    deliveryWithinDays: "", 
    additionalNotes: "" 
  };
  const [matForm, setMatForm] = useState(emptyMat);
  const [matSaving, setMatSaving] = useState(false);
  const [matError, setMatError] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [calculatedTotals, setCalculatedTotals] = useState({
    originalTotal: 0,
    discountedTotal: 0,
    calculatedDeliveryDate: null
  });
  const nav = useNavigate();

  const toast = (message, variant = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, variant }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  };

  const formatMoney = (n) =>
    isNaN(Number(n))
      ? "-"
      : new Intl.NumberFormat("en-LK", {
          style: "currency",
          currency: "LKR",
          maximumFractionDigits: 0,
        }).format(Number(n));

  const calcFinal = (price, discountPercent) => {
    const p = Number(price || 0);
    const d = Math.min(100, Math.max(0, Number(discountPercent || 0)));
    return Math.max(0, Math.round((p - (p * d / 100)) * 100) / 100);
  };

  // Calculate totals and delivery date
  const calculateTotals = (formData) => {
    const quantity = Number(formData.quantity || 0);
    const unitPrice = Number(formData.unitPrice || 0);
    const originalTotal = quantity * unitPrice;
    
    // Calculate discounted total based on offer
    let discountedTotal = originalTotal;
    const offerText = String(formData.offerDiscount || "").trim();
    
    if (offerText) {
      // Check if it's a percentage discount (e.g., "10%", "10% off")
      const percentMatch = offerText.match(/(\d+(?:\.\d+)?)\s*%/i);
      if (percentMatch) {
        const discountPercent = Number(percentMatch[1]);
        discountedTotal = originalTotal * (1 - discountPercent / 100);
      } else {
        // Check if it's a fixed amount discount (e.g., "Rs. 500", "500 off")
        const amountMatch = offerText.match(/(?:rs\.?\s*)?(\d+(?:\.\d+)?)/i);
        if (amountMatch) {
          const discountAmount = Number(amountMatch[1]);
          discountedTotal = Math.max(0, originalTotal - discountAmount);
        }
      }
    }

    // Calculate delivery date
    const deliveryWithinDays = Number(formData.deliveryWithinDays || 0);
    const calculatedDeliveryDate = deliveryWithinDays > 0 ? new Date() : null;
    if (calculatedDeliveryDate) {
      calculatedDeliveryDate.setDate(calculatedDeliveryDate.getDate() + deliveryWithinDays);
    }

    return {
      originalTotal,
      discountedTotal,
      calculatedDeliveryDate
    };
  };

  async function load() {
    setLoading(true);
    try {
    try {
      const p = await http.get("/supplier-self/me");
        console.log("Supplier profile API response:", p); // Debug log
      if (p.data?.ok) setProfile(p.data.supplier);
      } catch (profileError) {
        console.error("Error loading supplier profile:", profileError); // Debug log
        console.error("Profile error response:", profileError?.response?.data); // Debug log
      }

      const o = await http.get("/supplier-self/orders");
      if (o.data?.ok) setOrders(o.data.orders || []);
      const pos = await http.get("/supplier-self/purchase-orders");
      if (pos.data?.ok) setPoList(pos.data.purchaseOrders || []);
      try {
      const cats = await http.get("/api/material-categories");
        console.log("Categories API response:", cats); // Debug log
        console.log("Categories response data:", cats?.data); // Debug log
      const catArr = Array.isArray(cats?.data?.categories)
        ? cats.data.categories
        : Array.isArray(cats?.data)
          ? cats.data
          : Array.isArray(cats?.data?.data)
            ? cats.data.data
            : [];
        console.log("Processed categories array:", catArr); // Debug log
        console.log("Categories count:", catArr.length); // Debug log
      setCategories(catArr);
      setCategoriesLoaded(true);
      } catch (catError) {
        console.error("Error loading categories:", catError); // Debug log
        console.error("Categories error response:", catError?.response?.data); // Debug log
        setCategories([]);
        setCategoriesLoaded(true);
      }

      const mats = await http.get("/supplier-self/materials");
      if (mats.data?.ok) setMaterials(mats.data.items || []);
      setMsg("");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  // When navigating to Purchase Orders, reload data to reflect latest Best marks and POs
  useEffect(() => {
    if (currentTab === 'purchaseOrders') {
      load();
    }
  }, [currentTab]);

  // Helper to normalize category names: lowercase and strip non-alphanumerics
  const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "").trim();

  // When categories and profile are available, resolve the supplier's registered category to an ID
  useEffect(() => {
    if (!profile || categories.length === 0) return;
    const reg = norm(profile.category);
    const match = categories.find(c => norm(c.name) === reg) ||
                  categories.find(c => norm(c.name).includes(reg) || reg.includes(norm(c.name))); // fallback fuzzy
    setDefaultCategoryId(match?._id || "");
  }, [profile, categories]);

  // If modal is open in add mode, ensure categoryId is set and materialCode = admin category CODE
  useEffect(() => {
    if (!matModalOpen || matModalMode !== 'add') return;
    setMatForm((f) => {
      const withCat = defaultCategoryId ? { ...f, categoryId: defaultCategoryId } : f;
      const catObj = categories.find(c => c._id === (defaultCategoryId || withCat.categoryId));
      const code = (catObj?.code || '').toUpperCase();
      return { ...withCat, materialCode: code || withCat.materialCode };
    });
  }, [matModalOpen, matModalMode, defaultCategoryId, categories]);

  const canModify = (o) => !["confirmed", "completed"].includes(o.status);

  const card = {
    background: COLORS.card,
    border: `1px solid ${COLORS.line}`,
    borderRadius: 12,
    boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
  };
  const btn = (bg, color = "#fff") => ({
    padding: "10px 14px",
    background: bg,
    color,
    border: 0,
    borderRadius: 10,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: bg === '#fff' ? 'none' : '0 6px 14px rgba(30,127,59,0.18)',
    transition: 'all .15s ease',
  });
  const tabBtn = (active) => ({
    background: active ? COLORS.brandBg : '#fff',
    color: active ? COLORS.brand : COLORS.text,
    border: `1px solid ${active ? 'rgba(30,127,59,0.35)' : COLORS.line}`,
    padding:'8px 12px', borderRadius: 999, fontWeight:700, cursor:'pointer',
    transition:'all .15s ease',
  });
  const inputBase = (error) => ({
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    border: `1px solid ${error ? COLORS.red : COLORS.line}`,
    outline: 'none',
    background: '#fff',
    '&:focus': {
      borderColor: error ? COLORS.red : COLORS.brand,
    },
  });
  const selectBase = { ...inputBase };

  // Form validation function
  const validateForm = () => {
    const errors = {};
    
    // Category validation
    if (!matForm.categoryId) {
      errors.categoryId = 'Please select a Category';
    }
    
    // Quantity validation
    if (!matForm.quantity) {
      errors.quantity = 'Quantity is required';
    } else if (isNaN(matForm.quantity) || Number(matForm.quantity) <= 0) {
      errors.quantity = 'Quantity cannot be zero';
    }
    
    // Unit Price validation (optional)
    if (matForm.unitPrice && (isNaN(matForm.unitPrice) || Number(matForm.unitPrice) < 0)) {
      errors.unitPrice = 'Unit price must be 0 or greater';
    }
    
    // Delivery Within Days validation
    if (!matForm.deliveryWithinDays) {
      errors.deliveryWithinDays = 'Delivery within (days) is required';
    } else if (isNaN(matForm.deliveryWithinDays) || Number(matForm.deliveryWithinDays) <= 0) {
      errors.deliveryWithinDays = 'Delivery days must be a positive number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Generate a unique material code using the admin Category CODE
  const genMaterialCode = () => {
    const catObj = categories.find(c => c._id === (defaultCategoryId || matForm.categoryId));
    const catCode = (catObj?.code || '').toUpperCase();
    // Fallback: derive from supplier's registered category if code missing
    const fallback = (String(profile?.category || '').match(/\b[\p{L}\p{N}]/gu) || []).join('').toUpperCase().slice(0,6) || 'MAT';
    const prefix = catCode || fallback;
    const ts = Date.now().toString().slice(-5);
    const rand = Math.floor(Math.random()*36*36).toString(36).toUpperCase().padStart(2, '0');
    return `${prefix}-${ts}${rand}`;
  };

  function StatusPill({ status }) {
    const map = {
      confirmed: { fg: COLORS.brand, bg: COLORS.brandBg },
      rejected: { fg: COLORS.red, bg: COLORS.redBg },
      completed: { fg: "#2563eb", bg: "rgba(37,99,235,0.10)" },
      default: { fg: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    };
    const c = map[status] || map.default;
    return (
      <span style={{
        display: "inline-block", padding: "4px 10px", borderRadius: 999,
        background: c.bg, color: c.fg, fontSize: 12, fontWeight: 700, textTransform: "capitalize",
      }}>{status}</span>
    );
  }

  async function remove(o) {
    if (!window.confirm("Delete this order?")) return;
    try {
      const { data } = await http.delete(`/supplier-self/orders/${o._id}`);
      if (data?.ok) {
        toast("Order deleted");
        await load();
      }
    } catch (e) {
      toast(e?.response?.data?.message || "Delete failed", "error");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, padding: 24, color: COLORS.text }}>
      {/* toasts */}
      <div style={{ position: "fixed", top: 16, right: 16, display: "flex", flexDirection: "column", gap: 8, zIndex: 1000 }}>
        {toasts.map((t) => (
          <div key={t.id} style={{
            minWidth: 240, maxWidth: 420, padding: "10px 14px", borderRadius: 8,
            color: t.variant === "success" ? COLORS.brand : COLORS.red,
            background: t.variant === "success" ? COLORS.brandBg : COLORS.redBg,
            border: `1px solid ${t.variant === "success" ? "rgba(30,127,59,0.35)" : "rgba(220,38,38,0.35)"}`,
          }}>{t.message}</div>
        ))}
      </div>
      

      {/* Header (gradient banner) */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30,127,59,0.12), rgba(37,99,235,0.10))',
        border: `1px solid ${COLORS.line}`,
        borderRadius: 14,
        padding: 16,
        display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:14
      }}>
        <div>
          <h2 style={{ margin: 0 }}>Supplier Portal</h2>
          <div style={{ color: COLORS.sub, marginTop: 4, fontSize: 13 }}>Manage profile, materials, and orders</div>
        </div>
        <div style={{ fontSize:28 }}>🤝</div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        {[
          { key:'materials', label:'My Orders' },
          { key:'purchaseOrders', label:'Purchase Orders' },
          { key:'profile', label:'Profile' },
        ].map(t => (
          <button key={t.key} onClick={()=>setCurrentTab(t.key)} style={tabBtn(currentTab===t.key)}>{t.label}</button>
        ))}
      </div>

      {/* KPI row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:12, marginBottom:14 }}>
        {[
          { icon:'📦', title:'Total Materials', value: materials.length, sub:'Items you offer' },
          { icon:'🧾', title:'Purchase Orders', value: poList.length, sub:'Assigned to you' },
          { icon:'⏳', title:'Pending POs', value: poList.filter(p=>p.status!=='confirmed' && p.status!=='delivered').length, sub:'Awaiting action' },
          { icon:'🏢', title:'Profile Status', value: (profile?.status||'-'), sub: profile?.name || '' },
        ].map((k)=> (
          <div key={k.title} style={{ ...card, padding:16, display:'flex', flexDirection:'column', gap:6 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:18 }}>{k.icon}</span>
              <span style={{ color: COLORS.sub, fontSize:12 }}>{k.title}</span>
            </div>
            <div style={{ fontSize:26, fontWeight:800 }}>{k.value}</div>
            <div style={{ color: COLORS.sub, fontSize:12 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Material Modal */}
      {matModalOpen && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(0,0,0,0.35)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1000 
        }}>
          <div style={{ 
            background: '#fff', 
            borderRadius: 12, 
            width: 'min(600px, 95vw)', 
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{ 
              padding: '16px 20px',
              borderBottom: `1px solid ${COLORS.line}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f9fafb'
            }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: COLORS.text }}>
                {matModalMode === 'add' ? 'Add New Orders' : 'Edit Orders'}
              </h3>
              <button
                onClick={() => setMatModalOpen(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: COLORS.sub,
                  '&:hover': {
                    background: '#f1f5f9'
                  }
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Error Message */}
            {matError && (
              <div style={{
                padding: '12px 20px',
                background: '#fef2f2',
                color: COLORS.red,
                borderBottom: `1px solid ${COLORS.red}20`,
                fontSize: 14
              }}>
                {matError}
              </div>
            )}

            {/* Form Content */}
            <div style={{ 
              padding: '24px',
              overflowY: 'auto',
              flex: 1,
              boxSizing: 'border-box'
            }}>
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px',
                marginBottom: '8px',
                alignItems: 'start'
              }}>
                {/* Left Column */}
                <div>
                  <div style={{ 
                    marginBottom: '20px',
                    paddingBottom: '12px',
                    borderBottom: `1px solid ${COLORS.line}`
                  }}>
                    <h4 style={{ 
                      fontSize: 15,
                      color: COLORS.text,
                      margin: 0,
                      fontWeight: 600,
                      letterSpacing: '0.3px'
                    }}>
                      Basic Information
                    </h4>
                  </div>
                  
                  <div style={{ 
                    marginBottom: '20px',
                    position: 'relative'
                  }}>
                    <label style={{
                      display: 'block',
                      fontSize: 13,
                      color: COLORS.sub,
                      marginBottom: '8px',
                      fontWeight: 500,
                      lineHeight: '1.4'
                    }}>
                      Category *
                    </label>
                    <select
                      value={matForm.categoryId}
                      onChange={(e) => {
                        const selectedCategory = categories.find(c => c._id === e.target.value);
                        setMatForm({
                          ...matForm, 
                          categoryId: e.target.value,
                          measurementType: selectedCategory?.measurementType || ""
                        });
                        if (formErrors.categoryId) validateForm();
                      }}
                      style={{
                        ...inputBase(formErrors.categoryId),
                        width: '100%',
                        padding: '11px 14px',
                        fontSize: 14,
                        lineHeight: '1.5',
                        boxSizing: 'border-box',
                        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236b7280\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 10px center',
                        backgroundSize: '16px',
                        appearance: 'none',
                        paddingRight: '32px'
                      }}
                    >
                      <option value="">
                        {categories.length === 0 ? "No categories available" : "Select Category"}
                      </option>
                      {categories.map(category => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.categoryId && (
                      <div style={{ color: COLORS.red, fontSize: 12, marginTop: '4px' }}>
                        {formErrors.categoryId}
                      </div>
                    )}
                    {categories.length === 0 && categoriesLoaded && (
                      <div style={{ color: '#b45309', fontSize: 12, marginTop: '4px' }}>
                        No categories available. Please ask the admin to add categories first.
                      </div>
                    )}
                  </div>

                  <div style={{ 
                    marginBottom: '20px',
                    position: 'relative'
                  }}>
                    <label style={{
                      display: 'block',
                      fontSize: 13,
                      color: COLORS.sub,
                      marginBottom: '8px',
                      fontWeight: 500,
                      lineHeight: '1.4'
                    }}>
                      Quantity *
                    </label>
                    <input
                      type="number"
                      placeholder="Enter quantity"
                      min="1"
                      step="1"
                      value={matForm.quantity}
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
                          const newForm = {...matForm, quantity: value};
                          setMatForm(newForm);
                          setCalculatedTotals(calculateTotals(newForm));
                          if (formErrors.quantity) validateForm();
                        }
                      }}
                      style={{
                        ...inputBase(formErrors.quantity),
                        width: '100%',
                      padding: '11px 14px',
                      fontSize: 14,
                      lineHeight: '1.5',
                        boxSizing: 'border-box'
                      }}
                    />
                    {formErrors.quantity && (
                      <div style={{ color: COLORS.red, fontSize: 12, marginTop: '4px' }}>
                        {formErrors.quantity}
                      </div>
                    )}
                  </div>

                  <div style={{ 
                    marginBottom: '20px',
                    position: 'relative'
                  }}>
                    <label style={{
                      display: 'block',
                      fontSize: 13,
                      color: COLORS.sub,
                      marginBottom: '8px',
                      fontWeight: 500,
                      lineHeight: '1.4'
                    }}>
                      Measurement Type
                    </label>
                    <div style={{
                      ...inputBase(false),
                      background: '#f9f9f9',
                      color: COLORS.sub,
                      padding: '11px 14px',
                      fontSize: 14,
                      lineHeight: '1.5',
                      borderRadius: 6,
                      minHeight: '42px',
                      boxSizing: 'border-box',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {matForm.measurementType || 'Select category first'}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div>
                  <div style={{ 
                    marginBottom: '20px',
                    paddingBottom: '12px',
                    borderBottom: `1px solid ${COLORS.line}`
                  }}>
                    <h4 style={{ 
                      fontSize: 15,
                      color: COLORS.text,
                      margin: 0,
                      fontWeight: 600,
                      letterSpacing: '0.3px'
                    }}>
                      Order Details
                    </h4>
                  </div>

                  <div style={{ 
                    marginBottom: '20px'
                  }}>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: 13,
                        color: COLORS.sub,
                        marginBottom: '6px',
                        fontWeight: 500
                      }}>
                        Unit Price (Optional)
                      </label>
                      <div style={{ position: 'relative' }}>
                        <span style={{
                          position: 'absolute',
                          left: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: COLORS.sub,
                          fontSize: 14
                        }}>
                          LKR
                        </span>
                        <input
                          type="number"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          value={matForm.unitPrice}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || (Number(value) >= 0)) {
                              const newForm = {...matForm, unitPrice: value};
                              setMatForm(newForm);
                              setCalculatedTotals(calculateTotals(newForm));
                              if (formErrors.unitPrice) validateForm();
                            }
                          }}
                          style={{
                            ...inputBase(formErrors.unitPrice),
                            width: '100%',
                            padding: '10px 12px 10px 40px',
                            fontSize: 14,
                            appearance: 'textfield',
                            WebkitAppearance: 'textfield'
                          }}
                        />
                      </div>
                      {formErrors.unitPrice && (
                        <div style={{ color: COLORS.red, fontSize: 12, marginTop: '4px' }}>
                          {formErrors.unitPrice}
                        </div>
                      )}
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: 13,
                        color: COLORS.sub,
                        marginBottom: '6px',
                        fontWeight: 500
                      }}>
                        Offer / Discount (Optional)
                      </label>
                        <input
                        type="text"
                        placeholder="e.g., 10% or Rs. 500"
                        value={matForm.offerDiscount}
                          onKeyDown={(e) => {
                          // Allow only numbers, %, R, s, ., space, and control keys
                          const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
                          const isNumber = /^[0-9]$/.test(e.key);
                          const isAllowedChar = ['%', '.', ' ', 'R', 's'].includes(e.key);
                          
                          if (!isNumber && !isAllowedChar && !allowedKeys.includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                          onChange={(e) => {
                          const value = e.target.value;
                          // Only allow valid discount format: numbers, %, Rs, ., and spaces
                          const validPattern = /^[0-9%Rrs.\s]*$/;
                          if (value === '' || validPattern.test(value)) {
                            const newForm = {...matForm, offerDiscount: value};
                            setMatForm(newForm);
                            setCalculatedTotals(calculateTotals(newForm));
                          }
                          }}
                          style={{
                          ...inputBase(false),
                            width: '100%',
                            padding: '10px 12px',
                          fontSize: 14
                        }}
                      />
                  </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: 13,
                        color: COLORS.sub,
                        marginBottom: '6px',
                        fontWeight: 500
                      }}>
                        Delivery within (days) *
                      </label>
                        <input
                          type="number"
                        placeholder="e.g., 3, 5, 10"
                          min="1"
                        value={matForm.deliveryWithinDays}
                          onChange={(e) => {
                          const newForm = {...matForm, deliveryWithinDays: e.target.value};
                          setMatForm(newForm);
                          setCalculatedTotals(calculateTotals(newForm));
                          if (formErrors.deliveryWithinDays) validateForm();
                          }}
                          style={{
                          ...inputBase(formErrors.deliveryWithinDays),
                            width: '100%',
                            padding: '10px 12px',
                          fontSize: 14
                          }}
                        />
                      {formErrors.deliveryWithinDays && (
                        <div style={{ color: COLORS.red, fontSize: 12, marginTop: '4px' }}>
                          {formErrors.deliveryWithinDays}
                        </div>
                      )}
                      {matForm.deliveryWithinDays && !formErrors.deliveryWithinDays && (
                        <div style={{ color: COLORS.brand, fontSize: 12, marginTop: '4px' }}>
                          Calculated delivery date: {calculatedTotals.calculatedDeliveryDate?.toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    </div>

                  <div style={{ 
                    marginBottom: '20px'
                  }}>
                      <label style={{
                        display: 'block',
                        fontSize: 13,
                        color: COLORS.sub,
                        marginBottom: '6px',
                        fontWeight: 500
                      }}>
                      Additional Notes (Optional)
                      </label>
                    <textarea
                      placeholder="e.g., transport method, material quality, special requirements..."
                      value={matForm.additionalNotes}
                      onChange={(e) => setMatForm({...matForm, additionalNotes: e.target.value})}
                      rows={4}
                        style={{
                          ...inputBase(false),
                          width: '100%',
                          padding: '10px 12px',
                          fontSize: 14,
                        resize: 'vertical',
                        minHeight: '80px',
                        fontFamily: 'inherit'
                      }}
                    />
                    </div>

                  {/* Total Calculation Display */}
                  {(matForm.quantity && matForm.unitPrice) && (
                    <div style={{ 
                      background: '#f0f9ff',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '20px',
                      border: `1px solid #0ea5e9`
                    }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0c4a6e', marginBottom: '12px' }}>
                        Price Calculation
                  </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: 13, color: COLORS.sub }}>Original Total:</span>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{formatMoney(calculatedTotals.originalTotal)}</span>
                      </div>
                      
                      {matForm.offerDiscount && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: 13, color: COLORS.sub }}>Offer/Discount:</span>
                          <span style={{ fontSize: 13, color: '#059669' }}>{matForm.offerDiscount}</span>
                        </div>
                      )}

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                        paddingTop: '8px',
                        borderTop: `1px solid ${COLORS.line}`,
                        marginTop: '8px'
                      }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#0c4a6e' }}>Total Amount (After Offer):</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#0c4a6e' }}>{formatMoney(calculatedTotals.discountedTotal)}</span>
                      </div>
                    </div>
                  )}

                  {/* Summary Display */}
                  {(matForm.categoryId && matForm.quantity && matForm.deliveryWithinDays) && (
                    <div style={{ 
                    background: '#f8fafc',
                    borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '20px',
                      border: `1px solid ${COLORS.line}`
                  }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: '12px' }}>
                        Order Summary
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: 13 }}>
                    <div>
                          <span style={{ color: COLORS.sub }}>Category:</span>
                          <div style={{ fontWeight: 500 }}>{categories.find(c => c._id === matForm.categoryId)?.name || '-'}</div>
                      </div>
                        <div>
                          <span style={{ color: COLORS.sub }}>Quantity:</span>
                          <div style={{ fontWeight: 500 }}>{matForm.quantity}</div>
                      </div>
                        <div>
                          <span style={{ color: COLORS.sub }}>Measurement Type:</span>
                          <div style={{ fontWeight: 500 }}>{matForm.measurementType || '-'}</div>
                    </div>
                        <div>
                          <span style={{ color: COLORS.sub }}>Unit Price:</span>
                          <div style={{ fontWeight: 500 }}>{formatMoney(matForm.unitPrice)}</div>
                    </div>
                        <div>
                          <span style={{ color: COLORS.sub }}>Offer/Discount:</span>
                          <div style={{ fontWeight: 500 }}>{matForm.offerDiscount || '-'}</div>
                  </div>
                        <div>
                          <span style={{ color: COLORS.sub }}>Delivery within:</span>
                          <div style={{ fontWeight: 500 }}>{matForm.deliveryWithinDays} days</div>
                </div>
                        <div>
                          <span style={{ color: COLORS.sub }}>Calculated Delivery Date:</span>
                          <div style={{ fontWeight: 500 }}>{calculatedTotals.calculatedDeliveryDate?.toLocaleDateString() || '-'}</div>
              </div>
                        <div>
                          <span style={{ color: COLORS.sub }}>Total Amount:</span>
                          <div style={{ fontWeight: 600, color: COLORS.brand }}>{formatMoney(calculatedTotals.discountedTotal)}</div>
                        </div>
                      </div>
                    </div>
                  )}

              <div style={{
                background: '#f8fafc',
                    borderRadius: '8px',
                padding: '16px',
                    marginBottom: '20px',
                    border: `1px solid ${COLORS.line}20`
                  }}>
                      <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px'
                    }}>
                      <span style={{ fontSize: 13, color: COLORS.sub, fontWeight: 500 }}>
                        Order Status:
                      </span>
                      <span style={{ 
                        fontSize: 12,
                        color: '#059669',
                        fontWeight: 600,
                        background: '#d1fae5',
                        padding: '4px 8px',
                        borderRadius: '4px'
                      }}>
                        Pending / New
                      </span>
                </div>
                <div style={{
                  fontSize: 11,
                  color: COLORS.sub,
                  fontStyle: 'italic'
                }}>
                      Order will be created with "Pending" status
                </div>
              </div>

                </div>
              </div>

            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: `1px solid ${COLORS.line}`,
              background: '#fff',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              position: 'sticky',
              bottom: 0,
              boxShadow: '0 -2px 10px rgba(0,0,0,0.03)'
            }}>
              <button
                onClick={() => setMatModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  border: `1px solid ${COLORS.line}`,
                  borderRadius: '6px',
                  color: COLORS.text,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: '#f8fafc'
                  }
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!validateForm()) {
                    setMatError('Please fix the validation errors before saving.');
                    return;
                  }
                  
                  try {
                    setMatError('');
                    setMatSaving(true);
                    
                    if (!matForm.categoryId) {
                      setMatError('Please select a Category');
                      setMatSaving(false);
                      return;
                    }
                    
                    // Get the selected category to include its name and measurement type
                    const selectedCategory = categories.find(c => c._id === matForm.categoryId);
                    
                    // Recalculate totals to ensure they're fresh
                    const freshTotals = calculateTotals(matForm);
                    
                    const payload = {
                      category: selectedCategory?.name || '',
                      amount: Number(matForm.quantity || 0),
                      price: Number(matForm.unitPrice || 0),
                      offers: matForm.offerDiscount || '',
                      note: matForm.additionalNotes || '',
                      deliveryWithinDays: Number(matForm.deliveryWithinDays || 1),
                      originalTotal: freshTotals.originalTotal || 0,
                      discountedTotal: freshTotals.discountedTotal || 0,
                      canDeliver: true, // Default to true for new orders
                      status: 'new' // Set status to 'new' as requested
                    };
                    
                    console.log("=== FRONTEND ORDER SUBMISSION DEBUG ===");
                    console.log("Form data:", matForm);
                    console.log("Selected category:", selectedCategory);
                    console.log("Payload being sent:", payload);
                    
                    if (matModalMode === 'add') {
                      console.log("Making POST request to /supplier-self/orders");
                      await http.post('/supplier-self/orders', payload);
                      toast('Order submitted successfully');
                    } else {
                      console.log("Making PUT request to /supplier-self/orders/" + matForm._id);
                      await http.put(`/supplier-self/orders/${matForm._id}`, payload);
                      toast('Order updated successfully');
                    }
                    
                    setMatModalOpen(false);
                    setMatForm(emptyMat);
                    setFormErrors({});
                    
                    // Refresh orders list
                    const ordersRes = await http.get('/supplier-self/orders');
                    if (ordersRes.data?.ok) setOrders(ordersRes.data.items || []);
                  } catch(e) { 
                    console.error("=== ORDER SUBMISSION ERROR ===");
                    console.error("Error object:", e);
                    console.error("Error response:", e?.response);
                    console.error("Error data:", e?.response?.data);
                    console.error("Error message:", e?.response?.data?.message);
                    
                    const errorMessage = e?.response?.data?.message || e?.message || 'Order submission failed';
                    setMatError(errorMessage);
                    toast(errorMessage, 'error');
                  } finally { 
                    setMatSaving(false); 
                  }
                }}
                disabled={matSaving}
                style={{ ...btn(COLORS.brand), opacity: matSaving ? 0.7 : 1 }}
              >
                {matSaving ? 'Saving…' : (matModalMode === 'add' ? 'Add Orders' : 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* My Orders */}
      {currentTab === 'materials' && (
      <div style={{ ...card, overflow: "hidden", marginTop: 16 }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.line}`, background: "#f8faf9", display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
          <div>
            <strong style={{ display:'block' }}>My Orders</strong>
            <span style={{ color: COLORS.sub, fontSize: 12 }}>Track your submitted orders and their status</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <div style={{ color: COLORS.sub, fontSize: 12 }}>{orders.length} total</div>
            <button onClick={()=>{ setMatModalMode('add'); setMatForm(emptyMat); setMatError(''); setCalculatedTotals({ originalTotal: 0, discountedTotal: 0, calculatedDeliveryDate: null }); setMatModalOpen(true); }} style={btn(COLORS.brand)}>➕ Add Order</button>
          </div>
        </div>
        {/* list */}
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
            <thead>
              <tr style={{ background:'#f9fafb', color: COLORS.sub, textAlign:'left' }}>
                <th style={{ padding: 12 }}>Order ID</th>
                <th style={{ padding: 12 }}>Category</th>
                <th style={{ padding: 12 }}>Quantity</th>
                <th style={{ padding: 12 }}>Unit</th>
                <th style={{ padding: 12 }}>Unit Price</th>
                <th style={{ padding: 12 }}>Offer</th>
                <th style={{ padding: 12 }}>Total Price</th>
                <th style={{ padding: 12 }}>Delivery Within (Days)</th>
                <th style={{ padding: 12 }}>Status</th>
                <th style={{ padding: 12, width:200 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={10} style={{ padding: 24, color: COLORS.sub, textAlign:'center' }}>
                  <div style={{ fontSize:28, marginBottom:6 }}>📦</div>
                  <div>No orders yet</div>
                  <div style={{ fontSize: 12, marginTop: 8, color: COLORS.sub }}>
                    Click "Add Order" to submit your first order
                  </div>
                </td></tr>
              ) : orders.map((order) => (
                <tr key={order._id} style={{ borderTop:`1px solid ${COLORS.line}` }}>
                  <td style={{ padding:12, fontFamily:'ui-monospace,monospace', fontWeight: 600 }}>
                    {order.orderId || `ORD-${order._id.slice(-6)}`}
                    </td>
                  <td style={{ padding:12 }}>{order.category}</td>
                  <td style={{ padding:12 }}>{order.amount}</td>
                    <td style={{ padding:12 }}>
                      {(() => {
                      const cat = categories.find(c => c.name === order.category);
                      return cat?.measurementType || '-';
                      })()}
                    </td>
                  <td style={{ padding:12 }}>{order.price ? formatMoney(order.price) : '-'}</td>
                  <td style={{ padding:12 }}>{order.offers || '-'}</td>
                  <td style={{ padding:12, fontWeight: 600, color: COLORS.brand }}>
                    {order.discountedTotal ? formatMoney(order.discountedTotal) : 
                     order.originalTotal ? formatMoney(order.originalTotal) : '-'}
                    </td>
                    <td style={{ padding:12 }}>
                    {order.deliveryWithinDays ? `${order.deliveryWithinDays} days` : '-'}
                    </td>
                    <td style={{ padding:12 }}>
                      <span style={{
                      display:'inline-block', padding:'4px 8px', borderRadius:4, fontSize:12, fontWeight:600,
                      background: order.status === 'new' ? 'rgba(59,130,246,0.12)' : 
                                 order.status === 'confirmed' ? 'rgba(16,185,129,0.12)' :
                                 order.status === 'rejected' ? 'rgba(239,68,68,0.12)' :
                                 'rgba(107,114,128,0.12)',
                      color: order.status === 'new' ? '#3B82F6' : 
                             order.status === 'confirmed' ? '#10B981' :
                             order.status === 'rejected' ? '#EF4444' :
                             '#6B7280'
                    }}>
                      {order.status === 'new' ? 'Pending / New' : 
                       order.status === 'confirmed' ? 'Confirmed' :
                       order.status === 'rejected' ? 'Rejected' :
                       order.status === 'completed' ? 'Completed' : order.status}
                    </span>
                    </td>
                    <td style={{ padding:12 }}>
                      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      {order.status === 'new' && (
                        <>
                          <button
                            onClick={() => {
                              setMatModalMode('edit');
                              const editForm = {
                                _id: order._id,
                                categoryId: categories.find(c => c.name === order.category)?._id || '',
                                quantity: order.amount.toString(),
                                measurementType: categories.find(c => c.name === order.category)?.measurementType || '',
                                unitPrice: order.price?.toString() || '',
                                offerDiscount: order.offers || '',
                                deliveryWithinDays: order.deliveryWithinDays?.toString() || '',
                                additionalNotes: order.note || ''
                              };
                              setMatForm(editForm);
                              setCalculatedTotals(calculateTotals(editForm));
                              setMatError('');
                              setMatModalOpen(true);
                            }}
                            style={{ ...btn('#3B82F6'), fontSize: 12, padding: '4px 8px' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to delete this order?')) {
                                try {
                                  await http.delete(`/supplier-self/orders/${order._id}`);
                                  toast('Order deleted');
                                  const ordersRes = await http.get('/supplier-self/orders');
                                  if (ordersRes.data?.ok) setOrders(ordersRes.data.orders || []);
                                } catch (e) {
                                  toast(e?.response?.data?.message || 'Delete failed', 'error');
                                }
                              }
                            }}
                            style={{ ...btn('#EF4444'), fontSize: 12, padding: '4px 8px' }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                      </div>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Profile */}
      {currentTab === 'profile' && (
      <div style={{ ...card, padding: 16, marginTop: 16 }}>
        <div style={{ paddingBottom:12, borderBottom:`1px solid ${COLORS.line}`, marginBottom:12 }}>
          <strong>Profile</strong>
        </div>
        {!profile || loading ? (
          <div style={{ color: COLORS.sub, fontStyle: "italic" }}>Loading profile…</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 10 }}>
            <div><span style={{ color: COLORS.sub }}>Company</span><br /><b>{profile.name}</b></div>
            <div><span style={{ color: COLORS.sub }}>Contact</span><br /><b>{profile.contactPerson}</b></div>
            <div><span style={{ color: COLORS.sub }}>Email</span><br />{profile.email}</div>
            <div><span style={{ color: COLORS.sub }}>Phone</span><br />{profile.phone}</div>
            <div><span style={{ color: COLORS.sub }}>Category</span><br />{profile.category}</div>
            <div><span style={{ color: COLORS.sub }}>Status</span><br />{profile.status}</div>
          </div>
        )}
      </div>
      )}

     
      {/* Purchase Orders (Admin-Accepted Orders) */}
      {currentTab === 'purchaseOrders' && (
      <div style={{ ...card, overflow: "hidden", marginTop: 16 }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.line}`, background: "#f1f5f9", display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, flexWrap:'wrap' }}>
          <div>
            <strong style={{ display:'block' }}>Purchase Orders</strong>
            <span style={{ color: COLORS.sub, fontSize: 12 }}>Orders accepted by Admin - awaiting your confirmation and delivery</span>
          </div>
          <button onClick={load} style={{ ...btn('#fff', COLORS.text), border:`1px solid ${COLORS.line}` }}>↻ Refresh</button>
        </div>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: COLORS.sub }}>Loading orders…</div>
        ) : orders.filter(o => ['confirmed', 'supplier_accepted', 'delivered', 'completed'].includes(o.status)).length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: COLORS.sub }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📦</div>
            <div style={{ fontSize:16, fontWeight:500, marginBottom:4 }}>No purchase orders yet</div>
            <div style={{ fontSize:14 }}>Orders will appear here once accepted by Admin</div>
            </div>
        ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                <tr style={{ background:'#f9fafb', borderBottom:`1px solid ${COLORS.line}` }}>
                  <th style={{ padding:12, textAlign:'left', fontSize:12, fontWeight:600, color:COLORS.sub }}>Order ID</th>
                  <th style={{ padding:12, textAlign:'left', fontSize:12, fontWeight:600, color:COLORS.sub }}>Category</th>
                  <th style={{ padding:12, textAlign:'left', fontSize:12, fontWeight:600, color:COLORS.sub }}>Quantity</th>
                  <th style={{ padding:12, textAlign:'left', fontSize:12, fontWeight:600, color:COLORS.sub }}>Unit</th>
                  <th style={{ padding:12, textAlign:'left', fontSize:12, fontWeight:600, color:COLORS.sub }}>Unit Price</th>
                  <th style={{ padding:12, textAlign:'left', fontSize:12, fontWeight:600, color:COLORS.sub }}>Offer</th>
                  <th style={{ padding:12, textAlign:'left', fontSize:12, fontWeight:600, color:COLORS.sub }}>Total Price</th>
                  <th style={{ padding:12, textAlign:'left', fontSize:12, fontWeight:600, color:COLORS.sub }}>Delivery (Days)</th>
                  <th style={{ padding:12, textAlign:'left', fontSize:12, fontWeight:600, color:COLORS.sub }}>Status</th>
                  <th style={{ padding:12, textAlign:'left', fontSize:12, fontWeight:600, color:COLORS.sub }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                {orders.filter(o => ['confirmed', 'supplier_accepted', 'delivered', 'completed'].includes(o.status)).map((order) => {
                  const getStatusBadge = (status) => {
                    const styles = {
                      confirmed: { bg: 'rgba(59,130,246,0.12)', color: '#3B82F6', text: 'Accepted by Admin' },
                      supplier_accepted: { bg: 'rgba(20,184,166,0.12)', color: '#14B8A6', text: 'Supplier Accepted' },
                      delivered: { bg: 'rgba(16,185,129,0.12)', color: '#10B981', text: 'Delivered' },
                      completed: { bg: 'rgba(107,114,128,0.12)', color: '#6B7280', text: 'Confirmed' },
                    };
                    const style = styles[status] || styles.confirmed;
                    return (
                          <span style={{
                        display:'inline-block', padding:'4px 8px', borderRadius:4, fontSize:12, fontWeight:600,
                        background: style.bg, color: style.color
                      }}>{style.text}</span>
                    );
                  };

                  const getCategoryMeasurement = (categoryName) => {
                    const category = categories.find(c => c.name === categoryName);
                    return category?.measurementType || "-";
                  };

                  return (
                    <tr key={order._id} style={{ borderBottom:`1px solid ${COLORS.line}` }}>
                      <td style={{ padding:12, fontFamily:'ui-monospace,monospace', fontWeight:600, fontSize:13 }}>
                        {order.orderId || `ORD-${order._id.slice(-6)}`}
                      </td>
                      <td style={{ padding:12, fontSize:14 }}>{order.category || "-"}</td>
                      <td style={{ padding:12, fontSize:14 }}>{order.amount || 0}</td>
                      <td style={{ padding:12, fontSize:14 }}>{getCategoryMeasurement(order.category)}</td>
                      <td style={{ padding:12, fontSize:14 }}>{formatMoney(order.price)}</td>
                      <td style={{ padding:12, fontSize:14 }}>{order.offers || "-"}</td>
                      <td style={{ padding:12, fontSize:14, fontWeight:600, color:COLORS.brand }}>
                        {formatMoney(order.discountedTotal || order.originalTotal)}
                      </td>
                      <td style={{ padding:12, fontSize:14 }}>
                        {order.deliveryWithinDays ? `${order.deliveryWithinDays} days` : "-"}
                      </td>
                      <td style={{ padding:12 }}>{getStatusBadge(order.status)}</td>
                      <td style={{ padding:12 }}>
                        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                          {order.status === 'confirmed' && (
                <button
                  onClick={async () => {
                    try {
                                  const { data } = await http.post(`/supplier-self/orders/${order._id}/accept`);
                                  if (data?.ok) { 
                                    toast('Order accepted successfully!'); 
                                    await load(); 
                                  }
                                } catch (e) { 
                                  toast(e?.response?.data?.message || 'Failed to accept order', 'error'); 
                                }
                              }}
                              style={{ ...btn(COLORS.brand), fontSize:12, padding:'6px 12px' }}
                            >
                              ✓ Accept Order
                            </button>
                          )}
                          {order.status === 'supplier_accepted' && (
                <button
                  onClick={async () => {
                    try {
                                  const { data } = await http.post(`/supplier-self/orders/${order._id}/deliver`);
                                  if (data?.ok) { 
                                    toast('Order marked as delivered!'); 
                                    await load(); 
                                  }
                                } catch (e) { 
                                  toast(e?.response?.data?.message || 'Failed to mark as delivered', 'error'); 
                                }
                              }}
                              style={{ ...btn('#2563eb'), fontSize:12, padding:'6px 12px' }}
                            >
                              📦 Mark as Delivered
                            </button>
                          )}
                          {(order.status === 'delivered' || order.status === 'completed') && (
                            <span style={{ fontSize:13, color:COLORS.sub, fontStyle:'italic' }}>
                              {order.status === 'delivered' ? 'Awaiting admin confirmation' : 'Completed'}
                            </span>
                          )}
              </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
        )}
      </div>
      )}
    </div>
  );
}
