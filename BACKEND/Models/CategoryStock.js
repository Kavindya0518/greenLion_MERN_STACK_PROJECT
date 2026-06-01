// BACKEND/Models/CategoryStock.js
const mongoose = require("mongoose");

const categoryStockSchema = new mongoose.Schema(
  {
    categoryId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    categoryName: {
      type: String,
      required: true,
      trim: true,
      index: true,
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
categoryStockSchema.index({ categoryId: 1 }, { unique: true });
categoryStockSchema.index({ categoryName: 1 });

module.exports =
  mongoose.models.CategoryStock || mongoose.model("CategoryStock", categoryStockSchema);

