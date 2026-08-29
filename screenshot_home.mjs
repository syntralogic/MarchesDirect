import { chromium, devices } from 'playwright';
const browser = await chromium.launch();
const context = await browser.newContext({ ...devices['Pixel 5'] });
const page = await context.newPage();
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 3000));
console.log(bodyText);
await browser.close();
