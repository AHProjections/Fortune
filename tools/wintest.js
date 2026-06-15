const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const W = 414, H = 896;
const pr = { x: 8, y: 0.155 * H, w: W - 16, h: 0.69 * H };
const spot = (nx, ny) => ({ x: pr.x + nx * pr.w, y: pr.y + ny * pr.h });
const S = {
  stove: spot(0.20, 0.30), fridge: spot(0.82, 0.30), highchair: spot(0.50, 0.48),
  changing: spot(0.83, 0.60), closet: spot(0.17, 0.60), couch: spot(0.70, 0.80), door: spot(0.30, 0.86),
};
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  await page.goto('http://localhost:8099/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  await page.click('[data-action="play"]');
  await page.waitForTimeout(800);

  const tap = async (s, w = 2600) => { await page.mouse.click(s.x, s.y); await page.waitForTimeout(w); };
  const sw = async (n) => { await page.click(`#charbar .portrait:nth-child(${n})`); await page.waitForTimeout(250); };

  // Kalong (active=2 = index1) is fast. Feed needs bottle from fridge first.
  await tap(S.fridge);          // grab bottle
  await tap(S.highchair, 3200); // feed Elliot
  await tap(S.stove, 3200);     // cook
  await tap(S.changing, 3200);  // diaper
  await tap(S.closet, 3200);    // dress
  await sw(3);                  // switch to Owen (can crawl)
  await tap(S.couch, 3200);     // find keys -> carry
  await tap(S.door, 3000);      // deliver keys

  await page.waitForTimeout(800);
  const winVisible = await page.$eval('#screen-win', el => !el.classList.contains('hidden')).catch(() => false);
  const chips = await page.$$eval('.chip', els => els.map(e => ({ t: e.textContent.trim(), done: e.classList.contains('done') })));
  await page.screenshot({ path: 'tools/shot_win.png' });
  console.log('WIN screen visible:', winVisible);
  console.log('Chips:', JSON.stringify(chips));
  console.log('Errors:', errors.join('\n') || '(none)');
  await browser.close();
})();
