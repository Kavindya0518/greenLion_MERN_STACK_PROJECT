const mongoose = require("mongoose");

const stockTransactionSchema = new mongoose.Schema(
  {
    itemCode: { type: String, required: true, uppercase: true, trim: true },
    itemType: { type: String, enum: ["raw_material", "finished_product"], required: true },
    transactionType: { type: String, enum: ["in", "out", "production", "adjustment"], required: true },
    quantity: { type: Number, required: true, min: 0 },
    previousStock: { type: Number },
    newStock: { type: Number },
    reason: { type: String, trim: true },
    referenceId: { type: String, trim: true },
    performedBy: { type: String, trim: true },
    notes: { type: String, trim: true },
    category: { type: String, trim: true }, // Add category field for better display
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

stockTransactionSchema.index({ itemCode: 1, timestamp: -1 });

module.exports = mongoose.models.StockTransaction || mongoose.model("StockTransaction", stockTransactionSchema);
