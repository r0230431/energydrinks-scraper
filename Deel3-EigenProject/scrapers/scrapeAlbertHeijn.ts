import { getEnergyDrinksForSelectedBrand, scrapeDetailPageForPricePerLiter } from "../helpers/albertHeijnHelpers.js";
import { EnergyDrink } from "../models/energyDrink.js";
import { logResultsForScraper, randomDelay } from "../helpers/helperFunctions.js";
import { launchScraper } from "../helpers/launchScraper.js";

async function scrapeAlbertHeijn(brands: string[], variants: string[]): Promise<EnergyDrink[]> {
    const energyDrinksUrl: string = 'https://www.ah.be/producten/21857/energydrinks';
    const allSelectedEnergyDrinks: EnergyDrink[] = [];
    const { browser, page } = await launchScraper('Albert Heijn', energyDrinksUrl);
 
    // AH works with 'OR' filtering, so we need to filter per brand and collect results
    for (const brand of brands) {
        console.log(`Processing brand: ${brand}`);
        await randomDelay(1000, 2000); // Delay between brand searches
        const energyDrinksForBrand = await getEnergyDrinksForSelectedBrand(page, brand, variants);
        allSelectedEnergyDrinks.push(...energyDrinksForBrand);
    }

    await browser.close();

    // Price per liter extraction from detail pages because this info is not available on overview page
    // Visiting each relevant product detail page within the same browser session result in bot detection errors
    // Therefore, we need to open each detail page in a new browser context based on url collected for each product
    for (const drink of allSelectedEnergyDrinks) {
        if (!drink.url) {
            console.log(`No URL found for product: ${drink.name}, skipping price per liter extraction.`);
            continue;
        }
        const pricePerLiter = await scrapeDetailPageForPricePerLiter(drink.url, drink.name ?? 'unknown product');
        drink.priceInEurPerLiter = pricePerLiter;
        await randomDelay(2000, 4000); // Random delay between 2-4 seconds
    }

    await browser.close();

    // Log final results
    logResultsForScraper(allSelectedEnergyDrinks, 'Albert Heijn');

    return allSelectedEnergyDrinks;
}

export { scrapeAlbertHeijn };