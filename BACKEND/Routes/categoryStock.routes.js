// BACKEND/Routes/categoryStock.routes.js
const express = require("express");
const { auth, allowRoles } = require("../Middlewares/auth");
const ctrl = require("../Controllers/categoryStock.controller");

const router = express.Router();

// Admin-only routes
router.use(auth, allowRoles("admin"));

router.get("/", ctrl.list);
router.post("/initialize", ctrl.initialize);
router.patch("/:categoryId/adjust", ctrl.adjustStock);

module.exports = router;

