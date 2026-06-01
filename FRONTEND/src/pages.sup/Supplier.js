import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import http from "../api/http";
import SupplierSidebar from "./SupplierSidebar";

export default function SupplierDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [deliveries, setDeliveries] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const [supRes, catRes, matRes, poRes, delRes] = await Promise.all([
          http.get("/api/suppliers").catch(() => ({ data: [] })),
          http.get("/api/material-categories").catch(() => ({ data: [] })),
          http.get("/api/supplier-materials?limit=10&sort=-updatedAt").catch(() => ({ data: [] })),
          http.get("/api/purchase-orders?limit=10&sort=-createdAt").catch(() => ({ data: [] })),
          http.get("/api/deliveries?limit=10&sort=-createdAt").catch(() => ({ data: [] })),
        ]);
        if (!mounted) return;
        const arr = (r) =>
          Array.isArray(r?.data?.suppliers) ? r.data.suppliers :
          Array.isArray(r?.data?.categories) ? r.data.categories :
          Array.isArray(r?.data?.items) ? r.data.items :
          Array.isArray(r?.data?.data) ? r.data.data :
          Array.isArray(r?.data) ? r.data : [];
        setSuppliers(arr(supRes));
        setCategories(arr(catRes));
        setMaterials(arr(matRes));
        setPurchaseOrders(arr(poRes));
        setDeliveries(arr(delRes));
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e?.message || "Failed to load supplier dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const totalSuppliers = suppliers.length;
  const activeSuppliers = useMemo(() => suppliers.filter(s => (s.status || "Active") === "Active").length, [suppliers]);
  const pendingSuppliers = useMemo(() => suppliers.filter(s => (s.status || "Active") === "Pending").length, [suppliers]);
  const totalCategories = categories.length;

  const activity = useMemo(() => {
    const mapItem = (type, t, title, desc) => ({ type, time: new Date(t || Date.now()).getTime(), title, desc });
    const reg = suppliers.slice(0, 10).map(s => mapItem("Supplier", s.createdAt, `New supplier: ${s.companyName || s.name || s.email}`, s.status ? `Status: ${s.status}` : ""));
    const price = materials.slice(0, 10).map(m => mapItem("Material", m.updatedAt, `Price update: ${m.name || m.materialCode}`, `Price: ${m.price}`));
    const dels = deliveries.slice(0, 10).map(d => mapItem("Delivery", d.createdAt, `Delivery for PO ${d.poNumber || d.poId || ''}`, `${(d.items||[]).length} items`));
    const pos = purchaseOrders.slice(0, 10).map(p => mapItem("PO", p.updatedAt || p.createdAt, `PO ${p.poNumber || p._id}`, `Status: ${p.status || 'draft'}`));
    return [...reg, ...price, ...dels, ...pos].sort((a,b)=>b.time-a.time).slice(0,12);
  }, [suppliers, materials, deliveries, purchaseOrders]);

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafb' }}>
        <SupplierSidebar />
        <div style={{ flex: 1, padding: 24, maxWidth: 1400, margin: '0 auto' }}>
          <div style={loadingCardStyle}>
            <div style={loadingSpinnerStyle}></div>
            <h2 style={loadingTextStyle}>Loading Dashboard...</h2>
            <p style={loadingSubtextStyle}>Please wait while we fetch your data</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafb' }}>
        <SupplierSidebar />
        <div style={{ flex: 1, padding: 24, maxWidth: 1400, margin: '0 auto' }}>
          <div style={errorCardStyle}>
            <div style={errorIconStyle}>⚠</div>
            <h2 style={errorTitleStyle}>Dashboard Error</h2>
            <p style={errorMessageStyle}>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              style={retryButtonStyle}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafb' }}>
      <SupplierSidebar />
      <div style={{ flex: 1, padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      {/* Hero Header */}
      <section style={heroSectionStyle}>
        <div style={heroContentStyle}>
          <div style={heroTextStyle}>
            <h1 style={heroTitleStyle}>Suppliers Dashboard</h1>
            <p style={heroDescriptionStyle}>
              Manage suppliers, compare prices, and keep your raw material flow healthy
            </p>
          </div>
          <div style={heroActionsStyle}>
            <Link to="/admin/suppliers/new" style={primaryButtonStyle}>
              + Add Supplier
            </Link>
            <Link to="/admin/suppliers/categories" style={primaryButtonStyle}>
              + Add Category
            </Link>
            <Link to="/admin/suppliers/manage" style={secondaryButtonStyle}>
              Approve Suppliers
            </Link>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <section style={kpiSectionStyle}>
        <KPICard 
          icon="👥" 
          label="Total Suppliers" 
          value={totalSuppliers} 
          accent="#3B82F6"
          trend="+12% from last month"
        />
        <KPICard 
          icon="✅" 
          label="Active Suppliers" 
          value={activeSuppliers} 
          accent="#10B981"
          trend="Currently operational"
        />
        <KPICard 
          icon="⏳" 
          label="Pending Registrations" 
          value={pendingSuppliers} 
          accent="#F59E0B"
          trend="Awaiting approval"
        />
        <KPICard 
          icon="🏷️" 
          label="Material Categories" 
          value={totalCategories} 
          accent="#8B5CF6"
          trend="Product categories"
        />
      </section>

      {/* Navigation Grid */}
      <section style={navSectionStyle}>
        <NavigationCard 
          title="Manage Suppliers" 
          description="View, approve, and edit supplier profiles"
          icon="🏢"
          to="/admin/suppliers/manage"
        />
        <NavigationCard 
          title="Material Categories" 
          description="Add and edit product categories"
          icon="🏷️"
          to="/admin/suppliers/categories"
        />
        <NavigationCard 
          title="Supplier Orders" 
          description="Browse all materials with prices"
          icon="📦"
          to="/admin/suppliers/materials"
        />
        <NavigationCard 
          title="Price Comparison" 
          description="Compare prices across suppliers"
          icon="⚖️"
          to="/admin/suppliers/compare"
        />
        <NavigationCard 
          title="Purchase Orders" 
          description="Create and manage orders"
          icon="🛒"
          to="/admin/purchase-orders"
        />
        <NavigationCard 
          title="Delivery Tracking" 
          description="Track deliveries and receiving"
          icon="🚚"
          to="/admin/deliveries"
        />
      </section>

      {/* Recent Activity */}
      <section style={activitySectionStyle}>
        <div style={activityCardStyle}>
          <div style={activityHeaderStyle}>
            <h2 style={activityTitleStyle}>Recent Activity</h2>
            <div style={activityRefreshStyle}>
              <span style={activityRefreshDotStyle}></span>
              Live updates
            </div>
          </div>
          
          {activity.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={emptyIconStyle}>📋</div>
              <h3 style={emptyTitleStyle}>No Recent Activity</h3>
              <p style={emptyDescStyle}>Activity will appear here as suppliers and orders are managed</p>
            </div>
          ) : (
            <div style={activityListStyle}>
              {activity.map((item, index) => (
                <ActivityItem key={index} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>
      </div>
    </div>
  );
}

// KPI Card Component
function KPICard({ icon, label, value, accent, trend }) {
  return (
    <div style={{...kpiCardStyle, borderLeft: `4px solid ${accent}`}}>
      <div style={kpiHeaderStyle}>
        <div style={{...kpiIconStyle, background: `${accent}15`, color: accent}}>
          {icon}
        </div>
        <div style={kpiContentStyle}>
          <div style={kpiLabelStyle}>{label}</div>
          <div style={{...kpiValueStyle, color: accent}}>{value}</div>
        </div>
      </div>
      <div style={kpiTrendStyle}>{trend}</div>
    </div>
  );
}

// Navigation Card Component
function NavigationCard({ title, description, icon, to, badge }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <Link 
      to={to} 
      style={{...navCardStyle, transform: isHovered ? 'translateY(-4px)' : 'none'}}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={navCardHeaderStyle}>
        <div style={navCardIconStyle}>{icon}</div>
        {badge && <div style={badgeStyle}>{badge}</div>}
      </div>
      <div style={navCardContentStyle}>
        <h3 style={navCardTitleStyle}>{title}</h3>
        <p style={navCardDescStyle}>{description}</p>
        <div style={navCardArrowStyle}>Open →</div>
      </div>
    </Link>
  );
}

// Activity Item Component
function ActivityItem({ item }) {
  return (
    <div style={activityItemStyle}>
      <div style={activityItemContentStyle}>
        <h4 style={activityItemTitleStyle}>{item.title}</h4>
        <p style={activityItemDescStyle}>{item.desc}</p>
      </div>
      <div style={activityTimeStyle}>
        {new Date(item.time).toLocaleString()}
      </div>
    </div>
  );
}

// Styles
// containerStyle replaced by sidebar layout wrappers

const heroSectionStyle = {
  background: 'linear-gradient(135deg, #F0FDF4 0%, #E6FFFA 50%, #EDF2F7 100%)',
  borderRadius: '20px',
  padding: '32px',
  marginBottom: '24px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  border: '1px solid rgba(255,255,255,0.2)'
};

const heroContentStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '24px'
};

const heroTextStyle = {
  flex: '1',
  minWidth: '300px'
};

const heroTitleStyle = {
  fontSize: '32px',
  fontWeight: '800',
  margin: '0 0 8px 0',
  background: 'linear-gradient(135deg, #1E7F3B 0%, #16A34A 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent'
};

const heroDescriptionStyle = {
  fontSize: '16px',
  color: '#6B7280',
  margin: 0,
  lineHeight: '1.6'
};

const heroActionsStyle = {
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap'
};

const primaryButtonStyle = {
  background: '#1E7F3B',
  color: 'white',
  padding: '12px 24px',
  borderRadius: '12px',
  textDecoration: 'none',
  fontWeight: '600',
  border: 'none',
  boxShadow: '0 2px 8px rgba(30, 127, 59, 0.3)',
  transition: 'all 0.2s ease'
};

const secondaryButtonStyle = {
  background: 'white',
  color: '#1E7F3B',
  padding: '12px 24px',
  borderRadius: '12px',
  textDecoration: 'none',
  fontWeight: '600',
  border: '2px solid #1E7F3B',
  transition: 'all 0.2s ease'
};

const accentButtonStyle = {
  background: '#3B82F6',
  color: 'white',
  padding: '12px 24px',
  borderRadius: '12px',
  textDecoration: 'none',
  fontWeight: '600',
  border: 'none',
  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
  transition: 'all 0.2s ease'
};

const kpiSectionStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '20px',
  marginBottom: '32px'
};

const kpiCardStyle = {
  background: 'white',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
  border: '1px solid #F3F4F6',
  transition: 'transform 0.2s ease'
};

const kpiHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  marginBottom: '12px'
};

const kpiIconStyle = {
  width: '48px',
  height: '48px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '20px'
};

const kpiContentStyle = {
  flex: 1
};

const kpiLabelStyle = {
  color: '#6B7280',
  fontSize: '14px',
  fontWeight: '500',
  marginBottom: '4px'
};

const kpiValueStyle = {
  fontSize: '32px',
  fontWeight: '800',
  lineHeight: '1'
};

const kpiTrendStyle = {
  color: '#6B7280',
  fontSize: '12px'
};

const navSectionStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '20px',
  marginBottom: '32px'
};

const navCardStyle = {
  background: 'white',
  borderRadius: '16px',
  padding: '24px',
  textDecoration: 'none',
  color: 'inherit',
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  border: '1px solid #F3F4F6',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden'
};

const navCardHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px'
};

const navCardIconStyle = {
  width: '48px',
  height: '48px',
  borderRadius: '12px',
  background: '#F0FDF4',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '20px'
};

const badgeStyle = {
  background: '#EF4444',
  color: 'white',
  borderRadius: '20px',
  padding: '4px 12px',
  fontSize: '12px',
  fontWeight: '600'
};

const navCardContentStyle = {
  flex: 1
};

const navCardTitleStyle = {
  fontSize: '18px',
  fontWeight: '700',
  margin: '0 0 8px 0',
  color: '#111827'
};

const navCardDescStyle = {
  color: '#6B7280',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 16px 0'
};

const navCardArrowStyle = {
  color: '#1E7F3B',
  fontWeight: '600',
  fontSize: '14px'
};

const activitySectionStyle = {
  marginTop: '32px'
};

const activityCardStyle = {
  background: 'white',
  borderRadius: '16px',
  overflow: 'hidden',
  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
  border: '1px solid #F3F4F6'
};

const activityHeaderStyle = {
  padding: '24px',
  borderBottom: '1px solid #F3F4F6',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const activityTitleStyle = {
  fontSize: '20px',
  fontWeight: '700',
  margin: 0,
  color: '#111827'
};

const activityRefreshStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  color: '#10B981',
  fontSize: '12px',
  fontWeight: '500'
};

const activityRefreshDotStyle = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: '#10B981',
  animation: 'pulse 2s infinite'
};

const activityListStyle = {
  maxHeight: '400px',
  overflowY: 'auto'
};

const activityItemStyle = {
  padding: '16px 24px',
  borderBottom: '1px solid #F9FAFB',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '16px'
};

const activityItemContentStyle = {
  flex: 1
};

const activityItemTitleStyle = {
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 4px 0',
  color: '#111827'
};

const activityItemDescStyle = {
  fontSize: '12px',
  color: '#6B7280',
  margin: 0,
  lineHeight: '1.4'
};

const activityTimeStyle = {
  fontSize: '11px',
  color: '#9CA3AF',
  whiteSpace: 'nowrap'
};

const emptyStateStyle = {
  padding: '48px 24px',
  textAlign: 'center'
};

const emptyIconStyle = {
  fontSize: '48px',
  marginBottom: '16px'
};

const emptyTitleStyle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#111827',
  margin: '0 0 8px 0'
};

const emptyDescStyle = {
  color: '#6B7280',
  fontSize: '14px',
  margin: 0
};

const loadingCardStyle = {
  background: 'white',
  borderRadius: '16px',
  padding: '48px',
  textAlign: 'center',
  boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
};

const loadingSpinnerStyle = {
  width: '40px',
  height: '40px',
  border: '4px solid #F3F4F6',
  borderTop: '4px solid #1E7F3B',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  margin: '0 auto 24px auto'
};

const loadingTextStyle = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#111827',
  margin: '0 0 8px 0'
};

const loadingSubtextStyle = {
  color: '#6B7280',
  margin: 0
};

const errorCardStyle = {
  background: '#FEF2F2',
  border: '1px solid #FECACA',
  borderRadius: '16px',
  padding: '48px',
  textAlign: 'center'
};

const errorIconStyle = {
  fontSize: '48px',
  color: '#EF4444',
  marginBottom: '16px'
};

const errorTitleStyle = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#DC2626',
  margin: '0 0 8px 0'
};

const errorMessageStyle = {
  color: '#7F1D1D',
  margin: '0 0 24px 0'
};

const retryButtonStyle = {
  background: '#EF4444',
  color: 'white',
  border: 'none',
  padding: '12px 24px',
  borderRadius: '8px',
  fontWeight: '600',
  cursor: 'pointer'
};