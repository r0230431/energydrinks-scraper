import type { Page, ElementHandle } from "puppeteer";
import { EnergyDrink } from "../models/energyDrink.js";
import { clickButtonOrLink, randomDelay } from "../helpers/helperFunctions.js";

export async function handleLanguageSelection(page: Page, language: string): Promise<void> {
    const languageButtonSelector: string = `dialog[aria-label="Selecteer website taal"] div[data-testid="button-text"]`;

    const found: boolean = await page.$$eval(languageButtonSelector, (buttons, language) => {
        const btn: Element | undefined = buttons.find(el => el.textContent?.includes(language));
        if (btn) {
            (btn as HTMLElement).click();
            return true;
        }
        return false;
    }, language);

    if (found) {
        console.log('Dutch language selected.');
    } else {
        console.log('Dutch language option not found.');
    }
}

export async function filterEnergyDrinksByBrands(page: Page, brands: string[], timeout: number) {
    await clickButtonOrLink('Filteren', 'button[data-testid="filter-and-sort-desktop-button"]', page); // Find 'Filteren' button to open filters
    await clickMeerButtonInMerkSection(page);

    // Wait for filter options to be fully loaded
    await randomDelay(2000, 4000);
    
    await selectFilterOptionsForBrands(page, brands, timeout);

    // Wait before applying filters
    await randomDelay(2000, 4000);

    // Click apply button to apply filters
    const applyBtn: ElementHandle<HTMLButtonElement> | null = await page.$('button[type="submit"][data-testid="sidebar-apply-button"]');
    if (applyBtn) {
        await applyBtn.click();
        console.log('Filters applied.');
        await randomDelay(3000, 5000);
    } else {
        console.log('Apply button not found.');
    }
}

async function clickMeerButtonInMerkSection(page: Page): Promise<void> {
    // Wait for the filter panel to be visible and find the "Merk" section
    console.log('Looking for "Meer" button in "Merk" section...');

    // Click "Meer" button in Merk section
    const meerClicked: boolean = await page.$$eval('section[data-stellar="st-web-collapsable"][data-testid="collapsable"]', (sections: HTMLElement[]) => {
        for (const section of sections) {
            const sectionHeaderElement: HTMLElement | null = section.querySelector('div.sc-4fa6vu-3.jIxcQS');

            if (sectionHeaderElement && sectionHeaderElement.textContent?.includes('Merk')) {
                const meerBtn: HTMLButtonElement | null = section.querySelector('button[data-testid="show-more-button"]') as HTMLButtonElement;
                if (meerBtn) {
                    meerBtn.click();
                    return true;
                }
            }
        }
        return false;
    });

    if (meerClicked) {
        console.log('"Meer" button clicked in Merk section.');
        await randomDelay(3000, 5000); // Wait longer for expanded options
    } else {
        console.log('"Meer" button not found in Merk section.');
    }
}

async function selectFilterOptionsForBrands(page: Page, brands: string[], timeout: number): Promise<void> {
        // Select filteroptions for desired brands
    for (const brand of brands) {
        try {
            const brandSelected: boolean = await page.$$eval('label[data-testid="checkbox-wrapper"]', (labels, brand) => {
                for (const label of labels) { // loop through all labels (also if not related to brand)
                    const brandNameElement: HTMLElement | null = label.querySelector('[data-testid="facet-item-name"]');
                    if (brandNameElement && brandNameElement.textContent?.trim().toUpperCase().includes(brand.toUpperCase())) {
                        const checkbox: HTMLInputElement | null = label.querySelector('input[data-testid="facet-item-checkbox"]') as HTMLInputElement;
                        if (checkbox && !checkbox.checked) {
                            (label as HTMLElement).click();
                            return true;
                        }
                    }
                }
                return false;
            }, brand);
            
            if (brandSelected) {
                console.log(`Selected brand: ${brand}`);
                await randomDelay(1000, 2000); // Wait longer between selections
            } else {
                console.log(`Brand ${brand} not found`);
            }
        } catch (error) {
            console.log(`Error selecting brand ${brand}:`, error);
        }
    }
}

export async function ScrapeEnergyDrinksInfoOnPage(page: Page, brands: string[], variants: string[], baseUrl: string): Promise<EnergyDrink[]> {
    const products: EnergyDrink[] = await page.$$eval('div.sc-y4jrw3-1.jceKKs', (listItems: HTMLElement[], brands: string[], variants: string[], baseUrl: string) => {
        return listItems
            .map((item: HTMLElement) => {
                const brandElementText: string = item.querySelector('h3 span[data-testid="product-brand"]')?.textContent?.trim() || '';
                const nameElementText: string = item.querySelector('h3 span[data-testid="product-name"]')?.textContent?.trim() || '';

                for (const brand of brands) {
                    if (brandElementText.toUpperCase().includes(brand.toUpperCase())) { // Not all brands in the list are sold by Delhaize
                        
                        // Scrape only information for sugarfree variants, except when the brand is NALU (then include all)
                        if(brand.toUpperCase() === 'NALU' 
                        || (brand.toUpperCase() !== ("NALU") && variants.some(variant => nameElementText.toLowerCase().includes(variant.toLowerCase())))) {

                            // Parse volume and quantity
                            let volumeInLiter: number | null = null;
                            let numberOfCans: number | null = null;
                            // Search for quantity and volume Element
                            const quantityAndVolumeTextElement: HTMLElement | null = item.querySelector('[data-testid="product-block-supplementary-price"]');
                            if (!quantityAndVolumeTextElement) {
                                console.log('Quantity and volume information not found.');
                            }
                            // Get text content
                            const quantityAndVolumeText: string = quantityAndVolumeTextElement?.textContent || '';

                            // Check if quantity is mentioned in text and parse volume and quantity values
                            if (quantityAndVolumeText.toLowerCase().includes('x')) {
                                numberOfCans = parseInt(quantityAndVolumeText.split(' x ')[0] ?? '') || 1;
                                volumeInLiter = parseIntVolumeInLiters(quantityAndVolumeText.split(' x ')[1] ?? '');
                            } else {
                                numberOfCans = 1;
                                volumeInLiter = parseIntVolumeInLiters(quantityAndVolumeText);
                            }

                            function parseIntVolumeInLiters(text: string): number | null {
                                const quantityMatch: RegExpMatchArray | null = text.match(/(\d+) cl/);
                                if (quantityMatch && quantityMatch[1]) {
                                    return parseInt(quantityMatch[1]) / 100;
                                } else {
                                    console.log('Volume in liter information not found in the expected format.');
                                    return null;
                                }
                            }

                            // Parse price per liter
                            let priceText: string = '';
                            let price: number = 0;

                            const priceTextElement: HTMLElement | null = item.querySelector('div[data-testid="product-block-price-per-unit"]');
                            if (!priceTextElement) {
                                console.log('Price per liter not found.');
                            } else { 
                                priceText = priceTextElement.textContent.replace(',', '.').replace('€/l', '').trim();
                                price = parseFloat(priceText) ?? 0;
                            }

                            // Instantiate EnergyDrink object
                            const product: EnergyDrink = { 
                                name: `${brand} | ${nameElementText}` || brand,
                                brand: brand,
                                numberOfCans: numberOfCans,
                                priceInEurPerLiter: price,
                                volumeInLiter: volumeInLiter,
                                store: 'Delhaize',
                                url: item.querySelector('a[data-testid="product-block-name-link"]') ? `${baseUrl}/${item.querySelector('a[data-testid="product-block-name-link"]')?.getAttribute('href')}` : 'url not found',
                                imageUrl: item.querySelector('a img[data-testid="product-block-image"]')?.getAttribute('src') ?? 'Image not found',
                            };

                            // Check for promo and add remark if found
                            const promo: HTMLElement | null = item.querySelector('div[data-testid="tag-label"].sc-1it9fxy-3.dvLylg');
                            if (promo) {
                                product.promo = promo.textContent?.trim() ?? '';
                            }

                            return product;
                        }
                    }
                }
                return null;
            })
            .filter(product => product !== null); // Keep only products that are not null (and thus meets criteria)
    }, brands, variants, baseUrl);

    
    return products;
}