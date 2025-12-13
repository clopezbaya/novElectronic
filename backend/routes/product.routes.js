const express = require('express');
const { getAllProducts, getProductById } = require('../controllers/product.controller');

const router = express.Router();

// Route to get all products (with optional query filters)
// Corresponds to /api/products
router.get('/', getAllProducts);

// Route to get a single product by its ID
// Corresponds to /api/products/:id
router.get('/:id', getProductById);

module.exports = router;
