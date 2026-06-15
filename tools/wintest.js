const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const W=414,H=896, pr={x:8,y:0.155*H,w:W-16,h:0.69*H};

// step: ['tap',spot,wait] | ['switch',nth,wait] | ['owen',wait] (tap Owen's current spot)
const PLANS = {
  m1: [['tap','stove',4400],['tap','closet',4400]],
  m2: [['tap','stove',4400],['tap','closet',2600],['owen',4800],['tap','couch',4400]],
  m3: [['tap','stove',4400],['tap','closet',2600],['owen',4800],['tap','playmat',3200],['tap','changing',4600]],
  m4: [['tap','stove',4400],['tap','closet',2600],['owen',4800],
       ['tap','playmat',3200],['tap','changing',4600],
       ['tap','changing',3200],['tap','highchair',3600],['tap','fridge',3400],['tap','highchair',4600],
       ['switch',3,400],['tap','couch',4600],['tap','door',4400]],
  bedtime: [['tap','bath',4600],['tap','sink',4200],['tap','dresser',2600],['owen',4800],['tap','chair',4600],
            ['tap','carrier',3200],['tap','toybox',3200],['tap','playmat',3200],['tap','crib',4600]],
};

async function play(p, id) {
  const spots = await p.evaluate(l => LEVELS[l].spots, id);
  const at = n => ({ x: pr.x + spots[n].nx*pr.w, y: pr.y + spots[n].ny*pr.h });
  await p.click(`[data-level="${id}"]`); await p.waitForTimeout(700);
  for (const [type, arg, wait] of PLANS[id]) {
    if (type === 'switch') await p.click(`#charbar .portrait:nth-child(${arg})`);
    else if (type === 'owen') { const s=await p.evaluate(()=>window.__hm()); const o=s.players.find(x=>x.id==='owen'); await p.mouse.click(o.x,o.y); }
    else { const s=at(arg); await p.mouse.click(s.x,s.y); }
    await p.waitForTimeout(type==='switch'?arg&&400:wait||arg);
  }
  await p.waitForTimeout(700);
  const win = await p.$eval('#screen-win', el => !el.classList.contains('hidden')).catch(()=>false);
  const done = await p.$$eval('.chip.done', e=>e.length);
  const total = await p.$$eval('.chip', e=>e.length);
  return { win, done, total };
}

(async()=>{
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport:{width:W,height:H}, deviceScaleFactor:2 });
  const errors=[]; p.on('pageerror', e=>errors.push(e.message));
  await p.goto('http://localhost:8099/index.html', { waitUntil:'networkidle' });
  await p.evaluate(()=>localStorage.removeItem('hughesmania_unlocked'));
  await p.reload({ waitUntil:'networkidle' }); await p.waitForTimeout(700);
  await p.click('[data-action="levels"]'); await p.waitForTimeout(400);

  for (const id of ['m1','m2','m3','m4','bedtime']) {
    // skip the intro cutscene if present (m1)
    await p.click(`[data-level="${id}"]`).catch(()=>{});
    // if intro cutscene showed, click through it
    for (let i=0;i<4;i++){ const vis=await p.$eval('#screen-cutscene',el=>!el.classList.contains('hidden')).catch(()=>false);
      if(!vis) break; await p.click('#csBtn'); await p.waitForTimeout(300); }
    // play() expects to start from level select; we already entered the level above for m1's intro.
    // To keep it uniform, just run the step plan now (we're in the level).
    const spots=await p.evaluate(l=>LEVELS[l].spots,id);
    const at=n=>({x:pr.x+spots[n].nx*pr.w,y:pr.y+spots[n].ny*pr.h});
    await p.waitForTimeout(500);
    for (const [type,arg,wait] of PLANS[id]) {
      if (type==='switch') await p.click(`#charbar .portrait:nth-child(${arg})`);
      else if (type==='owen'){ const s=await p.evaluate(()=>window.__hm()); const o=s.players.find(x=>x.id==='owen'); await p.mouse.click(o.x,o.y); }
      else { const s=at(arg); await p.mouse.click(s.x,s.y); }
      await p.waitForTimeout(type==='switch'?400:(type==='owen'?arg:wait));
    }
    await p.waitForTimeout(800);
    // handle win cutscene
    for (let i=0;i<3;i++){ const vis=await p.$eval('#screen-cutscene',el=>!el.classList.contains('hidden')).catch(()=>false);
      if(!vis) break; await p.click('#csBtn'); await p.waitForTimeout(300); }
    const win=await p.$eval('#screen-win',el=>!el.classList.contains('hidden')).catch(()=>false);
    const done=await p.$$eval('.chip.done',e=>e.length); const total=await p.$$eval('.chip',e=>e.length);
    console.log(`${id}: win=${win} goals=${done}/${total}`);
    await p.screenshot({path:`tools/shot_${id}.png`});
    // back to stage list (win screen) or dismiss lose cutscene
    if (id!=='bedtime'){
      const onWin=await p.$eval('#screen-win [data-action="levels"]',el=>!!el).catch(()=>false);
      if(onWin) await p.click('#screen-win [data-action="levels"]').catch(()=>{});
      else { // lose: dismiss then go to stages
        for(let i=0;i<3;i++){const v=await p.$eval('#screen-cutscene',el=>!el.classList.contains('hidden')).catch(()=>false);if(!v)break;await p.click('#csBtn');await p.waitForTimeout(300);}
        await p.click('#screen-lose [data-action="levels"]').catch(()=>{});
      }
      await p.waitForTimeout(500);
    }
  }
  console.log('Errors:', errors.join('\n')||'(none)');
  await browser.close();
})();
