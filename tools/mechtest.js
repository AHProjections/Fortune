const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const W=414,H=896, pr={x:8,y:0.155*H,w:W-16,h:0.69*H};
const load = async (p,id)=>{
  await p.evaluate(()=>localStorage.setItem('hughesmania_unlocked','5'));
  await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(400);
  await p.click('[data-action="levels"]'); await p.waitForTimeout(250);
  await p.click(`[data-level="${id}"]`); await p.waitForTimeout(600);
};
const spotsOf=async(p,id)=>p.evaluate(l=>LEVELS[l].spots,id);
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:W,height:H},deviceScaleFactor:2});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8099/index.html',{waitUntil:'networkidle'});

  // ---- TEST 1: work continues after switching away (m2) ----
  await load(p,'m2');
  let s=await spotsOf(p,'m2');
  const at=(sp,n)=>({x:pr.x+sp[n].nx*pr.w,y:pr.y+sp[n].ny*pr.h});
  let c=at(s,'stove'); await p.mouse.click(c.x,c.y);      // Andrew -> cook
  await p.waitForTimeout(1400);
  await p.click('#charbar .portrait:nth-child(2)');        // switch to Kalong mid-cook
  await p.waitForTimeout(200);
  c=at(s,'couch'); await p.mouse.click(c.x,c.y);           // Kalong -> tidy (plain job)
  await p.waitForTimeout(4200);
  const chips=await p.$$eval('.chip.done',e=>e.map(x=>x.textContent.trim()));
  console.log('TEST1 switch-continues — done chips:', JSON.stringify(chips), '=>',
    (chips.some(c=>c.includes('Cook'))&&chips.some(c=>c.includes('Tidy')))?'PASS':'FAIL');

  // ---- TEST 2: Owen refuses, parent carries, then drops (bedtime) ----
  await load(p,'bedtime');
  await p.evaluate(()=>window.__hmForceRefuse());
  await p.waitForTimeout(1200);
  let st=await p.evaluate(()=>window.__hm());
  let owen=st.players.find(x=>x.id==='owen');
  console.log('TEST2 refuse — owen.refusing =', owen.refusing, owen.refusing?'PASS':'FAIL');
  await p.mouse.click(owen.x, owen.y);                     // Andrew carries Owen
  let carried=false;
  for(let i=0;i<22;i++){ await p.waitForTimeout(150);
    const s2=await p.evaluate(()=>window.__hm());
    if(s2.players.find(x=>x.id==='owen').carriedBy){ carried=true; break; } }
  console.log('TEST2 carry — carried at some point:', carried, carried?'PASS':'FAIL');
  for(let i=0;i<30;i++){ await p.waitForTimeout(150);
    const s2=await p.evaluate(()=>window.__hm());
    if(!s2.players.find(x=>x.id==='owen').carriedBy) break; }
  st=await p.evaluate(()=>window.__hm()); owen=st.players.find(x=>x.id==='owen');
  console.log('TEST2 set-down — carriedBy =', owen.carriedBy, 'refusing =', owen.refusing,
    (!owen.carriedBy&&!owen.refusing)?'PASS':'FAIL');

  // ---- TEST 3: crying rides the baby (m4, deterministic spawn) ----
  await load(p,'m4');
  await p.waitForTimeout(700);
  await p.evaluate(()=>window.__hmSpawn('cry'));
  await p.waitForTimeout(300);
  const ss=await p.evaluate(()=>window.__hm());
  const cry=ss.tasks.find(t=>t.k==='cry');
  if(cry){ const d=Math.hypot(cry.x-ss.baby.x, cry.y-ss.baby.y);
    console.log('TEST3 cry-on-baby — follow:',cry.follow,'dist:',Math.round(d),
      (cry.follow&&d<5)?'PASS':'FAIL'); }
  else console.log('TEST3 cry-on-baby — FAIL (no cry)');

  console.log('errors:', errs.join('|')||'(none)');
  await b.close();
})();
