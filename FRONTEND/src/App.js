import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import Home from "./pages/Home";
import Products from "./pages/Products";
import Contact from "./pages/Contact";
import About from "./pages/About";
import ProductDetails from "./pages/ProductDetails";
import Feedback from "./pages/Feedback";

import SignupCustomer from "./pages.shared/SignupCustomer";
import LoginCustomer from "./pages.shared/LoginCustomer";
import OrderFormPage from "./pages.shared/OrderFormPage";
import SupplierPortal from "./pages.shared/SupplierPortal";
import AdminDashboard from "./pages.admin/AdminDashboard";


//Employee Management
import EmployeeAdmin from "./pages.admin/EmployeeAdmin";
import Employee from "./pages.admin/Employee";
import AddEmployee from "./pages.admin/AddEmployees";
import Attendance from "./pages.admin/Attendance";
import Salary from "./pages.admin/Salary";
import Leave from "./pages.admin/Leave";
import EmployeeDepartments from "./pages.admin/EmployeeDepartments";
import EmployeePerformance from "./pages.admin/EmployeePerformance";
import EmployeeAnalytics from "./pages.admin/EmployeeAnalytics";

import EmployeeDashboard from "./pages.emp/EmployeeDashboard";
import EmployeeProfile from "./pages.emp/EmployeeProfile";
import EmployeeLeave from "./pages.emp/EmployeeLeave";
import EmployeeLeaveForm from "./pages.emp/EmployeeLeaveForm";
import EmpSalary from "./pages.emp/EmpSalary";
import EmpAttendance from "./pages.emp/EmpAttendance";
import LeaveView from "./pages.admin/LeaveView";
import AddAttendance from "./pages.admin/AddAttendance";
import EditEmployee from "./pages.admin/EditEmployee";
import ViewEmployee from "./pages.admin/ViewEmployee";
import EditAttendance from "./pages.admin/EditAttendance";
import AllSalaries from "./pages.admin/AllSalaries";
import ProductsAdmin from "./pages.admin/ProductsAdmin";
import FeedbackAdmin from "./pages.admin/FeedbackAdmin";
import Reports from "./pages.admin/report";


import InventoryDashboardPage from "./pages/inventory/InventoryDashboard";
import Analytics from "./pages/inventory/Analytics";
import FinishedProducts from "./pages/inventory/FinishedProducts";
import AddFinishedProduct from "./pages/inventory/AddFinishedProduct";
import RawMaterials from "./pages/inventory/RawMaterials";
import AddRawMaterial from "./pages/inventory/AddRawMaterial";
import StockMovements from "./pages/inventory/StockMovements";
import LowStockAlerts from "./pages/inventory/LowStockAlerts";
import ProductionUsage from "./pages/inventory/ProductionUsage";
import ProductionUsageMapping from "./pages/inventory/ProductionUsageMapping";



  // RBAC guard
  import RoleRoute from "./guards/RoleRoute"; 

  import OrdersAdmin from "./pages.admin/OrdersAdmin";
  import PaymentsAdmin from "./pages.admin/PaymentsAdmin";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import OrderConfirmation from "./pages/OrderConfirmation";
// Supplier management (new pages.sup)
import Supplier from "./pages.sup/Supplier";
import SupplierNew from "./pages.sup/SupplierNew";
import SuppliersList from "./pages.sup/SuppliersList";
import MaterialCategories from "./pages.sup/MaterialCategories";
import SupplierMaterials from "./pages.sup/SupplierMaterials";
import PriceComparison from "./pages.sup/PriceComparison";
import PurchaseOrders from "./pages.sup/PurchaseOrders";
import Deliveries from "./pages.sup/Deliveries";
// Customer profile management
import Profile from "./pages/customer/Profile";
import ChangePassword from "./pages/customer/ChangePassword";
import OrderHistory from "./pages/customer/OrderHistory";
import ProfileDebug from "./pages/customer/ProfileDebug";
import ChatWidget from "./components/ChatWidget.js";

export default function App() {
  return (
    <Layout>
      <ChatWidget />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/about" element={<About />} />
        <Route path="/products/:id" element={<ProductDetails />} />

        {/* Auth */}
        <Route path="/signup" element={<SignupCustomer />} />
        <Route path="/login" element={<LoginCustomer />} />


        {/* Cart & Checkout */}
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
        <Route path="/feedback/:productId" element={<Feedback />} />

        {/* Customer Profile Management */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/order-history" element={<OrderHistory />} />
        <Route path="/profile-debug" element={<ProfileDebug />} />

        {/* Admin (protected) */}
        <Route
          path="/admin"
          element={
            <RoleRoute allow={['admin']}>
              <AdminDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/suppliers/new"
          element={
            <RoleRoute allow={['admin']}>
              <SupplierNew />
            </RoleRoute>
          }
        />
        {/* Supplier Management (new) */}
        <Route
          path="/admin/suppliers/dashboard"
          element={
            <RoleRoute allow={['admin']}>
              <Supplier />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/suppliers/manage"
          element={
            <RoleRoute allow={['admin']}>
              <SuppliersList />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/suppliers/categories"
          element={
            <RoleRoute allow={['admin']}>
              <MaterialCategories />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/suppliers/materials"
          element={
            <RoleRoute allow={['admin']}>
              <SupplierMaterials />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/suppliers/compare"
          element={
            <RoleRoute allow={['admin']}>
              <PriceComparison />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/purchase-orders"
          element={
            <RoleRoute allow={['admin']}>
              <PurchaseOrders />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/deliveries"
          element={
            <RoleRoute allow={['admin']}>
              <Deliveries />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/employees"
          element={
            <RoleRoute allow={['admin']}>
              <EmployeeAdmin />
            </RoleRoute>
          }
        />
          <Route path="/employee" element={<Employee />} />
                <Route path="/add-employee" element={<AddEmployee/>} />
                <Route path="/attendance" element={<Attendance/>} />
                <Route path="/salary" element={<Salary/>} />
                <Route path="/leave" element={<Leave/>} />
                <Route path="/leave-requests/:id" element={<LeaveView />} />
                <Route path="/add-attendance" element={<AddAttendance />} />
                <Route path="/edit-employee/:employee_id" element={<EditEmployee />} />
                <Route path="/view-employee/:employee_id" element={<ViewEmployee />} />
                <Route path="/edit-attendance/:attendance_id" element={<EditAttendance />} />
                <Route path="/allSalaries" element={<AllSalaries />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/employee-departments" element={<EmployeeDepartments />} />
                <Route path="/employee-performance" element={<EmployeePerformance />} />
                <Route path="/employee-analytics" element={<EmployeeAnalytics />} />
        

                <Route path="/empDashboard" element={<EmployeeDashboard />} />
                <Route path="/empProfile" element={<EmployeeProfile />} />
                <Route path="/empLeave" element={<EmployeeLeave />} />
                <Route path="/empLeaveForm" element={<EmployeeLeaveForm />} />
                <Route path="/empSalaries" element={<EmpSalary />} />
                <Route path="/empAttendance" element={<EmpAttendance />} />
        <Route
          path="/admin/suppliers"
          element={
            <RoleRoute allow={['admin']}>
              <Supplier />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <RoleRoute allow={['admin']}>
              <ProductsAdmin />
            </RoleRoute>
          }
        />
       
       
        
        <Route
          path="/admin/orders"
          element={
            <RoleRoute allow={['admin']}>
              <OrdersAdmin />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/payments"
          element={
            <RoleRoute allow={['admin']}>
              <PaymentsAdmin />
            </RoleRoute>
          }
        />
        
        <Route
          path="/admin/inventory"
          element={
            <RoleRoute allow={['admin']}>
              <InventoryDashboardPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/inventory/dashboard"
          element={
            <RoleRoute allow={['admin']}>
              <InventoryDashboardPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/inventory/raw-materials"
          element={
            <RoleRoute allow={['admin']}>
              <RawMaterials />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/inventory/raw-materials/new"
          element={
            <RoleRoute allow={['admin']}>
              <AddRawMaterial />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/inventory/production-usage-mapping"
          element={
            <RoleRoute allow={['admin']}>
              <ProductionUsageMapping />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/inventory/production-usage"
          element={
            <RoleRoute allow={['admin']}>
              <ProductionUsage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/inventory/analytics"
          element={
            <RoleRoute allow={['admin']}>
              <Analytics />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/inventory/finished"
          element={
            <RoleRoute allow={['admin']}>
              <FinishedProducts />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/inventory/movements"
          element={
            <RoleRoute allow={['admin']}>
              <StockMovements />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/inventory/alerts"
          element={
            <RoleRoute allow={['admin']}>
              <LowStockAlerts />
            </RoleRoute>
          }
        />
        
        <Route
          path="/admin/inventory/finished/new"
          element={
            <RoleRoute allow={['admin']}>
              <AddFinishedProduct />
            </RoleRoute>
          }
        />
      
      
        <Route
          path="/admin/feedback"
          element={
            <RoleRoute allow={['admin']}>
              <FeedbackAdmin />
            </RoleRoute>
          }
        />  
      

        {/* Supplier (protected) */}
        <Route
          path="/supplier"
          element={
            <RoleRoute allow={['supplier']}>
              <SupplierPortal />
            </RoleRoute>
          }
        />

        {/* Supplier → Material categories (protected) */}
        
        
{/* Supplier → Order form pages (protected) */}
<Route
  path="/supplier/orders/new"
  element={
    <RoleRoute allow={['supplier']}>
      <OrderFormPage />
    </RoleRoute>
  }
/>
<Route
  path="/supplier/orders/:id/edit"
  element={
    <RoleRoute allow={['supplier']}>
      <OrderFormPage />
    </RoleRoute>
  }
/>
        {/* 404 */}
        <Route path="*" element={<div style={{ padding: 24 }}>404 – Page not found</div>} />
      </Routes>
    </Layout>
  );
}
