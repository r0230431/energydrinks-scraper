import fs from 'fs';
import { EnergyDrink } from '../models/energyDrink.js';

export async function writeToJsonFile(energyDrinks: EnergyDrink[], filename: string = 'energyDrinks.json'): Promise<void> {
    try {
        // Check if file already exists
        if (fs.existsSync(filename)) {
            console.log(`File ${filename} already exists. Overwriting...`);
        }
        
        // Create new file
        await fs.promises.writeFile(filename, JSON.stringify(energyDrinks, null, 2));
        console.log(`Data written to ${filename} (${energyDrinks.length} energy drinks)`);
    } catch (err) {
        console.error(`Error writing to ${filename}:`, err);
        throw err;
    }
}

export async function readFromJsonFile(filename: string = 'energyDrinks.json'): Promise<EnergyDrink[] | null> {
    try {
        const jsonData = await fs.promises.readFile(filename, "utf-8");
        return JSON.parse(jsonData) as EnergyDrink[];
    } catch (err) {
        console.error(`Error reading from ${filename}:`, err);
        return null;
  }
}