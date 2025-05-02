const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create upload directories if they don't exist
const createDirectoryIfNotExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Initialize directories
const initDirectories = () => {
  createDirectoryIfNotExists("uploads");
  createDirectoryIfNotExists("uploads/products");
  createDirectoryIfNotExists("uploads/categories");
};

// Call initialization
initDirectories();

// Product storage configuration
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/products/");
  },
  filename: (req, file, cb) => {
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 15)}${path.extname(file.originalname)}`;
    cb(null, fileName);
  },
});

// Category icon storage configuration
const categoryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/categories/");
  },
  filename: (req, file, cb) => {
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 15)}${path.extname(file.originalname)}`;
    cb(null, fileName);
  },
});

// File filter for images
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

// Configure upload instances
const productUpload = multer({
  storage: productStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
  },
});

const categoryUpload = multer({
  storage: categoryStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB limit per file
  },
});

// Export middleware
module.exports = {
  // Product images upload (up to 5)
  productImages: productUpload.array("images", 5),

  // Category icon upload (single file)
  categoryIcon: categoryUpload.single("icon"),
};
