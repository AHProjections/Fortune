const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 414, height: 896 }, deviceScaleFactor: 2 });
  await p.goto('http://localhost:8099/index.html', { waitUntil: 'networkidle' });
  await p.evaluate(() => localStorage.removeItem('hughesmania_unlocked'));
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(500);
  await p.click('[data-action="levels"]'); await p.waitForTimeout(300);
  await p.screenshot({ path: 'tools/shot_stageselect.png' });
  await p.click('[data-level="m1"]'); await p.waitForTimeout(1500);
  await p.screenshot({ path: 'tools/shot_m1play.png' }); // tip 1 showing
  await b.close(); console.log('ok');
})();
