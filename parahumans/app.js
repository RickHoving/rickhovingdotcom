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
  out.capes = out.capes.map(c => ({ ...c, classes: (c.classes || []).map(toClass) }));
  return out;
}

// Classes used to be plain strings ("Tinker"); now { name, rating }.
function toClass(c) {
  if (typeof c !== 'string') return { name: c.name, rating: c.rating ?? '' };
  const [name, rating = ''] = c.split(' ');
  return { name, rating };
}
const classLabel = c => c.rating ? `${c.name} ${c.rating}` : c.name;

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

// ── Cape pictures ─────────────────────────────────────────────────────────────
// cape.image is one of:
//   'https://…'         a pasted link
//   'img:<capeId>:<ts>' an upload, stored in its own doc so the main doc stays small
//   'data:image/…'      an upload made while offline
const imgCache = {};
const imgLoading = new Set();
let imageDraft = '';   // value being edited in the form: string, or { data } for a new upload

const imgDoc = capeId => firebase.firestore().collection(DOC_PATH[0]).doc(`${DOC_PATH[1]}-img-${capeId}`);

function imageSrc(v) {
  if (!v) return '';
  if (typeof v === 'object') return v.data;
  if (v.startsWith('img:')) return imgCache[v] || '';
  if (/^(https?:|data:image\/)/.test(v)) return v;
  return '';
}

// Fetch uploaded pictures we haven't loaded yet, then re-render.
function loadImages() {
  if (!docRef) return;
  for (const c of state.capes) {
    const key = c.image;
    if (!key || !key.startsWith('img:') || key in imgCache || imgLoading.has(key)) continue;
    imgLoading.add(key);
    imgDoc(key.split(':')[1]).get()
      .then(s => { imgCache[key] = s.data()?.data || ''; })
      .catch(err => { console.error(err); imgCache[key] = ''; })
      .finally(() => { imgLoading.delete(key); if (currentTab === 'capes') render(); });
  }
}

// Shrink to max 480px so a picture is ~30–60 KB.
function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 480 / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function wireImageField() {
  const preview = () => {
    const src = imageSrc(imageDraft);
    $('#img-preview').innerHTML = src ? `<img src="${esc(src)}" alt="">` : '<span class="muted">No picture</span>';
  };
  $('#img-url').addEventListener('input', e => { imageDraft = e.target.value.trim(); preview(); });
  $('#img-file').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    try { imageDraft = { data: await resizeImage(file) }; $('#img-url').value = ''; preview(); }
    catch { alert('Could not read that picture.'); }
  });
  $('#img-clear').addEventListener('click', () => { imageDraft = ''; $('#img-url').value = ''; preview(); });
  preview();
}

// Turn a fresh upload ({ data }) into a stored picture.
function storeImage(cape) {
  if (!cape.image || typeof cape.image !== 'object') return;
  const data = cape.image.data;
  if (!docRef) { cape.image = data; return; }   // offline: keep it inline
  const key = `img:${cape.id}:${Date.now()}`;
  imgCache[key] = data;
  cape.image = key;
  imgDoc(cape.id).set({ data }).catch(err => { console.error(err); setSync('err', 'Picture not saved'); });
}

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
    else if (f.type === 'ratings') {
      const have = Object.fromEntries((v || []).map(c => [c.name, c.rating || '?']));
      input = `<div class="ratings" id="${id}">${f.options.map(o =>
        `<label class="rating-row"><span>${esc(o)}</span><input data-cls="${esc(o)}" value="${esc(have[o] ?? '')}" placeholder="–" maxlength="4"></label>`).join('')}</div>
        <small class="muted">Fill in a number for each class they have. Use ? if you don't know the number. Add + if it can grow.</small>`;
    }
    else if (f.type === 'image') {
      imageDraft = v || '';
      return `<div class="field"><span>${esc(f.label)}</span>
        <div class="img-field">
          <div class="img-preview" id="img-preview"></div>
          <div class="img-controls">
            <input id="img-url" type="url" placeholder="Paste an image link" value="${esc(/^https?:/.test(v || '') ? v : '')}">
            <div class="img-buttons">
              <label class="btn">Upload<input id="img-file" type="file" accept="image/*" hidden></label>
              <button type="button" class="btn ghost" id="img-clear">Remove</button>
            </div>
          </div>
        </div></div>`;
    }
    else input = `<input id="${id}" type="${f.type || 'text'}" value="${esc(v)}" ${f.type === 'number' ? 'step="any"' : ''}>`;
    return `<label class="field"><span>${esc(f.label)}</span>${input}</label>`;
  }).join('');
  if (fields.some(f => f.type === 'image')) wireImageField();

  modalSubmit = () => {
    const out = {};
    for (const f of fields) {
      const el = document.getElementById('f-' + f.key);
      if (f.type === 'checkbox') out[f.key] = el.checked;
      else if (f.type === 'number') out[f.key] = Number(el.value) || 0;
      else if (f.type === 'ratings') out[f.key] = [...el.querySelectorAll('input')]
        .filter(i => i.value.trim())
        .map(i => ({ name: i.dataset.cls, rating: i.value.trim() === '?' ? '' : i.value.trim() }));
      else if (f.type === 'image') out[f.key] = imageDraft;
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

// ── Info popup (class explanations) ──────────────────────────────────────────
function showInfo(title, html) {
  $('#info-title').textContent = title;
  $('#info-body').innerHTML = html;
  $('#info').hidden = false;
  $('#info-close').focus();
}
function closeInfo() { $('#info').hidden = true; }
$('#info-close').addEventListener('click', closeInfo);
$('#info').addEventListener('click', e => {
  if (e.target.id === 'info') closeInfo();
  if (e.target.closest('[data-action="class-help"]')) showClassHelp();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#info').hidden) closeInfo(); });

function ratingText(rating) {
  const n = parseInt(rating, 10);
  if (!n) return '';
  const row = RATING_SCALE.find(([lo, hi]) => n >= lo && n <= hi);
  return row ? row[2] : '';
}

function scaleTable() {
  return `<dl class="facts wide scale">${RATING_SCALE.map(([lo, hi, d]) =>
    `<dt>${hi > 9 ? lo + '+' : lo + '–' + hi}</dt><dd>${esc(d)}</dd>`).join('')}</dl>
    <p class="muted">A <b>+</b> after the number means it can go up during a fight.</p>`;
}

function showClassInfo(name, rating) {
  const c = PRT_CLASSES.find(x => x[0] === name);
  if (!c) return;
  const rt = ratingText(rating);
  showInfo(rating ? `${name} ${rating}` : name, `
    <p>${esc(c[2])}</p>
    ${rating ? `<h3>Rating ${esc(rating)}</h3><p>${esc(rt || 'Unknown rating.')}</p>
      ${rating.includes('+') ? '<p class="muted">The <b>+</b> means it gets worse the longer the fight goes.</p>' : ''}` : ''}
    <p class="info-foot"><button class="linkish" data-action="class-help">See all classes</button></p>`);
}

function showClassHelp() {
  showInfo('PRT classes', `
    <p>The PRT sorts every cape into one or more classes. The number says how dangerous they are in that class.</p>
    <dl class="facts wide">${PRT_CLASSES.map(([n, d]) => `<dt>${n}</dt><dd>${esc(d)}</dd>`).join('')}</dl>
    <h3>The number</h3>${scaleTable()}
    <p class="muted">Tap a class on a cape card for more detail.</p>`);
}

// Generic list editor: add/edit/delete an item in state[section] (or a nested array).
function editItem({ title, list, item, fields, section, defaults = {} }) {
  const isNew = !item;
  openModal({
    title: (isNew ? 'Add ' : 'Edit ') + title,
    fields,
    values: item || defaults,
    onSave: vals => {
      const oldImage = item?.image;
      if (oldImage?.startsWith?.('img:') && 'image' in vals && vals.image !== oldImage && typeof vals.image !== 'object') {
        imgDoc(item.id).delete().catch(console.error);   // picture removed or swapped for a link
      }
      const target = isNew ? { id: uid(), ...defaults, ...vals } : Object.assign(item, vals);
      if (isNew) list.unshift(target);
      if ('image' in vals) storeImage(target);
      save(section);
    },
    onDelete: isNew ? null : () => {
      list.splice(list.indexOf(item), 1);
      if (item.image?.startsWith?.('img:')) imgDoc(item.id).delete().catch(console.error);
      save(section);
    },
  });
}

// ── Field definitions ─────────────────────────────────────────────────────────
const CAPE_FIELDS = [
  { key: 'name', label: 'Cape name' },
  { key: 'image', label: 'Picture', type: 'image' },
  { key: 'affiliation', label: 'Side / gang', type: 'select', options: AFFILIATIONS },
  { key: 'threat', label: 'Threat', type: 'select', options: THREATS.map(t => [t[0], `${t[1]}: ${t[2]}`]) },
  { key: 'classes', label: 'PRT classes and ratings', type: 'ratings', options: PRT_CLASSES.map(c => c[0]) },
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
  { key: 'name', label: 'Upgrade' },
  { key: 'cost', label: 'Cost in cash' },
  { key: 'scrap', label: 'Or scavenge instead' },
  { key: 'days', label: 'Days of work' },
  { key: 'done', label: 'Built', type: 'checkbox' },
  { key: 'notes', label: 'What it does', type: 'textarea' },
];
const STAFF_FIELDS = [
  { key: 'name', label: 'Name' }, { key: 'role', label: 'Job (medic, driver, lookout…)' },
  { key: 'pay', label: 'Pay' }, { key: 'notes', label: 'Notes', type: 'textarea' },
];

// ── Renderers ─────────────────────────────────────────────────────────────────
const threatOf = id => THREATS.find(t => t[0] === id) || THREATS[4];
const empty = text => `<p class="empty">${esc(text)}</p>`;
const addBtn = (action, label) => `<button class="btn primary" data-action="${action}">+ ${esc(label)}</button>`;

function portrait(c) {
  const src = imageSrc(c.image);
  if (src) return `<button class="portrait" data-action="view-image" data-id="${c.id}" aria-label="Bigger picture of ${esc(c.name)}"><img src="${esc(src)}" alt="" loading="lazy"></button>`;
  const loading = c.image?.startsWith?.('img:') && !(c.image in imgCache);
  return `<div class="portrait none ${loading ? 'loading' : ''}" aria-hidden="true">${esc((c.name.replace(/[^A-Za-z]/g, '')[0] || '?').toUpperCase())}</div>`;
}

function renderCapes() {
  loadImages();
  const visible = state.capes.filter(c => gm || !c.hidden);
  const q = capeFilter.q.toLowerCase();
  const list = visible
    .filter(c => !q || [c.name, c.look, c.power, c.notes, c.affiliation, ...c.classes.map(x => x.name)].join(' ').toLowerCase().includes(q))
    .filter(c => !capeFilter.aff || c.affiliation === capeFilter.aff)
    .filter(c => !capeFilter.cls || c.classes.some(x => x.name === capeFilter.cls))
    .filter(c => !capeFilter.met || c.met)
    .sort((a, b) => a.name.localeCompare(b.name));

  const affs = [...new Set(visible.map(c => c.affiliation))].sort();

  return `
    <div class="toolbar">
      <input class="search" id="cape-q" type="search" placeholder="Search capes…" value="${esc(capeFilter.q)}">
      <select id="cape-aff"><option value="">All sides</option>${affs.map(a => `<option ${a === capeFilter.aff ? 'selected' : ''}>${esc(a)}</option>`).join('')}</select>
      <select id="cape-cls"><option value="">All classes</option>${PRT_CLASSES.map(([c]) => `<option ${c === capeFilter.cls ? 'selected' : ''}>${c}</option>`).join('')}</select>
      <label class="toggle"><input type="checkbox" id="cape-met" ${capeFilter.met ? 'checked' : ''}> Met only</label>
      <button class="btn help" data-action="class-help" aria-label="What do the classes mean?">?</button>
      ${addBtn('add-cape', 'Cape')}
    </div>
    <p class="count">${list.length} of ${visible.length} capes</p>
    <div class="grid">
      ${list.map(c => {
        const t = threatOf(c.threat);
        return `
        <article class="card cape threat-${t[0]} ${c.hidden ? 'is-hidden' : ''}" data-action="edit-cape" data-id="${c.id}" tabindex="0">
          <div class="cape-top">
            ${portrait(c)}
            <div class="cape-id">
              <header>
                <h3>${esc(c.name)}</h3>
                <span class="threat">${esc(t[1])}</span>
              </header>
              <div class="meta">
                <span class="aff">${esc(c.affiliation)}</span>
                ${c.met ? '<span class="tag met">Met</span>' : ''}
                ${c.hidden ? '<span class="tag gm">Hidden</span>' : ''}
              </div>
            </div>
          </div>
          ${c.classes.length ? `<div class="chips">${c.classes.map(x =>
            `<button class="chip info" data-action="class-info" data-cls="${esc(x.name)}" data-rating="${esc(x.rating)}" title="What does this mean?">${esc(classLabel(x))} <span class="q">?</span></button>`).join('')}</div>` : ''}
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

const upgradeCost = u => [
  [u.cost, u.scrap && `or ${u.scrap}`].filter(Boolean).join(' '),
  u.days && `${u.days} ${u.days == 1 ? 'day' : 'days'} of work`,
].filter(Boolean).join(' · ');

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
                <b>${esc(u.name)}</b>
                ${upgradeCost(u) ? `<div class="upg-cost">${esc(upgradeCost(u))}</div>` : ''}
                ${u.notes ? `<div class="muted">${nl(u.notes)}</div>` : ''}
              </div>
            </li>`).join('') || `<li>${empty('No upgrades yet. Add your own ideas.')}</li>`}
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
        <section class="column col-${g.key}" data-status="${g.key}">
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
        <h3 class="mt">The number</h3>${scaleTable()}
        <p><button class="linkish" data-action="class-help">More on each class</button></p>
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

// ── Map (zoom and pan) ────────────────────────────────────────────────────────
const MAP_SRC = 'img/brockton-bay.jpg';
const MAP_W = 1920, MAP_H = 1829;
let mapView = null;   // { s, x, y }; kept across tab switches

function renderMap() {
  return `
    <div class="map-wrap">
      <div class="map-view" id="map-view">
        <img id="map-img" src="${MAP_SRC}" width="${MAP_W}" height="${MAP_H}" alt="Map of Brockton Bay" draggable="false">
      </div>
      <div class="map-controls">
        <button class="btn" data-map="in" aria-label="Zoom in">+</button>
        <button class="btn" data-map="out" aria-label="Zoom out">−</button>
        <button class="btn" data-map="fit">Fit</button>
      </div>
      <p class="map-hint muted">Drag to move. Scroll, pinch or double-click to zoom.</p>
    </div>`;
}

function initMap() {
  const view = $('#map-view'), img = $('#map-img');
  const fitScale = () => Math.min(view.clientWidth / MAP_W, view.clientHeight / MAP_H);
  const minScale = () => fitScale() * 0.9;
  const maxScale = 2.5;

  const fit = () => {
    const s = fitScale();
    mapView = { s, x: (view.clientWidth - MAP_W * s) / 2, y: (view.clientHeight - MAP_H * s) / 2 };
  };
  const apply = () => { img.style.transform = `translate(${mapView.x}px, ${mapView.y}px) scale(${mapView.s})`; };
  const zoomAt = (factor, cx, cy) => {
    const s = Math.min(maxScale, Math.max(minScale(), mapView.s * factor));
    const k = s / mapView.s;
    mapView = { s, x: cx - (cx - mapView.x) * k, y: cy - (cy - mapView.y) * k };
    apply();
  };
  const center = () => [view.clientWidth / 2, view.clientHeight / 2];
  const local = e => { const r = view.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };

  if (!mapView) fit();
  apply();

  view.addEventListener('wheel', e => {
    e.preventDefault();
    zoomAt(Math.exp(-e.deltaY * 0.0015), ...local(e));
  }, { passive: false });
  view.addEventListener('dblclick', e => zoomAt(2, ...local(e)));

  // One pointer pans; two pointers pinch.
  const pts = new Map();
  let last = null;
  view.addEventListener('pointerdown', e => {
    view.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, local(e));
    last = null;
  });
  view.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, local(e));
    const p = [...pts.values()];
    if (p.length === 1) {
      if (last) { mapView.x += p[0][0] - last.x; mapView.y += p[0][1] - last.y; apply(); }
      last = { x: p[0][0], y: p[0][1] };
    } else if (p.length === 2) {
      const mx = (p[0][0] + p[1][0]) / 2, my = (p[0][1] + p[1][1]) / 2;
      const d = Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]);
      if (last?.d) {
        mapView.x += mx - last.x; mapView.y += my - last.y;
        zoomAt(d / last.d, mx, my);
      }
      last = { x: mx, y: my, d };
    }
  });
  const up = e => { pts.delete(e.pointerId); last = null; };
  view.addEventListener('pointerup', up);
  view.addEventListener('pointercancel', up);

  document.querySelector('.map-controls').addEventListener('click', e => {
    const b = e.target.closest('[data-map]');
    if (!b) return;
    if (b.dataset.map === 'in') zoomAt(1.5, ...center());
    if (b.dataset.map === 'out') zoomAt(1 / 1.5, ...center());
    if (b.dataset.map === 'fit') { fit(); apply(); }
  });
}

const RENDER = { capes: renderCapes, crew: renderCrew, base: renderBase, funds: renderFunds, jobs: renderJobs, contacts: renderContacts, map: renderMap, log: renderLog, rules: renderRules };

function render() {
  // The map has no synced data; don't rebuild it (and lose the view) on every update.
  if (currentTab === 'map' && $('#map-view')) { $('#crew-title').textContent = state.crew.name || 'Brockton Bay'; return; }
  // Keep the search box focused while typing through a re-render.
  const focusId = document.activeElement?.id;
  const caret = document.activeElement?.selectionStart;
  document.body.classList.toggle('gm', gm);
  $('#crew-title').textContent = state.crew.name || 'Brockton Bay';
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === currentTab));
  $('#main').innerHTML = (RENDER[currentTab] || renderCapes)();
  document.body.classList.toggle('on-map', currentTab === 'map');
  if (currentTab === 'map') initMap();
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
  'view-image':  id => { const c = find(state.capes, id); showInfo(c.name, `<img class="big-portrait" src="${esc(imageSrc(c.image))}" alt="${esc(c.name)}">`); },
  'class-info':  (_, el) => showClassInfo(el.dataset.cls, el.dataset.rating),
  'class-help':  () => showClassHelp(),

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

// ── Job drag and drop ─────────────────────────────────────────────────────────
// Mouse: drag once it moves a few pixels. Touch: hold still for 300 ms, then drag.
let drag = null;
let suppressClick = false;

$('#main').addEventListener('pointerdown', e => {
  const card = e.target.closest('.card.job');
  if (!card || e.button !== 0) return;
  drag = { card, id: card.dataset.id, x: e.clientX, y: e.clientY, pid: e.pointerId, touch: e.pointerType !== 'mouse', active: false };
  if (drag.touch) drag.timer = setTimeout(() => { if (drag && !drag.active) startDrag(); }, 300);
});
window.addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.pid) return;
  if (!drag.active) {
    if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
    if (drag.touch) { clearTimeout(drag.timer); drag = null; return; } // moved before the hold: it's a scroll
    startDrag();
  }
  moveDrag(e.clientX, e.clientY);
});
window.addEventListener('touchmove', e => { if (drag?.active) e.preventDefault(); }, { passive: false });
window.addEventListener('contextmenu', e => { if (drag) e.preventDefault(); });
window.addEventListener('pointerup', e => { if (drag && e.pointerId === drag.pid) endDrag(true); });
window.addEventListener('pointercancel', () => { if (drag) endDrag(false); });
// Dropping a card should not also open it.
window.addEventListener('click', e => { if (suppressClick) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);

function startDrag() {
  drag.active = true;
  const r = drag.card.getBoundingClientRect();
  drag.dx = drag.x - r.left;
  drag.dy = drag.y - r.top;
  drag.ghost = drag.card.cloneNode(true);
  drag.ghost.classList.add('drag-ghost');
  drag.ghost.style.width = r.width + 'px';
  document.body.appendChild(drag.ghost);
  drag.card.classList.add('dragging');
  drag.marker = document.createElement('div');
  drag.marker.className = 'drop-marker';
  document.body.classList.add('is-dragging');
  moveDrag(drag.x, drag.y);
}

function moveDrag(x, y) {
  drag.ghost.style.transform = `translate(${x - drag.dx}px, ${y - drag.dy}px)`;
  const col = document.elementFromPoint(x, y)?.closest('.column[data-status]');
  document.querySelectorAll('.column.drop-on').forEach(c => { if (c !== col) c.classList.remove('drop-on'); });
  drag.col = col || null;
  if (!col) { drag.marker.remove(); return; }
  col.classList.add('drop-on');
  const before = [...col.querySelectorAll('.card.job:not(.dragging)')]
    .find(c => { const r = c.getBoundingClientRect(); return y < r.top + r.height / 2; });
  if (before) col.insertBefore(drag.marker, before); else col.appendChild(drag.marker);
  drag.before = before?.dataset.id || null;
  if (y < 60) window.scrollBy(0, -14);
  else if (y > innerHeight - 60) window.scrollBy(0, 14);
}

function endDrag(drop) {
  const d = drag;
  drag = null;
  clearTimeout(d.timer);
  if (!d.active) return;
  suppressClick = true;
  setTimeout(() => { suppressClick = false; }, 0);
  d.ghost.remove();
  d.marker.remove();
  d.card.classList.remove('dragging');
  document.body.classList.remove('is-dragging');
  document.querySelectorAll('.column.drop-on').forEach(c => c.classList.remove('drop-on'));
  const job = find(state.jobs, d.id);
  if (!drop || !d.col || !job) return;
  job.status = d.col.dataset.status;
  state.jobs.splice(state.jobs.indexOf(job), 1);
  let at = d.before ? state.jobs.findIndex(j => j.id === d.before) : -1;
  if (at < 0) at = state.jobs.map(j => j.status || 'lead').lastIndexOf(job.status) + 1;
  state.jobs.splice(at, 0, job);
  save('jobs');
}

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
