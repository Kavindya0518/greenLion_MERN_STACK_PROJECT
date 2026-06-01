// BACKEND/Controllers/supplierMaterial.controller.js
const SupplierMaterial = require("../Models/SupplierMaterial");
const PurchaseOrder = require("../Models/PurchaseOrder");

exports.list = async (req, res) => {
  try {
    const { supplierId, categoryId, q } = req.query;
    const filter = {};
    if (supplierId) filter.supplierId = supplierId;
    if (categoryId) filter.categoryId = categoryId;
    if (q) {
      const rx = new RegExp(q, "i");
      filter.$or = [{ name: rx }, { materialCode: rx }];
    }
    const items = await SupplierMaterial.find(filter).sort({ updatedAt: -1 }).limit(500);
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.materialCode || !body.name || !body.unit || !body.price) {
      return res.status(400).json({ success: false, message: "materialCode, name, unit, price required" });
    }
    const payload = {
      supplierId: req.user?.role === 'supplier' ? req.user.id : body.supplierId,
      supplierName: body.supplierName,
      materialCode: String(body.materialCode).toUpperCase().trim(),
      name: body.name,
      categoryId: body.categoryId,
      unit: body.unit,
      price: Number(body.price),
      minimumOrderQty: Number(body.minimumOrderQty || 0),
      leadTimeDays: Number(body.leadTimeDays || 0),
      available: body.available !== false,
    };
    if (!payload.supplierId) {
      return res.status(400).json({ success: false, message: "supplierId required" });
    }
    const exist = await SupplierMaterial.findOne({ supplierId: payload.supplierId, materialCode: payload.materialCode });
    if (exist) return res.status(409).json({ success: false, message: "Offer already exists for this supplier and code" });

    const doc = await SupplierMaterial.create(payload);
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body, materialCode: undefined };
    const doc = await SupplierMaterial.findByIdAndUpdate(id, { $set: updates }, { new: true });
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await SupplierMaterial.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });
    doc.available = !doc.available;
    await doc.save();
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/supplier-materials/:id/best  { isBest: true|false }
exports.toggleBest = async (req, res) => {
  try {
    const { id } = req.params;
    const { isBest } = req.body || {};
    const doc = await SupplierMaterial.findByIdAndUpdate(
      id,
      { $set: { isBest: !!isBest } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });

    // If marking as Best, auto-create a lightweight Purchase Order for this supplier and material
    if (!!isBest) {
      const existing = await PurchaseOrder.findOne({
        supplierId: doc.supplierId,
        status: { $in: ["draft", "sent", "confirmed"] },
        "items.materialCode": doc.materialCode,
      });
      if (!existing) {
        const price = Number(doc.finalPrice ?? doc.price ?? 0);
        const qty = Math.max(1, Number(doc.minimumOrderQty || 1));
        const po = await PurchaseOrder.create({
          poNumber: undefined,
          supplierId: doc.supplierId,
          supplierName: doc.supplierName,
          items: [{ materialCode: doc.materialCode, name: doc.name, unit: doc.unit, price, qty }],
          notes: "Auto-created from Best selection",
          status: "sent",
          createdBy: "auto-best",
        });
        return res.json({ success: true, data: doc, purchaseOrder: po });
      }
      return res.json({ success: true, data: doc, purchaseOrder: existing });
    } else {
      // If removing Best, cancel any auto-best PO that hasn't been delivered/confirmed
      const po = await PurchaseOrder.findOne({
        supplierId: doc.supplierId,
        status: { $in: ["draft", "sent"] },
        createdBy: "auto-best",
        "items.materialCode": doc.materialCode,
      });
      if (po) {
        po.status = "cancelled";
        await po.save();
        return res.json({ success: true, data: doc, purchaseOrder: po });
      }
      return res.json({ success: true, data: doc });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
