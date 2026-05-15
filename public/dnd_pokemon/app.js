// ── Constants ───────────────────────────────────────────────────────────────

const TYPE_COLORS = {
	normal: '#A8A878', fire: '#F08030', water: '#6890F0', electric: '#F8D030',
	grass: '#78C850', ice: '#98D8D8', fighting: '#C03028', poison: '#A040A0',
	ground: '#E0C068', flying: '#A890F0', psychic: '#F85888', bug: '#A8B820',
	rock: '#B8A038', ghost: '#705898', dragon: '#7038F8', dark: '#705848',
	steel: '#B8B8D0', fairy: '#EE99AC',
};

const TYPE_CHART = {
	normal:   { rock: 0.5, ghost: 0, steel: 0.5 },
	fire:     { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
	water:    { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
	electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
	grass:    { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
	ice:      { water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
	fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
	poison:   { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
	ground:   { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
	flying:   { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
	psychic:  { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
	bug:      { fire: 0.5, grass: 2, fighting: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
	rock:     { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
	ghost:    { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
	dragon:   { dragon: 2, steel: 0.5, fairy: 0 },
	dark:     { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
	steel:    { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
	fairy:    { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

const STAT_COLORS = {
	hp: '#FF5959', attack: '#F5AC78', defense: '#FAE078',
	'special-attack': '#9DB7F5', 'special-defense': '#A7DB8D', speed: '#FA92B2',
};

const VALID_GAMES = [
	'red-blue', 'yellow', 'gold-silver', 'crystal',
	'ruby-sapphire', 'emerald', 'firered-leafgreen', 'colosseum', 'xd',
];

// Each trainer has a team of up to 5 pokemon
const PARTY_CONFIG = [
	{ player: 'Aban Donson', team: [{ pokemon: 'dratini',  level: 1 }] },
	{ player: 'Aavaa',       team: [{ pokemon: 'eevee',    level: 1 }] },
	{ player: 'Oar Phan',    team: [{ pokemon: 'houndour', level: 5 }] },
	{ player: 'Koen',        team: [{ pokemon: 'pikachu',  level: 1 }] },
	{ player: 'Nick',        team: [{ pokemon: 'pikachu',  level: 1 }] },
];

// Default enemies for testing
const ENEMY_CONFIG = [
	{ pokemon: 'rattata',   level: 3 },
	{ pokemon: 'pidgey',    level: 3 },
	{ pokemon: 'caterpie',  level: 2 },
	{ pokemon: 'geodude',   level: 5 },
	{ pokemon: 'growlithe', level: 4 },
];

// ...existing code continues (truncated for brevity, full code copied)...