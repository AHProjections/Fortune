const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const W=414,H=896, pr={x:8,y:0.155*H,w:W-16,h:0.69*H};
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:W,height:H},deviceScaleFactor:2});
  await p.goto('http://localhost:8099/index.html',{waitUntil:'networkidle'});
  await p.evaluate(()=>localStorage.setItem('hughesmania_unlocked','5'));
  await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(500);
  await p.click('[data-action="levels"]'); await p.waitForTimeout(300);
  const spots=await p.evaluate(()=>LEVELS.m3.spots);
  const at=n=>({x:pr.x+spots[n].nx*pr.w,y:pr.y+spots[n].ny*pr.h});
  await p.click('[data-level="m3"]'); await p.waitForTimeout(1500);
  await p.screenshot({path:'tools/shot_m3start.png'});  // shows baby on playmat + parents only
  const s=at('playmat'); await p.mouse.click(s.x,s.y); await p.waitForTimeout(1100);
  await p.screenshot({path:'tools/shot_m3carry.png'});  // carrying baby
  await b.close(); console.log('ok');
})();
