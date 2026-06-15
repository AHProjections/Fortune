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

  update(dt, world, isActive) {
    let vx = 0, vy = 0;
    // Keyboard steering only for the active character.
    const ax = isActive ? Input.axis() : { active: false };
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
      this.x += vx * this.speed * dt;
      this.y += vy * this.speed * dt;
      if (Math.abs(vx) > 0.05) this.facing = vx > 0 ? 1 : -1;
      // clamp to floor
      const p = world.playRect;
      this.x = Math.max(p.x + this.r, Math.min(p.x + p.w - this.r, this.x));
      this.y = Math.max(p.y + p.h * 0.18, Math.min(p.y + p.h - 6, this.y));
      this.walkSfxT -= dt;
      if (this.walkSfxT <= 0) { Sound.play('walk'); this.walkSfxT = 0.26; }
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
