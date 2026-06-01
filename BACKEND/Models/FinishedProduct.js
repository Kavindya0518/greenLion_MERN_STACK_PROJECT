const mongoose = require("mongoose");

const finishedProductSchema = new mongoose.Schema(
  {
    itemCode: { type: String, required: true, trim: true, unique: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true, index: true },
    description: { type: String, trim: true },
    unit: { type: String, default: "pcs" },
    quantity: { type: Number, default: 0, min: 0 },
    uol: { type: Number, default: 0, min: 0 }, // minimum level
    reOrderLevel: { type: Number, default: 0, min: 0 },
    sellingPrice: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

finishedProductSchema.pre("save", function(next) {
  if (this.itemCode) this.itemCode = String(this.itemCode).trim().toUpperCase();
  next();
});

module.exports = mongoose.model("FinishedProduct", finishedProductSchema);
