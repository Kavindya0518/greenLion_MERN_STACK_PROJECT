// BACKEND/Routes/deliveries.routes.js
const express = require("express");
const { auth, allowRoles } = require("../Middlewares/auth");
const ctrl = require("../Controllers/delivery.controller");

const r = express.Router();

// Admin/Supplier: list deliveries
r.get("/", auth, allowRoles("admin", "supplier"), ctrl.list);

// Supplier/Admin: create delivery record against a PO
r.post("/", auth, allowRoles("supplier", "admin"), ctrl.create);

// Admin: receive a delivery (updates inventory and PO status)
r.post("/:id/receive", auth, allowRoles("admin"), ctrl.receive);

module.exports = r;
