const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const W=414,H=896, pr={x:8,y:0.155*H,w:W-16,h:0.69*H};
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:W,height:H},deviceScaleFactor:2});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8099/index.html',{waitUntil:'networkidle'});
  await p.evaluate(()=>localStorage.removeItem('hughesmania_unlocked'));
  await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(500);
  await p.click('[data-action="levels"]'); await p.waitForTimeout(250);
  await p.click('[data-level="m1"]'); await p.waitForTimeout(500);
  for(let i=0;i<4;i++){const v=await p.$eval('#screen-cutscene',e=>!e.classList.contains('hidden')).catch(()=>false);if(!v)break;await p.click('#csBtn');await p.waitForTimeout(300);}
  const s=await p.evaluate(()=>LEVELS.m1.spots); const at=n=>({x:pr.x+s[n].nx*pr.w,y:pr.y+s[n].ny*pr.h});
  const done=async()=>p.$$eval('.chip.done',e=>e.map(x=>x.textContent.trim()));
  let c=at('stove'); await p.mouse.click(c.x,c.y); await p.waitForTimeout(4200);   // cook
  c=at('closet'); await p.mouse.click(c.x,c.y); await p.waitForTimeout(2600);        // grab clothes
  const o=(await p.evaluate(()=>window.__hm())).players.find(x=>x.id==='owen'); await p.mouse.click(o.x,o.y); await p.waitForTimeout(5000); // chase+dress
  console.log('m1 done:', JSON.stringify(await done()),
    ((await done()).some(x=>x.includes('Cook'))&&(await done()).some(x=>x.includes('Dress')))?'PASS':'FAIL');
  const win=await p.$eval('#screen-cutscene',e=>!e.classList.contains('hidden')).catch(()=>false);
  console.log('win cutscene showing:', win);
  console.log('errors:', errs.join('|')||'(none)');
  await b.close();
})();
