import puppeteer, { Browser, Page, ElementHandle } from 'puppeteer';
import { EnergyDrink } from '../models/energyDrink.js';
import { randomDelay } from '../helpers/helperFunctions.js';

export async function getEnergyDrinksForSelectedBrand(page: Page, brandName: string, variants: string[]): Promise<EnergyDrink[]> {
    const productsForBrand: EnergyDrink[] = [];

    const brandFilterElement: ElementHandle | null = await page.waitForSelector('div[data-testhook="products-filter-block-merk"]', { timeout: 3000 });
    if (!brandFilterElement) {
        console.log("Brand filter element not found in filter options list.");
        return [];
    }
    
    await randomDelay(500, 1000); // Small delay before expanding filters
    clickMeerFiltersButton(page);

    // Check if any filter option matches the brand name
    let isMatch: boolean = false;
    const filterOptions: ElementHandle<Element>[] = await brandFilterElement.$$('a.product-filter_root__cK-N5');
    for (const option of filterOptions) {
        const optionText: string | null = await option.evaluate(el => el.textContent?.trim() || '');
        if (optionText && optionText.toUpperCase().includes(brandName.toUpperCase())) {
            isMatch = true;
            
            // Human-like interaction: hover before clicking
            await option.hover();
            await randomDelay(200, 500);
            await option.click();
            console.log(`Clicked on brand filter: ${optionText}`);
            
            // Wait for page to update after filter selection
            await randomDelay(1000, 2000);
            break; // Exit after first match
        } 
    }

    if (!isMatch) {
        console.log(`No matching brand filter found for: ${brandName}`);
        return [];
    }

    await randomDelay(1000, 2000); // Wait for filter to apply

    // Only scrape information for products that are the sugar free variants of the filtered brand (unless the brand is NALU)
    const productElements: ElementHandle<Element>[] = await page.$$('article[data-testid="product-card"]');
    console.log(`Number of products after applying filter for ${brandName}: ${productElements.length}`);
    await randomDelay(3000, 5000);

    for (const productElement of productElements) {

        if(brandName === 'NALU') {
            const product: EnergyDrink | null = await findProductInformation(productElement, brandName, '');
            if (product) {
                productsForBrand.push(product);
            }
        } else {
            for(const variant of variants) {
                const product: EnergyDrink | null = await findProductInformation(productElement, brandName, variant);
                if (product) {
                    productsForBrand.push(product);
                }
            }
        }
    }

    console.log(`Found ${productsForBrand.length} matching products for brand ${brandName}`);

    return productsForBrand;
}

async function clickMeerFiltersButton(page: Page): Promise<void> {
    const moreFiltersBtn: ElementHandle | null = await page.$('button[aria-label="Toon meer filter opties binnen product.brand.name"]');
    if (moreFiltersBtn) {
        await moreFiltersBtn.click();
        console.log("Expanded brand filters.");
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

async function getImageUrl (productElement: ElementHandle<Element>): Promise<string> {
    const imageElement: ElementHandle<Element> | null = await productElement.$('div.header_root__ilMls a figure img') || null;
    const imageUrl: string | null = await imageElement?.evaluate(el => el.getAttribute('src')) ?? 'Image URL not found';
    return imageUrl;
}

async function findProductInformation(productElement: ElementHandle<Element>, brandName: string, variant: string): Promise<EnergyDrink | null> {
    const productNameElement: ElementHandle<Element> | null = await productElement.$('div.product-card-portrait_content__DQ9nP a');

    if (!productNameElement) {
        return null;
    }
    
    const productName: string | null = await productNameElement.evaluate(el => el.textContent?.trim() || '');
    
    if (productName && productName.toLowerCase().includes(variant.toLowerCase())) {
        const product: EnergyDrink = {
                name: productName,
                brand: brandName,
                numberOfCans: 1,
                volumeInLiter: 0,
                priceInEurPerLiter: 0,
                store: 'Albert Heijn',
                url: null,
                imageUrl: await getImageUrl(productElement),
            };

        const quantityInfoElement: ElementHandle<Element> | null = await productElement.$('span.price_unitSize__Hk6E4');
        if (quantityInfoElement) { 
            const quantityInfoText: string  = await quantityInfoElement.evaluate(el => el.textContent?.trim() || '');
            if (quantityInfoText) {
                let volumeInLiter: number = 0;
                let numberOfCans: number = 1;

                if (quantityInfoText.toLowerCase().includes('x')) {
                    numberOfCans = parseInt(quantityInfoText.split(' x ')[0] ?? '') || 1;
                    const volumeText: string = quantityInfoText.split(' x ')[1]?.replace(' l', '').replace(',', '.') ?? '';
                    volumeInLiter = parseFloat(volumeText) || 0;
                } else {
                    volumeInLiter = quantityInfoText.split(' ')[1] == 'l' 
                    ? parseFloat(quantityInfoText.split(' ')[0]?.replace(',', '.') || '0') || 0
                    : parseFloat(quantityInfoText.split(' ')[0]?.replace(',', '.') || '0') / 1000 || 0;
                }

                if(product.name?.includes('-pack')){
                    numberOfCans = parseInt(product.name.split('-pack')[0]?.slice(-2) ?? '') || 1;  
                }

                product.volumeInLiter = volumeInLiter;
                product.numberOfCans = numberOfCans;
            }
        }

        // URL
        const productUrl: string = await productNameElement.evaluate(el => el.getAttribute('href')) ?? 'url not found';                    
        if (productUrl) {
            const detailPageUrl = `https://www.ah.be${productUrl}`;
            product.url = detailPageUrl;
        }

        // Check for promotion
        const promotionElement: ElementHandle<Element> | null = await productElement.$('span.shield_text__kNeiW');
        if (promotionElement) {
            const promotionText: string = await promotionElement.evaluate(el => el.textContent?.trim() || '');
            if (promotionText) {
                product.promo = promotionText ?? "";
            }   
        }

        return product;
    } else {
        return null;
    }
}

export async function scrapeDetailPageForPricePerLiter(productUrl: string, productName: string): Promise<number> {
    const browser: Browser = await puppeteer.launch({ 
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page: Page = await browser.newPage();
    
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'nl-BE,nl;q=0.9,en;q=0.8'
    });

    console.log(`Starting detailpage scraper for product: ${productName}`);

    await page.goto(productUrl, { waitUntil: 'networkidle2' });
    await randomDelay(2000, 4000); // Random delay between 2-4 seconds

    // Extract price per liter directly from page
    const quantityInfoElement: ElementHandle<Element> | null = await page.waitForSelector('span.product-card-header_unitPriceWithPadding__oW5Pe');
    const quantityInfoText: string = await quantityInfoElement?.evaluate(el => el.textContent?.trim() || '').catch(() => '') ?? '';
    if (!quantityInfoText) {
        browser.close();
        return 0;
    }

    const quantityInfoTextSplit: string[] = quantityInfoText ? quantityInfoText.split(' ') : [];
    const pricePerLiter = parseFloat(quantityInfoTextSplit[quantityInfoTextSplit.length - 1]?.replace(',', '.') || '0') || 0;

    browser.close();

    return pricePerLiter;
}