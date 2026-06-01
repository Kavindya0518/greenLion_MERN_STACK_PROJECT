// models/cart.model.js (CommonJS)
const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    // User who owns this cart
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      unique: true, // One cart per user
    },

    // Cart items
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: [true, "Product ID is required"],
        },
        quantity: {
          type: Number,
          required: [true, "Quantity is required"],
          min: [1, "Quantity must be at least 1"],
          default: 1,
        },
        price: {
          type: Number,
          required: [true, "Price is required"],
          min: [0, "Price cannot be negative"],
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Calculated totals
    totalAmount: {
      type: Number,
      default: 0,
      min: [0, "Total amount cannot be negative"],
    },

    // Track when the cart was last updated
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // auto adds createdAt + updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: count total items in cart
cartSchema.virtual("totalItems").get(function () {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Method: recalc total amount
cartSchema.methods.calculateTotal = function () {
  this.totalAmount = this.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  return this.totalAmount;
};

// Pre-save middleware: always update lastUpdated + recalc total
cartSchema.pre("save", function (next) {
  this.lastUpdated = Date.now();
  this.calculateTotal();
  next();
});

// Indexes for faster queries
cartSchema.index({ userId: 1 });
cartSchema.index({ "items.productId": 1 });

const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;
