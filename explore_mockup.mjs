import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 480, height: 1500 } });
await page.goto('file:///mnt/user-data/uploads/marches-direct-parcours-corrige-code-source.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);

// Page 2: Analyse stratégique (public market, default)
await page.click('text=2. Analyse stratégique');
await page.waitForTimeout(300);
await page.screenshot({ path: '/tmp/s2_analyse.png', fullPage: true });

// Switch to Appel d'offres privé
await page.click('text=Appel d’offres privé, text=Appel d\'offres privé').catch(async () => {
  await page.click("button:has-text('Appel')");
});
await page.waitForTimeout(300);
await page.click('text=1. Projet et exigences');
await page.waitForTimeout(300);
await page.screenshot({ path: '/tmp/s3_private_level1.png', fullPage: true });

await browser.close();
