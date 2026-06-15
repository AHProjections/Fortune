const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const W = 414, H = 896;
const pr = { x: 8, y: 0.155 * H, w: W - 16, h: 0.69 * H };
const at = (nx, ny) => ({ x: pr.x + nx * pr.w, y: pr.y + ny * pr.h });

const SPOTS = {
  // morning
  stove: [0.20, 0.30], fridge: [0.82, 0.30], highchair: [0.50, 0.48], changing: [0.83, 0.62],
  closet: [0.17, 0.62], couch: [0.70, 0.82], door: [0.30, 0.86],
  // bedtime
  bath: [0.20, 0.30], sink: [0.82, 0.30], chair: [0.50, 0.46], dresser: [0.17, 0.62],
  toybox: [0.84, 0.62], crib: [0.50, 0.82],
};

// step: ['tap', spot, wait]  or  ['switch', portraitNth, wait]
const PLANS = {
  m1: [['tap', 'stove', 4400], ['tap', 'closet', 4400]],
  m2: [['tap', 'fridge', 3200], ['tap', 'highchair', 4400], ['tap', 'stove', 4400], ['tap', 'closet', 4400]],
  m3: [['tap', 'fridge', 3200], ['tap', 'highchair', 4400], ['tap', 'stove', 4400],
       ['tap', 'changing', 4400], ['tap', 'closet', 4400], ['switch', 3, 400],
       ['tap', 'couch', 4400], ['tap', 'door', 4200]],
  bedtime: [['tap', 'bath', 4400], ['tap', 'sink', 4000], ['tap', 'dresser', 4000],
            ['tap', 'chair', 4400], ['tap', 'toybox', 3200], ['tap', 'crib', 4400]],
};

async function play(page, id) {
  await page.click(`[data-level="${id}"]`);
  await page.waitForTimeout(700);
  for (const [type, arg, wait] of PLANS[id]) {
    if (type === 'switch') { await page.click(`#charbar .portrait:nth-child(${arg})`); }
    else { const s = at(...SPOTS[arg]); await page.mouse.click(s.x, s.y); }
    await page.waitForTimeout(wait);
  }
  await page.waitForTimeout(700);
  const win = await page.$eval('#screen-win', el => !el.classList.contains('hidden')).catch(() => false);
  const done = await page.$$eval('.chip.done', els => els.length);
  const total = await page.$$eval('.chip', els => els.length);
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
  const lockState = await page.$$eval('#levelcards .levelcard', els => els.map(e => e.classList.contains('locked')));
  console.log('Initial lock state (false=unlocked):', JSON.stringify(lockState));

  const order = ['m1', 'm2', 'm3', 'bedtime'];
  for (let i = 0; i < order.length; i++) {
    const id = order[i];
    const r = await play(page, id);
    console.log(`${id}: win=${r.win} goals=${r.done}/${r.total}`);
    await page.screenshot({ path: `tools/shot_${id}.png` });
    if (i < order.length - 1) {
      // back to stage list (also verifies the next stage is now unlocked)
      await page.click('#screen-win [data-action="levels"]');
      await page.waitForTimeout(400);
    }
  }

  // verify the "Next level" button path works (we're on the bedtime win screen now;
  // go to stage list, replay m1, then use Next to jump straight into m2)
  await page.click('#screen-win [data-action="levels"]');
  await page.waitForTimeout(400);
  await play(page, 'm1');
  await page.click('#nextBtn');
  await page.waitForTimeout(1000);
  const overlayHidden = await page.$eval('#overlay', el => getComputedStyle(el).pointerEvents === 'none').catch(() => false);
  const goals = await page.$$eval('.chip', els => els.map(e => e.textContent.trim()));
  console.log('Next-button -> in-stage:', overlayHidden, '| goals:', JSON.stringify(goals));

  console.log('Errors:', errors.join('\n') || '(none)');
  await browser.close();
})();
