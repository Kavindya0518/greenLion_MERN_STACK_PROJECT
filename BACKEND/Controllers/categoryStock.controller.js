// BACKEND/Controllers/categoryStock.controller.js
const CategoryStock = require("../Models/CategoryStock");
const MaterialCategory = require("../Models/materialCategory.model");
const StockTransaction = require("../Models/StockTransaction");

// GET /category-stock - List all category stocks
exports.list = async (req, res, next) => {
  try {
    const stocks = await CategoryStock.find().sort({ categoryName: 1 });
    res.json({ ok: true, stocks });
  } catch (e) {
    console.error("CATEGORY STOCK LIST error:", e);
    res.status(500).json({ ok: false, message: "Failed to load category stocks" });
  }
};

// POST /category-stock/initialize - Initialize stock from existing categories
exports.initialize = async (req, res, next) => {
  try {
    const categories = await MaterialCategory.find();
    
    const results = {
      created: 0,
      skipped: 0,
      errors: []
    };
    
    for (const category of categories) {
      try {
        const exists = await CategoryStock.findOne({ categoryId: category.code });
        
        if (!exists) {
          await CategoryStock.create({
            categoryId: category.code,
            categoryName: category.name,
            measurementType: category.measurementType || 'units',
            availableQuantity: 0,
            lastUpdated: new Date()
          });
          results.created++;
        } else {
          results.skipped++;
        }
      } catch (e) {
        results.errors.push({
          categoryId: category.code,
          error: e.message
        });
      }
    }
    
    res.json({ ok: true, results });
  } catch (e) {
    console.error("CATEGORY STOCK INITIALIZE error:", e);
    res.status(500).json({ ok: false, message: "Failed to initialize category stocks" });
  }
};

// PATCH /category-stock/:categoryId/adjust - Manually adjust stock quantity
exports.adjustStock = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { adjustment, reason } = req.body;
    
    if (!adjustment || isNaN(adjustment)) {
      return res.status(400).json({ ok: false, message: "Adjustment value is required and must be a number" });
    }
    
    const stock = await CategoryStock.findOne({ categoryId });
    
    if (!stock) {
      return res.status(404).json({ ok: false, message: "Category stock not found" });
    }
    
    const previousStock = stock.availableQuantity;
    const newQuantity = previousStock + Number(adjustment);
    
    if (newQuantity < 0) {
      return res.status(400).json({ ok: false, message: "Insufficient stock. Cannot reduce below 0." });
    }
    
    stock.availableQuantity = newQuantity;
    stock.lastUpdated = new Date();
    await stock.save();
    
    // Record transaction in StockTransaction
    try {
      await StockTransaction.create({
        itemCode: categoryId,
        itemType: "raw_material",
        transactionType: "adjustment",
        quantity: Math.abs(adjustment),
        previousStock: previousStock,
        newStock: newQuantity,
        reason: reason || (adjustment > 0 ? 'Manual stock addition' : 'Manual stock reduction'),
        referenceId: categoryId,
        performedBy: req.user?.username || req.user?.email || 'admin',
        notes: `${adjustment > 0 ? 'Added' : 'Reduced'} ${Math.abs(adjustment)} ${stock.measurementType}`,
        category: stock.categoryName, // Add category name for display
        timestamp: new Date()
      });
      console.log(`✅ Stock transaction recorded for ${categoryId}`);
    } catch (transactionError) {
      console.error("Failed to record stock transaction:", transactionError);
      // Continue anyway - stock was updated successfully
    }
    
    console.log(`Stock adjusted: ${categoryId} by ${adjustment}. Reason: ${reason || 'Manual adjustment'}`);
    
    res.json({ ok: true, stock });
  } catch (e) {
    console.error("CATEGORY STOCK ADJUST error:", e);
    res.status(500).json({ ok: false, message: "Failed to adjust stock" });
  }
};

// Function to increase stock when order is confirmed (called from suppliers.controller)
exports.increaseStockFromOrder = async (order, categoryName, quantity) => {
  try {
    console.log(`Attempting to update stock for category: ${categoryName}, quantity: ${quantity}`);
    
    // Find the category to get categoryId
    const category = await MaterialCategory.findOne({ name: categoryName });
    
    if (!category) {
      console.error(`❌ Category not found in database: ${categoryName}`);
      return false;
    }
    
    console.log(`Found category:`, { _id: category._id, name: category.name, code: category.code, measurementType: category.measurementType });
    console.log(`Using category code for stock update: ${category.code}`);
    
    // Use the category code directly
    const catId = category.code;
    
    if (!category.code) {
      console.warn(`⚠️ Category "${categoryName}" missing code field. Cannot update stock.`);
      return false;
    }
    
    // Find or create category stock
    let stock = await CategoryStock.findOne({ categoryId: catId });
    
    const previousStock = stock ? stock.availableQuantity : 0;
    
    if (!stock) {
      // Create new stock record if doesn't exist
      stock = await CategoryStock.create({
        categoryId: catId,
        categoryName: category.name,
        measurementType: category.measurementType || 'units',
        availableQuantity: quantity,
        lastUpdated: new Date()
      });
      console.log(`✅ Created new stock for category ${catId} (${category.name}): ${quantity} ${category.measurementType || 'units'}`);
    } else {
      // Update existing stock
      const oldQty = stock.availableQuantity;
      stock.availableQuantity += quantity;
      stock.lastUpdated = new Date();
      await stock.save();
      console.log(`✅ Updated stock for category ${catId} (${category.name}): ${oldQty} + ${quantity} = ${stock.availableQuantity} ${stock.measurementType}`);
    }
    
    // Record transaction in StockTransaction
    try {
      await StockTransaction.create({
        itemCode: catId,
        itemType: "raw_material",
        transactionType: "in",
        quantity: quantity,
        previousStock: previousStock,
        newStock: stock.availableQuantity,
        reason: `Delivery confirmed - Order ${order.orderId}`,
        referenceId: order.orderId,
        performedBy: 'system',
        notes: `Supplier: ${order.supplier?.name || 'Unknown'}, Category: ${categoryName}, Quantity: ${quantity} ${stock.measurementType}`,
        category: categoryName, // Add category name for display
        timestamp: new Date()
      });
      console.log(`✅ Stock transaction recorded for delivery confirmation`);
    } catch (transactionError) {
      console.error("Failed to record stock transaction:", transactionError);
      // Continue anyway - stock was updated successfully
    }
    
    return true;
  } catch (e) {
    console.error("❌ INCREASE STOCK FROM ORDER error:", e.message);
    console.error("Full error:", e);
    return false;
  }
};

