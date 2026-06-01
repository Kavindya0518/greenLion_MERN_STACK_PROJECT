const RawMaterial = require("../Models/RawMaterial");
const StockTransaction = require("../Models/StockTransaction");
const MaterialCategory = require("../Models/materialCategory.model");

// Get all raw materials
exports.getAllRawMaterials = async (req, res) => {
  try {
    const rawMaterials = await RawMaterial.find()
      .populate('category', 'code name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: rawMaterials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get raw materials grouped by category
exports.getRawMaterialsByCategory = async (req, res) => {
  try {
    const categories = await MaterialCategory.find().sort({ name: 1 });
    const categoryData = [];

    for (const category of categories) {
      const materials = await RawMaterial.find({ category: category._id })
        .sort({ name: 1 });
      
      if (materials.length > 0) {
        categoryData.push({
          category: {
            _id: category._id,
            code: category.code,
            name: category.name,
            description: category.description
          },
          materials: materials,
          totalItems: materials.length,
          totalValue: materials.reduce((sum, mat) => sum + (mat.quantity * mat.unitPrice), 0),
          lowStockCount: materials.filter(mat => mat.quantity <= (mat.reOrderLevel || mat.uol)).length
        });
      }
    }

    // Add uncategorized materials
    const uncategorizedMaterials = await RawMaterial.find({ category: { $exists: false } })
      .sort({ name: 1 });
    
    if (uncategorizedMaterials.length > 0) {
      categoryData.push({
        category: {
          _id: null,
          code: 'UNCATEGORIZED',
          name: 'Uncategorized',
          description: 'Materials without category assignment'
        },
        materials: uncategorizedMaterials,
        totalItems: uncategorizedMaterials.length,
        totalValue: uncategorizedMaterials.reduce((sum, mat) => sum + (mat.quantity * mat.unitPrice), 0),
        lowStockCount: uncategorizedMaterials.filter(mat => mat.quantity <= (mat.reOrderLevel || mat.uol)).length
      });
    }

    res.json({ 
      success: true, 
      data: categoryData,
      summary: {
        totalCategories: categoryData.length,
        totalMaterials: categoryData.reduce((sum, cat) => sum + cat.totalItems, 0),
        totalValue: categoryData.reduce((sum, cat) => sum + cat.totalValue, 0),
        totalLowStock: categoryData.reduce((sum, cat) => sum + cat.lowStockCount, 0)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add new raw material
exports.addRawMaterial = async (req, res) => {
  try {
    const {
      itemCode,
      name,
      description,
      unit,
      unitPrice,
      uol, // minimum level
      reOrderLevel,
      quantity,
      supplier,
      category,
    } = req.body;

    // quick server-side checks before hitting the database
    if (!itemCode || !name || !unit) {
      return res.status(400).json({ success: false, message: "itemCode, name and unit are required" });
    }
    if (Number(quantity) < 0) {
      return res.status(400).json({ success: false, message: "Quantity cannot be negative" });
    }
    if (Number(uol) < 0) {
      return res.status(400).json({ success: false, message: "Minimum level cannot be negative" });
    }
    if (Number(unitPrice) < 0) {
      return res.status(400).json({ success: false, message: "Unit price cannot be negative" });
    }

    // Check if material already exists
    const exists = await RawMaterial.findOne({ itemCode: String(itemCode).toUpperCase().trim() });
    if (exists) {
      return res.status(400).json({ success: false, message: "Item code already exists" });
    }

    const newMaterial = new RawMaterial({
      itemCode: String(itemCode).toUpperCase().trim(),
      name: String(name).trim(),
      description: description || "",
      unit: unit,
      unitPrice: Number(unitPrice) || 0,
      uol: Number(uol) || 0,
      reOrderLevel: Number(reOrderLevel) || 0,
      quantity: Number(quantity) || 0,
      supplier: supplier || "",
      category: category || null
    });

    const savedMaterial = await newMaterial.save();
    res.status(201).json({ success: true, data: savedMaterial });
  } catch (error) {
    // Mongoose validation errors will also land here
    res.status(500).json({ success: false, message: error.message });
  }
};

// Increase stock (when supplier delivers)
exports.increaseStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (Number(quantity) <= 0) {
      return res.status(400).json({ success: false, message: "Quantity must be greater than 0" });
    }

    const material = await RawMaterial.findById(id);
    if (!material) {
      return res.status(404).json({ success: false, message: "Material not found" });
    }

    const prev = Number(material.quantity || 0);
    const add = Number(quantity || 0);
    const next = prev + add;

    // Log transaction first for audit trail
    await StockTransaction.create({
      itemCode: material.itemCode,
      itemType: "raw_material",
      transactionType: "in",
      quantity: add,
      previousStock: prev,
      newStock: next,
      reason: "supplier_delivery",
      referenceId: id,
      performedBy: String(req.user?.id || req.user?._id || "system"),
      timestamp: new Date(),
    });

    material.quantity = next;
    material.lastUpdated = new Date();
    await material.save();

    res.json({ success: true, data: material });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Decrease stock (when used in production)
exports.decreaseStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    
    if (Number(quantity) <= 0) {
      return res.status(400).json({ success: false, message: "Quantity must be greater than 0" });
    }

    const material = await RawMaterial.findById(id);
    if (!material) return res.status(404).json({ success: false, message: "Material not found" });

    const prev = Number(material.quantity || 0);
    const take = Number(quantity || 0);
    if (prev < take) {
      return res.status(400).json({ success: false, message: "Not enough stock" });
    }
    const next = Math.max(0, prev - take);

    await StockTransaction.create({
      itemCode: material.itemCode,
      itemType: "raw_material",
      transactionType: "out",
      quantity: take,
      previousStock: prev,
      newStock: next,
      reason: "production_usage",
      referenceId: id,
      performedBy: String(req.user?.id || req.user?._id || "system"),
      timestamp: new Date(),
    });

    material.quantity = next;
    material.lastUpdated = new Date();
    await material.save();

    res.json({ success: true, data: material });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get low stock materials
exports.getLowStockMaterials = async (req, res) => {
  try {
    const lowStockMaterials = await RawMaterial.find({
      $expr: { $lte: ["$quantity", { $ifNull: ["$reOrderLevel", "$uol"] }] }
    });

    res.json({ success: true, data: lowStockMaterials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update raw material
exports.updateRawMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.currentStock && Number(updateData.currentStock) < 0) {
      return res.status(400).json({ success: false, message: "Current stock cannot be negative" });
    }
    if (updateData.minStockLevel && Number(updateData.minStockLevel) < 0) {
      return res.status(400).json({ success: false, message: "Minimum stock level cannot be negative" });
    }
    if (updateData.unitPrice && Number(updateData.unitPrice) < 0) {
      return res.status(400).json({ success: false, message: "Unit price cannot be negative" });
    }

    const material = await RawMaterial.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true } // runValidators will trigger your Mongoose schema rules
    );

    if (!material) {
      return res.status(404).json({ success: false, message: "Material not found" });
    }

    res.json({ success: true, data: material });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete raw material
exports.deleteRawMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    const material = await RawMaterial.findByIdAndDelete(id);

    if (!material) {
      return res.status(404).json({ success: false, message: "Material not found" });
    }

    res.json({ success: true, message: "Material deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
