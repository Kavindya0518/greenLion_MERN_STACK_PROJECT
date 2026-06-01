const { z } = require("zod");
const Product = require("../Models/product.model");
const FinishedProduct = require("../Models/FinishedProduct");

// Helper to check date not in past
const today = new Date();
today.setHours(0, 0, 0, 0);

const createSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  description: z.string().optional(),
  unitPrice: z.coerce.number().nonnegative(),
  addDate: z.coerce.date().optional().refine(
    (d) => {
      const dt = new Date(d);
      dt.setHours(0, 0, 0, 0);
      return dt >= today;
    },
    { message: "Add date cannot be in the past" }
  ),
  discountPercent: z.coerce.number().min(0).max(95).optional(),
});

exports.create = async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);

    // ====== Handle uploaded file (PDF or image) ======
    let filePath = null;
    if (req.file) {
      // Replace backslashes with forward slashes for browser URL
      filePath = req.file.path.replace(/\\/g, "/");
      console.log("[POST /products] File uploaded:", filePath);
    }

    // ====== Generate an inventory item code ======
    const normalize = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    let base = normalize(body.name);
    if (!base) base = "FP";

    // Ensure letters+numbers policy by adding numeric suffix, and ensure global uniqueness
    let i = 1;
    let candidate = `${base}-${String(i).padStart(2, '0')}`;
    // Check uniqueness against both Product.inventoryItemCode and FinishedProduct.itemCode
    // Loop until a unique code is found
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existsInProducts = await Product.findOne({ inventoryItemCode: candidate }).lean();
      const existsInFinished = await FinishedProduct.findOne({ itemCode: candidate }).lean();
      if (!existsInProducts && !existsInFinished) break;
      i += 1;
      candidate = `${base}-${String(i).padStart(2, '0')}`;
      if (i > 9999) break;
    }

    const doc = await Product.create({
      name: body.name,
      category: body.category,
      description: body.description || "",
      unitPrice: body.unitPrice,
      addDate: body.addDate || new Date(),
      file: filePath, // <-- store any uploaded file path
      discountPercent: body.discountPercent ?? 0,
      quantity: 0,
      inventoryItemCode: candidate,
    });

    // ====== Auto-create FinishedProduct entry if not present ======
    let finished = await FinishedProduct.findOne({ itemCode: candidate });
    if (!finished) {
      try {
        finished = await FinishedProduct.create({
          itemCode: candidate,
          name: body.name.trim(),
          category: body.category,
          description: body.description || "",
          unit: "units",
          sellingPrice: body.unitPrice,
          uol: 0,
          reOrderLevel: 0,
          quantity: 0,
        });
      } catch (e2) {
        console.error("Auto-create FinishedProduct failed:", e2.message);
      }
    }

    res.status(201).json({ ok: true, product: doc, inventory: finished || null });
  } catch (e) {
    next(e);
  }
};

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  category: z.string().min(2).optional(),
  description: z.string().optional(),
  unitPrice: z.coerce.number().nonnegative().optional(),
  addDate: z.coerce.date().optional().refine(
    (d) => {
      const dt = new Date(d);
      dt.setHours(0, 0, 0, 0);
      return dt >= today;
    },
    { message: "Add date cannot be in the past" }
  ),
  discountPercent: z.coerce.number().min(0).max(95).optional(),
});

exports.update = async (req, res, next) => {
  try {
    const body = updateSchema.parse(req.body);
    const update = {};

    if (body.name !== undefined) update.name = body.name;
    if (body.category !== undefined) update.category = body.category;
    if (body.description !== undefined) update.description = body.description;
    if (body.unitPrice !== undefined) update.unitPrice = body.unitPrice;
    if (body.addDate !== undefined) update.addDate = body.addDate;
    if (body.discountPercent !== undefined) update.discountPercent = body.discountPercent;

    // ====== Handle updated file ======
    if (req.file) {
      update.file = req.file.path.replace(/\\/g, "/"); // fix backslashes
      console.log("[PATCH /products] File updated:", update.file);
    }

    const doc = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!doc) return res.status(404).json({ ok: false, message: "Not found" });

    // Sync to FinishedProduct if code is present
    try {
      if (doc.inventoryItemCode) {
        const finUpdate = {};
        if (body.name !== undefined) finUpdate.name = body.name;
        if (body.category !== undefined) finUpdate.category = body.category;
        if (body.unitPrice !== undefined) finUpdate.sellingPrice = body.unitPrice;
        if (Object.keys(finUpdate).length) {
          await FinishedProduct.updateOne({ itemCode: doc.inventoryItemCode }, { $set: finUpdate });
        }
      }
    } catch (e2) { /* non-blocking */ }

    res.json({ ok: true, product: doc });
  } catch (e) {
    next(e);
  }
};
// Admin: Auto-link products to finished products by name (case-insensitive)
exports.linkInventory = async (req, res, next) => {
  try {
    const prods = await Product.find({ $or: [ { inventoryItemCode: { $exists: false } }, { inventoryItemCode: { $eq: '' } } ] }).lean();
    let updated = 0; const results = [];
    const normalize = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    for (const p of prods) {
      const rx = new RegExp(`^${String(p.name || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      let fin = await FinishedProduct.findOne({ name: rx });
      if (!fin) {
        // Create a FinishedProduct entry for this product
        let base = normalize(p.name);
        if (!base) base = 'FP';
        let i = 1;
        let candidate = `${base}-${String(i).padStart(2, '0')}`;
        // ensure unique across both collections
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const existsInProducts = await Product.findOne({ inventoryItemCode: candidate }).lean();
          const existsInFinished = await FinishedProduct.findOne({ itemCode: candidate }).lean();
          if (!existsInProducts && !existsInFinished) break;
          i += 1;
          candidate = `${base}-${String(i).padStart(2, '0')}`;
          if (i > 9999) break;
        }
        fin = await FinishedProduct.create({
          itemCode: candidate,
          name: p.name || 'Product',
          category: p.category || undefined,
          unit: 'units',
          sellingPrice: p.unitPrice ?? 0,
          quantity: 0,
          uol: 0,
          reOrderLevel: 0,
        });
        await Product.updateOne({ _id: p._id }, { $set: { inventoryItemCode: fin.itemCode } });
        updated += 1; results.push({ productId: p._id, code: fin.itemCode, status: 'created_and_linked' });
        continue;
      }
      await Product.updateOne({ _id: p._id }, { $set: { inventoryItemCode: fin.itemCode } });
      updated += 1; results.push({ productId: p._id, code: fin.itemCode, status: 'linked' });
    }
    res.json({ ok: true, updated, total: prods.length, results });
  } catch (e) {
    next(e);
  }
};

exports.list = async (req, res, next) => {
  try {
    const q = {};
    if (req.query.category) q.category = req.query.category;
    const docs = await Product.find(q).sort({ createdAt: -1 });
    
    // Enrich products with stock information
    const enrichedProducts = await Promise.all(
      docs.map(async (product) => {
        const productObj = product.toObject();
        
        if (product.inventoryItemCode) {
          const itemCode = String(product.inventoryItemCode).toUpperCase();
          const finishedProduct = await FinishedProduct.findOne({ 
            itemCode: new RegExp(`^${itemCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') 
          });
          
          if (finishedProduct) {
            productObj.stockQuantity = finishedProduct.quantity || 0;
            productObj.inStock = (finishedProduct.quantity || 0) > 0;
          } else {
            productObj.stockQuantity = 0;
            productObj.inStock = false;
          }
        } else {
          productObj.stockQuantity = 0;
          productObj.inStock = false;
        }
        
        return productObj;
      })
    );
    
    res.json({ ok: true, products: enrichedProducts });
  } catch (e) {
    next(e);
  }
};

exports.detail = async (req, res, next) => {
  try {
    const doc = await Product.findById(req.params.id);
    if (!doc) return res.status(404).json({ ok: false, message: "Not found" });
    
    // Enrich product with stock information
    const productObj = doc.toObject();
    
    if (doc.inventoryItemCode) {
      const itemCode = String(doc.inventoryItemCode).toUpperCase();
      const finishedProduct = await FinishedProduct.findOne({ 
        itemCode: new RegExp(`^${itemCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') 
      });
      
      if (finishedProduct) {
        productObj.stockQuantity = finishedProduct.quantity || 0;
        productObj.inStock = (finishedProduct.quantity || 0) > 0;
      } else {
        productObj.stockQuantity = 0;
        productObj.inStock = false;
      }
    } else {
      productObj.stockQuantity = 0;
      productObj.inStock = false;
    }
    
    res.json({ ok: true, product: productObj });
  } catch (e) {
    next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};
