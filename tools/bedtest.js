const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const W=414,H=896, pr={x:8,y:0.155*H,w:W-16,h:0.69*H};
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:W,height:H},deviceScaleFactor:2});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8099/index.html',{waitUntil:'networkidle'});
  await p.evaluate(()=>localStorage.setItem('hughesmania_unlocked','5'));
  await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(500);
  await p.click('[data-action="levels"]'); await p.waitForTimeout(300);
  const spots=await p.evaluate(()=>LEVELS.bedtime.spots);
  const at=n=>({x:pr.x+spots[n].nx*pr.w,y:pr.y+spots[n].ny*pr.h});
  await p.click('[data-level="bedtime"]'); await p.waitForTimeout(600);
  const tap=async(n,w)=>{const s=at(n);await p.mouse.click(s.x,s.y);await p.waitForTimeout(w);};
  const done=async()=>p.$$eval('.chip.done',e=>e.map(x=>x.textContent.trim()));
  // carrier -> teddy -> baby -> crib (one-trip tuck-in)
  await tap('carrier',3000);
  await tap('toybox',3200);
  console.log('after teddy:', JSON.stringify(await done()));
  await tap('playmat',3000);   // pick up baby (allowed with carrier while holding teddy)
  await tap('crib',4200);      // place baby + deliver teddy
  console.log('after crib:', JSON.stringify(await done()));
  await p.screenshot({path:'tools/shot_bedplay.png'});
  console.log('errors:', errs.join('|')||'(none)');
  await b.close();
})();
