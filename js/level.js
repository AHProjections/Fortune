// ─────────────── Shared roster + all level definitions ───────────────
// `Level` is the *current* level (mutable). `LEVELS` holds every level.
// game.js reads `Level.*` at call-time, so reassigning Level switches stages.

const ROSTER = [
  { id: 'andrew', name: 'Andrew', speedFrac: 0.26, displayFrac: 0.205,
    abilities: { lift: true }, calmMult: 1.35, workMult: 1.0,
    lines: ["Where are my KEYS", "I've got this. I think.", "Coffee. Need coffee.", "Define 'fine'."] },
  { id: 'kalong', name: 'Kalong', speedFrac: 0.30, displayFrac: 0.195,
    abilities: { supermom: true }, calmMult: 0.5, workMult: 0.78,
    lines: ["On it.", "Mom mode: ACTIVATED", "Breathe. We're fine.", "I have eyes everywhere."] },
  { id: 'owen',   name: 'Owen',   speedFrac: 0.29, displayFrac: 0.150,
    abilities: { crawl: true }, calmMult: 1.0, workMult: 1.0,
    lines: ["I found it!", "I'm helping!", "Look at me go!", "Can I have a snack?"] },
  { id: 'elliot', name: 'Elliot', speedFrac: 0.20, displayFrac: 0.125,
    abilities: { crawl: true }, calmMult: 1.0, workMult: 1.0,
    lines: ["goo goo", "ba ba ba!", "*giggles*", "*blows raspberry*"] },
];

const LEVELS = {
  // ───────────────────────── Level 1 — Morning Routine ─────────────────────
  morning: {
    id: 'morning',
    name: 'The Morning Routine',
    blurb: 'Get everyone fed, dressed and out the door before 8:00.',
    chars: ROSTER,
    theme: { wallTop: '#b9a7e6', wallBot: '#d9c9f5', floorTop: '#e7b277', floorBot: '#c98c4f', sky: '#bfe9ff', sun: true },
    spots: {
      stove:    { nx: 0.20, ny: 0.30 }, fridge:   { nx: 0.82, ny: 0.30 },
      highchair:{ nx: 0.50, ny: 0.48 }, changing: { nx: 0.83, ny: 0.60 },
      closet:   { nx: 0.17, ny: 0.60 }, couch:    { nx: 0.70, ny: 0.80 },
      door:     { nx: 0.30, ny: 0.86 },
    },
    milestones: [
      { id: 'cook',   label: 'Cook breakfast', emoji: '🍳', spot: 'stove',     duration: 2.6 },
      { id: 'feed',   label: 'Feed Elliot',    emoji: '🍼', spot: 'highchair', duration: 2.2, requires: { item: '🍼', from: 'fridge' } },
      { id: 'diaper', label: 'Change diaper',  emoji: '🧷', spot: 'changing',  duration: 2.6 },
      { id: 'dress',  label: 'Dress Owen',     emoji: '👕', spot: 'closet',    duration: 2.2 },
      { id: 'keys',   label: 'Find the keys',  emoji: '🔑', spot: 'couch',     duration: 2.0, crawlOnly: true, deliverTo: 'door' },
    ],
    nuisances: [
      { type: 'tantrum', label: 'Owen tantrum', emoji: '😡', duration: 1.6, expire: 9,  chaos: 16, score: 120, calm: true },
      { type: 'spill',   label: 'Cereal spill', emoji: '🥣', duration: 1.4, expire: 11, chaos: 11, score: 90 },
      { type: 'cry',     label: 'Baby crying',  emoji: '😭', duration: 1.4, expire: 10, chaos: 13, score: 100 },
      { type: 'toys',    label: 'Toy mess',     emoji: '🧸', duration: 1.3, expire: 13, chaos: 9,  score: 80 },
    ],
    duration: 150, clockStart: 7 * 60, clockEnd: 8 * 60,
    firstNuisance: 6, nuisanceMin: 3.2, nuisanceMax: 7.5, maxNuisances: 4,
    ambientPerNuisance: 1.25, ambientPerMilestone: 0.45, chaosOnComplete: -6, comboWindow: 4.0,
  },

  // ───────────────────────── Level 2 — Bedtime Battle ──────────────────────
  bedtime: {
    id: 'bedtime',
    name: 'Bedtime Battle',
    blurb: 'Wind everyone down and into bed by 8:30. They will resist.',
    chars: ROSTER,
    theme: { wallTop: '#2b2350', wallBot: '#4a3e7a', floorTop: '#6b5a8f', floorBot: '#43386b', sky: '#1a2a55', sun: false },
    spots: {
      bath:   { nx: 0.20, ny: 0.30 }, sink:    { nx: 0.82, ny: 0.30 },
      chair:  { nx: 0.50, ny: 0.46 }, dresser: { nx: 0.17, ny: 0.62 },
      toybox: { nx: 0.84, ny: 0.62 }, crib:    { nx: 0.50, ny: 0.82 },
    },
    milestones: [
      { id: 'bath',    label: 'Bath time',     emoji: '🛁', spot: 'bath',    duration: 2.8 },
      { id: 'teeth',   label: 'Brush teeth',   emoji: '🪥', spot: 'sink',    duration: 2.2 },
      { id: 'pajamas', label: 'Pajamas on',    emoji: '🧦', spot: 'dresser', duration: 2.2 },
      { id: 'story',   label: 'Read a story',  emoji: '📖', spot: 'chair',   duration: 2.8 },
      { id: 'tuckin',  label: 'Tuck in',       emoji: '😴', spot: 'crib',    duration: 2.4, requires: { item: '🧸', from: 'toybox' } },
    ],
    nuisances: [
      { type: 'jump',   label: 'Bed jumping!',   emoji: '🛏️', duration: 1.6, expire: 9,  chaos: 15, score: 120, calm: true },
      { type: 'thirsty',label: "I'm thirsty!",   emoji: '💧', duration: 1.4, expire: 10, chaos: 12, score: 95 },
      { type: 'monster',label: 'Monster check!', emoji: '👻', duration: 1.5, expire: 9,  chaos: 14, score: 110 },
      { type: 'oneshow',label: 'One more show!', emoji: '📺', duration: 1.4, expire: 11, chaos: 12, score: 100 },
    ],
    duration: 165, clockStart: 19 * 60, clockEnd: 20 * 60 + 30,
    firstNuisance: 5, nuisanceMin: 2.8, nuisanceMax: 6.8, maxNuisances: 5,
    ambientPerNuisance: 1.4, ambientPerMilestone: 0.5, chaosOnComplete: -6, comboWindow: 4.0,
  },
};

// Owen's mischief if he's left idle too long (the "menace" mechanic).
const OWEN_MISCHIEF = [
  { type: 'mischief', label: 'Owen drew on the wall', emoji: '🖍️', duration: 1.4, expire: 10, chaos: 12, score: 110 },
  { type: 'mischief', label: 'Owen unrolled the TP',  emoji: '🧻', duration: 1.4, expire: 10, chaos: 12, score: 110 },
  { type: 'mischief', label: 'Owen hid the remote',   emoji: '📺', duration: 1.4, expire: 10, chaos: 11, score: 110 },
];

let Level = LEVELS.morning;
