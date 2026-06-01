import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import InventorySidebar from "../../components/InventorySidebar";
import http from "../../api/http";

const validateField = (name, value) => {
  const fieldErrors = {};
  
  switch (name) {
    case 'itemCode':
      const code = (value || "").trim();
      if (!code) {
        fieldErrors.itemCode = "Item code is required";
      } else if (code.length > 20) {
        fieldErrors.itemCode = "Item code cannot exceed 20 characters";
      } else if (!/^[A-Z][A-Z0-9_-]*$/.test(code)) {
        fieldErrors.itemCode = "Must start with a letter (A-Z) and can only contain A-Z, 0-9, '-', '_'";
      }
      break;
      
    case 'name':
      const nameVal = (value || "").trim();
      if (!nameVal) {
        fieldErrors.name = "Name is required";
      } else if (!/^[A-Za-z]/.test(nameVal)) {
        fieldErrors.name = "Name must start with a letter";
      } else if (!/^[A-Za-z][A-Za-z0-9\s.,'-]*$/.test(nameVal)) {
        fieldErrors.name = "Name can only contain letters, numbers, spaces, and basic punctuation";
      } else if (nameVal.length > 50) {
        fieldErrors.name = "Name cannot exceed 50 characters";
      }
      break;
      
    case 'description':
      if (value && value.length > 200) {
        fieldErrors.description = "Description cannot exceed 200 characters";
      }
      break;
      
    case 'unit':
      if (!value) fieldErrors.unit = "Unit is required";
      break;
      
    case 'unitPrice':
      if (value === '') {
        fieldErrors.unitPrice = "Unit price is required";
      } else {
        const num = Number(value);
        if (isNaN(num)) {
          fieldErrors.unitPrice = "Must be a valid number";
        } else if (num <= 0) {
          fieldErrors.unitPrice = "Must be greater than 0 LKR";
        } else if (num > 1000000) {
          fieldErrors.unitPrice = "Cannot exceed 1,000,000 LKR";
        }
      }
      break;
      
    case 'quantity':
    case 'uol':
    case 'reOrderLevel':
      if (value === '') {
        fieldErrors[name] = "This field is required";
      } else {
        const num = Number(value);
        if (isNaN(num)) {
          fieldErrors[name] = "Must be a valid number";
        } else if (num < 0) {
          fieldErrors[name] = "Cannot be negative";
        } else if (num > 1000000) {
          fieldErrors[name] = "Cannot exceed 1,000,000";
        }
      }
      break;
      
    case 'supplier':
      if (value && value.length > 100) {
        fieldErrors.supplier = "Supplier name cannot exceed 100 characters";
      }
      break;
  }
  
  return fieldErrors;
};

const validateForm = (values) => {
  const formErrors = {};
  
  // Validate all fields
  Object.keys(values).forEach(field => {
    const fieldErrors = validateField(field, values[field]);
    Object.assign(formErrors, fieldErrors);
  });
  
  // Cross-field validation
  if (!formErrors.reOrderLevel && !formErrors.uol) {
    const reOrderNum = Number(values.reOrderLevel);
    const uolNum = Number(values.uol);
    if (reOrderNum <= uolNum) {
      formErrors.reOrderLevel = "Re-order level must be greater than minimum level";
    }
  }
  
  return formErrors;
};

export default function AddRawMaterial() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, type: "success", message: "" });
  const [form, setForm] = useState({
    itemCode: "",
    name: "",
    description: "",
    unit: "kg",
    unitPrice: "",
    quantity: "",
    uol: "",
    reOrderLevel: "",
    supplier: "",
    status: "active",
  });
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  
  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };
  
  // Validate form on mount and when form values change
  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      const formErrors = validateForm(form);
      setErrors(formErrors);
    }
  }, [form, touched]);

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Only validate the blurred field
    const fieldErrors = validateField(field, form[field]);
    setErrors(prev => ({
      ...prev,
      [field]: fieldErrors[field]
    }));
  };

  const handleChange = (field, value) => {
    // Mark field as touched
    if (!touched[field]) {
      setTouched(prev => ({ ...prev, [field]: true }));
    }
    
    // Special handling for different field types
    switch (field) {
      case 'itemCode':
        value = String(value || "").toUpperCase().replace(/[^A-Z0-9_-]/g, '');
        if (!value || /^[A-Z]/.test(value)) {
          setForm(prev => ({ ...prev, [field]: value }));
        }
        break;
        
      case 'name':
        value = String(value || "");
        if (!value || /^[A-Za-z]/.test(value)) {
          setForm(prev => ({ ...prev, [field]: value }));
        }
        break;
        
      case 'unitPrice':
      case 'quantity':
      case 'uol':
      case 'reOrderLevel':
        // Allow numbers and decimal point (for unitPrice)
        value = String(value || "").replace(/[^0-9.]/g, '');
        // Ensure only one decimal point
        if ((value.match(/\./g) || []).length <= 1) {
          setForm(prev => ({ ...prev, [field]: value }));
        }
        break;
        
      default:
        setForm(prev => ({ ...prev, [field]: value }));
    }
    
    // Clear error for this field if it's now valid
    const fieldErrors = validateField(field, value);
    if (!fieldErrors[field] && errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Mark all fields as touched to show all errors
    const allTouched = {};
    Object.keys(form).forEach(key => { allTouched[key] = true; });
    setTouched(allTouched);
    
    // Validate the entire form
    const formErrors = validateForm(form);
    setErrors(formErrors);
    
    if (Object.keys(formErrors).length > 0) {
      setIsSubmitting(false);
      return;
    }
    try {
      setLoading(true);
      const payload = {
        itemCode: form.itemCode.trim().toUpperCase(),
        name: form.name.trim(),
        description: form.description.trim(),
        unit: form.unit,
        unitPrice: Number(form.unitPrice) || 0,
        quantity: Number(form.quantity) || 0,
        uol: Number(form.uol) || 0,
        reOrderLevel: Number(form.reOrderLevel) || 0,
        supplier: form.supplier.trim(),
        status: form.status,
      };
      const res = await http.post('/api/rawmaterials', payload);
      if (res?.data?.success) {
        showToast('success', 'Raw material created');
        setTimeout(() => navigate('/admin/inventory/raw-materials'), 600);
      } else {
        showToast('error', res?.data?.message || 'Failed to create');
      }
    } catch (error) {
      showToast('error', error?.response?.data?.message || 'Failed to create');
    } finally { 
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafb' }}>
      <InventorySidebar />
      <div style={{ flex: 1, padding: 24, maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ marginTop: 0 }}>Add Raw Material</h1>
        <form onSubmit={onSubmit} style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius: 12, padding:16, display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px,1fr))', gap:12 }}>
          <label style={{ display:'grid', gap:6 }}>
            <span>Item Code <span style={{ color: '#ef4444' }}>*</span></span>
            <input 
              value={form.itemCode} 
              onChange={e => handleChange('itemCode', e.target.value)}
              onBlur={() => handleBlur('itemCode')}
              placeholder="e.g., RM_HDPE_001" 
              style={{ 
                padding: '10px', 
                borderRadius: 8, 
                border: `1px solid ${errors.itemCode ? '#fecaca' : '#e5e7eb'}`,
                width: '100%',
                boxSizing: 'border-box'
              }} 
            />
            {touched.itemCode && errors.itemCode && (
              <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {errors.itemCode}
              </div>
            )}
          </label>
          <label style={{ display:'grid', gap:6 }}>
            <span>Name <span style={{ color: '#ef4444' }}>*</span></span>
            <input 
              value={form.name} 
              onChange={e => handleChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              maxLength={50}
              style={{ 
                padding: '10px', 
                borderRadius: 8, 
                border: `1px solid ${errors.name ? '#fecaca' : '#e5e7eb'}`,
                width: '100%',
                boxSizing: 'border-box'
              }} 
            />
            {touched.name && errors.name && (
              <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {errors.name}
              </div>
            )}
          </label>
          <label style={{ display:'grid', gap:6, gridColumn: '1 / -1' }}>
            <span>Description</span>
            <textarea 
              value={form.description} 
              onChange={e => handleChange('description', e.target.value)}
              onBlur={() => handleBlur('description')}
              maxLength={200}
              rows={3}
              style={{ 
                padding: '10px', 
                borderRadius: 8, 
                border: `1px solid ${errors.description ? '#fecaca' : '#e5e7eb'}`,
                resize: 'vertical',
                minHeight: '80px',
                width: '100%',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                fontSize: '0.875rem'
              }} 
            />
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              color: '#6b7280',
              fontSize: '0.75rem'
            }}>
              {touched.description && errors.description ? (
                <span style={{ color: '#ef4444' }}>{errors.description}</span>
              ) : (
                <span></span>
              )}
              <span>{form.description?.length || 0}/200</span>
            </div>
          </label>
          <label style={{ display:'grid', gap:6 }}>
            <span>Unit <span style={{ color: '#ef4444' }}>*</span></span>
            <select 
              value={form.unit} 
              onChange={e => handleChange('unit', e.target.value)}
              onBlur={() => handleBlur('unit')}
              style={{ 
                padding: '10px', 
                borderRadius: 8, 
                border: `1px solid ${errors.unit ? '#fecaca' : '#e5e7eb'}`,
                width: '100%',
                boxSizing: 'border-box',
                backgroundColor: 'white'
              }}
            >
              {['kg','L','pcs','units'].map(u => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            {touched.unit && errors.unit && (
              <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {errors.unit}
              </div>
            )}
          </label>
          <label style={{ display:'grid', gap:6 }}>
            <span>Unit Price <span style={{ color: '#ef4444' }}>*</span></span>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6b7280',
                pointerEvents: 'none'
              }}>
                $
              </span>
              <input 
                type="text"
                inputMode="decimal"
                value={form.unitPrice}
                onChange={e => handleChange('unitPrice', e.target.value)}
                onBlur={() => handleBlur('unitPrice')}
                onKeyDown={(e) => {
                  // Prevent typing minus sign and scientific notation
                  if (['-', 'e', 'E'].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                style={{ 
                  padding: '10px 10px 10px 24px',
                  borderRadius: 8,
                  border: `1px solid ${errors.unitPrice ? '#fecaca' : '#e5e7eb'}`,
                  width: '100%',
                  boxSizing: 'border-box'
                }}
                placeholder="0.00 LKR"
              />
            </div>
            {touched.unitPrice && errors.unitPrice && (
              <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {errors.unitPrice}
              </div>
            )}
          </label>
          <label style={{ display:'grid', gap:6 }}>
            <span>Initial Quantity <span style={{ color: '#ef4444' }}>*</span></span>
            <input 
              type="text"
              inputMode="numeric"
              value={form.quantity}
              onChange={e => handleChange('quantity', e.target.value)}
              onBlur={() => handleBlur('quantity')}
              onKeyDown={(e) => {
                // Prevent typing minus sign and decimal point
                if (['-', '.', 'e', 'E'].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              style={{ 
                padding: '10px',
                borderRadius: 8,
                border: `1px solid ${errors.quantity ? '#fecaca' : '#e5e7eb'}`,
                width: '100%',
                boxSizing: 'border-box'
              }}
              placeholder="0"
            />
            {touched.quantity && errors.quantity && (
              <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {errors.quantity}
              </div>
            )}
          </label>
          <label style={{ display:'grid', gap:6 }}>
            <span>Minimum Level (UOL) <span style={{ color: '#ef4444' }}>*</span></span>
            <input 
              type="text"
              inputMode="numeric"
              value={form.uol}
              onChange={e => handleChange('uol', e.target.value)}
              onBlur={() => handleBlur('uol')}
              onKeyDown={(e) => {
                // Prevent typing minus sign and decimal point
                if (['-', '.', 'e', 'E'].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              style={{ 
                padding: '10px',
                borderRadius: 8,
                border: `1px solid ${errors.uol ? '#fecaca' : '#e5e7eb'}`,
                width: '100%',
                boxSizing: 'border-box'
              }}
              placeholder="0"
            />
            {touched.uol && errors.uol && (
              <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {errors.uol}
              </div>
            )}
          </label>
          <label style={{ display:'grid', gap:6 }}>
            <span>Re-Order Level <span style={{ color: '#ef4444' }}>*</span></span>
            <input 
              type="text"
              inputMode="numeric"
              value={form.reOrderLevel}
              onChange={e => handleChange('reOrderLevel', e.target.value)}
              onBlur={() => handleBlur('reOrderLevel')}
              onKeyDown={(e) => {
                // Prevent typing minus sign and decimal point
                if (['-', '.', 'e', 'E'].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              style={{ 
                padding: '10px',
                borderRadius: 8,
                border: `1px solid ${errors.reOrderLevel ? '#fecaca' : '#e5e7eb'}`,
                width: '100%',
                boxSizing: 'border-box'
              }}
              placeholder="0"
            />
            {touched.reOrderLevel && errors.reOrderLevel ? (
              <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {errors.reOrderLevel}
              </div>
            ) : (
              <div style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Must be greater than minimum level
              </div>
            )}
          </label>
          <label style={{ display:'grid', gap:6 }}>
            <span>Supplier (optional)</span>
            <input 
              value={form.supplier} 
              onChange={e => handleChange('supplier', e.target.value)}
              onBlur={() => handleBlur('supplier')}
              maxLength={100}
              style={{ 
                padding: '10px', 
                borderRadius: 8, 
                border: `1px solid ${errors.supplier ? '#fecaca' : '#e5e7eb'}`,
                width: '100%',
                boxSizing: 'border-box'
              }} 
              placeholder="Enter supplier name"
            />
            {touched.supplier && errors.supplier && (
              <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {errors.supplier}
              </div>
            )}
            <div style={{ 
              color: '#6b7280', 
              fontSize: '0.75rem',
              marginTop: '-4px'
            }}>
              {form.supplier?.length || 0}/100 characters
            </div>
          </label>

          <div style={{ 
            gridColumn: '1 / -1', 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: 12,
            paddingTop: '8px',
            borderTop: '1px solid #e5e7eb',
            marginTop: '8px'
          }}>
            <button 
              type="button" 
              onClick={() => navigate(-1)} 
              style={{ 
                background: '#fff', 
                border: '1px solid #d1d5db',
                color: '#374151',
                padding: '10px 16px', 
                borderRadius: 8, 
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'all 0.2s',
                ':hover': {
                  backgroundColor: '#f9fafb',
                  borderColor: '#9ca3af'
                }
              }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading || Object.keys(validateForm(form)).length > 0}
              style={{ 
                background: loading || Object.keys(validateForm(form)).length > 0 ? '#9ca3af' : '#1E7F3B',
                color: '#fff', 
                border: 'none',
                padding: '10px 20px', 
                borderRadius: 8, 
                cursor: loading || Object.keys(validateForm(form)).length > 0 ? 'not-allowed' : 'pointer',
                fontWeight: 500,
                transition: 'background 0.2s',
                ':hover': !loading && Object.keys(validateForm(form)).length === 0 ? {
                  backgroundColor: '#166534'
                } : {}
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="spinner" style={{
                    display: 'inline-block',
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderRadius: '50%',
                    borderTopColor: '#fff',
                    animation: 'spin 1s ease-in-out infinite',
                  }}></span>
                  Saving...
                </span>
              ) : 'Create Raw Material'}
            </button>
          </div>
        </form>
        
        {/* Form submission error */}
        {Object.keys(errors).length > 0 && (
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#b91c1c',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <svg style={{ flexShrink: 0 }} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 18.3333C14.6024 18.3333 18.3334 14.6024 18.3334 9.99999C18.3334 5.39762 14.6024 1.66666 10 1.66666C5.39765 1.66666 1.66669 5.39762 1.66669 9.99999C1.66669 14.6024 5.39765 18.3333 10 18.3333Z" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 6.66666V9.99999" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 13.3333H10.0083" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Please fix the errors in the form before submitting.</span>
          </div>
        )}
        
        {toast.show && (
          <div style={{ position:'fixed', right:16, bottom:16, background: toast.type==='success' ? '#ecfdf5' : '#fef2f2', border: `1px solid ${toast.type==='success' ? '#a7f3d0' : '#fecaca'}`, color: toast.type==='success' ? '#065f46' : '#991b1b', padding:'10px 14px', borderRadius:8 }}>
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
}
