const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String },
  unitPrice: { type: Number, required: true, min: 0 },
  addDate: { type: Date, default: Date.now },
  file: { type: String },
  discountPercent: { type: Number, default: 0, min: 0, max: 95 },
  // quantity must remain 0 here; inventory will manage stock later
  quantity: { type: Number, default: 0 },
  // Optional link to Inventory item for stock management (finished products)
  inventoryItemCode: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);
