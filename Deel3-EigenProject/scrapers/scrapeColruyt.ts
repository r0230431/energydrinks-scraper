import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { Page, Browser } from "puppeteer";
import { EnergyDrink } from "../models/energyDrink.js";
import { randomDelay, logResultsForScraper } from "../helpers/helperFunctions.js";
import { countNumberOfPagesToScrape, scrapePage } from "../helpers/colruytHelpers.js";

// Add stealth plugin for bot detection evasion
puppeteer.use(StealthPlugin());

async function scrapeColruyt(brands: string[], variants: string[]): Promise<EnergyDrink[]> {
    const baseUrl: string = 'https://www.colruyt.be/nl/producten';
    //354 = Dranken, 372 = Frisdranken, 1709 = Energy drinks - Filters not 'manually' applied by scraper due to bot detection
    const energyDrinksUrl: string = 'https://www.colruyt.be/nl/producten?categories=354&categories=372&categories=1709';
    const allSelectedEnergyDrinks: EnergyDrink[] = [];

    const browser: Browser = await puppeteer.launch({ 
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page: Page = await browser.newPage();
    
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'nl-BE,nl;q=0.9,en;q=0.8'
    });
    
    console.log('Starting Colruyt scraper...');
    
    // Navigate to energy drinks category
    await page.goto(energyDrinksUrl, { waitUntil: 'networkidle2' });
    console.log('Navigated to energy drinks category.');
    await randomDelay(4000, 6000);

    // Determine number of pages to scrape
    const numberofPages: number = await countNumberOfPagesToScrape(page);
    if (numberofPages === 0) {
        console.error('No pages to scrape.');
        await browser.close();
        return [];
    }

    // Function to scrape a single page
    for (let currentPage: number = 1; currentPage <= numberofPages; currentPage++) {
        try {
            const productsOnPage: EnergyDrink[] = await scrapePage(page, energyDrinksUrl, currentPage, brands, variants, baseUrl);
            allSelectedEnergyDrinks.push(...productsOnPage);
        } catch (error) {
            console.error(`Error scraping page ${currentPage}:`, error);
        }
    }

    await browser.close();
    
    // Log final results
    logResultsForScraper(allSelectedEnergyDrinks, 'Colruyt');

    return allSelectedEnergyDrinks;
}

export { scrapeColruyt };