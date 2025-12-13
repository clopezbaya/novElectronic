const express = require('express');
const { getBrands, getCategories } = require('../controllers/meta.controller');

const router = express.Router();

router.get('/brands', getBrands);
router.get('/categories', getCategories);

module.exports = router;
