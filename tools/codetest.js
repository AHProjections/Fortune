const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:414,height:896},deviceScaleFactor:2});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  // answer the prompt with HUGHES, accept the alert
  p.on('dialog', async d=>{ await d.accept(d.type()==='prompt'?'hughes':undefined); });
  await p.goto('http://localhost:8099/index.html',{waitUntil:'networkidle'});
  await p.evaluate(()=>localStorage.removeItem('hughesmania_unlocked'));
  await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(500);
  await p.click('[data-action="levels"]'); await p.waitForTimeout(300);
  const before=await p.$$eval('#levelcards .levelcard',els=>els.map(e=>e.classList.contains('locked')));
  await p.click('[data-action="code"]'); await p.waitForTimeout(500);
  const after=await p.$$eval('#levelcards .levelcard',els=>els.map(e=>e.classList.contains('locked')));
  console.log('locked before:', JSON.stringify(before));
  console.log('locked after :', JSON.stringify(after));
  console.log('all unlocked:', after.every(x=>!x)?'CODE PASS':'CODE FAIL');
  // verify sprites present (no broken images) by checking a frame loaded
  const imgOk=await p.evaluate(()=>{ const i=new Image(); return new Promise(r=>{ i.onload=()=>r(i.naturalWidth>0); i.onerror=()=>r(false); i.src='assets/game/andrew/idle_0.png'; }); });
  console.log('sprite loads:', imgOk?'PASS':'FAIL');
  console.log('errors:', errs.join('|')||'(none)');
  await b.close();
})();
