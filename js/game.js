// ───────────────────────── Hughesmania — main game ─────────────────────────
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const hud = document.getElementById('hud');
  const overlay = document.getElementById('overlay');

  const World = { W: 0, H: 0, dpr: 1, playRect: { x: 0, y: 0, w: 0, h: 0 } };
  let state = 'loading';
  let players = [], active = 0, tasks = [], particles = [], speeches = [];
  let director = null;
  let chaos = 0, score = 0, combo = 0, comboT = 0, elapsed = 0, shake = 0;
  let last = 0;
  let currentLevelId = CAMPAIGN[0];
  let owenIdle = 0;            // seconds Owen has been left unattended
  let tipIdx = 0;             // next coaching tip to show

  // ── progression: how many campaign stages are unlocked (saved in browser) ──
  function getUnlocked() {
    const n = parseInt(localStorage.getItem('hughesmania_unlocked'), 10);
    return Math.max(1, Math.min(CAMPAIGN.length, n || 1));
  }
  function setUnlocked(n) {
    localStorage.setItem('hughesmania_unlocked', String(Math.max(getUnlocked(), n)));
  }
  function castConfigs() { return Level.cast.map(id => ROSTER.find(c => c.id === id)); }

  // combo flash element
  const comboFlash = document.createElement('div');
  comboFlash.id = 'comboFlash';
  document.getElementById('app').appendChild(comboFlash);

  // ───────────────── layout ─────────────────
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    World.dpr = dpr;
    World.W = window.innerWidth;
    World.H = window.innerHeight;
    canvas.width = World.W * dpr;
    canvas.height = World.H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    World.playRect = {
      x: 8, y: World.H * 0.155,
      w: World.W - 16, h: World.H * 0.69,
    };
    players.forEach(p => p.layout(World.playRect));
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 200));

  function spotXY(name) {
    const s = Level.spots[name], p = World.playRect;
    return { x: p.x + s.nx * p.w, y: p.y + s.ny * p.h };
  }

  // ───────────────── HUD building ─────────────────
  function buildCharBar() {
    const bar = document.getElementById('charbar');
    bar.innerHTML = '';
    castConfigs().forEach((c, i) => {
      const d = document.createElement('div');
      d.className = 'portrait' + (i === active ? ' active' : '');
      d.innerHTML = `<img src="assets/game/${c.id}/idle_0.png" alt="${c.name}"><div class="pname">${c.name}</div>`;
      d.addEventListener('pointerdown', (e) => { e.preventDefault(); switchTo(i); });
      bar.appendChild(d);
    });
  }
  function refreshCharBar() {
    document.querySelectorAll('.portrait').forEach((el, i) => {
      el.classList.toggle('active', i === active);
      el.classList.toggle('busy', !!(players[i] && players[i].busyTask));
    });
  }
  function buildChecklist() {
    const cl = document.getElementById('checklist');
    cl.innerHTML = '';
    Level.milestones.forEach(m => {
      const chip = document.createElement('div');
      chip.className = 'chip';
      chip.id = 'chip-' + m.id;
      chip.innerHTML = `${m.emoji} <span>${m.label}</span>`;
      cl.appendChild(chip);
    });
  }
  function markChip(id) {
    const chip = document.getElementById('chip-' + id);
    if (chip) { chip.classList.add('done', 'pop'); }
  }

  // ───────────────── game start ─────────────────
  function startGame(levelId) {
    Sound.unlock();
    if (levelId && LEVELS[levelId]) currentLevelId = levelId;
    Level = LEVELS[currentLevelId];
    state = 'playing';
    chaos = 0; score = 0; combo = 0; comboT = 0; elapsed = 0; shake = 0; owenIdle = 0; tipIdx = 0;
    particles = []; speeches = [];
    director = new Director(Level);
    active = 0; // start as the first family member in the cast

    const cast = castConfigs();
    players = cast.map(c => new Player(c));
    players.forEach(p => p.layout(World.playRect));
    const cx = World.playRect.x + World.playRect.w / 2;
    const cy = World.playRect.y + World.playRect.h * 0.62;
    const n = players.length;
    players.forEach((p, i) => { p.x = cx + (i - (n - 1) / 2) * World.playRect.w * 0.15; p.y = cy; });
    cast.forEach((c, i) => { players[i].abilities = c.abilities; players[i].workMult = c.workMult || 1; });

    // build milestone tasks
    tasks = Level.milestones.map(m => {
      const sp = spotXY(m.spot);
      const t = new Task('milestone', m, sp.x, sp.y);
      t.id = m.id; t.phase = 'work';
      return t;
    });

    buildChecklist();
    buildCharBar();
    hud.classList.remove('hidden');
    showScreen(null);
    Sound.startMusic();
    speak(players[active], "Let's do this!");
  }

  function switchTo(i) {
    if (state !== 'playing' || i === active) return;
    players[active].stop();
    players[active].busyTask = null;
    active = i;
    Sound.play('select');
    refreshCharBar();
    const p = players[active];
    if (Math.random() < 0.5) speak(p, pick(p.cfg.lines));
  }

  // ───────────────── interaction ─────────────────
  function actionableTargets() {
    const list = [];
    for (const t of tasks) {
      if (t.done) continue;
      if (t.kind === 'milestone' && t.deliverTo && t.phase === 'deliver') {
        const d = spotXY(t.deliverTo); list.push({ task: t, x: d.x, y: d.y, kind: 'task' });
      } else {
        list.push({ task: t, x: t.x, y: t.y, kind: 'task' });
      }
    }
    // item pickup: any required-item goal that's pending while nobody carries it
    for (const t of tasks) {
      if (t.done || !t.requires) continue;
      if (players.some(p => p.carry === t.requires.item)) continue;
      const f = spotXY(t.requires.from);
      list.push({ x: f.x, y: f.y, kind: 'source', item: t.requires.item });
    }
    return list;
  }

  function onTap(x, y) {
    if (state !== 'playing') return;
    Sound.unlock();
    const p = players[active];
    const targets = actionableTargets();
    let best = null, bestD = Infinity;
    for (const t of targets) {
      const d = Math.hypot(t.x - x, t.y - y);
      if (d < bestD) { bestD = d; best = t; }
    }
    if (best && bestD < Math.max(90, World.playRect.w * 0.16)) {
      p.intent = best;
      p.goTo(best.x, best.y);
    } else {
      p.intent = { kind: 'move' };
      p.goTo(clampX(x), clampY(y));
    }
  }
  function clampX(x) { const p = World.playRect; return Math.max(p.x + 20, Math.min(p.x + p.w - 20, x)); }
  function clampY(y) { const p = World.playRect; return Math.max(p.y + p.h * 0.2, Math.min(p.y + p.h - 6, y)); }

  function resolveActive(dt) {
    const p = players[active];
    if (!p.intent) { p.busyTask = null; return; }
    const it = p.intent;
    // a deliver-phase goal's target follows its drop-off spot
    let tx = it.x, ty = it.y;
    if (it.kind === 'task' && it.task.deliverTo && it.task.phase === 'deliver') {
      const d = spotXY(it.task.deliverTo); tx = d.x; ty = d.y; p.tx = tx; p.ty = ty;
    }
    const reach = p.r + Math.min(30, World.playRect.w * 0.05);
    const dist = Math.hypot(p.x - tx, p.y - ty);
    if (dist > reach) { p.busyTask = null; return; }

    p.stop();
    if (it.kind === 'source') {
      if (!p.carry) { p.carry = it.item; Sound.play('pickup'); speak(p, `Got the ${it.item}!`); burst(p.x, p.y - p.r * 4, '#ffd34e'); }
      p.intent = null; p.busyTask = null; return;
    }

    const t = it.task;
    if (!t || t.done) { p.intent = null; p.busyTask = null; return; }

    // validations
    if (t.requires && p.carry !== t.requires.item) {
      speak(p, `Need ${t.requires.item}!`); p.intent = null; p.busyTask = null; return;
    }
    if (t.crawlOnly && t.phase !== 'deliver' && !p.abilities.crawl) {
      speak(p, "Can't fit! Send a kid 👶"); p.intent = null; p.busyTask = null; return;
    }
    if (t.deliverTo && t.phase === 'deliver') {
      if (p.carry === t.emoji) finishMilestone(t, p);
      return;
    }

    // do the work
    if (t.worker && t.worker !== p) t.progress = 0;
    t.worker = p; t.working = true; p.busyTask = t;
    const calmMult = t.calm ? p.cfg.calmMult : 1;
    const threshold = t.duration * calmMult * (p.workMult || 1);
    t.progress += dt;
    Sound.play('progress');
    if (t.progress >= threshold) {
      if (t.kind === 'milestone') {
        // a "fetch then deliver" goal: first completion picks up the item
        if (t.deliverTo && t.phase !== 'deliver') {
          t.phase = 'deliver'; p.carry = t.emoji;
          Sound.play('success'); speak(p, 'Got it! ' + t.emoji); bumpCombo(80);
          burst(p.x, p.y - p.r * 4, '#ffd34e');
          p.intent.task = t; const d = spotXY(t.deliverTo); p.intent.x = d.x; p.intent.y = d.y;
          p.busyTask = null; t.working = false; t.progress = 0; return;
        }
        finishMilestone(t, p);
      } else {
        finishNuisance(t, p);
      }
    }
  }

  function finishMilestone(t, p) {
    t.done = true; t.working = false; p.busyTask = null; p.intent = null;
    if (t.requires && p.carry === t.requires.item) p.carry = null;
    if (t.deliverTo && p.carry === t.emoji) p.carry = null;
    markChip(t.id);
    chaos = Math.max(0, chaos + Level.chaosOnComplete);
    Sound.play('milestone');
    bumpCombo(200);
    confetti(t.x, t.y);
    speak(p, pick(["Done!", "Boom.", "Checked off!", "Next!"]));
    flashVictory(p);
    if (Level.milestones.every(m => tasks.find(x => x.id === m.id).done)) win();
  }
  function finishNuisance(t, p) {
    tasks = tasks.filter(x => x !== t);
    p.busyTask = null; p.intent = null;
    chaos = Math.max(0, chaos + Level.chaosOnComplete);
    Sound.play('success');
    bumpCombo(t.def.score);
    burst(t.x, t.y, '#57c785');
    speak(p, pick(["Fixed!", "Sorted.", "Phew.", "Crisis averted!"]));
  }

  function bumpCombo(base) {
    if (comboT > 0) combo++; else combo = 1;
    comboT = Level.comboWindow;
    score += Math.round(base * combo);
    if (combo >= 2) {
      Sound.play('combo');
      comboFlash.textContent = `COMBO x${combo}!`;
      comboFlash.classList.remove('show'); void comboFlash.offsetWidth; comboFlash.classList.add('show');
    }
  }
  function flashVictory(p) {
    p.victoryHold = true;
    setTimeout(() => { p.victoryHold = false; }, 700);
  }

  // ───────────────── win / lose ─────────────────
  function win() {
    if (state !== 'playing') return;
    state = 'win';
    hideTip();
    Sound.stopMusic(); Sound.play('win');
    players.forEach(p => { p.victoryHold = true; p.stop(); p.busyTask = null; });
    confetti(World.W / 2, World.H * 0.4); confetti(World.W * 0.3, World.H * 0.5); confetti(World.W * 0.7, World.H * 0.5);

    // unlock the next stage
    const idx = CAMPAIGN.indexOf(currentLevelId);
    if (idx >= 0) setUnlocked(idx + 2);
    const nx = nextLevelId();
    const justUnlocked = nx && (CAMPAIGN.indexOf(nx) === idx + 1);

    document.getElementById('winTitle').textContent = Level.theme.sun ? 'NICE WORK! 🎉' : 'SWEET DREAMS 🌙';
    document.getElementById('winSub').textContent =
      `“${Level.name}” complete — finished with ${Math.ceil(Math.max(0, Level.duration - elapsed))}s on the clock!`;
    document.getElementById('winStats').innerHTML =
      `<div>⭐ Score ${score}</div><div>🔥 Chaos survived: ${Math.round(chaos)}%</div>` +
      (justUnlocked ? `<div class="unlocked">🔓 Unlocked: ${LEVELS[nx].name}!</div>` : '');
    const nextBtn = document.getElementById('nextBtn');
    if (nx) { nextBtn.classList.remove('hidden'); nextBtn.textContent = `Next: ${LEVELS[nx].name} ▶`; }
    else nextBtn.classList.add('hidden');
    hud.classList.add('hidden');
    showScreen('win');
  }
  function lose(reason) {
    if (state !== 'playing') return;
    state = 'lose';
    hideTip();
    Sound.stopMusic(); Sound.play('lose');
    shake = 18;
    document.getElementById('loseSub').textContent = reason;
    const done = Level.milestones.filter(m => tasks.find(x => x.id === m.id).done).length;
    document.getElementById('loseStats').innerHTML =
      `<div>⭐ Score ${score}</div><div>✅ Goals done: ${done}/${Level.milestones.length}</div>`;
    hud.classList.add('hidden');
    showScreen('lose');
  }

  // ───────────────── update ─────────────────
  function update(dt) {
    if (state !== 'playing') {
      players.forEach((p, i) => p.update(dt, World, false));
      stepFx(dt);
      return;
    }
    elapsed += dt;
    comboT = Math.max(0, comboT - dt);
    if (comboT === 0) combo = 0;

    // coaching tips (gentle onboarding, mostly on early stages)
    if (Level.tips && tipIdx < Level.tips.length && elapsed >= Level.tips[tipIdx].at) {
      showTip(Level.tips[tipIdx].text);
      tipIdx++;
    }

    // reset working flags; tasks decay progress if untouched
    for (const t of tasks) {
      t.working = false;
    }
    // players
    players.forEach((p, i) => p.update(dt, World, i === active));
    resolveActive(dt);
    for (const t of tasks) {
      if (!t.working && t.progress > 0 && t.kind !== 'milestone') t.progress = Math.max(0, t.progress - dt * 1.5);
      if (!t.working && t.progress > 0 && t.kind === 'milestone' && t.phase !== 'deliver') t.progress = Math.max(0, t.progress - dt * 1.2);
    }

    // director spawns nuisances
    const nui = tasks.filter(t => t.kind === 'nuisance').length;
    director.update(dt, elapsed, nui, World, (t) => {
      tasks.push(t);
      Sound.play(t.def.type === 'cry' ? 'cry' : 'select');
      speak({ x: t.x, y: t.y - 30, r: 18 }, t.label + '!', true);
      shake = Math.max(shake, 4);
    });

    // Owen menace: leave the kid unattended too long and he makes trouble
    const owenIx = players.findIndex(p => p.id === 'owen');
    const owen = owenIx >= 0 ? players[owenIx] : null;
    if (Level.menace && owen && active !== owenIx && !owen.busyTask && !owen.moving) {
      owenIdle += dt;
      const already = tasks.some(t => t.def && t.def.type === 'mischief');
      if (owenIdle > 13 && !already && tasks.filter(t => t.kind === 'nuisance').length < Level.maxNuisances + 1) {
        const def = OWEN_MISCHIEF[Math.floor(Math.random() * OWEN_MISCHIEF.length)];
        const mt = new Task('nuisance', def, clampX(owen.x), clampY(owen.y - 4));
        tasks.push(mt);
        Sound.play('select'); shake = Math.max(shake, 6);
        speak(owen, pick(["hehehe", "oops", "ART!"]));
        speak({ x: mt.x, y: mt.y - 30, r: 18 }, def.label + '!', true);
        owenIdle = 0;
      }
    } else {
      owenIdle = 0;
    }

    // task timers + expiry
    for (const t of [...tasks]) {
      const r = t.update(dt);
      if (r === 'expired') {
        tasks = tasks.filter(x => x !== t);
        chaos = Math.min(100, chaos + t.def.chaos);
        Sound.play('fail'); shake = Math.max(shake, 10);
        burst(t.x, t.y, '#ff5d73');
      }
    }

    // ambient chaos
    const pendingNui = tasks.filter(t => t.kind === 'nuisance').length;
    const undoneMs = Level.milestones.filter(m => !tasks.find(x => x.id === m.id).done).length;
    chaos += dt * (Level.ambientPerNuisance * pendingNui + Level.ambientPerMilestone * undoneMs);
    chaos = Math.max(0, Math.min(100, chaos));

    Sound.setTension(chaos / 100);
    updateHUD();
    if (chaos >= 100) { lose("The Chaos meter hit 100%. Everyone's crying — including the parents."); return; }
    if (elapsed >= Level.duration) { lose("It's 8:00 and you're not ready. The school run is a no-show. 🚌💨"); return; }

    stepFx(dt);
    refreshCharBar();
  }

  function stepFx(dt) {
    for (const pt of particles) {
      pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 420 * dt; pt.life -= dt; pt.rot += pt.vr * dt;
    }
    particles = particles.filter(p => p.life > 0);
    for (const s of speeches) { s.life -= dt; s.y -= dt * 14; }
    speeches = speeches.filter(s => s.life > 0);
    if (shake > 0) shake = Math.max(0, shake - dt * 40);
  }

  function updateHUD() {
    document.getElementById('score').textContent = score;
    const min = Level.clockStart + (elapsed / Level.duration) * (Level.clockEnd - Level.clockStart);
    let hh = Math.floor(min / 60); const mm = Math.floor(min % 60);
    if (hh > 12) hh -= 12;
    document.getElementById('clock').textContent = `${hh}:${mm.toString().padStart(2, '0')}`;
    const fill = document.getElementById('chaosFill');
    const face = document.getElementById('chaosFace');
    fill.style.width = chaos + '%';
    face.style.left = chaos + '%';
    face.textContent = chaos < 30 ? '😀' : chaos < 55 ? '😬' : chaos < 80 ? '😰' : '🤯';
  }

  // ───────────────── render ─────────────────
  function render() {
    const { W, H } = World;
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);

    drawRoom();
    drawProps();

    // depth-sorted actors (players) by feet y
    const actors = [...players].map((p, i) => ({ p, i }));
    actors.sort((a, b) => a.p.y - b.p.y);
    // tasks drawn after props but bubbles always on top; draw floor markers first
    for (const t of tasks) drawTaskMarker(t);
    for (const a of actors) a.p.draw(ctx);
    for (const t of tasks) drawTaskBubble(t);

    // particles
    for (const pt of particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, pt.life * 2));
      ctx.translate(pt.x, pt.y); ctx.rotate(pt.rot);
      if (pt.emoji) { ctx.font = `${pt.size}px serif`; ctx.textAlign = 'center'; ctx.fillText(pt.emoji, 0, 0); }
      else { ctx.fillStyle = pt.color; ctx.fillRect(-pt.size / 2, -pt.size / 2, pt.size, pt.size); }
      ctx.restore();
    }
    // speeches
    for (const s of speeches) drawSpeech(s);

    ctx.restore();
  }

  function drawRoom() {
    const { W, H } = World, p = World.playRect;
    const th = Level.theme;
    const floorY = p.y + p.h * 0.30;
    // wall
    let g = ctx.createLinearGradient(0, 0, 0, floorY);
    g.addColorStop(0, th.wallTop); g.addColorStop(1, th.wallBot);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, floorY);
    // floor
    g = ctx.createLinearGradient(0, floorY, 0, H);
    g.addColorStop(0, th.floorTop); g.addColorStop(1, th.floorBot);
    ctx.fillStyle = g; ctx.fillRect(0, floorY, W, H - floorY);
    // floorboards
    ctx.strokeStyle = 'rgba(0,0,0,0.14)'; ctx.lineWidth = 2;
    for (let i = 1; i < 7; i++) {
      const y = floorY + (H - floorY) * i / 7;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    // window — sunny by day, starry/moon by night
    const wx = W * 0.5, wy = floorY * 0.42, ww = Math.min(150, W * 0.34), wh = ww * 0.7;
    roundRect(wx - ww / 2, wy - wh / 2, ww, wh, 12);
    ctx.fillStyle = th.sky; ctx.fill();
    if (th.sun) {
      ctx.fillStyle = '#ffe07a'; ctx.beginPath(); ctx.arc(wx + ww * 0.22, wy - wh * 0.12, ww * 0.13, 0, 7); ctx.fill();
    } else {
      ctx.fillStyle = '#f4f1c9'; ctx.beginPath(); ctx.arc(wx + ww * 0.24, wy - wh * 0.1, ww * 0.12, 0, 7); ctx.fill();
      ctx.fillStyle = th.sky; ctx.beginPath(); ctx.arc(wx + ww * 0.30, wy - wh * 0.16, ww * 0.1, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 6; i++) ctx.fillRect(wx - ww * 0.35 + (i * 53) % ww, wy - wh * 0.3 + (i * 31) % wh, 2, 2);
    }
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; roundRect(wx - ww / 2, wy - wh / 2, ww, wh, 12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(wx, wy - wh / 2); ctx.lineTo(wx, wy + wh / 2);
    ctx.moveTo(wx - ww / 2, wy); ctx.lineTo(wx + ww / 2, wy); ctx.stroke();
    // rug
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.beginPath();
    ctx.ellipse(p.x + p.w * 0.5, p.y + p.h * 0.78, p.w * 0.34, p.h * 0.16, 0, 0, 7);
    ctx.fill();
  }

  // Icons for every spot used by any level.
  const PROPS = {
    stove:    { emoji: '🍳', c: '#cfd4dc', label: 'Stove' },
    fridge:   { emoji: '🧊', c: '#dff1ff', label: 'Fridge' },
    highchair:{ emoji: '🪑', c: '#ffd9a3', label: 'Highchair' },
    changing: { emoji: '🧷', c: '#ffd3e2', label: 'Changing' },
    closet:   { emoji: '👕', c: '#cdeccf', label: 'Closet' },
    couch:    { emoji: '🛋️', c: '#caa6f0', label: 'Couch' },
    door:     { emoji: '🚪', c: '#e6c79a', label: 'Door' },
    bath:     { emoji: '🛁', c: '#bfe6ff', label: 'Bath' },
    sink:     { emoji: '🚰', c: '#d7eefc', label: 'Sink' },
    chair:    { emoji: '🪑', c: '#e6d3b3', label: 'Story chair' },
    dresser:  { emoji: '🧺', c: '#d9c4f0', label: 'Dresser' },
    toybox:   { emoji: '🧸', c: '#ffd6a8', label: 'Toy box' },
    crib:     { emoji: '🛏️', c: '#c8d8ff', label: 'Bed' },
  };
  function drawProps() {
    const base = Math.min(World.W, World.H) * 0.085;
    for (const name in Level.spots) {
      const { x, y } = spotXY(name);
      const pr = PROPS[name];
      // platform
      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = pr.c;
      roundRect(x - base * 0.7, y - base * 0.55, base * 1.4, base * 1.0, 12); ctx.fill();
      ctx.strokeStyle = 'rgba(60,40,90,0.25)'; ctx.lineWidth = 3;
      roundRect(x - base * 0.7, y - base * 0.55, base * 1.4, base * 1.0, 12); ctx.stroke();
      ctx.restore();
      // emoji
      ctx.font = `${Math.round(base * 0.95)}px serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(pr.emoji, x, y - base * 0.04);
      // label
      ctx.font = `600 ${Math.round(base * 0.26)}px Fredoka, sans-serif`;
      ctx.fillStyle = 'rgba(44,33,64,0.7)';
      ctx.fillText(pr.label, x, y + base * 0.62);
      ctx.textBaseline = 'alphabetic';
    }
  }

  function drawTaskMarker(t) {
    // soft glow ring on the floor to say "interact here"
    if (t.id === 'keys' && t.phase === 'deliver') return;
    const pulse = 0.5 + 0.5 * Math.sin(t.bob * 2);
    ctx.save();
    ctx.globalAlpha = 0.20 + pulse * 0.18;
    ctx.fillStyle = t.kind === 'nuisance' ? '#ff5d73' : '#ffd34e';
    ctx.beginPath();
    ctx.ellipse(t.x, t.y + (t.kind === 'milestone' ? 6 : 0), 30 + pulse * 6, 13 + pulse * 3, 0, 0, 7);
    ctx.fill();
    ctx.restore();
  }

  function drawTaskBubble(t) {
    let bx = t.x, by = t.y;
    let label = t.emoji;
    if (t.id === 'keys' && t.phase === 'deliver') { const d = spotXY('door'); bx = d.x; by = d.y; label = '🔑➜🚪'; }
    const r = 22 * t.spawnPop;
    by -= (t.kind === 'milestone' ? 52 : 30) + Math.sin(t.bob) * 4;
    // bubble
    ctx.save();
    ctx.translate(bx, by);
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = t.kind === 'nuisance' ? '#ff5d73' : '#7b53d6';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.stroke();
    // pointer
    ctx.beginPath(); ctx.moveTo(-6, r - 3); ctx.lineTo(6, r - 3); ctx.lineTo(0, r + 10); ctx.closePath();
    ctx.fillStyle = '#fff'; ctx.fill();
    // emoji
    ctx.font = `${Math.round(r * 1.1)}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 1);
    // nuisance countdown ring
    if (t.kind === 'nuisance') {
      const frac = Math.max(0, t.timeLeft / t.maxTime);
      ctx.beginPath();
      ctx.strokeStyle = frac < 0.35 ? '#ff5d73' : '#ffab2e';
      ctx.lineWidth = 4;
      ctx.arc(0, 0, r + 5, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.stroke();
    }
    // work progress ring
    if (t.working || t.progress > 0) {
      const thr = t.duration * 1.0;
      const frac = Math.min(1, t.progress / thr);
      ctx.beginPath();
      ctx.strokeStyle = '#57c785';
      ctx.lineWidth = 5;
      ctx.arc(0, 0, r + 5, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    ctx.textBaseline = 'alphabetic';
  }

  function drawSpeech(s) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, s.life * 1.5));
    ctx.font = `700 ${s.small ? 13 : 15}px Fredoka, sans-serif`;
    ctx.textAlign = 'center';
    const w = ctx.measureText(s.text).width + 20;
    ctx.fillStyle = s.small ? 'rgba(255,93,115,0.95)' : 'rgba(255,255,255,0.96)';
    roundRect(s.x - w / 2, s.y - 22, w, 24, 10); ctx.fill();
    ctx.fillStyle = s.small ? '#fff' : '#2c2140';
    ctx.fillText(s.text, s.x, s.y - 5);
    ctx.restore();
  }

  // ───────────────── fx helpers ─────────────────
  function burst(x, y, color) {
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * 7, sp = 80 + Math.random() * 160;
      particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, life: 0.6 + Math.random() * 0.4, size: 5 + Math.random() * 5, color, rot: 0, vr: 8 });
    }
  }
  function confetti(x, y) {
    const cols = ['#ff5d73', '#ffd34e', '#57c785', '#7b53d6', '#8fd0ff'];
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * 7, sp = 100 + Math.random() * 220;
      particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 180, life: 0.9 + Math.random() * 0.7, size: 6 + Math.random() * 6, color: cols[i % cols.length], rot: Math.random() * 7, vr: 10 });
    }
    Sound.play('combo');
  }
  function speak(who, text, small) {
    speeches.push({ x: who.x, y: who.y - (who.r ? who.r * 4.6 : 60), text, life: small ? 1.1 : 1.6, small });
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // coaching tip banner
  let tipTimer = null;
  function showTip(text) {
    const bar = document.getElementById('tipbar');
    bar.textContent = text;
    bar.classList.add('show');
    clearTimeout(tipTimer);
    tipTimer = setTimeout(() => bar.classList.remove('show'), 5200);
  }
  function hideTip() { const b = document.getElementById('tipbar'); b.classList.remove('show'); clearTimeout(tipTimer); }

  // ───────────────── overlay control ─────────────────
  function showScreen(name) {
    overlay.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    if (name) document.getElementById('screen-' + name).classList.remove('hidden');
    overlay.style.pointerEvents = name ? 'auto' : 'none';
  }
  function buildLevelSelect() {
    const wrap = document.getElementById('levelcards');
    const unlocked = getUnlocked();
    wrap.innerHTML = '';
    CAMPAIGN.forEach((id, i) => {
      const L = LEVELS[id];
      const locked = i >= unlocked;
      const card = document.createElement('button');
      card.className = 'levelcard' + (L.theme.sun ? '' : ' night') + (locked ? ' locked' : '');
      if (!locked) { card.dataset.action = 'level'; card.dataset.level = id; }
      card.innerHTML = locked
        ? `<span class="lc-emoji">🔒</span><span class="lc-name">${i + 1}. ${L.name}</span><span class="lc-blurb">Beat the previous stage to unlock.</span>`
        : `<span class="lc-emoji">${L.icon}</span><span class="lc-name">${i + 1}. ${L.name}</span><span class="lc-blurb">${L.blurb}</span>`;
      wrap.appendChild(card);
    });
  }
  function gotoLevels() { state = 'levels'; hud.classList.add('hidden'); hideTip(); buildLevelSelect(); showScreen('levels'); }
  function nextLevelId() {
    const i = CAMPAIGN.indexOf(currentLevelId);
    return (i >= 0 && i + 1 < CAMPAIGN.length) ? CAMPAIGN[i + 1] : null;
  }
  overlay.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    Sound.unlock();
    const a = btn.dataset.action;
    if (a === 'levels') gotoLevels();
    else if (a === 'level') startGame(btn.dataset.level);
    else if (a === 'again') startGame(currentLevelId);
    else if (a === 'next') { const nx = nextLevelId(); if (nx) startGame(nx); else gotoLevels(); }
    else if (a === 'howto') showScreen('howto');
    else if (a === 'back') showScreen('title');
    else if (a === 'title') { state = 'title'; hud.classList.add('hidden'); hideTip(); showScreen('title'); }
  });

  // ───────────────── main loop ─────────────────
  function loop(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0);
    last = ts;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  // round-rect helper (path only)
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ───────────────── boot ─────────────────
  function boot() {
    resize();
    Input.init(canvas, { onTap, onSwitch: switchTo, onAct: () => {} });
    // title cast
    const cast = document.getElementById('titleCast');
    ROSTER.forEach(c => {
      const img = document.createElement('img');
      img.src = `assets/game/${c.id}/idle_0.png`;
      cast.appendChild(img);
    });
    state = 'title';
    showScreen('title');
    requestAnimationFrame(loop);
  }

  Assets.preload(boot);
})();
