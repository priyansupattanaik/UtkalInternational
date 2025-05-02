const express = require("express");
const authController = require("../controllers/authController");
const auth = require("../middlewares/auth");

const router = express.Router();

// Authentication routes
router.post("/register", authController.register); // Buyer registration only
router.post("/login", authController.login);
router.get("/me", auth.verifyToken, authController.getCurrentUser);

// Admin-only API route for creating seller accounts
router.post("/admin/register-seller", authController.adminRegister);

module.exports = router;
