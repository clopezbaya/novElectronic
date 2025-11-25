const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const scrapeProducts = require('./externalProductService'); // Importar el servicio de scraping
const { PrismaClient } = require('./generated/prisma'); // Importar PrismaClient desde la ruta generada

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient(); // Inicializar PrismaClient

// Obtener porcentaje de aumento y duración de caché
const CACHE_DURATION_HOURS = parseFloat(
    process.env.CACHE_DURATION_HOURS || '1'
);
const CACHE_DURATION_MS = CACHE_DURATION_HOURS * 60 * 60 * 1000; // Convertir a milisegundos

// --- Lógica de actualización de la base de datos ---
const updateDatabaseIfNeeded = async () => {
    console.log('[DB_UPDATE] Iniciando verificación para actualizar DB...');
    const now = Date.now();

    // Comprobar la última actualización de un producto para decidir si raspar de nuevo
    const lastProductUpdate = await prisma.product.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
    });

    const isDatabaseEmpty = (await prisma.product.count()) === 0;
    const isCacheInvalid =
        isDatabaseEmpty ||
        CACHE_DURATION_HOURS === 0 || // Force update if cache duration is 0
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
        await scrapeProducts(prisma); // Pasar la instancia de Prisma
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

// Configuración de CORS
app.use(
    cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    })
);

app.get('/', (req, res) => {
    console.log('[API] Solicitud recibida en /');
    res.send('Hello World!');
});

// --- Endpoints de la API ---

app.get('/api/products', async (req, res) => {
    console.log('[API] Solicitud recibida en /api/products');
    try {
        await updateDatabaseIfNeeded(); // Asegurar que la DB esté actualizada
        const { search, brand, category, page = 1, limit = 8 } = req.query; // Obtener parámetros de búsqueda, marca, categoría y paginación

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        let whereClause = {
            stock: {
                gt: 0, // Solo productos con stock > 0
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

        const totalProducts = await prisma.product.count({ where: whereClause });
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
            categories: p.categories.map(c => c.name),
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
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/brands', async (req, res) => {
    console.log('[API] Solicitud recibida en /api/brands');
    try {
        await updateDatabaseIfNeeded(); // Asegurar que la DB esté actualizada
        const brands = await prisma.brand.findMany({
            select: { name: true },
            distinct: ['name'],
        });
        console.log(
            `[API] Sirviendo ${brands.length} marcas desde la base de datos.`
        );
        res.json(brands.map((b) => b.name));
    } catch (error) {
        console.error('[API] Error en /api/brands:', error);
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/categories', async (req, res) => {
    console.log('[API] Solicitud recibida en /api/categories');
    try {
        await updateDatabaseIfNeeded(); // Asegurar que la DB esté actualizada
        const categories = await prisma.category.findMany({
            select: { name: true },
            distinct: ['name'],
        });
        console.log(
            `[API] Sirviendo ${categories.length} categorías desde la base de datos.`
        );
        res.json(categories.map((c) => c.name));
    } catch (error) {
        console.error('[API] Error en /api/categories:', error);
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/products/:id', async (req, res) => {
    console.log(`[API] Solicitud recibida en /api/products/${req.params.id}`);
    try {
        await updateDatabaseIfNeeded(); // Asegurar que la DB esté actualizada
        const { id } = req.params;
        const product = await prisma.product.findUnique({
            where: {
                id: id,
                stock: {
                    gt: 0, // Solo productos con stock > 0
                },
            },
            include: { brand: true, categories: true }, // Incluir la marca y categorías
        });

        if (product) {
            console.log(
                `[API] Producto '${id}' encontrado en la base de datos.`
            );
            // Mapear el producto para el frontend
            const formattedProduct = {
                id: product.id,
                title: product.name,
                image: product.imageUrl,
                brand: product.brand.name,
                categories: product.categories.map(c => c.name),
                price: product.resalePrice,
                currency: 'Bs', // Asumimos 'Bs' como moneda
                popularity: 0, // Placeholder
                stock: product.stock, // Incluir stock
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
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/products/category/:category', async (req, res) => {
    console.log(
        `[API] Solicitud recibida en /api/products/category/${req.params.category}`
    );
    try {
        await updateDatabaseIfNeeded(); // Asegurar que la DB esté actualizada
        const { category } = req.params;
        const filteredProducts = await prisma.product.findMany({
            where: {
                stock: {
                    gt: 0, // Solo productos con stock > 0
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
        // Mapear productos para el frontend
        const formattedProducts = filteredProducts.map((p) => ({
            id: p.id,
            title: p.name,
            image: p.imageUrl,
            brand: p.brand.name,
            categories: p.categories.map(c => c.name),
            price: p.resalePrice,
            currency: 'Bs', // Asumimos 'Bs' como moneda
            popularity: 0, // Placeholder
            stock: p.stock, // Incluir stock
            description: p.description,
        }));
        res.json(formattedProducts);
    } catch (error) {
        console.error(
            `[API] Error en /api/products/category/${req.params.category}:`,
            error
        );
        res.status(500).json({ message: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Desconexión de Prisma al cerrar la aplicación
process.on('beforeExit', async () => {
    console.log('[Prisma] Desconectando Prisma Client...');
    await prisma.$disconnect();
    console.log('[Prisma] Prisma Client desconectado.');
});
