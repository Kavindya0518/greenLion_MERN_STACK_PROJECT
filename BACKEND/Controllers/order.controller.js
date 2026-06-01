const Order = require("../Models/order.model");
const Cart = require("../Models/cart.model");
const Payment = require("../Models/payment.model");
const Product = require("../Models/product.model");
const StockTransaction = require("../Models/StockTransaction");
const FinishedProduct = require("../Models/FinishedProduct");

// Create order from cart
const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { deliveryAddress, paymentData } = req.body;

    // Validate delivery address
    const requiredFields = ['fullName', 'phoneNumber', 'address', 'city', 'postalCode'];
    const missingFields = requiredFields.filter(field => !deliveryAddress[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Get user's cart
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty"
      });
    }

    // Validate all products still exist and have stock
    for (const item of cart.items) {
      if (!item.productId) {
        return res.status(400).json({
          success: false,
          message: "Some products in cart are no longer available"
        });
      }
    }

    // Prepare order items
    const orderItems = cart.items.map(item => ({
      productId: item.productId._id,
      productName: item.productId.name,
      quantity: item.quantity,
      unitPrice: item.price,
      totalPrice: item.price * item.quantity
    }));

    // Create order (pending)
    const order = new Order({
      customerId: userId,
      items: orderItems,
      totalAmount: cart.totalAmount,
      deliveryAddress: deliveryAddress,
      status: 'pending'
    });

    await order.save();

    // Reserve inventory for items that map to Inventory via product.inventoryItemCode (best effort)
    const warnings = [];
    for (const item of cart.items) {
      const invCode = item.productId?.inventoryItemCode;
      if (!invCode) continue;
      try {
        const invItem = await Inventory.findOne({ itemCode: invCode });
        if (!invItem) {
          warnings.push(`Inventory item not found for code ${invCode}`);
          continue;
        }
        const rAgg = await Reservation.aggregate([
          { $match: { itemCode: invCode, status: "active" } },
          { $group: { _id: null, qty: { $sum: "$quantity" } } },
        ]);
        const reservedQty = rAgg[0]?.qty || 0;
        const freeQty = Math.max(0, (invItem.currentQuantity || 0) - reservedQty);
        if (freeQty < item.quantity) {
          warnings.push(`Insufficient stock for ${invCode}. Free: ${freeQty}, need: ${item.quantity}`);
          continue;
        }
        await Reservation.create({
          itemId: invItem._id,
          itemCode: invCode,
          quantity: item.quantity,
          orderId: String(order._id),
          status: "active",
          reservedBy: req.user?.id,
        });
        // Log reservation transaction (informational)
        await StockTransaction.create({
          itemCode: invCode,
          transactionType: "reserve",
          quantity: item.quantity,
          remainingStock: invItem.currentQuantity,
          reason: "order_reservation",
          referenceId: String(order._id),
        });
      } catch (e) {
        warnings.push(`Reservation failed for ${invCode || item.productId?._id}: ${e?.message || e}`);
        continue;
      }
    }

    // Create payment record
    const payment = new Payment({
      orderId: order._id,
      customerId: userId,
      amount: order.totalAmount,
      paymentType: paymentData.paymentType,
      offlinePayment:
        paymentData.paymentType === 'offline'
          ? {
              bankSlipImage: paymentData.bankSlipImage,
              customerNote: paymentData.customerNote,
            }
          : undefined,
    });

    await payment.save();

    // Link payment to order
    order.paymentId = payment._id;
    await order.save();

    // Immediately commit stock so it works without admin tools/Postman
    // Note: Do NOT auto-commit here. Stock will be reduced only after admin confirms the order.

    // Clear cart after successful order
    cart.items = [];
    await cart.save();

    // Populate order for response
    await order.populate('customerId', 'name email');

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
      payment,
      warnings,
    });

  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ success: false, message: "Failed to create order", error: error.message });
  }
};

// Get user's orders
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { customerId: userId };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('paymentId')
      .populate('items.productId', 'name images')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalOrders = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalOrders / parseInt(limit)),
        totalOrders,
        hasNext: parseInt(page) < Math.ceil(totalOrders / parseInt(limit)),
        hasPrev: parseInt(page) > 1,
      }
    });
  } catch (error) {
    console.error("Get user orders error:", error);
    res.status(500).json({ success: false, message: "Failed to get orders", error: error.message });
  }
};

// Get single order details
const getOrderDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await Order.findOne({ _id: orderId, customerId: userId })
      .populate('paymentId')
      .populate('items.productId', 'name images price')
      .populate('customerId', 'name email');

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Get order details error:", error);
    res.status(500).json({ success: false, message: "Failed to get order details", error: error.message });
  }
};

// Update order status (admin only)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;
    const adminId = req.user.id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.updateStatus(status, adminId, note);

    // Reduce finished product stock when order is confirmed
    if (status === 'confirmed') {
      const { finishedCommits } = await commitOrderStock(order, adminId);
      order.meta = { ...(order.meta||{}), finishedCommits };
    }

    await order.save();
    await order.populate('customerId', 'name email');

    res.status(200).json({ success: true, message: "Order status updated successfully", order });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ success: false, message: "Failed to update order status", error: error.message });
  }
};

// Helper: reduce finished product stock when an order is confirmed
// Returns { finishedCommits }
async function commitOrderStock(order, performedBy) {
  const finishedCommits = [];
  for (const oi of (order.items || [])) {
    const prod = await Product.findById(oi.productId).lean();
    if (!prod || !prod.inventoryItemCode) continue;
    const code = String(prod.inventoryItemCode).toUpperCase();
    const rx = new RegExp(`^${code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    const fin = await FinishedProduct.findOne({ itemCode: rx });
    if (!fin) continue;
    const prev = Number(fin.quantity || 0);
    const qty = Math.max(0, Number(oi.quantity || 0));
    const next = Math.max(0, prev - qty);
    await FinishedProduct.updateOne(
      { _id: fin._id },
      { $set: { quantity: next, lastUpdated: new Date() } },
      { runValidators: false }
    );
    await StockTransaction.create({
      itemCode: fin.itemCode,
      itemType: 'finished_product',
      transactionType: 'out',
      quantity: qty,
      previousStock: prev,
      newStock: next,
      reason: 'order_confirmed',
      referenceId: String(order._id),
      performedBy,
      timestamp: new Date(),
    });
    finishedCommits.push({ itemCode: String(fin.itemCode).toUpperCase(), quantity: qty, newStock: next });
  }
  return { finishedCommits };
}

// Cancel order (only if pending) -> also cancel reservations
const cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findOne({ _id: orderId, customerId: userId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, message: "Only pending orders can be cancelled" });
    }

    order.updateStatus('cancelled', userId, reason || 'Cancelled by customer');
    await order.save();

    // No reservations used; nothing to release
    res.status(200).json({ success: true, message: "Order cancelled successfully", order });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ success: false, message: "Failed to cancel order", error: error.message });
  }
};

  // Assign delivery company (admin only)
  const assignDeliveryCompany = async (req, res) => {
    try {
      const { orderId } = req.params;
      const { companyName, customCompanyName, trackingNumber } = req.body;
      const adminId = req.user.id;

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }

      if (order.status !== 'packed') {
        return res.status(400).json({ success: false, message: "Only packed orders can be assigned to a delivery company" });
      }

      order.deliveryCompany = {
        companyName,
        customCompanyName,
        trackingNumber,
      };
      order.updateStatus('handed_over', adminId, `Order assigned to ${companyName}`);

      await order.save();
      await order.populate('customerId', 'name email');

      res.status(200).json({ success: true, message: "Delivery company assigned successfully", order });
    } catch (error) {
      console.error("Assign delivery company error:", error);
      res.status(500).json({ success: false, message: "Failed to assign delivery company", error: error.message });
    }
  };

const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    let query = {};
    if (status) {
      query.status = status;
    }

    // Search by order number or customer name
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        // We'll need to populate customer to search by name
      ];
    }

    const orders = await Order.find(query)
      .populate('customerId', 'name email phoneNumber')
      .populate('paymentId', 'status paymentType')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalOrders = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalOrders / parseInt(limit)),
        totalOrders,
        hasNext: parseInt(page) < Math.ceil(totalOrders / parseInt(limit)),
        hasPrev: parseInt(page) > 1,
      },
    });

  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({ success: false, message: "Failed to get orders", error: error.message });
  }
};

// Get order statistics (admin only)
const getOrderStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' } } }
    ]);

    const totalOrders = await Order.countDocuments();
    const totalRevenueAgg = await Order.aggregate([
      { $match: { status: { $nin: ['cancelled'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = totalRevenueAgg[0]?.total || 0;

    res.status(200).json({
      success: true,
      stats: {
        statusBreakdown: stats,
        totalOrders,
        totalRevenue,
      },
    });
  } catch (error) {
    console.error("Get order stats error:", error);
    res.status(500).json({ success: false, message: "Failed to get order statistics", error: error.message });
  }
};
module.exports = {
  createOrder,
  getUserOrders,
  getOrderDetails,
  cancelOrder,
  // Admin functions
  getAllOrders,
  updateOrderStatus,
  assignDeliveryCompany,
  getOrderStats,
  // Helpers
  commitOrderStock: commitOrderStock,
};