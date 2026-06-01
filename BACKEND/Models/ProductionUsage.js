const mongoose = require("mongoose");

const productionUsageSchema = new mongoose.Schema(
  {
    // Product Information
    productCategory: { 
      type: String, 
      required: true, 
      trim: true 
    },
    productId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Product", 
      required: true 
    },
    productName: { 
      type: String, 
      required: true, 
      trim: true 
    },
    
    // Raw Material Usage
    rawMaterials: [{
      categoryId: { 
        type: String, 
        required: true, 
        trim: true 
      },
      categoryName: { 
        type: String, 
        required: true, 
        trim: true 
      },
      measurementType: { 
        type: String, 
        required: true, 
        trim: true 
      },
      usedQuantity: { 
        type: Number, 
        required: true, 
        min: 0 
      }
    }],
    
    // Batch Information
    batchId: { 
      type: String, 
      trim: true 
    },
    productionDate: { 
      type: Date, 
      default: Date.now 
    },
    
    // Metadata
    recordedBy: { 
      type: String, 
      required: true, 
      trim: true 
    },
    notes: { 
      type: String, 
      trim: true, 
      maxlength: 500 
    }
  },
  { timestamps: true }
);

// Indexes for better query performance
productionUsageSchema.index({ productId: 1, productionDate: -1 });
productionUsageSchema.index({ "rawMaterials.categoryId": 1 });
productionUsageSchema.index({ productionDate: -1 });

module.exports = mongoose.models.ProductionUsage || mongoose.model("ProductionUsage", productionUsageSchema);
