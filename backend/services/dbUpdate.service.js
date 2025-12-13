const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const scrapeProducts = require('./externalProductService');

const updateDatabaseIfNeeded = async () => {
    // This logic should only run in development to prevent crashing production servers.
    // In production, the database should be populated via other means (e.g., manual seeding, admin UI).
    if (process.env.NODE_ENV !== 'production') {
        const productCount = await prisma.product.count();
        if (productCount === 0) {
            try {
                console.log('[DB_UPDATE] La base de datos está vacía, iniciando scraping...');
                await scrapeProducts(prisma);
                console.log('[DB_UPDATE] Base de datos poblada exitosamente.');
            } catch (error) {
                console.error('[DB_UPDATE] Error durante el scraping:', error);
                // We throw the error so the calling endpoint can handle it
                throw new Error('Error al poblar la base de datos desde el scraper.');
            }
        } else {
            console.log('[DB_UPDATE] La base de datos ya contiene productos, no se necesita scraping.');
        }
    }
};

module.exports = { updateDatabaseIfNeeded };
