const jwt = require("jsonwebtoken");
const db = require("../models");
const User = db.User;
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (user.status !== "active") {
      return res.status(403).json({ error: "Account is not active" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

exports.isSeller = (req, res, next) => {
  if (req.user.role !== "seller") {
    return res.status(403).json({ error: "Requires seller role" });
  }
  next();
};

exports.isBuyer = (req, res, next) => {
  if (req.user.role !== "buyer") {
    return res.status(403).json({ error: "Requires buyer role" });
  }
  next();
};
