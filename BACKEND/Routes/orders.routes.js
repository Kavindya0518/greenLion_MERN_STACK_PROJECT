const express = require("express");
const { auth, allowRoles } = require("../Middlewares/auth");
const ctrl = require("../Controllers/order.controller");

const r = express.Router();

/** ⚠️ Put admin routes BEFORE "/:orderId" to avoid conflicts */

// ----- ADMIN ONLY -----
r.get("/admin/all",                     auth, allowRoles("admin"), ctrl.getAllOrders);
r.get("/admin/stats",                   auth, allowRoles("admin"), ctrl.getOrderStats);
r.put("/admin/:orderId/status",         auth, allowRoles("admin"), ctrl.updateOrderStatus);
r.put("/admin/:orderId/assign-delivery",auth, allowRoles("admin"), ctrl.assignDeliveryCompany);

// ----- CUSTOMER -----
r.post("/",               auth, ctrl.createOrder);
r.get("/",                auth, ctrl.getUserOrders);
r.put("/:orderId/cancel", auth, ctrl.cancelOrder);
r.get("/:orderId",        auth, ctrl.getOrderDetails);

module.exports = r;
