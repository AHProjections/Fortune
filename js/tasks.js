// Tasks are the jobs floating in the room. Two kinds:
//   'milestone' — one of the 5 morning goals (no expiry, must all be done to win)
//   'nuisance'  — random chaos with a countdown; ignoring it spikes the Chaos meter
class Task {
  constructor(kind, def, x, y) {
    this.kind = kind;
    this.def = def;
    this.x = x; this.y = y;
    this.emoji = def.emoji;
    this.label = def.label;
    this.duration = def.duration;
    this.requires = def.requires || null;     // {item, from}
    this.deliverTo = def.deliverTo || null;   // spot name to drop a carried item
    this.crawlOnly = !!def.crawlOnly;
    this.calm = !!def.calm;
    this.needsChild = def.needsChild || null;  // 'baby' must be settled at this spot
    this.onChild = def.onChild || null;        // milestone that rides a child (e.g. dress Owen)
    this.spot = def.spot || null;              // station name
    this.timeLeft = kind === 'nuisance' ? def.expire : Infinity;
    this.maxTime = this.timeLeft;
    this.progress = 0;            // 0..duration while being worked
    this.working = false;
    this.done = false;
    this.bob = Math.random() * 6.28;
    this.spawnPop = 0.0;          // 0->1 grow-in
  }

  // returns 'expired' if its timer ran out this frame
  update(dt) {
    this.bob += dt * 3;
    if (this.spawnPop < 1) this.spawnPop = Math.min(1, this.spawnPop + dt * 4);
    if (this.kind === 'nuisance' && !this.done && !this.working) {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) return 'expired';
    }
    return null;
  }
}

class Director {
  constructor(level) {
    this.level = level;
    this.t = 0;
    this.next = level.firstNuisance;
  }

  update(dt, elapsed, activeNuisances, world, spawn) {
    this.t += dt;
    if (this.t >= this.next && activeNuisances < this.level.maxNuisances) {
      spawn(this.makeNuisance(world));
      const frac = Math.min(1, elapsed / this.level.duration);
      const gap = this.level.nuisanceMax - (this.level.nuisanceMax - this.level.nuisanceMin) * frac;
      this.next = this.t + gap * (0.7 + Math.random() * 0.6);
    }
  }

  makeNuisance(world) {
    const defs = this.level.nuisances;
    const def = defs[Math.floor(Math.random() * defs.length)];
    const p = world.playRect;
    const mx = p.w * 0.16, my = p.h * 0.12;
    const x = p.x + mx + Math.random() * (p.w - mx * 2);
    const y = p.y + p.h * 0.42 + Math.random() * (p.h * 0.46 - my);
    return new Task('nuisance', def, x, y);
  }
}
