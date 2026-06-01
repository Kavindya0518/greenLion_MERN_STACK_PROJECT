// BACKEND/Routes/production.routes.js
const express = require("express");
const mongoose = require("mongoose");
const productionController = require("../Controllers/production.controller");
const RawMaterial = require("../Models/RawMaterial");
const FinishedProduct = require("../Models/FinishedProduct");
const StockTransaction = require("../Models/StockTransaction");

const router = express.Router();

// -------- Existing controller-based endpoints --------
router.post("/", productionController.recordProduction);
router.get("/", productionController.getAllProductions);
router.put("/:id", productionController.updateProduction);
router.delete("/:id", productionController.deleteProduction);
router.get("/summary", productionController.getProductionSummary);

// -------- New: Complete production with stock movements --------
// POST /production/complete (mount path may be /api/production depending on server.js)
router.post("/complete", async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const {
      finishedProductCode,
      quantityProduced,
      materialsUsed,
      completedBy,
      notes,
    } = req.body || {};

    // Validate input
    const toCode = (v) => String(v || "").toUpperCase().trim();
    if (!finishedProductCode) {
      return res.status(400).json({ success: false, message: "finishedProductCode is required" });
    }
    const qty = Number(quantityProduced);
    if (!Number.isFinite(qty) || qty < 1) {
      return res.status(400).json({ success: false, message: "quantityProduced must be a number >= 1" });
    }
    if (!Array.isArray(materialsUsed) || materialsUsed.length === 0) {
      return res.status(400).json({ success: false, message: "materialsUsed must be a non-empty array" });
    }

    const fpCode = toCode(finishedProductCode);

    // Start transaction
    session.startTransaction();

    // 1) Validate finished product
    const finished = await FinishedProduct.findOne({ itemCode: fpCode }).session(session);
    if (!finished) {
      return res.status(404).json({ success: false, message: `Finished product not found: ${fpCode}` });
    }

    // 2) Consume raw materials
    const consumedMaterials = [];
    const transactions = [];

    for (const m of materialsUsed) {
      const mCode = toCode(m?.materialCode);
      const used = Number(m?.quantityUsed);
      if (!mCode || !Number.isFinite(used) || used <= 0) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: "Each material must have materialCode and positive quantityUsed" });
      }

      const rm = await RawMaterial.findOne({ itemCode: mCode }).session(session);
      if (!rm) {
        await session.abortTransaction();
        return res.status(404).json({ success: false, message: `Raw material not found: ${mCode}` });
      }

      const prev = Number(rm.quantity || 0);
      if (prev < used) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: `Insufficient stock for ${mCode}. Have ${prev}, need ${used}` });
      }

      const next = prev - used;
      rm.quantity = next;
      rm.lastUpdated = new Date();
      await rm.save({ session });

      const trxOutArr = await StockTransaction.create([
        {
          itemCode: rm.itemCode,
          itemType: "raw_material",
          transactionType: "out",
          quantity: used,
          previousStock: prev,
          newStock: next,
          reason: "manufacturing",
          referenceId: undefined,
          performedBy: completedBy,
          notes,
          timestamp: new Date(),
        },
      ], { session });

      transactions.push(trxOutArr[0]);
      consumedMaterials.push({ itemCode: rm.itemCode, previousStock: prev, used, newStock: next });
    }

    // 3) Increase finished product stock
    const prevFP = Number(finished.quantity || 0);
    const nextFP = prevFP + qty;
    finished.quantity = nextFP;
    finished.lastUpdated = new Date();
    await finished.save({ session });

    const trxInArr = await StockTransaction.create([
      {
        itemCode: finished.itemCode,
        itemType: "finished_product",
        transactionType: "in",
        quantity: qty,
        previousStock: prevFP,
        newStock: nextFP,
        reason: "production",
        referenceId: undefined,
        performedBy: completedBy,
        notes,
        timestamp: new Date(),
      },
    ], { session });

    transactions.push(trxInArr[0]);

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Production completed successfully",
      finishedProduct: finished,
      consumedMaterials,
      transactions,
    });
  } catch (err) {
    console.error("Production complete error:", err);
    try { await session.abortTransaction(); } catch {}
    session.endSession();
    return res.status(500).json({ success: false, message: "Failed to complete production", error: err.message });
  }
});

module.exports = router;
