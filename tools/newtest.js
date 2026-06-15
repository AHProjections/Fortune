const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const W=414,H=896, pr={x:8,y:0.155*H,w:W-16,h:0.69*H};
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:W,height:H},deviceScaleFactor:2});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8099/index.html',{waitUntil:'networkidle'});
  await p.evaluate(()=>localStorage.setItem('hughesmania_unlocked','7'));
  const go=async(id)=>{ await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(400);
    await p.click('[data-action="levels"]'); await p.waitForTimeout(250);
    await p.click(`[data-level="${id}"]`); await p.waitForTimeout(700); };
  const spotsOf=id=>p.evaluate(l=>LEVELS[l].spots,id);
  const done=async()=>p.$$eval('.chip.done',e=>e.map(x=>x.textContent.trim()));
  const tapOwen=async(w)=>{const s=await p.evaluate(()=>window.__hm());const o=s.players.find(x=>x.id==='owen');await p.mouse.click(o.x,o.y);await p.waitForTimeout(w);};

  // SNOW: coat (grab 🧥 from closet, chase Owen) + cocoa (plain)
  await go('snow'); let s=await spotsOf('snow'); let at=n=>({x:pr.x+s[n].nx*pr.w,y:pr.y+s[n].ny*pr.h});
  let c=at('closet'); await p.mouse.click(c.x,c.y); await p.waitForTimeout(2600);
  await tapOwen(5000);
  c=at('stove'); await p.mouse.click(c.x,c.y); await p.waitForTimeout(4600);
  console.log('SNOW done:', JSON.stringify(await done()),
    ((await done()).some(x=>x.includes('Coat'))?'COAT PASS':'COAT FAIL'),
    ((await done()).some(x=>x.includes('cocoa'))?'COCOA PASS':'COCOA FAIL'));

  // SICK: temp (carry Owen to couch) + medicine (grab 💊, give at couch)
  await go('sick'); s=await spotsOf('sick'); at=n=>({x:pr.x+s[n].nx*pr.w,y:pr.y+s[n].ny*pr.h});
  await tapOwen(3200); c=at('couch'); await p.mouse.click(c.x,c.y); await p.waitForTimeout(4800);
  c=at('cabinet'); await p.mouse.click(c.x,c.y); await p.waitForTimeout(2800);
  c=at('couch'); await p.mouse.click(c.x,c.y); await p.waitForTimeout(4600);
  console.log('SICK done:', JSON.stringify(await done()),
    ((await done()).some(x=>x.includes('temperature'))?'TEMP PASS':'TEMP FAIL'),
    ((await done()).some(x=>x.includes('medicine'))?'MEDS PASS':'MEDS FAIL'));

  console.log('errors:', errs.join('|')||'(none)');
  await b.close();
})();
