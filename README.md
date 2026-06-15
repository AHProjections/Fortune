# 🍼 Hughesmania

A frantic, comedic browser game about surviving the morning routine with the
Hughes family — **Andrew** (dad), **Kalong** (mom), **Owen** (kid) and baby
**Elliot**. Overcooked-style chaos management, mobile-first, no build step.

## Play

It's a static site — just open it over HTTP:

```bash
python3 -m http.server 8099
# then visit http://localhost:8099/
```

Or host the folder on any static host (GitHub Pages, Netlify, etc.).

## How to play

- **Tap a glowing job** to send your character to do it.
- **Tap a family portrait** (bottom bar) to switch who you control.
- 🍼 **Feeding** needs a bottle from the fridge first — grab it, then go to the highchair.
- 🔑 **Lost keys** are under the couch — only **Owen** or baby **Elliot** can crawl under!
- Finish all **5 morning goals** before 8:00 without letting the **Chaos meter** hit 100%.
- Desktop bonus: **WASD/arrows** move, **1–4** switch characters, **space** acts.

Each character has a role: Andrew is strong, Kalong is the fast multitasker who
calms tantrums instantly, Owen and Elliot can crawl into tight spots. The player
system is built as independent "slots" so same-tablet co-op and online play can
be added later without a rewrite.

## Project layout

```
index.html              # entry point (mobile-first)
css/style.css           # styling
js/
  assets.js             # sprite manifest loader
  audio.js              # procedural Web Audio sfx + music
  input.js              # touch + keyboard
  entities.js           # Player
  tasks.js              # Task + Director (chaos spawner)
  level.js              # all tunable level data ("Morning Routine")
  game.js               # main loop, interactions, rendering, HUD
assets/
  game/                 # game-ready frames + sprites.js manifest (committed)
  raw/                  # original presentation sprite sheets (source of truth)
tools/
  extract.py            # crop poses from the sheets, key out the background
  build_frames.py       # select frames -> assets/game + sprites.js
  smoke.js / wintest.js # headless Playwright checks
```

## Regenerating sprites

The art started as four labeled presentation sheets (dark background, varying
sizes) in `assets/raw/`. The pipeline crops each pose, removes the background to
transparency, trims, and emits a JS manifest:

```bash
pip install Pillow numpy scipy
python3 tools/extract.py        # -> assets/cut/ (intermediates, gitignored)
python3 tools/build_frames.py   # -> assets/game/ + sprites.js
```
