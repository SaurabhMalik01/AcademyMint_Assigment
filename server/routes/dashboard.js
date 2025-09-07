// routes/dashboard.js
const express = require("express");
const router = express.Router();
const { getVisitors } = require("../controllers/visitors");
const { getProducts } = require("../controllers/products");

// Visitors analytics
router.get("/visitors", getVisitors);

// Products analytics
router.get("/products", getProducts);

module.exports = router;
