// Touch-first input with keyboard as a desktop bonus.
//  - Tap on the world  -> handlers.onTap(x, y)   (point-and-go / act)
//  - Number keys 1..4  -> handlers.onSwitch(i)
//  - Held WASD/arrows  -> queried via Input.axis()
//  - Space             -> handlers.onAct()
const Input = (() => {
  const held = {};
  let canvas = null, handlers = {};

  function pos(e) {
    const r = canvas.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return { x: p.clientX - r.left, y: p.clientY - r.top };
  }

  function init(cv, h) {
    canvas = cv; handlers = h;

    const down = (e) => {
      if (e.cancelable) e.preventDefault();
      const { x, y } = pos(e);
      if (handlers.onTap) handlers.onTap(x, y);
    };
    canvas.addEventListener('pointerdown', down, { passive: false });
    canvas.addEventListener('touchstart', (e) => { if (e.cancelable) e.preventDefault(); }, { passive: false });

    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      held[k] = true;
      if (k >= '1' && k <= '4' && handlers.onSwitch) handlers.onSwitch(+k - 1);
      if (k === ' ' && handlers.onAct) { e.preventDefault(); handlers.onAct(); }
    });
    window.addEventListener('keyup', (e) => { held[e.key.toLowerCase()] = false; });
  }

  function axis() {
    let x = 0, y = 0;
    if (held['a'] || held['arrowleft']) x -= 1;
    if (held['d'] || held['arrowright']) x += 1;
    if (held['w'] || held['arrowup']) y -= 1;
    if (held['s'] || held['arrowdown']) y += 1;
    const m = Math.hypot(x, y) || 1;
    return { x: x / m, y: y / m, active: x !== 0 || y !== 0 };
  }

  return { init, axis };
})();
