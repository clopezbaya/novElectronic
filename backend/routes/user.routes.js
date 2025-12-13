const express = require('express');
const { updateUserProfile, changePassword } = require('../controllers/user.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

const router = express.Router();

// All user routes should be protected
router.use(authenticateToken);

router.put('/:id', updateUserProfile);
router.put('/:id/password', changePassword);

module.exports = router;
