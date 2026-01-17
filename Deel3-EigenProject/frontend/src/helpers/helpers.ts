import { EnergyDrink } from '../models/energyDrink';

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
    // Check if we're in a browser environment
    const isBrowser = typeof window !== "undefined";
    
    let url: string;
    
    if (isBrowser) {
        const isLocalhost = 
            window.location.hostname === "localhost" || 
            window.location.hostname === "127.0.0.1";
        
        const isElsvrPortfolio = 
            window.location.hostname.includes("elsvr-portfolio.be");
        
        url = isLocalhost
            ? "/astro-build/data/energyDrinks.json"
            : isElsvrPortfolio
            ? "https://www.elsvr-portfolio.be/astro-build/data/energyDrinks.json"
            : "/astro-build/data/energyDrinks.json";
    } else {
        url = "http://localhost:4322/astro-build/data/energyDrinks.json";
    }

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