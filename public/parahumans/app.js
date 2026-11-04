// Parahumans crew tracker. Plain JS, synced through Firestore.
// Data shape and starting values live in data.js.

// ── Firebase ──────────────────────────────────────────────────────────────────
// Same project as the D&D Pokémon page. Safe to commit: Firestore Rules do the real security.
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDhCbuNlJUy0BK7ItkfpOnCse03UcGtpyE",
  authDomain: "orphans-and-pokemons.firebaseapp.com",
  projectId: "orphans-and-pokemons",
  storageBucket: "orphans-and-pokemons.firebasestorage.app",
  messagingSenderId: "573058230512",
  appId: "1:573058230512:web:e675f4080780b753c3ba35"
};
const DOC_PATH = ['campaigns', 'parahumans'];
const LOCAL_KEY = 'parahumans-state-v1';
const SECTIONS = ['crew', 'capes', 'base', 'ledger', 'jobs', 'contacts', 'log'];

let state = loadLocal() || structuredClone(SEED);
let docRef = null;
let pendingRemote = null;   // remote update that arrived while a modal was open
let currentTab = readStore('parahumans-tab') || 'capes';
let gm = readStore('parahumans-gm') === '1' || new URLSearchParams(location.search).has('gm');
const capeFilter = { q: '', aff: '', cls: '', met: false };

// ── Small helpers ─────────────────────────────────────────────────────────────
const $ = sel => document.querySelector(sel);
const uid = () => Math.random().toString(36).slice(2, 10);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nl = v => esc(v).replace(/\n/g, '<br>');
const money = n => (n < 0 ? '−$' : '$') + Math.abs(Number(n) || 0).toLocaleString('en-US');
const today = () => new Date().toISOString().slice(0, 10);

function readStore(k) { try { return localStorage.getItem(k); } catch { return null; } }
function writeStore(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } }
function loadLocal() { try { return normalize(JSON.parse(readStore(LOCAL_KEY))); } catch { return null; } }

// Fill in any section that is missing (old saves, partial docs).
function normalize(s) {
  if (!s || typeof s !== 'object') return null;
  const out = {};
  for (const k of SECTIONS) out[k] = s[k] ?? structuredClone(SEED[k]);
  out.base = { ...structuredClone(SEED.base), ...out.base };
  out.crew = { ...structuredClone(SEED.crew), ...out.crew };
  return out;
}

// ── Sync ──────────────────────────────────────────────────────────────────────
function setSync(mode, text) {
  $('#sync').dataset.mode = mode;
  $('#sync-text').textContent = text;
}

function save(...sections) {
  writeStore(LOCAL_KEY, JSON.stringify(state));
  render();
  if (!docRef) return;
  const patch = {};
  for (const s of sections) patch[s] = state[s];
  patch.updatedAt = Date.now();
  setSync('saving', 'Saving…');
  docRef.set(patch, { merge: true })
    .then(() => setSync('ok', 'Synced'))
    .catch(err => { console.error(err); setSync('err', 'Not saved (offline)'); });
}

function applyRemote(data) {
  state = normalize(data);
  writeStore(LOCAL_KEY, JSON.stringify(state));
  render();
}

function initFirebase() {
  if (typeof firebase === 'undefined') { setSync('err', 'Offline: saved on this device'); return; }
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    firebase.auth().signInAnonymously()
      .then(() => {
        docRef = firebase.firestore().collection(DOC_PATH[0]).doc(DOC_PATH[1]);
        docRef.onSnapshot(snap => {
          if (!snap.exists) {             // first ever visit: write starting data
            docRef.set({ ...state, updatedAt: Date.now() }).catch(console.error);
            setSync('ok', 'Synced');
            return;
          }
          setSync('ok', 'Synced');
          if (snap.metadata.hasPendingWrites) return;
          if (!$('#modal').hidden) { pendingRemote = snap.data(); return; }
          applyRemote(snap.data());
        }, err => { console.error(err); setSync('err', 'Offline: saved on this device'); });
      })
      .catch(err => { console.error(err); setSync('err', 'Offline: saved on this device'); });
  } catch (err) { console.error(err); setSync('err', 'Offline: saved on this device'); }
}

// ── Modal form ────────────────────────────────────────────────────────────────
// fields: [{ key, label, type: text|textarea|number|select|checkbox|date|tags, options }]
let modalSubmit = null, modalDelete = null;

function openModal({ title, fields, values = {}, onSave, onDelete }) {
  $('#modal-title').textContent = title;
  $('#modal-fields').innerHTML = fields.map(f => {
    const v = values[f.key];
    const id = 'f-' + f.key;
    if (f.type === 'checkbox') {
      return `<label class="field check"><input type="checkbox" id="${id}" ${v ? 'checked' : ''}> ${esc(f.label)}</label>`;
    }
    let input;
    if (f.type === 'textarea') input = `<textarea id="${id}" rows="${f.rows || 4}">${esc(v)}</textarea>`;
    else if (f.type === 'select') input = `<select id="${id}">${f.options.map(o => {
      const [val, label] = Array.isArray(o) ? o : [o, o];
      return `<option value="${esc(val)}" ${val === v ? 'selected' : ''}>${esc(label)}</option>`;
    }).join('')}</select>`;
    else if (f.type === 'tags') input = `<div class="chips pick" id="${id}">${f.options.map(o =>
      `<button type="button" class="chip ${(v || []).includes(o) ? 'on' : ''}" data-val="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
    else input = `<input id="${id}" type="${f.type || 'text'}" value="${esc(v)}" ${f.type === 'number' ? 'step="any"' : ''}>`;
    return `<label class="field"><span>${esc(f.label)}</span>${input}</label>`;
  }).join('');

  $('#modal-fields').querySelectorAll('.chips.pick .chip').forEach(b =>
    b.addEventListener('click', () => b.classList.toggle('on')));

  modalSubmit = () => {
    const out = {};
    for (const f of fields) {
      const el = document.getElementById('f-' + f.key);
      if (f.type === 'checkbox') out[f.key] = el.checked;
      else if (f.type === 'number') out[f.key] = Number(el.value) || 0;
      else if (f.type === 'tags') out[f.key] = [...el.querySelectorAll('.chip.on')].map(c => c.dataset.val);
      else out[f.key] = el.value.trim();
    }
    onSave(out);
  };
  modalDelete = onDelete || null;
  $('#modal-delete').hidden = !onDelete;
  $('#modal').hidden = false;
  const first = $('#modal-fields').querySelector('input, textarea, select');
  if (first) first.focus();
}

function closeModal() {
  $('#modal').hidden = true;
  if (pendingRemote) { const d = pendingRemote; pendingRemote = null; applyRemote(d); }
}

$('#modal-form').addEventListener('submit', e => { e.preventDefault(); modalSubmit?.(); closeModal(); });
$('#modal-cancel').addEventListener('click', closeModal);
$('#modal-delete').addEventListener('click', () => {
  if (confirm('Delete this? Everyone in the party loses it.')) { modalDelete?.(); closeModal(); }
});
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });

// Generic list editor: add/edit/delete an item in state[section] (or a nested array).
function editItem({ title, list, item, fields, section, defaults = {} }) {
  const isNew = !item;
  openModal({
    title: (isNew ? 'Add ' : 'Edit ') + title,
    fields,
    values: item || defaults,
    onSave: vals => {
      if (isNew) list.unshift({ id: uid(), ...defaults, ...vals });
      else Object.assign(item, vals);
      save(section);
    },
    onDelete: isNew ? null : () => { list.splice(list.indexOf(item), 1); save(section); },
  });
}

// ── Field definitions ─────────────────────────────────────────────────────────
const CAPE_FIELDS = [
  { key: 'name', label: 'Cape name' },
  { key: 'affiliation', label: 'Side / gang', type: 'select', options: AFFILIATIONS },
  { key: 'threat', label: 'Threat', type: 'select', options: THREATS.map(t => [t[0], `${t[1]}: ${t[2]}`]) },
  { key: 'classes', label: 'PRT class', type: 'tags', options: PRT_CLASSES.map(c => c[0]) },
  { key: 'look', label: 'What they look like', type: 'textarea', rows: 2 },
  { key: 'power', label: 'Power (what we know)', type: 'textarea', rows: 3 },
  { key: 'notes', label: 'Notes', type: 'textarea', rows: 4 },
  { key: 'met', label: 'We have met them', type: 'checkbox' },
];
const GM_CAPE_FIELDS = [...CAPE_FIELDS, { key: 'hidden', label: 'Hidden from players (GM)', type: 'checkbox' }];

const MEMBER_FIELDS = [
  { key: 'name', label: 'Character' }, { key: 'player', label: 'Player' },
  { key: 'build', label: 'Species and class' }, { key: 'role', label: 'Role in the crew' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];
const JOB_STATUS = [['lead', 'Lead'], ['active', 'Active'], ['done', 'Done'], ['failed', 'Failed']];
const JOB_FIELDS = [
  { key: 'title', label: 'Job' }, { key: 'giver', label: 'Who gave it' },
  { key: 'reward', label: 'Reward' },
  { key: 'status', label: 'Status', type: 'select', options: JOB_STATUS },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];
const ATTITUDES = ['Ally', 'Friendly', 'Neutral', 'Scared', 'Wary', 'Hostile', 'Unknown'];
const CONTACT_FIELDS = [
  { key: 'name', label: 'Name' }, { key: 'role', label: 'Who they are' },
  { key: 'where', label: 'Where to find them' },
  { key: 'attitude', label: 'Attitude to us', type: 'select', options: ATTITUDES },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];
const LEDGER_FIELDS = [
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'desc', label: 'What for' },
  { key: 'amount', label: 'Amount ($). Minus for spending.', type: 'number' },
  { key: 'who', label: 'Who holds it' },
];
const LOG_FIELDS = [
  { key: 'title', label: 'Title' }, { key: 'date', label: 'Date', type: 'date' },
  { key: 'text', label: 'What happened', type: 'textarea', rows: 10 },
];
const UPGRADE_FIELDS = [
  { key: 'name', label: 'Upgrade' }, { key: 'done', label: 'Built', type: 'checkbox' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];
const STAFF_FIELDS = [
  { key: 'name', label: 'Name' }, { key: 'role', label: 'Job (medic, driver, lookout…)' },
  { key: 'pay', label: 'Pay' }, { key: 'notes', label: 'Notes', type: 'textarea' },
];

// ── Renderers ─────────────────────────────────────────────────────────────────
const threatOf = id => THREATS.find(t => t[0] === id) || THREATS[4];
const empty = text => `<p class="empty">${esc(text)}</p>`;
const addBtn = (action, label) => `<button class="btn primary" data-action="${action}">+ ${esc(label)}</button>`;

function renderCapes() {
  const visible = state.capes.filter(c => gm || !c.hidden);
  const q = capeFilter.q.toLowerCase();
  const list = visible
    .filter(c => !q || [c.name, c.look, c.power, c.notes, c.affiliation].join(' ').toLowerCase().includes(q))
    .filter(c => !capeFilter.aff || c.affiliation === capeFilter.aff)
    .filter(c => !capeFilter.cls || (c.classes || []).includes(capeFilter.cls))
    .filter(c => !capeFilter.met || c.met)
    .sort((a, b) => a.name.localeCompare(b.name));

  const affs = [...new Set(visible.map(c => c.affiliation))].sort();

  return `
    <div class="toolbar">
      <input class="search" id="cape-q" type="search" placeholder="Search capes…" value="${esc(capeFilter.q)}">
      <select id="cape-aff"><option value="">All sides</option>${affs.map(a => `<option ${a === capeFilter.aff ? 'selected' : ''}>${esc(a)}</option>`).join('')}</select>
      <select id="cape-cls"><option value="">All classes</option>${PRT_CLASSES.map(([c]) => `<option ${c === capeFilter.cls ? 'selected' : ''}>${c}</option>`).join('')}</select>
      <label class="toggle"><input type="checkbox" id="cape-met" ${capeFilter.met ? 'checked' : ''}> Met only</label>
      ${addBtn('add-cape', 'Cape')}
    </div>
    <p class="count">${list.length} of ${visible.length} capes</p>
    <div class="grid">
      ${list.map(c => {
        const t = threatOf(c.threat);
        return `
        <article class="card cape threat-${t[0]} ${c.hidden ? 'is-hidden' : ''}" data-action="edit-cape" data-id="${c.id}" tabindex="0">
          <header>
            <h3>${esc(c.name)}</h3>
            <span class="threat">${esc(t[1])}</span>
          </header>
          <div class="meta">
            <span class="aff">${esc(c.affiliation)}</span>
            ${c.met ? '<span class="tag met">Met</span>' : ''}
            ${c.hidden ? '<span class="tag gm">Hidden</span>' : ''}
          </div>
          ${(c.classes || []).length ? `<div class="chips">${c.classes.map(x => `<span class="chip">${esc(x)}</span>`).join('')}</div>` : ''}
          ${c.look ? `<p><b>Look.</b> ${nl(c.look)}</p>` : ''}
          ${c.power ? `<p><b>Power.</b> ${nl(c.power)}</p>` : ''}
          ${c.notes ? `<p class="notes">${nl(c.notes)}</p>` : ''}
          ${gm && c.hidden ? `<button class="btn small" data-action="reveal-cape" data-id="${c.id}">Reveal to players</button>` : ''}
        </article>`;
      }).join('') || empty('No capes match.')}
    </div>`;
}

function meter(key, label, low, high) {
  const v = state.crew[key] || 0;
  return `
    <div class="meter">
      <div class="meter-head"><b>${label}</b><span>${v} / 10</span></div>
      <div class="pips">${Array.from({ length: 10 }, (_, i) =>
        `<button class="pip ${i < v ? 'on' : ''} ${key}" data-action="set-meter" data-key="${key}" data-val="${i + 1}" aria-label="${label} ${i + 1}"></button>`).join('')}</div>
      <div class="meter-foot"><span>${low}</span><span>${high}</span></div>
    </div>`;
}

function renderCrew() {
  const c = state.crew;
  return `
    <section class="panel">
      <div class="row-between">
        <h2>${esc(c.name || 'Crew with no name yet')}</h2>
        <button class="btn" data-action="edit-crew-name">Rename crew</button>
      </div>
      <div class="meters">
        ${meter('reputation', 'Reputation', 'Nobodies', 'Known name')}
        ${meter('heat', 'Heat', 'Ignored', 'Hunted')}
      </div>
    </section>
    <div class="row-between"><h2>Members</h2>${addBtn('add-member', 'Member')}</div>
    <div class="grid">
      ${c.members.map(m => `
        <article class="card" data-action="edit-member" data-id="${m.id}" tabindex="0">
          <header><h3>${esc(m.name)}</h3><span class="muted">${esc(m.player)}</span></header>
          ${m.build ? `<p class="muted">${esc(m.build)}</p>` : ''}
          ${m.role ? `<p>${esc(m.role)}</p>` : ''}
          ${m.notes ? `<p class="notes">${nl(m.notes)}</p>` : ''}
        </article>`).join('') || empty('No members.')}
    </div>`;
}

function renderBase() {
  const b = state.base;
  return `
    <section class="panel">
      <div class="row-between">
        <h2>${esc(b.name || 'No base yet')}</h2>
        <button class="btn" data-action="edit-base">Edit</button>
      </div>
      <dl class="facts">
        <dt>Where</dt><dd>${esc(b.location || '—')}</dd>
        <dt>Status</dt><dd>${esc(b.status || '—')}</dd>
      </dl>
      ${b.notes ? `<p class="notes">${nl(b.notes)}</p>` : ''}
    </section>
    <div class="two-col">
      <section>
        <div class="row-between"><h2>Upgrades</h2>${addBtn('add-upgrade', 'Upgrade')}</div>
        <ul class="list">
          ${b.upgrades.map(u => `
            <li class="${u.done ? 'done' : ''}">
              <button class="check-btn ${u.done ? 'on' : ''}" data-action="toggle-upgrade" data-id="${u.id}" aria-label="Toggle built">${u.done ? '✓' : ''}</button>
              <div class="grow" data-action="edit-upgrade" data-id="${u.id}">
                <b>${esc(u.name)}</b>${u.notes ? `<div class="muted">${nl(u.notes)}</div>` : ''}
              </div>
            </li>`).join('') || `<li>${empty('No upgrades yet.')}</li>`}
        </ul>
      </section>
      <section>
        <div class="row-between"><h2>Staff</h2>${addBtn('add-staff', 'Staff')}</div>
        <ul class="list">
          ${b.staff.map(s => `
            <li data-action="edit-staff" data-id="${s.id}">
              <div class="grow"><b>${esc(s.name)}</b> <span class="muted">${esc(s.role)}${s.pay ? ' · ' + esc(s.pay) : ''}</span>
              ${s.notes ? `<div class="muted">${nl(s.notes)}</div>` : ''}</div>
            </li>`).join('') || `<li>${empty('Nobody works for us yet.')}</li>`}
        </ul>
      </section>
    </div>`;
}

function renderFunds() {
  const total = state.ledger.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const income = state.ledger.filter(e => e.amount > 0).reduce((s, e) => s + e.amount, 0);
  const spent = state.ledger.filter(e => e.amount < 0).reduce((s, e) => s + e.amount, 0);
  const rows = [...state.ledger].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return `
    <section class="panel funds">
      <div class="big-money ${total < 0 ? 'neg' : ''}">${money(total)}</div>
      <div class="muted">Crew funds</div>
      <div class="money-split"><span class="pos">In ${money(income)}</span><span class="neg">Out ${money(spent)}</span></div>
    </section>
    <form class="quick" id="quick-ledger">
      <input id="ql-desc" placeholder="What for" required>
      <input id="ql-amount" type="number" step="any" placeholder="Amount" required>
      <button type="submit" class="btn pos" data-sign="1">+ Earned</button>
      <button type="submit" class="btn neg" data-sign="-1">− Spent</button>
    </form>
    <table class="ledger">
      <thead><tr><th>Date</th><th>What</th><th>Who</th><th class="num">Amount</th></tr></thead>
      <tbody>
        ${rows.map(e => `
          <tr data-action="edit-ledger" data-id="${e.id}">
            <td>${esc(e.date)}</td><td>${esc(e.desc)}</td><td>${esc(e.who)}</td>
            <td class="num ${e.amount < 0 ? 'neg' : 'pos'}">${money(e.amount)}</td>
          </tr>`).join('') || `<tr><td colspan="4">${empty('No money yet. Go earn some.')}</td></tr>`}
      </tbody>
    </table>`;
}

function renderJobs() {
  const groups = JOB_STATUS.map(([key, label]) => ({ key, label, items: state.jobs.filter(j => (j.status || 'lead') === key) }));
  return `
    <div class="row-between"><h2>Jobs</h2>${addBtn('add-job', 'Job')}</div>
    <div class="board">
      ${groups.map(g => `
        <section class="column col-${g.key}">
          <h3>${g.label} <span class="muted">${g.items.length}</span></h3>
          ${g.items.map(j => `
            <article class="card job" data-action="edit-job" data-id="${j.id}" tabindex="0">
              <h4>${esc(j.title)}</h4>
              <div class="meta">${j.giver ? `<span>From ${esc(j.giver)}</span>` : ''}${j.reward ? `<span class="tag reward">${esc(j.reward)}</span>` : ''}</div>
              ${j.notes ? `<p class="notes">${nl(j.notes)}</p>` : ''}
            </article>`).join('') || empty('—')}
        </section>`).join('')}
    </div>`;
}

function renderContacts() {
  return `
    <div class="row-between"><h2>Contacts</h2>${addBtn('add-contact', 'Contact')}</div>
    <div class="grid">
      ${state.contacts.map(n => `
        <article class="card" data-action="edit-contact" data-id="${n.id}" tabindex="0">
          <header><h3>${esc(n.name)}</h3><span class="tag att-${esc((n.attitude || '').toLowerCase())}">${esc(n.attitude)}</span></header>
          ${n.role ? `<p><b>${esc(n.role)}</b></p>` : ''}
          ${n.where ? `<p class="muted">${esc(n.where)}</p>` : ''}
          ${n.notes ? `<p class="notes">${nl(n.notes)}</p>` : ''}
        </article>`).join('') || empty('No contacts yet.')}
    </div>`;
}

function renderLog() {
  const rows = [...state.log].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return `
    <div class="row-between"><h2>Session log</h2>${addBtn('add-log', 'Entry')}</div>
    ${rows.map(l => `
      <article class="card log" data-action="edit-log" data-id="${l.id}" tabindex="0">
        <header><h3>${esc(l.title)}</h3><span class="muted">${esc(l.date)}</span></header>
        <p>${nl(l.text)}</p>
      </article>`).join('') || empty('Nothing written yet. Add what happened after each session.')}`;
}

function renderRules() {
  return `
    <section class="panel">
      <h2>The unwritten rules</h2>
      <ol class="rules">
        <li><b>Don't unmask anyone.</b> Secret identities protect families.</li>
        <li><b>Don't kill in a normal fight.</b> Beat them, rob them. Don't murder them.</li>
        <li><b>Don't go after family.</b> Ever.</li>
      </ol>
      <p class="muted">Break these and you are not a villain anymore. You are one of the bad guys. Everyone comes for you.</p>
    </section>
    <div class="two-col">
      <section class="panel">
        <h2>PRT classes</h2>
        <dl class="facts wide">${PRT_CLASSES.map(([n, d]) => `<dt>${n}</dt><dd>${esc(d)}</dd>`).join('')}</dl>
        <p class="muted">A number after the class (Brute 4) says how careful you need to be. Higher is worse.</p>
      </section>
      <section class="panel">
        <h2>Threat levels</h2>
        <dl class="facts wide">${THREATS.map(([k, n, d]) => `<dt><span class="threat-dot threat-${k}"></span>${n}</dt><dd>${esc(d)}</dd>`).join('')}</dl>
        <h2 class="mt">Three sides</h2>
        <dl class="facts wide">
          <dt>Heroes</dt><dd>Protectorate, Wards, New Wave.</dd>
          <dt>Villains</dt><dd>Break the law, keep the rules.</dd>
          <dt>Bad guys</dt><dd>Empire Eighty-Eight, the ABB. No rules.</dd>
        </dl>
      </section>
    </div>
    <p class="gm-link"><button class="linkish" data-action="toggle-gm">${gm ? 'Leave GM mode' : 'GM mode'}</button></p>`;
}

const RENDER = { capes: renderCapes, crew: renderCrew, base: renderBase, funds: renderFunds, jobs: renderJobs, contacts: renderContacts, log: renderLog, rules: renderRules };

function render() {
  // Keep the search box focused while typing through a re-render.
  const focusId = document.activeElement?.id;
  const caret = document.activeElement?.selectionStart;
  document.body.classList.toggle('gm', gm);
  $('#crew-title').textContent = state.crew.name || 'Brockton Bay';
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === currentTab));
  $('#main').innerHTML = (RENDER[currentTab] || renderCapes)();
  if (focusId) {
    const el = document.getElementById(focusId);
    if (el) { el.focus(); if (caret != null && el.setSelectionRange) try { el.setSelectionRange(caret, caret); } catch { /* type=number */ } }
  }
}

// ── Events ────────────────────────────────────────────────────────────────────
$('#tabs').addEventListener('click', e => {
  const t = e.target.closest('.tab');
  if (!t) return;
  currentTab = t.dataset.tab;
  writeStore('parahumans-tab', currentTab);
  render();
  window.scrollTo(0, 0);
});

const find = (list, id) => list.find(x => x.id === id);

const ACTIONS = {
  'add-cape':   () => editItem({ title: 'cape', list: state.capes, section: 'capes', fields: gm ? GM_CAPE_FIELDS : CAPE_FIELDS,
                                 defaults: { affiliation: 'Unknown', threat: 'unknown', classes: [], met: true, hidden: false } }),
  'edit-cape':  id => editItem({ title: 'cape', list: state.capes, item: find(state.capes, id), section: 'capes', fields: gm ? GM_CAPE_FIELDS : CAPE_FIELDS }),
  'reveal-cape': id => { find(state.capes, id).hidden = false; save('capes'); },

  'add-member':  () => editItem({ title: 'member', list: state.crew.members, section: 'crew', fields: MEMBER_FIELDS }),
  'edit-member': id => editItem({ title: 'member', list: state.crew.members, item: find(state.crew.members, id), section: 'crew', fields: MEMBER_FIELDS }),
  'edit-crew-name': () => openModal({ title: 'Crew name', fields: [{ key: 'name', label: 'Name' }], values: state.crew,
                                      onSave: v => { state.crew.name = v.name; save('crew'); } }),
  'set-meter': (_, el) => {
    const k = el.dataset.key, v = Number(el.dataset.val);
    state.crew[k] = state.crew[k] === v ? v - 1 : v;  // click the top pip again to lower it
    save('crew');
  },

  'edit-base': () => openModal({ title: 'Base', values: state.base,
    fields: [{ key: 'name', label: 'Name' }, { key: 'location', label: 'Where' }, { key: 'status', label: 'Status' }, { key: 'notes', label: 'Notes', type: 'textarea', rows: 6 }],
    onSave: v => { Object.assign(state.base, v); save('base'); } }),
  'add-upgrade':    () => editItem({ title: 'upgrade', list: state.base.upgrades, section: 'base', fields: UPGRADE_FIELDS }),
  'edit-upgrade':   id => editItem({ title: 'upgrade', list: state.base.upgrades, item: find(state.base.upgrades, id), section: 'base', fields: UPGRADE_FIELDS }),
  'toggle-upgrade': id => { const u = find(state.base.upgrades, id); u.done = !u.done; save('base'); },
  'add-staff':      () => editItem({ title: 'staff', list: state.base.staff, section: 'base', fields: STAFF_FIELDS }),
  'edit-staff':     id => editItem({ title: 'staff', list: state.base.staff, item: find(state.base.staff, id), section: 'base', fields: STAFF_FIELDS }),

  'edit-ledger': id => editItem({ title: 'entry', list: state.ledger, item: find(state.ledger, id), section: 'ledger', fields: LEDGER_FIELDS }),

  'add-job':  () => editItem({ title: 'job', list: state.jobs, section: 'jobs', fields: JOB_FIELDS, defaults: { status: 'lead' } }),
  'edit-job': id => editItem({ title: 'job', list: state.jobs, item: find(state.jobs, id), section: 'jobs', fields: JOB_FIELDS }),

  'add-contact':  () => editItem({ title: 'contact', list: state.contacts, section: 'contacts', fields: CONTACT_FIELDS, defaults: { attitude: 'Neutral' } }),
  'edit-contact': id => editItem({ title: 'contact', list: state.contacts, item: find(state.contacts, id), section: 'contacts', fields: CONTACT_FIELDS }),

  'add-log':  () => editItem({ title: 'log entry', list: state.log, section: 'log', fields: LOG_FIELDS, defaults: { date: today() } }),
  'edit-log': id => editItem({ title: 'log entry', list: state.log, item: find(state.log, id), section: 'log', fields: LOG_FIELDS }),

  'toggle-gm': () => { gm = !gm; writeStore('parahumans-gm', gm ? '1' : '0'); render(); },
};

$('#main').addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  e.stopPropagation();
  ACTIONS[el.dataset.action]?.(el.dataset.id, el);
});
$('#main').addEventListener('keydown', e => {
  if (e.key !== 'Enter' || e.target.tagName !== 'ARTICLE') return;
  const el = e.target.closest('[data-action]');
  if (el) ACTIONS[el.dataset.action]?.(el.dataset.id, el);
});

$('#main').addEventListener('input', e => {
  if (e.target.id === 'cape-q') { capeFilter.q = e.target.value; render(); }
});
$('#main').addEventListener('change', e => {
  if (e.target.id === 'cape-aff') capeFilter.aff = e.target.value;
  else if (e.target.id === 'cape-cls') capeFilter.cls = e.target.value;
  else if (e.target.id === 'cape-met') capeFilter.met = e.target.checked;
  else return;
  render();
});

$('#main').addEventListener('submit', e => {
  if (e.target.id !== 'quick-ledger') return;
  e.preventDefault();
  const sign = Number(e.submitter?.dataset.sign || 1);
  const amount = Math.abs(Number($('#ql-amount').value) || 0) * sign;
  const desc = $('#ql-desc').value.trim();
  if (!desc || !amount) return;
  state.ledger.push({ id: uid(), date: today(), desc, amount, who: '' });
  save('ledger');
});

// ── Start ─────────────────────────────────────────────────────────────────────
render();
initFirebase();
