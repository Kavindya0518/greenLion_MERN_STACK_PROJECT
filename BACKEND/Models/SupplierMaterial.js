// BACKEND/Models/SupplierMaterial.js
const mongoose = require("mongoose");

const supplierMaterialSchema = new mongoose.Schema(
  {
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true, index: true },
    supplierName: { type: String, trim: true },

    materialCode: { type: String, required: true, uppercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "MaterialCategory", index: true },

    unit: { type: String, required: true, enum: ["kg", "g", "L", "mL", "pcs", "units", "bag", "bale"] },
    price: { type: Number, required: true, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    finalPrice: { type: Number, min: 0 },
    minimumOrderQty: { type: Number, default: 0, min: 0 },
    leadTimeDays: { type: Number, default: 0, min: 0 },
    available: { type: Boolean, default: true },
    isBest: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

supplierMaterialSchema.index({ supplierId: 1, materialCode: 1 }, { unique: true });

module.exports = mongoose.models.SupplierMaterial || mongoose.model("SupplierMaterial", supplierMaterialSchema);
