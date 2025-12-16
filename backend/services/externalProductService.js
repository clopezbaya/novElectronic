const puppeteer = require('puppeteer');
const dotenv = require('dotenv');

dotenv.config();

const calculateResalePrice = (originalPrice) => {
    if (originalPrice >= 2000) {
        return Math.round(originalPrice * 1.20); // +20%
    } else if (originalPrice >= 500) {
        return Math.round(originalPrice * 1.35); // +35%
    } else if (originalPrice >= 200) {
        return Math.round(originalPrice * 1.42); // +42%
    } else { // For prices less than 200
        return Math.round(originalPrice * 1.50); // +50%
    }
};

const scrapeProducts = async (prisma) => {
    console.log('[SCRAPER] Iniciando scraping de productos...');
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('[SCRAPER] Navegador Puppeteer iniciado.');

    const defaultCategories = ['Electronicos', 'Salud'];
    for (const catName of defaultCategories) {
        await prisma.category.upsert({
            where: { name: catName },
            update: {},
            create: { name: catName },
        });
    }
    console.log('[SCRAPER] Categorías por defecto aseguradas en la DB.');
    const electronicsCategory = await prisma.category.findUnique({ where: { name: 'Electronicos' } });

    const productItemSelector = process.env.SCRAPE_PRODUCT_ITEM_SELECTOR;
    const productNameSelector = process.env.SCRAPE_PRODUCT_NAME_SELECTOR;
    const productPriceSelector = process.env.SCRAPE_PRODUCT_PRICE_SELECTOR;
    const listingImageSelector = process.env.SCRAPE_LISTING_IMAGE_SELECTOR;
    const productDescriptionSelector = process.env.SCRAPE_PRODUCT_DESCRIPTION_SELECTOR;
    const productStockSelector = process.env.SCRAPE_PRODUCT_STOCK_SELECTOR;
    const concurrencyLimit = parseInt(process.env.CONCURRENCY_LIMIT || '5', 10);

    let page;
    try {
        page = await browser.newPage();
        await page.setDefaultNavigationTimeout(60000);

        console.log('[SCRAPER] Navegando a la página de login...');
        await page.goto(process.env.SCRAPE_LOGIN_URL, { waitUntil: 'domcontentloaded' });
        
        await page.type(process.env.SCRAPE_USERNAME_SELECTOR, process.env.SCRAPE_USERNAME);
        await page.type(process.env.SCRAPE_PASSWORD_SELECTOR, process.env.SCRAPE_PASSWORD);
        
        console.log('[SCRAPER] Intentando iniciar sesión...');
        await Promise.all([
            page.click(process.env.SCRAPE_LOGIN_BUTTON_SELECTOR),
            page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
        ]);
        console.log('[SCRAPER] Sesión iniciada correctamente. Navegando a la página de productos...');

        await page.goto(process.env.SCRAPE_PRODUCTS_URL, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector(productItemSelector, { timeout: 30000 });
        console.log('[SCRAPER] Página de listado de productos cargada.');

        // Click the stock filter checkbox and wait for the page to update
        const checkStockSelector = process.env.CHECK_STOCK;
        if (checkStockSelector) {
            console.log(`[SCRAPER] Haciendo click en el filtro de stock: ${checkStockSelector}`);
            const checkbox = await page.$(checkStockSelector);
            if (checkbox) {
                await checkbox.click();
                console.log('[SCRAPER] Filtro de stock aplicado, esperando a que la página se actualice...');
                await page.waitForNetworkIdle({ idleTime: 1000, timeout: 60000 });
                console.log('[SCRAPER] Página de productos actualizada con el filtro de stock.');
            } else {
                console.warn(`[SCRAPER] Selector de filtro de stock no encontrado: ${checkStockSelector}`);
            }
        }

        let products = await page.evaluate(
            (itemSel, nameSel, priceSel, listingImageSel, stockSel) => {
                const items = document.querySelectorAll(itemSel);
                const scraped = [];

                items.forEach((el) => {
                    const nameElement = el.querySelector(nameSel);
                    const name = nameElement?.innerText.trim() || 'N/A';
                    const productUrl = nameElement?.href || '#';

                    // Reverting to URL-based ID generation
                    const urlParts = productUrl.split('?');
                    const rawId = urlParts.length > 1 ? urlParts[1] : `product-${name.substring(0, 10)}-${Math.random()}`;
                    const id = decodeURIComponent(rawId)
                        .replace(/\s+/g, '-')
                        .replace(/[^a-zA-Z0-9-]/g, '');

                    if (!id) return;

                    const priceWholeElement = el.querySelector(priceSel);
                    const priceText = priceWholeElement?.firstChild?.nodeValue?.trim() || '0';
                    const originalPrice = parseFloat(priceText.replace(/,/g, ''));

                    const stockText = el.querySelector(stockSel)?.innerText.trim() || 'stock: 0';
                    let stock = 0;
                    const stockMatch = stockText.match(/(\d+)\+?/);
                    if (stockMatch && stockMatch[1]) {
                        stock = parseInt(stockMatch[1], 10);
                    }

                    const brandName = 'Havit';
                    const imageUrl = el.querySelector(listingImageSel)?.src || 'https://via.placeholder.com/150';

                    scraped.push({
                        id,
                        name,
                        originalPrice,
                        imageUrl,
                        productUrl,
                        brandName,
                        category: 'Electronics',
                        stock,
                    });
                });
                return scraped;
            },
            productItemSelector,
            productNameSelector,
            productPriceSelector,
            listingImageSelector,
            productStockSelector
        );
        console.log(`[SCRAPER] Raspeo básico completado. ${products.length} productos encontrados.`);
        await page.close();

        const productChunks = [];
        for (let i = 0; i < products.length; i += concurrencyLimit) {
            productChunks.push(products.slice(i, i + concurrencyLimit));
        }
        console.log(`[SCRAPER] Iniciando raspado de descripciones y guardado en DB con ${productChunks.length} bloques.`);

        for (const chunk of productChunks) {
            await Promise.allSettled(chunk.map(async (product) => {
                let productPage;
                const forceFullRescrape = process.env.FORCE_FULL_RESCRAPE === 'true';

                try {
                    const existingProduct = await prisma.product.findUnique({
                        where: { id: product.id },
                        select: { description: true }
                    });

                    if (!forceFullRescrape && existingProduct && existingProduct.description && existingProduct.description !== 'No hay descripción disponible.') {
                        console.log(`[SCRAPER] Saltando ${product.name}, ya tiene descripción.`);
                        return;
                    }

                    productPage = await browser.newPage();
                    await productPage.setDefaultNavigationTimeout(60000);
                    
                    if (product.productUrl === '#') {
                        console.warn(`[SCRAPER] URL inválida para el producto ${product.name}, saltando.`);
                        return;
                    }
                    
                    await productPage.goto(product.productUrl, { waitUntil: 'domcontentloaded' });

                    const descriptionSelectors = [
                        productDescriptionSelector,
                        'div.product-description',
                        'div.description',
                        'div[itemprop="description"]'
                    ];
                    
                    // Wait for the description element to appear and have actual text content
                    await productPage.waitForFunction(
                        (selectors) => {
                          for (const selector of selectors) {
                            const el = document.querySelector(selector);
                            if (el && el.textContent && el.textContent.trim().length > 0) {
                              return true; // Found an element with content
                            }
                          }
                          return false; // Not found yet
                        },
                        { timeout: 10000 }, // Wait for up to 10 seconds
                        descriptionSelectors
                    ).catch(() => console.warn(`[SCRAPER] La descripción para ${product.name} no apareció o estaba vacía después de 10s.`));

                    const description = await productPage.evaluate((selectors) => {
                        for (const selector of selectors) {
                            const el = document.querySelector(selector);
                            if (el) {
                                const text = el.textContent || '';
                                if (text.trim()) {
                                    return text.trim();
                                }
                            }
                        }
                        return 'No hay descripción disponible.';
                    }, descriptionSelectors);

                    const additionalImageUrls = await productPage.evaluate((detailSel) => {
                        const images = Array.from(document.querySelectorAll(detailSel));
                        return images.map(img => img.src);
                    }, "div#scroll-menu-container .cz-thumblist-item img");

                    let allImageUrls = [product.imageUrl, ...additionalImageUrls].filter(url => url && url.length > 0 && url.includes('product_images'));
                    allImageUrls = [...new Set(allImageUrls)];
                    if (allImageUrls.length === 0) {
                        allImageUrls.push('https://via.placeholder.com/150');
                    }

                    const resalePrice = calculateResalePrice(product.originalPrice);

                    const brand = await prisma.brand.upsert({
                        where: { name: product.brandName },
                        update: {},
                        create: { name: product.brandName },
                    });

                    if (product.stock > 0) {
                        // Adding try/catch around upsert to handle potential unique constraint failures gracefully
                        try {
                            await prisma.product.upsert({
                                where: { id: product.id },
                                update: {
                                    name: product.name,
                                    description: description,
                                    originalPrice: product.originalPrice,
                                    resalePrice: parseFloat(resalePrice.toFixed(2)),
                                    sourceUrl: product.productUrl,
                                    brandId: brand.id,
                                    stock: product.stock,
                                    categories: { connect: { id: electronicsCategory.id } },
                                    images: {
                                        deleteMany: {},
                                        create: allImageUrls.map((url) => ({ url })),
                                    },
                                },
                                create: {
                                    id: product.id,
                                    name: product.name,
                                    description: description,
                                    originalPrice: product.originalPrice,
                                    resalePrice: parseFloat(resalePrice.toFixed(2)),
                                    sourceUrl: product.productUrl,
                                    brandId: brand.id,
                                    stock: product.stock,
                                    categories: { connect: { id: electronicsCategory.id } },
                                    images: {
                                        create: allImageUrls.map((url) => ({ url })),
                                    },
                                },
                            });
                            console.log(`[SCRAPER] Producto guardado/actualizado en DB: ${product.name}`);
                        } catch (dbError) {
                            if (dbError.code === 'P2002') { // Prisma code for unique constraint violation
                                console.warn(`[SCRAPER] No se pudo guardar '${product.name}'. El ID '${product.id}' ya existe y causa un conflicto. Saltando.`);
                            } else {
                                throw dbError;
                            }
                        }
                    } else {
                        console.log(`[SCRAPER] Producto '${product.name}' (${product.id}) no guardado: fuera de stock.`);
                    }
                } catch (descErr) {
                    console.warn(`[SCRAPER] No se pudo procesar la página de detalles para ${product.name} (${product.productUrl}):`, descErr.message);
                } finally {
                    if (productPage) await productPage.close();
                }
            }));
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