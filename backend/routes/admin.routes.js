const express = require('express');
const {
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    shipOrder,
    getAllProductsAdmin,
    getProductByIdAdmin,
    createProductAdmin,
    updateProductAdmin,
    deleteProductAdmin,
} = require('../controllers/admin.controller');
const { authenticateToken, isAdmin } = require('../middlewares/auth.middleware');
const multer = require('multer');

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

// All admin routes are protected by authentication and admin role checks
router.use(authenticateToken, isAdmin);

// Admin Order Routes
router.get('/orders', getAllOrders);
router.get('/orders/:id', getOrderById);
router.put('/orders/:id', updateOrderStatus);
router.post('/orders/:id/ship', upload.single('shippingProof'), shipOrder);

// Admin Product Routes
router.get('/products', getAllProductsAdmin);
router.get('/products/:id', getProductByIdAdmin);
router.post('/products', createProductAdmin);
router.put('/products/:id', updateProductAdmin);
router.delete('/products/:id', deleteProductAdmin);

module.exports = router;
