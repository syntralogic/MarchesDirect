import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 480, height: 1400 } });
await page.goto('file:///home/claude/prototype-fix/marches-direct-parcours-corrige-v2.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/fix0_initial.png', fullPage: true });
await browser.close();
