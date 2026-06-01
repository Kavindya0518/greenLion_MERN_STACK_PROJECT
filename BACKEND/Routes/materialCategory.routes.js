// BACKEND/Routes/materialCategory.routes.js
const express = require("express");
const { auth, allowRoles } = require("../Middlewares/auth");
const ctrl = require("../Controllers/materialCategory.controller");

const r = express.Router();

r.get("/", auth, allowRoles("admin", "supplier"), ctrl.list);
r.get("/with-subcategories", auth, allowRoles("admin", "supplier"), ctrl.listWithSubcategories);
r.get("/next-category-id", auth, allowRoles("admin"), ctrl.getNextCategoryId);
r.get("/next-subcategory-id", auth, allowRoles("admin"), ctrl.getNextSubcategoryId);
r.get("/next-subcategory-ids", auth, allowRoles("admin"), ctrl.getNextSubcategoryIds);
r.post("/", auth, allowRoles("admin"), ctrl.create);
r.put("/:id", auth, allowRoles("admin"), ctrl.update);
r.delete("/:id", auth, allowRoles("admin"), ctrl.remove);
// Utility to backfill unique codes for existing categories
r.post("/generate-codes", auth, allowRoles("admin"), ctrl.generateCodes);

module.exports = r;
