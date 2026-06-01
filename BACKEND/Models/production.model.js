const mongoose = require("mongoose");

const productionSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  rawMaterialsUsed: [{
    materialName: { type: String, required: true },
    quantityUsed: { type: Number, required: true, min: 0 }
  }],
  productionDate: { type: Date, default: Date.now },
  notes: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("Production", productionSchema);
