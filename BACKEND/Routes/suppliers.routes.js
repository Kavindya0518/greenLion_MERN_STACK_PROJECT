// BACKEND/Routes/suppliers.routes.js
const express = require("express");
const { auth, allowRoles } = require("../Middlewares/auth");
const ctrl = require("../Controllers/suppliers.controller");

const r = express.Router();

r.get("/", auth, allowRoles("admin"), ctrl.list);
r.post("/", auth, allowRoles("admin"), ctrl.create);
r.patch("/:id", auth, allowRoles("admin"), ctrl.update);
r.delete("/:id", auth, allowRoles("admin"), ctrl.remove);

r.get("/orders", auth, allowRoles("admin"), ctrl.listAllOrders);
r.patch("/orders/:id/status", auth, allowRoles("admin"), ctrl.updateOrderStatus);

module.exports = r;
