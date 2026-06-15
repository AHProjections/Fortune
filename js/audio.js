// Procedural sound — no audio files. Built on the Web Audio API so it ships in
// a single static folder. Must be unlocked by a user gesture (browser policy).
const Sound = (() => {
  let ctx = null, master = null, musicGain = null;
  let enabled = true, musicTimer = null, tension = 0;

  function ensure() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { enabled = false; return; }
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.7;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.16;
    musicGain.connect(master);
  }

  function unlock() {
    ensure();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function blip(freq, dur, type = 'square', vol = 0.3, when = 0, slideTo = null) {
    if (!enabled) return;
    ensure();
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  const sfx = {
    select() { blip(520, 0.08, 'square', 0.18); },
    walk()   { blip(180, 0.05, 'triangle', 0.08); },
    pickup() { blip(660, 0.07, 'square', 0.22); blip(880, 0.09, 'square', 0.18, 0.06); },
    progress(){ blip(440, 0.04, 'sine', 0.10); },
    success(){ [523,659,784,1046].forEach((f,i)=>blip(f,0.12,'square',0.22,i*0.06)); },
    milestone(){ [523,659,784,1046,1318].forEach((f,i)=>blip(f,0.16,'square',0.26,i*0.07)); },
    fail()   { blip(220, 0.3, 'sawtooth', 0.25, 0, 90); },
    cry()    { blip(880, 0.18, 'sawtooth', 0.14, 0, 620); blip(820, 0.2, 'sawtooth', 0.12, 0.18, 560); },
    combo()  { blip(784, 0.1, 'square', 0.2); blip(1046, 0.12, 'square', 0.2, 0.07); },
    win()    { [523,659,784,1046,784,1046,1318].forEach((f,i)=>blip(f,0.18,'triangle',0.28,i*0.12)); },
    lose()   { [440,392,330,262,196].forEach((f,i)=>blip(f,0.25,'sawtooth',0.26,i*0.16)); },
    babyup() { blip(700, 0.1, 'sine', 0.2, 0, 1050); blip(1050, 0.12, 'sine', 0.16, 0.08, 1300); }, // happy coo up
    kidup()  { blip(330, 0.1, 'square', 0.2, 0, 520); blip(520, 0.1, 'square', 0.16, 0.08); },
    carrier(){ blip(440, 0.08, 'triangle', 0.18); blip(660, 0.1, 'triangle', 0.18, 0.07); blip(880, 0.12, 'triangle', 0.2, 0.14); },
    drop()   { blip(300, 0.1, 'sine', 0.16, 0, 180); },
    whine()  { blip(500, 0.5, 'sawtooth', 0.18, 0, 360); },  // descending "nooo"
  };

  // Per-character "voices" — short vocal blips in each character's register.
  const VOICE = { andrew: 150, kalong: 300, owen: 460, elliot: 680 };
  function voice(id, kind) {
    if (!enabled) return; ensure();
    const f = VOICE[id] || 300;
    if (kind === 'whine')      { blip(f * 1.5, 0.4, 'sawtooth', 0.16, 0, f * 0.8); }
    else if (kind === 'coo')   { blip(f, 0.12, 'sine', 0.16, 0, f * 1.5); blip(f * 1.6, 0.12, 'sine', 0.12, 0.1); }
    else if (kind === 'cheer') { blip(f, 0.09, 'square', 0.16); blip(f * 1.5, 0.1, 'square', 0.15, 0.07); blip(f * 2, 0.12, 'square', 0.14, 0.15); }
    else                       { blip(f, 0.08, 'triangle', 0.15); blip(f * 1.33, 0.1, 'triangle', 0.13, 0.06); } // 'say'
  }

  function play(name) { if (sfx[name]) sfx[name](); }
  // exposed below via the returned object

  // Simple two-note bass pulse whose tempo rises with chaos "tension" (0..1).
  function startMusic() {
    ensure();
    stopMusic();
    let step = 0;
    const notes = [98, 98, 130, 110];
    function tick() {
      if (!enabled || !ctx) return;
      const f = notes[step % notes.length];
      blip(f, 0.18, 'triangle', 0.12 + tension * 0.06);
      if (step % 2 === 0) blip(f * 2, 0.1, 'sine', 0.05);
      step++;
      const interval = 520 - tension * 230; // faster when chaotic
      musicTimer = setTimeout(tick, interval);
    }
    tick();
  }
  function stopMusic() { if (musicTimer) { clearTimeout(musicTimer); musicTimer = null; } }
  function setTension(t) { tension = Math.max(0, Math.min(1, t)); }

  return { unlock, play, voice, startMusic, stopMusic, setTension };
})();
