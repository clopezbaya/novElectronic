const puppeteer = require('puppeteer');
const dotenv = require('dotenv');

dotenv.config();

// Obtener porcentaje de aumento del precio
const priceIncreasePercentage = parseFloat(
    process.env.PRICE_INCREASE_PERCENTAGE || '0'
);

const scrapeProducts = async (prisma) => {
    // Aceptar prisma como argumento
    console.log('[SCRAPER] Iniciando scraping de productos...');
    const browser = await puppeteer.launch({ headless: true });
    console.log('[SCRAPER] Navegador Puppeteer iniciado.');

    // Create default categories if they don't exist
    const defaultCategories = ["Electronicos", "Salud"];
    for (const catName of defaultCategories) {
        await prisma.category.upsert({
            where: { name: catName },
            update: {},
            create: { name: catName },
        });
    }
    console.log('[SCRAPER] Categorías por defecto aseguradas en la DB.');
    const electronicsCategory = await prisma.category.findUnique({ where: { name: "Electronicos" } });


    // Selectores desde .env
    const productItemSelector = process.env.SCRAPE_PRODUCT_ITEM_SELECTOR;
    const productNameSelector = process.env.SCRAPE_PRODUCT_NAME_SELECTOR;
    const productPriceSelector = process.env.SCRAPE_PRODUCT_PRICE_SELECTOR;
    const productImageSelector = process.env.SCRAPE_PRODUCT_IMAGE_SELECTOR;
    const productLinkSelector = process.env.SCRAPE_PRODUCT_LINK_SELECTOR;
    const productDescriptionSelector =
        process.env.SCRAPE_PRODUCT_DESCRIPTION_SELECTOR;
    const productStockSelector = process.env.SCRAPE_PRODUCT_STOCK_SELECTOR; // Nuevo selector para stock
    // const productCategorySelector = process.env.SCRAPE_PRODUCT_CATEGORY_SELECTOR; // Ya no es necesario
    const concurrencyLimit = parseInt(process.env.CONCURRENCY_LIMIT || '5', 10);
    console.log(
        `[SCRAPER] Límite de concurrencia para descripciones: ${concurrencyLimit}`
    );

    let page;
    try {
        page = await browser.newPage();
        console.log('[SCRAPER] Navegando a la página de login...');

        await page.goto(process.env.SCRAPE_LOGIN_URL, {
            waitUntil: 'networkidle2',
        });
        await page.type(
            process.env.SCRAPE_USERNAME_SELECTOR,
            process.env.SCRAPE_USERNAME
        );
        await page.type(
            process.env.SCRAPE_PASSWORD_SELECTOR,
            process.env.SCRAPE_PASSWORD
        );
        console.log('[SCRAPER] Intentando iniciar sesión...');
        await Promise.all([
            page.click(process.env.SCRAPE_LOGIN_BUTTON_SELECTOR),
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
        ]);
        console.log(
            '[SCRAPER] Sesión iniciada correctamente. Navegando a la página de productos...'
        );

        await page.goto(process.env.SCRAPE_PRODUCTS_URL, {
            waitUntil: 'networkidle2',
        });
        await page.waitForSelector(productItemSelector, { timeout: 15000 });
        console.log('[SCRAPER] Página de listado de productos cargada.');

        let products = await page.evaluate(
            (itemSel, nameSel, priceSel, imageSel, linkSel, stockSel) => { // categorySel removed
                const items = document.querySelectorAll(itemSel);
                const scraped = [];

                items.forEach((el) => {
                    const name =
                        el.querySelector(nameSel)?.innerText.trim() || 'N/A';
                    const priceWholeElement = el.querySelector(priceSel);
                    const priceText =
                        priceWholeElement?.firstChild?.nodeValue?.trim() || '0';
                    const originalPrice = parseFloat(priceText.replace(/,/g, ''));

                    const imageUrl =
                        el.querySelector(imageSel)?.src ||
                        'https://via.placeholder.com/150';
                    const productUrl = el.querySelector(linkSel)?.href || '#';

                    const urlParts = productUrl.split('?');
                    const rawId = urlParts.length > 1 ? urlParts[1] : '';
                    const id = decodeURIComponent(rawId).replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
                    
                    const stockText = el.querySelector(stockSel)?.innerText.trim() || 'stock: 0';
                    let stock = 0;
                    const stockMatch = stockText.match(/(\d+)\+?/);
                    if (stockMatch && stockMatch[1]) {
                        stock = parseInt(stockMatch[1], 10);
                    }

                    const brandName = "Havit"; // Hardcode Brand Name
                    const category = "Electronics"; // Hardcode Category Name for frontend display

                    scraped.push({ id, name, originalPrice, imageUrl, productUrl, brandName, category, stock });
                });

                return scraped;
            },
            productItemSelector,
            productNameSelector,
            productPriceSelector,
            productImageSelector,
            productLinkSelector,
            productStockSelector
            // productCategorySelector // Removed
        );
        console.log(`[SCRAPER] Raspeo básico completado. ${products.length} productos encontrados.`);

        await page.close();

        // Implementar concurrencia para obtener descripciones y guardar en DB
        const productChunks = [];
        for (let i = 0; i < products.length; i += concurrencyLimit) {
            productChunks.push(products.slice(i, i + concurrencyLimit));
        }
        console.log(`[SCRAPER] Iniciando raspado de descripciones y guardado en DB con ${productChunks.length} bloques.`);

        for (const chunk of productChunks) {
            const chunkPromises = chunk.map(async (product) => {
                let productPage;
                try {
                    productPage = await browser.newPage();
                    await productPage.goto(product.productUrl, { waitUntil: 'networkidle2' });
                    await productPage.waitForSelector(productDescriptionSelector, { timeout: 10000 });

                    const description = await productPage.evaluate((selector) => {
                        const el = document.querySelector(selector);
                        return el ? el.innerText.trim() : 'No hay descripción disponible.';
                    }, productDescriptionSelector);

                    const resalePrice = Math.round(
                        product.originalPrice * (1 + priceIncreasePercentage / 100)
                    );

                    // Upsert Brand (using hardcoded brandName)
                    const brand = await prisma.brand.upsert({
                        where: { name: product.brandName },
                        update: {},
                        create: { name: product.brandName },
                    });

                    // Upsert Product
                    await prisma.product.upsert({
                        where: { id: product.id },
                        update: {
                            name: product.name,
                            description: description,
                            originalPrice: product.originalPrice,
                            resalePrice: parseFloat(resalePrice.toFixed(2)),
                            imageUrl: product.imageUrl,
                            sourceUrl: product.productUrl,
                            brandId: brand.id,
                            stock: product.stock,
                            categories: {
                                connect: { id: electronicsCategory.id },
                            },
                        },
                        create: {
                            id: product.id,
                            name: product.name,
                            description: description,
                            originalPrice: product.originalPrice,
                            resalePrice: parseFloat(resalePrice.toFixed(2)),
                            imageUrl: product.imageUrl,
                            sourceUrl: product.productUrl,
                            brandId: brand.id,
                            stock: product.stock,
                            categories: {
                                connect: { id: electronicsCategory.id },
                            },
                        },
                    });
                    console.log(`[SCRAPER] Producto guardado/actualizado en DB: ${product.name}`);
                } catch (descErr) {
                    console.warn(
                        `[SCRAPER] No se pudo procesar ${product.name} (${product.productUrl}):`, descErr.message
                    );
                } finally {
                    if (productPage) await productPage.close();
                }
            });
            await Promise.allSettled(chunkPromises);
        }
        console.log('[SCRAPER] Raspado de descripciones y guardado en DB completado.');

    } catch (err) {
        console.error('[SCRAPER] Error durante el scraping:', err);
        throw err;
    } finally {
        if (browser) {
            await browser.close();
            console.log('[SCRAPER] Navegador Puppeteer cerrado.');
        }
    }
};

module.exports = scrapeProducts;
