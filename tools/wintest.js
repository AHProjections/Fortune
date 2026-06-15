const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const W = 414, H = 896;
const pr = { x: 8, y: 0.155 * H, w: W - 16, h: 0.69 * H };

// step: ['tap', spot, wait]  or  ['switch', portraitNth, wait]
const PLANS = {
  m1: [['tap', 'stove', 4400], ['tap', 'closet', 4400]],
  m2: [['tap', 'stove', 4400], ['tap', 'closet', 4400], ['tap', 'couch', 4400]],
  m3: [['tap', 'stove', 4400], ['tap', 'closet', 4400],
       ['tap', 'playmat', 3200], ['tap', 'changing', 4600]],
  m4: [['tap', 'stove', 4400],
       ['tap', 'playmat', 3200], ['tap', 'changing', 4800],   // diaper (carry baby there)
       ['tap', 'changing', 3200], ['tap', 'highchair', 3600], // move baby to highchair
       ['tap', 'fridge', 3400], ['tap', 'highchair', 4800],   // bottle -> feed
       ['tap', 'closet', 4400],
       ['switch', 3, 400], ['tap', 'couch', 4600], ['tap', 'door', 4400]],
  bedtime: [['tap', 'bath', 4800], ['tap', 'sink', 4400], ['tap', 'dresser', 4400], ['tap', 'chair', 4800],
            ['tap', 'carrier', 3400], ['tap', 'toybox', 3400], ['tap', 'playmat', 3400], ['tap', 'crib', 4800]],
};

async function play(page, id) {
  const spots = await page.evaluate((lid) => LEVELS[lid].spots, id);
  const at = (name) => ({ x: pr.x + spots[name].nx * pr.w, y: pr.y + spots[name].ny * pr.h });
  await page.click(`[data-level="${id}"]`);
  await page.waitForTimeout(700);
  for (const [type, arg, wait] of PLANS[id]) {
    if (type === 'switch') { await page.click(`#charbar .portrait:nth-child(${arg})`); }
    else { const s = at(arg); await page.mouse.click(s.x, s.y); }
    await page.waitForTimeout(wait);
  }
  await page.waitForTimeout(700);
  const win = await page.$eval('#screen-win', el => !el.classList.contains('hidden')).catch(() => false);
  const done = await page.$$eval('.chip.done', els => els.length);
  const total = await page.$$eval('.chip', els => els.length);
  await page.screenshot({ path: `tools/shot_${id}.png` });
  return { win, done, total };
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  await page.goto('http://localhost:8099/index.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.removeItem('hughesmania_unlocked'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(700);

  await page.click('[data-action="levels"]');
  await page.waitForTimeout(400);
  const locks = await page.$$eval('#levelcards .levelcard', els => els.map(e => e.classList.contains('locked')));
  console.log('Initial locks (false=unlocked):', JSON.stringify(locks));

  for (const id of ['m1', 'm2', 'm3', 'm4', 'bedtime']) {
    const r = await play(page, id);
    console.log(`${id}: win=${r.win} goals=${r.done}/${r.total}`);
    if (id !== 'bedtime') { await page.click('#screen-win [data-action="levels"]'); await page.waitForTimeout(400); }
  }
  console.log('Errors:', errors.join('\n') || '(none)');
  await browser.close();
})();
