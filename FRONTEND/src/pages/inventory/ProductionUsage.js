import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import InventorySidebar from "../../components/InventorySidebar";
import http from "../../api/http";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ProductionUsage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    productCategory: "",
    productId: "",
    productName: "",
    rawMaterials: [],
    batchId: "",
    notes: ""
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Data for dropdowns
  const [productCategories, setProductCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [selectedRawMaterials, setSelectedRawMaterials] = useState([]);

  // Filters
  const [filters, setFilters] = useState({
    category: "",
    product: "",
    dateFrom: "",
    dateTo: ""
  });

  const showToast = (type, message) => {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      background: ${type === 'success' ? '#10b981' : '#ef4444'};
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  };

  // Load initial data
  useEffect(() => {
    loadData();
    loadProductCategories();
    loadRawMaterials();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.category) params.set('category', filters.category);
      if (filters.product) params.set('product', filters.product);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);
      
      const response = await http.get(`/api/production-usage?${params.toString()}`);
      setRecords(response.data?.records || []);
    } catch (e) {
      console.error("Failed to load production usage records:", e);
      showToast('error', 'Failed to load production usage records');
    } finally {
      setLoading(false);
    }
  };

  const loadProductCategories = async () => {
    try {
      const response = await http.get("/api/production-usage/categories/products");
      setProductCategories(response.data?.categories || []);
    } catch (e) {
      console.error("Failed to load product categories:", e);
    }
  };

  const loadProductsByCategory = async (category) => {
    try {
      if (!category) {
        setProducts([]);
        return;
      }
      const response = await http.get(`/api/production-usage/products/${encodeURIComponent(category)}`);
      setProducts(response.data?.products || []);
    } catch (e) {
      console.error("Failed to load products:", e);
      setProducts([]);
    }
  };

  const loadRawMaterials = async () => {
    try {
      const response = await http.get("/api/production-usage/raw-materials/list");
      setRawMaterials(response.data?.rawMaterials || []);
    } catch (e) {
      console.error("Failed to load raw materials:", e);
    }
  };

  const getStockForCategory = async (categoryId) => {
    try {
      const response = await http.get(`/api/production-usage/stock/${categoryId}`);
      return response.data?.stock || { availableQuantity: 0, measurementType: 'units' };
    } catch (e) {
      console.error("Failed to load stock:", e);
      return { availableQuantity: 0, measurementType: 'units' };
    }
  };

  const handleCategoryChange = (category) => {
    setFormData(prev => ({
      ...prev,
      productCategory: category,
      productId: "",
      productName: ""
    }));
    loadProductsByCategory(category);
  };

  const handleProductChange = (productId) => {
    const product = products.find(p => p._id === productId);
    setFormData(prev => ({
      ...prev,
      productId: productId,
      productName: product?.name || ""
    }));
  };

  const addRawMaterial = () => {
    setSelectedRawMaterials(prev => [...prev, {
      categoryId: "",
      categoryName: "",
      measurementType: "",
      usedQuantity: "",
      availableStock: 0
    }]);
  };

  const removeRawMaterial = (index) => {
    setSelectedRawMaterials(prev => prev.filter((_, i) => i !== index));
  };

  const updateRawMaterial = async (index, field, value) => {
    const updated = [...selectedRawMaterials];
    updated[index] = { ...updated[index], [field]: value };
    
    // If category changed, load stock info
    if (field === 'categoryId' && value) {
      const material = rawMaterials.find(rm => rm.categoryId === value);
      if (material) {
        updated[index].categoryName = material.name;
        updated[index].measurementType = material.measurementType;
        
        // Load stock information
        const stock = await getStockForCategory(value);
        updated[index].availableStock = stock.availableQuantity;
      }
    }
    
    setSelectedRawMaterials(updated);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.productCategory) {
      errors.productCategory = 'Product category is required';
    }
    
    if (!formData.productId) {
      errors.productId = 'Product is required';
    }
    
    if (selectedRawMaterials.length === 0) {
      errors.rawMaterials = 'At least one raw material is required';
    }
    
    selectedRawMaterials.forEach((material, index) => {
      if (!material.categoryId) {
        errors[`rawMaterial_${index}_category`] = 'Raw material category is required';
      }
      if (!material.usedQuantity || material.usedQuantity <= 0) {
        errors[`rawMaterial_${index}_quantity`] = 'Used quantity must be greater than 0';
      }
      if (material.usedQuantity > material.availableStock) {
        errors[`rawMaterial_${index}_quantity`] = `Insufficient stock. Available: ${material.availableStock} ${material.measurementType}`;
      }
    });
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast('error', 'Please fix the validation errors');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const payload = {
        ...formData,
        rawMaterials: selectedRawMaterials.map(material => ({
          categoryId: material.categoryId,
          categoryName: material.categoryName,
          measurementType: material.measurementType,
          usedQuantity: Number(material.usedQuantity)
        }))
      };
      
      const response = await http.post("/api/production-usage", payload);
      
      showToast('success', response.data?.message || 'Production recorded and inventory updated successfully');
      
      // Reset form
      setFormData({
        productCategory: "",
        productId: "",
        productName: "",
        rawMaterials: [],
        batchId: "",
        notes: ""
      });
      setSelectedRawMaterials([]);
      setShowModal(false);
      
      // Reload data
      loadData();
      
    } catch (e) {
      console.error("Failed to record production usage:", e);
      showToast('error', e.response?.data?.message || 'Failed to record production usage');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this production record? This will restore the used materials to inventory.')) {
      return;
    }
    
    try {
      await http.delete(`/api/production-usage/${id}`);
      showToast('success', 'Production record deleted and stock restored');
      loadData();
    } catch (e) {
      console.error("Failed to delete production record:", e);
      showToast('error', 'Failed to delete production record');
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Production Usage Report', 20, 20);
    
    // Date range
    if (filters.dateFrom || filters.dateTo) {
      doc.setFontSize(12);
      const dateRange = `Date Range: ${filters.dateFrom || 'Start'} to ${filters.dateTo || 'End'}`;
      doc.text(dateRange, 20, 35);
    }
    
    // Table data
    const tableData = records.map(record => [
      record.productCategory,
      record.productName,
      record.rawMaterials.map(rm => `${rm.categoryName} (${rm.usedQuantity} ${rm.measurementType})`).join(', '),
      record.batchId || 'N/A',
      new Date(record.productionDate).toLocaleDateString(),
      record.recordedBy
    ]);
    
    autoTable(doc, {
      head: [['Category', 'Product', 'Raw Materials Used', 'Batch ID', 'Date', 'Recorded By']],
      body: tableData,
      startY: 45,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });
    
    doc.save('production-usage-report.pdf');
  };

  const filteredRecords = records.filter(record => {
    if (filters.category && !record.productCategory.toLowerCase().includes(filters.category.toLowerCase())) {
      return false;
    }
    if (filters.product && !record.productName.toLowerCase().includes(filters.product.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <InventorySidebar />
      
      <div style={{ flex: 1, padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px' 
        }}>
          <div>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: '700', 
              color: '#1e293b', 
              margin: '0 0 8px 0' 
            }}>
              Production Usage
            </h1>
            <p style={{ 
              fontSize: '16px', 
              color: '#64748b', 
              margin: 0 
            }}>
              Record raw material usage for product manufacturing
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowModal(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#1E7F3B',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>📝</span>
              Record Production
            </button>
            
            <button
              onClick={exportPDF}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>📄</span>
              Export PDF
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px' 
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
                Product Category
              </label>
              <input
                type="text"
                placeholder="Filter by category..."
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
                Product
              </label>
              <input
                type="text"
                placeholder="Filter by product..."
                value={filters.product}
                onChange={(e) => setFilters(prev => ({ ...prev, product: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
                Date From
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
                Date To
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Records Table */}
        <div style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                    Category
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                    Product
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                    Raw Materials Used
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                    Batch ID
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                    Date
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                    Recorded By
                  </th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                      Loading production records...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                      No production records found
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px', color: '#374151' }}>
                        {record.productCategory}
                      </td>
                      <td style={{ padding: '16px', color: '#374151', fontWeight: '500' }}>
                        {record.productName}
                      </td>
                      <td style={{ padding: '16px', color: '#374151' }}>
                        {record.rawMaterials.map((rm, index) => (
                          <div key={index} style={{ marginBottom: '4px' }}>
                            <span style={{ fontWeight: '500' }}>{rm.categoryName}</span>
                            <span style={{ color: '#6b7280', marginLeft: '8px' }}>
                              {rm.usedQuantity} {rm.measurementType}
                            </span>
                          </div>
                        ))}
                      </td>
                      <td style={{ padding: '16px', color: '#374151' }}>
                        {record.batchId || 'N/A'}
                      </td>
                      <td style={{ padding: '16px', color: '#374151' }}>
                        {new Date(record.productionDate).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px', color: '#374151' }}>
                        {record.recordedBy}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleDelete(record._id)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Record Production Modal */}
        {showModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              width: '90%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '24px' 
              }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                  Record Production Usage
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Product Selection */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
                    Product Information
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                        Product Category *
                      </label>
                      <select
                        value={formData.productCategory}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      >
                        <option value="">Select Category</option>
                        {productCategories.map(cat => (
                          <option key={cat._id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      {formErrors.productCategory && (
                        <span style={{ color: '#ef4444', fontSize: '12px' }}>
                          {formErrors.productCategory}
                        </span>
                      )}
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                        Product *
                      </label>
                      <select
                        value={formData.productId}
                        onChange={(e) => handleProductChange(e.target.value)}
                        disabled={!formData.productCategory}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          opacity: formData.productCategory ? 1 : 0.6
                        }}
                      >
                        <option value="">Select Product</option>
                        {products.map(product => (
                          <option key={product._id} value={product._id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                      {formErrors.productId && (
                        <span style={{ color: '#ef4444', fontSize: '12px' }}>
                          {formErrors.productId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Raw Materials */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '16px' 
                  }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                      Raw Materials Used
                    </h3>
                    <button
                      type="button"
                      onClick={addRawMaterial}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      + Add Material
                    </button>
                  </div>
                  
                  {selectedRawMaterials.map((material, index) => (
                    <div key={index} style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '12px',
                      backgroundColor: '#f9fafb'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginBottom: '12px' 
                      }}>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
                          Raw Material {index + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeRawMaterial(index)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '18px'
                          }}
                        >
                          ×
                        </button>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500' }}>
                            Material Category *
                          </label>
                          <select
                            value={material.categoryId}
                            onChange={(e) => updateRawMaterial(index, 'categoryId', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}
                          >
                            <option value="">Select Material</option>
                            {rawMaterials.map(rm => (
                              <option key={rm._id} value={rm.categoryId}>
                                {rm.name} ({rm.measurementType})
                              </option>
                            ))}
                          </select>
                          {formErrors[`rawMaterial_${index}_category`] && (
                            <span style={{ color: '#ef4444', fontSize: '10px' }}>
                              {formErrors[`rawMaterial_${index}_category`]}
                            </span>
                          )}
                        </div>
                        
                        <div>
                          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500' }}>
                            Used Quantity *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={material.usedQuantity}
                            onChange={(e) => updateRawMaterial(index, 'usedQuantity', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}
                          />
                          {formErrors[`rawMaterial_${index}_quantity`] && (
                            <span style={{ color: '#ef4444', fontSize: '10px' }}>
                              {formErrors[`rawMaterial_${index}_quantity`]}
                            </span>
                          )}
                        </div>
                        
                        <div>
                          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500' }}>
                            Available Stock
                          </label>
                          <div style={{
                            padding: '8px 10px',
                            backgroundColor: '#f3f4f6',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: '#6b7280'
                          }}>
                            {material.availableStock} {material.measurementType}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {formErrors.rawMaterials && (
                    <span style={{ color: '#ef4444', fontSize: '12px' }}>
                      {formErrors.rawMaterials}
                    </span>
                  )}
                </div>

                {/* Additional Fields */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
                    Additional Information
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                        Batch ID
                      </label>
                      <input
                        type="text"
                        value={formData.batchId}
                        onChange={(e) => setFormData(prev => ({ ...prev, batchId: e.target.value }))}
                        placeholder="Optional batch identifier"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                        Production Date
                      </label>
                      <input
                        type="date"
                        value={new Date().toISOString().split('T')[0]}
                        disabled
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          backgroundColor: '#f9fafb',
                          color: '#6b7280'
                        }}
                      />
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Optional notes about this production..."
                      rows="3"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                </div>

                {/* Submit Buttons */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  gap: '12px', 
                  paddingTop: '16px',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: submitting ? '#9ca3af' : '#1E7F3B',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: submitting ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {submitting ? 'Recording...' : 'Record Production'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
