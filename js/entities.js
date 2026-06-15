// A controllable family member.
class Player {
  constructor(cfg) {
    this.cfg = cfg;            // { id, name, speedFrac, displayFrac, abilities, color }
    this.id = cfg.id;
    this.x = 0; this.y = 0;
    this.tx = null; this.ty = null;   // move target (tap-to-go)
    this.facing = 1;                  // 1 right, -1 left
    this.anim = 'idle';
    this.frame = 0; this.frameT = 0;
    this.bob = Math.random() * 6;
    this.carry = null;                // item emoji string, or null
    this.k = 1;                       // sprite scale factor (set on layout)
    this.moving = false;
    this.squash = 0;                  // landing squash timer
    this.walkSfxT = 0;
    this.carryBaby = false;           // true while carrying Elliot
    this.carryKid = null;             // a refusing kid being carried
    this.carriedBy = null;            // the parent carrying this character
    this.refusing = false;            // "I don't want to walk!"
    this.refuseTimer = null;
    this.refuseWhine = 0;
    this.frozen = false;              // held still while being dressed
    this.placedSpot = null;           // set down at a station (kid being escorted)
    this.isNpc = false;               // wandering, not controllable
    this.npcTimer = Math.random() * 2;
  }

  layout(playRect) {
    const desired = playRect.h * this.cfg.displayFrac;
    this.k = desired / Assets.nativeH(this.id);
    this.speed = playRect.h * this.cfg.speedFrac; // px per second
    this.r = desired * 0.28;                       // interaction/footprint radius
  }

  setAnim(a) {
    if (this.anim !== a) { this.anim = a; this.frame = 0; this.frameT = 0; }
  }

  goTo(x, y) { this.tx = x; this.ty = y; }
  stop() { this.tx = this.ty = null; }

  npcWander(dt, world) {
    this.npcTimer -= dt;
    if (this.npcTimer <= 0) {
      const p = world.playRect;
      if (Math.random() < 0.6) {
        this.tx = p.x + p.w * (0.15 + Math.random() * 0.7);
        this.ty = p.y + p.h * (0.35 + Math.random() * 0.55);
      } else { this.tx = this.ty = null; } // pause
      this.npcTimer = 1.4 + Math.random() * 2.6;
    }
  }

  update(dt, world, isActive) {
    let vx = 0, vy = 0;
    // Being carried by a parent: ride along in their arms.
    if (this.carriedBy) {
      const c = this.carriedBy;
      this.facing = c.facing;
      this.x = c.x + c.facing * c.r * 0.55;
      this.y = c.y + 1;
      this.moving = false; this.tx = this.ty = null;
      this.setAnim('happy');
      this.frameT += dt; if (this.frameT >= 0.4) { this.frameT = 0; this.frame++; }
      return;
    }
    // Set down at a station (being escorted through the routine): stay put.
    if (this.placedSpot) {
      this.tx = this.ty = null; this.moving = false; this.busyTask = null;
      this.setAnim('happy');
      this.bob += dt * 3;
      this.frameT += dt; if (this.frameT >= 0.4) { this.frameT = 0; this.frame++; }
      return;
    }
    // Refusing to walk: plant down, can't be moved until carried.
    if (this.refusing) {
      this.tx = this.ty = null; this.moving = false; this.busyTask = null;
      this.setAnim('idle');
      this.bob += dt * 3;
      this.frameT += dt; if (this.frameT >= 1 / 2.2) { this.frameT = 0; this.frame++; }
      return;
    }
    // Held still while a parent dresses this child.
    if (this.frozen) {
      this.tx = this.ty = null; this.moving = false;
      this.setAnim('happy');
      this.bob += dt * 3;
      this.frameT += dt; if (this.frameT >= 0.4) { this.frameT = 0; this.frame++; }
      return;
    }
    if (this.isNpc) this.npcWander(dt, world);
    // Keyboard steering only for the active, controllable character.
    const ax = (isActive && !this.isNpc) ? Input.axis() : { active: false };
    if (this.busyTask) {
      // standing still while performing a task
      this.moving = false;
    } else if (ax.active) {
      vx = ax.x; vy = ax.y; this.tx = this.ty = null;
    } else if (this.tx != null) {
      const dx = this.tx - this.x, dy = this.ty - this.y;
      const d = Math.hypot(dx, dy);
      if (d < 4) { this.tx = this.ty = null; }
      else { vx = dx / d; vy = dy / d; }
    }

    this.moving = (vx || vy) && !this.busyTask;
    if (this.moving) {
      const spd = this.speed * (this.isNpc ? 0.55 : 1);
      this.x += vx * spd * dt;
      this.y += vy * spd * dt;
      if (Math.abs(vx) > 0.05) this.facing = vx > 0 ? 1 : -1;
      // clamp to floor
      const p = world.playRect;
      this.x = Math.max(p.x + this.r, Math.min(p.x + p.w - this.r, this.x));
      this.y = Math.max(p.y + p.h * 0.18, Math.min(p.y + p.h - 6, this.y));
      if (!this.isNpc) {
        this.walkSfxT -= dt;
        if (this.walkSfxT <= 0) { Sound.play('walk'); this.walkSfxT = 0.26; }
      }
    }

    // animation selection
    if (this.victoryHold) this.setAnim('victory');
    else if (this.busyTask) this.setAnim('interact');
    else if (this.moving) this.setAnim('walk');
    else this.setAnim('idle');

    // advance frames
    const fps = this.anim === 'walk' ? 9 : (this.anim === 'idle' ? 2.2 : 5);
    this.frameT += dt;
    if (this.frameT >= 1 / fps) { this.frameT = 0; this.frame++; }
    this.bob += dt * (this.moving ? 12 : 3);
    if (this.squash > 0) this.squash -= dt;
  }

  draw(ctx) {
    const img = Assets.get(this.id, this.anim, this.frame);
    const bobY = this.moving ? Math.abs(Math.sin(this.bob)) * 5 : Math.sin(this.bob) * 2.5;
    // shadow
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, this.r * 1.15, this.r * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (img && img.naturalHeight) {
      const h = img.naturalHeight * this.k;
      const w = img.naturalWidth * this.k;
      const sq = Math.max(0, this.squash) * 2;
      ctx.save();
      ctx.translate(this.x, this.y - bobY);
      ctx.scale(this.facing, 1);
      ctx.drawImage(img, -w / 2, -h * (1 + sq * 0.1) + sq * 4, w * (1 + sq * 0.15), h * (1 - sq * 0.1));
      ctx.restore();
    }

    // carried item
    if (this.carry) {
      ctx.save();
      ctx.font = `${Math.round(this.r * 1.6)}px serif`;
      ctx.textAlign = 'center';
      ctx.fillText(this.carry, this.x + this.facing * this.r * 0.7, this.y - this.r * 4.4 - bobY);
      ctx.restore();
    }
  }
}

// Elliot — a carry-only baby NPC. He cannot walk; a parent must carry him,
// and while held a parent's hands are full (unless they have the carrier).
class Baby {
  constructor() {
    this.id = 'elliot';
    this.state = 'loose';       // 'loose' | 'carried' | 'placed'
    this.carrier = null;        // Player carrying him
    this.placedSpot = null;     // spot name when placed
    this.x = 0; this.y = 0;
    this.facing = 1;
    this.frame = 0; this.frameT = 0;
    this.bob = Math.random() * 6;
  }

  layout(playRect) {
    const desired = playRect.h * 0.125;
    this.k = desired / Assets.nativeH('elliot');
    this.r = desired * 0.28;
  }

  // depth-sort key: ride with the carrier when held
  get sortY() { return this.state === 'carried' && this.carrier ? this.carrier.y + 0.5 : this.y; }

  update(dt) {
    this.bob += dt * 3;
    this.frameT += dt;
    if (this.frameT >= 0.4) { this.frameT = 0; this.frame++; }
    if (this.state === 'carried' && this.carrier) {
      const c = this.carrier;
      this.facing = c.facing;
      this.x = c.x + c.facing * c.r * 0.5;
      this.y = c.y - c.r * 1.7;     // tucked in the arms
    }
  }

  draw(ctx) {
    const carried = this.state === 'carried';
    const anim = carried ? 'happy' : 'idle';
    const img = Assets.get('elliot', anim, this.frame);
    const bobY = carried ? 0 : Math.sin(this.bob) * 2.2;
    if (!carried) {
      ctx.save();
      ctx.globalAlpha = 0.22; ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.ellipse(this.x, this.y, this.r * 1.1, this.r * 0.4, 0, 0, 7); ctx.fill();
      ctx.restore();
    }
    if (img && img.naturalHeight) {
      const h = img.naturalHeight * this.k, w = img.naturalWidth * this.k;
      ctx.save();
      ctx.translate(this.x, this.y - bobY);
      ctx.scale(this.facing, 1);
      // feet-anchored when on the ground; centred in the arms when carried
      ctx.drawImage(img, -w / 2, carried ? -h * 0.78 : -h, w, h);
      ctx.restore();
    }
  }
}
