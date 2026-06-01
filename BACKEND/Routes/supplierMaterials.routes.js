// BACKEND/Routes/supplierMaterials.routes.js
const express = require("express");
const { auth, allowRoles } = require("../Middlewares/auth");
const ctrl = require("../Controllers/supplierMaterial.controller");

const r = express.Router();

r.get("/", auth, allowRoles("admin", "supplier"), ctrl.list);
r.post("/", auth, allowRoles("supplier", "admin"), ctrl.create);
r.put("/:id", auth, allowRoles("supplier", "admin"), ctrl.update);
r.patch("/:id/toggle", auth, allowRoles("supplier", "admin"), ctrl.toggleAvailability);
// Mark/Unmark best material (admin only)
r.patch("/:id/best", auth, allowRoles("admin"), ctrl.toggleBest);

module.exports = r;
