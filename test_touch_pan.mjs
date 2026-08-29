import { chromium, devices } from 'playwright';
const browser = await chromium.launch();
const context = await browser.newContext({ ...devices['Pixel 5'] });
const page = await context.newPage();
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);

const svgHandle = page.locator('svg.rsm-svg').first();
await svgHandle.scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
const box = await svgHandle.boundingBox();
console.log('svg box', box);

const getTransform = async () => page.evaluate(() => {
  const svg = document.querySelector('svg.rsm-svg');
  const g = svg?.querySelector('.rsm-zoomable-group');
  return g ? g.getAttribute('transform') : null;
});
const before = await getTransform();
console.log('transform before 1-finger swipe:', before);

const cx = box.x + box.width / 2;
const cy = box.y + box.height / 2;

const client = await context.newCDPSession(page);
await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy }] });
await page.waitForTimeout(50);
await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx - 80, y: cy - 40 }] });
await page.waitForTimeout(50);
await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx - 150, y: cy - 80 }] });
await page.waitForTimeout(50);
await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await page.waitForTimeout(300);
const after1Finger = await getTransform();
console.log('transform after 1-finger swipe:', after1Finger);
console.log('1-finger pan happened (BUG if true):', before !== after1Finger);

await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx - 20, y: cy }, { x: cx + 20, y: cy }] });
await page.waitForTimeout(50);
await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx - 100, y: cy - 40 }, { x: cx - 60, y: cy - 40 }] });
await page.waitForTimeout(50);
await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await page.waitForTimeout(300);
const after2Finger = await getTransform();
console.log('transform after 2-finger pan:', after2Finger);
console.log('2-finger pan happened (should be true):', after1Finger !== after2Finger);

await browser.close();
