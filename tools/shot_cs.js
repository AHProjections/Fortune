const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const W=414,H=896, pr={x:8,y:0.155*H,w:W-16,h:0.69*H};
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:W,height:H},deviceScaleFactor:2});
  await p.goto('http://localhost:8099/index.html',{waitUntil:'networkidle'});
  await p.evaluate(()=>localStorage.removeItem('hughesmania_unlocked'));
  await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(500);
  await p.click('[data-action="levels"]'); await p.waitForTimeout(300);
  await p.click('[data-level="m1"]'); await p.waitForTimeout(700);
  await p.screenshot({path:'tools/shot_intro.png'});           // intro panel 1
  for(let i=0;i<3;i++){await p.click('#csBtn');await p.waitForTimeout(350);}
  const spots=await p.evaluate(()=>LEVELS.m1.spots);
  const at=n=>({x:pr.x+spots[n].nx*pr.w,y:pr.y+spots[n].ny*pr.h});
  let s=at('stove'); await p.mouse.click(s.x,s.y); await p.waitForTimeout(4400);
  s=at('closet'); await p.mouse.click(s.x,s.y); await p.waitForTimeout(4600);
  await p.waitForTimeout(800);
  await p.screenshot({path:'tools/shot_wincs.png'});           // win cutscene
  await b.close(); console.log('ok');
})();
