import { Page } from "puppeteer";
import { EnergyDrink } from "../models/energyDrink.js";
import { countPromo, randomDelay } from "./helperFunctions.js";

export async function countNumberOfPagesToScrape(page: Page): Promise<number> {
    // Number of energy drinks in store
    const numberOfEnergyDrinks: number = await findTotalNumberOfEnergyDrinks(page);
    
    // Number of energy drinks showed per page
    const numberOfProductsPerPage: number = await page.$eval('span.load-more__label', el => parseInt(el.textContent.trim().split(' ')[0] || '1') ?? 1);

    if (!numberOfProductsPerPage) {
        console.error('Could not determine number of products per page.');
        return 0;
    }
    console.log(`Number of products per page: ${numberOfProductsPerPage}`);

    // Number of pages to scrape
    const numberOfPages: number = Math.ceil(numberOfEnergyDrinks / numberOfProductsPerPage);
    console.log(`Number of pages to scrape: ${numberOfPages}`);

    return numberOfPages;
}

async function findTotalNumberOfEnergyDrinks(page: Page): Promise<number> {
    try{
        await page.waitForSelector('.promo-filters__overview', { timeout: 10000 });
        console.log('Selector for number of energy drinks found.');

        const numberOfEnergyDrinks: number | null = await page.$eval('.promo-filters__overview', el => parseInt(el.textContent.trim().split('&nbsp;')[0] || '') ?? null);

        if (!numberOfEnergyDrinks || isNaN(numberOfEnergyDrinks)) {
            console.error('Could not determine number of energy drinks.');
            return 0;
        } else {
            console.log(`Number of energy drinks available: ${numberOfEnergyDrinks}`);
            return numberOfEnergyDrinks;
        }
    } catch (error) {
        console.error('Error finding selector for number of energy drinks:', error);
        return 0;
    }
}

export async function scrapePage(page: Page, url: string, pageNumber: number, brands: string[], variants: string[], baseUrl: string): Promise<EnergyDrink[]> {
        
    console.log(`\nColruyt: Scraping page ${pageNumber}...`);
    
    // Navigate to the desired page with human-like behavior
    await randomDelay(1000, 3000); // Random delay before navigation
    await page.goto(`${url}&page=${pageNumber}`, { waitUntil: 'networkidle2' });
    await randomDelay(2000, 4000);

    // Check for bot detection
    const pageContent: string = await page.content();
    if (pageContent.includes('Sorry') && pageContent.includes('onderbreking')) {
        console.log(`Page ${pageNumber} blocked by bot detection`);
        return [];
    }

    // Scrape products on the page
    const allProductsOnPage: EnergyDrink[] = await FindProductsMatchingTheCriteria(page, brands, variants, baseUrl);

    // Log the number of results per page
    console.log(`\nFound ${countPromo(allProductsOnPage)} products at promo price on page ${pageNumber}`);
    console.log(`Found ${allProductsOnPage.length} products in total on page ${pageNumber}`);

    return allProductsOnPage;
};

async function FindProductsMatchingTheCriteria(page: Page, brands: string[], variants: string[], baseUrl: string): Promise<EnergyDrink[]> {
    const allProducts: EnergyDrink[] = [];

    for (const brand of brands) {
        // Check all products on the page
        const products: EnergyDrink[] = await page.$$eval(`[data-tms-product-brand="${brand}"]`, (elements, brand, baseUrl, variants) => {
                return elements
                    .flatMap(el => { // Products is an array that contains arrays of energy drinks (standard + promo) per brand
                        const productsToReturn: EnergyDrink[] = [];
                        const productName: string = el.getAttribute('data-tms-product-name')?.toLowerCase().trim() ?? '';
                        if (!productName) {
                            console.log('Product name not found, skipping product.');
                            return [];
                        }
                        
                        // Scrape only information for sugarfree variants, except when the brand is NALU (then include all)
                        if(brand.toUpperCase() == 'NALU' || 
                            (brand.toUpperCase() != ('NALU') && variants.some(variant => productName.includes(variant.toLowerCase())))) {

                            // Parse volume in liter to number
                            let volumeInLiter: number = 0;
                            const quantityText: string = el.querySelector('.card__quantity')?.textContent || '';
                            const quantityMatch: RegExpMatchArray | null = quantityText.match(/(\d+)cl/);
                            if (quantityMatch && quantityMatch[1]) {
                                volumeInLiter = parseInt(quantityMatch[1]) / 100;
                            }

                            // Instantiate EnergyDrink object
                            const product: EnergyDrink = {
                                name: `${brand} ${el.getAttribute('data-tms-product-name')?.trim()}` || brand,
                                brand: brand,
                                numberOfCans: 1,
                                priceInEurPerLiter: parseFloat(el.getAttribute('data-tms-product-unitprice') ?? '') || 0,
                                volumeInLiter: volumeInLiter,
                                store: 'Colruyt',
                                url: `${baseUrl}/${el.getAttribute('data-tms-product-id')}`,
                                imageUrl: el.querySelector('div.card__image img')?.getAttribute('src') ?? 'Image not found',
                            };

                            // Check for promo and add remark if found
                            const promotion: string | null = el.getAttribute('data-tms-product-promotion');
                            if (promotion) {
                                const promoText: string = (el.querySelector('.promos__description')?.textContent?.replace(/stmet/gi, "st met")?.trim() || '/');
                                const promoPriceElement: Element | null = el.querySelector('.promos__wrapper');
                                if(promoPriceElement) {
                                    const promoPriceText: string = (promoPriceElement.textContent?.trim() || '');
                                    product.promo = promoText + ' - ' + promoPriceText;
                                } else {
                                    product.promo = promoText;
                                }
                            }

                            productsToReturn.push(product);
                        }
                        return productsToReturn;
                    })
                    .filter(product => product !== null) // Keep only products that are not null (and thus meets criteria)
            },
            brand,
            baseUrl,
            variants
        );

        allProducts.push(...products);

        // Log the number of results per brand
        console.log(`\nFound ${countPromo(products)} ${brand} products at promo price`);
        console.log(`Found ${products.length} ${brand} products in total`);
    }

    return allProducts;
}