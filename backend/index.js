const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const scrapeProducts = require('./externalProductService');
const { PrismaClient } = require('./generated/prisma');
const multer = require('multer');
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

// --- Multer Configuration ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/proofs/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Append extension
    }
});

const upload = multer({ storage: storage });

app.use(express.json());
app.use(
    cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    })
);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


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

    const isDatabaseEmpty = (await prisma.product.count()) === 0;
    const isCacheInvalid =
        isDatabaseEmpty ||
        CACHE_DURATION_HOURS === 0 ||
        (lastProductUpdate &&
            now - lastProductUpdate.updatedAt.getTime() >= CACHE_DURATION_MS);

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

// --- Endpoints de Autenticación ---
app.post('/api/auth/register', async (req, res) => {
    const { email, password, name } = req.body;
    try {
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
                            select: { name: true, imageUrl: true },
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
                productImage: item.product.imageUrl,
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

        const proofUrl = `/uploads/proofs/${req.file.filename}`;

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { 
                proofOfPaymentUrl: proofUrl,
                status: 'PENDING_VERIFICATION'
            },
        });

        res.json({
            message: 'Comprobante de pago subido exitosamente.',
            order: updatedOrder,
        });
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
                            select: { name: true, imageUrl: true },
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
            orderItems: order.orderItems.map((item) => ({
                quantity: item.quantity,
                price: item.price,
                productId: item.productId,
                productName: item.product.name,
                productImage: item.product.imageUrl,
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
                        product: { select: { name: true, imageUrl: true } },
                    },
                },
            },
        });

        if (!order) {
            return res.status(404).json({ message: 'Pedido no encontrado.' });
        }

        res.json(order);
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
            include: { brand: true, categories: true },
            skip: skip,
            take: limitNum,
        });

        res.json({
            products,
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
            },
        });
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }
        res.json(product);
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
            imageUrl,
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
                    imageUrl,
                    sourceUrl,
                    stock,
                    brand: { connect: { id: brandId } },
                    categories: { connect: categoryIds.map((id) => ({ id })) },
                },
            });
            res.status(201).json(newProduct);
        } catch (error) {
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
            imageUrl,
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
                    imageUrl,
                    sourceUrl,
                    stock,
                    brand: { connect: { id: brandId } },
                    categories: { set: categoryIds.map((id) => ({ id })) },
                },
            });
            res.json(updatedProduct);
        } catch (error) {
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
            include: { brand: true, categories: true },
            skip: skip,
            take: limitNum,
        });

        console.log('[API] Sirviendo productos desde la base de datos.');

        const formattedProducts = products.map((p) => ({
            id: p.id,
            title: p.name,
            image: p.imageUrl,
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
            include: { brand: true, categories: true },
        });

        if (product) {
            console.log(
                `[API] Producto '${id}' encontrado en la base de datos.`
            );
            const formattedProduct = {
                id: product.id,
                title: product.name,
                image: product.imageUrl,
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
            include: { brand: true, categories: true },
        });
        console.log(
            `[API] Encontrados ${filteredProducts.length} productos en la categoría '${category}'.`
        );
        const formattedProducts = filteredProducts.map((p) => ({
            id: p.id,
            title: p.name,
            image: p.imageUrl,
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
