// Starting data for the Parahumans crew tracker.
// Only used the first time; after that everything lives in Firebase.
// Player-facing only: no GM secrets in here.

const PRT_CLASSES = [
  ['Mover',    'Gets around: flight, speed, teleporting.'],
  ['Shaker',   'Changes an area: fields, walls, darkness.'],
  ['Brute',    'Tough and strong. Hard to hurt.'],
  ['Breaker',  'Changes into a state where normal rules stop applying.'],
  ['Master',   'Controls or makes minions.'],
  ['Tinker',   'Builds tech far beyond normal science.'],
  ['Blaster',  'Ranged attacks.'],
  ['Thinker',  'Knows things: senses, insight, prediction.'],
  ['Striker',  'Dangerous by touch.'],
  ['Changer',  'Changes their own body.'],
  ['Trump',    'Messes with other powers.'],
  ['Stranger', 'Hides, sneaks, fools the mind.'],
];

const THREATS = [
  ['low',    'Low',    'You could handle this.'],
  ['medium', 'Careful', 'Plan first. Bring friends.'],
  ['high',   'Avoid',  'Do not fight head on.'],
  ['run',    'Run',    'Leave. Now.'],
  ['unknown','Unknown','Not enough info.'],
];

const AFFILIATIONS = [
  'Protectorate', 'Wards', 'New Wave', 'ABB', 'Empire Eighty-Eight',
  'Merchants', 'Independent villain', 'Independent hero', 'Unknown',
];

const SEED = {
  crew: {
    name: '',
    reputation: 1,
    heat: 1,
    members: [
      { id: 'm1', player: 'Nick',    name: 'Ace',                         build: 'Human Fighter',    role: 'Weapons dealer, sniper',        notes: '' },
      { id: 'm2', player: 'Koen',    name: 'Daniel Vance',                build: '',                 role: 'Middleman. Runs The Anchorage', notes: '' },
      { id: 'm3', player: 'Hylke',   name: 'Arthur Bartlett "Blackout"',  build: 'Halfling Sorcerer', role: 'Fixer: info and coercion',      notes: '' },
      { id: 'm4', player: 'Maartje', name: 'Veyra Kestrel',               build: 'Goliath Monk',     role: 'Meridian Compact operative',    notes: '' },
      { id: 'm5', player: 'Sven',    name: 'Yeo',                         build: 'Human Ranger',     role: 'Acrobatic gunman',              notes: '' },
    ],
  },

  capes: [
    {
      id: 'c-lung', name: 'Lung', affiliation: 'ABB', threat: 'run', met: false, hidden: false,
      classes: ['Brute', 'Blaster', 'Changer'],
      look: 'Small, scarred kobold in a metal dragon mask. Grows huge in a fight.',
      power: 'The longer a fight lasts, the bigger and stronger he gets. Scales, claws, fire, then wings. Heals fast.',
      notes: 'Leader of the ABB, a kobold street gang. To his kobolds he is a god.\nDo not fight him. Heroes and villains both fear him.',
    },
    {
      id: 'c-armsmaster', name: 'Armsmaster', affiliation: 'Protectorate', threat: 'high', met: false, hidden: false,
      classes: ['Tinker'],
      look: 'Blue and silver power armor. High-tech halberd. Motorcycle.',
      power: 'Tinker. His halberd does a bit of everything. Known for very compact gear.',
      notes: 'Leader of the local Protectorate team. All business.',
    },
    {
      id: 'c-oni-lee', name: 'Oni Lee', affiliation: 'ABB', threat: 'run', met: false, hidden: false,
      classes: ['Mover', 'Master'],
      look: 'Kobold in a red demon mask. Knives and grenades.',
      power: 'Teleports short distances. Leaves copies of himself behind that can fight and explode.',
      notes: "Lung's right hand and most loyal follower.\nAn assassin. Deadly to anyone caught alone. Never split up near him.",
    },
    {
      id: 'c-bakuda', name: 'Bakuda', affiliation: 'ABB', threat: 'high', met: false, hidden: false,
      classes: ['Tinker'],
      look: 'Kobold with a gas mask. Bombs everywhere.',
      power: 'Bomb tinker. Every bomb is different: fire, ice, glue, time-stop, worse.',
      notes: "Newest ABB cape. Unstable. Don't stand near her, and don't stand near anything she touched.",
    },
  ],

  base: {
    name: '',
    location: 'The Docks',
    status: 'Looking',
    notes: '',
    upgrades: [
      { id: 'u1', name: 'Defenses',    done: false, notes: 'Walls, traps, a real door, sightlines.' },
      { id: 'u2', name: 'Workshop',    done: false, notes: 'Repair and build gear.' },
      { id: 'u3', name: 'Holding cells', done: false, notes: '' },
      { id: 'u4', name: 'A front',     done: false, notes: 'A legit cover business.' },
    ],
    staff: [],
  },

  ledger: [],

  jobs: [
    { id: 'j1', title: 'Find a base', giver: '', reward: '', status: 'active', notes: 'Somewhere nobody uses, with no landlord asking questions.' },
  ],

  contacts: [
    { id: 'n1', name: 'Denny', role: 'Fixer (heard of)', where: 'Ask around the Docks', attitude: 'Unknown', notes: 'Same name keeps coming up: want a place nobody is using? Talk to Denny.' },
  ],

  log: [],
};
