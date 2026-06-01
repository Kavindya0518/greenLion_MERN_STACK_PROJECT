// BACKEND/Controllers/cart.controller.js
const Cart = require("../Models/cart.model");
const Product = require("../Models/product.model");
const FinishedProduct = require("../Models/FinishedProduct");

// Get user's cart
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("Getting cart for user:", userId);

    let cart = await Cart.findOne({ userId }).populate(
      "items.productId",
      "name unitPrice file discountPercent"
    );

    if (!cart) {
      console.log("No cart found, creating new cart");
      cart = new Cart({ userId, items: [] });
      await cart.save();
    } else {
      console.log("Found existing cart with", cart.items.length, "items");
      
      // Clean up any invalid items
      const originalLength = cart.items.length;
      cart.items = cart.items.filter(item => item.productId && item.quantity > 0);
      
      if (cart.items.length !== originalLength) {
        console.log(`Cleaned up ${originalLength - cart.items.length} invalid items`);
        await cart.save();
      }
      
      // Refresh cart prices to reflect current discounts
      await refreshCartPrices(userId);
      
      // Re-populate after cleanup and price refresh
      cart = await Cart.findOne({ userId }).populate("items.productId", "name unitPrice file discountPercent");
    }

    res.status(200).json({
      success: true,
      cart,
      totalItems: cart.totalItems,
      totalAmount: cart.totalAmount,
    });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ success: false, message: "Failed to get cart", error: error.message });
  }
};

// Helper function to check stock availability
const checkStockAvailability = async (product, requestedQuantity, currentCartQuantity = 0) => {
  // If product doesn't have an inventory item code, we can't check stock
  if (!product.inventoryItemCode) {
    return {
      available: false,
      message: "This product is not available for purchase (no inventory link)",
      currentStock: 0
    };
  }

  // Find the finished product by inventory item code
  const itemCode = String(product.inventoryItemCode).toUpperCase();
  const finishedProduct = await FinishedProduct.findOne({ 
    itemCode: new RegExp(`^${itemCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') 
  });

  if (!finishedProduct) {
    return {
      available: false,
      message: "This product is not available for purchase (no stock record)",
      currentStock: 0
    };
  }

  const availableStock = Number(finishedProduct.quantity || 0);
  const totalRequestedQuantity = requestedQuantity + currentCartQuantity;

  if (availableStock <= 0) {
    return {
      available: false,
      message: "This product is currently out of stock",
      currentStock: 0
    };
  }

  if (totalRequestedQuantity > availableStock) {
    return {
      available: false,
      message: `Only ${availableStock} units available in stock`,
      currentStock: availableStock
    };
  }

  return {
    available: true,
    message: "Stock available",
    currentStock: availableStock
  };
};

// Add item to cart
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) cart = new Cart({ userId, items: [] });

    const idx = cart.items.findIndex((i) => i.productId.toString() === productId);
    const currentCartQuantity = idx > -1 ? cart.items[idx].quantity : 0;

    // Check stock availability
    const stockCheck = await checkStockAvailability(product, parseInt(quantity, 10), currentCartQuantity);
    if (!stockCheck.available) {
      return res.status(400).json({ 
        success: false, 
        message: stockCheck.message,
        availableStock: stockCheck.currentStock
      });
    }

    // Calculate discounted price
    const discountedPrice = product.discountPercent > 0 
      ? product.unitPrice * (1 - product.discountPercent / 100)
      : product.unitPrice;
    
    if (idx > -1) {
      cart.items[idx].quantity += parseInt(quantity, 10);
      // Update price in case discount changed
      cart.items[idx].price = discountedPrice;
    } else {
      cart.items.push({
        productId,
        quantity: parseInt(quantity, 10),
        price: discountedPrice,
      });
    }

    await cart.save();
    await cart.populate("items.productId", "name unitPrice file discountPercent");

    res.status(200).json({
      success: true,
      message: "Item added to cart successfully",
      cart,
      totalItems: cart.totalItems,
      totalAmount: cart.totalAmount,
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to add item to cart", error: error.message });
  }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ success: false, message: "Quantity must be at least 1" });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    const idx = cart.items.findIndex((i) => i.productId.toString() === productId);
    if (idx === -1)
      return res.status(404).json({ success: false, message: "Item not found in cart" });

    // Get product to recalculate discounted price
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Check stock availability (we pass 0 as currentCartQuantity since we're replacing the quantity, not adding to it)
    const stockCheck = await checkStockAvailability(product, parseInt(quantity, 10), 0);
    if (!stockCheck.available) {
      return res.status(400).json({ 
        success: false, 
        message: stockCheck.message,
        availableStock: stockCheck.currentStock
      });
    }

    // Calculate discounted price
    const discountedPrice = product.discountPercent > 0 
      ? product.unitPrice * (1 - product.discountPercent / 100)
      : product.unitPrice;

    cart.items[idx].quantity = parseInt(quantity, 10);
    cart.items[idx].price = discountedPrice; // Update with current discounted price
    await cart.save();
    await cart.populate("items.productId", "name unitPrice file discountPercent");

    res.status(200).json({
      success: true,
      message: "Cart item updated successfully",
      cart,
      totalItems: cart.totalItems,
      totalAmount: cart.totalAmount,
    });
  } catch (error) {
    console.error("Update cart item error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update cart item", error: error.message });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    cart.items = cart.items.filter((i) => i.productId.toString() !== productId);

    await cart.save();
    await cart.populate("items.productId", "name unitPrice file discountPercent");

    res.status(200).json({
      success: true,
      message: "Item removed from cart successfully",
      cart,
      totalItems: cart.totalItems,
      totalAmount: cart.totalAmount,
    });
  } catch (error) {
    console.error("Remove from cart error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to remove item from cart", error: error.message });
  }
};

// Clear entire cart
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      cart,
      totalItems: 0,
      totalAmount: 0,
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({ success: false, message: "Failed to clear cart", error: error.message });
  }
};

// Helper function to refresh cart prices based on current product prices/discounts
const refreshCartPrices = async (userId) => {
  try {
    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) return;

    let updated = false;
    for (let i = 0; i < cart.items.length; i++) {
      const item = cart.items[i];
      const product = await Product.findById(item.productId);
      
      if (product) {
        const discountedPrice = product.discountPercent > 0 
          ? product.unitPrice * (1 - product.discountPercent / 100)
          : product.unitPrice;
        
        if (item.price !== discountedPrice) {
          cart.items[i].price = discountedPrice;
          updated = true;
        }
      }
    }

    if (updated) {
      await cart.save();
      console.log(`Updated cart prices for user ${userId}`);
    }
  } catch (error) {
    console.error('Error refreshing cart prices:', error);
  }
};

// Get cart item count
const getCartCount = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("Getting cart count for user:", userId);
    
    let cart = await Cart.findOne({ userId });
    console.log("Found cart:", cart ? `with ${cart.items.length} items` : "no cart found");
    
    // If cart exists, ensure it's clean (no invalid items)
    if (cart && cart.items.length > 0) {
      // Filter out any items that might be invalid
      const validItems = cart.items.filter(item => item.productId && item.quantity > 0);
      if (validItems.length !== cart.items.length) {
        console.log(`Cleaning up cart - removing ${cart.items.length - validItems.length} invalid items`);
        cart.items = validItems;
        await cart.save();
        // Recalculate after cleanup
        cart = await Cart.findOne({ userId });
      }
    }
    
    const totalItems = cart ? cart.totalItems : 0;
    console.log("Total items calculated:", totalItems);
    
    // Double check calculation
    if (cart) {
      const manualCount = cart.items.reduce((total, item) => total + item.quantity, 0);
      console.log("Manual count verification:", manualCount);
      if (manualCount !== totalItems) {
        console.warn("Count mismatch! Virtual:", totalItems, "Manual:", manualCount);
      }
    }

    res.status(200).json({ success: true, totalItems });
  } catch (error) {
    console.error("Get cart count error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to get cart count", error: error.message });
  }
};

// Cleanup invalid cart items
const cleanupCart = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("Cleaning up cart for user:", userId);
    
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.json({ success: true, message: "No cart found", itemsRemoved: 0 });
    }

    const originalCount = cart.items.length;
    // Remove items with null/invalid productId or invalid quantity
    cart.items = cart.items.filter(item => item.productId && item.quantity > 0);
    const itemsRemoved = originalCount - cart.items.length;
    
    if (itemsRemoved > 0) {
      await cart.save();
      console.log(`Removed ${itemsRemoved} invalid items from cart`);
    }

    res.json({ 
      success: true, 
      message: `Cleaned up cart - removed ${itemsRemoved} invalid items`,
      itemsRemoved,
      totalItems: cart.totalItems
    });
  } catch (error) {
    console.error("Cleanup cart error:", error);
    res.status(500).json({ success: false, message: "Failed to cleanup cart", error: error.message });
  }
};

// Debug function to check all carts (remove in production)
const debugAllCarts = async (req, res) => {
  try {
    const carts = await Cart.find({}).populate("items.productId", "name");
    console.log("=== ALL CARTS DEBUG ===");
    carts.forEach(cart => {
      console.log(`User ${cart.userId}: ${cart.items.length} items, totalItems: ${cart.totalItems}`);
      cart.items.forEach(item => {
        console.log(`  - Product: ${item.productId?.name || 'MISSING'}, Qty: ${item.quantity}`);
      });
    });
    res.json({ success: true, carts: carts.length, data: carts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartCount,
  cleanupCart,
  refreshCartPrices,
  checkStockAvailability,
  debugAllCarts, // Remove in production
};
