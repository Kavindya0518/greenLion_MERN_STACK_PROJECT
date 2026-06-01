const ProductionUsage = require("../Models/ProductionUsage");
const CategoryStock = require("../Models/CategoryStock");
const Product = require("../Models/product.model");
const Category = require("../Models/productCategory.model");
const MaterialCategory = require("../Models/materialCategory.model");
const StockTransaction = require("../Models/StockTransaction");
const { z } = require("zod");

// Validation schema
const productionUsageSchema = z.object({
  productCategory: z.string().trim().min(1, "Product category is required"),
  productId: z.string().min(1, "Product ID is required"),
  productName: z.string().trim().min(1, "Product name is required"),
  rawMaterials: z.array(z.object({
    categoryId: z.string().trim().min(1, "Category ID is required"),
    categoryName: z.string().trim().min(1, "Category name is required"),
    measurementType: z.string().trim().min(1, "Measurement type is required"),
    usedQuantity: z.number().min(0.01, "Used quantity must be greater than 0")
  })).min(1, "At least one raw material is required"),
  batchId: z.string().trim().optional(),
  notes: z.string().trim().max(500, "Notes cannot exceed 500 characters").optional()
});

// GET /api/production-usage - List all production usage records
exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, product, dateFrom, dateTo } = req.query;
    
    const filter = {};
    if (category) filter.productCategory = new RegExp(category, 'i');
    if (product) filter.productName = new RegExp(product, 'i');
    if (dateFrom || dateTo) {
      filter.productionDate = {};
      if (dateFrom) filter.productionDate.$gte = new Date(dateFrom);
      if (dateTo) filter.productionDate.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;
    
    const [records, total] = await Promise.all([
      ProductionUsage.find(filter)
        .populate('productId', 'name category')
        .sort({ productionDate: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ProductionUsage.countDocuments(filter)
    ]);

    res.json({
      ok: true,
      records,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (e) {
    console.error("PRODUCTION USAGE LIST error:", e);
    res.status(500).json({ ok: false, message: "Failed to fetch production usage records" });
  }
};

// GET /api/production-usage/categories - Get product categories
exports.getProductCategories = async (req, res) => {
  try {
    const categories = await Category.find({ active: true })
      .select('name')
      .sort({ name: 1 });
    
    res.json({ ok: true, categories });
  } catch (e) {
    console.error("PRODUCT CATEGORIES error:", e);
    res.status(500).json({ ok: false, message: "Failed to fetch product categories" });
  }
};

// GET /api/production-usage/products/:category - Get products by category
exports.getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    const products = await Product.find({ 
      category: new RegExp(category, 'i'),
      active: true 
    })
    .select('name category price')
    .sort({ name: 1 });
    
    res.json({ ok: true, products });
  } catch (e) {
    console.error("PRODUCTS BY CATEGORY error:", e);
    res.status(500).json({ ok: false, message: "Failed to fetch products" });
  }
};

// GET /api/production-usage/raw-materials - Get available raw material categories
exports.getRawMaterials = async (req, res) => {
  try {
    const rawMaterials = await MaterialCategory.find({ active: true })
      .select('categoryId name measurementType')
      .sort({ name: 1 });
    
    res.json({ ok: true, rawMaterials });
  } catch (e) {
    console.error("RAW MATERIALS error:", e);
    res.status(500).json({ ok: false, message: "Failed to fetch raw materials" });
  }
};

// GET /api/production-usage/stock/:categoryId - Get stock for a specific category
exports.getStockForCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    const stock = await CategoryStock.findOne({ categoryId })
      .select('categoryName measurementType availableQuantity');
    
    if (!stock) {
      return res.json({ 
        ok: true, 
        stock: { 
          categoryName: 'Unknown', 
          measurementType: 'units', 
          availableQuantity: 0 
        } 
      });
    }
    
    res.json({ ok: true, stock });
  } catch (e) {
    console.error("STOCK FOR CATEGORY error:", e);
    res.status(500).json({ ok: false, message: "Failed to fetch stock information" });
  }
};

// POST /api/production-usage - Create new production usage record
exports.create = async (req, res) => {
  try {
    console.log("=== CREATE PRODUCTION USAGE DEBUG ===");
    console.log("Request body:", req.body);
    
    // Validate input
    const validatedData = productionUsageSchema.parse(req.body);
    
    // Check stock availability for each raw material
    const stockChecks = await Promise.all(
      validatedData.rawMaterials.map(async (material) => {
        const stock = await CategoryStock.findOne({ categoryId: material.categoryId });
        if (!stock) {
          throw new Error(`Stock not found for category: ${material.categoryName}`);
        }
        if (stock.availableQuantity < material.usedQuantity) {
          throw new Error(
            `Insufficient stock for ${material.categoryName}. Available: ${stock.availableQuantity} ${stock.measurementType}, Required: ${material.usedQuantity} ${material.measurementType}`
          );
        }
        return { stock, material };
      })
    );
    
    // Create production usage record
    const productionUsage = await ProductionUsage.create({
      ...validatedData,
      recordedBy: req.user?.username || req.user?.email || 'admin'
    });
    
    // Reduce stock for each raw material
    const stockUpdates = await Promise.all(
      stockChecks.map(async ({ stock, material }) => {
        const previousStock = stock.availableQuantity;
        stock.availableQuantity -= material.usedQuantity;
        stock.lastUpdated = new Date();
        await stock.save();
        
        // Record stock transaction
        await StockTransaction.create({
          itemCode: material.categoryId,
          itemType: "raw_material",
          transactionType: "out",
          quantity: material.usedQuantity,
          previousStock: previousStock,
          newStock: stock.availableQuantity,
          reason: `Production usage - ${validatedData.productName}`,
          referenceId: productionUsage._id.toString(),
          performedBy: req.user?.username || req.user?.email || 'admin',
          notes: `Batch: ${validatedData.batchId || 'N/A'}, Product: ${validatedData.productName}`,
          category: material.categoryName,
          timestamp: new Date()
        });
        
        console.log(`✅ Stock reduced for ${material.categoryName}: ${previousStock} - ${material.usedQuantity} = ${stock.availableQuantity}`);
        return { categoryName: material.categoryName, newStock: stock.availableQuantity };
      })
    );
    
    console.log("✅ Production usage recorded successfully");
    
    res.status(201).json({
      ok: true,
      productionUsage,
      stockUpdates,
      message: "Production recorded and inventory updated successfully"
    });
    
  } catch (e) {
    console.error("CREATE PRODUCTION USAGE error:", e);
    
    if (e.name === 'ZodError') {
      return res.status(400).json({ 
        ok: false, 
        message: "Validation error", 
        errors: e.errors 
      });
    }
    
    res.status(500).json({ 
      ok: false, 
      message: e.message || "Failed to record production usage" 
    });
  }
};

// GET /api/production-usage/:id - Get single production usage record
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const record = await ProductionUsage.findById(id)
      .populate('productId', 'name category price');
    
    if (!record) {
      return res.status(404).json({ ok: false, message: "Production usage record not found" });
    }
    
    res.json({ ok: true, record });
  } catch (e) {
    console.error("GET PRODUCTION USAGE BY ID error:", e);
    res.status(500).json({ ok: false, message: "Failed to fetch production usage record" });
  }
};

// DELETE /api/production-usage/:id - Delete production usage record
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    
    const record = await ProductionUsage.findById(id);
    if (!record) {
      return res.status(404).json({ ok: false, message: "Production usage record not found" });
    }
    
    // Restore stock for each raw material (reverse the usage)
    const stockRestorations = await Promise.all(
      record.rawMaterials.map(async (material) => {
        const stock = await CategoryStock.findOne({ categoryId: material.categoryId });
        if (stock) {
          const previousStock = stock.availableQuantity;
          stock.availableQuantity += material.usedQuantity;
          stock.lastUpdated = new Date();
          await stock.save();
          
          // Record stock transaction for restoration
          await StockTransaction.create({
            itemCode: material.categoryId,
            itemType: "raw_material",
            transactionType: "adjustment",
            quantity: material.usedQuantity,
            previousStock: previousStock,
            newStock: stock.availableQuantity,
            reason: `Production usage deleted - ${record.productName}`,
            referenceId: record._id.toString(),
            performedBy: req.user?.username || req.user?.email || 'admin',
            notes: `Restored stock after deleting production record`,
            category: material.categoryName,
            timestamp: new Date()
          });
          
          console.log(`✅ Stock restored for ${material.categoryName}: ${previousStock} + ${material.usedQuantity} = ${stock.availableQuantity}`);
          return { categoryName: material.categoryName, newStock: stock.availableQuantity };
        }
        return null;
      })
    );
    
    await ProductionUsage.findByIdAndDelete(id);
    
    res.json({
      ok: true,
      message: "Production usage record deleted and stock restored",
      stockRestorations: stockRestorations.filter(Boolean)
    });
    
  } catch (e) {
    console.error("DELETE PRODUCTION USAGE error:", e);
    res.status(500).json({ ok: false, message: "Failed to delete production usage record" });
  }
};

// GET /api/production-usage/stats - Get production usage statistics
exports.getStats = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    
    const filter = {};
    if (dateFrom || dateTo) {
      filter.productionDate = {};
      if (dateFrom) filter.productionDate.$gte = new Date(dateFrom);
      if (dateTo) filter.productionDate.$lte = new Date(dateTo);
    }
    
    const [totalRecords, totalMaterialsUsed, topProducts, topMaterials] = await Promise.all([
      ProductionUsage.countDocuments(filter),
      ProductionUsage.aggregate([
        { $match: filter },
        { $unwind: "$rawMaterials" },
        { $group: { _id: null, total: { $sum: "$rawMaterials.usedQuantity" } } }
      ]),
      ProductionUsage.aggregate([
        { $match: filter },
        { $group: { _id: "$productName", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      ProductionUsage.aggregate([
        { $match: filter },
        { $unwind: "$rawMaterials" },
        { $group: { _id: "$rawMaterials.categoryName", total: { $sum: "$rawMaterials.usedQuantity" } } },
        { $sort: { total: -1 } },
        { $limit: 5 }
      ])
    ]);
    
    res.json({
      ok: true,
      stats: {
        totalRecords,
        totalMaterialsUsed: totalMaterialsUsed[0]?.total || 0,
        topProducts,
        topMaterials
      }
    });
  } catch (e) {
    console.error("PRODUCTION USAGE STATS error:", e);
    res.status(500).json({ ok: false, message: "Failed to fetch production usage statistics" });
  }
};
