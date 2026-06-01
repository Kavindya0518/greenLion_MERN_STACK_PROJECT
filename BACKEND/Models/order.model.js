// BACKEND/Models/order.model.js
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    // Order identification
    orderNumber: {
      type: String,
      required: [true, "Order number is required"],
      unique: true,
      default: function () {
        return `ORDER${Date.now()}`;
      },
    },

    // Customer information
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer ID is required"],
    },

    // Order items
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: [true, "Product ID is required"],
        },
        productName: {
          type: String,
          required: [true, "Product name is required"],
        },
        quantity: {
          type: Number,
          required: [true, "Quantity is required"],
          min: [1, "Quantity must be at least 1"],
        },
        unitPrice: {
          type: Number,
          required: [true, "Unit price is required"],
          min: [0, "Unit price cannot be negative"],
        },
        totalPrice: {
          type: Number,
          required: [true, "Total price is required"],
          min: [0, "Total price cannot be negative"],
        },
      },
    ],

    // Order totals
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },

    // Order status
    status: {
      type: String,
      enum: {
        values: ["pending", "confirmed", "packed", "handed_over", "delivered", "cancelled"],
        message:
          "Status must be one of: pending, confirmed, packed, handed_over, delivered, cancelled",
      },
      default: "pending",
    },

    // Delivery address information
    deliveryAddress: {
      fullName: { type: String, required: true, trim: true, maxlength: 100 },
      phoneNumber: { type: String, required: true, match: [/^[+]?[\d\s-()]+$/] },
      address: { type: String, required: true, trim: true, maxlength: 200 },
      city: { type: String, required: true, trim: true, maxlength: 50 },
      postalCode: { type: String, required: true, trim: true }, // keep flexible for LK
      additionalNotes: { type: String, trim: true, maxlength: 300 },
    },

    // Delivery company assignment (for admin use)
    deliveryCompany: {
      companyName: {
        type: String,
        enum: {
          values: ["DHL Express", "Ceylon Post", "Kapruka Delivery", "Pickme Delivery", "Custom"],
          message: "Please select a valid delivery company",
        },
      },
      customCompanyName: { type: String, trim: true },
      assignedAt: { type: Date },
      assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      trackingNumber: { type: String, trim: true },
    },

    // Payment reference
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },

    // Status tracking
    statusHistory: [
      {
        status: { type: String, required: true },
        updatedAt: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        note: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for total items count
orderSchema.virtual("totalItems").get(function () {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Method to update status with history
orderSchema.methods.updateStatus = function (newStatus, updatedBy, note) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    updatedBy,
    note: note || `Order status changed to ${newStatus}`,
  });
};

// Method to assign delivery company
orderSchema.methods.assignDeliveryCompany = function (
  companyName,
  trackingNumber,
  assignedBy,
  customName
) {
  this.deliveryCompany = {
    companyName,
    customCompanyName: customName || null,
    trackingNumber: trackingNumber || null,
    assignedAt: new Date(),
    assignedBy,
  };
};

// Pre-save middleware to generate order number
orderSchema.pre("save", async function (next) {
  if (this.isNew && !this.orderNumber) {
    try {
      const lastOrder = await this.constructor.findOne().sort({ createdAt: -1 });
      const orderCount = lastOrder
        ? parseInt(String(lastOrder.orderNumber).replace("ORDER", "")) + 1
        : 1;
      this.orderNumber = `ORDER${orderCount}`;
    } catch (error) {
      this.orderNumber = `ORDER${Date.now()}`;
    }
  }
  next();
});

// Indexes
orderSchema.index({ customerId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);
