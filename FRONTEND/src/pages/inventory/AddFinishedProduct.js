import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../api/http";
import { COLORS, shadows, radii } from "../../theme";
import InventorySidebar from "../../components/InventorySidebar";

export default function AddFinishedProduct() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, type: "success", message: "" });
  const [form, setForm] = useState({
    itemCode: "",
    name: "",
    unit: "pcs",
    quantity: 0,
    uol: 0,
    reOrderLevel: 0,
    status: "active",
  });
  const [errors, setErrors] = useState({});

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type, message: "" }), 2500);
  };

  const validate = (vals) => {
    const errs = {};
    const code = (vals.itemCode || "").trim();
    if (!code) errs.itemCode = "Item code is required";
    if (code && !/^[A-Z0-9_-]+$/.test(code)) errs.itemCode = "Use A-Z, 0-9, '-', '_'";
    if (!vals.name?.trim()) errs.name = "Name is required";
    if (!vals.unit) errs.unit = "Unit is required";
    if (Number(vals.quantity) < 0) errs.quantity = "Quantity must be >= 0";
    if (Number(vals.uol) < 0) errs.uol = "Min level must be >= 0";
    if (Number(vals.reOrderLevel) < 0) errs.reOrderLevel = "Re-order must be >= 0";
    return errs;
  };

  const isValid = useMemo(() => Object.keys(validate(form)).length === 0, [form]);

  const onChange = (k, v) => {
    if (k === "itemCode") v = String(v || "").toUpperCase();
    setForm((f) => ({ ...f, [k]: v }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const v = validate(form);
    if (Object.keys(v).length) { setErrors(v); return; }
    try {
      setLoading(true);
      const payload = {
        itemCode: form.itemCode.trim().toUpperCase(),
        name: form.name.trim(),
        unit: form.unit,
        quantity: Number(form.quantity) || 0,
        uol: Number(form.uol) || 0,
        reOrderLevel: Number(form.reOrderLevel) || 0,
        status: form.status,
      };
      const res = await http.post('/api/finishedproducts', payload);
      if (res?.data?.success) {
        showToast('success', 'Finished product created');
        setTimeout(() => navigate('/admin/inventory/finished'), 500);
      } else {
        showToast('error', res?.data?.message || 'Failed to create');
      }
    } catch (e) {
      showToast('error', e?.response?.data?.message || 'Failed to create');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafb' }}>
      <InventorySidebar />
      <div style={{ flex: 1, padding: 24, maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ marginTop: 0, color: COLORS.text }}>Add Finished Product</h1>
        <form onSubmit={onSubmit} style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius: radii.lg, boxShadow: shadows.card, padding:16, display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px,1fr))', gap:12 }}>
          <label style={{ display:'grid', gap:6 }}>
            <span>Item Code</span>
            <input value={form.itemCode} onChange={e=>onChange('itemCode', e.target.value)} placeholder="e.g., FP_GROWBAG_001" style={{ padding:10, borderRadius:8, border:`1px solid ${errors.itemCode ? '#fecaca' : '#e5e7eb'}` }} />
            {errors.itemCode && <small style={{ color:'#b91c1c' }}>{errors.itemCode}</small>}
          </label>
          <label style={{ display:'grid', gap:6 }}>
            <span>Name</span>
            <input value={form.name} onChange={e=>onChange('name', e.target.value)} style={{ padding:10, borderRadius:8, border:`1px solid ${errors.name ? '#fecaca' : '#e5e7eb'}` }} />
            {errors.name && <small style={{ color:'#b91c1c' }}>{errors.name}</small>}
          </label>
          <label style={{ display:'grid', gap:6 }}>
            <span>Unit</span>
            <select value={form.unit} onChange={e=>onChange('unit', e.target.value)} style={{ padding:10, borderRadius:8, border:`1px solid ${errors.unit ? '#fecaca' : '#e5e7eb'}` }}>
              {['pcs','kg','g','L','mL','bag','bale','units'].map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            {errors.unit && <small style={{ color:'#b91c1c' }}>{errors.unit}</small>}
          </label>
          <label style={{ display:'grid', gap:6 }}>
            <span>Initial Quantity</span>
            <input type="number" min="0" value={form.quantity} onChange={e=>onChange('quantity', e.target.value)} style={{ padding:10, borderRadius:8, border:`1px solid ${errors.quantity ? '#fecaca' : '#e5e7eb'}` }} />
            {errors.quantity && <small style={{ color:'#b91c1c' }}>{errors.quantity}</small>}
          </label>
          <label style={{ display:'grid', gap:6 }}>
            <span>Min Level (UOL)</span>
            <input type="number" min="0" value={form.uol} onChange={e=>onChange('uol', e.target.value)} style={{ padding:10, borderRadius:8, border:`1px solid ${errors.uol ? '#fecaca' : '#e5e7eb'}` }} />
            {errors.uol && <small style={{ color:'#b91c1c' }}>{errors.uol}</small>}
          </label>
          <label style={{ display:'grid', gap:6 }}>
            <span>Re-Order Level</span>
            <input type="number" min="0" value={form.reOrderLevel} onChange={e=>onChange('reOrderLevel', e.target.value)} style={{ padding:10, borderRadius:8, border:`1px solid ${errors.reOrderLevel ? '#fecaca' : '#e5e7eb'}` }} />
            {errors.reOrderLevel && <small style={{ color:'#b91c1c' }}>{errors.reOrderLevel}</small>}
          </label>
          <div style={{ gridColumn:'1 / -1', display:'flex', justifyContent:'flex-end', gap:8 }}>
            <button type="button" onClick={()=>navigate(-1)} style={{ background:'#fff', border:'1px solid #e5e7eb', padding:'10px 14px', borderRadius:radii.sm, cursor:'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading || !isValid} style={{ background: COLORS.primary, color:'#fff', border:0, padding:'10px 16px', borderRadius:radii.sm, cursor: loading || !isValid ? 'not-allowed' : 'pointer', opacity: loading || !isValid ? 0.7 : 1 }}>{loading ? 'Saving...' : 'Create'}</button>
          </div>
        </form>
        {toast.show && (
          <div style={{ position:'fixed', right:16, bottom:16, background: toast.type==='success' ? '#ecfdf5' : '#fef2f2', border: `1px solid ${toast.type==='success' ? '#a7f3d0' : '#fecaca'}`, color: toast.type==='success' ? '#065f46' : '#991b1b', padding:'10px 14px', borderRadius:8, boxShadow: shadows.sm }}>
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
}
