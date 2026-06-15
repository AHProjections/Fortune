// ─────────────── Shared roster + the difficulty-ramped campaign ───────────────
// `Level` is the *current* level (mutable). `LEVELS` holds every stage and
// `CAMPAIGN` is their order. Each stage adds ONE new idea and ramps a little
// faster, so new players get time to learn. game.js reads `Level.*` at
// call-time, so reassigning Level switches stages.

const ROSTER = [
  { id: 'andrew', name: 'Andrew', speedFrac: 0.27, displayFrac: 0.205,
    abilities: { lift: true }, calmMult: 1.2, workMult: 1.0,
    lines: ["Where are my KEYS", "I've got this. I think.", "Coffee. Need coffee.", "Define 'fine'."] },
  { id: 'kalong', name: 'Kalong', speedFrac: 0.30, displayFrac: 0.195,
    abilities: { supermom: true }, calmMult: 0.5, workMult: 0.8,
    lines: ["On it.", "Mom mode: ACTIVATED", "Breathe. We're fine.", "I have eyes everywhere."] },
  { id: 'owen',   name: 'Owen',   speedFrac: 0.30, displayFrac: 0.150,
    abilities: { crawl: true }, calmMult: 1.0, workMult: 1.0,
    lines: ["I found it!", "I'm helping!", "Look at me go!", "Can I have a snack?"] },
  { id: 'elliot', name: 'Elliot', speedFrac: 0.22, displayFrac: 0.125,
    abilities: { crawl: true }, calmMult: 1.0, workMult: 1.1,
    lines: ["goo goo", "ba ba ba!", "*giggles*", "*blows raspberry*"] },
];

const DAY = { wallTop: '#b9a7e6', wallBot: '#d9c9f5', floorTop: '#e7b277', floorBot: '#c98c4f', sky: '#bfe9ff', sun: true };
const NIGHT = { wallTop: '#2b2350', wallBot: '#4a3e7a', floorTop: '#6b5a8f', floorBot: '#43386b', sky: '#1a2a55', sun: false };

const MORNING_SPOTS = {
  stove:    { nx: 0.20, ny: 0.30 }, fridge:   { nx: 0.82, ny: 0.30 },
  highchair:{ nx: 0.50, ny: 0.48 }, changing: { nx: 0.83, ny: 0.62 },
  closet:   { nx: 0.17, ny: 0.62 }, couch:    { nx: 0.70, ny: 0.82 },
  door:     { nx: 0.30, ny: 0.86 },
};

const LEVELS = {
  // ── Stage 1 — Slow Start: one parent, one kid, two jobs, almost no chaos ──
  m1: {
    id: 'm1', name: 'Slow Start', icon: '🍳',
    blurb: 'Just Dad and Owen. Learn the ropes.',
    cast: ['andrew', 'owen'],
    theme: DAY, spots: MORNING_SPOTS,
    milestones: [
      { id: 'cook',  label: 'Cook breakfast', emoji: '🍳', spot: 'stove',  duration: 2.2 },
      { id: 'dress', label: 'Dress Owen',     emoji: '👕', spot: 'closet', duration: 2.0 },
    ],
    nuisances: [
      { type: 'toys', label: 'Toy mess', emoji: '🧸', duration: 1.3, expire: 16, chaos: 7, score: 80 },
    ],
    duration: 95, clockStart: 7 * 60, clockEnd: 8 * 60,
    firstNuisance: 22, nuisanceMin: 9, nuisanceMax: 13, maxNuisances: 1,
    ambientPerNuisance: 0.7, ambientPerMilestone: 0.18, chaosOnComplete: -8, comboWindow: 5.0,
    menace: false,
    tips: [
      { at: 0.6,  text: '👆 Tap a glowing job to send Dad to do it.' },
      { at: 7.0,  text: '👇 Tap a face at the bottom to switch who you control.' },
      { at: 15.0, text: 'Finish every job before the clock reaches 8:00!' },
    ],
  },

  // ── Stage 2 — Hungry Baby: adds Elliot + the fetch-a-bottle mechanic ──
  m2: {
    id: 'm2', name: 'Hungry Baby', icon: '🍼',
    blurb: 'Baby Elliot joins. Some jobs need supplies first.',
    cast: ['andrew', 'owen', 'elliot'],
    theme: DAY, spots: MORNING_SPOTS,
    milestones: [
      { id: 'cook',  label: 'Cook breakfast', emoji: '🍳', spot: 'stove',     duration: 2.4 },
      { id: 'dress', label: 'Dress Owen',     emoji: '👕', spot: 'closet',    duration: 2.2 },
      { id: 'feed',  label: 'Feed Elliot',    emoji: '🍼', spot: 'highchair', duration: 2.2, requires: { item: '🍼', from: 'fridge' } },
    ],
    nuisances: [
      { type: 'toys', label: 'Toy mess',    emoji: '🧸', duration: 1.3, expire: 14, chaos: 9,  score: 80 },
      { type: 'cry',  label: 'Baby crying', emoji: '😭', duration: 1.4, expire: 12, chaos: 11, score: 100 },
    ],
    duration: 120, clockStart: 7 * 60, clockEnd: 8 * 60,
    firstNuisance: 14, nuisanceMin: 6, nuisanceMax: 10, maxNuisances: 2,
    ambientPerNuisance: 0.95, ambientPerMilestone: 0.28, chaosOnComplete: -7, comboWindow: 4.5,
    menace: false,
    tips: [
      { at: 0.6, text: '🍼 To feed Elliot, first grab the bottle from the fridge, then go to the highchair.' },
    ],
  },

  // ── Stage 3 — The Full Routine: whole family, keys-under-the-couch, menace ──
  m3: {
    id: 'm3', name: 'The Full Routine', icon: '🔑',
    blurb: 'The whole family. Out the door by 8:00!',
    cast: ['andrew', 'kalong', 'owen', 'elliot'],
    theme: DAY, spots: MORNING_SPOTS,
    milestones: [
      { id: 'cook',   label: 'Cook breakfast', emoji: '🍳', spot: 'stove',     duration: 2.6 },
      { id: 'feed',   label: 'Feed Elliot',    emoji: '🍼', spot: 'highchair', duration: 2.2, requires: { item: '🍼', from: 'fridge' } },
      { id: 'diaper', label: 'Change diaper',  emoji: '🧷', spot: 'changing',  duration: 2.6 },
      { id: 'dress',  label: 'Dress Owen',     emoji: '👕', spot: 'closet',    duration: 2.2 },
      { id: 'keys',   label: 'Find the keys',  emoji: '🔑', spot: 'couch',     duration: 2.0, crawlOnly: true, deliverTo: 'door' },
    ],
    nuisances: [
      { type: 'tantrum', label: 'Owen tantrum', emoji: '😡', duration: 1.6, expire: 10, chaos: 14, score: 120, calm: true },
      { type: 'spill',   label: 'Cereal spill', emoji: '🥣', duration: 1.4, expire: 12, chaos: 10, score: 90 },
      { type: 'cry',     label: 'Baby crying',  emoji: '😭', duration: 1.4, expire: 11, chaos: 12, score: 100 },
      { type: 'toys',    label: 'Toy mess',     emoji: '🧸', duration: 1.3, expire: 14, chaos: 8,  score: 80 },
    ],
    duration: 150, clockStart: 7 * 60, clockEnd: 8 * 60,
    firstNuisance: 9, nuisanceMin: 4.0, nuisanceMax: 8.0, maxNuisances: 4,
    ambientPerNuisance: 1.15, ambientPerMilestone: 0.4, chaosOnComplete: -6, comboWindow: 4.0,
    menace: true,
    tips: [
      { at: 0.6, text: '🔑 The keys are under the couch — only Owen or baby Elliot can crawl under!' },
    ],
  },

  // ── Stage 4 — Bedtime Battle: the toughest stage ──
  bedtime: {
    id: 'bedtime', name: 'Bedtime Battle', icon: '🌙',
    blurb: 'Everyone into bed by 8:30. They will resist.',
    cast: ['andrew', 'kalong', 'owen', 'elliot'],
    theme: NIGHT,
    spots: {
      bath:   { nx: 0.20, ny: 0.30 }, sink:    { nx: 0.82, ny: 0.30 },
      chair:  { nx: 0.50, ny: 0.46 }, dresser: { nx: 0.17, ny: 0.62 },
      toybox: { nx: 0.84, ny: 0.62 }, crib:    { nx: 0.50, ny: 0.82 },
    },
    milestones: [
      { id: 'bath',    label: 'Bath time',    emoji: '🛁', spot: 'bath',    duration: 2.8 },
      { id: 'teeth',   label: 'Brush teeth',  emoji: '🪥', spot: 'sink',    duration: 2.2 },
      { id: 'pajamas', label: 'Pajamas on',   emoji: '🧦', spot: 'dresser', duration: 2.2 },
      { id: 'story',   label: 'Read a story', emoji: '📖', spot: 'chair',   duration: 2.8 },
      { id: 'tuckin',  label: 'Tuck in',      emoji: '😴', spot: 'crib',    duration: 2.4, requires: { item: '🧸', from: 'toybox' } },
    ],
    nuisances: [
      { type: 'jump',   label: 'Bed jumping!',   emoji: '🛏️', duration: 1.6, expire: 9,  chaos: 15, score: 120, calm: true },
      { type: 'thirsty',label: "I'm thirsty!",   emoji: '💧', duration: 1.4, expire: 10, chaos: 12, score: 95 },
      { type: 'monster',label: 'Monster check!', emoji: '👻', duration: 1.5, expire: 9,  chaos: 14, score: 110 },
      { type: 'oneshow',label: 'One more show!', emoji: '📺', duration: 1.4, expire: 11, chaos: 12, score: 100 },
    ],
    duration: 165, clockStart: 19 * 60, clockEnd: 20 * 60 + 30,
    firstNuisance: 7, nuisanceMin: 3.0, nuisanceMax: 7.0, maxNuisances: 5,
    ambientPerNuisance: 1.35, ambientPerMilestone: 0.5, chaosOnComplete: -6, comboWindow: 4.0,
    menace: true,
    tips: [
      { at: 0.6, text: '🧸 Grab a teddy from the toy box before you can tuck Elliot in.' },
    ],
  },
};

// Stage order — also the unlock order.
const CAMPAIGN = ['m1', 'm2', 'm3', 'bedtime'];

// Owen's mischief if he's left idle too long (only on stages with menace=true).
const OWEN_MISCHIEF = [
  { type: 'mischief', label: 'Owen drew on the wall', emoji: '🖍️', duration: 1.4, expire: 11, chaos: 11, score: 110 },
  { type: 'mischief', label: 'Owen unrolled the TP',  emoji: '🧻', duration: 1.4, expire: 11, chaos: 11, score: 110 },
  { type: 'mischief', label: 'Owen hid the remote',   emoji: '📺', duration: 1.4, expire: 11, chaos: 10, score: 110 },
];

let Level = LEVELS[CAMPAIGN[0]];
