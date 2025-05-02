const db = require("../models");
const Product = db.Product;
const ProductImage = db.ProductImage;
const Category = db.Category;
const { Op } = require("sequelize");
const path = require("path");

// Get all active products
exports.getAllProducts = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sort } = req.query;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const page = parseInt(req.query.page) || 1;

    // Build where clause for filtering
    const whereClause = { status: "active" };

    if (category) {
      whereClause.category = category;
    }

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { subtitle: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    if (minPrice) {
      whereClause.price = { ...whereClause.price, [Op.gte]: minPrice };
    }

    if (maxPrice) {
      whereClause.price = { ...whereClause.price, [Op.lte]: maxPrice };
    }

    // Build order clause for sorting
    let orderClause = [["createdAt", "DESC"]];

    if (sort === "price_asc") {
      orderClause = [["price", "ASC"]];
    } else if (sort === "price_desc") {
      orderClause = [["price", "DESC"]];
    } else if (sort === "rating_desc") {
      orderClause = [["rating", "DESC"]];
    }

    // Execute query with pagination
    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      include: [{ model: ProductImage }],
      order: orderClause,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    res.json({
      products,
      pagination: {
        total: count,
        pageSize,
        currentPage: page,
        totalPages: Math.ceil(count / pageSize),
      },
    });
  } catch (error) {
    console.error("Get all products error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: {
        id: req.params.id,
        status: "active",
      },
      include: [{ model: ProductImage }],
    });

    if (!product) return res.status(404).json({ error: "Product not found" });

    res.json(product);
  } catch (error) {
    console.error("Get product by ID error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get products by category
exports.getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const products = await Product.findAll({
      where: {
        category,
        status: "active",
      },
      include: [{ model: ProductImage }],
    });

    res.json(products);
  } catch (error) {
    console.error("Get products by category error:", error);
    res.status(500).json({ error: "Error retrieving products" });
  }
};

// Get all product categories
exports.getCategories = async (req, res) => {
  try {
    // First check if we have categories in the Category table
    const categoriesFromDb = await Category.findAll({
      where: { status: "active" },
      attributes: ["id", "name", "description", "icon"],
    });

    if (categoriesFromDb && categoriesFromDb.length > 0) {
      return res.json(categoriesFromDb);
    }

    // Fallback: get unique categories from products
    const categories = await Product.findAll({
      attributes: ["category"],
      group: ["category"],
      where: { status: "active" },
    });

    res.json(categories.map((item) => item.category));
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ error: "Error retrieving categories" });
  }
};

// Add a new category (with icon support)
exports.addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Category name is required" });
    }

    // Check if category exists
    const existingCategory = await Category.findOne({
      where: { name: { [Op.like]: name } },
    });

    if (existingCategory) {
      return res.status(400).json({ error: "Category already exists" });
    }

    // Set icon path if uploaded
    let iconPath = null;
    if (req.file) {
      iconPath = `/uploads/categories/${req.file.filename}`;
    }

    // Create new category
    const newCategory = await Category.create({
      name,
      description: description || "",
      icon: iconPath,
    });

    res.status(201).json({
      message: "Category added successfully",
      category: newCategory,
    });
  } catch (error) {
    console.error("Add category error:", error);
    res.status(500).json({ error: "Error adding category" });
  }
};

// Create a new product
exports.createProduct = async (req, res) => {
  try {
    const { title, subtitle, description, price, category, stock, sellerName } =
      req.body;

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one product image is required" });
    }

    // Validate category
    if (!category) {
      return res.status(400).json({ error: "Category is required" });
    }

    // Validate sellerName
    if (!sellerName) {
      return res.status(400).json({ error: "Seller name is required" });
    }

    // Check if the category exists or create it
    const existingCategory = await Category.findOne({
      where: { name: category },
    });

    if (!existingCategory) {
      // Create category if it doesn't exist
      await Category.create({
        name: category,
        description: `Category for ${category} products`,
      });
    }

    // Create product
    const newProduct = await Product.create({
      title,
      subtitle,
      description,
      price,
      category,
      stock: stock || 1,
      sellerName,
      rating: 0, // Default rating
      image: `/uploads/products/${req.files[0].filename}`, // Set primary image to first uploaded file
    });

    // Create product images for all uploaded files
    const productImages = await Promise.all(
      req.files.map((file, index) => {
        return ProductImage.create({
          url: `/uploads/products/${file.filename}`,
          productId: newProduct.id,
          isPrimary: index === 0, // First image is primary
        });
      })
    );

    res.status(201).json({
      message: "Product created successfully",
      product: newProduct,
      images: productImages,
    });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ error: "Error creating product" });
  }
};

// Update a product
exports.updateProduct = async (req, res) => {
  try {
    const { title, subtitle, description, price, category, stock, sellerName } =
      req.body;
    const productId = req.params.id;

    // Find product
    const product = await Product.findOne({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // If category is changing, validate it exists
    if (category && category !== product.category) {
      const existingCategory = await Category.findOne({
        where: { name: category },
      });

      if (!existingCategory) {
        // Create category if it doesn't exist
        await Category.create({
          name: category,
          description: `Category for ${category} products`,
        });
      }
    }

    // Update product fields
    await product.update({
      title: title || product.title,
      subtitle: subtitle || product.subtitle,
      description: description || product.description,
      price: price || product.price,
      category: category || product.category,
      stock: stock || product.stock,
      sellerName: sellerName || product.sellerName,
    });

    // If files uploaded, add new product images
    if (req.files && req.files.length > 0) {
      const newImages = await Promise.all(
        req.files.map((file) => {
          return ProductImage.create({
            url: `/uploads/products/${file.filename}`,
            productId: product.id,
            isPrimary: false,
          });
        })
      );

      // Update primary image if specified
      if (req.body.primaryImageId) {
        await ProductImage.update(
          { isPrimary: false },
          { where: { productId: product.id } }
        );

        await ProductImage.update(
          { isPrimary: true },
          { where: { id: req.body.primaryImageId, productId: product.id } }
        );

        const primaryImage = await ProductImage.findOne({
          where: { id: req.body.primaryImageId, productId: product.id },
        });

        if (primaryImage) {
          await product.update({ image: primaryImage.url });
        }
      }

      // Fetch all product images
      const allImages = await ProductImage.findAll({
        where: { productId: product.id },
      });

      return res.json({
        message: "Product updated successfully",
        product,
        images: allImages,
      });
    }

    res.json({
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ error: "Error updating product" });
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    // Find product
    const product = await Product.findByPk(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Set status to deleted instead of actually deleting
    await product.update({ status: "deleted" });

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ error: "Error deleting product" });
  }
};
