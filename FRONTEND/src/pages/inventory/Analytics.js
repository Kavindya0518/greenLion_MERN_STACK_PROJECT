import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import http from "../../api/http";
import InventorySidebar from "../../components/InventorySidebar";
import { InventoryHeader } from '../../styles/inventoryStyles';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

// Card style
const cardStyle = {
  backgroundColor: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '16px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  height: '100%'
};

const chartContainerStyle = {
  height: '350px',
  width: '100%',
  margin: '20px 0'
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Analytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Analytics data state
  const [analytics, setAnalytics] = useState({
    totalItems: 0,
    totalValue: 0,
    rawMaterialCount: 0,
    finishedProductCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    recentTransactions: [],
    categoryDistribution: {},
    topMovingItems: []
  });
  // Raw data from API (used for charts/computations)
  const [items, setItems] = useState([]);
  const [movements, setMovements] = useState([]);
  
  // Note: No mock/sample data. Page relies only on backend APIs.

  // Fetch inventory analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch from API (no mock fallback)
        const [inventoryRes, movementsRes] = await Promise.all([
          http.get('/api/items'),
          http.get('/api/movements?limit=10&sort=-date'),
        ]);

        // Normalize responses
        const inventoryItems = Array.isArray(inventoryRes?.data)
          ? inventoryRes.data
          : (inventoryRes?.data?.items || inventoryRes?.data?.data || []);

        const movementItems = Array.isArray(movementsRes?.data)
          ? movementsRes.data
          : (movementsRes?.data?.items || movementsRes?.data?.data || []);

        console.log('Processed data:', { inventoryItems, movements: movementItems });

        // Calculate analytics
        const totalValue = inventoryItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0);
        const rawMaterialCount = inventoryItems.filter(item => item.category === 'raw_material').length;
        const finishedProductCount = inventoryItems.filter(item => item.category === 'finished_product').length;
        const lowStockItems = inventoryItems.filter(item => (item.quantity || 0) <= (item.reorderLevel || 0) && (item.quantity || 0) > 0);
        const outOfStockItems = inventoryItems.filter(item => (item.quantity || 0) <= 0);
        
        // Group by category
        const categoryDistribution = inventoryItems.reduce((acc, item) => {
          const category = item.category || 'Uncategorized';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {});
        
        // Get top moving items (simplified - would be better with actual movement data)
        const topMovingItems = [...inventoryItems]
          .sort((a, b) => ((b.quantityIn || 0) - (b.quantityOut || 0)) - ((a.quantityIn || 0) - (a.quantityOut || 0)))
          .slice(0, 5);
        
        setAnalytics({
          totalItems: inventoryItems.length,
          totalValue,
          rawMaterialCount,
          finishedProductCount,
          lowStockCount: lowStockItems.length,
          outOfStockCount: outOfStockItems.length,
          recentTransactions: movementItems.slice(0, 10),
          categoryDistribution,
          topMovingItems: topMovingItems.map(item => ({
            id: item._id || item.id,
            name: item.name,
            category: item.category,
            movement: (item.quantityIn || 0) - (item.quantityOut || 0)
          })),
          lowStockItems: lowStockItems.map(item => ({
            id: item._id || item.id,
            name: item.name,
            current: item.quantity || 0,
            min: item.reorderLevel || 0
          }))
        });

        setItems(inventoryItems);
        setMovements(movementItems);
        
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError('Failed to load analytics data from server.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, []);
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafb' }}>
        <InventorySidebar />
        <div style={{ flex: 1, padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div>Loading inventory data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafb' }}>
        <InventorySidebar />
        <div style={{ flex: 1, padding: '24px', color: '#dc2626' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f7fa' }}>
      <InventorySidebar />
      <div style={{ flex: 1, padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <InventoryHeader 
          title="Inventory Analytics"
          subtitle="View and analyze inventory performance and metrics"
          actions={[
            {
              label: 'View Dashboard',
              icon: '📊',
              to: "/admin/inventory/dashboard",
              primary: true
            },
            {
              label: 'View Reports',
              icon: '📈',
              to: "/admin/inventory/reports",
              primary: false
            }
          ]}
        />
        
        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={cardStyle}>
            <h3 style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Items</h3>
            <p style={{ fontSize: '24px', fontWeight: '600', color: '#111827' }}>{analytics.totalItems.toLocaleString()}</p>
          </div>
          <div style={cardStyle}>
            <h3 style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Value</h3>
            <p style={{ fontSize: '24px', fontWeight: '600', color: '#111827' }}>{formatCurrency(analytics.totalValue)}</p>
          </div>
          <div style={cardStyle}>
            <h3 style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Raw Materials</h3>
            <p style={{ fontSize: '24px', fontWeight: '600', color: '#2563eb' }}>{analytics.rawMaterialCount}</p>
          </div>
          <div style={cardStyle}>
            <h3 style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Finished Products</h3>
            <p style={{ fontSize: '24px', fontWeight: '600', color: '#2563eb' }}>{analytics.finishedProductCount}</p>
          </div>
          <div style={cardStyle}>
            <h3 style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Low Stock</h3>
            <p style={{ fontSize: '24px', fontWeight: '600', color: analytics.lowStockCount > 0 ? '#d97706' : '#111827' }}>
              {analytics.lowStockCount}
            </p>
          </div>
          <div style={cardStyle}>
            <h3 style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Out of Stock</h3>
            <p style={{ fontSize: '24px', fontWeight: '600', color: analytics.outOfStockCount > 0 ? '#dc2626' : '#111827' }}>
              {analytics.outOfStockCount}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          {/* Recent Transactions */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Recent Transactions</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: '8px 16px', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Item</th>
                    <th style={{ textAlign: 'right', padding: '8px 16px', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Type</th>
                    <th style={{ textAlign: 'right', padding: '8px 16px', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '8px 16px', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.recentTransactions.map((tx, index) => (
                    <tr key={tx._id || index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>{tx.item?.name || 'N/A'}</td>
                      <td style={{ textAlign: 'right', padding: '12px 16px', fontSize: '14px' }}>
                        <span style={{
                          backgroundColor: tx.type === 'in' ? '#ecfdf5' : '#fef2f2',
                          color: tx.type === 'in' ? '#065f46' : '#b91c1c',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          textTransform: 'capitalize'
                        }}>
                          {tx.type || 'N/A'}
                        </span>
                      </td>
                      <td style={{ 
                        textAlign: 'right', 
                        padding: '12px 16px', 
                        fontSize: '14px',
                        color: tx.type === 'in' ? '#10b981' : '#ef4444'
                      }}>
                        {tx.quantity?.toLocaleString() || '0'}
                      </td>
                      <td style={{ textAlign: 'right', padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>
                        {tx.date ? new Date(tx.date).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                  {analytics.recentTransactions.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '16px', color: '#6b7280', fontSize: '14px' }}>
                        No recent transactions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Low Stock Items */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Low Stock Items</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: '8px 16px', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Item</th>
                    <th style={{ textAlign: 'right', padding: '8px 16px', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Current</th>
                    <th style={{ textAlign: 'right', padding: '8px 16px', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Min</th>
                    <th style={{ textAlign: 'right', padding: '8px 16px', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.lowStockItems.map((item) => {
                    const isOutOfStock = item.current === 0;
                    const isCritical = item.current > 0 && item.current <= item.min * 0.5;
                    const isLow = item.current > item.min * 0.5 && item.current <= item.min;
                    
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '12px 16px', fontSize: '14px' }}>{item.name}</td>
                        <td style={{ 
                          textAlign: 'right', 
                          padding: '12px 16px', 
                          fontSize: '14px',
                          color: isOutOfStock ? '#dc2626' : isCritical ? '#d97706' : '#ca8a04',
                          fontWeight: '500'
                        }}>
                          {item.current.toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right', padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>
                          {item.min.toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right', padding: '12px 16px' }}>
                          <span style={{
                            backgroundColor: isOutOfStock ? '#fee2e2' : isCritical ? '#ffedd5' : '#fef3c7',
                            color: isOutOfStock ? '#b91c1c' : isCritical ? '#9a3412' : '#92400e',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {isOutOfStock ? 'Out of Stock' : isCritical ? 'Critical' : 'Low Stock'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {analytics.lowStockItems.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '16px', color: '#6b7280', fontSize: '14px' }}>
                        No low stock items
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          {/* Category Distribution Pie Chart */}
          <div style={{ ...cardStyle, padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Inventory by Category</h3>
            <div style={{ height: '350px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(analytics.categoryDistribution).map(([name, value]) => ({
                      name: name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
                      value
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {Object.entries(analytics.categoryDistribution).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} items`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stock Status Pie Chart */}
          <div style={{ ...cardStyle, padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Stock Status</h3>
            <div style={{ height: '350px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'In Stock', value: analytics.totalItems - analytics.outOfStockCount },
                      { name: 'Out of Stock', value: analytics.outOfStockCount },
                      { name: 'Low Stock', value: analytics.lowStockCount }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell fill="#4CAF50" />
                    <Cell fill="#F44336" />
                    <Cell fill="#FFC107" />
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} items`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Inventory Value by Category Bar Chart */}
        <div style={{ ...cardStyle, padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Inventory Value by Category</h3>
          <div style={{ height: '400px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(analytics.categoryDistribution).map(([category]) => {
                  const itemsInCategory = items.filter(item => item.category === category);
                  const totalValueByCategory = itemsInCategory.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0);
                  return {
                    name: category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
                    value: totalValueByCategory
                  };
                })}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis 
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Total Value']}
                />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" name="Inventory Value" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
