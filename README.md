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
- 👶 **Elliot can't walk** — tap him to carry him. While holding him your hands
  are full (no items), so jobs become an ordering puzzle: seat him in the
  highchair first, *then* fetch the bottle.
- 🎒 A **baby carrier** (found in a later stage) lets you hold Elliot and an item.
- 🔑 **Lost keys** are under the couch — only **Owen** can crawl under!
- Finish all the stage's goals before the clock runs out, without letting the
  **Chaos meter** hit 100%.
- Desktop bonus: **WASD/arrows** move, **1–4** switch characters, **space** acts.

## The campaign (gentle difficulty ramp)

Stages unlock as you win (saved in the browser); each adds one new idea and
ramps a little faster:

1. **Slow Start** — one parent (Andrew); Owen is an un-controllable NPC. Move + do jobs.
2. **Teamwork** — two parents; switch between them.
3. **Hands Full** — Elliot arrives (carry-only); learn the carry mechanic via diaper changes.
4. **The Full Routine** — feeding (baby + bottle), keys (Owen crawls), full chaos.
5. **Bedtime Battle** — the toughest, with a findable baby carrier.

Owen and Elliot are **NPCs** in early stages; Owen becomes controllable once the
crawl-for-keys job appears. (A future mode could let you *play as the kids* and
crank up the chaos until the parents give up.) The player system is built as
independent "slots" so same-tablet co-op and online play can be added later.

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
