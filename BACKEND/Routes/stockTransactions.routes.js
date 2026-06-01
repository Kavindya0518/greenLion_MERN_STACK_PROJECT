const express = require("express");
const router = express.Router();
const StockTransaction = require("../Models/StockTransaction");

// GET /api/stock-transactions?limit=10&itemType=raw_material|finished_product&transactionType=in|out
router.get("/", async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));
    const { itemType, transactionType, dateFrom, dateTo } = req.query || {};
    const filter = {};
    if (itemType) filter.itemType = itemType;
    if (transactionType) filter.transactionType = transactionType;
    if (dateFrom || dateTo) {
      const range = {};
      if (dateFrom) range.$gte = new Date(dateFrom);
      if (dateTo) range.$lte = new Date(dateTo);
      // Use timestamp if present, else fallback to createdAt
      filter.$or = [
        { timestamp: range },
        { createdAt: range },
      ];
    }
    const items = await StockTransaction.find(filter)
      .sort({ timestamp: -1, createdAt: -1 })
      .limit(limit)
      .lean();
    res.json({ success: true, items });
  } catch (e) {
    res.status(500).json({ success: false, message: e?.message || "Failed to load stock transactions" });
  }
});

module.exports = router;
