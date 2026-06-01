// BACKEND/Models/RawMaterial.js (CommonJS)
const mongoose = require("mongoose");

const RAW_UNITS = ["kg", "L", "pcs", "units"];

const rawMaterialSchema = new mongoose.Schema(
  {
    itemCode: {
      type: String,
      required: [true, "Item code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      index: true,
    },
    description: { type: String, trim: true },
    unit: { type: String, enum: RAW_UNITS, required: true },
    unitPrice: { type: Number, required: true, min: 0 }, // purchase price
    uol: { type: Number, default: 0, min: 0 }, // minimum level
    reOrderLevel: { type: Number, default: 0, min: 0 },
    quantity: { type: Number, default: 0, min: 0 }, // current stock
    supplier: { type: String, trim: true },
    category: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "MaterialCategory", 
      index: true 
    },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Keep lastUpdated fresh on stock or price change
rawMaterialSchema.pre("save", function (next) {
  this.lastUpdated = Date.now();
  next();
});

// Helpful indexes
rawMaterialSchema.index({ itemCode: 1 }, { unique: true });
rawMaterialSchema.index({ name: 1 });
rawMaterialSchema.index({ quantity: 1 });
rawMaterialSchema.index({ reOrderLevel: 1 });

module.exports =
  mongoose.models.RawMaterial || mongoose.model("RawMaterial", rawMaterialSchema);
