// BACKEND/server.js (CommonJS)
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const { connectDB } = require("./config/db.js");

const authRouter = require("./Routes/auth.routes.js");
const productionRouter = require("./Routes/production.routes.js");
const productsRouter = require("./Routes/products.routes.js");
const feedbackRouter = require("./Routes/feedback.routes.js");
const suppliersRouter = require("./Routes/suppliers.routes.js");
const supplierSelfRouter = require("./Routes/supplierSelf.routes.js"); 
const materialCategoryRouter = require("./Routes/materialCategory.routes.js");
const categoryStockRouter = require("./Routes/categoryStock.routes.js");
const productionUsageRouter = require("./Routes/productionUsage.routes.js");
const productionUsageMapRouter = require("./Routes/productionUsageMap.routes.js");
const employeeRoutes = require("./Routes/employee");
const attendanceRoutes = require('./Routes/attendance');
const leaveRoutes = require("./Routes/leaveRoutes");
const salaryRoutes = require("./Routes/salaryRoutes");
const departmentRoutes = require("./Routes/departments");
const performanceRoutes = require("./Routes/performance");
const analyticsRoutes = require("./Routes/analytics");
const path = require("path");
const cartRouter = require("./Routes/cart.routes");
const ordersRouter = require("./Routes/orders.routes");
const paymentsRouter = require("./Routes/payments.routes");
const rawMaterialsApiRouter = require("./Routes/rawMaterials.routes");
const finishedProductsApiRouter = require("./Routes/finishedProducts.routes");
const stockTransactionsRouter = require("./Routes/stockTransactions.routes");
const supplierMaterialsRouter = require("./Routes/supplierMaterials.routes.js");
const purchaseOrdersRouter = require("./Routes/purchaseOrders.routes.js");
const deliveriesRouter = require("./Routes/deliveries.routes.js");

const productCategoryRouter = require("./Routes/productCategory.routes.js");
const chatRouter = require("./Routes/chat.routes.js");
const profileRouter = require("./Routes/profile.routes.js");


dotenv.config();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));
app.use("/auth", authRouter);
app.use("/raw-materials", rawMaterialsApiRouter);
app.use("/finished-products", finishedProductsApiRouter);
app.use("/production", productionRouter);
app.use("/products", productsRouter);
app.use("/feedback", feedbackRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/suppliers", suppliersRouter);
app.use("/api/suppliers", suppliersRouter);
app.use("/supplier-self", supplierSelfRouter);
app.use("/material-categories", materialCategoryRouter);
// Alias to support frontend calls to /api/material-categories
app.use("/api/material-categories", materialCategoryRouter);
app.use("/api/category-stock", categoryStockRouter);
app.use("/api/production-usage", productionUsageRouter);
app.use("/api/production-usage-map", productionUsageMapRouter);
app.use("/api/employee", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/salaries", salaryRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/production", productionRouter);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// Order and Payment Management Routes
app.use("/api/cart", cartRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/rawmaterials", rawMaterialsApiRouter);
app.use("/api/finishedproducts", finishedProductsApiRouter);
app.use("/api/stock-transactions", stockTransactionsRouter);
app.use("/api/supplier-materials", supplierMaterialsRouter);
app.use("/api/purchase-orders", purchaseOrdersRouter);
app.use("/api/deliveries", deliveriesRouter);

app.use("/product-categories", productCategoryRouter);
app.use("/api/product-categories", productCategoryRouter);
app.use("/chat", chatRouter);

// Profile Management Routes
app.use("/api/profile", profileRouter);

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Not Found", path: req.originalUrl });
});

const PORT = process.env.PORT || 5000;

// Prefer one env key; MONGO_URI is common
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

(async () => {
  try {
    await connectDB(MONGO_URI);
    app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
  } catch (err) {
    console.error("❌ Failed to start server:", err.message || err);
    process.exit(1);
  }
})();
