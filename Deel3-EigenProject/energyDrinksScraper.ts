import { scrapeColruyt } from "./scrapers/scrapeColruyt.js";
import { scrapeDelhaize } from "./scrapers/scrapeDelhaize.js";
import { scrapeAlbertHeijn } from "./scrapers/scrapeAlbertHeijn.js";
import { writeToJsonFile, readFromJsonFile } from "./helpers/fileHandling.js";
import { findEnergyDrinkWithLowestPricePerLiter, showPromoProducts } from "./helpers/helperFunctions.js";
import { EnergyDrink } from "./models/energyDrink.js";

// ----- FILTERS -----
// Scrape only following stores
export const stores: string[] = ['Colruyt', 'Delhaize', 'Albert Heijn'];
// Search only energy drinks from following brands
export const brands: string[] = ["CARA", "MONSTER", "NALU", "RED BULL", "RODEO"];
// Except when brand is NALU, only search for sugarfree variants
export const variants: string[] = ["zero", "light", "sugarfree", "sugar free", "no sugar", "zonder suiker"];


//----- MAIN SCRAPING FUNCTION -----
export async function scrapeEnergyDrinks(): Promise<void> {
    const energyDrinks : EnergyDrink[] = [];

    try {
        // Scrape only energy drinks available at following stores
        const colruytResults: EnergyDrink[] = await scrapeColruyt(brands, variants);
        const delhaizeResults: EnergyDrink[] = await scrapeDelhaize(brands, variants);
        const albertHeijnResults: EnergyDrink[] = await scrapeAlbertHeijn(brands, variants);

        energyDrinks.push(...colruytResults, ...delhaizeResults, ...albertHeijnResults);

        // Save results to file
        await writeToJsonFile(energyDrinks);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay to ensure file is flushed
        

        // Read results from file to perform further analysis
        const energyDrinksFromFile = await readFromJsonFile();
        await new Promise(resolve => setTimeout(resolve, 500)); // Ensure file operations are complete
        if (!energyDrinksFromFile || energyDrinksFromFile.length === 0) {
            console.error("No energy drinks found.");
            return;
        }

        // Perform analysis on the scraped energy drinks
        findEnergyDrinkWithLowestPricePerLiter(energyDrinksFromFile);
        showPromoProducts(energyDrinksFromFile);

    } catch (error) {
        console.error("Error occurred while scraping:", error);
    }
}