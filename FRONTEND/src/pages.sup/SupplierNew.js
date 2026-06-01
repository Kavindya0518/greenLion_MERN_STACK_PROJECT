import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../api/http";
import SupplierSidebar from "./SupplierSidebar";

// Simple validation functions
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone) => /^0\d{9}$/.test(phone.replace(/\s+/g, ''));
const validateRequired = (value) => value.trim() !== '';
const validateName = (name) => /^[A-Za-z]/.test(name);

export default function SupplierNew() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  
  const [form, setForm] = useState({
    name: "", // company name
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    category: ""
  });

  const formatPhoneNumber = (phone) => {
    // Keep only numbers and +
    return ('' + phone).replace(/[^\d+]/g, '');
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!validateRequired(form.name)) {
      newErrors.name = 'Company name is required';
    }
    
    if (!validateRequired(form.email) || !validateEmail(form.email)) {
      newErrors.email = 'Valid email is required';
    }
    
    if (!validateRequired(form.phone) || !validatePhone(form.phone)) {
      newErrors.phone = 'Phone number must be exactly 10 digits starting with 0 (0XXXXXXXXX)';
    }
    
    if (!validateRequired(form.contactPerson)) {
      newErrors.contactPerson = 'Contact person is required';
    } else if (!validateName(form.contactPerson)) {
      newErrors.contactPerson = 'Name must start with a letter (A-Z, a-z)';
    }
    
    if (!validateRequired(form.category)) {
      newErrors.category = 'Main Category is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateField = (field, value) => {
    const newErrors = { ...errors };
    
    // Clear previous error for this field
    delete newErrors[field];
    
    // Validate the specific field
    if (field === 'name' && !validateRequired(value)) {
      newErrors.name = 'Company name is required';
    } else if (field === 'email' && (!validateRequired(value) || !validateEmail(value))) {
      newErrors.email = 'Valid email is required';
    } else if (field === 'phone' && (!validateRequired(value) || !validatePhone(value))) {
      newErrors.phone = 'Phone number must be exactly 10 digits starting with 0 (0XXXXXXXXX)';
    } else if (field === 'contactPerson') {
      if (!validateRequired(value)) {
        newErrors.contactPerson = 'Contact person is required';
      } else if (!validateName(value)) {
        newErrors.contactPerson = 'Name must start with a letter (A-Z, a-z)';
      }
    } else if (field === 'category' && !validateRequired(value)) {
      newErrors.category = 'Category is required';
    }
    
    setErrors(newErrors);
  };

  const onChange = (field, value) => {
    // Special handling for contact person name
    if (field === 'contactPerson') {
      // Remove any non-letter characters from the start of the string
      value = value.replace(/^[^A-Za-z]+/, '');
    }
    // Special handling for phone number formatting
    else if (field === 'phone') {
      value = formatPhoneNumber(value);
    }
    
    // Debug log for category field
    if (field === 'category') {
      console.log("Category field changed to:", value); // Debug log
    }
    
    // Update the form field
    setForm(prev => ({ ...prev, [field]: value }));
    
    // Always validate in real-time
    validateField(field, value);
    
    // Clear the general form error if all fields are valid
    if (error && validateForm(true)) {
      setError('');
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Mark as submitted to ensure all validations run
    setIsSubmitted(true);
    
    // Clear previous errors
    setError('');
    
    // Run full form validation
    if (!validateForm()) {
      console.log("Form validation failed. Current form state:", form); // Debug log
      console.log("Form errors:", errors); // Debug log
      // Don't show the general error if we have field-specific errors
      if (Object.keys(errors).length === 0) {
        setError('Please fill in all required fields correctly');
      }
      return;
    }
    
    try {
      setLoading(true);
      const payload = { 
        ...form,
        category: form.category || "" // Ensure category is always a string
      };
      
      // Additional validation to ensure category is not empty
      if (!payload.category || payload.category.trim() === "") {
        setError("Please select a Main Category");
        return;
      }
      console.log("Submitting supplier form with payload:", payload); // Debug log
      await http.post("/suppliers", payload);
      navigate("/admin/suppliers/manage", { 
        state: { success: `Supplier "${form.name}" created` } 
      });
    } catch (err) {
      console.error("Supplier creation error:", err); // Debug log
      setError(err?.response?.data?.message || err?.message || "Failed to create supplier");
    } finally {
      setLoading(false);
    }
  };

  // Load admin-created material categories for dropdown
  useEffect(() => {
    (async () => {
      try {
        const res = await http.get("/api/material-categories");
        const arr = Array.isArray(res?.data?.categories)
          ? res.data.categories
          : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.data?.data)
              ? res.data.data
              : [];
        console.log("Loaded categories for supplier form:", arr); // Debug log
        setCategories(arr);
      } catch (e) {
        console.error("Failed to load categories:", e); // Debug log
        // keep empty; UI will still allow typing if needed (but we prefer dropdown)
        setCategories([]);
      }
    })();
  }, []);
  
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background:'#f8fafb' }}>
      <SupplierSidebar />
      <div style={{ flex:1, padding:24, maxWidth:900, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
          <h1 style={{ margin:0, fontSize:24, fontWeight:800 }}>Add New Supplier</h1>
        </div>

        {error && (
          <div style={{ marginTop:12, background:'#fff', border:'1px solid #fecaca', color:'#991b1b', borderRadius:8, padding:12 }}>{error}</div>
        )}

        <form onSubmit={onSubmit} style={{ marginTop:12, background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:16, display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:12 }}>
          {/* Company Name */}
          <label style={{ display:'grid', gap:6 }}>
            <span>Company Name <span style={requiredFieldStyle}>*</span></span>
            <input 
              required 
              value={form.name}
              onChange={(e) => onChange('name', e.target.value)}
              style={{...inputStyle, borderColor: errors.name ? '#ef4444' : '#e5e7eb'}}
             
            />
            {errors.name && <span style={errorTextStyle}>{errors.name}</span>}
          </label>

          {/* Email */}
          <label style={{ display:'grid', gap:6 }}>
            <span>Email <span style={requiredFieldStyle}>*</span></span>
            <input 
              type="email"
              required 
              value={form.email}
              onChange={(e) => onChange('email', e.target.value)}
              style={{...inputStyle, borderColor: errors.email ? '#ef4444' : '#e5e7eb'}}
              placeholder="contact@example.com"
            />
            {errors.email && <span style={errorTextStyle}>{errors.email}</span>}
          </label>

          {/* Phone */}
          <label style={{ display:'grid', gap:6 }}>
            <span>Phone <span style={requiredFieldStyle}>*</span></span>
            <input 
              required 
              type="tel"
              value={form.phone}
              onChange={(e) => {
                let value = e.target.value;
                // Only allow digits and limit to 10 characters
                value = value.replace(/\D/g, '').substring(0, 10);
                // Ensure it starts with 0 if user enters digits
                if (value.length > 0 && !value.startsWith('0')) {
                  value = '0' + value.substring(1);
                }
                onChange('phone', value);
              }}
              placeholder="0771234567 (10 digits starting with 0)"
              maxLength="10"
              style={{...inputStyle, borderColor: errors.phone ? '#ef4444' : '#e5e7eb'}} 
            />
            {errors.phone && <span style={errorTextStyle}>{errors.phone}</span>}
          </label>

          {/* Contact Person */}
          <label style={{ display:'grid', gap:6 }}>
            <span>Contact Person <span style={requiredFieldStyle}>*</span></span>
            <input 
              required 
              value={form.contactPerson}
              onChange={(e) => onChange('contactPerson', e.target.value)}
              style={{...inputStyle, borderColor: errors.contactPerson ? '#ef4444' : '#e5e7eb'}}
              
            />
            {errors.contactPerson && <span style={errorTextStyle}>{errors.contactPerson}</span>}
          </label>

          {/* Username */}
          <label style={{ display:'grid', gap:6 }}>
            <span>Username <span style={requiredFieldStyle}>*</span></span>
            <input 
              required 
              value={form.username}
              onChange={(e) => onChange('username', e.target.value)}
              style={{...inputStyle, borderColor: errors.username ? '#ef4444' : '#e5e7eb'}}
              
            />
            {errors.username && <span style={errorTextStyle}>{errors.username}</span>}
          </label>

          {/* Password */}
          <label style={{ display:'grid', gap:6 }}>
            <span>Password <span style={requiredFieldStyle}>*</span></span>
            <div style={{ position: 'relative' }}>
              <input 
                required 
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => onChange('password', e.target.value)}
                style={{...inputStyle, borderColor: errors.password ? '#ef4444' : '#e5e7eb', paddingRight: '40px'}}
                
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '5px'
                }}
                tabIndex="-1"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.password ? (
              <span style={errorTextStyle}>{errors.password}</span>
            ) : (
              <span style={{color: '#6b7280', fontSize: '12px'}}>
                Must be at least 8 characters with 1 uppercase letter and 1 number
              </span>
            )}
          </label>

          {/* Address */}
          <label style={{ gridColumn:'1 / -1', display:'grid', gap:6 }}>
            <span>Address</span>
            <textarea 
              rows={3}
              value={form.address}
              onChange={(e) => onChange('address', e.target.value)}
              style={{...inputStyle, resize:'vertical', borderColor: errors.address ? '#ef4444' : '#e5e7eb'}}
              placeholder={"123 Main Street\nColombo 01\nWestern Province\nSri Lanka"}
            />
            {errors.address && <span style={errorTextStyle}>{errors.address}</span>}
          </label>

          {/* Main Category */}
          <label style={{ display:'grid', gap:6 }}>
            <span>Main Category <span style={requiredFieldStyle}>*</span></span>
            <select
              required
              value={form.category}
              onChange={(e) => onChange('category', e.target.value)}
              style={{...inputStyle, borderColor: errors.category ? '#ef4444' : '#e5e7eb'}}
            >
              <option value="">Select Main Category</option>
              {categories.map(c => (
                <option key={c._id} value={c.name}>{c.name}</option>
              ))}
            </select>
            {categories.length === 0 && (
              <span style={{ color: '#6b7280', fontSize: '12px' }}>
                No categories found. Please add categories in Admin → Suppliers → Categories.
              </span>
            )}
            {errors.category && <span style={errorTextStyle}>{errors.category}</span>}
          </label>

          {/* Status */}
          <label style={{ display:'grid', gap:6 }}>
            <span>Status</span>
            <select 
              value={form.status} 
              onChange={(e) => onChange('status', e.target.value)} 
              style={inputStyle}
            >
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>

          {/* Form Actions */}
          <div style={{ gridColumn:'1 / -1', display:'flex', justifyContent:'flex-end', gap:8, marginTop:8 }}>
            <button 
              type="button" 
              onClick={() => navigate(-1)} 
              style={btnStyle}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              style={{
                ...btnPrimaryStyle,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
                backgroundColor: loading ? '#1a6f33' : '#1E7F3B'
              }}
            >
              {loading ? 'Saving...' : 'Create Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle = { 
  padding: 10, 
  borderRadius: 8, 
  border: '1px solid #e5e7eb',
  width: '100%',
  boxSizing: 'border-box',
  fontSize: '14px',
  transition: 'border-color 0.2s'
};

const errorTextStyle = {
  color: '#ef4444',
  fontSize: '0.75rem',
  marginTop: '4px',
  display: 'block',
  minHeight: '1rem',
  lineHeight: '1rem'
};

const requiredFieldStyle = {
  color: '#ef4444',
  marginLeft: '2px'
};

const btnStyle = { 
  background: '#fff', 
  border: '1px solid #e5e7eb', 
  padding: '10px 16px', 
  borderRadius: 8, 
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 500,
  transition: 'all 0.2s'
};

const btnPrimaryStyle = { 
  background: '#1E7F3B', 
  color: '#fff', 
  border: 'none', 
  padding: '10px 16px', 
  borderRadius: 8, 
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 500,
  transition: 'all 0.2s'
};
