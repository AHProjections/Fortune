const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 414, height: 896 }, deviceScaleFactor: 2 });
  const errors = [], logs = [];
  page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  await page.goto('http://localhost:8099/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'tools/shot_title.png' });

  // Start the game
  await page.click('[data-action="play"]');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'tools/shot_play.png' });

  // Tap a few jobs (canvas center-ish) and switch characters
  const box = await page.$eval('#game', el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  // tap the stove area (top-left), then a portrait, then center
  await page.mouse.click(box.x + box.w * 0.20, box.y + box.h * 0.33);
  await page.waitForTimeout(900);
  await page.click('#charbar .portrait:nth-child(3)'); // Owen
  await page.waitForTimeout(300);
  await page.mouse.click(box.x + box.w * 0.70, box.y + box.h * 0.66);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'tools/shot_play2.png' });

  // let it run a bit to spawn nuisances
  await page.waitForTimeout(7000);
  await page.screenshot({ path: 'tools/shot_play3.png' });

  console.log('=== PAGE ERRORS ===');
  console.log(errors.join('\n') || '(none)');
  console.log('=== CONSOLE (last 20) ===');
  console.log(logs.slice(-20).join('\n') || '(none)');
  await browser.close();
})();
