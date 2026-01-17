import { EnergyDrink } from '../models/energyDrink';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

export function findEnergyDrinkWithLowestPricePerLiter(energyDrinks: EnergyDrink[]): EnergyDrink | null {
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

    return lowestPriceDrink
}

export function showPromoProducts(energyDrinks: EnergyDrink[]): EnergyDrink[] {
    if(energyDrinks.length === 0) {
        return [];
    }

    return energyDrinks.filter(product => product.promo);
}

export async function getEnergyDrinksFromFile(): Promise<EnergyDrink[]> {
    const isServer = typeof window === "undefined";
    
    if (isServer) {
        try {
            const currentDir = dirname(fileURLToPath(import.meta.url));
            const filePath = join(currentDir, '..', 'data', 'energyDrinks.json');
            const fileContent = readFileSync(filePath, 'utf-8');
            const data = JSON.parse(fileContent);
            console.log("Server-side: Successfully loaded", data.length, "energy drinks");
            return Array.isArray(data) ? (data as EnergyDrink[]) : [];
        } catch (e) {
            console.error("Failed to load energyDrinks.json from file system", e);
            return [];
        }
    } else {
        const isLocalhost = 
            window.location.hostname === "localhost" || 
            window.location.hostname === "127.0.0.1";
        
        const isElsvrPortfolio = 
            window.location.hostname.includes("elsvr-portfolio.be");
        
        const url = isLocalhost
            ? "/data/energyDrinks.json"
            : isElsvrPortfolio
            ? "https://www.elsvr-portfolio.be/astro-build/data/energyDrinks.json"
            : "/data/energyDrinks.json";

        console.log("Client-side: Trying to fetch from URL:", url);

        try {
            const response = await fetch(url);

            if (!response.ok) {
                console.error('Failed to fetch energyDrinks.json:', response.status);
                return [];
            }

            const data = await response.json();
            return Array.isArray(data) ? (data as EnergyDrink[]) : [];

        } catch (e) {
            console.error("Failed to load energyDrinks.json", e);
            return [];
        }
    }
}