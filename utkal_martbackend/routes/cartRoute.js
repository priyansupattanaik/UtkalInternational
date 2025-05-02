const express = require("express");
const cartController = require("../controllers/cartController");
const auth = require("../middlewares/auth");

const router = express.Router();

router.get("/cart", auth.verifyToken, auth.isBuyer, cartController.getCart);
router.post("/cart", auth.verifyToken, auth.isBuyer, cartController.addToCart);
router.put(
  "/cart/:id",
  auth.verifyToken,
  auth.isBuyer,
  cartController.updateCartItem
);
router.delete(
  "/cart/:id",
  auth.verifyToken,
  auth.isBuyer,
  cartController.removeFromCart
);
router.delete(
  "/cart",
  auth.verifyToken,
  auth.isBuyer,
  cartController.clearCart
);

module.exports = router;
