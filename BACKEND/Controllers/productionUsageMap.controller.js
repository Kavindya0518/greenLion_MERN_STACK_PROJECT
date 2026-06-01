const ProductionUsageMap = require("../Models/ProductionUsageMap");
const Product = require("../Models/product.model");
const MaterialCategory = require("../Models/materialCategory.model");

// GET /api/production-usage-map - List all mappings
exports.list = async (req, res, next) => {
  try {
    const mappings = await ProductionUsageMap.find()
      .populate({ path: "productId", select: "name category" })
      .populate({ path: "createdBy", select: "username email" })
      .populate({ path: "updatedBy", select: "username email" })
      .sort({ createdAt: -1 });
    
    res.json({ ok: true, mappings });
  } catch (e) {
    console.error("PRODUCTION USAGE MAP LIST error:", e);
    next(e);
  }
};

// GET /api/production-usage-map/:productId - Get mapping for a specific product
exports.getByProductId = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const mapping = await ProductionUsageMap.findOne({ productId })
      .populate({ path: "productId", select: "name category" });
    
    if (!mapping) {
      return res.status(404).json({ ok: false, message: "No mapping found for this product" });
    }
    
    res.json({ ok: true, mapping });
  } catch (e) {
    console.error("PRODUCTION USAGE MAP GET BY PRODUCT error:", e);
    next(e);
  }
};

// POST /api/production-usage-map - Create or update mapping for a product
exports.createOrUpdate = async (req, res, next) => {
  try {
    const { productId, productName, rawMaterials } = req.body;
    const userId = req.user?.id;

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ ok: false, message: "Product not found" });
    }

    // Validate raw materials
    if (!rawMaterials || rawMaterials.length === 0) {
      return res.status(400).json({ ok: false, message: "At least one raw material is required" });
    }

    for (const rm of rawMaterials) {
      if (!rm.rawCategoryId || !rm.rawMaterialName || !rm.quantityPerUnit || !rm.measurementType) {
        return res.status(400).json({ ok: false, message: "All raw material fields are required" });
      }
      if (rm.quantityPerUnit <= 0) {
        return res.status(400).json({ ok: false, message: "Quantity per unit must be greater than 0" });
      }
    }

    // Check if mapping already exists
    let mapping = await ProductionUsageMap.findOne({ productId });

    if (mapping) {
      // Update existing mapping
      mapping.productName = productName || product.name;
      mapping.rawMaterials = rawMaterials;
      mapping.updatedBy = userId;
      await mapping.save();
      
      res.json({ ok: true, mapping, message: "Production mapping updated successfully" });
    } else {
      // Create new mapping
      mapping = await ProductionUsageMap.create({
        productId,
        productName: productName || product.name,
        rawMaterials,
        createdBy: userId,
        updatedBy: userId,
      });
      
      res.status(201).json({ ok: true, mapping, message: "Production mapping created successfully" });
    }
  } catch (e) {
    console.error("PRODUCTION USAGE MAP CREATE/UPDATE error:", e);
    if (e.code === 11000) {
      return res.status(400).json({ ok: false, message: "A mapping already exists for this product" });
    }
    next(e);
  }
};

// DELETE /api/production-usage-map/:productId - Delete mapping for a product
exports.remove = async (req, res, next) => {
  try {
    const { productId } = req.params;
    
    const mapping = await ProductionUsageMap.findOneAndDelete({ productId });
    
    if (!mapping) {
      return res.status(404).json({ ok: false, message: "Mapping not found" });
    }
    
    res.json({ ok: true, message: "Production mapping deleted successfully" });
  } catch (e) {
    console.error("PRODUCTION USAGE MAP DELETE error:", e);
    next(e);
  }
};

// Helper endpoints for frontend dropdowns
exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find().select("name category").sort({ name: 1 });
    res.json({ ok: true, products });
  } catch (e) {
    console.error("GET PRODUCTS error:", e);
    next(e);
  }
};

exports.getRawMaterialCategories = async (req, res, next) => {
  try {
    const categories = await MaterialCategory.find().select("name code measurementType").sort({ name: 1 });
    // Transform the data to use categoryId instead of code for consistency
    const transformedCategories = categories.map(cat => ({
      categoryId: cat.code,
      name: cat.name,
      measurementType: cat.measurementType
    }));
    res.json({ ok: true, categories: transformedCategories });
  } catch (e) {
    console.error("GET RAW MATERIAL CATEGORIES error:", e);
    next(e);
  }
};

