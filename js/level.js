// All tunable game data for the v1 level, "The Morning Routine".
const Level = {
  // Playable family. Order = portrait bar order.
  chars: [
    { id: 'andrew', name: 'Andrew', speedFrac: 0.26, displayFrac: 0.205,
      abilities: { lift: true }, calmMult: 1.35,
      lines: ["Where are my KEYS", "I've got this. I think.", "Coffee. Need coffee."] },
    { id: 'kalong', name: 'Kalong', speedFrac: 0.30, displayFrac: 0.195,
      abilities: { supermom: true }, calmMult: 0.5,
      lines: ["On it.", "Mom mode: ACTIVATED", "Breathe. We're fine."] },
    { id: 'owen',   name: 'Owen',   speedFrac: 0.29, displayFrac: 0.150,
      abilities: { crawl: true }, calmMult: 1.0,
      lines: ["I found it!", "I'm helping!", "Look at me go!"] },
    { id: 'elliot', name: 'Elliot', speedFrac: 0.20, displayFrac: 0.125,
      abilities: { crawl: true }, calmMult: 1.0,
      lines: ["goo goo", "ba ba ba!", "*giggles*"] },
  ],

  // Named anchor points in the room, normalized to the play rectangle.
  spots: {
    stove:    { nx: 0.20, ny: 0.30 },
    fridge:   { nx: 0.82, ny: 0.30 },
    highchair:{ nx: 0.50, ny: 0.48 },
    changing: { nx: 0.83, ny: 0.60 },
    closet:   { nx: 0.17, ny: 0.60 },
    couch:    { nx: 0.70, ny: 0.80 },
    door:     { nx: 0.30, ny: 0.86 },
  },

  // The 5 goals that must all be done to win. Shown as the checklist.
  milestones: [
    { id: 'cook',   label: 'Cook breakfast', emoji: '🍳', spot: 'stove',     duration: 2.6 },
    { id: 'feed',   label: 'Feed Elliot',    emoji: '🍼', spot: 'highchair', duration: 2.2, requires: { item: '🍼', from: 'fridge' } },
    { id: 'diaper', label: 'Change diaper',  emoji: '🧷', spot: 'changing',  duration: 2.6 },
    { id: 'dress',  label: 'Dress Owen',     emoji: '👕', spot: 'closet',    duration: 2.2 },
    { id: 'keys',   label: 'Find the keys',  emoji: '🔑', spot: 'couch',     duration: 2.0, crawlOnly: true, deliverTo: 'door' },
  ],

  // Random chaos that erupts during the morning.
  nuisances: [
    { type: 'tantrum', label: 'Owen tantrum', emoji: '😡', duration: 1.6, expire: 9,  chaos: 16, score: 120, calm: true },
    { type: 'spill',   label: 'Cereal spill', emoji: '🥣', duration: 1.4, expire: 11, chaos: 11, score: 90 },
    { type: 'cry',     label: 'Baby crying',  emoji: '😭', duration: 1.4, expire: 10, chaos: 13, score: 100 },
    { type: 'toys',    label: 'Toy mess',     emoji: '🧸', duration: 1.3, expire: 13, chaos: 9,  score: 80 },
  ],

  // Pacing / difficulty.
  duration: 150,            // seconds of real time = 7:00 -> 8:00
  clockStart: 7 * 60,       // minutes
  clockEnd: 8 * 60,
  firstNuisance: 6,
  nuisanceMin: 3.2,         // fastest spawn gap (late game)
  nuisanceMax: 7.5,         // slowest spawn gap (early game)
  maxNuisances: 4,
  ambientPerNuisance: 1.25, // chaos/sec added by each pending nuisance
  ambientPerMilestone: 0.45,// chaos/sec added by each undone goal
  chaosOnComplete: -6,      // chaos relief for finishing any task
  comboWindow: 4.0,         // seconds to keep a combo alive
};
