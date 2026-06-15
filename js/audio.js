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
  };

  function play(name) { if (sfx[name]) sfx[name](); }

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

  return { unlock, play, startMusic, stopMusic, setTension };
})();
