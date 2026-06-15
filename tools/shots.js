const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 414, height: 896 }, deviceScaleFactor: 2 });
  await page.goto('http://localhost:8099/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.click('[data-action="levels"]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'tools/shot_levels.png' });
  await page.click('[data-level="bedtime"]');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'tools/shot_bedtime.png' });
  // let Owen go idle to trigger menace
  await page.waitForTimeout(13000);
  await page.screenshot({ path: 'tools/shot_bedtime2.png' });
  await browser.close();
  console.log('done');
})();
