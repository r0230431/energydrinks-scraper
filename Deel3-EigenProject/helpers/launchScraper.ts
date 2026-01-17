import {  Page, Browser, launch } from "puppeteer";
import { randomDelay } from "./helperFunctions.js";

export async function launchScraper(name: string, url: string): Promise<{page: Page, browser: Browser}> {
    let browser: Browser | null = null;
    
    try{
        browser = await launch({ 
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page: Page = await browser.newPage();
        
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'nl-BE,nl;q=0.9,en;q=0.8'
        });
        
        console.log(`\nStarting ${name} scraper...`);

        await startBrowsingPage(url, page);

        return { browser, page };

    } catch (error) {
        console.error(`Error navigating to ${url}:`, error);
        if (browser) {
            await browser.close();
        }
        throw error;
    }
}

async function startBrowsingPage(url: string, page: Page): Promise<void> {
    try {
        await randomDelay(1000, 2000);
        await page.goto(url, { waitUntil: 'networkidle2' });
        await randomDelay(2000, 4000);
        
        console.log(`Navigated to ${url}`);
    } catch (error) {
        console.error(`Error navigating to ${url}:`, error);
        throw error;
    }
}