import { chromium, devices } from 'playwright';
const browser = await chromium.launch();
const context = await browser.newContext({ ...devices['Pixel 5'] });
const page = await context.newPage();
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.locator('svg.rsm-svg').first().scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/map_regions.png', clip: { x: 0, y: 150, width: 400, height: 500 } }).catch(async()=>{
  await page.screenshot({ path: '/tmp/map_regions.png' });
});

// Departments tab
await page.click('text=Departments');
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/map_departments.png' });

// Cities tab
await page.click('text=Cities');
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/map_cities.png' });

await browser.close();
