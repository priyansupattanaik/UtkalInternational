const db = require("../models");
const CartItem = db.CartItem;
const Product = db.Product;
const ProductImage = db.ProductImage;

// Get user's cart
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cartItems = await CartItem.findAll({
      where: { userId },
      include: [
        {
          model: Product,
          include: [{ model: ProductImage }],
        },
      ],
    });

    // Calculate cart totals
    const cartTotal = cartItems.reduce((total, item) => {
      return total + parseFloat(item.price) * item.quantity;
    }, 0);

    const itemCount = cartItems.reduce((total, item) => {
      return total + item.quantity;
    }, 0);

    res.json({
      items: cartItems,
      total: cartTotal.toFixed(2),
      itemCount,
    });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ error: "Error retrieving cart" });
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    // Verify product exists and is active
    const product = await Product.findOne({
      where: { id: productId, status: "active" },
    });

    if (!product) {
      return res
        .status(404)
        .json({ error: "Product not found or unavailable" });
    }

    // Check if enough stock
    if (product.stock < quantity) {
      return res.status(400).json({ error: "Not enough stock available" });
    }

    // Check if item already in cart
    const existingCartItem = await CartItem.findOne({
      where: { userId, productId },
    });

    if (existingCartItem) {
      // Update quantity of existing item
      const newQuantity = existingCartItem.quantity + quantity;

      // Check if new quantity exceeds stock
      if (newQuantity > product.stock) {
        return res
          .status(400)
          .json({ error: "Cannot add more than available stock" });
      }

      await existingCartItem.update({
        quantity: newQuantity,
        price: product.price, // Update price in case it changed
      });

      return res.json({
        message: "Cart updated successfully",
        item: existingCartItem,
      });
    }

    // Create new cart item
    const newCartItem = await CartItem.create({
      userId,
      productId,
      quantity,
      price: product.price,
    });

    res.status(201).json({
      message: "Item added to cart",
      item: newCartItem,
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ error: "Error adding item to cart" });
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ error: "Quantity must be at least 1" });
    }

    // Find cart item
    const cartItem = await CartItem.findOne({
      where: { id: itemId, userId },
    });

    if (!cartItem) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    // Check product stock
    const product = await Product.findByPk(cartItem.productId);

    if (!product || product.status !== "active") {
      return res.status(400).json({ error: "Product is no longer available" });
    }

    if (quantity > product.stock) {
      return res
        .status(400)
        .json({ error: "Cannot add more than available stock" });
    }

    // Update cart item
    await cartItem.update({
      quantity,
      price: product.price, // Update price in case it changed
    });

    res.json({
      message: "Cart item updated",
      item: cartItem,
    });
  } catch (error) {
    console.error("Update cart item error:", error);
    res.status(500).json({ error: "Error updating cart item" });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;

    const cartItem = await CartItem.findOne({
      where: { id: itemId, userId },
    });

    if (!cartItem) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    await cartItem.destroy();

    res.json({ message: "Item removed from cart" });
  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(500).json({ error: "Error removing item from cart" });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    await CartItem.destroy({
      where: { userId },
    });

    res.json({ message: "Cart cleared successfully" });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({ error: "Error clearing cart" });
  }
};
