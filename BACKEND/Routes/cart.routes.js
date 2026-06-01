const express = require("express");
const { customerOnly } = require("../Middlewares/customerAuth");
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartCount,
  cleanupCart,
  debugAllCarts
} = require("../Controllers/cart.controller");

const router = express.Router();

// All cart routes require customer authentication
router.use(customerOnly);

// @route   GET /api/cart
// @desc    Get user's cart
// @access  Private (Customer)
router.get("/", getCart);

// @route   GET /api/cart/count
// @desc    Get cart items count for navbar badge
// @access  Private (Customer)
router.get("/count", getCartCount);

// @route   POST /api/cart/add
// @desc    Add item to cart
// @access  Private (Customer)
router.post("/add", addToCart);

// @route   PUT /api/cart/update
// @desc    Update cart item quantity
// @access  Private (Customer)
router.put("/update", updateCartItem);

// @route   DELETE /api/cart/remove/:productId
// @desc    Remove item from cart
// @access  Private (Customer)
router.delete("/remove/:productId", removeFromCart);

// @route   DELETE /api/cart/clear
// @desc    Clear entire cart
// @access  Private (Customer)
router.delete("/clear", clearCart);

// @route   POST /api/cart/cleanup
// @desc    Remove invalid items from cart
// @access  Private (Customer)
router.post("/cleanup", cleanupCart);

// @route   GET /api/cart/debug
// @desc    Debug all carts (remove in production)
// @access  Private (Customer)
router.get("/debug", debugAllCarts);

module.exports = router;