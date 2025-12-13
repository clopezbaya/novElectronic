const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const { updateDatabaseIfNeeded } = require('../services/dbUpdate.service');

const getAllProducts = async (req, res) => {
    try {
        if (process.env.NODE_ENV !== 'production') {
            await updateDatabaseIfNeeded();
        }
        const { search, brand, category } = req.query;

        let whereClause = {
            stock: { gt: 0 },
        };

        if (search) {
            whereClause.name = { contains: search.toString(), mode: 'insensitive' };
        }
        if (brand) {
            whereClause.brand = { name: { equals: brand.toString(), mode: 'insensitive' } };
        }
        if (category) {
            whereClause.categories = { some: { name: { equals: category.toString(), mode: 'insensitive' } } };
        }
        
        const totalProducts = await prisma.product.count({ where: whereClause });
        const products = await prisma.product.findMany({
            where: whereClause,
            include: { brand: true, categories: true, images: true },
        });

        const formattedProducts = products.map((p) => ({
            id: p.id,
            title: p.name,
            image: p.images[0]?.url || 'https://via.placeholder.com/150',
            images: p.images.map(img => img.url),
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
        });
    } catch (error) {
        console.error('[API] Error en /api/products:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

const getProductById = async (req, res) => {
    try {
        if (process.env.NODE_ENV !== 'production') {
            await updateDatabaseIfNeeded();
        }
        const { id } = req.params;
        const product = await prisma.product.findUnique({
            where: {
                id: id,
                stock: { gt: 0 },
            },
            include: { brand: true, categories: true, images: true },
        });

        if (product) {
            const formattedProduct = {
                id: product.id,
                title: product.name,
                image: product.images[0]?.url || 'https://via.placeholder.com/150',
                images: product.images.map(img => img.url),
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
            res.status(404).json({ message: 'Producto no encontrado' });
        }
    } catch (error) {
        console.error(`[API] Error en /api/products/${req.params.id}:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
};
