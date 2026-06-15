const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const W=414,H=896, pr={x:8,y:0.155*H,w:W-16,h:0.69*H};

// step: ['tap',spot,wait] | ['switch',nth,wait] | ['owen',wait]
const PLANS = {
  m1: [['tap','stove',4400],['tap','closet',2600],['owen',4800]],
  m2: [['tap','stove',4400],['tap','closet',2600],['owen',4800],['tap','couch',4400]],
  m3: [['tap','stove',4400],['tap','closet',2600],['owen',4800],['tap','playmat',3200],['tap','changing',4600]],
  m4: [['tap','stove',4400],['tap','closet',2600],['owen',4800],
       ['tap','playmat',3200],['tap','changing',4600],
       ['tap','changing',3200],['tap','highchair',3600],['tap','fridge',3400],['tap','highchair',4600],
       ['switch',3,400],['tap','couch',4600],['tap','door',4400]],
  bedtime: [['owen',3200],['tap','bath',4800],['owen',3200],['tap','sink',4400],['owen',3200],['tap','chair',4600],
            ['tap','dresser',2600],['owen',4800],
            ['tap','carrier',3000],['tap','toybox',3200],['tap','playmat',3200],['tap','crib',4600]],
};

async function dismissCutscene(p){
  for(let i=0;i<4;i++){ const vis=await p.$eval('#screen-cutscene',el=>!el.classList.contains('hidden')).catch(()=>false);
    if(!vis) break; await p.click('#csBtn').catch(()=>{}); await p.waitForTimeout(350); }
}

(async()=>{
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport:{width:W,height:H}, deviceScaleFactor:2 });
  const errors=[]; p.on('pageerror', e=>errors.push(e.message));
  await p.goto('http://localhost:8099/index.html', { waitUntil:'networkidle' });
  await p.evaluate(()=>localStorage.setItem('hughesmania_unlocked','5')); // all stages open for testing

  for (const id of ['m1','m2','m3','m4','bedtime']) {
    try {
      await p.reload({ waitUntil:'networkidle' }); await p.waitForTimeout(500);
      await p.click('[data-action="levels"]'); await p.waitForTimeout(300);
      await p.click(`[data-level="${id}"]`); await p.waitForTimeout(500);
      await dismissCutscene(p);                       // intro on m1
      const spots=await p.evaluate(l=>LEVELS[l].spots,id);
      const at=n=>({x:pr.x+spots[n].nx*pr.w,y:pr.y+spots[n].ny*pr.h});
      for (const [type,arg,wait] of PLANS[id]) {
        if (type==='switch') await p.click(`#charbar .portrait:nth-child(${arg})`).catch(()=>{});
        else if (type==='owen'){ const s=await p.evaluate(()=>window.__hm()); const o=s.players.find(x=>x.id==='owen'); if(o) await p.mouse.click(o.x,o.y); }
        else { const s=at(arg); await p.mouse.click(s.x,s.y); }
        await p.waitForTimeout(type==='switch'?400:(type==='owen'?arg:wait));
      }
      await p.waitForTimeout(800);
      await dismissCutscene(p);                       // win/lose cutscene
      const win=await p.$eval('#screen-win',el=>!el.classList.contains('hidden')).catch(()=>false);
      const lose=await p.$eval('#screen-lose',el=>!el.classList.contains('hidden')).catch(()=>false);
      const done=await p.$$eval('.chip.done',e=>e.length); const total=await p.$$eval('.chip',e=>e.length);
      console.log(`${id}: ${win?'WIN':(lose?'lose':'?')} goals=${done}/${total}`);
      await p.screenshot({path:`tools/shot_${id}.png`});
    } catch(e){ console.log(`${id}: ERROR ${e.message.split('\n')[0]}`); }
  }
  console.log('Page errors:', errors.join(' | ')||'(none)');
  await browser.close();
})();
