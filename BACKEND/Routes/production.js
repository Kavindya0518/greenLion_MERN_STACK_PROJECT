// BACKEND/Routes/production.js
// Provides POST /api/production/complete to handle a production completion flow
// using a MongoDB transaction for atomic updates and StockTransaction logging.

const express = require("express");
const mongoose = require("mongoose");
const RawMaterial = require("../Models/RawMaterial");
const FinishedProduct = require("../Models/FinishedProduct");
const StockTransaction = require("../Models/StockTransaction");

const router = express.Router();

// Helper: normalize and basic validation
function toCode(v) {
  return String(v || "").toUpperCase().trim();
}

// POST /api/production/complete
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
    const consumed = []; // { itemCode, previousStock, used, newStock }
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

      // Update stock
      rm.quantity = next;
      rm.lastUpdated = new Date();
      await rm.save({ session });

      // Log transaction
      const trxOut = await StockTransaction.create([
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

      transactions.push(trxOut[0]);
      consumed.push({ itemCode: rm.itemCode, previousStock: prev, used, newStock: next });
    }

    // 3) Increase finished product stock
    const prevFP = Number(finished.quantity || 0);
    const nextFP = prevFP + qty;
    finished.quantity = nextFP;
    finished.lastUpdated = new Date();
    await finished.save({ session });

    const trxIn = await StockTransaction.create([
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

    transactions.push(trxIn[0]);

    // Commit
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Production completed successfully",
      finishedProduct: finished,
      consumedMaterials: consumed,
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
