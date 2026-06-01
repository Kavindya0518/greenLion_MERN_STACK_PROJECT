const express = require("express");
const router = express.Router();

const FinishedProduct = require("../Models/FinishedProduct");
const StockTransaction = require("../Models/StockTransaction");
const ProductionUsageMap = require("../Models/ProductionUsageMap");
const CategoryStock = require("../Models/CategoryStock");
const Product = require("../Models/product.model");

// GET /api/finishedproducts
router.get("/", async (req, res) => {
  try {
    const q = {};
    if (req.query.category) q.category = String(req.query.category);
    const items = await FinishedProduct.find(q).sort({ updatedAt: -1 });
    res.json({ success: true, items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to load products" });
  }
});

// GET /api/finishedproducts/low-stock
router.get("/low-stock", async (req, res) => {
  try {
    const lowStockItems = await FinishedProduct.find({
      $expr: { $lte: ["$quantity", { $ifNull: ["$reOrderLevel", "$uol"] }] }
    });
    res.json({ success: true, data: lowStockItems });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to load low stock items" });
  }
});

// POST /api/finishedproducts
router.post("/", async (req, res) => {
  try {
    const { itemCode, name, unit = "pcs", quantity = 0, uol = 0, reOrderLevel = 0, sellingPrice = 0, status = "active", description = "" } = req.body || {};
    if (!itemCode || !String(itemCode).trim()) return res.status(400).json({ success: false, message: "itemCode is required" });
    if (!name || !String(name).trim()) return res.status(400).json({ success: false, message: "name is required" });

    const exists = await FinishedProduct.findOne({ itemCode: String(itemCode).trim().toUpperCase() });
    if (exists) return res.status(409).json({ success: false, message: "Item code already exists" });

    const doc = await FinishedProduct.create({
      itemCode: String(itemCode).trim().toUpperCase(),
      name: String(name).trim(),
      unit,
      quantity: Number(quantity) || 0,
      uol: Number(uol) || 0,
      reOrderLevel: Number(reOrderLevel) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      status,
      description,
    });

    res.status(201).json({ success: true, item: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to create product" });
  }
});

// PUT /api/finishedproducts/:id  (update fields)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { description, unit, sellingPrice, reOrderLevel, name, status } = req.body || {};

    const update = {};
    if (description !== undefined) update.description = description;
    if (unit !== undefined) update.unit = unit;
    if (sellingPrice !== undefined) update.sellingPrice = Number(sellingPrice) || 0;
    if (reOrderLevel !== undefined) update.reOrderLevel = Number(reOrderLevel) || 0;
    if (name !== undefined) update.name = name;
    if (status !== undefined) update.status = status;

    const updated = await FinishedProduct.findByIdAndUpdate(id, update, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: "Item not found" });
    res.json({ success: true, item: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to update product" });
  }
});

// PUT /api/finishedproducts/:itemCode/stock  (adjust stock by code)
router.put("/:itemCode/stock", async (req, res) => {
  try {
    const code = String(req.params.itemCode || "").trim().toUpperCase();
    const { operation, quantity, reason } = req.body || {};
    const qty = Number(quantity);
    if (!code) return res.status(400).json({ success: false, message: "itemCode required" });
    if (!operation || !["in", "out"].includes(operation)) return res.status(400).json({ success: false, message: "operation must be 'in' or 'out'" });
    if (!qty || qty <= 0) return res.status(400).json({ success: false, message: "quantity must be > 0" });

    const item = await FinishedProduct.findOne({ itemCode: code });
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    // If this is a stock-in operation, check for production mappings and deduct raw materials
    if (operation === "in") {
      console.log("=== STOCK IN DEBUG (PUT endpoint) ===");
      console.log("Finished Product Name:", item.name);
      console.log("Item Code:", item.itemCode);
      console.log("Quantity to add:", qty);
      
      // Find the corresponding product in Product Management by name (case insensitive)
      const product = await Product.findOne({ name: { $regex: new RegExp(item.name, 'i') } });
      console.log("Product found:", !!product);
      if (product) {
        console.log("Product ID:", product._id);
        console.log("Product Name in DB:", product.name);
      }
      
      if (product) {
        // Check if there's a production mapping for this product
        const mapping = await ProductionUsageMap.findOne({ productId: product._id });
        console.log("Mapping found:", !!mapping);
        if (mapping) {
          console.log("Raw materials in mapping:", mapping.rawMaterials.length);
        }
        
        if (mapping && mapping.rawMaterials && mapping.rawMaterials.length > 0) {
          // Validate raw material availability
          const insufficientMaterials = [];
          
          for (const rm of mapping.rawMaterials) {
            const requiredQty = rm.quantityPerUnit * qty;
            const stock = await CategoryStock.findOne({ categoryId: rm.rawCategoryId });
            
            if (!stock || stock.availableQuantity < requiredQty) {
              insufficientMaterials.push({
                name: rm.rawMaterialName,
                required: requiredQty,
                available: stock?.availableQuantity || 0,
                unit: rm.measurementType,
              });
            }
          }
          
          // If any material is insufficient, block the operation
          if (insufficientMaterials.length > 0) {
            const errorMsg = insufficientMaterials.map(m => 
              `${m.name}: Need ${m.required} ${m.unit}, Available ${m.available} ${m.unit}`
            ).join("; ");
            
            return res.status(400).json({ 
              success: false, 
              message: `Insufficient raw materials to produce ${qty} units of ${item.name}. ${errorMsg}`,
              insufficientMaterials 
            });
          }
          
          // All materials are sufficient, proceed with deduction
          console.log("Proceeding with raw material deduction...");
          for (const rm of mapping.rawMaterials) {
            const requiredQty = rm.quantityPerUnit * qty;
            console.log(`Processing ${rm.rawMaterialName}: ${requiredQty} ${rm.measurementType}`);
            const stock = await CategoryStock.findOne({ categoryId: rm.rawCategoryId });
            
            if (stock) {
              console.log(`Found stock for ${rm.rawMaterialName}: ${stock.availableQuantity} ${stock.measurementType}`);
              const previousStock = stock.availableQuantity;
              stock.availableQuantity -= requiredQty;
              stock.lastUpdated = new Date();
              await stock.save();
              console.log(`Updated stock to: ${stock.availableQuantity} ${stock.measurementType}`);
              
              // Record raw material transaction
              await StockTransaction.create({
                itemCode: rm.rawCategoryId,
                itemType: "raw_material",
                transactionType: "out",
                quantity: requiredQty,
                previousStock: previousStock,
                newStock: stock.availableQuantity,
                reason: `Used for production of ${qty} units of ${item.name}`,
                referenceId: item._id.toString(),
                performedBy: req.user?.username || req.user?.email || 'system',
                notes: `Auto-deducted via Production Usage Mapping`,
                category: rm.rawMaterialName,
                timestamp: new Date(),
              });
              
              console.log(`✅ Deducted ${requiredQty} ${rm.measurementType} of ${rm.rawMaterialName} for ${item.name} production`);
            } else {
              console.log(`❌ Stock not found for category: ${rm.rawCategoryId}`);
            }
          }
        }
      }
    }

    const prev = Number(item.quantity || 0);
    let next = prev;
    if (operation === "in") next = prev + qty;
    if (operation === "out") {
      if (prev - qty < 0) return res.status(400).json({ success: false, message: "Insufficient stock" });
      next = prev - qty;
    }
    item.quantity = next;
    await item.save();

    // Log transaction
    await StockTransaction.create({
      itemCode: item.itemCode,
      itemType: "finished_product",
      transactionType: operation,
      quantity: qty,
      previousStock: prev,
      newStock: next,
      reason: reason || "manual_adjustment",
      timestamp: new Date(),
    });

    res.json({ success: true, itemCode: item.itemCode, previousStock: prev, newStock: next, reason: reason || "" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to adjust stock" });
  }
});

// Fallback endpoints used by the frontend for _id-based adjustments
// POST /api/finishedproducts/:id/increase-stock
router.post("/:id/increase-stock", async (req, res) => {
  try {
    const { id } = req.params;
    const qty = Number(req.body?.quantity || 0);
    if (!qty || qty <= 0) return res.status(400).json({ success: false, message: "quantity must be > 0" });

    const item = await FinishedProduct.findById(id);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    // Find the corresponding product in Product Management by name (case insensitive)
    console.log("=== STOCK IN DEBUG ===");
    console.log("Finished Product Name:", item.name);
    const product = await Product.findOne({ name: { $regex: new RegExp(item.name, 'i') } });
    console.log("Product found:", !!product);
    if (product) {
      console.log("Product ID:", product._id);
      console.log("Product Name in DB:", product.name);
    }
    
    if (product) {
      // Check if there's a production mapping for this product
      const mapping = await ProductionUsageMap.findOne({ productId: product._id });
      console.log("Mapping found:", !!mapping);
      if (mapping) {
        console.log("Raw materials in mapping:", mapping.rawMaterials.length);
      }
      
      if (mapping && mapping.rawMaterials && mapping.rawMaterials.length > 0) {
        // Validate raw material availability
        const insufficientMaterials = [];
        
        for (const rm of mapping.rawMaterials) {
          const requiredQty = rm.quantityPerUnit * qty;
          const stock = await CategoryStock.findOne({ categoryId: rm.rawCategoryId });
          
          if (!stock || stock.availableQuantity < requiredQty) {
            insufficientMaterials.push({
              name: rm.rawMaterialName,
              required: requiredQty,
              available: stock?.availableQuantity || 0,
              unit: rm.measurementType,
            });
          }
        }
        
        // If any material is insufficient, block the operation
        if (insufficientMaterials.length > 0) {
          const errorMsg = insufficientMaterials.map(m => 
            `${m.name}: Need ${m.required} ${m.unit}, Available ${m.available} ${m.unit}`
          ).join("; ");
          
          return res.status(400).json({ 
            success: false, 
            message: `Insufficient raw materials to produce ${qty} units of ${item.name}. ${errorMsg}`,
            insufficientMaterials 
          });
        }
        
        // All materials are sufficient, proceed with deduction
        console.log("Proceeding with raw material deduction...");
        for (const rm of mapping.rawMaterials) {
          const requiredQty = rm.quantityPerUnit * qty;
          console.log(`Processing ${rm.rawMaterialName}: ${requiredQty} ${rm.measurementType}`);
          const stock = await CategoryStock.findOne({ categoryId: rm.rawCategoryId });
          
          if (stock) {
            console.log(`Found stock for ${rm.rawMaterialName}: ${stock.availableQuantity} ${stock.measurementType}`);
            const previousStock = stock.availableQuantity;
            stock.availableQuantity -= requiredQty;
            stock.lastUpdated = new Date();
            await stock.save();
            console.log(`Updated stock to: ${stock.availableQuantity} ${stock.measurementType}`);
            
            // Record raw material transaction
            await StockTransaction.create({
              itemCode: rm.rawCategoryId,
              itemType: "raw_material",
              transactionType: "out",
              quantity: requiredQty,
              previousStock: previousStock,
              newStock: stock.availableQuantity,
              reason: `Used for production of ${qty} units of ${item.name}`,
              referenceId: item._id.toString(),
              performedBy: req.user?.username || req.user?.email || 'system',
              notes: `Auto-deducted via Production Usage Mapping`,
              category: rm.rawMaterialName,
              timestamp: new Date(),
            });
            
            console.log(`✅ Deducted ${requiredQty} ${rm.measurementType} of ${rm.rawMaterialName} for ${item.name} production`);
          } else {
            console.log(`❌ Stock not found for category: ${rm.rawCategoryId}`);
          }
        }
      }
    }

    // Increase finished product stock
    const prev = Number(item.quantity || 0);
    item.quantity = prev + qty;
    await item.save();

    // Record finished product transaction
    await StockTransaction.create({
      itemCode: item.itemCode,
      itemType: "finished_product",
      transactionType: "in",
      quantity: qty,
      previousStock: prev,
      newStock: item.quantity,
      reason: "manual_increase",
      timestamp: new Date(),
    });

    res.json({ 
      success: true, 
      previousStock: prev, 
      newStock: item.quantity,
      rawMaterialsDeducted: product && await ProductionUsageMap.exists({ productId: product._id })
    });
  } catch (err) {
    console.error("INCREASE STOCK error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to increase stock" });
  }
});

// POST /api/finishedproducts/:id/decrease-stock
router.post("/:id/decrease-stock", async (req, res) => {
  try {
    const { id } = req.params;
    const qty = Number(req.body?.quantity || 0);
    if (!qty || qty <= 0) return res.status(400).json({ success: false, message: "quantity must be > 0" });

    const item = await FinishedProduct.findById(id);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    const prev = Number(item.quantity || 0);
    if (prev - qty < 0) return res.status(400).json({ success: false, message: "Insufficient stock" });
    item.quantity = prev - qty;
    await item.save();

    await StockTransaction.create({
      itemCode: item.itemCode,
      itemType: "finished_product",
      transactionType: "out",
      quantity: qty,
      previousStock: prev,
      newStock: item.quantity,
      reason: "manual_decrease",
      timestamp: new Date(),
    });

    res.json({ success: true, previousStock: prev, newStock: item.quantity });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to decrease stock" });
  }
});

module.exports = router;
