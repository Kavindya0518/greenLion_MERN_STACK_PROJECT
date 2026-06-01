// BACKEND/Routes/purchaseOrders.routes.js
const express = require("express");
const { auth, allowRoles } = require("../Middlewares/auth");
const ctrl = require("../Controllers/purchaseOrder.controller");

const r = express.Router();

r.get("/", auth, allowRoles("admin"), ctrl.list);
r.get("/:id", auth, allowRoles("admin"), ctrl.getOne);
r.post("/", auth, allowRoles("admin"), ctrl.create);
r.put("/:id", auth, allowRoles("admin"), ctrl.update);
r.post("/:id/status", auth, allowRoles("admin"), ctrl.setStatus);

module.exports = r;
