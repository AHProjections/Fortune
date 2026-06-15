// Loads character frames described by window.SPRITES (assets/game/sprites.js).
// Exposes Assets.get(char, anim, frameIndex) -> HTMLImageElement (or null).
const Assets = (() => {
  const BASE = 'assets/game/';
  const images = {};          // src -> Image
  const manifest = window.SPRITES || {};
  let toLoad = 0, loaded = 0;
  let onReady = null;

  function load(src) {
    const img = new Image();
    img.onload = () => { loaded++; if (loaded === toLoad && onReady) onReady(); };
    img.onerror = () => { loaded++; console.warn('missing sprite', src); if (loaded === toLoad && onReady) onReady(); };
    img.src = BASE + src;
    images[src] = img;
  }

  function preload(cb) {
    onReady = cb;
    const srcs = [];
    for (const char in manifest) {
      for (const anim in manifest[char]) {
        const frames = manifest[char][anim];
        if (Array.isArray(frames)) frames.forEach(f => srcs.push(f.src));
      }
    }
    toLoad = srcs.length;
    if (toLoad === 0) { cb(); return; }
    srcs.forEach(load);
  }

  function frames(char, anim) {
    const c = manifest[char];
    if (!c || !Array.isArray(c[anim])) return null;
    return c[anim];
  }

  function get(char, anim, i) {
    const fr = frames(char, anim);
    if (!fr) return null;
    const f = fr[((i % fr.length) + fr.length) % fr.length];
    return images[f.src] || null;
  }

  // native idle height for relative scaling reference
  function nativeH(char) { return (manifest[char] && manifest[char]._h) || 130; }

  return { preload, get, frames, nativeH, manifest };
})();
