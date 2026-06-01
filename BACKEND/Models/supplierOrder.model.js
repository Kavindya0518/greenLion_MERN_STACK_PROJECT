// BACKEND/Models/supplierOrder.model.js
const mongoose = require("mongoose");

const supplierOrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, unique: true, required: true, trim: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
    category: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    canDeliver: { type: Boolean, default: false },
    note: { type: String, default: "", trim: true, maxlength: 500 },
    submissionDate: { type: Date, default: Date.now },
    expectedDeliveryDate: { type: Date },
    deliveryWithinDays: { type: Number, required: true, min: 1 },
    offers: { type: String, default: "", trim: true, maxlength: 500 },
    originalTotal: { type: Number, required: true, min: 0 },
    discountedTotal: { type: Number, required: true, min: 0 },
    status: { 
      type: String, 
      enum: ["new", "confirmed", "rejected", "supplier_accepted", "delivered", "completed"], 
      default: "new" 
    },
    rejectionReason: { type: String, default: "", trim: true, maxlength: 500 },
    supplierAcceptedAt: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

// ✅ Guard against re-compiling the model during dev/hot-reload
module.exports =
  mongoose.models.SupplierOrder || mongoose.model("SupplierOrder", supplierOrderSchema);
