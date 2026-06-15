const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:414,height:896},deviceScaleFactor:2});
  await p.goto('http://localhost:8099/index.html',{waitUntil:'networkidle'});
  await p.evaluate(()=>localStorage.setItem('hughesmania_unlocked','5'));
  await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(400);
  // m1 tip placement
  await p.click('[data-action="levels"]'); await p.waitForTimeout(250);
  await p.click('[data-level="m1"]'); await p.waitForTimeout(1200);
  await p.screenshot({path:'tools/shot_tip.png'});
  // bedtime refusing owen
  await p.click('[data-action="levels"]').catch(()=>{});
  await p.evaluate(()=>localStorage.setItem('hughesmania_unlocked','5'));
  await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(400);
  await p.click('[data-action="levels"]'); await p.waitForTimeout(250);
  await p.click('[data-level="bedtime"]'); await p.waitForTimeout(800);
  await p.evaluate(()=>window.__hmForceRefuse());
  await p.waitForTimeout(1600);
  await p.screenshot({path:'tools/shot_refuse.png'});
  await b.close(); console.log('ok');
})();
