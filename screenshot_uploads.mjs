import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 480, height: 1400 } });

const files = [
  ['/mnt/user-data/uploads/marches-direct-parcours-corrige-code-source.html', '/tmp/corrige.png'],
  ['/mnt/user-data/uploads/marches-direct-parcours-complet-niveaux-1-2-3.html', '/tmp/complet.png'],
];
for (const [file, out] of files) {
  await page.goto('file://' + file, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: out, fullPage: true });
  console.log('saved', out);
}
await browser.close();
