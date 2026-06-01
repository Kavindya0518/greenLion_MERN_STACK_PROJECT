// BACKEND/Routes/rawMaterials.routes.js
const express = require("express");
const rawMaterialController = require("../Controllers/rawMaterial.controller");
const RawMaterial = require("../Models/RawMaterial");
const StockTransaction = require("../Models/StockTransaction");

const router = express.Router();

/**
 * Simple middleware to validate ObjectId format in :id params.
 * This prevents malformed IDs from going to the database.
 */
function validateObjectId(req, res, next) {
  const { id } = req.params;
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    return res.status(400).json({ success: false, message: "Invalid ID format" });
  }
  next();
}

/**
 * Optional middleware to validate that quantity > 0 for stock changes.
 */
function validateQuantity(req, res, next) {
  const { quantity } = req.body;
  if (quantity === undefined || Number(quantity) <= 0) {
    return res.status(400).json({ success: false, message: "Quantity must be greater than 0" });
  }
  next();
}

// Soft-delete filter helper
const notDeletedFilter = { $or: [{ deleted: { $ne: true } }, { deleted: { $exists: false } }] };

// Get all raw materials
router.get("/", rawMaterialController.getAllRawMaterials);

// Get raw materials grouped by category
router.get("/by-category", rawMaterialController.getRawMaterialsByCategory);

// Get low stock materials
router.get("/low-stock", rawMaterialController.getLowStockMaterials);

// Add new raw material
router.post("/", rawMaterialController.addRawMaterial);

// Update raw material
router.put("/:id", validateObjectId, rawMaterialController.updateRawMaterial);

// Delete raw material
router.delete("/:id", validateObjectId, rawMaterialController.deleteRawMaterial);

// Increase stock (supplier delivery)
router.post(
  "/:id/increase-stock",
  validateObjectId,
  validateQuantity,
  rawMaterialController.increaseStock
);

// Decrease stock (production usage)
router.post(
  "/:id/decrease-stock",
  validateObjectId,
  validateQuantity,
  rawMaterialController.decreaseStock
);

// ====== ItemCode-based API (consistent with other file naming) ======
// GET /api/rawmaterials - already covered at mount time

// GET /api/rawmaterials/:itemCode - Get single raw material by code
router.get("/:itemCode", async (req, res, next) => {
  // If param matches ObjectId, let previous handlers run (avoid conflict with :id routes)
  if (/^[0-9a-fA-F]{24}$/.test(req.params.itemCode)) return next();
  try {
    const code = String(req.params.itemCode || "").toUpperCase();
    const item = await RawMaterial.findOne({ itemCode: code, ...notDeletedFilter });
    if (!item) return res.status(404).json({ success: false, message: "Raw material not found" });
    res.status(200).json({ success: true, item });
  } catch (err) {
    console.error("Get raw material (by code) error:", err);
    res.status(500).json({ success: false, message: "Failed to get raw material", error: err.message });
  }
});

// POST /api/rawmaterials - Create new raw material (by code in body)
router.post("/", async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.itemCode || !body.name || !body.unit) {
      return res.status(400).json({ success: false, message: "itemCode, name and unit are required" });
    }
    body.itemCode = String(body.itemCode).toUpperCase().trim();

    const existing = await RawMaterial.findOne({ itemCode: body.itemCode });
    if (existing && existing.deleted !== true) {
      return res.status(409).json({ success: false, message: "Item code already exists" });
    }

    const material = await RawMaterial.create(body);
    res.status(201).json({ success: true, message: "Raw material created", item: material });
  } catch (err) {
    console.error("Create raw material error:", err);
    res.status(500).json({ success: false, message: "Failed to create raw material", error: err.message });
  }
});

// PUT /api/rawmaterials/:itemCode - Update raw material by code
router.put("/:itemCode", async (req, res, next) => {
  if (/^[0-9a-fA-F]{24}$/.test(req.params.itemCode)) return next();
  try {
    const code = String(req.params.itemCode || "").toUpperCase();
    const updates = { ...req.body, lastUpdated: new Date() };
    if (updates.itemCode) delete updates.itemCode; // immutable

    const item = await RawMaterial.findOneAndUpdate(
      { itemCode: code, ...notDeletedFilter },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ success: false, message: "Raw material not found" });
    res.status(200).json({ success: true, message: "Raw material updated", item });
  } catch (err) {
    console.error("Update raw material (by code) error:", err);
    res.status(500).json({ success: false, message: "Failed to update raw material", error: err.message });
  }
});

// DELETE /api/rawmaterials/:itemCode - Soft delete by code
router.delete("/:itemCode", async (req, res, next) => {
  if (/^[0-9a-fA-F]{24}$/.test(req.params.itemCode)) return next();
  try {
    const code = String(req.params.itemCode || "").toUpperCase();
    const result = await RawMaterial.updateOne(
      { itemCode: code },
      { $set: { deleted: true, lastUpdated: new Date() } },
      { strict: false }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: "Raw material not found" });
    }
    res.status(200).json({ success: true, message: "Raw material deleted (soft)" });
  } catch (err) {
    console.error("Delete raw material (by code) error:", err);
    res.status(500).json({ success: false, message: "Failed to delete raw material", error: err.message });
  }
});

// PUT /api/rawmaterials/:itemCode/stock - Update stock with transaction logging
router.put("/:itemCode/stock", async (req, res, next) => {
  if (/^[0-9a-fA-F]{24}$/.test(req.params.itemCode)) return next();
  try {
    const code = String(req.params.itemCode || "").toUpperCase();
    let { operation, quantity, reason, referenceId, performedBy, notes } = req.body || {};

    if (!operation || !["in", "out"].includes(operation)) {
      return res.status(400).json({ success: false, message: "operation must be 'in' or 'out'" });
    }
    quantity = Number(quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({ success: false, message: "quantity must be a positive number" });
    }
    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ success: false, message: "reason is required for audit" });
    }

    const item = await RawMaterial.findOne({ itemCode: code, ...notDeletedFilter });
    if (!item) return res.status(404).json({ success: false, message: "Raw material not found" });

    const prev = Number(item.quantity || 0);
    if (operation === "out" && prev < quantity) {
      return res.status(400).json({ success: false, message: "Insufficient stock" });
    }

    const next = operation === "in" ? prev + quantity : prev - quantity;

    const trx = await StockTransaction.create({
      itemCode: item.itemCode,
      itemType: "raw_material",
      transactionType: operation,
      quantity,
      previousStock: prev,
      newStock: next,
      reason: String(reason),
      referenceId,
      performedBy: performedBy || req.user?.email || String(req.user?.id || "admin"),
      notes,
      timestamp: new Date(),
    });

    item.quantity = next;
    item.lastUpdated = new Date();
    await item.save();

    res.status(200).json({ success: true, message: "Stock updated", item, transaction: trx });
  } catch (err) {
    console.error("Update stock (by code) error:", err);
    res.status(500).json({ success: false, message: "Failed to update stock", error: err.message });
  }
});

module.exports = router;
