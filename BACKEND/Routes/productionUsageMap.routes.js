const express = require("express");
const { auth, allowRoles } = require("../Middlewares/auth");
const ctrl = require("../Controllers/productionUsageMap.controller");

const router = express.Router();

// All routes protected for admin or inventory_manager
router.use(auth, allowRoles("admin", "inventory_manager"));

// Main CRUD for Production Usage Mapping
router.get("/", ctrl.list);
router.get("/:productId", ctrl.getByProductId);
router.post("/", ctrl.createOrUpdate);
router.delete("/:productId", ctrl.remove);

// Helper routes for dropdowns
router.get("/helpers/products", ctrl.getProducts);
router.get("/helpers/raw-materials", ctrl.getRawMaterialCategories);

module.exports = router;

