const mongoose = require("mongoose");

const productionUsageMapSchema = new mongoose.Schema(
  {
    productId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Product", 
      required: true,
      index: true 
    },
    productName: { 
      type: String, 
      required: true, 
      trim: true 
    },
    rawMaterials: [
      {
        rawCategoryId: { 
          type: String, 
          required: true, 
          trim: true 
        },
        rawMaterialName: { 
          type: String, 
          required: true, 
          trim: true 
        },
        quantityPerUnit: { 
          type: Number, 
          required: true, 
          min: 0 
        },
        measurementType: { 
          type: String, 
          required: true, 
          trim: true 
        },
      },
    ],
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    },
    updatedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    },
  },
  { timestamps: true }
);

// Ensure only one mapping per product
productionUsageMapSchema.index({ productId: 1 }, { unique: true });

module.exports =
  mongoose.models.ProductionUsageMap || 
  mongoose.model("ProductionUsageMap", productionUsageMapSchema);

