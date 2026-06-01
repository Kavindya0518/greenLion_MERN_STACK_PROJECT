// BACKEND/Controllers/supplierSelf.controller.js
const Supplier = require("../Models/supplier.model");
const Order = require("../Models/supplierOrder.model");
const PurchaseOrder = require("../Models/PurchaseOrder");
const SupplierMaterial = require("../Models/SupplierMaterial");
const MaterialCategory = require("../Models/materialCategory.model");
const RawMaterial = require("../Models/RawMaterial");
const StockTransaction = require("../Models/StockTransaction");
const Delivery = require("../Models/Delivery");

exports.getProfile = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({ user: req.user.id });
    if (!supplier) return res.status(404).json({ ok: false, message: "Supplier profile not found" });
    res.json({ ok: true, supplier });
  } catch (e) { next(e); }
};

// Supplier manages own raw materials with prices/discount
exports.listMyMaterials = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({ user: req.user.id });
    if (!supplier) return res.status(404).json({ ok: false, message: "Supplier profile not found" });
    const items = await SupplierMaterial.find({ supplierId: supplier._id }).sort({ updatedAt: -1 });
    res.json({ ok: true, items });
  } catch (e) { next(e); }
};

exports.createMaterial = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({ user: req.user.id });
    if (!supplier) return res.status(404).json({ ok: false, message: "Supplier profile not found" });
    const price = Number(req.body.price);
    const discountPercent = Number(req.body.discountPercent || 0);
    const finalPrice = Math.max(0, Math.round((price - (price * discountPercent / 100)) * 100) / 100);
    // Resolve category and generate next material code for that category
    const categoryId = req.body.categoryId || null;
    if (!categoryId) return res.status(400).json({ ok: false, message: "categoryId is required" });
    const cat = await MaterialCategory.findById(categoryId);
    if (!cat) return res.status(400).json({ ok: false, message: "Category not found" });
    const catCode = String(cat.code || '').toUpperCase();
    if (!catCode) return res.status(400).json({ ok: false, message: "Category code missing. Ask admin to recreate the category." });

    // Find next sequence for this category (e.g., CP001-001)
    let seq = 1;
    const latest = await SupplierMaterial.find({ categoryId }).sort({ materialCode: -1 }).limit(1);
    if (latest[0]?.materialCode) {
      const m = String(latest[0].materialCode).match(/^(.*?)-(\d{3})$/);
      if (m && m[1] === catCode) seq = Number(m[2]) + 1;
    }
    // ensure uniqueness loop (rare collisions)
    let materialCode = `${catCode}-${String(seq).padStart(3, '0')}`;
    // If latest had different prefix, compute based on count of same prefix
    const existsSamePrefix = await SupplierMaterial.find({ categoryId, materialCode: new RegExp(`^${catCode}-\\d{3}$`, 'i') }).countDocuments();
    if (existsSamePrefix >= seq) materialCode = `${catCode}-${String(existsSamePrefix + 1).padStart(3, '0')}`;
    while (await SupplierMaterial.findOne({ materialCode })) {
      seq += 1;
      materialCode = `${catCode}-${String(seq).padStart(3, '0')}`;
    }

    const doc = await SupplierMaterial.create({
      supplierId: supplier._id,
      supplierName: supplier.name,
      materialCode,
      name: String(req.body.name || '').trim(),
      categoryId,
      unit: req.body.unit,
      price,
      discountPercent,
      finalPrice,
      minimumOrderQty: Number(req.body.minimumOrderQty || 0),
      leadTimeDays: Number(req.body.leadTimeDays || 0),
      available: req.body.available !== undefined ? !!req.body.available : true,
    });
    res.status(201).json({ ok: true, item: doc });
  } catch (e) { next(e); }
};

exports.updateMaterial = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({ user: req.user.id });
    if (!supplier) return res.status(404).json({ ok: false, message: "Supplier profile not found" });
    const doc = await SupplierMaterial.findOne({ _id: req.params.id, supplierId: supplier._id });
    if (!doc) return res.status(404).json({ ok: false, message: "Material not found" });
    // materialCode is system-generated; do not allow changing via update
    if (req.body.name !== undefined) doc.name = String(req.body.name || '').trim();
    if (req.body.categoryId !== undefined) doc.categoryId = req.body.categoryId || null;
    if (req.body.unit !== undefined) doc.unit = req.body.unit;
    if (req.body.price !== undefined) doc.price = Number(req.body.price);
    if (req.body.discountPercent !== undefined) doc.discountPercent = Number(req.body.discountPercent || 0);
    if (req.body.minimumOrderQty !== undefined) doc.minimumOrderQty = Number(req.body.minimumOrderQty || 0);
    if (req.body.leadTimeDays !== undefined) doc.leadTimeDays = Number(req.body.leadTimeDays || 0);
    if (req.body.available !== undefined) doc.available = !!req.body.available;
    // recalc final price
    const price = Number(doc.price || 0);
    const discountPercent = Number(doc.discountPercent || 0);
    doc.finalPrice = Math.max(0, Math.round((price - (price * discountPercent / 100)) * 100) / 100);
    await doc.save();
    res.json({ ok: true, item: doc });
  } catch (e) { next(e); }
};

exports.deleteMaterial = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({ user: req.user.id });
    if (!supplier) return res.status(404).json({ ok: false, message: "Supplier profile not found" });
    const doc = await SupplierMaterial.findOne({ _id: req.params.id, supplierId: supplier._id });
    if (!doc) return res.status(404).json({ ok: false, message: "Material not found" });
    await doc.deleteOne();
    res.json({ ok: true, message: "Material deleted" });
  } catch (e) { next(e); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOneAndUpdate(
      { user: req.user.id },
      {
        name: req.body.name,
        contactPerson: req.body.contactPerson,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        category: req.body.category,
        status: req.body.status,
      },
      { new: true, runValidators: true }
    );
    if (!supplier) return res.status(404).json({ ok: false, message: "Supplier profile not found" });
    res.json({ ok: true, supplier });
  } catch (e) { next(e); }
};

exports.listOrders = async (req, res, next) => {
  // Legacy: list supplier-created orders (not admin purchase orders)
  try {
    const supplier = await Supplier.findOne({ user: req.user.id });
    if (!supplier) return res.status(404).json({ ok: false, message: "Supplier profile not found" });
    const orders = await Order.find({ supplier: supplier._id }).sort({ createdAt: -1 });
    res.json({ ok: true, orders });
  } catch (e) { next(e); }
};

// Generate sequential Order ID (ORD-001, ORD-002, etc.)
async function generateSequentialOrderId() {
  try {
    // Find the latest order ID across ALL orders
    const latest = await Order.findOne()
      .sort({ orderId: -1 })
      .limit(1);
    
    let nextNum = 1;
    if (latest?.orderId) {
      const match = latest.orderId.match(/^ORD-(\d{3})$/i);
      if (match) nextNum = Number(match[1]) + 1;
    }
    
    const orderId = `ORD-${String(nextNum).padStart(3, '0')}`;
    
    // Ensure uniqueness (handle race conditions)
    const exists = await Order.findOne({ orderId });
    if (exists) {
      return `ORD-${String(nextNum + 1).padStart(3, '0')}`;
    }
    
    return orderId;
  } catch (error) {
    console.error('Error generating Order ID:', error);
    // Fallback to timestamp-based ID
    return `ORD-${Date.now().toString().slice(-6)}`;
  }
}

// Create a supplier-created order (legacy flow used by SupplierPortal)
exports.createOrder = async (req, res, next) => {
  try {
    console.log("=== CREATE ORDER DEBUG ===");
    console.log("User ID:", req.user.id);
    console.log("Request body:", req.body);
    
    const supplier = await Supplier.findOne({ user: req.user.id });
    console.log("Supplier found:", !!supplier);
    if (!supplier) return res.status(404).json({ ok: false, message: "Supplier profile not found" });

    // Generate sequential Order ID
    const orderId = await generateSequentialOrderId();
    console.log("Generated Order ID:", orderId);

    // Calculate totals and delivery date
    const quantity = Number(req.body.amount);
    const unitPrice = Number(req.body.price);
    const originalTotal = quantity * unitPrice;
    
    // Calculate discounted total based on offer
    let discountedTotal = originalTotal;
    const offerText = String(req.body.offers || "").trim();
    
    if (offerText) {
      // Check if it's a percentage discount (e.g., "10%", "10% off")
      const percentMatch = offerText.match(/(\d+(?:\.\d+)?)\s*%/i);
      if (percentMatch) {
        const discountPercent = Number(percentMatch[1]);
        discountedTotal = originalTotal * (1 - discountPercent / 100);
      } else {
        // Check if it's a fixed amount discount (e.g., "Rs. 500", "500 off")
        const amountMatch = offerText.match(/(?:rs\.?\s*)?(\d+(?:\.\d+)?)/i);
        if (amountMatch) {
          const discountAmount = Number(amountMatch[1]);
          discountedTotal = Math.max(0, originalTotal - discountAmount);
        }
      }
    }

    // Calculate expected delivery date from delivery days
    const deliveryWithinDays = Number(req.body.deliveryWithinDays);
    console.log("Delivery within days:", deliveryWithinDays);
    
    if (!deliveryWithinDays || deliveryWithinDays <= 0) {
      return res.status(400).json({ ok: false, message: "Delivery within days must be a positive number" });
    }
    
    const expectedDeliveryDate = new Date();
    expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + deliveryWithinDays);

    const orderData = {
      orderId,
      supplier: supplier._id,
      category: req.body.category,
      amount: quantity,
      price: unitPrice,
      canDeliver: !!req.body.canDeliver,
      note: req.body.note || "",
      submissionDate: req.body.submissionDate || Date.now(),
      expectedDeliveryDate,
      deliveryWithinDays,
      offers: offerText,
      originalTotal,
      discountedTotal,
      status: req.body.status || "new"
    };
    
    console.log("Order data to create:", orderData);

    const order = await Order.create(orderData);
    console.log("Order created successfully:", order._id);

    res.status(201).json({ ok: true, order });
  } catch (e) { 
    console.error("CREATE ORDER ERROR:", e);
    next(e); 
  }
};

// Update a supplier-created order (blocked if already confirmed/completed)
exports.updateOrder = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({ user: req.user.id });
    if (!supplier) return res.status(404).json({ ok: false, message: "Supplier profile not found" });

    const order = await Order.findOne({ _id: req.params.id, supplier: supplier._id });
    if (!order) return res.status(404).json({ ok: false, message: "Order not found" });

    if (["confirmed", "completed"].includes(order.status)) {
      return res.status(400).json({ ok: false, message: "Confirmed/completed orders cannot be edited" });
    }

    if (req.body.category !== undefined) order.category = String(req.body.category).trim();
    if (req.body.amount !== undefined) order.amount = Number(req.body.amount);
    if (req.body.price !== undefined) order.price = Number(req.body.price);
    if (req.body.canDeliver !== undefined) order.canDeliver = !!req.body.canDeliver;
    if (req.body.note !== undefined) order.note = String(req.body.note || "");
    if (req.body.offers !== undefined) order.offers = String(req.body.offers || "");
    if (req.body.deliveryWithinDays !== undefined) {
      order.deliveryWithinDays = Number(req.body.deliveryWithinDays);
      // Recalculate expected delivery date
      const expectedDeliveryDate = new Date();
      expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + order.deliveryWithinDays);
      order.expectedDeliveryDate = expectedDeliveryDate;
    }

    // Recalculate totals if quantity, price, or offers changed
    if (req.body.amount !== undefined || req.body.price !== undefined || req.body.offers !== undefined) {
      const quantity = order.amount;
      const unitPrice = order.price;
      const originalTotal = quantity * unitPrice;
      order.originalTotal = originalTotal;
      
      // Calculate discounted total based on offer
      let discountedTotal = originalTotal;
      const offerText = String(order.offers || "").trim();
      
      if (offerText) {
        // Check if it's a percentage discount (e.g., "10%", "10% off")
        const percentMatch = offerText.match(/(\d+(?:\.\d+)?)\s*%/i);
        if (percentMatch) {
          const discountPercent = Number(percentMatch[1]);
          discountedTotal = originalTotal * (1 - discountPercent / 100);
        } else {
          // Check if it's a fixed amount discount (e.g., "Rs. 500", "500 off")
          const amountMatch = offerText.match(/(?:rs\.?\s*)?(\d+(?:\.\d+)?)/i);
          if (amountMatch) {
            const discountAmount = Number(amountMatch[1]);
            discountedTotal = Math.max(0, originalTotal - discountAmount);
          }
        }
      }
      order.discountedTotal = discountedTotal;
    }

    await order.save();
    res.json({ ok: true, order });
  } catch (e) { next(e); }
};

// NEW — delete own order (only if not confirmed/completed)
exports.deleteOrder = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({ user: req.user.id });
    if (!supplier) return res.status(404).json({ ok: false, message: "Supplier profile not found" });

    const order = await Order.findOne({ _id: req.params.id, supplier: supplier._id });
    if (!order) return res.status(404).json({ ok: false, message: "Order not found" });

    if (["confirmed", "completed"].includes(order.status)) {
      return res.status(400).json({ ok: false, message: "Confirmed/completed orders cannot be deleted" });
    }

    await order.deleteOne();
    res.json({ ok: true, message: "Order deleted" });
  } catch (e) { next(e); }
};

// Supplier-facing: list admin Purchase Orders assigned to this supplier
exports.listPurchaseOrders = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({ user: req.user.id });
    if (!supplier) return res.status(404).json({ ok: false, message: "Supplier profile not found" });
    const pos = await PurchaseOrder.find({ supplierId: supplier._id })
      .sort({ createdAt: -1 });
    res.json({ ok: true, purchaseOrders: pos });
  } catch (e) { next(e); }
};

exports.getPurchaseOrder = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({ user: req.user.id });
    if (!supplier) return res.status(404).json({ ok: false, message: "Supplier profile not found" });
    const po = await PurchaseOrder.findOne({ _id: req.params.id, supplierId: supplier._id });
    if (!po) return res.status(404).json({ ok: false, message: "Purchase order not found" });
    res.json({ ok: true, purchaseOrder: po });
  } catch (e) { next(e); }
};

// Supplier can update their purchase order status to Accepted/Delivered
exports.setPurchaseOrderStatus = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({ user: req.user.id });
    if (!supplier) return res.status(404).json({ ok: false, message: "Supplier profile not found" });
    const po = await PurchaseOrder.findOne({ _id: req.params.id, supplierId: supplier._id });
    if (!po) return res.status(404).json({ ok: false, message: "Purchase order not found" });

    const { status } = req.body || {};
    // Map supplier-facing statuses to internal PO statuses
    const map = { Accepted: "confirmed", Delivered: "delivered" };
    const nextStatus = map[status];
    if (!nextStatus) return res.status(400).json({ ok: false, message: "Status must be one of: Accepted, Delivered" });

    // Do NOT update inventory here. Inventory will be updated when admin confirms the delivery
    // via deliveries receive endpoint. Keep this section intentionally disabled.

    po.status = nextStatus;
    await po.save();

    // Auto-create Delivery record as pending when supplier marks delivered
    if (nextStatus === "delivered") {
      try {
        const existing = await Delivery.findOne({ poId: po._id });
        if (!existing) {
          await Delivery.create({
            poId: po._id,
            supplierId: supplier._id,
            supplierName: supplier.name,
            items: (po.items || []).map(it => ({
              materialCode: String(it.materialCode || it.itemCode || "").toUpperCase().trim(),
              qtyDelivered: Math.max(0, Number(it.qty || it.quantity || 0)),
              batchNo: ''
            })),
            status: 'pending',
          });
        }
      } catch (_) {}
    }

    res.json({ ok: true, purchaseOrder: po });
  } catch (e) { next(e); }
};

// POST /supplier-self/orders/:id/accept - Supplier accepts admin-confirmed order
exports.acceptOrder = async (req, res, next) => {
  try {
    console.log("=== ACCEPT ORDER DEBUG ===");
    console.log("User ID:", req.user?.id);
    console.log("Order ID:", req.params.id);
    
    const supplier = await Supplier.findOne({ user: req.user.id });
    console.log("Supplier found:", !!supplier, supplier?._id);
    
    if (!supplier) return res.status(404).json({ ok: false, message: "Supplier profile not found" });

    const order = await Order.findOne({ _id: req.params.id, supplier: supplier._id });
    console.log("Order found:", !!order);
    console.log("Order status:", order?.status);
    
    if (!order) return res.status(404).json({ ok: false, message: "Order not found" });

    // Only orders with status "confirmed" (accepted by admin) can be accepted by supplier
    if (order.status !== "confirmed") {
      console.log("Order status is not 'confirmed', current status:", order.status);
      return res.status(400).json({ 
        ok: false, 
        message: `Cannot accept order. Current status: ${order.status}. Only admin-accepted orders (status: confirmed) can be accepted by supplier.` 
      });
    }

    // Update status to supplier_accepted
    order.status = "supplier_accepted";
    order.supplierAcceptedAt = new Date();
    await order.save();

    console.log("Order accepted successfully!");
    res.json({ ok: true, order, message: "Order accepted successfully" });
  } catch (e) {
    console.error("SUPPLIER ACCEPT ORDER error:", e);
    res.status(500).json({ ok: false, message: e.message || "Failed to accept order" });
  }
};

// POST /supplier-self/orders/:id/deliver - Supplier marks order as delivered
exports.deliverOrder = async (req, res, next) => {
  try {
    console.log("=== DELIVER ORDER DEBUG ===");
    console.log("User ID:", req.user?.id);
    console.log("Order ID:", req.params.id);
    
    const supplier = await Supplier.findOne({ user: req.user.id });
    console.log("Supplier found:", !!supplier, supplier?._id);
    
    if (!supplier) return res.status(404).json({ ok: false, message: "Supplier profile not found" });

    const order = await Order.findOne({ _id: req.params.id, supplier: supplier._id });
    console.log("Order found:", !!order);
    console.log("Order status:", order?.status);
    
    if (!order) return res.status(404).json({ ok: false, message: "Order not found" });

    // Only orders with status "supplier_accepted" can be marked as delivered
    if (order.status !== "supplier_accepted") {
      console.log("Order status is not 'supplier_accepted', current status:", order.status);
      return res.status(400).json({ 
        ok: false, 
        message: `Cannot mark as delivered. Current status: ${order.status}. Only accepted orders (status: supplier_accepted) can be marked as delivered.` 
      });
    }

    // Update status to delivered
    order.status = "delivered";
    order.deliveredAt = new Date();
    await order.save();

    console.log("Order marked as delivered successfully!");
    res.json({ ok: true, order, message: "Order marked as delivered successfully" });
  } catch (e) {
    console.error("SUPPLIER DELIVER ORDER error:", e);
    res.status(500).json({ ok: false, message: e.message || "Failed to mark as delivered" });
  }
};