const { Sequelize } = require("sequelize");
const config = require("../config/config");

const sequelize = new Sequelize(
  config.development.database,
  config.development.username,
  config.development.password,
  {
    host: config.development.host,
    dialect: config.development.dialect,
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Load models
db.User = require("./user")(sequelize, Sequelize);
db.Product = require("./product")(sequelize, Sequelize);
db.ProductImage = require("./productImage")(sequelize, Sequelize);
db.CartItem = require("./cartItem")(sequelize, Sequelize);
db.Category = require("./category")(sequelize, Sequelize);

// Define associations
db.Product.hasMany(db.ProductImage, { foreignKey: "productId" });
db.ProductImage.belongsTo(db.Product, { foreignKey: "productId" });

// Cart associations
db.User.hasMany(db.CartItem, { foreignKey: "userId" });
db.CartItem.belongsTo(db.User, { foreignKey: "userId" });
db.Product.hasMany(db.CartItem, { foreignKey: "productId" });
db.CartItem.belongsTo(db.Product, { foreignKey: "productId" });

module.exports = db;
