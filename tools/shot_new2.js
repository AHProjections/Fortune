const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:414,height:896},deviceScaleFactor:2});
  await p.goto('http://localhost:8099/index.html',{waitUntil:'networkidle'});
  await p.evaluate(()=>localStorage.setItem('hughesmania_unlocked','7'));
  await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(400);
  await p.click('[data-action="levels"]'); await p.waitForTimeout(400);
  await p.screenshot({path:'tools/shot_stages7.png'});
  await p.click('[data-level="snow"]'); await p.waitForTimeout(1500);
  await p.screenshot({path:'tools/shot_snow.png'});
  await p.evaluate(()=>localStorage.setItem('hughesmania_unlocked','7'));
  await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(400);
  await p.click('[data-action="levels"]'); await p.waitForTimeout(300);
  await p.click('[data-level="sick"]'); await p.waitForTimeout(1500);
  await p.screenshot({path:'tools/shot_sick.png'});
  await b.close(); console.log('ok');
})();
