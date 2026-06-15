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
  const spots=await p.evaluate(()=>LEVELS.m4.spots);
  const at=n=>({x:pr.x+spots[n].nx*pr.w,y:pr.y+spots[n].ny*pr.h});
  await p.click('[data-level="m4"]'); await p.waitForTimeout(600);
  const tap=async(n,w)=>{const s=at(n);await p.mouse.click(s.x,s.y);await p.waitForTimeout(w);};
  const done=async()=>p.$$eval('.chip.done',e=>e.map(x=>x.textContent.trim()));
  // FEED: carry baby to highchair, place, get bottle, feed
  await tap('playmat',3000);     // pick up baby
  await tap('highchair',3400);   // place baby in highchair
  console.log('after place, done:', JSON.stringify(await done()));
  await tap('fridge',3200);      // bottle
  await tap('highchair',4200);   // feed
  console.log('after feed, done:', JSON.stringify(await done()));
  // KEYS: switch to Owen (3rd portrait), couch, door
  await p.click('#charbar .portrait:nth-child(3)'); await p.waitForTimeout(300);
  await tap('couch',4200);
  await tap('door',3800);
  console.log('after keys, done:', JSON.stringify(await done()));
  console.log('errors:', errs.join('|')||'(none)');
  await b.close();
})();
