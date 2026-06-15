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
  await p.click('[data-level="bedtime"]'); await p.waitForTimeout(700);
  const done=async()=>p.$$eval('.chip.done',e=>e.map(x=>x.textContent.trim()));
  const tapOwen=async(w)=>{const s=await p.evaluate(()=>window.__hm());const o=s.players.find(x=>x.id==='owen');await p.mouse.click(o.x,o.y);await p.waitForTimeout(w);};
  const tap=async(n,w)=>{const s=at(n);await p.mouse.click(s.x,s.y);await p.waitForTimeout(w);};
  // ESCORT: carry Owen to bath, then to sink (teeth)
  await tapOwen(3200); await tap('bath',4800);
  console.log('after bath:', JSON.stringify(await done()), (await done()).some(c=>c.includes('Bath'))?'BATH PASS':'BATH FAIL');
  await tapOwen(3200); await tap('sink',4600);
  console.log('after teeth:', JSON.stringify(await done()), (await done()).some(c=>c.includes('teeth'))?'TEETH PASS':'TEETH FAIL');
  // MESS-FROM-OWEN: on m4, spawn a floor mess and verify it lands where Owen is
  await p.click('[data-action="levels"]').catch(()=>{});
  await p.evaluate(()=>localStorage.setItem('hughesmania_unlocked','5'));
  await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(400);
  await p.click('[data-action="levels"]'); await p.waitForTimeout(250);
  await p.click('[data-level="m4"]'); await p.waitForTimeout(900);
  const before=await p.evaluate(()=>window.__hm());
  const owenPos=before.players.find(x=>x.id==='owen');
  await p.evaluate(()=>window.__hmSpawn('spill'));
  await p.waitForTimeout(150);
  const after=await p.evaluate(()=>window.__hm());
  const mess=after.tasks.find(t=>t.k==='spill');
  if(mess){ const d=Math.hypot(mess.x-owenPos.x, mess.y-owenPos.y);
    console.log('mess-at-owen dist:', Math.round(d), 'follow:', mess.follow, (d<70&&!mess.follow)?'MESS PASS':'MESS FAIL'); }
  else console.log('MESS FAIL (no spill task)');
  console.log('errors:', errs.join('|')||'(none)');
  await b.close();
})();
