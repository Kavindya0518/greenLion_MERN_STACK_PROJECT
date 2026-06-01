import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import http from "../../api/http";
import { motion } from 'framer-motion';
import InventorySidebar from "../../components/InventorySidebar";
import { 
  FaBoxOpen, 
  FaBoxes, 
  FaExclamationTriangle, 
  FaDollarSign,
  FaArrowRight,
  FaArrowUp,
  FaArrowDown,
  FaSearch,
  FaFileExport,
  FaFilter,
  FaPlus,
  FaExchangeAlt
} from 'react-icons/fa';

export default function InventoryDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [rawCount, setRawCount] = useState(0);
  const [finishedCount, setFinishedCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [valuation, setValuation] = useState(0);
  const [recentTx, setRecentTx] = useState([]);
  const [fpCategoryCounts, setFpCategoryCounts] = useState({});

  // Default link to movements: last 30 days, limit 50
  const defaultFrom = new Date(Date.now() - 30*24*60*60*1000).toISOString().slice(0,10);
  const movementsUrl = `/admin/inventory/movements?dateFrom=${defaultFrom}&limit=50`;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch each block independently so a 404 in one doesn't break the page
        let invItems = [];
        try {
          const invRes = await http.get("/api/inventory");
          invItems = invRes?.data?.items || invRes?.data?.data || [];
        } catch (e) {
          // Fallback to legacy endpoints if available
          try {
            const [rawRes, finRes] = await Promise.all([
              http.get("/api/rawmaterials"),
              http.get("/api/finishedproducts"),
            ]);
            const rawList = rawRes?.data?.items || rawRes?.data?.data || rawRes?.data || [];
            const finList = finRes?.data?.items || finRes?.data?.data || finRes?.data || [];
            setRawCount(rawList.length);
            setFinishedCount(finList.length);
          } catch (ignore) {}
        }

        if (invItems.length) {
          setRawCount(invItems.filter(i => i.category === 'raw_material').length);
          setFinishedCount(invItems.filter(i => i.category === 'finished_product').length);
        }

        try {
          console.log('Fetching low stock items...');
          
          // Get low stock items from both raw materials and finished products
          const [lowRawRes, lowFinRes] = await Promise.all([
            http.get("/api/rawmaterials/low-stock").catch(e => {
              console.error('Error fetching low stock raw materials:', e);
              return { data: { data: [] } };
            }),
            http.get("/api/finishedproducts/low-stock").catch(e => {
              console.error('Error fetching low stock finished products:', e);
              return { data: { data: [] } };
            })
          ]);
          
          console.log('Raw materials low stock response:', lowRawRes);
          console.log('Finished products low stock response:', lowFinRes);
          
          const lowRawItems = lowRawRes?.data?.data || [];
          const lowFinItems = lowFinRes?.data?.data || [];
          
          console.log('Raw materials low stock items:', lowRawItems);
          console.log('Finished products low stock items:', lowFinItems);
          
          // Combine and format the items
          const allLowItems = [
            ...(lowRawItems || []).map(it => ({
              ...it,
              itemType: 'raw_material',
              category: it.category || 'Raw Material',
              currentQuantity: it.quantity,
              minimumLevel: it.reOrderLevel || it.uol || 0
            })),
            ...(lowFinItems || []).map(it => ({
              ...it,
              itemType: 'finished_product',
              category: it.category || 'Finished Product',
              currentQuantity: it.quantity,
              minimumLevel: it.reOrderLevel || 0
            }))
          ];
          
          console.log('All low stock items:', allLowItems);
          
          setLowStockItems(allLowItems);
          setLowStockCount(allLowItems.length);
        } catch (e) {
          console.error("Error in low stock processing:", e);
          setLowStockItems([]);
          setLowStockCount(0);
        }

        try {
          // Fetch both raw materials and finished products
          const [rawRes, finRes] = await Promise.all([
            http.get("/api/rawmaterials"),
            http.get("/api/finishedproducts")
          ]);
          
          const rawMaterials = rawRes?.data?.items || rawRes?.data?.data || [];
          const finishedProducts = finRes?.data?.items || finRes?.data?.data || [];
          
          // Calculate total value of raw materials (quantity * unitPrice)
          const rawMaterialsValue = rawMaterials.reduce((sum, item) => {
            return sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0));
          }, 0);
          
          // Calculate total value of finished products (quantity * sellingPrice)
          const finishedProductsValue = finishedProducts.reduce((sum, item) => {
            return sum + (Number(item.quantity || 0) * Number(item.sellingPrice || 0));
          }, 0);
          
          // Set the total valuation
          const totalValuation = rawMaterialsValue + finishedProductsValue;
          setValuation(totalValuation);
          
          console.log('Inventory Valuation:', {
            rawMaterialsValue,
            finishedProductsValue,
            totalValuation
          });
          
        } catch (e) {
          console.error("Error calculating inventory valuation:", e);
          setValuation(0);
        }

        // Fetch finished products to compute category counts
        try {
          const fpRes = await http.get("/api/finishedproducts");
          const fps = fpRes?.data?.items || [];
          const counts = {};
          for (const it of fps) {
            const cat = String(it.category || 'Uncategorized');
            counts[cat] = (counts[cat] || 0) + 1;
          }
          setFpCategoryCounts(counts);
        } catch (_) {
          setFpCategoryCounts({});
        }

        try {
          const txRes = await http.get("/api/stock-transactions?limit=10");
          setRecentTx(txRes?.data?.items || txRes?.data?.data || []);
        } catch (e) {
          // No transactions route; keep empty silently
          
        }
      } catch (err) {
        console.error("Inventory dashboard load error:", err);
        if (!mounted) return;
        // Show a single-line message but keep UI usable
        setError(err?.response?.data?.message || err?.message || "Failed to load inventory dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '' }}>
        <InventorySidebar />
        <div style={{ flex: 1, padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ 
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <h2 style={{ margin: 0, color: '#1e293b', fontWeight: '600', fontSize: '24px' }}>Inventory Dashboard</h2>
          </div>
          <div style={{ 
            background: 'white', 
            borderRadius: '16px', 
            padding: '60px 24px', 
            boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
            textAlign: 'center',
            color: '#64748b',
            fontSize: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              border: '4px solid #e2e8f0',
              borderTopColor: '#2563eb',
              animation: 'spin 1s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }}></div>
            <div>Loading inventory data...</div>
          </div>
        </div>
      </div>
    );
  }

  // Import the InventoryHeader component
  const { InventoryHeader } = require('../../styles/inventoryStyles');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f7fa' }}>
      <InventorySidebar />
      <div style={{ flex: 1, padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <InventoryHeader 
          title="Inventory Dashboard"
          subtitle="Overview of your inventory status and recent activities"
          actions={[
            {
              label: 'Manage Inventory',
              icon: '📦',
              to: "/admin/inventory/movements",
              primary: true
            },
            {
              label: 'Add New Item',
              icon: '➕',
              to: "/admin/inventory/add",
              primary: false
            },
            {
              label: 'View Movements',
              icon: '🔄',
              to: "/admin/inventory/movements",
              primary: false
            },
            {
              label: 'Low Stock Alerts',
              icon: '⚠️',
              to: "/admin/inventory/alerts",
              primary: false
            }
          ]}
        />

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              padding: '12px 16px',
              border: '1px solid #fecaca',
              background: '#fef2f2',
              color: '#b91c1c',
              borderRadius: '8px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#ef4444',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <FaExclamationTriangle size={12} />
            </div>
            <div>{error}</div>
          </motion.div>
        )}

        {/* Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          <motion.div whileHover={{ y: -5, transition: { duration: 0.2 } }}>
            <Card 
              title="Raw Materials" 
              value={rawCount} 
              icon={<FaBoxOpen size={24} color="#3b82f6" />} 
              bgColor="#eff6ff"
              textColor="#1e40af"
              trend={rawCount > 0 ? 'up' : 'neutral'}
              trendValue="12%"
            />
          </motion.div>
          
          <motion.div whileHover={{ y: -5, transition: { duration: 0.2 } }}>
            <Card 
              title="Finished Products" 
              value={finishedCount} 
              icon={<FaBoxes size={24} color="#10b981" />} 
              bgColor="#ecfdf5"
              textColor="#065f46"
              trend={finishedCount > 0 ? 'up' : 'neutral'}
              trendValue="8%"
            />
          </motion.div>
          
          <motion.div whileHover={{ y: -5, transition: { duration: 0.2 } }}>
            <Card 
              title="Low Stock Alerts" 
              value={lowStockCount} 
              icon={<FaExclamationTriangle size={24} color="#f59e0b" />} 
              bgColor="#fffbeb"
              textColor="#92400e"
              trend={lowStockCount > 0 ? 'up' : 'neutral'}
              trendValue={lowStockCount > 0 ? 'Critical' : 'None'}
              trendType={lowStockCount > 0 ? 'danger' : 'neutral'}
            />
          </motion.div>
          
          <motion.div whileHover={{ y: -5, transition: { duration: 0.2 } }}>
            <Card 
              title="Stock Valuation" 
              value={`LKR ${Number(valuation).toLocaleString('en-LK', { maximumFractionDigits: 0 })}`} 
              icon={<FaDollarSign size={24} color="#8b5cf6" />} 
              bgColor="#f5f3ff"
              textColor="#5b21b6"
              trend="up"
              trendValue="5.2%"
              trendType="success"
            />
          </motion.div>
        </div>


        {/* Recent Stock Movements */}
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
          marginBottom: '24px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <h3 style={{ 
              margin: 0, 
              color: '#1e293b', 
              fontWeight: '600',
              fontSize: '18px'
            }}>
              📝 Recent Stock Movements
            </h3>
            <Link to={movementsUrl} style={{ 
              color: '#2563eb', 
              textDecoration: 'none', 
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'color 0.2s'
            }}>
              View Reports <FaArrowRight size={14} />
            </Link>
          </div>
          {recentTx.length === 0 ? (
            <div style={{ 
              color: '#64748b', 
              textAlign: 'center',
              padding: '32px 16px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px dashed #e2e8f0'
            }}>
              No recent transactions found
            </div>
          ) : (
            <div style={{
              background: '#fff',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.5fr 1fr',
                padding: '12px 16px',
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                fontWeight: '600',
                color: '#475569',
                fontSize: '14px'
              }}>
                <div>Item</div>
                <div>Details</div>
                <div>Date</div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {recentTx.map((t) => (
                  <li key={t._id} style={{
                    padding: '16px',
                    borderBottom: '1px solid #f1f5f9',
                    transition: 'background 0.2s',
                    ':hover': {
                      background: '#f8fafc'
                    },
                    display: 'grid',
                    gridTemplateColumns: '1fr 1.5fr 1fr',
                    alignItems: 'center',
                    gap: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: t.transactionType === 'in' ? '#16a34a' : 
                                  t.transactionType === 'out' ? '#dc2626' : 
                                  t.transactionType === 'adjustment' ? '#f59e0b' : '#6b7280'
                      }} />
                      <div style={{ 
                        fontWeight: '600',
                        color: '#1e293b'
                      }}>
                        {t.itemCode}
                      </div>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        background: badgeBg(t.transactionType),
                        color: badgeFg(t.transactionType),
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'capitalize'
                      }}>
                        {t.transactionType}
                      </span>
                    </div>
                    <div style={{ 
                      color: '#475569',
                      fontSize: '14px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      alignItems: 'center'
                    }}>
                      <span style={{ 
                        background: '#f1f5f9', 
                        padding: '2px 8px', 
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}>
                        {t.itemType}
                      </span>
                      <span>Qty: <strong>{t.quantity}</strong></span>
                      <span style={{ color: '#94a3b8' }}>•</span>
                      <span>Prev: {t.previousStock ?? '0'}</span>
                      <FaArrowRight size={12} style={{ color: '#94a3b8' }} />
                      <span>New: {t.newStock ?? '0'}</span>
                      {t.reason && (
                        <span style={{ 
                          color: '#64748b',
                          fontSize: '13px',
                          fontStyle: 'italic'
                        }}>
                          • {t.reason}
                        </span>
                      )}
                    </div>
                    <div style={{ 
                      color: '#64748b', 
                      fontSize: '13px',
                      textAlign: 'right'
                    }}>
                      {new Date(t.timestamp || t.createdAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, icon, bgColor, textColor, trend, trendValue, trendType = 'neutral' }) {
  const trendColors = {
    up: { bg: '#dcfce7', text: '#166534', icon: <FaArrowUp size={12} /> },
    down: { bg: '#fee2e2', text: '#991b1b', icon: <FaArrowDown size={12} /> },
    neutral: { bg: '#f1f5f9', text: '#475569', icon: null }
  };

  const trendConfig = trendColors[trend] || trendColors.neutral;
  
  // Override trend style if trendType is provided
  if (trendType === 'danger') {
    trendConfig.bg = '#fee2e2';
    trendConfig.text = '#991b1b';
  } else if (trendType === 'success') {
    trendConfig.bg = '#dcfce7';
    trendConfig.text = '#166534';
  }

  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
      transition: 'all 0.3s ease',
      border: '1px solid #e2e8f0',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      ':hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 10px 20px rgba(0,0,0,0.08)'
      }
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: textColor,
          flexShrink: 0
        }}>
          {icon}
        </div>
        
        {trend && (
          <div style={{
            background: trendConfig.bg,
            color: trendConfig.text,
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            height: '24px'
          }}>
            {trendConfig.icon}
            {trendValue}
          </div>
        )}
      </div>
      
      <div>
        <div style={{ 
          color: '#64748b', 
          fontSize: '14px',
          marginBottom: '8px',
          fontWeight: '500'
        }}>
          {title}
        </div>
        <div style={{ 
          fontSize: '24px', 
          fontWeight: '700', 
          color: textColor,
          lineHeight: 1.2,
          marginBottom: '8px'
        }}>
          {value}
        </div>
      </div>
      
      {/* Progress bar */}
      <div style={{ 
        marginTop: 'auto',
        width: '100%',
        height: '4px',
        background: '#f1f5f9',
        borderRadius: '2px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: trend === 'up' ? '75%' : trend === 'down' ? '30%' : '50%',
          height: '100%',
          background: textColor,
          borderRadius: '2px',
          transition: 'width 0.5s ease'
        }}></div>
      </div>
    </div>
  );
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut'
    }
  }
};
function badgeBg(type) {
  const styles = {
    in: 'rgba(34, 197, 94, 0.1)',
    out: 'rgba(239, 68, 68, 0.1)',
    production: 'rgba(99, 102, 241, 0.1)',
    adjustment: 'rgba(245, 158, 11, 0.1)',
    default: 'rgba(203, 213, 225, 0.3)'
  };
  return styles[type] || styles.default;
}

function badgeFg(type) {
  const styles = {
    in: '#16a34a',
    out: '#dc2626',
    production: '#4f46e5',
    adjustment: '#d97706',
    default: '#334155'
  };
  return styles[type] || styles.default;
}
