import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 480, height: 1600 } });
await page.goto('file:///mnt/user-data/uploads/marches-direct-parcours-corrige-code-source.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);

// Page 4 Mémoire (public, default)
await page.click('text=4. Mémoire et');
await page.waitForTimeout(300);
await page.screenshot({ path: '/tmp/s4_memoire.png', fullPage: true });

// Sous-traitance tab -> "Je cherche un sous-traitant" role -> page1
const buttons = await page.$$('button, div');
await page.click("text=Sous-\\ntraitance").catch(async()=>{ await page.click("text=Sous-traitance"); });
await page.waitForTimeout(300);
await page.screenshot({ path: '/tmp/s5_subcontract_tab.png', fullPage: true });

await browser.close();
