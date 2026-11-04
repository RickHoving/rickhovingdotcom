// Starting data for the Parahumans crew tracker.
// Only used the first time; after that everything lives in Firebase.
// Player-facing only: no GM secrets in here.

// [name, short line, what it means]
const PRT_CLASSES = [
  ['Mover',    'Gets around: flight, speed, teleporting.',
   'They move in ways you can\'t. Flying, running very fast, teleporting, walking through walls.'],
  ['Shaker',   'Changes an area: fields, walls, darkness.',
   'Their power hits a whole area, not one person. Force fields, darkness, explosions, warped ground.'],
  ['Brute',    'Tough and strong. Hard to hurt.',
   'Super strong, super tough, or both. Normal weapons barely slow them down.'],
  ['Breaker',  'Changes into a state where normal rules stop applying.',
   'They turn into something else: energy, shadow, a living storm. Normal attacks may not work.'],
  ['Master',   'Controls or makes minions.',
   'Their power works through others: summons, copies, trained beasts, mind control.'],
  ['Tinker',   'Builds tech far beyond normal science.',
   'Builds gear nobody else can copy. The rating says how dangerous their gear is, and how much they have.'],
  ['Blaster',  'Ranged attacks.',
   'Shoots something: fire, lasers, force, lightning.'],
  ['Thinker',  'Knows things: senses, insight, prediction.',
   'Knows more than they should. Reads people, sees the future, senses things far away.'],
  ['Striker',  'Dangerous by touch.',
   'Their touch does the damage: burns, shatters, drains, changes you.'],
  ['Changer',  'Changes their own body.',
   'Changes shape: grows, gets claws or armor, becomes an animal.'],
  ['Trump',    'Messes with other powers.',
   'Affects powers themselves. Takes them away, copies them, boosts them.'],
  ['Stranger', 'Hides, sneaks, fools the mind.',
   'Hard to see, hear or remember. Invisible, disguised, or messing with your perception.'],
];

// PRT threat rating: the number after the class.
const RATING_SCALE = [
  [1, 2,  'Minor. Normal police could handle it.'],
  [3, 4,  'Serious. Needs a plan, or another cape.'],
  [5, 6,  'Dangerous. Takes a team of capes to stop.'],
  [7, 8,  'Major threat. Clear the area. Only the strongest capes step in.'],
  [9, 99, 'City-level threat. Everyone runs.'],
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
      classes: [{ name: 'Brute', rating: '4+' }, { name: 'Blaster', rating: '3+' }, { name: 'Changer', rating: '3+' }],
      look: 'Small, scarred kobold in a metal dragon mask. Grows huge in a fight.',
      power: 'The longer a fight lasts, the bigger and stronger he gets. Scales, claws, fire, then wings. Heals fast.',
      notes: 'Leader of the ABB, a kobold street gang. To his kobolds he is a god.\nDo not fight him. Heroes and villains both fear him.',
    },
    {
      id: 'c-armsmaster', name: 'Armsmaster', affiliation: 'Protectorate', threat: 'high', met: false, hidden: false,
      classes: [{ name: 'Tinker', rating: '6' }],
      look: 'Blue and silver power armor. High-tech halberd. Motorcycle.',
      power: 'Tinker. His halberd does a bit of everything. Known for very compact gear.',
      notes: 'Leader of the local Protectorate team. All business.',
    },
    {
      id: 'c-oni-lee', name: 'Oni Lee', affiliation: 'ABB', threat: 'run', met: false, hidden: false,
      classes: [{ name: 'Mover', rating: '4' }, { name: 'Master', rating: '4' }],
      look: 'Kobold in a red demon mask. Knives and grenades.',
      power: 'Teleports short distances. Leaves copies of himself behind that can fight and explode.',
      notes: "Lung's right hand and most loyal follower.\nAn assassin. Deadly to anyone caught alone. Never split up near him.",
    },
    {
      id: 'c-bakuda', name: 'Bakuda', affiliation: 'ABB', threat: 'high', met: false, hidden: false,
      classes: [{ name: 'Tinker', rating: '6' }],
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
