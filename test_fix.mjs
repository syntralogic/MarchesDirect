import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 480, height: 1200 } });
await page.goto('file:///home/claude/prototype-fix/marches-direct-parcours-corrige-v2.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);

// Ensure we're on Marché public (default) + go to Mémoire tab
await page.click('text=Mémoire');
await page.waitForTimeout(300);
await page.screenshot({ path: '/tmp/fix1_before_click.png', fullPage: true });

// Click "Demander à être accompagné..."
await page.click('button:has-text("Demander à être accompagné")');
await page.waitForTimeout(300);
await page.screenshot({ path: '/tmp/fix2_after_click_should_be_form.png', fullPage: true });

// Fill and submit the form
await page.fill('#md-lead-email', 'test@entreprise.fr');
await page.fill('#md-lead-phone', '0600000000');
await page.fill('#md-lead-company', 'Test SARL');
await page.fill('#md-lead-siret', '123 456 789 00012');
await page.selectOption('#md-lead-employees', '2 à 5');
await page.click('button:has-text("Envoyer ma demande")');
await page.waitForTimeout(300);
await page.screenshot({ path: '/tmp/fix3_after_submit_should_be_confirmation.png', fullPage: true });

await browser.close();
