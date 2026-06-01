const express = require("express");
const { auth, allowRoles } = require("../Middlewares/auth");
const ctrl = require("../Controllers/supplierSelf.controller");

const router = express.Router();

// Supplier-only area
router.use(auth, allowRoles("supplier"));

router.get("/me", ctrl.getProfile);
router.put("/me", ctrl.updateProfile);
router.get("/orders", ctrl.listOrders);
router.post("/orders", ctrl.createOrder);

// NEW:
router.put("/orders/:id", ctrl.updateOrder);
router.delete("/orders/:id", ctrl.deleteOrder);
router.post("/orders/:id/accept", ctrl.acceptOrder);
router.post("/orders/:id/deliver", ctrl.deliverOrder);

// Supplier-facing access to admin Purchase Orders
router.get("/purchase-orders", ctrl.listPurchaseOrders);
router.get("/purchase-orders/:id", ctrl.getPurchaseOrder);
router.post("/purchase-orders/:id/status", ctrl.setPurchaseOrderStatus);

// Supplier manages own materials
router.get("/materials", ctrl.listMyMaterials);
router.post("/materials", ctrl.createMaterial);
router.put("/materials/:id", ctrl.updateMaterial);
router.delete("/materials/:id", ctrl.deleteMaterial);

module.exports = router;
