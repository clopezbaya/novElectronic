const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const { updateDatabaseIfNeeded } = require('../services/dbUpdate.service');

const getBrands = async (req, res) => {
    try {
        await updateDatabaseIfNeeded(); // Ensure DB is populated if empty (dev only)
        const brands = await prisma.brand.findMany({
            select: { id: true, name: true },
            distinct: ['name'],
        });
        console.log(`[API] Sirviendo ${brands.length} marcas desde la base de datos.`);
        res.json(brands);
    } catch (error) {
        console.error('[API] Error en /api/brands:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

const getCategories = async (req, res) => {
    try {
        await updateDatabaseIfNeeded(); // Ensure DB is populated if empty (dev only)
        const categories = await prisma.category.findMany({
            select: { id: true, name: true },
            distinct: ['name'],
        });
        console.log(`[API] Sirviendo ${categories.length} categorías desde la base de datos.`);
        res.json(categories);
    } catch (error) {
        console.error('[API] Error en /api/categories:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

module.exports = {
    getBrands,
    getCategories,
};