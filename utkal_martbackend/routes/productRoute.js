const express = require("express");
const productController = require("../controllers/productController");
const upload = require("../middlewares/upload");

const router = express.Router();

// Public product routes
router.get("/products", productController.getAllProducts);
router.get("/products/categories", productController.getCategories);
router.get(
  "/products/category/:category",
  productController.getProductsByCategory
);
router.get("/products/:id", productController.getProductById);

// Category management - specifically set fieldname as "icon"
router.post("/categories", upload.categoryIcon, productController.addCategory);

// Product management - use the productImages middleware for multiple files
router.post("/products", upload.productImages, productController.createProduct);
router.put(
  "/products/:id",
  upload.productImages,
  productController.updateProduct
);
router.delete("/products/:id", productController.deleteProduct);

module.exports = router;
