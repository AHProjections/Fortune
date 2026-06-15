const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const W = 414, H = 896;
const pr = { x: 8, y: 0.155 * H, w: W - 16, h: 0.69 * H };
const spot = (nx, ny) => ({ x: pr.x + nx * pr.w, y: pr.y + ny * pr.h });

const LEVELS = {
  morning: {
    spots: { stove: [0.20,0.30], fridge: [0.82,0.30], highchair: [0.50,0.48], changing: [0.83,0.60], closet: [0.17,0.60], couch: [0.70,0.80], door: [0.30,0.86] },
    // [spot, wait, switchToPortrait?]
    plan: [['fridge',2600],['highchair',3200],['stove',3200],['changing',3200],['closet',3200],[null,0,3],['couch',3200],['door',3000]],
  },
  bedtime: {
    spots: { bath:[0.20,0.30], sink:[0.82,0.30], chair:[0.50,0.46], dresser:[0.17,0.62], toybox:[0.84,0.62], crib:[0.50,0.82] },
    plan: [['bath',3400],['sink',3000],['dresser',3000],['chair',3400],['toybox',2600],['crib',3200]],
  },
};

async function playLevel(page, levelId) {
  const L = LEVELS[levelId];
  // assumes we are already on the level-select screen
  await page.click(`[data-level="${levelId}"]`);
  await page.waitForTimeout(700);
  for (const [name, wait, sw] of L.plan) {
    if (sw) { await page.click(`#charbar .portrait:nth-child(${sw})`); await page.waitForTimeout(250); }
    if (name) {
      const [nx, ny] = L.spots[name];
      const s = spot(nx, ny);
      await page.mouse.click(s.x, s.y);
    }
    await page.waitForTimeout(wait);
  }
  await page.waitForTimeout(700);
  const win = await page.$eval('#screen-win', el => !el.classList.contains('hidden')).catch(() => false);
  const chips = await page.$$eval('.chip', els => els.map(e => ({ t: e.textContent.trim(), done: e.classList.contains('done') })));
  await page.screenshot({ path: `tools/shot_${levelId}_win.png` });
  return { win, chips };
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  await page.goto('http://localhost:8099/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);

  await page.click('[data-action="levels"]'); // title PLAY -> level select
  await page.waitForTimeout(400);
  const m = await playLevel(page, 'morning');
  console.log('MORNING win:', m.win, '| done:', m.chips.filter(c => c.done).length + '/' + m.chips.length);

  // "Pick another level" from win screen -> level select
  await page.click('#screen-win [data-action="levels"]');
  await page.waitForTimeout(400);
  const b = await playLevel(page, 'bedtime');
  console.log('BEDTIME win:', b.win, '| done:', b.chips.filter(c => c.done).length + '/' + b.chips.length);
  console.log('Bedtime chips:', JSON.stringify(b.chips));

  console.log('Errors:', errors.join('\n') || '(none)');
  await browser.close();
})();
