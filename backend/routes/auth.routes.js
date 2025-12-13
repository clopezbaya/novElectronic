const express = require('express');
const passport = require('passport');
const { register, login, googleCallback, getMe } = require('../controllers/auth.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

const router = express.Router();

// --- Traditional Auth ---
router.post('/register', register);
router.post('/login', login);

// --- Google OAuth ---
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
    '/google/callback',
    passport.authenticate('google', { 
        failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`,
        session: false // We are using JWT, not sessions
    }),
    googleCallback
);

// --- User Profile ---
router.get('/me', authenticateToken, getMe);


module.exports = router;
