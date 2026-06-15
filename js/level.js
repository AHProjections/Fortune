// ─────────────── Shared roster + the difficulty-ramped campaign ───────────────
// `Level` is the current stage (mutable); `LEVELS` holds every stage and
// `CAMPAIGN` is their order. Each stage adds ONE new idea and ramps a little
// faster. Per stage:
//   playable : ids the player can control (switch between)
//   npcs     : ids that appear but wander on their own (not controllable)
//   baby     : true if Elliot (carry-only) is present
//   carrier  : true if a baby-carrier can be found this stage

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
  { id: 'elliot', name: 'Elliot', speedFrac: 0.0, displayFrac: 0.125,
    abilities: { crawl: true }, calmMult: 1.0, workMult: 1.0,
    lines: ["goo goo", "ba ba ba!", "*giggles*", "*blows raspberry*"] },
];

const DAY = { wallTop: '#b9a7e6', wallBot: '#d9c9f5', floorTop: '#e7b277', floorBot: '#c98c4f', sky: '#bfe9ff', sun: true };
const NIGHT = { wallTop: '#2b2350', wallBot: '#4a3e7a', floorTop: '#6b5a8f', floorBot: '#43386b', sky: '#1a2a55', sun: false };

const MORNING_SPOTS = {
  stove:    { nx: 0.20, ny: 0.30 }, fridge:   { nx: 0.82, ny: 0.30 },
  highchair:{ nx: 0.50, ny: 0.46 }, changing: { nx: 0.83, ny: 0.62 },
  closet:   { nx: 0.17, ny: 0.62 }, couch:    { nx: 0.70, ny: 0.82 },
  door:     { nx: 0.30, ny: 0.86 }, playmat:  { nx: 0.46, ny: 0.78 },
};

const LEVELS = {
  // ── Stage 1 — Slow Start: one parent, the basics ──
  m1: {
    id: 'm1', name: 'Slow Start', icon: '🍳',
    blurb: 'Just Dad. Learn to move and do jobs.',
    playable: ['andrew'], npcs: ['owen'], baby: false, carrier: false,
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
      { at: 8.0,  text: 'Owen is running around on his own — you can\'t control him yet.' },
      { at: 15.0, text: 'Finish every job before the clock reaches 8:00!' },
    ],
  },

  // ── Stage 2 — Teamwork: a second parent + switching ──
  m2: {
    id: 'm2', name: 'Teamwork', icon: '🤝',
    blurb: 'Mom joins. Switch between two parents.',
    playable: ['andrew', 'kalong'], npcs: ['owen'], baby: false, carrier: false,
    theme: DAY, spots: MORNING_SPOTS,
    milestones: [
      { id: 'cook',  label: 'Cook breakfast', emoji: '🍳', spot: 'stove',  duration: 2.4 },
      { id: 'dress', label: 'Dress Owen',     emoji: '👕', spot: 'closet', duration: 2.2, onChild: 'owen', requires: { item: '👕', from: 'closet' } },
      { id: 'tidy',  label: 'Tidy the toys',  emoji: '🧹', spot: 'couch',  duration: 2.4 },
    ],
    nuisances: [
      { type: 'toys',    label: 'Toy mess',     emoji: '🧸', duration: 1.3, expire: 14, chaos: 9,  score: 80 },
      { type: 'tantrum', label: 'Owen tantrum', emoji: '😡', duration: 1.6, expire: 12, chaos: 12, score: 110, calm: true },
    ],
    duration: 120, clockStart: 7 * 60, clockEnd: 8 * 60,
    firstNuisance: 14, nuisanceMin: 6, nuisanceMax: 10, maxNuisances: 2,
    ambientPerNuisance: 0.95, ambientPerMilestone: 0.28, chaosOnComplete: -7, comboWindow: 4.5,
    menace: false,
    tips: [
      { at: 0.6, text: '👇 Tap a parent\'s face at the bottom to switch who you control. Split the work!' },
      { at: 7.0, text: '👕 To dress Owen: grab clothes from the closet, then chase him down to put them on!' },
      { at: 14.0, text: 'Tip: a parent keeps doing a job even after you switch away. Assign and move on!' },
    ],
  },

  // ── Stage 3 — Hands Full: Elliot arrives. He can't walk — carry him! ──
  m3: {
    id: 'm3', name: 'Hands Full', icon: '👶',
    blurb: 'Baby Elliot can\'t walk — carry him to where he needs to be.',
    playable: ['andrew', 'kalong'], npcs: ['owen'], baby: true, carrier: false,
    babyStart: 'playmat',
    theme: DAY, spots: MORNING_SPOTS,
    milestones: [
      { id: 'cook',   label: 'Cook breakfast', emoji: '🍳', spot: 'stove',    duration: 2.4 },
      { id: 'dress',  label: 'Dress Owen',     emoji: '👕', spot: 'closet',   duration: 2.2, onChild: 'owen', requires: { item: '👕', from: 'closet' } },
      { id: 'diaper', label: 'Change diaper',  emoji: '🧷', spot: 'changing', duration: 2.4, needsChild: 'baby' },
    ],
    nuisances: [
      { type: 'toys', label: 'Toy mess',    emoji: '🧸', duration: 1.3, expire: 15, chaos: 8,  score: 80 },
      { type: 'cry',  label: 'Baby crying', emoji: '😭', duration: 1.4, expire: 13, chaos: 10, score: 100, on: 'baby' },
    ],
    duration: 135, clockStart: 7 * 60, clockEnd: 8 * 60,
    firstNuisance: 14, nuisanceMin: 5.5, nuisanceMax: 9.5, maxNuisances: 2,
    ambientPerNuisance: 1.0, ambientPerMilestone: 0.27, chaosOnComplete: -7, comboWindow: 4.5,
    menace: false,
    tips: [
      { at: 0.6,  text: '👶 Tap Elliot to pick him up — he can\'t walk on his own.' },
      { at: 7.0,  text: 'Carry him to the changing table to change his diaper. Your hands are full while holding him!' },
    ],
  },

  // ── Stage 4 — The Full Routine: feeding (baby + bottle), keys, full chaos ──
  m4: {
    id: 'm4', name: 'The Full Routine', icon: '🔑',
    blurb: 'The whole family. Some jobs need the baby AND a supply.',
    playable: ['andrew', 'kalong', 'owen'], npcs: [], baby: true, carrier: false,
    babyStart: 'playmat',
    theme: DAY, spots: MORNING_SPOTS,
    milestones: [
      { id: 'cook',   label: 'Cook breakfast', emoji: '🍳', spot: 'stove',     duration: 2.6 },
      { id: 'diaper', label: 'Change diaper',  emoji: '🧷', spot: 'changing',  duration: 2.4, needsChild: 'baby' },
      { id: 'feed',   label: 'Feed Elliot',    emoji: '🍼', spot: 'highchair', duration: 2.2, needsChild: 'baby', requires: { item: '🍼', from: 'fridge' } },
      { id: 'dress',  label: 'Dress Owen',     emoji: '👕', spot: 'closet',    duration: 2.2, onChild: 'owen', requires: { item: '👕', from: 'closet' } },
      { id: 'keys',   label: 'Find the keys',  emoji: '🔑', spot: 'couch',     duration: 2.0, crawlOnly: true, deliverTo: 'door' },
    ],
    nuisances: [
      { type: 'tantrum', label: 'Owen tantrum', emoji: '😡', duration: 1.6, expire: 10, chaos: 14, score: 120, calm: true, on: 'owen' },
      { type: 'spill',   label: 'Cereal spill', emoji: '🥣', duration: 1.4, expire: 12, chaos: 10, score: 90 },
      { type: 'cry',     label: 'Baby crying',  emoji: '😭', duration: 1.4, expire: 11, chaos: 12, score: 100, on: 'baby' },
      { type: 'toys',    label: 'Toy mess',     emoji: '🧸', duration: 1.3, expire: 14, chaos: 8,  score: 80 },
    ],
    duration: 165, clockStart: 7 * 60, clockEnd: 8 * 60,
    firstNuisance: 10, nuisanceMin: 4.0, nuisanceMax: 8.0, maxNuisances: 4,
    ambientPerNuisance: 1.1, ambientPerMilestone: 0.34, chaosOnComplete: -6, comboWindow: 4.5,
    menace: true,
    tips: [
      { at: 0.6, text: '🍼 To feed Elliot: seat him in the highchair first, THEN fetch the bottle from the fridge.' },
      { at: 9.0, text: '🔑 The keys are under the couch — only Owen can crawl under!' },
    ],
  },

  // ── Stage 5 — Bedtime Battle: hardest, plus the baby-carrier to find ──
  bedtime: {
    id: 'bedtime', name: 'Bedtime Battle', icon: '🌙',
    blurb: 'Everyone in bed by 8:30. Find the carrier to free your hands!',
    playable: ['andrew', 'kalong', 'owen'], npcs: [], baby: true, carrier: true,
    babyStart: 'playmat',
    theme: NIGHT,
    spots: {
      bath:   { nx: 0.20, ny: 0.30 }, sink:    { nx: 0.80, ny: 0.30 },
      chair:  { nx: 0.50, ny: 0.44 }, dresser: { nx: 0.17, ny: 0.62 },
      toybox: { nx: 0.84, ny: 0.62 }, crib:    { nx: 0.50, ny: 0.82 },
      carrier:{ nx: 0.50, ny: 0.30 }, playmat: { nx: 0.30, ny: 0.70 },
    },
    milestones: [
      { id: 'bath',    label: 'Bath time',    emoji: '🛁', spot: 'bath',    duration: 2.8 },
      { id: 'teeth',   label: 'Brush teeth',  emoji: '🪥', spot: 'sink',    duration: 2.2 },
      { id: 'pajamas', label: 'Pajamas on',   emoji: '🧦', spot: 'dresser', duration: 2.2, onChild: 'owen', requires: { item: '🧦', from: 'dresser' } },
      { id: 'story',   label: 'Read a story', emoji: '📖', spot: 'chair',   duration: 2.8 },
      { id: 'tuckin',  label: 'Tuck in',      emoji: '😴', spot: 'crib',    duration: 2.4, needsChild: 'baby', requires: { item: '🧸', from: 'toybox' } },
    ],
    nuisances: [
      { type: 'jump',   label: 'Bed jumping!',   emoji: '🛏️', duration: 1.6, expire: 9,  chaos: 15, score: 120, calm: true, on: 'owen' },
      { type: 'thirsty',label: "I'm thirsty!",   emoji: '💧', duration: 1.4, expire: 10, chaos: 12, score: 95,  on: 'owen' },
      { type: 'monster',label: 'Monster check!', emoji: '👻', duration: 1.5, expire: 9,  chaos: 14, score: 110, on: 'baby' },
      { type: 'oneshow',label: 'One more show!', emoji: '📺', duration: 1.4, expire: 11, chaos: 12, score: 100, on: 'owen' },
    ],
    duration: 175, clockStart: 19 * 60, clockEnd: 20 * 60 + 30,
    firstNuisance: 6, nuisanceMin: 2.8, nuisanceMax: 6.2, maxNuisances: 5,
    ambientPerNuisance: 1.5, ambientPerMilestone: 0.52, chaosOnComplete: -6, comboWindow: 4.0,
    menace: true, owenRefuses: true,
    tips: [
      { at: 0.6, text: '🎒 Grab the baby carrier (top of the room) so you can hold Elliot AND a teddy at once!' },
      { at: 9.0, text: '🧸 Tuck-in needs Elliot in the crib with a teddy from the toy box.' },
    ],
  },
};

// Stage order — also the unlock order.
const CAMPAIGN = ['m1', 'm2', 'm3', 'm4', 'bedtime'];

// Owen's mischief if he's left idle too long (only on stages with menace=true).
const OWEN_MISCHIEF = [
  { type: 'mischief', label: 'Owen drew on the wall', emoji: '🖍️', duration: 1.4, expire: 11, chaos: 11, score: 110 },
  { type: 'mischief', label: 'Owen unrolled the TP',  emoji: '🧻', duration: 1.4, expire: 11, chaos: 11, score: 110 },
  { type: 'mischief', label: 'Owen hid the remote',   emoji: '📺', duration: 1.4, expire: 11, chaos: 10, score: 110 },
];

let Level = LEVELS[CAMPAIGN[0]];
