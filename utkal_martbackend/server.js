const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
const path = require("path");
const fs = require("fs");

// Import models and routes
const db = require("./models");
const productRoutes = require("./routes/productRoute");
const authRoutes = require("./routes/authRoute");
const cartRoutes = require("./routes/cartRoute");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Create upload directories if they don't exist
const createDirIfNotExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Directory created: ${dir}`);
  }
};

createDirIfNotExists("uploads");
createDirIfNotExists("uploads/products");
createDirIfNotExists("uploads/categories");

// Static directories for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api", productRoutes); // All product and category routes
app.use("/api/auth", authRoutes); // Auth routes
app.use("/api/buyer", cartRoutes); // Buyer cart routes

// Root route for API health check
app.get("/", (req, res) => {
  res.json({ message: "Welcome to E-Commerce API" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Sync database and start server
db.sequelize
  .sync({ force: false, alter: true })
  .then(() => {
    console.log("Database synced");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database sync error:", err);
  });

// Handle unhandled promise rejections
process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error);
});
