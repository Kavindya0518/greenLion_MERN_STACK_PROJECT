// BACKEND/Models/Delivery.js
const mongoose = require("mongoose");

const deliveryItemSchema = new mongoose.Schema(
  {
    materialCode: { type: String, required: true, uppercase: true, trim: true },
    qtyDelivered: { type: Number, required: true, min: 0 },
    batchNo: { type: String, trim: true },
  },
  { _id: false }
);

const deliverySchema = new mongoose.Schema(
  {
    poId: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseOrder", required: true, index: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true, index: true },
    supplierName: { type: String, trim: true },

    items: { type: [deliveryItemSchema], default: [] },
    status: { type: String, enum: ["received", "partial", "rejected", "pending"], default: "pending", index: true },
    deliveredAt: { type: Date },
    receivedBy: { type: String, trim: true },
    files: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Delivery || mongoose.model("Delivery", deliverySchema);
