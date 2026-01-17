import { ElementHandle, Page } from 'puppeteer';
import {EnergyDrink} from '../models/energyDrink.js';

// ----- SCRAPING HELPERS -----

// Helper function to scroll down and load more content
export async function scrollOnPageToLoadMoreContent(page: Page, pauseTime: number = 1000, maxScrolls: number = 30): Promise<void> {
    let lastHeight: number = await page.evaluate('document.body.scrollHeight') as number;
    let scrolls: number = 0;

    while (scrolls < maxScrolls) {
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
        await new Promise(resolve => setTimeout(resolve, pauseTime));

        const newHeight: number = await page.evaluate('document.body.scrollHeight') as number;
        if (newHeight === lastHeight) break;

        lastHeight = newHeight;
        scrolls++;
    }

    console.log(`Scrolling completed after ${scrolls} iterations.`);
}

// Helper function for human-like delays
export function randomDelay(min: number = 1000, max: number = 3000): Promise<void> {
    const delay: number = Math.random() * (max - min) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
};

// Helper to click buttons or links with specific text
export async function clickButtonOrLink(title: string, selector: string, page: Page, timeout: number = 5000): Promise<void> {
    const element: ElementHandle | null = await page.waitForSelector(selector, { timeout });
    if (element) {
        try {
            await element.click();
            console.log(`Clicked on ${title}.`);
            await randomDelay(2000, 6000); // Random delay between 2-6 seconds
        } catch {
            console.log(`Error clicking on ${title}.`);
        }
    } else {
        console.log(`'${title}' button/link not found within timeout.`);
    }
}

// ----- LOGGING HELPERS -----
export function countStandard(products: EnergyDrink[]): number {
    return products.filter(p => !p.promo).length;
}

export function countPromo(products: EnergyDrink[]): number {
    return products.filter(p => p.promo).length;
}

export function logResultsForScraper(products: EnergyDrink[], storeName: string): void {
    console.log(`\n${storeName} SCRAPER RESULTS:`);
    console.log("***********************\n");
    console.log('Total promo products found:', countPromo(products));
    console.log('Total of products found:', products.length, '\n');
    if (products.length !== 0) {
        console.log(...products);
    }
}

// ----- ANALYSIS FUNCTIONS -----
export function findEnergyDrinkWithLowestPricePerLiter(energyDrinks: EnergyDrink[]): void {
    let lowestPriceDrink: EnergyDrink | null = null;

    for (const drink of energyDrinks) {
        if (drink.priceInEurPerLiter !== null) {
            if (!lowestPriceDrink ||
                (lowestPriceDrink.priceInEurPerLiter === null && drink.priceInEurPerLiter !== null) ||
                (lowestPriceDrink.priceInEurPerLiter !== null && drink.priceInEurPerLiter < lowestPriceDrink.priceInEurPerLiter)) {
                lowestPriceDrink = drink;
            }
        }
    }

    console.log('\nLOWEST PRICE PER LITER:');
    console.log('***********************\n');

    if (lowestPriceDrink) {
        console.log(`- ${lowestPriceDrink.name} @ ${lowestPriceDrink.store}: ${lowestPriceDrink.priceInEurPerLiter} EUR/L` );
    } else {
        console.log('Something went wrong when searching for the energy drink with the lowest price.');
    }
}

export function showPromoProducts(energyDrinks: EnergyDrink[]): void {
    console.log('\nLIST OF PROMO PRODUCTS:');
    console.log('***********************\n');

    if(energyDrinks.length === 0) {
        console.log('No energy drinks found.');
        return;
    }

    if(!energyDrinks.some(product => product.promo)) {
        console.log('No promo products found.');
        return;
    }

    const promoProducts: EnergyDrink[] = energyDrinks.filter(product => product.promo);

    promoProducts.forEach(product => {
        console.log(`- ${product.name} @ ${product.store}: ${product.priceInEurPerLiter} EUR/L ----- ${product.promo}` );
    });
}