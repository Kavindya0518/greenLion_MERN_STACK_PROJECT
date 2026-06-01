// BACKEND/Controllers/purchaseOrder.controller.js
const PurchaseOrder = require("../Models/PurchaseOrder");

exports.list = async (req, res) => {
  try {
    const { status, supplierId, q, limit = 500 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (supplierId) filter.supplierId = supplierId;
    if (q) filter.$text = { $search: q };
    const items = await PurchaseOrder.find(filter).sort({ createdAt: -1 }).limit(Number(limit));
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ success: false, message: "PO not found" });
    res.json({ success: true, data: po });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.supplierId || !Array.isArray(body.items) || body.items.length === 0) {
      return res.status(400).json({ success: false, message: "supplierId and items are required" });
    }
    const doc = await PurchaseOrder.create({
      poNumber: body.poNumber,
      supplierId: body.supplierId,
      supplierName: body.supplierName,
      items: body.items,
      notes: body.notes,
      status: body.status || "draft",
      createdBy: req.user?.email || "system",
    });
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    const doc = await PurchaseOrder.findByIdAndUpdate(id, { $set: updates }, { new: true });
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.setStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ["draft", "sent", "confirmed", "delivered", "cancelled"];
    if (!allowed.includes(status)) return res.status(400).json({ success: false, message: "Invalid status" });
    const doc = await PurchaseOrder.findByIdAndUpdate(id, { $set: { status } }, { new: true });
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};