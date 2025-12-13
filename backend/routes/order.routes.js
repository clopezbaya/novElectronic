const express = require('express');
const { createOrder, uploadProof, getMyOrders } = require('../controllers/order.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const multer = require('multer');

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

// All order routes should be protected
router.use(authenticateToken);

// GET /api/orders
router.get('/', getMyOrders);

// POST /api/orders
router.post('/', createOrder);

// POST /api/orders/:id/upload-proof
router.post('/:id/upload-proof', upload.single('proof'), uploadProof);

module.exports = router;
