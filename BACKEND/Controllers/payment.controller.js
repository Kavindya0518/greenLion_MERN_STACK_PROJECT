const Payment = require("../Models/payment.model");
const Order = require("../Models/order.model");
const orderCtrl = require("./order.controller");

// Get user's payments
const getUserPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { customerId: userId };
    if (status) {
      query.status = status;
    }

    const payments = await Payment.find(query)
      .populate('orderId', 'orderNumber totalAmount')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalPayments = await Payment.countDocuments(query);

    res.status(200).json({
      success: true,
      payments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPayments / parseInt(limit)),
        totalPayments,
        hasNext: parseInt(page) < Math.ceil(totalPayments / parseInt(limit)),
        hasPrev: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Get user payments error:", error);
    res.status(500).json({ success: false, message: "Failed to get payments", error: error.message });
  }
};

// Get payment details (for the logged-in user)
const getPaymentDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { paymentId } = req.params;

    const payment = await Payment.findOne({ _id: paymentId, customerId: userId })
      .populate('orderId', 'orderNumber totalAmount items status')
      .populate('customerId', 'name email');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.status(200).json({ success: true, payment });
  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({ success: false, message: 'Failed to get payment details', error: error.message });
  }
};

// Resubmit payment (for rejected offline payments)
const resubmitPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { paymentId } = req.params;
    const { bankSlipImage, customerNote } = req.body;

    const payment = await Payment.findOne({ _id: paymentId, customerId: userId });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    if (payment.status !== 'rejected') {
      return res.status(400).json({ success: false, message: 'Only rejected payments can be resubmitted' });
    }

    payment.offlinePayment = payment.offlinePayment || {};
    payment.offlinePayment.bankSlipImage = bankSlipImage;
    payment.offlinePayment.customerNote = customerNote;
    payment.updateStatus('pending', userId, 'Payment resubmitted by customer');
    await payment.save();

    res.status(200).json({ success: true, message: 'Payment resubmitted successfully', payment });
  } catch (error) {
    console.error('Resubmit payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to resubmit payment', error: error.message });
  }
};

// Admin: get all payments
const getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, paymentType, search } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (paymentType && paymentType !== 'all') query.paymentType = paymentType;

    if (search && search.trim()) {
      query.$or = [{ paymentNumber: { $regex: search, $options: 'i' } }];
    }

    const payments = await Payment.find(query)
      .populate({ path: 'customerId', select: 'name email phoneNumber', options: { strictPopulate: false } })
      .populate({ path: 'orderId', select: 'orderNumber totalAmount status', options: { strictPopulate: false } })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const totalPayments = await Payment.countDocuments(query);
    res.status(200).json({
      success: true,
      payments: payments || [],
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPayments / parseInt(limit)),
        totalPayments,
        hasNext: parseInt(page) < Math.ceil(totalPayments / parseInt(limit)),
        hasPrev: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({ success: false, message: 'Failed to get payments', error: error.message });
  }
};

// Admin: approve payment and commit finished-product stock
const approvePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { adminNote } = req.body;
    const adminId = req.user.id;

    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    if (payment.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending payments can be approved' });
    }

    payment.updateStatus('confirmed', adminId, adminNote || 'Payment approved by admin');
    await payment.save();

    // Update related order status and commit stock for finished products
    let order = await Order.findById(payment.orderId);
    if (order && order.status === 'pending') {
      order.updateStatus('confirmed', adminId, 'Payment confirmed');
      try {
        const result = await orderCtrl.commitOrderStock(order, adminId);
        order.meta = { ...(order.meta || {}), ...result };
      } catch (e) {
        console.warn('Commit order stock on payment approval failed:', e?.message || e);
      }
      await order.save();
      order = await Order.findById(order._id).populate('customerId', 'name email');
    }

    await payment.populate('customerId', 'name email');
    await payment.populate('orderId', 'orderNumber');

    res.status(200).json({ success: true, message: 'Payment approved successfully', payment, order: order || null, commits: order?.meta || undefined });
  } catch (error) {
    console.error('Approve payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve payment', error: error.message });
  }
};

// Reject payment (admin only)
const rejectPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { rejectionReason, adminNote } = req.body;
    const adminId = req.user.id;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required"
      });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: "Only pending payments can be rejected"
      });
    }

    // Update payment status
    payment.updateStatus('rejected', adminId, rejectionReason);
    if (adminNote) {
      payment.addAdminNote(adminNote, adminId);
    }
    await payment.save();

    // Update related order status to cancelled when payment is rejected
    const order = await Order.findById(payment.orderId);
    if (order && (order.status === 'pending' || order.status === 'confirmed')) {
      order.updateStatus('cancelled', adminId, `Order cancelled due to payment rejection: ${rejectionReason}`);
      await order.save();
    }

    await payment.populate('customerId', 'name email');
    await payment.populate('orderId', 'orderNumber');

    res.status(200).json({
      success: true,
      message: "Payment rejected successfully",
      payment: payment
    });

  } catch (error) {
    console.error("Reject payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject payment",
      error: error.message
    });
  }
};

// Get payment statistics (admin only)
const getPaymentStats = async (req, res) => {
  try {
    const stats = await Payment.aggregate([
      {
        $group: {
          _id: {
            status: '$status',
            paymentType: '$paymentType'
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const totalPayments = await Payment.countDocuments();
    const pendingPayments = await Payment.countDocuments({ status: 'pending' });
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        statusBreakdown: stats,
        totalPayments: totalPayments,
        pendingPayments: pendingPayments,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });

  } catch (error) {
    console.error("Get payment stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get payment statistics",
      error: error.message
    });
  }
};

// Get bank slip image (admin only)
const getBankSlipImage = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    if (!payment.offlinePayment || !payment.offlinePayment.bankSlipImage) {
      return res.status(404).json({
        success: false,
        message: "Bank slip image not found"
      });
    }

    res.status(200).json({
      success: true,
      bankSlipImage: payment.offlinePayment.bankSlipImage,
      customerNote: payment.offlinePayment.customerNote
    });

  } catch (error) {
    console.error("Get bank slip image error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get bank slip image",
      error: error.message
    });
  }
};

module.exports = {
  getUserPayments,
  getPaymentDetails,
  resubmitPayment,
  // Admin functions
  getAllPayments,
  approvePayment,
  rejectPayment,
  getPaymentStats,
  getBankSlipImage
};