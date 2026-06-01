// BACKEND/Models/PurchaseOrder.js
const mongoose = require("mongoose");

const poItemSchema = new mongoose.Schema(
  {
    materialCode: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, trim: true },
    unit: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: { type: String, trim: true, index: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true, index: true },
    supplierName: { type: String, trim: true },

    items: { type: [poItemSchema], default: [] },
    total: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["draft", "sent", "confirmed", "delivered", "cancelled"], default: "draft", index: true },
    notes: { type: String, trim: true },
    createdBy: { type: String, trim: true },
  },
  { timestamps: true }
);

purchaseOrderSchema.pre("save", function (next) {
  this.total = (this.items || []).reduce((sum, it) => sum + Number(it.price || 0) * Number(it.qty || 0), 0);
  next();
});

module.exports = mongoose.models.PurchaseOrder || mongoose.model("PurchaseOrder", purchaseOrderSchema);
