const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const { PrismaClient } = require('./generated/prisma');

// Initialize environment variables
dotenv.config();

// --- DB and Firebase Initialization ---
const prisma = new PrismaClient();
const admin = require("firebase-admin");
try {
    const serviceAccount = require("./serviceAccountKey.json");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
} catch (error) {
    console.error("Could not load serviceAccountKey.json. Ensure the file exists locally or is set as a Secret File in production.", error);
    process.exit(1);
}

// --- App and Core Middleware ---
const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());

// --- Session and Passport Middleware ---
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));
require('./config/passport.config')(passport, prisma); // Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// --- Route Imports ---
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const metaRoutes = require('./routes/meta.routes');
const userRoutes = require('./routes/user.routes');
const orderRoutes = require('./routes/order.routes');
const adminRoutes = require('./routes/admin.routes');

// --- Route Mounting ---
app.get('/', (req, res) => {
    console.log('[API] Solicitud recibida en /');
    res.send('Hello World!');
});

app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes); // for /auth/google
app.use('/api/products', productRoutes);
app.use('/api', metaRoutes); // for /api/brands and /api/categories
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);


// --- Server Start ---
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

process.on('beforeExit', async () => {
    await prisma.$disconnect();
});
