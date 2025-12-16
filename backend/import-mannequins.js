// backend/import-mannequins.js
const { PrismaClient } = require('./generated/prisma');
const PDFParser = require("pdf2json");
const path = require('path');

const prisma = new PrismaClient();

// --- Configuration ---
const PDF_PATH = path.join(__dirname, 'data', 'maniquies.pdf');
const CATEGORY_NAME = "Maniquies de Entrenamiento";
const BRAND_NAME = "Genérico"; // A default brand for these products
const PLACEHOLDER_IMAGE_URL = 'https://via.placeholder.com/300?text=Imagen+no+disponible';

const importFromPdf = async () => {
  console.log(`[IMPORTER] Iniciando importación desde ${PDF_PATH}...`);
  const pdfParser = new PDFParser(this, 1);

  pdfParser.on("pdfParser_error", errData => {
    console.error("Error al parsear el PDF:", errData.parserError);
    process.exit(1);
  });

  pdfParser.on("pdfParser_dataReady", async (pdfData) => {
    try {
      console.log("[IMPORTER] PDF leído. Procesando datos...");
      
      // Ensure Category and Brand exist
      const category = await prisma.category.upsert({
        where: { name: CATEGORY_NAME },
        update: {},
        create: { name: CATEGORY_NAME },
      });
      const brand = await prisma.brand.upsert({
        where: { name: BRAND_NAME },
        update: {},
        create: { name: BRAND_NAME },
      });
      console.log(`[IMPORTER] Categoría "${CATEGORY_NAME}" y Marca "${BRAND_NAME}" aseguradas.`);

      // --- PDF Data Processing ---
      // This part is experimental and depends heavily on the PDF structure.
      // We assume each piece of text has X and Y coordinates.
      // We will group texts by their Y coordinate to form "rows".
      const textsByRow = {};
      pdfData.Pages.forEach(page => {
        page.Texts.forEach(text => {
          const y = text.y; // Y coordinate
          if (!textsByRow[y]) {
            textsByRow[y] = [];
          }
          // The text is URL-encoded, so we need to decode it.
          textsByRow[y].push({ text: decodeURIComponent(text.R[0].T), x: text.x });
        });
      });

      // Sort rows by Y coordinate and texts within rows by X coordinate
      const sortedRows = Object.values(textsByRow).map(row => row.sort((a, b) => a.x - b.x).map(t => t.text));

      // Assuming the table columns are: Product Name, Description, Picture, Price, Remark
      // We will skip the header row.
      let importedCount = 0;
      for (const row of sortedRows) {
        if (row.length < 4) continue; // Skip rows that don't have enough columns
        if (row[0].toLowerCase().includes('product name')) continue; // Skip header

        const name = row[0].trim();
        const originalPriceText = row[3].trim().replace('$', ''); // Get price and remove '$'
        const originalPrice = parseFloat(originalPriceText);

        if (!name || isNaN(originalPrice)) {
            console.warn(`[IMPORTER] Saltando fila inválida: ${row.join(' | ')}`);
            continue;
        }

        // --- Applying Business Logic ---
        const resalePrice = originalPrice * 2; // +100% markup
        const description = "Para obtener más información del producto, contactar directamente al WhatsApp.";
        const id = `pedido-${name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;

        await prisma.product.upsert({
          where: { sourceUrl: `pdf-import-${name}` }, // Use a unique identifier
          update: {
            resalePrice,
            description,
          },
          create: {
            id,
            name,
            description,
            originalPrice,
            resalePrice,
            currency: 'USD',
            isSpecialOrder: true,
            stock: 0,
            brandId: brand.id,
            categories: { connect: { id: category.id } },
            sourceUrl: `pdf-import-${name}`, // Unique source to prevent duplicates
            images: {
              create: [{ url: PLACEHOLDER_IMAGE_URL }],
            },
          },
        });
        
        importedCount++;
        console.log(`[IMPORTER] Producto importado/actualizado: ${name}`);
      }

      console.log(`[IMPORTER] ¡Proceso completado! Se importaron/actualizaron ${importedCount} productos.`);

    } catch (error) {
      console.error("Error durante el guardado en la base de datos:", error);
    } finally {
      await prisma.$disconnect();
    }
  });

  pdfParser.loadPDF(PDF_PATH);
};

importFromPdf();
