// BACKEND/Models/CategoryStock.js
const mongoose = require("mongoose");

const categoryStockSchema = new mongoose.Schema(
  {
    categoryId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    categoryName: {
      type: String,
      required: true,
      trim: true,
    },
    measurementType: {
      type: String,
      required: true,
      trim: true,
    },
    availableQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Keep lastUpdated fresh on quantity change
categoryStockSchema.pre("save", function (next) {
  this.lastUpdated = Date.now();
  next();
});

// Indexes for performance
// Note: unique: true on categoryId already creates an index
categoryStockSchema.index({ categoryName: 1 });

module.exports =
  mongoose.models.CategoryStock || mongoose.model("CategoryStock", categoryStockSchema);

