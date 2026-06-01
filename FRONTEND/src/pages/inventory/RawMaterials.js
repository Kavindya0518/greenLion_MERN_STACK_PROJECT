// FRONTEND/src/pages/inventory/RawMaterials.js
import React, { useEffect, useState } from "react";
import http from "../../api/http";
import InventorySidebar from "../../components/InventorySidebar";
import { FaSearch, FaPlus, FaMinus, FaSyncAlt } from 'react-icons/fa';

export default function RawMaterials() {
  const [stocks, setStocks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name"); // name | quantity | updated
  
  // Adjust modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [adjustmentType, setAdjustmentType] = useState("add"); // add | reduce
  const [adjustmentValue, setAdjustmentValue] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [adjustError, setAdjustError] = useState("");
  const [adjustLoading, setAdjustLoading] = useState(false);
  
  // Toast
  const [toast, setToast] = useState({ show: false, type: 'success', message: '' });

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: 'success', message: '' }), 3000);
  };

  const load = async () => {
    try {
      setLoading(true);
      
      // Fetch both categories and stocks in parallel
      const [categoriesRes, stocksRes] = await Promise.all([
        http.get("/api/material-categories"),
        http.get("/api/category-stock")
      ]);
      
      const categoriesArr = categoriesRes.data?.categories || [];
      const stocksArr = stocksRes.data?.stocks || [];
      
      setCategories(categoriesArr);
      setStocks(stocksArr);
      
    } catch (e) {
      console.error("Failed to load data:", e);
      showToast('error', e?.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const initializeStocks = async () => {
    if (!window.confirm('Initialize stock records from existing categories?\n\nThis will create stock records for all categories that don\'t have one yet.')) return;
    
    try {
      const response = await http.post("/api/category-stock/initialize");
      const results = response.data?.results;
      
      if (results) {
        showToast('success', `Created ${results.created} new stock records. Skipped ${results.skipped} existing.`);
        load();
      }
    } catch (e) {
      showToast('error', e?.response?.data?.message || 'Failed to initialize stocks');
    }
  };

  const handleAdjust = (stock, type) => {
    setSelectedStock(stock);
    setAdjustmentType(type);
    setAdjustmentValue("");
    setAdjustmentReason("");
    setAdjustError("");
    setAdjustModalOpen(true);
  };

  const submitAdjustment = async () => {
    try {
      setAdjustError("");
      setAdjustLoading(true);
      
      const value = Number(adjustmentValue);
      
      if (!value || value <= 0) {
        setAdjustError("Please enter a quantity greater than 0");
        setAdjustLoading(false);
        return;
      }
      
      const adjustment = adjustmentType === "add" ? value : -value;
      
      await http.patch(`/api/category-stock/${selectedStock.categoryId}/adjust`, {
        adjustment,
        reason: adjustmentReason || `Manual ${adjustmentType === 'add' ? 'addition' : 'reduction'}`
      });
      
      showToast('success', `Stock ${adjustmentType === 'add' ? 'increased' : 'decreased'} successfully!`);
      setAdjustModalOpen(false);
      load();
    } catch (e) {
      setAdjustError(e?.response?.data?.message || 'Failed to adjust stock');
    } finally {
      setAdjustLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Merge categories with stocks to show all categories
  const mergedData = categories.map(category => {
    // Find corresponding stock record using the correct category code
    const catId = category.code || `CAT-${category._id.toString().slice(-3)}`;
    const stockRecord = stocks.find(s => s.categoryId === catId);
    
    return {
      _id: category._id,
      categoryId: catId,
      categoryName: category.name,
      measurementType: category.measurementType || 'units',
      availableQuantity: stockRecord?.availableQuantity || 0,
      lastUpdated: stockRecord?.lastUpdated || null,
      hasStockRecord: !!stockRecord
    };
  });

  // Filter and sort
  const filteredStocks = mergedData
    .filter((item) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.categoryId?.toLowerCase().includes(q) ||
        item.categoryName?.toLowerCase().includes(q) ||
        item.measurementType?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "name") return (a.categoryName || "").localeCompare(b.categoryName || "");
      if (sortBy === "quantity") return (b.availableQuantity || 0) - (a.availableQuantity || 0);
      if (sortBy === "updated") {
        if (!a.lastUpdated) return 1;
        if (!b.lastUpdated) return -1;
        return new Date(b.lastUpdated) - new Date(a.lastUpdated);
      }
      return 0;
    });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      <InventorySidebar />
      
      <div style={{ flex: 1, padding: "24px" }}>
        {/* Toast */}
        {toast.show && (
        <div style={{ 
            position: "fixed",
            top: "20px",
            right: "20px",
            padding: "12px 20px",
            background: toast.type === 'success' ? '#10B981' : '#EF4444',
            color: '#fff',
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            zIndex: 1000,
            fontSize: "14px",
            fontWeight: "500"
          }}>
            {toast.message}
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "700", color: "#0f172a" }}>
            Raw Material Stock
          </h1>
          <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: "14px" }}>
            Category-based inventory management - one record per material category
          </p>
        </div>

        {/* Actions Bar */}
              <div style={{ 
          background: "#fff",
          padding: "16px",
          borderRadius: "8px",
          marginBottom: "16px",
          border: "1px solid #e5e7eb",
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", flex: 1 }}>
            {/* Search */}
            <div style={{ position: "relative", flex: 1, minWidth: "250px" }}>
              <FaSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
              <input
                type="text"
                placeholder="Search by Category ID, Name, or Unit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 36px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
              </div>
              
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
                  style={{
                padding: "8px 12px",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                fontSize: "14px",
                outline: "none",
                minWidth: "180px"
              }}
            >
              <option value="name">Sort by Category Name</option>
              <option value="quantity">Sort by Quantity</option>
              <option value="updated">Sort by Last Updated</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
                <button
              onClick={load}
                  style={{
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#fff",
                background: "#1E7F3B",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <FaSyncAlt /> Refresh
                </button>
              </div>
            </div>

        {/* Stats Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "16px"
        }}>
          <div style={{
            background: "#fff",
            padding: "16px",
            borderRadius: "8px",
            border: "1px solid #e5e7eb"
          }}>
            <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>Total Categories</div>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a" }}>{categories.length}</div>
          </div>
          
          <div style={{
            background: "#fff",
            padding: "16px",
            borderRadius: "8px",
            border: "1px solid #e5e7eb"
          }}>
            <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>In Stock</div>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#10B981" }}>
              {mergedData.filter(s => s.availableQuantity > 0).length}
            </div>
          </div>
          
                  <div style={{ 
            background: "#fff",
            padding: "16px",
            borderRadius: "8px",
            border: "1px solid #e5e7eb"
          }}>
            <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>Empty Stock</div>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#EF4444" }}>
              {mergedData.filter(s => s.availableQuantity === 0).length}
                            </div>
                        </div>
                      </div>
                      
        {/* Stocks Table */}
        <div style={{
          background: "#fff",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          overflow: "hidden"
        }}>
          {loading ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
              Loading stocks...
                                  </div>
          ) : filteredStocks.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>📦</div>
              <div style={{ fontSize: "16px", fontWeight: "500", marginBottom: "4px" }}>
                No categories found
                    </div>
              <div style={{ fontSize: "14px", marginBottom: "16px" }}>
                {categories.length === 0 ? "Create categories in Supplier Management → Categories" : "Try adjusting your search"}
              </div>
              </div>
            ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                  <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#64748b" }}>
                      Category ID
                    </th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#64748b" }}>
                      Category Name
                    </th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#64748b" }}>
                      Measurement Type
                    </th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#64748b" }}>
                      Available Quantity
                    </th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#64748b" }}>
                      Last Updated
                    </th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#64748b" }}>
                      Actions
                    </th>
                </tr>
              </thead>
              <tbody>
                  {filteredStocks.map((stock) => (
                    <tr key={stock._id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ 
                        padding: "12px", 
                        fontFamily: "ui-monospace, monospace", 
                        fontWeight: "600", 
                        fontSize: "13px",
                        color: "#3B82F6"
                      }}>
                        {stock.categoryId}
                    </td>
                      <td style={{ padding: "12px", fontSize: "14px", fontWeight: "500" }}>
                        {stock.categoryName}
                    </td>
                      <td style={{ padding: "12px", fontSize: "14px" }}>
                        <span style={{ 
                          padding: "4px 8px",
                          background: "#f3f4f6",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "500"
                        }}>
                          {stock.measurementType}
                        </span>
                    </td>
                      <td style={{ padding: "12px", fontSize: "14px" }}>
                        <span style={{
                          fontWeight: "600",
                          fontSize: "16px",
                          color: stock.availableQuantity === 0 ? "#EF4444" : stock.availableQuantity < 100 ? "#F59E0B" : "#10B981"
                        }}>
                          {stock.availableQuantity || 0}
                        </span>
                        <span style={{ fontSize: "12px", color: "#9ca3af", marginLeft: "4px" }}>
                          {stock.measurementType}
                        </span>
                    </td>
                      <td style={{ padding: "12px", fontSize: "13px", color: "#64748b" }}>
                        {stock.lastUpdated ? formatDate(stock.lastUpdated) : "—"}
                    </td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <button 
                            onClick={() => handleAdjust(stock, 'add')}
                            style={{ 
                              padding: "6px 12px",
                              fontSize: "12px",
                              fontWeight: "500",
                              color: "#fff",
                              background: "#10B981",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <FaPlus size={10} /> Add
                          </button>
                          <button 
                            onClick={() => handleAdjust(stock, 'reduce')}
                            disabled={stock.availableQuantity === 0}
                            style={{ 
                              padding: "6px 12px",
                              fontSize: "12px",
                              fontWeight: "500",
                              color: "#fff",
                              background: stock.availableQuantity === 0 ? "#9ca3af" : "#F59E0B",
                              border: "none",
                              borderRadius: "6px",
                              cursor: stock.availableQuantity === 0 ? "not-allowed" : "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <FaMinus size={10} /> Reduce
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

        {/* Adjust Stock Modal */}
        {adjustModalOpen && selectedStock && (
          <div style={{ 
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px"
          }}>
            <div style={{ 
              background: "#fff",
              borderRadius: "12px",
              maxWidth: "500px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)"
            }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "18px", fontWeight: "600" }}>
                {adjustmentType === 'add' ? '➕ Add Stock' : '➖ Reduce Stock'}
              </h3>
              
              <div style={{ 
                background: "#f9fafb",
                padding: "12px",
                borderRadius: "6px",
                marginBottom: "20px"
              }}>
                <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>Category:</div>
                <div style={{ fontSize: "16px", fontWeight: "600" }}>{selectedStock.categoryName}</div>
                <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
                  Current Stock: <strong>{selectedStock.availableQuantity} {selectedStock.measurementType}</strong>
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500" }}>
                  Quantity to {adjustmentType === 'add' ? 'Add' : 'Reduce'} *
                </label>
                <input
                  type="number"
                  value={adjustmentValue}
                  onChange={(e) => setAdjustmentValue(e.target.value)}
                  placeholder={`Enter quantity in ${selectedStock.measurementType}`}
                  min="0"
                  step="1"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "14px",
                    outline: "none"
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500" }}>
                  Reason (optional)
                  </label>
                <textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="e.g., Damaged goods, Production usage, etc."
                  rows={3}
                      style={{ 
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "14px",
                    outline: "none",
                    resize: "vertical"
                  }}
                />
                </div>
                
              {adjustmentType === 'add' && adjustmentValue && (
                <div style={{
                  background: "#d1fae5",
                  padding: "12px",
                  borderRadius: "6px",
                  marginBottom: "16px",
                  fontSize: "13px",
                  color: "#065f46"
                }}>
                  New quantity will be: <strong>{selectedStock.availableQuantity + Number(adjustmentValue)} {selectedStock.measurementType}</strong>
                </div>
              )}

              {adjustmentType === 'reduce' && adjustmentValue && (
                <div style={{
                  background: Number(adjustmentValue) > selectedStock.availableQuantity ? "#fee2e2" : "#fef3c7",
                  padding: "12px",
                  borderRadius: "6px",
                  marginBottom: "16px",
                  fontSize: "13px",
                  color: Number(adjustmentValue) > selectedStock.availableQuantity ? "#991b1b" : "#92400e"
                }}>
                  {Number(adjustmentValue) > selectedStock.availableQuantity ? (
                    <>⚠️ Insufficient stock! Current: {selectedStock.availableQuantity}</>
                  ) : (
                    <>New quantity will be: <strong>{selectedStock.availableQuantity - Number(adjustmentValue)} {selectedStock.measurementType}</strong></>
                  )}
                </div>
              )}
                
              {adjustError && (
                <div style={{ 
                  padding: "12px",
                  background: "#fee2e2",
                  color: "#991b1b",
                  borderRadius: "6px",
                  marginBottom: "16px",
                  fontSize: "13px"
                }}>
                  {adjustError}
                </div>
              )}

              <div style={{ display: "flex", gap: "12px" }}>
                  <button 
                  onClick={() => setAdjustModalOpen(false)}
                  disabled={adjustLoading}
                    style={{ 
                    flex: 1,
                    padding: "10px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#64748b",
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    cursor: adjustLoading ? "not-allowed" : "pointer"
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                  onClick={submitAdjustment}
                  disabled={adjustLoading}
                    style={{ 
                    flex: 1,
                    padding: "10px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#fff",
                    background: adjustLoading ? "#9ca3af" : adjustmentType === 'add' ? "#10B981" : "#F59E0B",
                    border: "none",
                    borderRadius: "6px",
                    cursor: adjustLoading ? "not-allowed" : "pointer"
                  }}
                >
                  {adjustLoading ? "Updating..." : adjustmentType === 'add' ? "Add Stock" : "Reduce Stock"}
                  </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
