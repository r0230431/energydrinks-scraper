import { test, expect } from '@playwright/test';
import type { Locator } from '@playwright/test';
import energyDrinks from '../data/energyDrinks.json' with { type: 'json' };
import type { EnergyDrink } from '../models/energyDrink';

const filterOptions: string[] = ['ALL', 'MONSTER', 'RED BULL', 'NALU', 'OTHER'];

//====== META ======//
test('meta is correct', async ({ page }) => {
    await page.goto('/astro-build/');

    await expect(page).toHaveTitle('Energy Drinks - Overview');
});

//====== FACT CARDS ======//
test('fact cards are visible', async ({ page }) => {
    await page.goto('/astro-build/');

    const container: Locator = page.locator('#factCards');
    await expect(container).toBeVisible();

    const factCards: Locator = container.locator('a');
    await expect(factCards).toHaveCount(3);
});

test('fact cards have required attributes', async ({ page }) => {
    await page.goto('/astro-build/');

    const factCards: Locator = page.locator('#factCards .factCard');
    const count: number = await factCards.count();

    for(let i: number = 0; i < count; i++) {
        const factCard: Locator = factCards.nth(i);

        await expect(factCard).toHaveAttribute('href', /.+/);
        await expect(factCard).toHaveAttribute('fact', /.+/);
        await expect(factCard).toHaveAttribute('bgColor', /.+/);
        await expect(factCard).toHaveAttribute('description', /.+/);
    }
});

test('fact cards are not empty', async ({ page }) => {
    await page.goto('/astro-build/');

    const factCards: Locator = page.locator('#factCards .factCard');
    const count: number = await factCards.count();

    for(let i: number = 0; i < count; i++) {
        const factCard: Locator = factCards.nth(i);
        await expect(factCard.locator('p').first()).not.toHaveText('');
        await expect(factCard.locator('p .text-body')).not.toHaveText('');
    }
});

//====== DRINK CARDS ======//
test('drink cards are visible', async ({ page }) => {
    await page.goto('/astro-build/');

    const drinkCardsGrid: Locator = page.locator('#drinks');
    await expect(drinkCardsGrid).toBeVisible();

    const cards: Locator = drinkCardsGrid.locator('.drinkCard');
    await expect(cards).not.toHaveCount(0);
});

test('drink card has image', async ({ page }) => {
    await page.goto('/astro-build/');

    const drinkCards: Locator = page.locator('#drinks .drinkCard');
    const count: number = await drinkCards.count();

    for(let i: number = 0; i < count; i++) {
        const card: Locator = drinkCards.nth(i);
        const image: Locator = card.locator('img');
        await expect(image).toBeVisible();
        
        await expect(image).toHaveAttribute('src', /.+/);

        await expect(image).toHaveJSProperty('complete', true);
        const imageWidth: number = await image.evaluate(img => (img as HTMLImageElement).offsetWidth);
        expect(imageWidth).toBeGreaterThan(0);
    }
});

test('drink card has min 2 and max 3 specs', async ({ page }) => {
    await page.goto('/astro-build/');

    const drinkCards: Locator = page.locator('#drinks .drinkCard');
    const count: number = await drinkCards.count();
    
    for(let i: number = 0; i < count; i++) {
        const card: Locator = drinkCards.nth(i);
        const specs: Locator = card.locator('ul li');

        const countLi: number = await specs.count();
        expect(countLi).toBeGreaterThanOrEqual(2);
        expect(countLi).toBeLessThan(4);
    }
});

test('drink card specs are not empty', async ({ page }) => {
    await page.goto('/astro-build/');

    const drinkCards: Locator = page.locator('#drinks .drinkCard');
    const count: number = await drinkCards.count();

    for(let i: number = 0; i < count; i++) {
        const card: Locator = drinkCards.nth(i);
        const specs: Locator = card.locator('ul li');

        // Volume controleren
        const volumeSpec = specs.filter({ hasText: 'Volume:' });
        await expect(volumeSpec).toContainText(/Volume:\s*.+/); // Moet iets bevatten na "Volume:"

        // Prijs per liter controleren  
        const priceSpec = specs.filter({ hasText: 'Prijs per liter:' });
        await expect(priceSpec).toContainText(/Prijs per liter:\s*.+/);
        
        // Promo (optioneel) - alleen als aanwezig
        const promoSpec = specs.filter({ hasText: 'Promo:' });
        const promoCount = await promoSpec.count();
        if (promoCount > 0) {
           await expect(promoSpec).toContainText(/Promo:\s*.+/);
        }
    }
});

test('all drink cards have store badge', async ({ page }) => {
    await page.goto('/astro-build/');

    const drinkCards: Locator = page.locator('#drinks .drinkCard');
    const count: number = await drinkCards.count();

    for(let i: number = 0; i < count; i++) {
        const card: Locator = drinkCards.nth(i);
        
        // Haal de drink naam op uit de card (aanpassen aan jouw HTML structuur)
        const drinkNameElement: Locator = card.locator('h5'); // Pas selector aan
        const drinkName: string | null = await drinkNameElement.textContent();
        
        // Zoek de bijbehorende drink in de JSON
        const drink: EnergyDrink | undefined = energyDrinks.find(d => drinkName?.includes(d.name));
        expect(drink).toBeDefined(); // Drink moet bestaan in JSON
        
        // Check of de badge de juiste store toont
        const badge: Locator = card.locator('div span.bg-green-500'); 
        await expect(badge).toBeVisible();
        await expect(badge).toHaveText(drink!.store || '');
    }
});

test('promo drinks have promo badge and promo content', async ({ page }) => {
    await page.goto('/astro-build/');

    // Filter drinks die een promo hebben uit de JSON
    const promoDrinks: EnergyDrink[] = energyDrinks.filter(drink => drink.promo);
    
    const drinkCards: Locator = page.locator('#drinks .drinkCard');
    const count: number = await drinkCards.count();

    for(let i: number = 0; i < count; i++) {
        const card: Locator = drinkCards.nth(i);
        
        // Check of deze card een promo li heeft
        const promoSpec: Locator = card.locator('li').filter({ hasText: 'Promo:' });
        const hasPromoSpec: boolean = await promoSpec.count() > 0;
        
        if (hasPromoSpec) {
            // Als er een promo spec is, moet er ook een promo badge zijn
            const promoBadge: Locator = card.locator('span.bg-yellow-500');
            await expect(promoBadge).toBeVisible();
            
            // Check of promo spec niet leeg is
            await expect(promoSpec).toContainText(/Promo:\s*.+/);
        }
    }
});

test('drink card more info button has non empty href', async ({ page }) => {
    await page.goto('/astro-build/');

    const drinkCards: Locator = page.locator('#drinks .drinkCard');
    const count: number = await drinkCards.count();

    for(let i: number = 0; i < count; i++) {
        const card: Locator = drinkCards.nth(i);
        await expect(card.locator('a')).toHaveAttribute('href', /.+/);
        const href = await card.locator('a').getAttribute('href');
        expect(() => new URL(href!)).not.toThrow(); 
    }
});

//====== FILTERS ======//
test('filter buttons are visible', async ({ page }) => {
    await page.goto('/astro-build/');
    
    const filterButtons: Locator = page.locator('#filterButtons');
    await expect(filterButtons).toBeVisible();
    
    const buttons: Locator = filterButtons.locator('button');
    await expect(buttons).toHaveCount(5);
});

test('count in filter buttons are not empty', async ({ page }) => {
    await page.goto('/astro-build/');

    const buttons: Locator = page.locator('#filterButtons button');

    for(let i: number = 0; i < await buttons.count(); i++) {
            const button: Locator = buttons.nth(i);
            const buttonText = (await button.textContent())?.trim() || '';
            await expect(buttonText).toMatch(/\(\d+\)$/);
        }
});


test('Filter shows correct cards', async ({ page }) => {
    await page.goto('/astro-build/');


    for(const filter of filterOptions) {
        const button: Locator = page.locator(`#filterButtons button[data-filter="${filter.toLowerCase()}"]`);
        await button.click();

        const drinkCards: Locator = page.locator('.drinkCard');
        const count: number = await drinkCards.count();
        for (let i: number = 0; i < count; i++) {
            const card: Locator = drinkCards.nth(i);
            const brand: string = (await card.getAttribute('data-brand'))?.toUpperCase() || '';

            let shouldBeVisible: boolean = false;

            if (filter === 'ALL') {
                shouldBeVisible = true;
            } else if (filter === 'OTHER') {
                shouldBeVisible = !['MONSTER', 'RED BULL', 'NALU'].includes(brand);
            } else {
                shouldBeVisible = brand === filter;
            }

            if (shouldBeVisible) {
                await expect(card).toBeVisible();
            } else {
                await expect(card).toHaveClass(/hidden/);
            }
        }

        const alert: Locator = page.locator('#noDrinksAlert');
        const anyVisible: boolean = await drinkCards.evaluateAll(cards => 
            cards.some(card => !card.classList.contains('hidden'))
            );

        if (anyVisible) {
            await expect(alert).toHaveClass(/hidden/);
        } else {
            await expect(alert).toBeVisible();
        }
    }
});

//====== NAVIGATION ======//
test('navigation to promo page works', async ({ page }) => {
    
    //from homepage
    await page.goto('/astro-build/');

    const promoLink: Locator = page.locator('nav li a[href$="/promoPage"]');
    await promoLink.click();

    expect(page.url()).toContain('/astro-build/promoPage');

    //from table page
    await page.goto('/astro-build/tablePage');
    await promoLink.click();
    expect(page.url()).toContain('/astro-build/promoPage');
});

test('navigation to table page works', async ({ page }) => {
    //from homepage
    await page.goto('/astro-build/');
    
    const tableLink: Locator = page.locator('nav li a[href$="/tablePage"]');
    await tableLink.click();

    expect(page.url()).toContain('/astro-build/tablePage');

    //from promo page
    await page.goto('/astro-build/promoPage');
    await tableLink.click();
    expect(page.url()).toContain('/astro-build/tablePage');

});

test('navigation to main page works', async ({ page }) => {
    //from promo page
    await page.goto('/astro-build/promoPage');

    const mainLink: Locator = page.locator('nav li a[href$="/"]');
    await mainLink.click();
    expect(page.url()).toContain('/astro-build/');
    //from table page
    await page.goto('/astro-build/tablePage');
    await mainLink.click();
    expect(page.url()).toContain('/astro-build/');
})

//====== PROMO PAGE ======

test('promo page shows only 1 card for lowest price drink', async ({ page }) => {
    await page.goto('/astro-build/promoPage');

    const promoDrinkCards: Locator = page.locator('h1#lowestPriceDrink ~ .drinkCard');

    await expect(promoDrinkCards).toHaveCount(1);
    await expect(promoDrinkCards.first()).toBeVisible();
});

test('promo page displays all promo drinks', async ({ page }) => {
    await page.goto('/astro-build/promoPage');

    const promoDrinkCards: Locator = page.locator('div#drinks .drinkCard');
    const promoDrinksFromJSON: EnergyDrink[] = energyDrinks.filter(drink => drink.promo);

    await expect(promoDrinkCards).toHaveCount(promoDrinksFromJSON.length);
});