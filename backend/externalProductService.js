const puppeteer = require('puppeteer');
const dotenv = require('dotenv');

dotenv.config();

const priceIncreasePercentage = parseFloat(process.env.PRICE_INCREASE_PERCENTAGE || '0');

const scrapeProducts = async (prisma) => {
    console.log('[SCRAPER] Iniciando scraping de productos...');
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // Args for compatibility
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
    const productLinkSelector = process.env.SCRAPE_PRODUCT_LINK_SELECTOR;
    const productDescriptionSelector = process.env.SCRAPE_PRODUCT_DESCRIPTION_SELECTOR;
    const productStockSelector = process.env.SCRAPE_PRODUCT_STOCK_SELECTOR;
    const productIdSelector = process.env.SCRAPE_PRODUCT_ID;
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

        let products = await page.evaluate(
            (itemSel, nameSel, priceSel, listingImageSel, linkSel, stockSel, idSel) => {
                const items = document.querySelectorAll(itemSel);
                const scraped = [];

                items.forEach((el) => {
                    const idElement = el.querySelector(idSel);
                    let id = idElement ? idElement.innerText.split(':')[1]?.trim() : null;
                    if (!id) return;

                    const nameElement = el.querySelector(nameSel);
                    const name = nameElement?.innerText.trim() || 'N/A';
                    
                    const priceWholeElement = el.querySelector(priceSel);
                    const priceText = priceWholeElement?.firstChild?.nodeValue?.trim() || '0';
                    const originalPrice = parseFloat(priceText.replace(/,/g, ''));

                    const productUrl = nameElement?.href || '#';

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
            productLinkSelector,
            productStockSelector,
            productIdSelector
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
                try {
                    productPage = await browser.newPage();
                    await productPage.setDefaultNavigationTimeout(60000);
                    
                    if (product.productUrl === '#') {
                        console.warn(`[SCRAPER] URL inválida para el producto ${product.name}, saltando.`);
                        return;
                    }
                    
                    await productPage.goto(product.productUrl, { waitUntil: 'domcontentloaded' });

                    const descriptionSelectors = [
                        productDescriptionSelector, // Original selector from .env
                        'div.product-description',
                        'div.description',
                        'div[itemprop="description"]'
                    ];
                    
                    // Wait for at least one of the selectors to be available
                    await Promise.any(descriptionSelectors.map(sel => productPage.waitForSelector(sel, { timeout: 10000 })))
                        .catch(() => console.warn(`[SCRAPER] Ningún selector de descripción encontrado para ${product.name}, usando descripción por defecto.`));

                    const description = await productPage.evaluate((selectors) => {
                        for (const selector of selectors) {
                            const el = document.querySelector(selector);
                            if (el && el.innerText.trim()) {
                                return el.innerText.trim();
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

                    const resalePrice = Math.round(product.originalPrice * (1 + priceIncreasePercentage / 100));

                    const brand = await prisma.brand.upsert({
                        where: { name: product.brandName },
                        update: {},
                        create: { name: product.brandName },
                    });

                    if (product.stock > 0) {
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
