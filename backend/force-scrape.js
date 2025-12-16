const { PrismaClient } = require('./generated/prisma');
const scrapeProducts = require('./services/externalProductService');

const prisma = new PrismaClient();

const forceScrape = async () => {
  console.log('Forcing a full database scrape and update...');
  try {
    // Ensure only "Havit" brand exists and get its ID
    await prisma.brand.deleteMany({ where: { name: { not: 'Havit' } } });
    const havitBrand = await prisma.brand.upsert({
      where: { name: 'Havit' },
      update: {},
      create: { name: 'Havit' },
    });
    console.log('Ensured "Havit" is the only brand.');

    // Ensure only "Electronicos" and "Salud" categories exist
    await prisma.category.deleteMany({ where: { name: { notIn: ['Electronicos', 'Salud'] } } });
    await prisma.category.upsert({
      where: { name: 'Electronicos' },
      update: {},
      create: { name: 'Electronicos' },
    });
    await prisma.category.upsert({
      where: { name: 'Salud' },
      update: {},
      create: { name: 'Salud' },
    });
    console.log('Ensured only "Electronicos" and "Salud" categories exist.');

    // Now, run the scraper
    await scrapeProducts(prisma);
    console.log('Scraping and database update completed successfully.');

  } catch (error) {
    console.error('An error occurred during the forced scrape:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

forceScrape();
