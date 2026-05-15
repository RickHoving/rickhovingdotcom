// ── Constants ────────────────────────────────────────────────────────────────

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

// ── D&D Formulas ─────────────────────────────────────────────────────────────

function calcHP(baseHp, level) { return baseHp + level * 2; }

function calcMaxDef(baseDef) {
  return Math.floor(Math.floor(2 * baseDef + 99) * 1.1);
}

function calcAC(baseDef, level) {
  return Math.round((calcMaxDef(baseDef) + (level - 1)) / 20);
}

function accuracyDivisor(level) {
  if (level <= 25) return 10;
  if (level <= 50) return 9;
  if (level <= 75) return 8;
  return 7;
}

function calcHitBonus(accuracy, level) {
  if (accuracy === null) return `always hits (+${Math.round(110 / accuracyDivisor(level))})`;
  return `+${Math.round(accuracy / accuracyDivisor(level))}`;
}

function calcEffectiveness(moveType, defenderTypes) {
  const chart = TYPE_CHART[moveType] || {};
  return defenderTypes.reduce((mult, t) => mult * (chart[t] ?? 1), 1);
}

const STANDARD_DICE = [4, 6, 8, 10, 12, 20];

function powerToDieSize(power) {
  const n = power ? Math.floor(power / 10) : 0;
  let die = 4;
  for (const d of STANDARD_DICE) { if (d <= n) die = d; }
  return die;
}

function calcDiceCount(level) { return 1 + Math.round(level / 10); }

function calcDamageDice(power, level, effectiveness) {
  if (effectiveness === 0) return 'immune';
  const die = powerToDieSize(power);
  let count = calcDiceCount(level);
  if      (effectiveness >= 4)    count = count * 4;
  else if (effectiveness >= 2)    count = count * 2;
  else if (effectiveness <= 0.25) count = Math.max(1, Math.round(count / 4));
  else if (effectiveness < 1)     count = Math.max(1, Math.round(count / 2));
  return `${count}d${die}`;
}

function effectivenessLabel(eff) {
  if (eff === 0)   return null;
  if (eff >= 4)    return { text: '4× super effective!', cls: 'eff-super-text' };
  if (eff >= 2)    return { text: 'super effective!',    cls: 'eff-super-text' };
  if (eff <= 0.25) return { text: 'barely effective',    cls: 'eff-weak-text'  };
  if (eff < 1)     return { text: 'not very effective',  cls: 'eff-weak-text'  };
  return null;
}

// ── Shared Utilities ─────────────────────────────────────────────────────────

const moveCache = {};

async function fetchMoves(pokemonData) {
  if (moveCache[pokemonData.name]) return moveCache[pokemonData.name];

  const raw = pokemonData.moves
    .map(m => {
      const details = m.version_group_details.filter(vgd =>
        vgd.move_learn_method.name === 'level-up' &&
        VALID_GAMES.includes(vgd.version_group.name)
      );
      if (!details.length) return null;
      return { name: m.move.name, gameLevel: Math.max(...details.map(d => d.level_learned_at)) };
    })
    .filter(Boolean)
    .sort((a, b) => a.gameLevel - b.gameLevel);

  const details = await Promise.all(
    raw.map(m => fetch(`https://pokeapi.co/api/v2/move/${m.name}`).then(r => r.json()).catch(() => null))
  );

  const moves = raw.map((m, i) => ({
    ...m,
    accuracy: details[i]?.accuracy ?? null,
    power:    details[i]?.power    ?? null,
    type:     details[i]?.type?.name ?? null,
  }));
  moveCache[pokemonData.name] = moves;
  return moves;
}

function statVal(pokemonData, name) {
  return pokemonData.stats.find(s => s.stat.name === name)?.base_stat ?? 0;
}

function spriteUrl(pokemonData) {
  return pokemonData.sprites.other?.['official-artwork']?.front_default
    || pokemonData.sprites.front_default || '';
}

function cap(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

function typeBadges(types, small = false) {
  return types.map(t => {
    const color = TYPE_COLORS[t.type.name] || '#888';
    return `<span class="type-badge${small ? ' type-badge-sm' : ''}" style="background:${color};color:#fff">${t.type.name}</span>`;
  }).join('');
}

function movesTableHTML(moves, level) {
  if (!moves.length) return '<em class="moves-loading">No moves at this level.</em>';
  return `
    <table class="moves-table">
      <thead><tr><th>Lv</th><th>Move</th><th>To Hit</th></tr></thead>
      <tbody>${moves.map(m => `
        <tr>
          <td class="move-lv">${m.gameLevel}</td>
          <td>${m.name.replace(/-/g, ' ')}</td>
          <td>${calcHitBonus(m.accuracy, level)}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;
}

function fightMovesTableHTML(moves, level, opponentAC, fighterId, opponentTypes) {
  if (!moves.length) return '<em class="moves-loading">No moves at this level.</em>';
  const defTypes = (opponentTypes || []).map(t => t.type.name);
  return `
    <table class="moves-table">
      <thead><tr><th>Lv</th><th>Move</th><th>Type</th><th>Dmg</th><th>To Hit</th></tr></thead>
      <tbody>${moves.map(m => {
        const eff = m.type ? calcEffectiveness(m.type, defTypes) : 1;
        const dice = calcDamageDice(m.power, level, eff);
        const effClass = eff === 0 ? 'eff-immune' : eff >= 2 ? 'eff-super' : eff < 1 ? 'eff-weak' : '';
        const typeColor = TYPE_COLORS[m.type] || '#888';
        return `
        <tr class="move-row${effClass ? ` ${effClass}` : ''}"
            data-accuracy="${m.accuracy}"
            data-level="${level}"
            data-opponent-ac="${opponentAC}"
            data-move-name="${m.name.replace(/-/g, ' ')}"
            data-fighter-id="${fighterId}"
            data-move-type="${m.type || ''}"
            data-move-power="${m.power ?? ''}"
            data-opponent-types="${defTypes.join(',')}">
          <td class="move-lv">${m.gameLevel}</td>
          <td>${m.name.replace(/-/g, ' ')}</td>
          <td><span class="type-badge type-badge-sm" style="background:${typeColor};color:#fff">${m.type || '?'}</span></td>
          <td class="move-dmg ${effClass}">${dice}</td>
          <td>${calcHitBonus(m.accuracy, level)}</td>
        </tr>`;
      }).join('')}
      </tbody>
    </table>`;
}

// ── Tab Navigation ───────────────────────────────────────────────────────────

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.tab-pane').forEach(p =>
      p.classList.toggle('active', p.id === `tab-${btn.dataset.tab}`)
    );
    if (btn.dataset.tab === 'party') renderPartyTab();
  });
});

// ── Autocomplete factory ─────────────────────────────────────────────────────

function makeAutocomplete(inputEl, listEl, wrapEl, onPick) {
  let idx = -1;

  function show(query) {
    idx = -1;
    if (!query) { hide(); return; }
    const matches = allNames.filter(n => n.startsWith(query)).slice(0, 8);
    if (!matches.length) { hide(); return; }
    listEl.innerHTML = matches.map(n => `<li data-name="${n}">${n}</li>`).join('');
    listEl.style.display = 'block';
  }

  function hide() { listEl.style.display = 'none'; listEl.innerHTML = ''; idx = -1; }

  inputEl.addEventListener('input', () => show(inputEl.value.trim().toLowerCase()));

  inputEl.addEventListener('keydown', e => {
    const items = listEl.querySelectorAll('li');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      idx = Math.min(idx + 1, items.length - 1);
      items.forEach((el, i) => el.classList.toggle('active', i === idx));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      idx = Math.max(idx - 1, -1);
      items.forEach((el, i) => el.classList.toggle('active', i === idx));
    } else if (e.key === 'Enter') {
      if (idx >= 0 && items[idx]) { inputEl.value = items[idx].dataset.name; hide(); }
      onPick(inputEl.value.trim().toLowerCase());
    } else if (e.key === 'Escape') { hide(); }
  });

  listEl.addEventListener('mousedown', e => {
    const li = e.target.closest('li');
    if (!li) return;
    inputEl.value = li.dataset.name;
    hide();
    onPick(li.dataset.name);
  });

  document.addEventListener('click', e => { if (!wrapEl.contains(e.target)) hide(); });
}

// ── Global State ─────────────────────────────────────────────────────────────

let allNames = [];

// Party: each trainer has a team of up to 5 pokemon
let party = PARTY_CONFIG.map(c => ({
  player: c.player,
  activeIdx: 0,
  team: c.team.map(t => ({ pokemon: t.pokemon, level: t.level, data: null })),
}));
let partyLoaded = false;

// Enemies (pool built in setup, converted to a team trainer at fight start)
let enemies = [];
let nextEnemyId = 0;

// Fight
let partyFighters = [];
let enemyTrainer  = null; // single enemy trainer with a team (built from enemies pool)
let fightRound    = 1;

// Pokédex
let currentPokemon = null;
let currentLevelMoves = [];

// ── Preload Gen 1–3 Names ────────────────────────────────────────────────────

(async () => {
  try {
    const ids = Array.from({ length: 386 }, (_, i) => i + 1);
    const results = await Promise.all(ids.map(id => fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)));
    const datas   = await Promise.all(results.map(r => r.json()));
    allNames = datas.map(p => p.name);
  } catch (_) {}
})();

// ── Pokédex Tab ──────────────────────────────────────────────────────────────

const searchInput    = document.getElementById('input');
const searchBtn      = document.getElementById('btn');
const errorEl        = document.getElementById('error');
const card           = document.getElementById('card');
const acList         = document.getElementById('autocomplete');
const levelBar       = document.getElementById('level-bar');
const levelNum       = document.getElementById('level');
const levelRange     = document.getElementById('level-range');
const movesContainer = document.getElementById('moves-container');

makeAutocomplete(searchInput, acList, document.querySelector('.search-wrap'), () => pokedexSearch());
searchBtn.addEventListener('click', pokedexSearch);

async function pokedexSearch() {
  const name = searchInput.value.trim().toLowerCase();
  if (!name) return;
  errorEl.style.display = 'none';
  card.style.display = 'none';
  movesContainer.style.display = 'none';
  searchBtn.disabled = true;
  searchBtn.textContent = '…';
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
    if (!res.ok) throw new Error('Pokémon not found');
    const data = await res.json();
    currentPokemon = data;
    levelNum.value = 1;
    levelRange.value = 1;
    levelBar.style.display = 'flex';
    renderPokedexCard(data);
    renderPokedexDndStats();
    renderPokedexMoves(data);
  } catch (e) {
    errorEl.textContent = e.message;
    errorEl.style.display = 'block';
  } finally {
    searchBtn.disabled = false;
    searchBtn.textContent = 'Search';
  }
}

function renderPokedexCard(p) {
  document.getElementById('sprite').src = spriteUrl(p);
  document.getElementById('name').textContent = p.name;
  document.getElementById('pokedex-id').textContent = `#${String(p.id).padStart(4, '0')}`;
  document.getElementById('types').innerHTML = typeBadges(p.types);
  document.getElementById('stat-list').innerHTML = p.stats.map(s => {
    const val = s.base_stat;
    const pct = Math.min(100, Math.round(val / 255 * 100));
    const color = STAT_COLORS[s.stat.name] || '#9999ff';
    const label = s.stat.name
      .replace('special-attack', 'Sp. Atk').replace('special-defense', 'Sp. Def')
      .replace(/^\w/, c => c.toUpperCase());
    return `
      <div class="stat-row">
        <span class="stat-name">${label}</span>
        <span class="stat-value">${val}</span>
        <div class="stat-bar-bg"><div class="stat-bar" style="width:${pct}%;background:${color}"></div></div>
      </div>`;
  }).join('');
  document.getElementById('meta').innerHTML = `
    <div><span>Height</span>${(p.height / 10).toFixed(1)} m</div>
    <div><span>Weight</span>${(p.weight / 10).toFixed(1)} kg</div>
    <div><span>Base Exp</span>${p.base_experience ?? '—'}</div>
    <div><span>Abilities</span>${p.abilities.map(a => a.ability.name).join(', ')}</div>
  `;
  card.style.display = 'block';
}

function renderPokedexDndStats() {
  if (!currentPokemon) return;
  const lv = getPokedexLevel();
  document.getElementById('dnd-computed').innerHTML = `
    <div class="dnd-grid">
      <div class="dnd-cell"><span class="dnd-label">HP</span><span class="dnd-value">${calcHP(statVal(currentPokemon, 'hp'), lv)}</span></div>
      <div class="dnd-cell"><span class="dnd-label">AC</span><span class="dnd-value">${calcAC(statVal(currentPokemon, 'defense'), lv)}</span></div>
    </div>`;
}

function getPokedexLevel() {
  const v = parseInt(levelNum.value, 10);
  return isNaN(v) ? 1 : Math.max(1, Math.min(99, v));
}

function onPokedexLevelChange(value) {
  const lv = Math.max(1, Math.min(99, value));
  levelNum.value = lv;
  levelRange.value = lv;
  renderPokedexDndStats();
  refreshPokedexMoves();
}

levelNum.addEventListener('input',   () => onPokedexLevelChange(parseInt(levelNum.value,   10) || 1));
levelRange.addEventListener('input', () => onPokedexLevelChange(parseInt(levelRange.value, 10)));

async function renderPokedexMoves(pokemonData) {
  currentLevelMoves = [];
  movesContainer.style.display = 'none';
  movesContainer.innerHTML = `<h3>Moves</h3><div id="moves-list"><span class="moves-loading">Loading…</span></div>`;
  movesContainer.style.display = 'block';
  currentLevelMoves = await fetchMoves(pokemonData);
  refreshPokedexMoves();
}

function refreshPokedexMoves() {
  const listEl = document.getElementById('moves-list');
  if (!listEl || !currentLevelMoves.length) return;
  const lv = getPokedexLevel();
  listEl.innerHTML = movesTableHTML(currentLevelMoves.filter(m => m.gameLevel <= lv), lv);
}

// ── Party Tab ────────────────────────────────────────────────────────────────

async function initParty() {
  const allTeamSlots = party.flatMap(m => m.team);
  const [allDatas, enemyDatas] = await Promise.all([
    Promise.all(allTeamSlots.map(t =>
      fetch(`https://pokeapi.co/api/v2/pokemon/${t.pokemon}`).then(r => r.json()).catch(() => null)
    )),
    Promise.all(ENEMY_CONFIG.map(e =>
      fetch(`https://pokeapi.co/api/v2/pokemon/${e.pokemon}`).then(r => r.json()).catch(() => null)
    )),
  ]);

  allTeamSlots.forEach((t, i) => { t.data = allDatas[i]; });
  ENEMY_CONFIG.forEach((cfg, i) => {
    if (enemyDatas[i]) enemies.push({ id: nextEnemyId++, data: enemyDatas[i], level: cfg.level });
  });

  partyLoaded = true;
  updateStartFightBtn();
  renderEnemyList();
  if (document.getElementById('tab-party').classList.contains('active')) renderPartyTab();
}

function renderPartyTab() {
  const grid = document.getElementById('party-grid');
  if (!partyLoaded) { grid.innerHTML = '<p class="loading-msg">Loading party…</p>'; return; }

  grid.innerHTML = '';
  party.forEach((trainer, ti) => {
    const el = document.createElement('div');
    el.className = 'party-card';

    const teamHTML = trainer.team.map((t, pi) => {
      if (!t.data) return '';
      const hp = calcHP(statVal(t.data, 'hp'), t.level);
      const ac = calcAC(statVal(t.data, 'defense'), t.level);
      return `
        <div class="party-team-member">
          <img class="party-team-sprite" src="${spriteUrl(t.data)}" alt="${t.pokemon}" />
          <div class="party-team-info">
            <div class="party-pokemon-name">${cap(t.pokemon)}</div>
            <div class="types party-types">${typeBadges(t.data.types)}</div>
            <div class="party-team-stats"><span>HP ${hp}</span><span>AC ${ac}</span></div>
            <div class="party-level-row">
              <label class="level-bar-label">Lv</label>
              <input class="party-level-input" type="number" min="1" max="99" value="${t.level}"
                     data-ti="${ti}" data-pi="${pi}" />
            </div>
          </div>
          ${trainer.team.length > 1
            ? `<button class="party-remove-btn" data-ti="${ti}" data-pi="${pi}" title="Remove">&#10005;</button>`
            : ''}
        </div>`;
    }).join('');

    el.innerHTML = `
      <div class="party-trainer-header">
        <div class="party-player-name">${trainer.player}</div>
        <span class="party-team-count">${trainer.team.length}/5</span>
      </div>
      <div class="party-team-list">${teamHTML}</div>
      ${trainer.team.length < 5 ? `
        <div class="party-add-row" data-ti="${ti}">
          <div class="party-add-wrap">
            <input class="party-add-input" type="text" placeholder="Add Pokémon…" autocomplete="off" />
            <ul class="party-add-autocomplete"></ul>
          </div>
          <input class="party-add-level" type="number" min="1" max="99" value="1" />
          <button class="party-add-btn">Add</button>
        </div>` : ''}`;

    grid.appendChild(el);
  });

  grid.querySelectorAll('.party-add-row').forEach(row => {
    const input   = row.querySelector('.party-add-input');
    const acListEl = row.querySelector('.party-add-autocomplete');
    const wrap    = row.querySelector('.party-add-wrap');
    if (input && acListEl && wrap) makeAutocomplete(input, acListEl, wrap, () => {});
  });
}

// Party tab delegation — set up once
const partyGrid = document.getElementById('party-grid');

partyGrid.addEventListener('input', e => {
  if (!e.target.matches('.party-level-input')) return;
  const ti = parseInt(e.target.dataset.ti, 10);
  const pi = parseInt(e.target.dataset.pi, 10);
  let lv = parseInt(e.target.value, 10);
  if (isNaN(lv) || lv < 1) lv = 1;
  if (lv > 99) lv = 99;
  party[ti].team[pi].level = lv;
});

partyGrid.addEventListener('click', async e => {
  const removeBtn = e.target.closest('.party-remove-btn');
  const addBtn    = e.target.closest('.party-add-btn');

  if (removeBtn) {
    const ti = parseInt(removeBtn.dataset.ti, 10);
    const pi = parseInt(removeBtn.dataset.pi, 10);
    party[ti].team.splice(pi, 1);
    if (party[ti].activeIdx >= party[ti].team.length) party[ti].activeIdx = 0;
    renderPartyTab();
    return;
  }

  if (addBtn) {
    const row       = addBtn.closest('.party-add-row');
    const ti        = parseInt(row.dataset.ti, 10);
    const input     = row.querySelector('.party-add-input');
    const levelInput = row.querySelector('.party-add-level');
    const name      = input.value.trim().toLowerCase();
    if (!name || party[ti].team.length >= 5) return;
    let lv = parseInt(levelInput.value, 10);
    if (isNaN(lv) || lv < 1) lv = 1;
    if (lv > 99) lv = 99;
    addBtn.disabled = true;
    addBtn.textContent = '…';
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      party[ti].team.push({ pokemon: name, level: lv, data });
      renderPartyTab();
    } catch (_) {
      addBtn.disabled = false;
      addBtn.textContent = 'Add';
    }
  }
});

// ── Fight Tab — Enemy Setup ──────────────────────────────────────────────────

const enemyInput      = document.getElementById('enemy-input');
const enemyAcList     = document.getElementById('enemy-autocomplete');
const enemyLevelInput = document.getElementById('enemy-level-input');
const enemyAddBtn     = document.getElementById('enemy-add-btn');
const enemyListEl     = document.getElementById('enemy-list');
const startFightBtn   = document.getElementById('start-fight-btn');

makeAutocomplete(enemyInput, enemyAcList, document.querySelector('.enemy-search-wrap'), () => {});

enemyAddBtn.addEventListener('click', addEnemy);
enemyInput.addEventListener('keydown', e => { if (e.key === 'Enter') addEnemy(); });

async function addEnemy() {
  const name = enemyInput.value.trim().toLowerCase();
  if (!name || enemies.length >= 5) return;
  let lv = parseInt(enemyLevelInput.value, 10);
  if (isNaN(lv) || lv < 1) lv = 1;
  if (lv > 99) lv = 99;
  enemyAddBtn.disabled = true;
  enemyAddBtn.textContent = '…';
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    enemies.push({ id: nextEnemyId++, data, level: lv });
    enemyInput.value = '';
    renderEnemyList();
  } catch (_) {}
  enemyAddBtn.disabled = enemies.length >= 5;
  enemyAddBtn.textContent = 'Add';
}

function renderEnemyList() {
  document.getElementById('enemy-count').textContent = `(${enemies.length}/5)`;
  updateStartFightBtn();
  enemyAddBtn.disabled = enemies.length >= 5;

  enemyListEl.innerHTML = enemies.map(e => `
    <div class="enemy-preview-card">
      <img class="enemy-preview-sprite" src="${spriteUrl(e.data)}" alt="${e.data.name}" />
      <span class="enemy-preview-name">${cap(e.data.name)}</span>
      <label class="enemy-lv-label">Lv
        <input type="number" class="enemy-lv-input" min="1" max="99" value="${e.level}" data-id="${e.id}" />
      </label>
      <button class="enemy-remove-btn" data-id="${e.id}" title="Remove">&#10005;</button>
    </div>`).join('');

  enemyListEl.querySelectorAll('.enemy-lv-input').forEach(inp => {
    inp.addEventListener('input', () => {
      const enemy = enemies.find(e => e.id === parseInt(inp.dataset.id, 10));
      if (!enemy) return;
      let lv = parseInt(inp.value, 10);
      if (isNaN(lv) || lv < 1) lv = 1;
      if (lv > 99) lv = 99;
      enemy.level = lv;
    });
  });

  enemyListEl.querySelectorAll('.enemy-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      enemies = enemies.filter(e => e.id !== parseInt(btn.dataset.id, 10));
      renderEnemyList();
    });
  });
}

function updateStartFightBtn() {
  startFightBtn.disabled = enemies.length === 0 || !partyLoaded;
}

// ── Fight Tab — Combat ───────────────────────────────────────────────────────

const fightTracker      = document.getElementById('fight-tracker');
const fightersList      = document.getElementById('fighters-list');
const nextTurnBtn       = document.getElementById('next-turn-btn');
const endFightBtn       = document.getElementById('end-fight-btn');
const fightRoundEl      = document.getElementById('fight-round');
const initiativeScreen  = document.getElementById('initiative-screen');
const rollInitiativeBtn = document.getElementById('roll-initiative-btn');
const toFightBtn        = document.getElementById('to-matchups-btn');  // repurposed
const matchupScreen     = document.getElementById('matchup-screen');   // unused but kept in DOM

startFightBtn.addEventListener('click',   startFight);
rollInitiativeBtn.addEventListener('click', rollAllInitiative);
toFightBtn.addEventListener('click',      confirmInitiativeAndFight);
nextTurnBtn.addEventListener('click',     nextTurn);
endFightBtn.addEventListener('click',     endFight);

// Returns the active pokemon slot for any fighter (both have teams now)
function activePokemon(fighter) {
  return fighter.team[fighter.activeIdx];
}

// Build the enemy trainer from the setup pool
function makeEnemyTrainer(enemiesList) {
  return {
    id: 'enemy-trainer',
    isPlayer: false,
    label: 'Enemy Trainer',
    activeIdx: 0,
    team: enemiesList.map(e => ({
      data:      e.data,
      level:     e.level,
      maxHP:     calcHP(statVal(e.data, 'hp'), e.level),
      currentHP: calcHP(statVal(e.data, 'hp'), e.level),
      speed:     statVal(e.data, 'speed'),
      defeated:  false,
      moves:     moveCache[e.data.name] || null,
    })),
  };
}

// Build a party trainer fighter from party config
function makeTrainerFighter(trainer) {
  return {
    id:        `p-${trainer.player.replace(/\s+/g, '-')}`,
    isPlayer:  true,
    label:     trainer.player,
    activeIdx: 0,
    initiative: 0,
    team: trainer.team
      .filter(t => t.data)
      .map(t => ({
        data:      t.data,
        level:     t.level,
        maxHP:     calcHP(statVal(t.data, 'hp'), t.level),
        currentHP: calcHP(statVal(t.data, 'hp'), t.level),
        speed:     statVal(t.data, 'speed'),
        defeated:  false,
        moves:     moveCache[t.data.name] || null,
      })),
  };
}

function findFighterById(id) {
  if (enemyTrainer && enemyTrainer.id === id) return enemyTrainer;
  return partyFighters.find(f => f.id === id);
}

// ── Phase 1: Start → Initiative ──────────────────────────────────────────────

function startFight() {
  partyFighters = party.filter(m => m.team.some(t => t.data)).map(makeTrainerFighter);
  enemyTrainer  = makeEnemyTrainer(enemies);
  fightRound    = 1;
  goToInitiativePhase();
}

function goToInitiativePhase() {
  document.getElementById('enemy-setup').style.display = 'none';
  matchupScreen.style.display = 'none';
  fightTracker.style.display  = 'none';
  initiativeScreen.style.display = 'block';
  renderInitiativeInputs();
}

function renderInitiativeInputs() {
  document.getElementById('initiative-list').innerHTML = partyFighters.map((f, i) => {
    const ap = activePokemon(f);
    return `
      <div class="initiative-row">
        <img class="init-sprite" src="${spriteUrl(ap.data)}" alt="${ap.data.name}" />
        <div class="init-info">
          <span class="init-player">${f.label}</span>
          <span class="init-pokemon">${cap(ap.data.name)}</span>
        </div>
        <input class="init-input" type="number" min="1" max="20"
               value="${f.initiative || ''}" placeholder="—" data-pi="${i}" />
      </div>`;
  }).join('');

  document.querySelectorAll('.init-input').forEach(inp => {
    inp.addEventListener('input', () => {
      partyFighters[parseInt(inp.dataset.pi, 10)].initiative = parseInt(inp.value, 10) || 0;
    });
  });
}

function rollAllInitiative() {
  partyFighters.forEach((f, i) => {
    f.initiative = Math.floor(Math.random() * 20) + 1;
    const inp = document.querySelector(`.init-input[data-pi="${i}"]`);
    if (inp) inp.value = f.initiative;
  });
}

// Read initiative values, sort, then go straight to fight
function confirmInitiativeAndFight() {
  document.querySelectorAll('.init-input').forEach(inp => {
    partyFighters[parseInt(inp.dataset.pi, 10)].initiative = parseInt(inp.value, 10) || 0;
  });
  partyFighters.sort((a, b) => b.initiative - a.initiative);
  initiativeScreen.style.display = 'none';
  fightTracker.style.display     = 'block';
  renderFightTracker();
}

// ── Fight rendering ───────────────────────────────────────────────────────────

async function loadAllFighterMoves() {
  const toLoad = [];
  partyFighters.forEach(f => f.team.forEach(t => { if (!t.moves) toLoad.push(t); }));
  if (enemyTrainer) enemyTrainer.team.forEach(t => { if (!t.moves) toLoad.push(t); });
  if (!toLoad.length) return;
  await Promise.all(toLoad.map(async t => { t.moves = await fetchMoves(t.data); }));
  renderFightTracker();
}

function renderFightTracker() {
  fightRoundEl.textContent = fightRound;
  renderOverview();

  const et = enemyTrainer;
  const etAP = activePokemon(et);

  fightersList.innerHTML = `
    <div class="enemy-panel">
      <div class="enemy-panel-label">Enemy Trainer</div>
      ${trainerCardHTML(et, null)}
    </div>
    <div class="party-fight-row">
      ${partyFighters.map((pf, pi) => `
        <div class="party-fight-wrapper">
          <div class="party-fight-label">
            <strong>${pf.label}</strong>
            <span class="pair-init-chip">Init ${pf.initiative}</span>
            <span class="party-fight-spd">Spd ${activePokemon(pf).speed} vs ${etAP.speed}</span>
          </div>
          ${trainerCardHTML(pf, et)}
        </div>`).join('')}
    </div>`;

  loadAllFighterMoves();
}

// Renders the HP-overview bar (party dots + enemy dots)
function renderOverview() {
  const ovEl = document.getElementById('party-overview');
  if (!ovEl) return;

  const partyRows = partyFighters.map(pf => {
    const dots = pf.team.map((t, i) => {
      const pct = t.currentHP / t.maxHP;
      const color = t.defeated ? '#2a2a3a' : pct > 0.5 ? '#78C850' : pct > 0.25 ? '#F8D030' : '#FF5959';
      return `<span class="party-ov-dot${i === pf.activeIdx ? ' ov-active' : ''}"
                    style="background:${color}"
                    title="${cap(t.data.name)}: ${t.currentHP}/${t.maxHP} HP"></span>`;
    }).join('');
    return `<div class="party-ov-trainer"><span class="party-ov-name">${pf.label}</span><div class="party-ov-dots">${dots}</div></div>`;
  }).join('');

  let enemyRow = '';
  if (enemyTrainer) {
    const dots = enemyTrainer.team.map((t, i) => {
      const pct = t.currentHP / t.maxHP;
      const color = t.defeated ? '#2a2a3a' : pct > 0.5 ? '#78C850' : pct > 0.25 ? '#F8D030' : '#FF5959';
      return `<span class="party-ov-dot ov-enemy${i === enemyTrainer.activeIdx ? ' ov-active' : ''}"
                    style="background:${color}"
                    title="${cap(t.data.name)}: ${t.currentHP}/${t.maxHP} HP"></span>`;
    }).join('');
    enemyRow = `<div class="party-ov-divider"></div><div class="party-ov-trainer"><span class="party-ov-name ov-enemy-label">Enemies</span><div class="party-ov-dots">${dots}</div></div>`;
  }

  ovEl.innerHTML = partyRows + enemyRow;
}

// Unified card renderer for both party trainers and the enemy trainer
function trainerCardHTML(fighter, opponent) {
  const ap  = activePokemon(fighter);
  const pct = Math.round(ap.currentHP / ap.maxHP * 100);
  const barColor = pct > 50 ? '#78C850' : pct > 25 ? '#F8D030' : '#FF5959';

  // Opponent data for move effectiveness/AC (null for the enemy card since target varies)
  const opAP       = opponent ? activePokemon(opponent) : null;
  const opponentAC = opAP ? calcAC(statVal(opAP.data, 'defense'), opAP.level) : null;

  const cls = ['fighter-card',
    fighter.isPlayer ? 'is-player' : 'is-enemy',
    ap.defeated ? 'defeated' : '',
  ].filter(Boolean).join(' ');

  // Team strip (shown when team has more than 1 member)
  let teamStripHTML = '';
  if (fighter.team.length > 1) {
    teamStripHTML = `
      <div class="fighter-team-strip">
        <span class="team-strip-label">Team</span>
        ${fighter.team.map((t, i) => {
          const tpct  = Math.round(t.currentHP / t.maxHP * 100);
          const tColor = t.defeated ? '#2a2a3a' : tpct > 50 ? '#78C850' : tpct > 25 ? '#F8D030' : '#FF5959';
          const isActive = i === fighter.activeIdx;
          const switchAttrs = (!isActive && !t.defeated)
            ? `data-switch-id="${fighter.id}" data-switch-idx="${i}" title="Switch to ${cap(t.data.name)}"`
            : '';
          return `
            <div class="team-strip-slot${isActive ? ' ts-active' : ''}${t.defeated ? ' ts-fainted' : ''}" ${switchAttrs}>
              <img class="team-strip-sprite" src="${spriteUrl(t.data)}" alt="${t.data.name}" />
              <div class="team-strip-hp-bg">
                <div class="team-strip-hp" style="width:${tpct}%;background:${tColor}"></div>
              </div>
              ${isActive ? '<div class="ts-active-pip"></div>' : ''}
            </div>`;
        }).join('')}
      </div>`;
  }

  // Moves section (party fighters attack the enemy; enemy moves shown without specific target)
  let movesHTML = '';
  if (fighter.isPlayer && opAP) {
    movesHTML = `
      <div class="fighter-moves-section">
        <button class="moves-toggle-btn" data-id="${fighter.id}">Moves &#9650;</button>
        <div class="fighter-moves-content">
          ${ap.moves
            ? fightMovesTableHTML(ap.moves.filter(m => m.gameLevel <= ap.level), ap.level, opponentAC, fighter.id, opAP.data.types)
            : '<span class="moves-loading">Loading…</span>'}
        </div>
        <div class="attack-result" data-fighter-id="${fighter.id}"></div>
      </div>`;
  } else if (!fighter.isPlayer) {
    // Enemy card: show moves without a fixed opponent AC (DM picks target)
    movesHTML = `
      <div class="fighter-moves-section">
        <button class="moves-toggle-btn" data-id="${fighter.id}">Moves &#9650;</button>
        <div class="fighter-moves-content">
          ${ap.moves
            ? enemyMovesTableHTML(ap.moves.filter(m => m.gameLevel <= ap.level), ap.level, fighter.id)
            : '<span class="moves-loading">Loading…</span>'}
        </div>
        <div class="attack-result" data-fighter-id="${fighter.id}"></div>
      </div>`;
  }

  return `
    <div class="${cls}" data-fighter-id="${fighter.id}">
      <div class="fighter-main">
        <img class="fighter-sprite" src="${spriteUrl(ap.data)}" alt="${ap.data.name}" />
        <div class="fighter-info">
          <div class="fighter-name">${ap.data.name.toUpperCase()}</div>
          <div class="fighter-label">${fighter.label} &middot; Lv ${ap.level}</div>
          <div class="fighter-types">${typeBadges(ap.data.types, true)}</div>
        </div>
        <div class="fighter-spd">
          <span class="fighter-spd-label">Spd</span>
          <span class="fighter-spd-val">${ap.speed}</span>
        </div>
      </div>

      <div class="fighter-hp-row">
        <div class="hp-bar-wrap">
          <div class="hp-bar" style="width:${pct}%;background:${barColor}"></div>
        </div>
        <span class="hp-text">${ap.currentHP} / ${ap.maxHP}</span>
      </div>

      <div class="fighter-hp-controls">
        <button class="hp-btn hp-dmg" data-id="${fighter.id}">&#8722; Damage</button>
        <input class="hp-amount" type="number" value="5" min="1" />
        <button class="hp-btn hp-heal" data-id="${fighter.id}">&#43; Heal</button>
      </div>

      ${teamStripHTML}
      ${movesHTML}
    </div>`;
}

// Simplified move table for the enemy (no opponent-specific AC — DM compares manually)
function enemyMovesTableHTML(moves, level, fighterId) {
  if (!moves.length) return '<em class="moves-loading">No moves at this level.</em>';
  return `
    <table class="moves-table">
      <thead><tr><th>Lv</th><th>Move</th><th>Type</th><th>To Hit</th></tr></thead>
      <tbody>${moves.map(m => {
        const typeColor = TYPE_COLORS[m.type] || '#888';
        return `
        <tr class="enemy-move-row"
            data-accuracy="${m.accuracy}"
            data-level="${level}"
            data-move-name="${m.name.replace(/-/g, ' ')}"
            data-fighter-id="${fighterId}">
          <td class="move-lv">${m.gameLevel}</td>
          <td>${m.name.replace(/-/g, ' ')}</td>
          <td><span class="type-badge type-badge-sm" style="background:${typeColor};color:#fff">${m.type || '?'}</span></td>
          <td>${calcHitBonus(m.accuracy, level)}</td>
        </tr>`;
      }).join('')}
      </tbody>
    </table>`;
}

// ── Event delegation ──────────────────────────────────────────────────────────

fightersList.addEventListener('click', async e => {
  const dmgBtn     = e.target.closest('.hp-dmg');
  const healBtn    = e.target.closest('.hp-heal');
  const movBtn     = e.target.closest('.moves-toggle-btn');
  const movRow     = e.target.closest('.move-row');
  const enemyMovRow = e.target.closest('.enemy-move-row');
  const switchSlot = e.target.closest('[data-switch-id]');

  // ── HP damage / heal ─────────────────────────────────────────────────────
  if (dmgBtn || healBtn) {
    const id = (dmgBtn || healBtn).dataset.id;
    const f  = findFighterById(id);
    const ap = activePokemon(f);
    const amount = parseInt(
      (dmgBtn || healBtn).closest('.fighter-hp-controls').querySelector('.hp-amount').value, 10
    ) || 1;
    if (dmgBtn) {
      ap.currentHP = Math.max(0, ap.currentHP - amount);
      if (ap.currentHP === 0) ap.defeated = true;
    } else {
      ap.currentHP = Math.min(ap.maxHP, ap.currentHP + amount);
      if (ap.currentHP > 0) ap.defeated = false;
    }
    updateFighterHPDisplay(id);
    return;
  }

  // ── Moves toggle ─────────────────────────────────────────────────────────
  if (movBtn) {
    const content = movBtn.nextElementSibling;
    const open = content.style.display !== 'none';
    content.style.display = open ? 'none' : 'block';
    movBtn.innerHTML = open ? 'Moves &#9660;' : 'Moves &#9650;';
    return;
  }

  // ── Switch pokemon ────────────────────────────────────────────────────────
  if (switchSlot && !e.target.closest('.moves-toggle-btn')) {
    const fighterId = switchSlot.dataset.switchId;
    const newIdx    = parseInt(switchSlot.dataset.switchIdx, 10);
    const f = findFighterById(fighterId);
    if (!f || f.team[newIdx]?.defeated) return;
    f.activeIdx = newIdx;
    renderFightTracker();
    return;
  }

  // ── Party attack roll ─────────────────────────────────────────────────────
  if (movRow && !e.target.closest('[data-switch-id]')) {
    const accuracyRaw  = movRow.dataset.accuracy;
    const accuracy     = accuracyRaw === 'null' ? null : parseFloat(accuracyRaw);
    const level        = parseInt(movRow.dataset.level);
    const opponentAC   = parseInt(movRow.dataset.opponentAc);
    const moveName     = movRow.dataset.moveName.replace(/\b\w/g, c => c.toUpperCase());
    const fighterId    = movRow.dataset.fighterId;
    const moveType     = movRow.dataset.moveType;
    const movePower    = movRow.dataset.movePower ? parseInt(movRow.dataset.movePower) : null;
    const opponentTypes = movRow.dataset.opponentTypes.split(',').filter(Boolean);

    const eff      = moveType ? calcEffectiveness(moveType, opponentTypes) : 1;
    const dice     = calcDamageDice(movePower, level, eff);
    const effLabel = effectivenessLabel(eff);
    const effTag   = effLabel ? ` <span class="eff-label ${effLabel.cls}">${effLabel.text}</span>` : '';

    let resultHTML;
    if (eff === 0) {
      resultHTML = `<strong>${moveName}</strong>: <span class="result-miss">It doesn't affect the opponent!</span>`;
    } else if (accuracy === null) {
      const bonus = Math.round(110 / accuracyDivisor(level));
      resultHTML = `<strong>${moveName}</strong>: Always hits (+${bonus}). Roll ${dice} for damage.${effTag}`;
    } else {
      const bonus = Math.round(accuracy / accuracyDivisor(level));
      const roll  = Math.floor(Math.random() * 20) + 1;
      const total = roll + bonus;
      const hit   = total >= opponentAC;
      resultHTML = `<strong>${moveName}</strong>: d20(${roll}) + ${bonus} = <strong>${total}</strong> vs AC ${opponentAC} → <span class="${hit ? 'result-hit' : 'result-miss'}">${hit ? `✓ HIT! Roll ${dice} for damage.` : '✗ MISS'}</span>${hit ? effTag : ''}`;
    }

    const resultEl = document.querySelector(`.attack-result[data-fighter-id="${fighterId}"]`);
    if (resultEl) resultEl.innerHTML = resultHTML;
    return;
  }

  // ── Enemy attack roll (no specific target AC — just shows hit bonus + damage) ──
  if (enemyMovRow) {
    const accuracyRaw = enemyMovRow.dataset.accuracy;
    const accuracy    = accuracyRaw === 'null' ? null : parseFloat(accuracyRaw);
    const level       = parseInt(enemyMovRow.dataset.level);
    const moveName    = enemyMovRow.dataset.moveName.replace(/\b\w/g, c => c.toUpperCase());
    const fighterId   = enemyMovRow.dataset.fighterId;

    let resultHTML;
    if (accuracy === null) {
      const bonus = Math.round(110 / accuracyDivisor(level));
      resultHTML = `<strong>${moveName}</strong>: Always hits (+${bonus}). Pick damage die from move row.`;
    } else {
      const bonus = Math.round(accuracy / accuracyDivisor(level));
      const roll  = Math.floor(Math.random() * 20) + 1;
      const total = roll + bonus;
      resultHTML = `<strong>${moveName}</strong>: d20(${roll}) + ${bonus} = <strong>${total}</strong> — compare to target's AC.`;
    }

    const resultEl = document.querySelector(`.attack-result[data-fighter-id="${fighterId}"]`);
    if (resultEl) resultEl.innerHTML = resultHTML;
  }
});

function updateFighterHPDisplay(id) {
  const f  = findFighterById(id);
  const el = document.querySelector(`.fighter-card[data-fighter-id="${id}"]`);
  if (!el || !f) return;

  const ap  = activePokemon(f);
  const pct = Math.round(ap.currentHP / ap.maxHP * 100);
  const barColor = pct > 50 ? '#78C850' : pct > 25 ? '#F8D030' : '#FF5959';
  el.querySelector('.hp-bar').style.width       = `${pct}%`;
  el.querySelector('.hp-bar').style.background  = barColor;
  el.querySelector('.hp-text').textContent      = `${ap.currentHP} / ${ap.maxHP}`;
  el.classList.toggle('defeated', ap.defeated);

  // Update team strip bars
  const strip = el.querySelector('.fighter-team-strip');
  if (strip) {
    f.team.forEach((t, i) => {
      const slotEl = strip.querySelectorAll('.team-strip-slot')[i];
      if (!slotEl) return;
      const tpct   = Math.round(t.currentHP / t.maxHP * 100);
      const tColor = t.defeated ? '#2a2a3a' : tpct > 50 ? '#78C850' : tpct > 25 ? '#F8D030' : '#FF5959';
      const hpBar  = slotEl.querySelector('.team-strip-hp');
      if (hpBar) { hpBar.style.width = `${tpct}%`; hpBar.style.background = tColor; }
    });
  }

  renderOverview();
}

function nextTurn() {
  fightRound++;
  renderFightTracker();
}

function endFight() {
  partyFighters = [];
  enemyTrainer  = null;
  fightRound    = 1;
  fightTracker.style.display     = 'none';
  initiativeScreen.style.display = 'none';
  matchupScreen.style.display    = 'none';
  document.getElementById('enemy-setup').style.display = 'flex';
}

// ── Init ─────────────────────────────────────────────────────────────────────

initParty();
