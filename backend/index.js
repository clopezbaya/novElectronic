const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const scrapeProducts = require('./externalProductService');
const { PrismaClient } = require('./generated/prisma');
const multer = require('multer');
const path = require('path');
const passport = require('passport'); // Import passport
const GoogleStrategy = require('passport-google-oauth20').Strategy; // Import Google Strategy
const session = require('express-session'); // Import express-session

// --- Firebase Admin SDK Initialization ---
const admin = require("firebase-admin");

let serviceAccount;
try {
    // This will work locally and in Render (via Secret File)
    serviceAccount = require("./serviceAccountKey.json");
} catch (error) {
    console.error("Could not load serviceAccountKey.json. Ensure the file exists locally or is set as a Secret File in production.", error);
    process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET // Use environment variable for bucket name
});

const bucket = admin.storage().bucket();
// --- End Firebase Admin SDK Initialization ---

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

// --- Multer Configuration for in-memory storage ---
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // Limit file size to 5MB
    }
});

// Remove local uploads folder static serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.json());
app.use(
    cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    })
);

// --- Session Middleware ---
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_session_secret', // Use SESSION_SECRET from .env
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// --- Passport Configuration for Google OAuth ---
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await prisma.user.findUnique({
        where: { googleId: profile.id }
      });

      if (!user) {
        // Check if a user with the same email already exists (e.g., registered via email/password)
        user = await prisma.user.findUnique({
          where: { email: profile.emails[0].value }
        });

        if (user) {
          // Link the existing user account with GoogleId
          user = await prisma.user.update({
            where: { id: user.id },
            data: { googleId: profile.id }
          });
        } else {
          // Create a new user
          user = await prisma.user.create({
            data: {
              email: profile.emails[0].value,
              name: profile.displayName,
              googleId: profile.id,
              // Password field is now optional in schema.prisma, so no need to generate a dummy password
            }
          });
        }
      }
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

// Serialize and Deserialize User for session management (required by Passport for initial OAuth flow)
passport.serializeUser((user, done) => {
    done(null, user.id); // Store only the user ID in the session
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});


app.use(passport.initialize()); // Initialize passport
app.use(passport.session()); // Use passport session middleware


// --- Middlewares ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
};

const isAdmin = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
        });
        if (user && user.role === 'ADMIN') {
            next();
        } else {
            res.sendStatus(403); // Forbidden
        }
    } catch (error) {
        res.sendStatus(500);
    }
};

// --- Lógica de actualización de la base de datos ---
const CACHE_DURATION_HOURS = parseFloat(
    process.env.CACHE_DURATION_HOURS || '1'
);
const CACHE_DURATION_MS = CACHE_DURATION_HOURS * 60 * 60 * 1000;

const updateDatabaseIfNeeded = async () => {
    console.log('[DB_UPDATE] Iniciando verificación para actualizar DB...');
    const now = Date.now();

    const lastProductUpdate = await prisma.product.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
    });

    const productCount = await prisma.product.count();
    console.log(`[DB_UPDATE] Product count: ${productCount}`); // Add this log
    const isDatabaseEmpty = (productCount === 0);
    console.log(`[DB_UPDATE] isDatabaseEmpty: ${isDatabaseEmpty}`); // Add this log

    const isCacheInvalid =
        isDatabaseEmpty ||
        CACHE_DURATION_HOURS === 0 ||
        (lastProductUpdate &&
            now - lastProductUpdate.updatedAt.getTime() >= CACHE_DURATION_MS);
    console.log(`[DB_UPDATE] isCacheInvalid: ${isCacheInvalid}`); // Add this log


    if (!isDatabaseEmpty && !isCacheInvalid) {
        console.log(
            '[DB_UPDATE] La base de datos está actualizada, no se necesita scraping completo.'
        );
        return;
    }

    try {
        console.log(
            '[DB_UPDATE] DB vacía o expirada, iniciando scraping completo y actualización de DB...'
        );
        await scrapeProducts(prisma);
        console.log(
            '[DB_UPDATE] Base de datos actualizada con nuevos productos.'
        );
    } catch (error) {
        console.error(
            '[DB_UPDATE] Error al actualizar la base de datos:',
            error
        );
        throw new Error('Error al obtener o procesar productos para la DB');
    }
};

app.get('/', (req, res) => {
    console.log('[API] Solicitud recibida en /');
    res.send('Hello World!');
});

// --- Endpoints de Autenticación Tradicional ---
app.post('/api/auth/register', async (req, res) => {
    const { email, password, name } = req.body;
    try {
        // Check if a user with this email already exists via Google
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser && existingUser.googleId) {
            return res.status(409).json({ message: 'Este correo electrónico ya está registrado con Google. Inicia sesión con Google.' });
        }
        if (existingUser) {
            return res.status(409).json({ message: 'El correo electrónico ya está registrado.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
            },
        });
        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            userId: user.id,
        });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        if (error.code === 'P2002') {
            return res
                .status(409)
                .json({ message: 'El correo electrónico ya está registrado.' });
        }
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Credenciales inválidas.' });
        }

        // If user registered via Google, prompt them to use Google login
        if (user.googleId && !user.password) {
          return res.status(400).json({ message: 'Has iniciado sesión con Google anteriormente. Por favor, usa el botón de Google para iniciar sesión.' });
        }
        
        // If user has a password (either traditional or linked Google account)
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Credenciales inválidas.' });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        res.json({ message: 'Login exitoso', token });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// --- Google OAuth Routes ---
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: process.env.FRONTEND_URL + '/login?error=google_auth_failed' }),
  (req, res) => {
    // Successful authentication, generate JWT and redirect
    const user = req.user; // User object is attached to req.user by Passport
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    res.redirect(`${process.env.FRONTEND_URL}/auth/google/success?token=${token}`);
  }
);

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
        });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error al obtener perfil de usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// --- User Profile Endpoints ---
app.put('/api/users/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, email } = req.body;

    if (req.user.userId !== parseInt(id)) {
        return res.sendStatus(403); // Forbidden
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: { name, email },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
        });
        res.json(updatedUser);
    } catch (error) {
        if (error.code === 'P2002') {
            return res
                .status(409)
                .json({ message: 'El correo electrónico ya está en uso.' });
        }
        res.status(500).json({ message: 'Error al actualizar el perfil.' });
    }
});

app.put('/api/users/:id/password', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    if (req.user.userId !== parseInt(id)) {
        return res.sendStatus(403); // Forbidden
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
        });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const isPasswordValid = await bcrypt.compare(
            oldPassword,
            user.password
        );
        if (!isPasswordValid) {
            return res
                .status(400)
                .json({ message: 'La contraseña actual es incorrecta.' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: parseInt(id) },
            data: { password: hashedNewPassword },
        });

        res.json({ message: 'Contraseña actualizada exitosamente.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al cambiar la contraseña.' });
    }
});

// --- Endpoints de Órdenes (Protegidos) ---
app.post('/api/orders', authenticateToken, async (req, res) => {
    const { orderItems, total, subtotal, shippingCost, shippingAddress } = req.body;
    try {
        if (!orderItems || orderItems.length === 0) {
            return res.status(400).json({
                message: 'El pedido debe contener al menos un artículo.',
            });
        }

        const newOrder = await prisma.order.create({
            data: {
                userId: req.user.userId,
                subtotal: parseFloat(subtotal),
                shippingCost: parseFloat(shippingCost),
                total: parseFloat(total),
                status: 'PENDING_PAYMENT',
                shippingAddress: shippingAddress,
                orderItems: {
                    create: orderItems.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: parseFloat(item.price),
                    })),
                },
            },
            include: {
                orderItems: {
                    include: {
                        product: {
                            select: { name: true, images: true }, // Select images relation
                        },
                    },
                },
            },
        });
        const formattedOrder = {
            id: newOrder.id,
            total: newOrder.total,
            subtotal: newOrder.subtotal,
            shippingCost: newOrder.shippingCost,
            status: newOrder.status,
            createdAt: newOrder.createdAt,
            orderItems: newOrder.orderItems.map((item) => ({
                quantity: item.quantity,
                price: item.price,
                productId: item.productId,
                productName: item.product.name,
                productImage: item.product.images[0]?.url || 'https://via.placeholder.com/150', // Use first image from array
            })),
        };
        res.status(201).json({
            message: 'Pedido creado exitosamente',
            order: formattedOrder,
        });
    } catch (error) {
        console.error('Error al crear pedido:', error);
        res.status(500).json({
            message: 'Error interno del servidor al crear el pedido.',
        });
    }
});

app.post('/api/orders/:id/upload-proof', authenticateToken, upload.single('proof'), async (req, res) => {
    const { id } = req.params;
    const orderId = parseInt(id);

    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            return res.status(404).json({ message: 'Pedido no encontrado.' });
        }

        if (order.userId !== req.user.userId) {
            return res.status(403).json({ message: 'No tienes permiso para actualizar este pedido.' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No se subió ningún archivo.' });
        }

        const file = req.file;
        const fileName = `proofs/${orderId}-${Date.now()}-${file.originalname}`; // Unique filename in Firebase Storage

        const fileUpload = bucket.file(fileName);
        const blobStream = fileUpload.createWriteStream({
            metadata: {
                contentType: file.mimetype,
            },
        });

        blobStream.on('error', (err) => {
            console.error('Error uploading proof to Firebase Storage:', err);
            res.status(500).json({ message: 'Error al subir el comprobante de pago a Firebase Storage.' });
        });

        blobStream.on('finish', async () => {
            await fileUpload.makePublic(); // Make the file publicly accessible
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;

            console.log('Generated publicUrl for proofOfPayment:', publicUrl); // Add this line
            const updatedOrder = await prisma.order.update({
                where: { id: orderId },
                data: { 
                    proofOfPaymentUrl: publicUrl,
                    status: 'PENDING_VERIFICATION'
                },
            });

            res.json({
                message: 'Comprobante de pago subido exitosamente.',
                order: updatedOrder,
                url: publicUrl // Return the URL to the frontend
            });
        });

        blobStream.end(file.buffer);

    } catch (error) {
        console.error('Error al subir el comprobante de pago:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            where: { userId: req.user.userId },
            include: {
                orderItems: {
                    include: {
                        product: {
                            select: { name: true, images: true }, // Select images relation
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const formattedOrders = orders.map((order) => ({
            id: order.id,
            subtotal: order.subtotal,
            shippingCost: order.shippingCost,
            total: order.total,
            status: order.status,
            createdAt: order.createdAt,
            proofOfPaymentUrl: order.proofOfPaymentUrl,
            shippingProofUrl: order.shippingProofUrl,
            orderItems: order.orderItems.map((item) => ({
                quantity: item.quantity,
                price: item.price,
                productId: item.productId,
                productName: item.product.name,
                productImage: item.product.images[0]?.url || 'https://via.placeholder.com/150', // Use first image from array
            })),
        }));

        res.json(formattedOrders);
    } catch (error) {
        console.error('Error al obtener pedidos del usuario:', error);
        res.status(500).json({
            message: 'Error interno del servidor al obtener los pedidos.',
        });
    }
});

// --- Admin Endpoints ---
app.get('/api/admin/orders', authenticateToken, isAdmin, async (req, res) => {
    const { search, page = 1, limit = 10 } = req.query;
    try {
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        let whereClause = {};
        if (search) {
            whereClause = {
                OR: [
                    { user: { name: { contains: search.toString() } } },
                    { user: { email: { contains: search.toString() } } },
                ],
            };
        }

        const totalOrders = await prisma.order.count({ where: whereClause });
        const orders = await prisma.order.findMany({
            where: whereClause,
            include: {
                user: { select: { name: true, email: true } },
                orderItems: {
                    include: {
                        product: { select: { name: true } },
                    },
                },
            },
            skip: skip,
            take: limitNum,
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            orders: orders.map(order => ({
                ...order,
                shippingAddress: order.shippingAddress,
                proofOfPaymentUrl: order.proofOfPaymentUrl,
                shippingProofUrl: order.shippingProofUrl,
                subtotal: order.subtotal,
                shippingCost: order.shippingCost,
            })),
            totalOrders,
            page: pageNum,
            totalPages: Math.ceil(totalOrders / limitNum),
        });
    } catch (error) {
        console.error('Error fetching all orders:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.get('/api/admin/orders/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const order = await prisma.order.findUnique({
            where: { id: parseInt(id) },
            include: {
                user: { select: { name: true, email: true } },
                orderItems: {
                    include: {
                        product: { select: { name: true, images: true } }, // Select images relation
                    },
                },
            },
        });

        if (!order) {
            return res.status(404).json({ message: 'Pedido no encontrado.' });
        }

        const formattedOrder = { // Explicitly format the order
            ...order,
            orderItems: order.orderItems.map(item => ({
                ...item,
                productImage: item.product.images[0]?.url || 'https://via.placeholder.com/150', // Use first image from array
            }))
        };
        res.json(formattedOrder);
    } catch (error) {
        console.error(`Error fetching order #${id}:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.put(
    '/api/admin/orders/:id',
    authenticateToken,
    isAdmin,
    async (req, res) => {
        const { id } = req.params;
        const { status } = req.body;
        try {
            const updatedOrder = await prisma.order.update({
                where: { id: parseInt(id) },
                data: { status },
            });
            res.json({
                message: 'Estado del pedido actualizado.',
                order: updatedOrder,
            });
        } catch (error) {
            console.error('Error updating order status:', error);
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    }
);

app.post(
    '/api/admin/orders/:id/ship',
    authenticateToken,
    isAdmin,
    upload.single('shippingProof'), // Use the in-memory multer instance
    async (req, res) => {
        const { id } = req.params;
        const orderId = parseInt(id);

        try {
            const order = await prisma.order.findUnique({
                where: { id: orderId },
            });

            if (!order) {
                return res.status(404).json({ message: 'Pedido no encontrado.' });
            }

            if (!req.file) {
                return res.status(400).json({ message: 'No se subió ningún archivo.' });
            }

            const file = req.file;
            const fileName = `shipping-proofs/${orderId}-${Date.now()}-${file.originalname}`; // Unique filename in Firebase Storage

            const fileUpload = bucket.file(fileName);
            const blobStream = fileUpload.createWriteStream({
                metadata: {
                    contentType: file.mimetype,
                },
            });

            blobStream.on('error', (err) => {
                console.error('Error uploading shipping proof to Firebase Storage:', err);
                res.status(500).json({ message: 'Error al subir el comprobante de envío a Firebase Storage.' });
            });

            blobStream.on('finish', async () => {
                await fileUpload.makePublic(); // Make the file publicly accessible
                const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;

                console.log('Generated publicUrl for shippingProof:', publicUrl);

                const updatedOrder = await prisma.order.update({
                    where: { id: orderId },
                    data: {
                        shippingProofUrl: publicUrl,
                        status: 'ENVIADO',
                    },
                });

                res.json({
                    message: 'Comprobante de envío subido y estado actualizado a "Enviado".',
                    order: updatedOrder,
                    url: publicUrl // Return the URL to the frontend
                });
            });

            blobStream.end(file.buffer);

        } catch (error) {
            console.error('Error al subir el comprobante de envío:', error);
            console.log(error);
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    }
);


// --- Admin Product Endpoints ---
app.get('/api/admin/products', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        let whereClause = {};
        if (search) {
            whereClause = {
                name: {
                    contains: search.toString(),
                },
            };
        }

        const totalProducts = await prisma.product.count({
            where: whereClause,
        });
        const products = await prisma.product.findMany({
            where: whereClause,
            include: { brand: true, categories: true, images: true }, // Include images
            skip: skip,
            take: limitNum,
        });

        const formattedProducts = products.map(p => ({
            ...p,
            images: p.images.map(img => img.url), // Return all image URLs
            // Remove 'imageUrl' if still present in `p` directly
            // imageUrl: undefined
        }));

        res.json({
            products: formattedProducts,
            totalProducts,
            page: pageNum,
            totalPages: Math.ceil(totalProducts / limitNum),
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products' });
    }
});

app.get('/api/admin/products/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                brand: true,
                categories: true,
                images: true // Include images
            },
        });
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }

        const formattedProduct = {
            ...product,
            images: product.images.map(img => img.url), // Return all image URLs
            // Remove 'imageUrl' if still present in `product` directly
            // imageUrl: undefined
        };
        res.json(formattedProduct);
    } catch (error) {
        console.error(`Error fetching product #${id} for admin:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});


app.post(
    '/api/admin/products',
    authenticateToken,
    isAdmin,
    async (req, res) => {
        const {
            name,
            description,
            originalPrice,
            resalePrice,
            // imageUrl, // Removed
            imageUrls, // New: array of image URLs
            sourceUrl,
            stock,
            brandId,
            categoryIds,
        } = req.body;
        try {
            const newProduct = await prisma.product.create({
                data: {
                    id: `${name
                        .replace(/\s+/g, '-')
                        .toLowerCase()}-${Date.now()}`,
                    name,
                    description,
                    originalPrice,
                    resalePrice,
                    // imageUrl, // Removed
                    sourceUrl,
                    stock,
                    brand: { connect: { id: brandId } },
                    categories: { connect: categoryIds.map((id) => ({ id })) },
                    images: { // New: create multiple images
                        create: imageUrls.map(url => ({ url }))
                    }
                },
                include: { images: true } // Include images in the response
            });
            res.status(201).json({
                ...newProduct,
                images: newProduct.images.map(img => img.url)
            });
        } catch (error) {
            if (error.code === 'P2002') {
                return res.status(409).json({ message: 'A product with this source URL already exists.' });
            }
            console.error('Error creating product:', error);
            res.status(500).json({ message: 'Error creating product' });
        }
    }
);

app.put(
    '/api/admin/products/:id',
    authenticateToken,
    isAdmin,
    async (req, res) => {
        const { id } = req.params;
        const {
            name,
            description,
            originalPrice,
            resalePrice,
            // imageUrl, // Removed
            imageUrls, // New: array of image URLs
            sourceUrl,
            stock,
            brandId,
            categoryIds,
        } = req.body;
        try {
            const updatedProduct = await prisma.product.update({
                where: { id },
                data: {
                    name,
                    description,
                    originalPrice,
                    resalePrice,
                    // imageUrl, // Removed
                    sourceUrl,
                    stock,
                    brand: { connect: { id: brandId } },
                    categories: { set: categoryIds.map((id) => ({ id })) },
                    images: { // New: delete existing and create new images
                        deleteMany: {}, // Delete all existing images
                        create: imageUrls.map(url => ({ url })) // Create new image entries
                    }
                },
                include: { images: true } // Include images in the response
            });
            res.json({
                ...updatedProduct,
                images: updatedProduct.images.map(img => img.url)
            });
        } catch (error) {
            console.error('Error updating product:', error);
            res.status(500).json({ message: 'Error updating product' });
        }
    }
);

app.delete(
    '/api/admin/products/:id',
    authenticateToken,
    isAdmin,
    async (req, res) => {
        const { id } = req.params;
        try {
            await prisma.product.delete({
                where: { id },
            });
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: 'Error deleting product' });
        }
    }
);

// --- Endpoints de la API (Públicos) ---
app.get('/api/products', async (req, res) => {
    console.log('[API] Solicitud recibida en /api/products');
    try {
        await updateDatabaseIfNeeded();
        const { search, brand, category, page = 1, limit = 8 } = req.query;

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        let whereClause = {
            stock: {
                gt: 0,
            },
        };

        if (search) {
            whereClause.name = {
                contains: search.toString(),
            };
        }

        if (brand) {
            whereClause.brand = {
                name: {
                    equals: brand.toString(),
                },
            };
        }

        if (category) {
            whereClause.categories = {
                some: {
                    name: {
                        equals: category.toString(),
                    },
                },
            };
        }

        const totalProducts = await prisma.product.count({
            where: whereClause,
        });
        const products = await prisma.product.findMany({
            where: whereClause,
            include: { brand: true, categories: true, images: true }, // Include images
            skip: skip,
            take: limitNum,
        });

        console.log('[API] Sirviendo productos desde la base de datos.');

        const formattedProducts = products.map((p) => ({
            id: p.id,
            title: p.name,
            image: p.images[0]?.url || 'https://via.placeholder.com/150', // Use first image or placeholder
            images: p.images.map(img => img.url), // Return all image URLs
            brand: p.brand.name,
            categories: p.categories.map((c) => c.name),
            price: p.resalePrice,
            currency: 'Bs',
            popularity: 0,
            stock: p.stock,
            description: p.description,
        }));

        res.json({
            products: formattedProducts,
            totalProducts: totalProducts,
            page: pageNum,
            totalPages: Math.ceil(totalProducts / limitNum),
        });
    } catch (error) {
        console.error('[API] Error en /api/products:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.get('/api/brands', async (req, res) => {
    console.log('[API] Solicitud recibida en /api/brands');
    try {
        await updateDatabaseIfNeeded();
        const brands = await prisma.brand.findMany({
            select: { id: true, name: true }, // Select both id and name
            distinct: ['name'],
        });
        console.log(
            `[API] Sirviendo ${brands.length} marcas desde la base de datos.`
        );
        res.json(brands); // Return array of objects
    } catch (error) {
        console.error('[API] Error en /api/brands:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.get('/api/categories', async (req, res) => {
    console.log('[API] Solicitud recibida en /api/categories');
    try {
        await updateDatabaseIfNeeded();
        const categories = await prisma.category.findMany({
            select: { id: true, name: true }, // Select both id and name
            distinct: ['name'],
        });
        console.log(
            `[API] Sirviendo ${categories.length} categorías desde la base de datos.`
        );
        res.json(categories); // Return array of objects
    } catch (error) {
        console.error('[API] Error en /api/categories:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.get('/api/products/:id', async (req, res) => {
    console.log(`[API] Solicitud recibida en /api/products/${req.params.id}`);
    try {
        await updateDatabaseIfNeeded();
        const { id } = req.params;
        const product = await prisma.product.findUnique({
            where: {
                id: id,
                stock: {
                    gt: 0,
                },
            },
            include: { brand: true, categories: true, images: true }, // Include images
        });

        if (product) {
            console.log(
                `[API] Producto '${id}' encontrado en la base de datos.`
            );
            const formattedProduct = {
                id: product.id,
                title: product.name,
                image: product.images[0]?.url || 'https://via.placeholder.com/150', // Use first image or placeholder
                images: product.images.map(img => img.url), // Return all image URLs
                brand: product.brand.name,
                categories: product.categories.map((c) => c.name),
                price: product.resalePrice,
                currency: 'Bs',
                popularity: 0,
                stock: product.stock,
                description: product.description,
            };
            res.json(formattedProduct);
        } else {
            console.log(
                `[API] Producto '${id}' no encontrado en la base de datos.`
            );
            res.status(404).json({ message: 'Producto no encontrado' });
        }
    } catch (error) {
        console.error(`[API] Error en /api/products/${req.params.id}:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.get('/api/products/category/:category', async (req, res) => {
    console.log(
        `[API] Solicitud recibida en /api/products/category/${req.params.category}`
    );
    try {
        await updateDatabaseIfNeeded();
        const { category } = req.params;
        const filteredProducts = await prisma.product.findMany({
            where: {
                stock: {
                    gt: 0,
                },
                categories: {
                    some: {
                        name: {
                            mode: 'insensitive',
                            equals: category,
                        },
                    },
                },
            },
            include: { brand: true, categories: true, images: true }, // Include images
        });
        console.log(
            `[API] Encontrados ${filteredProducts.length} productos en la categoría '${category}'.`
        );
        const formattedProducts = filteredProducts.map((p) => ({
            id: p.id,
            title: p.name,
            image: p.images[0]?.url || 'https://via.placeholder.com/150', // Use first image or placeholder
            images: p.images.map(img => img.url), // Return all image URLs
            brand: p.brand.name,
            categories: p.categories.map((c) => c.name),
            price: p.resalePrice,
            currency: 'Bs',
            popularity: 0,
            stock: p.stock,
            description: p.description,
        }));
        res.json(formattedProducts);
    } catch (error) {
        console.error(
            `[API] Error en /api/products/category/${req.params.category}:`,
            error
        );
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

process.on('beforeExit', async () => {
    await prisma.$disconnect();
});