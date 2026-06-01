// BACKEND/Controllers/materialCategory.controller.js
const MaterialCategory = require("../Models/materialCategory.model");
const MaterialSubcategory = require("../Models/materialSubcategory.model");
const mongoose = require("mongoose");

// Utility function to normalize name to code
function normalizeNameToCode(name) {
  return String(name || "CAT")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6)
    .padEnd(3, "X");
}

// Utility function to ensure unique code
async function ensureUniqueCode(proposed) {
  let code = proposed;
  let counter = 1;
  while (await MaterialCategory.findOne({ code })) {
    code = `${proposed}${counter}`;
    counter++;
    if (counter > 999) break; // Safety limit
  }
  return code;
}

function prefixFromName(name) {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);
  let prefix = "";
  if (words.length >= 2) {
    prefix = (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1) {
    prefix = words[0].slice(0, 2).toUpperCase();
  } else {
    prefix = "XX";
  }
  return prefix.replace(/[^A-Z]/g, "X");
}

async function generateSequentialCategoryCode() {
  // Find the latest category code across ALL categories
  const latest = await MaterialCategory.findOne()
    .sort({ code: -1 })
    .limit(1);
  
  let nextNum = 1;
  if (latest?.code) {
    const m = latest.code.match(/^CAT-(\d{3})$/i);
    if (m) nextNum = Number(m[1]) + 1;
  }
  
  const code = `CAT-${String(nextNum).padStart(3, '0')}`;
  // Ensure uniqueness
  const exists = await MaterialCategory.findOne({ code });
  if (exists) {
    return `CAT-${String(nextNum + 1).padStart(3, '0')}`;
  }
  return code;
}

// Generate globally unique sequential subcategory ID with retry logic
async function generateSequentialSubcategoryId(maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Find the latest subcategory ID across ALL categories
      const latest = await MaterialSubcategory.findOne()
        .sort({ subcategoryId: -1 })
        .limit(1);
      
      let nextNum = 1;
      if (latest?.subcategoryId) {
        const m = latest.subcategoryId.match(/^SUB-(\d{3})$/i);
        if (m) nextNum = Number(m[1]) + 1;
      }
      
      // Ensure uniqueness by checking if the ID already exists
      let subcategoryId = `SUB-${String(nextNum).padStart(3, '0')}`;
      let exists = await MaterialSubcategory.findOne({ subcategoryId });
      
      // If exists, keep incrementing until we find a unique ID
      while (exists) {
        nextNum++;
        subcategoryId = `SUB-${String(nextNum).padStart(3, '0')}`;
        exists = await MaterialSubcategory.findOne({ subcategoryId });
      }
      
      return subcategoryId;
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      // Wait a bit before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 10));
    }
  }
}

// Generate multiple consecutive subcategory IDs at once
async function generateConsecutiveSubcategoryIds(count, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Find the latest subcategory ID across ALL categories
      const latest = await MaterialSubcategory.findOne()
        .sort({ subcategoryId: -1 })
        .limit(1);
      
      let startNum = 1;
      if (latest?.subcategoryId) {
        const m = latest.subcategoryId.match(/^SUB-(\d{3})$/i);
        if (m) startNum = Number(m[1]) + 1;
      }
      
      // Generate consecutive IDs
      const subcategoryIds = [];
      for (let i = 0; i < count; i++) {
        const num = startNum + i;
        const subcategoryId = `SUB-${String(num).padStart(3, '0')}`;
        
        // Check if this ID already exists
        const exists = await MaterialSubcategory.findOne({ subcategoryId });
        if (exists) {
          // If any ID exists, we need to find the next available range
          const nextAvailable = await MaterialSubcategory.findOne()
            .sort({ subcategoryId: -1 })
            .limit(1);
          const nextNum = nextAvailable?.subcategoryId ? 
            Number(nextAvailable.subcategoryId.match(/^SUB-(\d{3})$/i)[1]) + 1 : 1;
          
          // Regenerate from the next available number
          return generateConsecutiveSubcategoryIds(count, maxRetries);
        }
        
        subcategoryIds.push(subcategoryId);
      }
      
      return subcategoryIds;
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      // Wait a bit before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 10));
    }
  }
}

// GET all
exports.list = async (req, res) => {
  try {
    // Backfill codes for any categories missing one (one-time migration behavior)
    const missing = await MaterialCategory.find({ $or: [ { code: { $exists: false } }, { code: null }, { code: "" } ] });
    if (missing.length) {
      for (const c of missing) {
        const proposed = normalizeNameToCode(c.name || "CAT");
        c.code = await ensureUniqueCode(proposed);
        await c.save();
      }
    }
    const categories = await MaterialCategory.find().sort({ name: 1 });
    res.json({ ok: true, categories });
  } catch (err) {
    res.status(500).json({ ok: false, message: "Failed to load categories" });
  }
};

// GET categories with subcategories
exports.listWithSubcategories = async (req, res) => {
  try {
    const categories = await MaterialCategory.find().sort({ name: 1 });
    const categoriesWithSubs = await Promise.all(
      categories.map(async (category) => {
        const subcategories = await MaterialSubcategory.find({ 
          categoryId: category._id, 
          active: true 
        }).sort({ name: 1 });
        return {
          ...category.toObject(),
          subcategories
        };
      })
    );
    res.json({ ok: true, categories: categoriesWithSubs });
  } catch (err) {
    res.status(500).json({ ok: false, message: "Failed to load categories with subcategories" });
  }
};

// POST add new
exports.create = async (req, res) => {
  try {
    const { name, description, measurementType, code } = req.body;
    if (!name) return res.status(400).json({ ok: false, message: "Name is required" });
    if (!measurementType) return res.status(400).json({ ok: false, message: "Measurement type is required" });
    if (!code) return res.status(400).json({ ok: false, message: "Category ID is required" });

    // Validate code format
    if (!/^CAT-\d{3}$/i.test(code)) {
      return res.status(400).json({ ok: false, message: "Invalid category ID format. Must be CAT-###" });
    }

    // Check if code already exists
    const existingCategory = await MaterialCategory.findOne({ code: code.toUpperCase() });
    if (existingCategory) {
      return res.status(400).json({ ok: false, message: "Category ID already exists" });
    }
    
    // Create category with the provided code
    const category = await MaterialCategory.create({ 
      code: code.toUpperCase(), 
      name: name.trim(), 
      description: (description||"").trim(),
      measurementType: measurementType.trim()
    });

    res.status(201).json({ 
      ok: true, 
      category,
      message: "Category created successfully"
    });
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate key error
      const field = Object.keys(err.keyPattern)[0];
      const message = field === 'name' ? 'Category name already exists' : 
                     field === 'code' ? 'Category ID already exists' :
                     'Duplicate entry detected';
      return res.status(400).json({ ok: false, message });
    }
    res.status(500).json({ ok: false, message: err.message || "Add category failed" });
  }
};

// PUT update
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const update = { name: req.body.name, description: req.body.description };
    const cat = await MaterialCategory.findByIdAndUpdate(
      id,
      update,
      { new: true, runValidators: true }
    );
    if (!cat) return res.status(404).json({ ok: false, message: "Category not found" });
    res.json({ ok: true, category: cat });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message || "Update failed" });
  }
};

// DELETE
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const cat = await MaterialCategory.findByIdAndDelete(id);
    if (!cat) return res.status(404).json({ ok: false, message: "Category not found" });
    res.json({ ok: true, message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message || "Delete failed" });
  }
};

// GET next available subcategory ID
exports.getNextSubcategoryId = async (req, res) => {
  try {
    const nextId = await generateSequentialSubcategoryId();
    res.json({ ok: true, nextSubcategoryId: nextId });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message || "Failed to get next subcategory ID" });
  }
};

// GET next available subcategory IDs (for multiple subcategories)
exports.getNextSubcategoryIds = async (req, res) => {
  try {
    const { count = 1 } = req.query;
    const countNum = parseInt(count) || 1;
    
    if (countNum < 1 || countNum > 10) {
      return res.status(400).json({ ok: false, message: "Count must be between 1 and 10" });
    }
    
    const nextIds = await generateConsecutiveSubcategoryIds(countNum);
    res.json({ ok: true, nextSubcategoryIds: nextIds });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message || "Failed to get next subcategory IDs" });
  }
};

// GET next available category ID
exports.getNextCategoryId = async (req, res) => {
  try {
    const nextId = await generateSequentialCategoryCode();
    res.json({ ok: true, nextCategoryId: nextId });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message || "Failed to get next category ID" });
  }
};

// POST admin utility: generate codes for categories missing one
exports.generateCodes = async (req, res) => {
  try {
    // Find categories that don't have proper CAT-### format codes
    const list = await MaterialCategory.find({ 
      $or: [ 
        { code: { $exists: false } }, 
        { code: null }, 
        { code: "" },
        { code: { $not: /^CAT-\d{3}$/i } } // Not in CAT-### format
      ] 
    });
    
    let updated = 0;
    for (const c of list) {
      // Generate a new sequential CAT-### code
      c.code = await generateSequentialCategoryCode();
      await c.save();
      updated++;
    }
    
    const categories = await MaterialCategory.find().sort({ name: 1 });
    res.json({ ok: true, updated, categories, message: `Updated ${updated} categories with new CAT-### codes` });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message || "Generate codes failed" });
  }
};
