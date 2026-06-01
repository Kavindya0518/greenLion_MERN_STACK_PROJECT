const express = require("express");
const { auth, allowRoles } = require("../Middlewares/auth");
const ctrl = require("../Controllers/productionUsage.controller");

const router = express.Router();

// All routes require authentication and admin/inventory manager role
router.use(auth, allowRoles("admin", "inventory_manager"));

// Main CRUD operations
router.get("/", ctrl.list);
router.post("/", ctrl.create);
router.get("/:id", ctrl.getById);
router.delete("/:id", ctrl.delete);

// Helper endpoints for form data
router.get("/categories/products", ctrl.getProductCategories);
router.get("/products/:category", ctrl.getProductsByCategory);
router.get("/raw-materials/list", ctrl.getRawMaterials);
router.get("/stock/:categoryId", ctrl.getStockForCategory);

// Statistics
router.get("/stats/summary", ctrl.getStats);

module.exports = router;
