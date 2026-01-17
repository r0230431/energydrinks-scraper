import { ElementHandle } from "puppeteer";
import { EnergyDrink } from "../models/energyDrink.js";
import { clickButtonOrLink, logResultsForScraper, scrollOnPageToLoadMoreContent } from "../helpers/helperFunctions.js";
import { launchScraper } from "../helpers/launchScraper.js";
import { handleLanguageSelection, filterEnergyDrinksByBrands, ScrapeEnergyDrinksInfoOnPage } from "../helpers/delhaizeHelpers.js";

async function scrapeDelhaize(brands: string[], variants: string[]): Promise<EnergyDrink[]> {
    const baseUrl: string = 'https://www.delhaize.be/nl';
    const allSelectedEnergyDrinks: EnergyDrink[] = [];
    const {browser, page} = await launchScraper('Delhaize', baseUrl);

    // Choose language to Dutch if needed
    await handleLanguageSelection(page, 'Nederlands');

    // Navigate to energy drinks category via menu
    await clickButtonOrLink('Weigeren cookies', 'button[data-testid="cookie-popup-reject"]', page); // Reject cookies if the button is present
    await clickButtonOrLink('Categorieën', 'button[aria-label="Categorieën"]', page); // Search for 'Categorieën' button
    await clickButtonOrLink('Koude en warme dranken', 'a[href="/c/v2DRI"]', page); // Search for 'Koude en warme dranken' tile in 'Categorieën'
    await clickButtonOrLink('Frisdranken', 'a[href="/nl/shop/Koude-en-warme-dranken/Frisdrank/c/v2DRISOF"]', page);// Find 'Frisdranken' button
    await clickButtonOrLink('Energiedrank', 'a[href="/nl/shop/Koude-en-warme-dranken/Frisdrank/Energiedrank/c/v2DRISOFENE"]', page); // Find 'Energiedrank' button

    // Apply filters to get the desired energy drinks brands
    await filterEnergyDrinksByBrands(page, brands, 3000);

    // Scroll to load all products
    await scrollOnPageToLoadMoreContent(page, 1000, 30);
    
    // Find and count products on the page
    const listElements: ElementHandle[] = await page.$$('li.sc-3brks3-4.hfxJGu.product-item');
    if(!listElements || listElements.length === 0) {
        console.log('No products found on Delhaize page.');
        await browser.close();
        return allSelectedEnergyDrinks;
    }

    console.log(`Found ${listElements.length} products on Delhaize page.`);

    const energyDrinks: EnergyDrink[] = await ScrapeEnergyDrinksInfoOnPage(page, brands, variants, baseUrl);
    allSelectedEnergyDrinks.push(...energyDrinks);

    await browser.close();

    // Log final results
    logResultsForScraper(allSelectedEnergyDrinks, 'Delhaize');

    return allSelectedEnergyDrinks;
}

export { scrapeDelhaize };