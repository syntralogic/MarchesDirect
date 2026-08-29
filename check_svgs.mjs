import { chromium, devices } from 'playwright';
const browser = await chromium.launch();
const context = await browser.newContext({ ...devices['Pixel 5'] });
const page = await context.newPage();
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
const info = await page.evaluate(() => {
  return [...document.querySelectorAll('svg')].map(s => ({
    viewBox: s.getAttribute('viewBox'),
    w: s.getAttribute('width'),
    h: s.getAttribute('height'),
    paths: s.querySelectorAll('path').length,
    className: s.getAttribute('class'),
  })).filter(x => x.paths > 3);
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
