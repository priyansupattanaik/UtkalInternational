const db = require("../models");
const User = db.User;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "24h";

// Register a new user (buyer only)
exports.register = async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    // Check if user with phone already exists
    const existingUser = await User.findOne({ where: { phone } });
    if (existingUser) {
      return res.status(400).json({ error: "Phone number already registered" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user - always as buyer
    const newUser = await User.create({
      name,
      phone,
      password: hashedPassword,
      role: "buyer",
    });

    // Generate JWT token
    const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRY,
    });

    // Return user info without password
    const { password: _, ...userWithoutPassword } = newUser.toJSON();

    res.status(201).json({
      message: "User registered successfully",
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Error registering user" });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Find user by phone
    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if account is active
    if (user.status !== "active") {
      return res.status(401).json({ error: "Account is not active" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRY,
    });

    // Return user info without password
    const { password: _, ...userWithoutPassword } = user.toJSON();

    res.json({
      message: "Login successful",
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Error during login" });
  }
};

// Get current user profile
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Error retrieving user data" });
  }
};

// Admin register (for creating seller accounts via API)
exports.adminRegister = async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    // This endpoint is for creating seller accounts only
    // In a real app, you'd want an admin token check here

    // Check if user with phone already exists
    const existingUser = await User.findOne({ where: { phone } });
    if (existingUser) {
      return res.status(400).json({ error: "Phone number already registered" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user as seller
    const newUser = await User.create({
      name,
      phone,
      password: hashedPassword,
      role: "seller",
    });

    // Return user info without password
    const { password: _, ...userWithoutPassword } = newUser.toJSON();

    res.status(201).json({
      message: "Seller account created successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Admin registration error:", error);
    res.status(500).json({ error: "Error creating seller account" });
  }
};
