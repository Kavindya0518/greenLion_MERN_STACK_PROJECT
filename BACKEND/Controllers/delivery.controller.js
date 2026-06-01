const Delivery = require("../Models/Delivery");
const PurchaseOrder = require("../Models/PurchaseOrder");
const RawMaterial = require("../Models/RawMaterial");
const StockTransaction = require("../Models/StockTransaction");

// List deliveries
const list = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, poId, supplierId } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (poId) query.poId = poId;
    if (supplierId) query.supplierId = supplierId;

    const deliveries = await Delivery.find(query)
      .populate('poId', 'poNumber supplierId totalAmount status')
      .populate('supplierId', 'name email contactPerson')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalDeliveries = await Delivery.countDocuments(query);

    res.status(200).json({
      success: true,
      deliveries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalDeliveries / parseInt(limit)),
        totalDeliveries,
        hasNext: parseInt(page) < Math.ceil(totalDeliveries / parseInt(limit)),
        hasPrev: parseInt(page) > 1,
      }
    });
  } catch (error) {
    console.error("List deliveries error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to list deliveries", 
      error: error.message 
    });
  }
};

// Create delivery record
const create = async (req, res) => {
  try {
    const { poId, items, files } = req.body;
    const supplierId = req.user.id;

    const purchaseOrder = await PurchaseOrder.findOne({ 
      _id: poId, 
      supplierId: supplierId 
    });
    
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found or access denied"
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one delivery item is required"
      });
    }

    const supplier = await require("../Models/supplier.model").findById(supplierId);
    
    const delivery = new Delivery({
      poId,
      supplierId,
      supplierName: supplier?.name,
      items,
      files: files || [],
      status: "pending"
    });

    await delivery.save();

    await delivery.populate([
      { path: 'poId', select: 'poNumber supplierId totalAmount status' },
      { path: 'supplierId', select: 'name email contactPerson' }
    ]);

    res.status(201).json({
      success: true,
      message: "Delivery record created successfully",
      delivery
    });

  } catch (error) {
    console.error("Create delivery error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create delivery", 
      error: error.message 
    });
  }
};

// Receive delivery (admin only)
const receive = async (req, res) => {
  try {
    const { id } = req.params;
    const { receivedBy, notes } = req.body;
    const adminId = req.user.id;

    const delivery = await Delivery.findById(id).populate('poId');
    
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: "Delivery not found"
      });
    }

    if (delivery.status === "received") {
      return res.status(400).json({
        success: false,
        message: "Delivery already received"
      });
    }

    const inventoryUpdates = [];
    const stockTransactions = [];

    for (const item of delivery.items) {
      try {
        const rawMaterial = await RawMaterial.findOne({ 
          materialCode: item.materialCode 
        });

        if (!rawMaterial) {
          console.warn(`Raw material not found for code: ${item.materialCode}`);
          continue;
        }

        const previousQuantity = rawMaterial.currentQuantity || 0;
        const newQuantity = previousQuantity + item.qtyDelivered;

        await RawMaterial.updateOne(
          { _id: rawMaterial._id },
          { 
            $set: { 
              currentQuantity: newQuantity,
              lastUpdated: new Date()
            } 
          }
        );

        inventoryUpdates.push({
          materialCode: item.materialCode,
          previousQuantity,
          newQuantity,
          deliveredQuantity: item.qtyDelivered
        });

        const stockTransaction = new StockTransaction({
          itemCode: item.materialCode,
          itemType: 'raw_material',
          transactionType: 'in',
          quantity: item.qtyDelivered,
          previousStock: previousQuantity,
          newStock: newQuantity,
          reason: 'delivery_received',
          referenceId: String(delivery._id),
          performedBy: adminId,
          timestamp: new Date(),
          notes: `Delivery from PO: ${delivery.poId?.poNumber}`
        });

        stockTransactions.push(stockTransaction);

      } catch (itemError) {
        console.error(`Error processing item ${item.materialCode}:`, itemError);
      }
    }

    if (stockTransactions.length > 0) {
      await StockTransaction.insertMany(stockTransactions);
    }

    delivery.status = "received";
    delivery.receivedBy = receivedBy || req.user.name;
    delivery.deliveredAt = new Date();

    await delivery.save();

    await updatePOStatusIfComplete(delivery.poId);

    res.status(200).json({
      success: true,
      message: "Delivery received successfully",
      delivery,
      inventoryUpdates,
      stockTransactionsCount: stockTransactions.length
    });

  } catch (error) {
    console.error("Receive delivery error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to receive delivery", 
      error: error.message 
    });
  }
};

const updatePOStatusIfComplete = async (poId) => {
  try {
    const deliveries = await Delivery.find({ poId });
    const totalDeliveries = deliveries.length;
    const receivedDeliveries = deliveries.filter(d => d.status === "received").length;

    if (totalDeliveries === receivedDeliveries && totalDeliveries > 0) {
      await PurchaseOrder.updateOne(
        { _id: poId },
        { $set: { status: "completed" } }
      );
    }
  } catch (error) {
    console.error("Error updating PO status:", error);
  }
};

module.exports = {
  list,
  create,
  receive
};
