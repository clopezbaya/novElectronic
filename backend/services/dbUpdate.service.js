const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const scrapeProducts = require('./externalProductService');

const CACHE_DURATION_HOURS = parseFloat(process.env.CACHE_DURATION_HOURS || '24');
const CACHE_DURATION_MS = CACHE_DURATION_HOURS * 60 * 60 * 1000;

const updateDatabaseIfNeeded = async () => {
    // This logic only runs in development to prevent crashing production servers
    if (process.env.NODE_ENV !== 'production') {
        const now = Date.now();

        const lastProductUpdate = await prisma.product.findFirst({
            orderBy: { updatedAt: 'desc' },
            select: { updatedAt: true },
        });

        const isDatabaseEmpty = !lastProductUpdate;

        // Scrape if the DB is empty, or if the last update is older than the cache duration
        const isCacheInvalid = isDatabaseEmpty || (now - lastProductUpdate.updatedAt.getTime() >= CACHE_DURATION_MS);

        if (isCacheInvalid) {
            try {
                console.log('[DB_UPDATE] La base de datos está vacía o el caché ha expirado, iniciando scraping...');
                await scrapeProducts(prisma);
                console.log('[DB_UPDATE] Base de datos poblada/actualizada exitosamente.');
            } catch (error) {
                console.error('[DB_UPDATE] Error durante el scraping:', error);
                throw new Error('Error al poblar la base de datos desde el scraper.');
            }
        } else {
            console.log('[DB_UPDATE] La base de datos está actualizada, no se necesita scraping.');
        }
    }
};

module.exports = { updateDatabaseIfNeeded };