/* FitForge — интерфейс приложения. */

/* ================= Утилиты ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseYmd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const today = () => ymd(new Date());
const weekStart = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
const fmtDate = (s, o = { day: 'numeric', month: 'long' }) => parseYmd(s).toLocaleDateString('ru-RU', o);
const fmtDay = s => {
  if (s === today()) return 'Сегодня';
  if (s === ymd(addDays(new Date(), 1))) return 'Завтра';
  if (s === ymd(addDays(new Date(), -1))) return 'Вчера';
  return fmtDate(s, { weekday: 'short', day: 'numeric', month: 'short' });
};
const fmtTime = sec => { sec = Math.max(0, Math.round(sec)); const m = Math.floor(sec / 60), s = sec % 60; return m >= 60 ? `${Math.floor(m / 60)}:${pad(m % 60)}:${pad(s)}` : `${pad(m)}:${pad(s)}`; };
const plural = (n, a, b, c) => { const m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 12 || h > 14) ? b : c; };
const WD = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const wdIndex = d => (d.getDay() + 6) % 7; // 0 = Пн

const ICONS = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  build: '<path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/>',
  swap: '<path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
  check: '<path d="M4 12l5 5L20 6"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  next: '<path d="M9 5l7 7-7 7"/>',
  book: '<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  flame: '<path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-4-1-6 1-9z"/>',
  save: '<path d="M5 3h11l3 3v15H5zM8 3v5h7M8 21v-7h8v7"/>',
  repeat: '<path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"/>',
};
const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

/* ================= Состояние ================= */
const KEY = 'fitforge_v1';
const defaults = () => ({
  v: 1,
  onboarded: false,
  profile: { name: '', sex: 'm', age: 30, height: 175, weight: 75, level: 1, goal: 'health', days: [0, 2, 4], duration: 45, limits: [], noJumps: false, focus: [] },
  inventory: ['mat'],
  workouts: [],
  templates: [],
  bodyweight: [],
  active: null,
  settings: { sound: true, fig: 'live', skin: 'frog' },
});
let S = load();
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && s.v === 1) { const d = defaults(); return { ...d, ...s, profile: { ...d.profile, ...s.profile }, settings: { ...d.settings, ...s.settings } }; }
  } catch (e) { /* пусто или повреждено */ }
  return defaults();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Не удалось сохранить данные'); }
}

const ui = {
  tab: 'home', ob: 0,
  cal: weekStart(new Date()), calSel: today(),
  builder: { type: 'full', dur: null, loc: 'home', warm: true, cool: true },
  draft: null,
  lib: { q: '', g: 'all', avail: true },
  progEx: null,
};
ui.cal = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

const P = () => S.profile;
const wById = id => S.workouts.find(w => w.id === id);
const invFor = loc => (LOCATIONS[loc] && LOCATIONS[loc].eq) || S.inventory;

/* ================= Общие компоненты ================= */
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2200);
}

// Lite-версия: без 3D — везде готовые анимации персонажа (картинки), крупные просто больше.
function mountFigures() {}

// Персонаж: лягушка (по умолчанию) или человек — выбирается в профиле
const SKIN_NAMES = { frog: 'Лягушка', human: 'Человек' };
const skin = () => (S.settings.skin === 'human' ? 'human' : 'frog');

// Превью: 12 кадров с персонажем, проигрываются CSS-анимацией. Кадры лежат листами:
// thumbs/<персонаж>-<N>.webp — по 8 упражнений (строки) в порядке EXERCISES. Показываем нужную строку.
const SHEET_ROWS = 8;
function sprite(exId, cls = '', sk = skin()) {
  const ex = EX[exId];
  const d = ex ? Figure.period(ex.anim).toFixed(2) : '1.4';
  const idx = Math.max(0, EXERCISES.indexOf(ex));
  const sheet = Math.floor(idx / SHEET_ROWS), row = idx % SHEET_ROWS;
  const rows = Math.min(SHEET_ROWS, EXERCISES.length - sheet * SHEET_ROWS);
  return `<div class="spr ${cls}" data-spr="${exId}"><img src="thumbs/${sk}-${sheet}.webp" alt="" loading="lazy" decoding="async" style="animation-duration:${d}s;height:${rows * 100}%;top:-${row * 100}%"></div>`;
}
const fig = (exId, cls = '') => /\bbig\b/.test(cls)
  ? `<div class="fig ${cls}" data-ex="${exId}">${sprite(exId)}</div>`
  : sprite(exId, cls);

// Если превью не загрузилось (нет файла и нет сети) — рисуем запасную 2D-фигурку
document.addEventListener('error', e => {
  const img = e.target;
  if (!(img instanceof HTMLImageElement) || !img.parentElement || !img.parentElement.matches('.spr')) return;
  const box = img.parentElement;
  Figure.mount(box, EX[box.dataset.spr], { inventory: S.inventory });
}, true);

function prescText(it) {
  const ex = EX[it.ex];
  const uni = ex && ex.uni ? ' на сторону' : '';
  const work = it.time ? `${it.time} с` : (it.rmin === it.rmax ? `${it.rmax}` : `${it.rmin}–${it.rmax}`);
  const sets = it.sets > 1 ? `${it.sets} × ${work}` : work;
  return `${sets}${uni}${it.rest > 10 && it.sets > 1 ? ` · отдых ${it.rest} с` : ''}`;
}

function eqText(ex) {
  if (!ex.eq.length) return 'Без инвентаря';
  return ex.eq.map(g => g.map(id => (EQUIPMENT.find(e => e.id === id) || {}).name || id).join(' / ')).join(' + ');
}

function workoutMeta(w) {
  const main = w.items.filter(i => i.sec === 'main').length;
  return `${main} ${plural(main, 'упражнение', 'упражнения', 'упражнений')} · ~${Gen.estimateMin(w.items)} мин`;
}

function groupsOf(w) {
  const g = new Set(w.items.filter(i => i.sec === 'main').map(i => EX[i.ex] && EX[i.ex].group).filter(x => x && x !== 'mobility'));
  return [...g].map(x => GROUPS[x]).slice(0, 3).join(', ');
}

/* ---- Bottom sheet со стеком ---- */
const sheets = [];
function openSheet(renderFn, opts = {}) {
  sheets.push({ renderFn, opts });
  drawSheet();
}
function drawSheet() {
  let host = $('#sheet');
  if (!sheets.length) {
    if (host) { host.classList.remove('open'); setTimeout(() => { if (!sheets.length && host) host.remove(); }, 250); }
    if (!$('#player')) document.body.classList.remove('no-scroll');
    return;
  }
  if (!host) {
    host = document.createElement('div');
    host.id = 'sheet';
    host.innerHTML = '<div class="sheet-backdrop" data-act="sheet-close"></div><div class="sheet-panel" role="dialog" aria-modal="true"></div>';
    document.body.appendChild(host);
  }
  if (!host.classList.contains('open')) requestAnimationFrame(() => requestAnimationFrame(() => host.classList.add('open')));
  document.body.classList.add('no-scroll');
  const top = sheets[sheets.length - 1];
  const panel = $('.sheet-panel', host);
  panel.innerHTML = `<div class="sheet-grab"></div>
    <div class="sheet-head">${sheets.length > 1 ? `<button class="icon-btn" data-act="sheet-back" aria-label="Назад">${icon('back')}</button>` : '<span></span>'}
    <div class="sheet-title">${esc(top.opts.title || '')}</div>
    <button class="icon-btn" data-act="sheet-close" aria-label="Закрыть">${icon('x')}</button></div>
    <div class="sheet-body">${top.renderFn()}</div>`;
  panel.scrollTop = 0;
  mountFigures(panel);
  top.opts.onMount && top.opts.onMount(panel);
}
function closeSheet(all = true) { if (all) sheets.length = 0; else sheets.pop(); drawSheet(); }
function refreshSheet() { if (sheets.length) drawSheet(); }

function confirmSheet(text, okLabel, onOk, danger = true) {
  openSheet(() => `<p class="lead">${esc(text)}</p>
    <div class="row gap"><button class="btn ghost grow" data-act="sheet-close">Отмена</button>
    <button class="btn ${danger ? 'danger' : 'primary'} grow" data-act="confirm-ok">${esc(okLabel)}</button></div>`, { title: 'Подтверждение' });
  ui._confirm = onOk;
}

/* ================= Графики (SVG) ================= */
function barChart(data, { h = 150, unit = '' } = {}) {
  const W = 320, pt = 18, pb = 22, n = data.length;
  const max = Math.max(1, ...data.map(d => d.v));
  const bw = (W - 8) / n, inner = Math.max(6, bw - 8);
  let s = `<svg class="chart" viewBox="0 0 ${W} ${h}" role="img">`;
  for (let i = 0; i <= 2; i++) { const y = pt + (h - pt - pb) * i / 2; s += `<line class="grid" x1="0" x2="${W}" y1="${y}" y2="${y}"/>`; }
  data.forEach((d, i) => {
    const bh = (h - pt - pb) * d.v / max, x = 4 + i * bw + (bw - inner) / 2, y = h - pb - bh;
    if (d.v > 0) s += `<path class="bar${d.cur ? ' cur' : ''}" d="${roundTop(x, y, inner, bh, 4)}"/>`;
    s += `<rect class="hit" x="${4 + i * bw}" y="${pt}" width="${bw}" height="${h - pt - pb}" data-tip="${esc(d.tip || `${d.label}: ${d.v}${unit}`)}"/>`;
    if (d.showVal && d.v > 0) s += `<text class="val" x="${x + inner / 2}" y="${y - 5}" text-anchor="middle">${d.v}</text>`;
    s += `<text class="lbl" x="${x + inner / 2}" y="${h - 6}" text-anchor="middle">${esc(d.label)}</text>`;
  });
  return s + '</svg>';
}
function roundTop(x, y, w, h, r) {
  r = Math.min(r, h, w / 2);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}
function hbarChart(data) {
  const max = Math.max(1, ...data.map(d => d.v));
  return `<div class="hbars">${data.map(d => `<div class="hbar-row" data-tip="${esc(d.label)}: ${d.v} ${plural(d.v, 'подход', 'подхода', 'подходов')}">
    <span class="hbar-lbl">${esc(d.label)}</span><span class="hbar-track"><span class="hbar-fill" style="width:${d.v / max * 100}%"></span></span><span class="hbar-val">${d.v}</span></div>`).join('')}</div>`;
}
function lineChart(pts, { h = 160, unit = '' } = {}) {
  if (pts.length < 2) return `<div class="empty small">${pts.length ? `Одна запись: ${pts[0].v}${unit}. Нужно минимум две для графика.` : 'Пока нет данных'}</div>`;
  const W = 320, pl = 34, pr = 10, pt = 14, pb = 22;
  const vs = pts.map(p => p.v);
  let lo = Math.min(...vs), hi = Math.max(...vs);
  if (hi - lo < 1) { hi += 1; lo -= 1; }
  const padv = (hi - lo) * 0.15; lo -= padv; hi += padv;
  const X = i => pl + (W - pl - pr) * i / (pts.length - 1);
  const Y = v => pt + (h - pt - pb) * (1 - (v - lo) / (hi - lo));
  let s = `<svg class="chart" viewBox="0 0 ${W} ${h}" role="img">`;
  [hi - padv, (hi + lo) / 2, lo + padv].forEach(v => {
    s += `<line class="grid" x1="${pl}" x2="${W - pr}" y1="${Y(v)}" y2="${Y(v)}"/><text class="lbl" x="${pl - 6}" y="${Y(v) + 4}" text-anchor="end">${+v.toFixed(1)}</text>`;
  });
  s += `<polyline class="line" points="${pts.map((p, i) => `${X(i)},${Y(p.v)}`).join(' ')}"/>`;
  pts.forEach((p, i) => {
    const last = i === pts.length - 1;
    s += `<circle class="dot${last ? ' cur' : ''}" cx="${X(i)}" cy="${Y(p.v)}" r="${last ? 4.5 : 3}"/>`;
    s += `<circle class="hit" cx="${X(i)}" cy="${Y(p.v)}" r="14" data-tip="${esc(p.label)}: ${p.v}${unit}"/>`;
  });
  const lastP = pts[pts.length - 1];
  s += `<text class="val" x="${X(pts.length - 1)}" y="${Y(lastP.v) - 9}" text-anchor="end">${lastP.v}${unit}</text>`;
  s += `<text class="lbl" x="${pl}" y="${h - 5}">${esc(pts[0].label)}</text><text class="lbl" x="${W - pr}" y="${h - 5}" text-anchor="end">${esc(lastP.label)}</text>`;
  return s + '</svg>';
}

/* ================= Статистика ================= */
function doneWorkouts() { return S.workouts.filter(w => w.status === 'done').sort((a, b) => a.date < b.date ? 1 : -1); }
function volumeOf(w) {
  if (!w.log) return 0;
  let v = 0;
  w.log.forEach(sets => sets && sets.forEach(s => { if (s.done && s.w > 0) v += s.w * (s.reps || 0); }));
  return Math.round(v);
}
function weekStreak() {
  const weeks = new Set(doneWorkouts().map(w => ymd(weekStart(parseYmd(w.date)))));
  let n = 0, d = weekStart(new Date());
  if (!weeks.has(ymd(d))) d = addDays(d, -7);
  while (weeks.has(ymd(d))) { n++; d = addDays(d, -7); }
  return n;
}
function weekStats() {
  const ws = ymd(weekStart(new Date())), we = ymd(addDays(weekStart(new Date()), 6));
  const inWeek = S.workouts.filter(w => w.date >= ws && w.date <= we);
  return { done: inWeek.filter(w => w.status === 'done').length, total: inWeek.length };
}

/* ================= Экраны ================= */
const VIEWS = {};

/* ---------- Онбординг ---------- */
VIEWS.onboard = () => {
  const p = P();
  const steps = [
    () => `<div class="hero">
      <div class="hero-logo">${icon('build')}</div>
      <h1>Fit<span class="grad-text">Forge</span></h1>
      <p class="lead">Тренировки, собранные под ваш инвентарь, цели и самочувствие</p>
      <div class="features">
        ${[['bolt', 'Подбор упражнений за секунду'], ['cal', 'Календарь и план на недели'], ['chart', 'Прогресс, веса и рекорды'], ['user', 'Анимированная техника 48 упражнений']]
          .map(([i, t]) => `<div class="feature"><span class="ic-badge">${icon(i)}</span>${t}</div>`).join('')}
      </div>
      <button class="btn primary block big" data-act="ob-next">Начать</button>
      <p class="muted small center">Всё хранится только на вашем телефоне</p></div>`,
    () => `<h2>О вас</h2><p class="muted">От этого зависят объём, интенсивность и выбор упражнений.</p>${personalFields()}`,
    () => `<h2>Цель и уровень</h2>${goalFields()}`,
    () => `<h2>Инвентарь</h2><p class="muted">Отметьте, что есть дома. В конструкторе можно выбрать и «Зал».</p>${inventoryFields()}
      <h2 class="mt">Ограничения</h2><p class="muted">Упражнения с нагрузкой на эти зоны будут исключены.</p>${limitFields()}`,
    () => `<h2>График</h2><p class="muted">В какие дни удобно тренироваться?</p>${daysFields()}
      <div class="card mt"><b>Готово, ${esc(p.name || 'атлет')}!</b><p class="muted">Составим план на 4 недели по вашему графику. Его можно менять в календаре.</p></div>
      <button class="btn primary block" data-act="ob-finish" data-plan="1">Составить план и начать</button>
      <button class="btn ghost block" data-act="ob-finish">Пропустить, просто осмотреться</button>`,
  ];
  const i = Math.min(ui.ob, steps.length - 1);
  return `<div class="onboard">
    ${i > 0 ? `<div class="ob-top"><button class="icon-btn" data-act="ob-back" aria-label="Назад">${icon('back')}</button>
      <div class="dots">${steps.slice(1).map((_, k) => `<span class="${k + 1 <= i ? 'on' : ''}"></span>`).join('')}</div><span></span></div>` : ''}
    ${steps[i]()}
    ${i > 0 && i < steps.length - 1 ? '<button class="btn primary block mt" data-act="ob-next">Далее</button>' : ''}
  </div>`;
};

function personalFields() {
  const p = P();
  return `<div class="form">
    <label class="field"><span>Имя</span><input type="text" data-field="name" value="${esc(p.name)}" placeholder="Как к вам обращаться" autocomplete="given-name"></label>
    <div class="field"><span>Пол</span><div class="seg">${[['m', 'Мужской'], ['f', 'Женский']].map(([v, t]) => `<button class="${p.sex === v ? 'on' : ''}" data-act="set-field" data-field="sex" data-val="${v}">${t}</button>`).join('')}</div></div>
    <div class="grid3">
      <label class="field"><span>Возраст</span><input type="number" inputmode="numeric" min="12" max="99" data-field="age" data-num value="${p.age}"></label>
      <label class="field"><span>Рост, см</span><input type="number" inputmode="numeric" min="120" max="230" data-field="height" data-num value="${p.height}"></label>
      <label class="field"><span>Вес, кг</span><input type="number" inputmode="decimal" min="30" max="250" step="0.1" data-field="weight" data-num value="${p.weight}"></label>
    </div></div>`;
}
function goalFields() {
  const p = P();
  const lvlDesc = { 1: 'Тренируюсь меньше 6 месяцев или после перерыва', 2: 'Регулярно 6–24 месяца, знаю технику базы', 3: 'Больше 2 лет, работаю с весами уверенно' };
  return `<div class="field"><span>Цель</span><div class="chips">${Object.entries(GOALS).map(([k, v]) => `<button class="chip ${p.goal === k ? 'on' : ''}" data-act="set-field" data-field="goal" data-val="${k}">${v}</button>`).join('')}</div></div>
    <div class="field"><span>Уровень подготовки</span><div class="options">${Object.entries(LEVELS).map(([k, v]) => `<button class="option ${p.level == k ? 'on' : ''}" data-act="set-field" data-field="level" data-val="${k}" data-num><b>${v}</b><small>${lvlDesc[k]}</small></button>`).join('')}</div></div>
    <div class="field"><span>Длительность тренировки</span><div class="chips">${[20, 30, 45, 60, 75].map(m => `<button class="chip ${p.duration === m ? 'on' : ''}" data-act="set-field" data-field="duration" data-val="${m}" data-num>${m} мин</button>`).join('')}</div></div>
    <div class="field"><span>Приоритетные зоны <small class="muted">(необязательно)</small></span><div class="chips">${['legs', 'chest', 'back', 'shoulders', 'arms', 'core'].map(g => `<button class="chip ${p.focus.includes(g) ? 'on' : ''}" data-act="toggle-arr" data-arr="focus" data-val="${g}">${GROUPS[g]}</button>`).join('')}</div></div>`;
}
function inventoryFields() {
  return `<div class="checks">${EQUIPMENT.map(e => `<button class="check ${S.inventory.includes(e.id) ? 'on' : ''}" data-act="toggle-inv" data-val="${e.id}"><span class="box">${icon('check')}</span>${e.name}</button>`).join('')}</div>`;
}
function limitFields() {
  const p = P();
  return `<div class="checks">${Object.entries(LIMITS).map(([k, v]) => `<button class="check ${p.limits.includes(k) ? 'on' : ''}" data-act="toggle-arr" data-arr="limits" data-val="${k}"><span class="box">${icon('check')}</span>${v}</button>`).join('')}
    <button class="check ${p.noJumps ? 'on' : ''}" data-act="set-field" data-field="noJumps" data-val="${p.noJumps ? '' : '1'}" data-bool><span class="box">${icon('check')}</span>Без прыжков</button></div>`;
}
function daysFields() {
  const p = P();
  return `<div class="days">${WD.map((d, i) => `<button class="${p.days.includes(i) ? 'on' : ''}" data-act="toggle-arr" data-arr="days" data-val="${i}" data-num>${d}</button>`).join('')}</div>
    <p class="muted small">${p.days.length} ${plural(p.days.length, 'тренировка', 'тренировки', 'тренировок')} в неделю · сплит: ${Gen.rotation(p.days.length || 1, p.goal).map(t => WORKOUT_TYPES[t].name).join(' → ')}</p>`;
}

/* ---------- Главная ---------- */
VIEWS.home = () => {
  const p = P(), t = today();
  const h = new Date().getHours();
  const greet = h < 5 ? 'Доброй ночи' : h < 12 ? 'Доброе утро' : h < 18 ? 'Добрый день' : 'Добрый вечер';
  const todays = S.workouts.filter(w => w.date === t);
  const planned = todays.filter(w => w.status !== 'done');
  const doneToday = todays.filter(w => w.status === 'done');
  const upcoming = S.workouts.filter(w => w.status !== 'done' && w.date > t).sort((a, b) => a.date < b.date ? -1 : 1).slice(0, 3);
  const ws = weekStats();
  const missed = S.workouts.filter(w => w.status !== 'done' && w.date < t && w.date >= ymd(addDays(new Date(), -7)));

  const firstMain = w => (w.items.find(i => i.sec === 'main') || w.items[0] || { ex: 'squat' }).ex;
  const metaPills = w => `<div class="pills">
    <span class="pill">${icon('clock')}~${Gen.estimateMin(w.items)} мин</span>
    <span class="pill">${icon('bolt')}${w.items.filter(i => i.sec === 'main').length} упр.</span></div>`;
  let main;
  if (planned.length) {
    const w = planned[0];
    main = `<div class="card hero-card">
      <div class="hero-text">
        <div class="eyebrow">Сегодня по плану</div>
        <h2>${esc(w.title)}</h2>
        ${metaPills(w)}
        ${groupsOf(w) ? `<p class="muted small">${groupsOf(w)}</p>` : ''}
      </div>
      <div class="hero-actions"><button class="btn primary grow" data-act="start" data-id="${w.id}">${icon('play')} Начать</button>
      <button class="btn ghost" data-act="view-w" data-id="${w.id}">Подробнее</button></div></div>`;
  } else if (doneToday.length) {
    const w = doneToday[0];
    main = `<div class="card hero-card">
      <div class="hero-text">
        <div class="eyebrow">${icon('check')} Сегодня выполнено</div>
        <h2>${esc(w.title)}</h2>
        <div class="pills"><span class="pill">${icon('clock')}${fmtTime(w.durationSec || 0)}</span>${volumeOf(w) ? `<span class="pill accent">${volumeOf(w)} кг</span>` : ''}</div>
      </div>
      <div class="hero-actions"><button class="btn ghost grow" data-act="view-w" data-id="${w.id}">Результаты</button>
      <button class="btn ghost grow" data-act="quick">Ещё одна</button></div></div>`;
  } else {
    main = `<div class="card hero-card rest">
      <div class="hero-text">
        <div class="eyebrow">Сегодня</div>
        <h2>День отдыха</h2>
        <p class="muted small">Восстановление — тоже часть прогресса. Есть силы? Соберу тренировку за секунду.</p>
      </div>
      <div class="hero-actions"><button class="btn primary grow" data-act="quick">${icon('bolt')} Быстрая тренировка</button></div></div>`;
  }

  const wsDate = weekStart(new Date());
  const strip = WD.map((d, i) => {
    const ds = ymd(addDays(wsDate, i));
    const ws_ = S.workouts.filter(w => w.date === ds);
    const st = ws_.some(w => w.status === 'done') ? 'done' : ws_.length ? (ds < t ? 'missed' : 'plan') : '';
    return `<button class="strip-day ${ds === t ? 'today' : ''} ${st}" data-act="cal-go" data-date="${ds}"><small>${d}</small><b>${parseYmd(ds).getDate()}</b><i></i></button>`;
  }).join('');
  const goal = ws.total || p.days.length || 1;
  const C = 2 * Math.PI * 24, frac = Math.min(1, ws.done / goal);
  const streak = weekStreak();

  const hasPlan = S.workouts.some(w => w.date >= t);
  return `<header class="top"><div><div class="kicker">${new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
    <h1>${greet}${p.name ? `, <span class="grad-text">${esc(p.name)}</span>` : ''}</h1></div>
    <button class="avatar" data-act="tab" data-tab="profile" aria-label="Профиль">${esc((p.name || 'А')[0].toUpperCase())}</button></header>
    ${S.active ? `<button class="banner" data-act="resume">${icon('play')}<span><b>Тренировка не завершена</b><small>Нажмите, чтобы продолжить</small></span></button>` : ''}
    ${main}
    <div class="card week-card">
      <div class="week-head">
        <div class="ring-sm"><svg viewBox="0 0 56 56"><circle class="bg" cx="28" cy="28" r="24"/><circle class="fg" cx="28" cy="28" r="24" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - frac)}"/></svg><span>${ws.done}/${goal}</span></div>
        <div class="grow"><b>Эта неделя</b><div class="muted small">${ws.done >= goal ? 'Цель недели выполнена!' : `Осталось ${goal - ws.done} ${plural(goal - ws.done, 'тренировка', 'тренировки', 'тренировок')}`}</div></div>
        <button class="icon-btn soft" data-act="tab" data-tab="cal" aria-label="Календарь">${icon('cal')}</button>
      </div>
      <div class="strip">${strip}</div>
    </div>
    <div class="stats3">
      <div class="stat"><div class="stat-ic">${icon('flame')}</div><b>${streak}</b><span>${plural(streak, 'неделя', 'недели', 'недель')} подряд</span></div>
      <div class="stat"><div class="stat-ic">${icon('check')}</div><b>${doneWorkouts().length}</b><span>тренировок</span></div>
      <div class="stat"><div class="stat-ic">${icon('clock')}</div><b>${Math.round(doneWorkouts().reduce((s, w) => s + (w.durationSec || 0), 0) / 60)}</b><span>минут</span></div>
    </div>
    ${missed.length ? `<div class="card warn-card"><b>Пропущено: ${missed.length}</b><p class="muted small">Можно перенести на сегодня или удалить в календаре.</p>
      <button class="btn ghost small" data-act="move-missed">Перенести ближайшую на сегодня</button></div>` : ''}
    ${!hasPlan ? `<div class="card"><div class="card-title">Плана пока нет</div><p class="muted small">Составлю тренировки на 4 недели по вашим дням: ${p.days.map(i => WD[i]).join(', ') || 'не выбраны'}.</p>
      <button class="btn primary block" data-act="plan-open">${icon('cal')} Составить план</button></div>` : ''}
    ${upcoming.length ? `<div class="section">Ближайшие <small>${S.workouts.filter(w => w.status !== 'done' && w.date > t).length} в плане</small></div><div class="list">${upcoming.map(w => `<button class="list-row" data-act="view-w" data-id="${w.id}">
      ${sprite(firstMain(w), 'mini')}<span class="grow"><b>${esc(w.title)}</b><small>${fmtDay(w.date)} · ${workoutMeta(w)}</small></span>${icon('next')}</button>`).join('')}</div>` : ''}
    <button class="card link-card lib-promo" data-act="library">
      <span class="stack">${['pushup', 'squat', 'pullup'].map(id => sprite(id)).join('')}</span>
      <span class="grow"><b>Библиотека</b><small>${EXERCISES.length} упражнений с анимацией</small></span>${icon('next')}</button>`;
};

/* ---------- Конструктор ---------- */
VIEWS.build = () => {
  if (ui.draft) return draftView();
  const b = ui.builder, p = P();
  const dur = b.dur || p.duration;
  const inv = invFor(b.loc);
  const avail = EXERCISES.filter(e => Gen.hasEq(e, inv) && Gen.allowed(e, p) && e.lvl <= p.level).length;
  const art = { full: 'burpee', upper: 'pushup', lower: 'lunge', push: 'dbpress', pull: 'pullup', core: 'plank', hiit: 'jumpingjack', mobility: 'hamstretch' };
  const short = { full: 'Всё тело', upper: 'Верх', lower: 'Низ', push: 'Жимы', pull: 'Тяги', core: 'Кор', hiit: 'HIIT', mobility: 'Растяжка' };
  return `<header class="top"><div><div class="kicker">Конструктор</div><h1>Соберём <span class="grad-text">тренировку</span></h1></div></header>
    <div class="card">
      <div class="field"><span>Тип тренировки</span><div class="type-grid">${Object.keys(WORKOUT_TYPES).map(k => `<button class="type-tile ${b.type === k ? 'on' : ''}" data-act="b-set" data-k="type" data-val="${k}" title="${WORKOUT_TYPES[k].name}">${sprite(art[k])}${short[k]}</button>`).join('')}</div></div>
      <div class="field"><span>Длительность, минут</span><div class="seg">${[15, 20, 30, 45, 60, 75].map(m => `<button class="${dur === m ? 'on' : ''}" data-act="b-set" data-k="dur" data-val="${m}" data-num>${m}</button>`).join('')}</div></div>
      <div class="field"><span>Где тренируетесь</span><div class="chips">${Object.entries(LOCATIONS).map(([k, v]) => `<button class="chip ${b.loc === k ? 'on' : ''}" data-act="b-set" data-k="loc" data-val="${k}">${v.name}</button>`).join('')}</div>
        <small class="muted">${b.loc === 'home' ? `Ваш инвентарь: ${S.inventory.filter(x => x !== 'mat').map(id => EQUIPMENT.find(e => e.id === id).name.toLowerCase()).join(', ') || 'только вес тела'}. ` : ''}Доступно упражнений: ${avail}</small></div>
      <div class="toggles">
        <button class="toggle ${b.warm ? 'on' : ''}" data-act="b-set" data-k="warm" data-val="${b.warm ? '' : '1'}" data-bool><i></i>Разминка</button>
        <button class="toggle ${b.cool ? 'on' : ''}" data-act="b-set" data-k="cool" data-val="${b.cool ? '' : '1'}" data-bool><i></i>Заминка</button>
      </div>
      <div class="muted small">Учитывается: ${LEVELS[p.level].toLowerCase()}, цель «${GOALS[p.goal].toLowerCase()}»${p.limits.length ? ', бережём: ' + p.limits.map(l => LIMITS[l].toLowerCase()).join(', ') : ''}${Gen.lowImpact(p) ? ', без прыжков' : ''}.</div>
      <button class="btn primary block big mt" data-act="generate">${icon('bolt')} Подобрать тренировку</button>
    </div>
    <div class="row gap">
      <button class="card link-card grow" data-act="plan-open"><span class="ic-badge">${icon('cal')}</span><span class="grow"><b>План</b><small>на недели</small></span></button>
      <button class="card link-card grow" data-act="draft-empty"><span class="ic-badge">${icon('plus')}</span><span class="grow"><b>С нуля</b><small>вручную</small></span></button>
    </div>
    <div class="section">Мои шаблоны</div>
    ${S.templates.length ? `<div class="list">${S.templates.map(t => `<div class="list-row">
      <button class="grow plain" data-act="tpl-load" data-id="${t.id}"><b>${esc(t.title)}</b><small>${workoutMeta(t)}</small></button>
      <button class="icon-btn" data-act="tpl-del" data-id="${t.id}" aria-label="Удалить шаблон">${icon('trash')}</button></div>`).join('')}</div>`
    : '<div class="empty small">Сохраняйте удачные тренировки как шаблоны, чтобы повторять их в один тап.</div>'}`;
};

function draftView() {
  const d = ui.draft;
  const secs = [['warm', 'Разминка'], ['main', 'Основная часть'], ['cool', 'Заминка']];
  const item = (it, idx) => {
    const ex = EX[it.ex];
    const hint = ex.weighted && it.sec === 'main' ? Gen.suggestWeight(it.ex, it, S.workouts) : null;
    return `<div class="ex-card">
      <button class="plain ex-fig" data-act="ex-info" data-ex="${it.ex}" aria-label="Техника: ${esc(ex.name)}">${fig(it.ex, 'thumb')}</button>
      <div class="ex-body">
        <button class="plain ex-name" data-act="ex-info" data-ex="${it.ex}">${esc(ex.name)}</button>
        <div class="pills"><span class="pill accent">${it.sets > 1 ? it.sets + ' × ' : ''}${it.time ? it.time + ' с' : (it.rmin === it.rmax ? it.rmax : it.rmin + '–' + it.rmax)}${ex.uni ? ' / сторона' : ''}</span>${it.rest > 10 && it.sets > 1 ? `<span class="pill">${icon('clock')}${it.rest} с</span>` : ''}</div>
        ${hint ? `<div class="hint">${hint.up ? '↑ ' : ''}${hint.w} кг${hint.up ? ' — можно прибавить' : ' — как в прошлый раз'}</div>` : ''}
        <div class="ex-actions">
          <button class="icon-btn sm" data-act="d-swap" data-i="${idx}" aria-label="Заменить">${icon('swap')}</button>
          <button class="icon-btn sm" data-act="d-edit" data-i="${idx}" aria-label="Изменить подходы">${icon('edit')}</button>
          <button class="icon-btn sm" data-act="d-move" data-i="${idx}" data-dir="-1" aria-label="Выше">${icon('up')}</button>
          <button class="icon-btn sm" data-act="d-move" data-i="${idx}" data-dir="1" aria-label="Ниже">${icon('down')}</button>
          <button class="icon-btn sm" data-act="d-del" data-i="${idx}" aria-label="Удалить">${icon('x')}</button>
        </div>
      </div></div>`;
  };
  return `<header class="top"><button class="icon-btn" data-act="d-close" aria-label="Назад">${icon('back')}</button>
    <div class="grow"><input class="title-input" data-act-input="d-title" value="${esc(d.title)}" aria-label="Название тренировки">
    <div class="muted small">${d.items.length ? workoutMeta(d) : 'Добавьте упражнения'}${d.date ? ' · ' + fmtDay(d.date) : ''}</div></div></header>
    ${secs.map(([k, name]) => {
      const list = d.items.map((it, i) => [it, i]).filter(([it]) => it.sec === k);
      if (!list.length && k !== 'main') return '';
      return `<div class="section">${name} <small>${list.length}</small></div>${list.map(([it, i]) => item(it, i)).join('') || '<div class="empty small">Пусто</div>'}`;
    }).join('')}
    <button class="btn ghost block" data-act="library" data-pick="1">${icon('plus')} Добавить упражнение</button>
    ${d.type && !d.editingId ? `<button class="btn ghost block" data-act="regenerate">${icon('repeat')} Подобрать заново</button>` : ''}
    <div class="sticky-actions">
      ${d.editingId ? `<button class="btn primary grow" data-act="d-update">${icon('save')} Сохранить</button>`
      : `<button class="btn primary grow" data-act="d-start">${icon('play')} Начать</button>
        <button class="btn ghost" data-act="d-plan">${icon('cal')}</button>
        <button class="btn ghost" data-act="d-tpl">${icon('save')}</button>`}
    </div>`;
}

/* ---------- Календарь ---------- */
VIEWS.cal = () => {
  const m = ui.cal, t = today();
  const first = new Date(m.getFullYear(), m.getMonth(), 1);
  const start = addDays(first, -wdIndex(first));
  const byDate = {};
  S.workouts.forEach(w => (byDate[w.date] = byDate[w.date] || []).push(w));
  let cells = '';
  for (let i = 0; i < 42; i++) {
    const d = addDays(start, i), ds = ymd(d);
    if (i >= 35 && d.getMonth() !== m.getMonth()) break;
    const list = byDate[ds] || [];
    const dots = list.slice(0, 3).map(w => `<i class="${w.status === 'done' ? 'done' : ds < t ? 'missed' : 'plan'}"></i>`).join('');
    cells += `<button class="cal-cell ${d.getMonth() !== m.getMonth() ? 'other' : ''} ${ds === t ? 'today' : ''} ${ds === ui.calSel ? 'sel' : ''}" data-act="cal-sel" data-date="${ds}">
      <span>${d.getDate()}</span><span class="cal-dots">${dots}</span></button>`;
  }
  const sel = (byDate[ui.calSel] || []);
  return `<header class="top"><div><div class="kicker">План и история</div><h1>Календарь</h1></div>
    <button class="btn ghost small" data-act="cal-today">Сегодня</button></header>
    <div class="card cal">
      <div class="cal-head"><button class="icon-btn" data-act="cal-nav" data-dir="-1" aria-label="Предыдущий месяц">${icon('back')}</button>
      <b>${MONTHS[m.getMonth()]} ${m.getFullYear()}</b>
      <button class="icon-btn" data-act="cal-nav" data-dir="1" aria-label="Следующий месяц">${icon('next')}</button></div>
      <div class="cal-grid">${WD.map(d => `<span class="cal-wd">${d}</span>`).join('')}${cells}</div>
      <div class="legend"><span><i class="plan"></i>запланировано</span><span><i class="done"></i>выполнено</span><span><i class="missed"></i>пропущено</span></div>
    </div>
    <div class="section" style="text-transform:none">${fmtDate(ui.calSel, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
    ${sel.length ? `<div class="list">${sel.map(w => `<div class="list-row">
      <button class="grow plain" data-act="view-w" data-id="${w.id}"><b>${esc(w.title)}</b><small>${w.status === 'done' ? `✓ выполнено · ${fmtTime(w.durationSec || 0)}` : workoutMeta(w)}</small></button>
      ${w.status !== 'done' ? `<button class="icon-btn accent" data-act="start" data-id="${w.id}" aria-label="Начать">${icon('play')}</button>` : ''}</div>`).join('')}</div>`
    : `<div class="empty small">${ui.calSel < t ? 'В этот день тренировок не было.' : 'Свободный день.'}</div>`}
    ${ui.calSel >= t ? `<button class="btn ghost block" data-act="cal-add">${icon('plus')} Добавить тренировку</button>` : ''}
    <button class="btn ghost block" data-act="plan-open">${icon('cal')} Составить план на недели</button>`;
};

/* ---------- Прогресс ---------- */
VIEWS.prog = () => {
  const done = doneWorkouts();
  const totalMin = Math.round(done.reduce((s, w) => s + (w.durationSec || 0), 0) / 60);
  const totalVol = done.reduce((s, w) => s + volumeOf(w), 0);
  const planned = S.workouts.filter(w => w.date < today() || w.status === 'done');
  const adherence = planned.length ? Math.round(planned.filter(w => w.status === 'done').length / planned.length * 100) : 0;

  // по неделям
  const ws0 = weekStart(new Date());
  const weeks = [];
  for (let i = 9; i >= 0; i--) {
    const s = addDays(ws0, -7 * i), e = addDays(s, 6);
    const n = done.filter(w => w.date >= ymd(s) && w.date <= ymd(e)).length;
    weeks.push({ label: `${s.getDate()}.${pad(s.getMonth() + 1)}`, v: n, cur: i === 0, showVal: true, tip: `Неделя с ${s.getDate()} ${s.toLocaleDateString('ru-RU', { month: 'short' })}: ${n} ${plural(n, 'тренировка', 'тренировки', 'тренировок')}` });
  }
  // мышечные группы за 30 дней
  const from = ymd(addDays(new Date(), -30));
  const gc = {};
  done.filter(w => w.date >= from).forEach(w => w.items.forEach((it, i) => {
    const ex = EX[it.ex]; if (!ex || it.sec !== 'main') return;
    const n = w.log && w.log[i] ? w.log[i].filter(s => s.done).length : 0;
    if (n) gc[ex.group] = (gc[ex.group] || 0) + n;
  }));
  const groups = Object.entries(gc).sort((a, b) => b[1] - a[1]).map(([g, v]) => ({ label: GROUPS[g], v }));

  // упражнения с историей
  const exLog = {};
  done.slice().reverse().forEach(w => w.items.forEach((it, i) => {
    const sets = w.log && w.log[i] ? w.log[i].filter(s => s.done) : [];
    if (!sets.length || !EX[it.ex] || it.sec !== 'main') return;
    const ex = EX[it.ex];
    let v, unit;
    if (ex.kind === 'time') { v = Math.max(...sets.map(s => s.t || it.time || 0)); unit = ' с'; }
    else if (sets.some(s => s.w > 0)) { v = Math.max(...sets.map(s => s.w || 0)); unit = ' кг'; }
    else { v = Math.max(...sets.map(s => s.reps || 0)); unit = ' повт.'; }
    (exLog[it.ex] = exLog[it.ex] || { unit, pts: [] }).pts.push({ label: fmtDate(w.date, { day: 'numeric', month: 'short' }), v });
  }));
  const exIds = Object.keys(exLog).sort((a, b) => exLog[b].pts.length - exLog[a].pts.length);
  if (!ui.progEx || !exLog[ui.progEx]) ui.progEx = exIds[0] || null;
  const cur = ui.progEx ? exLog[ui.progEx] : null;
  const best = cur ? Math.max(...cur.pts.map(p => p.v)) : 0;

  const bw = S.bodyweight.slice().sort((a, b) => a.date < b.date ? -1 : 1);
  const bwPts = bw.slice(-20).map(e => ({ label: fmtDate(e.date, { day: 'numeric', month: 'short' }), v: e.kg }));
  const bwDelta = bw.length > 1 ? +(bw[bw.length - 1].kg - bw[0].kg).toFixed(1) : null;

  return `<header class="top"><div><div class="kicker">${done.length ? `С ${fmtDate(done[done.length - 1].date)}` : 'Статистика'}</div><h1>Ваш <span class="grad-text">прогресс</span></h1></div></header>
    <div class="stats2">
      <div class="stat big"><b>${done.length}</b><span>${plural(done.length, 'тренировка', 'тренировки', 'тренировок')}</span></div>
      <div class="stat big"><b>${totalMin >= 120 ? (totalMin / 60).toFixed(1) + '<small> ч</small>' : totalMin + '<small> мин</small>'}</b><span>в работе</span></div>
      <div class="stat big"><b>${totalVol >= 1000 ? (totalVol / 1000).toFixed(1) + '<small> т</small>' : totalVol + '<small> кг</small>'}</b><span>поднятый объём</span></div>
      <div class="stat big"><b>${adherence}<small>%</small></b><span>выполнение плана</span></div>
    </div>
    <div class="card"><div class="card-title">Тренировки по неделям</div>${barChart(weeks)}</div>
    <div class="card"><div class="card-title">Нагрузка по группам мышц <small class="muted">· 30 дней, подходы</small></div>
      ${groups.length ? hbarChart(groups) : '<div class="empty small">Завершите тренировку — и здесь будет видно, какие мышцы получают нагрузку.</div>'}</div>
    <div class="card"><div class="card-title">Прогресс в упражнении</div>
      ${exIds.length ? `<select class="select" data-act-change="prog-ex">${exIds.map(id => `<option value="${id}" ${id === ui.progEx ? 'selected' : ''}>${esc(EX[id].name)}</option>`).join('')}</select>
      <div class="pr">Лучший результат: <b>${best}${cur.unit}</b></div>${lineChart(cur.pts, { unit: cur.unit })}`
      : '<div class="empty small">После первых тренировок здесь появится график рабочих весов и повторов.</div>'}</div>
    <div class="card"><div class="card-title">Вес тела ${bwDelta !== null ? `<small class="muted">· ${bwDelta > 0 ? '+' : ''}${bwDelta} кг с начала</small>` : ''}</div>
      ${lineChart(bwPts, { unit: ' кг' })}
      <div class="row gap mt"><input class="input grow" type="number" inputmode="decimal" step="0.1" id="bwInput" placeholder="Вес сегодня, кг" value="">
      <button class="btn primary" data-act="bw-add">Записать</button></div></div>
    <div class="section">История</div>
    ${done.length ? `<div class="list">${done.slice(0, 30).map(w => `<button class="list-row" data-act="view-w" data-id="${w.id}">
      <span class="date-pill">${fmtDate(w.date, { day: 'numeric', month: 'short' })}</span>
      <span class="grow"><b>${esc(w.title)}</b><small>${fmtTime(w.durationSec || 0)}${volumeOf(w) ? ` · ${volumeOf(w)} кг` : ''}${w.rpe ? ` · RPE ${w.rpe}` : ''}</small></span>${icon('next')}</button>`).join('')}</div>`
    : '<div class="empty small">Пока пусто.</div>'}`;
};

/* ---------- Профиль ---------- */
VIEWS.profile = () => {
  const p = P();
  const b = Gen.bmi(p);
  const bmiText = b < 18.5 ? 'ниже нормы' : b < 25 ? 'в норме' : b < 30 ? 'выше нормы' : 'высокий';
  return `<header class="top"><div><div class="kicker">Анкета влияет на подбор</div><h1>Профиль</h1></div>
    <div class="avatar" style="display:grid;place-items:center">${esc((p.name || 'А')[0].toUpperCase())}</div></header>
    <div class="card"><div class="card-title">Персонаж <small class="muted">показывает технику упражнений</small></div>
      <div class="skin-grid">${Object.entries(SKIN_NAMES).map(([k, name]) => `<button class="skin-tile ${skin() === k ? 'on' : ''}" data-act="set-skin" data-val="${k}">
        ${sprite('squat', '', k)}<span>${name}</span>${skin() === k ? `<i class="skin-check">${icon('check')}</i>` : ''}</button>`).join('')}</div></div>
    <div class="card"><div class="card-title">Личные данные</div>${personalFields()}
      <div class="bmi"><span>ИМТ <b>${b.toFixed(1)}</b> — ${bmiText}</span>${Gen.lowImpact(p) ? '<small class="muted">Прыжковые упражнения исключены для бережной нагрузки на суставы.</small>' : ''}</div></div>
    <div class="card"><div class="card-title">Цели</div>${goalFields()}</div>
    <div class="card"><div class="card-title">Дни тренировок</div>${daysFields()}</div>
    <div class="card"><div class="card-title">Инвентарь</div>${inventoryFields()}</div>
    <div class="card"><div class="card-title">Ограничения и травмы</div>${limitFields()}
      <p class="muted small">Приложение не заменяет консультацию врача. При боли прекратите упражнение.</p></div>
    <div class="card"><div class="card-title">Настройки</div>
      <div class="toggles"><button class="toggle ${S.settings.sound ? 'on' : ''}" data-act="set-sound"><i></i>Звук и вибрация таймера</button></div></div>
    <div class="card"><div class="card-title">Данные</div>
      <p class="muted small">Данные хранятся только в этом браузере. Сделайте резервную копию, чтобы перенести их на другое устройство.</p>
      <div class="row gap wrap"><button class="btn ghost grow" data-act="export">Экспорт</button>
      <label class="btn ghost grow">Импорт<input type="file" accept="application/json,.json" hidden data-act-change="import"></label></div>
      <button class="btn danger-ghost block mt" data-act="reset">Удалить все данные</button></div>
    <p class="muted small center">FitForge Lite · версия 1.0</p>`;
};

/* ================= Листы ================= */
function exInfoSheet(exId, pick) {
  const ex = EX[exId];
  const last = Gen.lastPerformance(exId, S.workouts);
  const okEq = Gen.hasEq(ex, S.inventory);
  return `${fig(exId, 'big')}
    <h2 class="center">${esc(ex.name)}</h2>
    <div class="chips center">
      <span class="tag">${GROUPS[ex.group]}</span><span class="tag">${LEVELS[ex.lvl]}</span>
      <span class="tag ${okEq ? '' : 'warn'}">${eqText(ex)}</span>${ex.kind === 'time' ? '<span class="tag">На время</span>' : ''}${ex.uni ? '<span class="tag">На каждую сторону</span>' : ''}
    </div>
    <div class="info-block"><h4>Работают мышцы</h4><div class="chips">${ex.muscles.map(m => `<span class="tag soft">${esc(m)}</span>`).join('')}</div></div>
    <div class="info-block"><h4>Техника</h4><ol class="steps">${ex.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol></div>
    <div class="info-block"><h4>Важно</h4><ul class="tips">${ex.tips.map(s => `<li>${esc(s)}</li>`).join('')}</ul></div>
    ${ex.stress.length || ex.impact ? `<p class="muted small">Нагрузка на: ${[...ex.stress.map(s => LIMITS[s].toLowerCase()), ...(ex.impact ? ['ударная (прыжки)'] : [])].join(', ')}.</p>` : ''}
    ${last ? `<div class="info-block"><h4>Последний раз · ${fmtDate(last.date)}</h4><div class="chips">${last.sets.filter(s => s.done).map(s => `<span class="tag soft">${s.t ? s.t + ' с' : (s.reps || 0) + (s.w ? ' × ' + s.w + ' кг' : '')}</span>`).join('')}</div></div>` : ''}
    ${pick ? `<button class="btn primary block mt" data-act="pick-ex" data-ex="${exId}">${icon('plus')} Добавить в тренировку</button>` : ''}`;
}

function librarySheet(pick) {
  const l = ui.lib, p = P();
  const q = l.q.trim().toLowerCase();
  const list = EXERCISES.filter(e => (l.g === 'all' || e.group === l.g)
    && (!q || e.name.toLowerCase().includes(q) || e.muscles.some(m => m.toLowerCase().includes(q)))
    && (!l.avail || (Gen.hasEq(e, S.inventory) && Gen.allowed(e, p))));
  return `<div class="search">${icon('search')}<input type="search" placeholder="Поиск по названию или мышце" value="${esc(l.q)}" data-act-input="lib-q"></div>
    <div class="chips scroll">${[['all', 'Все'], ...Object.entries(GROUPS)].map(([k, v]) => `<button class="chip ${l.g === k ? 'on' : ''}" data-act="lib-g" data-val="${k}">${v}</button>`).join('')}</div>
    <div class="toggles"><button class="toggle ${l.avail ? 'on' : ''}" data-act="lib-avail"><i></i>Только доступные мне</button></div>
    ${list.length ? `<div class="lib-grid">${list.map(e => `<button class="lib-card ${Gen.hasEq(e, S.inventory) ? '' : 'na'}" data-act="ex-open" data-ex="${e.id}" data-pick="${pick ? 1 : ''}">
      ${sprite(e.id)}<span class="lib-info"><b>${esc(e.name)}</b><small>${GROUPS[e.group]} · ${LEVELS[e.lvl].toLowerCase()}</small></span>
      ${pick ? `<span class="icon-btn accent sm add" data-act="pick-ex" data-ex="${e.id}">${icon('plus')}</span>` : ''}</button>`).join('')}</div>`
    : '<div class="empty small">Ничего не найдено</div>'}`;
}

function workoutSheet(id) {
  const w = wById(id);
  if (!w) return '<div class="empty">Тренировка не найдена</div>';
  const done = w.status === 'done';
  return `<div class="muted">${fmtDate(w.date, { weekday: 'long', day: 'numeric', month: 'long' })} · ${done ? `выполнено за ${fmtTime(w.durationSec || 0)}` : workoutMeta(w)}</div>
    ${done ? `<div class="stats3 mt"><div class="stat"><b>${w.log ? w.log.flat().filter(s => s && s.done).length : 0}</b><span>подходов</span></div>
      <div class="stat"><b>${volumeOf(w)}</b><span>кг объём</span></div><div class="stat"><b>${w.rpe || '—'}</b><span>RPE</span></div></div>` : ''}
    ${w.notes ? `<p class="note">${esc(w.notes)}</p>` : ''}
    <div class="list mt">${w.items.map((it, i) => {
      const ex = EX[it.ex]; if (!ex) return '';
      const sets = done && w.log && w.log[i] ? w.log[i].filter(s => s.done) : [];
      return `<button class="lib-row" data-act="ex-open" data-ex="${it.ex}">${fig(it.ex, 'thumb')}
        <span class="grow"><b>${esc(ex.name)}</b><small>${done ? (sets.length ? sets.map(s => s.t ? `${s.t} с` : `${s.reps || 0}${s.w ? '×' + s.w : ''}`).join(' · ') : 'пропущено') : prescText(it)}</small></span></button>`;
    }).join('')}</div>
    <div class="row gap wrap mt">
      ${!done ? `<button class="btn primary grow" data-act="start" data-id="${w.id}">${icon('play')} Начать</button>
        <button class="btn ghost" data-act="w-edit" data-id="${w.id}">${icon('edit')}</button>` : `<button class="btn ghost grow" data-act="w-repeat" data-id="${w.id}">${icon('repeat')} Повторить</button>`}
      <button class="btn ghost" data-act="w-move" data-id="${w.id}" aria-label="Перенести">${icon('cal')}</button>
      <button class="btn ghost" data-act="w-del" data-id="${w.id}" aria-label="Удалить">${icon('trash')}</button>
    </div>`;
}

function dateSheet(title, initial, onPick) {
  ui._datePick = onPick;
  openSheet(() => `<label class="field"><span>Дата</span><input type="date" class="input" id="datePick" value="${initial}"></label>
    <div class="chips">${[0, 1, 2, 3, 7].map(n => { const d = ymd(addDays(new Date(), n)); return `<button class="chip" data-act="date-quick" data-date="${d}">${fmtDay(d)}</button>`; }).join('')}</div>
    <button class="btn primary block mt" data-act="date-ok">Готово</button>`, { title });
}

function editItemSheet(idx) {
  const it = ui.draft.items[idx], ex = EX[it.ex];
  const stepper = (k, label, step, min, max) => `<div class="stepper"><span>${label}</span><div>
    <button class="icon-btn" data-act="it-step" data-i="${idx}" data-k="${k}" data-d="${-step}" data-min="${min}" data-max="${max}">−</button>
    <b>${it[k]}</b>
    <button class="icon-btn" data-act="it-step" data-i="${idx}" data-k="${k}" data-d="${step}" data-min="${min}" data-max="${max}">+</button></div></div>`;
  return `<h3>${esc(ex.name)}</h3>
    ${stepper('sets', 'Подходы', 1, 1, 10)}
    ${it.time ? stepper('time', 'Время, с', 5, 5, 600) : stepper('rmin', 'Повторы от', 1, 1, 100) + stepper('rmax', 'Повторы до', 1, 1, 100)}
    ${stepper('rest', 'Отдых, с', 15, 0, 300)}
    <button class="btn primary block mt" data-act="sheet-close">Готово</button>`;
}

function planSheet() {
  const p = P();
  return `<p class="muted">Тренировки появятся в календаре на выбранные дни недели. Типы чередуются по сплиту, упражнения подбираются под инвентарь «Дома».</p>
    ${daysFields()}
    <div class="field"><span>Период</span><div class="chips">${[1, 2, 4, 8].map(n => `<button class="chip ${ui._planWeeks === n ? 'on' : ''}" data-act="plan-weeks" data-val="${n}">${n} ${plural(n, 'неделя', 'недели', 'недель')}</button>`).join('')}</div></div>
    <p class="muted small">Будущие незавершённые тренировки в этом периоде будут заменены.</p>
    <button class="btn primary block" data-act="plan-make" ${p.days.length ? '' : 'disabled'}>Составить план</button>`;
}

/* ================= Действия ================= */
function setField(field, val) {
  S.profile[field] = val;
  if (field === 'duration') ui.builder.dur = null;
  save();
}

function newDraft(type, extra = {}) {
  const b = ui.builder;
  const g = Gen.generate({ type, duration: b.dur || P().duration, inv: invFor(b.loc), profile: P(), warm: b.warm, cool: b.cool, workouts: S.workouts });
  ui.draft = { ...g, title: `${g.title} · ${b.dur || P().duration} мин`, loc: b.loc, ...extra };
}

function makePlan(weeks) {
  const p = P();
  const days = p.days.slice().sort();
  const rot = Gen.rotation(days.length, p.goal);
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = addDays(start, weeks * 7 - 1);
  const t = today(), e = ymd(end);
  S.workouts = S.workouts.filter(w => !(w.status !== 'done' && w.date >= t && w.date <= e && !(S.active && S.active.wid === w.id)));
  const tmp = [];
  for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
    const wi = wdIndex(d);
    const pos = days.indexOf(wi);
    if (pos < 0) continue;
    const type = rot[pos % rot.length];
    const g = Gen.generate({ type, duration: p.duration, inv: S.inventory, profile: p, warm: true, cool: true, workouts: S.workouts.concat(tmp) });
    const w = { id: uid(), date: ymd(d), title: g.title, type, items: g.items, status: 'planned', created: Date.now() };
    // псевдо-история для разнообразия
    tmp.push({ ...w, status: 'done', doneAt: Date.now() + tmp.length });
    S.workouts.push(w);
  }
  save();
  return tmp.length;
}

function saveDraftAsWorkout(date) {
  const d = ui.draft;
  const w = { id: uid(), date, title: d.title, type: d.type, items: d.items.map(i => ({ ...i })), status: 'planned', created: Date.now() };
  S.workouts.push(w);
  save();
  return w;
}

const actions = {
  'tab': el => go(el.dataset.tab),
  'sheet-close': () => closeSheet(),
  'sheet-back': () => closeSheet(false),
  'confirm-ok': () => { const f = ui._confirm; closeSheet(); f && f(); },

  'ob-next': () => { ui.ob++; render(); window.scrollTo(0, 0); },
  'ob-back': () => { ui.ob = Math.max(0, ui.ob - 1); render(); },
  'ob-finish': el => {
    S.onboarded = true;
    if (el.dataset.plan) { const n = makePlan(4); toast(`План готов: ${n} ${plural(n, 'тренировка', 'тренировки', 'тренировок')}`); }
    save(); go('home');
  },

  'set-field': el => {
    let v = el.dataset.val;
    if ('num' in el.dataset) v = Number(v);
    if ('bool' in el.dataset) v = !!v;
    setField(el.dataset.field, v);
    rerender();
  },
  'toggle-arr': el => {
    let v = el.dataset.val; if ('num' in el.dataset) v = Number(v);
    const arr = S.profile[el.dataset.arr];
    const i = arr.indexOf(v);
    i >= 0 ? arr.splice(i, 1) : arr.push(v);
    save(); rerender();
  },
  'toggle-inv': el => {
    const v = el.dataset.val, i = S.inventory.indexOf(v);
    i >= 0 ? S.inventory.splice(i, 1) : S.inventory.push(v);
    save(); rerender();
  },
  'set-sound': () => { S.settings.sound = !S.settings.sound; save(); render(); },
  'set-skin': el => {
    S.settings.skin = el.dataset.val; save(); rerender();
    toast(`Персонаж: ${SKIN_NAMES[skin()].toLowerCase()}`);
  },

  'quick': () => {
    const p = P(), rot = Gen.rotation(p.days.length || 3, p.goal);
    const last = doneWorkouts()[0];
    const idx = last ? (rot.indexOf(last.type) + 1) % rot.length : 0;
    ui.builder.type = rot[idx] || 'full';
    newDraft(ui.builder.type);
    go('build');
  },
  'b-set': el => {
    let v = el.dataset.val;
    if ('num' in el.dataset) v = Number(v);
    if ('bool' in el.dataset) v = !!v;
    ui.builder[el.dataset.k] = v; render();
  },
  'generate': () => { newDraft(ui.builder.type, { date: ui._draftDate || null }); ui._draftDate = null; render(); window.scrollTo(0, 0); },
  'regenerate': () => { const d = ui.draft; newDraft(d.type, { date: d.date }); render(); },
  'draft-empty': () => { ui.draft = { title: 'Моя тренировка', type: null, items: [], date: ui._draftDate || null }; ui._draftDate = null; render(); },
  'd-close': () => {
    if (ui.draft.editingId || !ui.draft.items.length) { ui.draft = null; render(); return; }
    confirmSheet('Закрыть тренировку? Несохранённые изменения пропадут.', 'Закрыть', () => { ui.draft = null; render(); });
  },
  'd-swap': el => {
    const i = +el.dataset.i, d = ui.draft;
    const alt = Gen.alternative(d.items[i], d.items, invFor(d.loc || 'home'), P(), d.type || 'full');
    if (!alt) { toast('Нет подходящих замен под ваш инвентарь'); return; }
    d.items[i] = alt; render();
  },
  'd-edit': el => openSheet(() => editItemSheet(+el.dataset.i), { title: 'Параметры' }),
  'it-step': el => {
    const it = ui.draft.items[+el.dataset.i], k = el.dataset.k;
    it[k] = Math.min(+el.dataset.max, Math.max(+el.dataset.min, it[k] + +el.dataset.d));
    if (k === 'rmin' && it.rmax < it.rmin) it.rmax = it.rmin;
    if (k === 'rmax' && it.rmin > it.rmax) it.rmin = it.rmax;
    refreshSheet(); render();
  },
  'd-move': el => {
    const items = ui.draft.items, i = +el.dataset.i, dir = +el.dataset.dir;
    let j = i + dir;
    while (j >= 0 && j < items.length && items[j].sec !== items[i].sec) j += dir;
    if (j < 0 || j >= items.length) return;
    [items[i], items[j]] = [items[j], items[i]]; render();
  },
  'd-del': el => { ui.draft.items.splice(+el.dataset.i, 1); render(); },
  'd-start': () => {
    if (!ui.draft.items.length) { toast('Добавьте хотя бы одно упражнение'); return; }
    const w = saveDraftAsWorkout(today());
    w.adhoc = true;
    ui.draft = null;
    startWorkout(w.id);
  },
  'd-plan': () => {
    if (!ui.draft.items.length) { toast('Добавьте хотя бы одно упражнение'); return; }
    dateSheet('Запланировать на', ui.draft.date || today(), date => {
      saveDraftAsWorkout(date); ui.draft = null; ui.calSel = date; ui.cal = new Date(parseYmd(date).getFullYear(), parseYmd(date).getMonth(), 1);
      toast(`Запланировано: ${fmtDay(date)}`); go('cal');
    });
  },
  'd-tpl': () => {
    const d = ui.draft;
    if (!d.items.length) { toast('Добавьте хотя бы одно упражнение'); return; }
    S.templates.unshift({ id: uid(), title: d.title, type: d.type, items: d.items.map(i => ({ ...i })) });
    save(); toast('Сохранено в шаблоны');
  },
  'd-update': () => {
    const d = ui.draft, w = wById(d.editingId);
    if (w) { w.title = d.title; w.items = d.items.map(i => ({ ...i })); save(); }
    ui.draft = null; toast('Изменения сохранены'); go(ui._returnTab || 'cal');
  },
  'tpl-load': el => {
    const t = S.templates.find(x => x.id === el.dataset.id);
    ui.draft = { title: t.title, type: t.type, items: t.items.map(i => ({ ...i })), loc: 'home', date: ui._draftDate || null };
    render();
  },
  'tpl-del': el => confirmSheet('Удалить шаблон?', 'Удалить', () => { S.templates = S.templates.filter(t => t.id !== el.dataset.id); save(); render(); }),

  'library': el => { openSheet(() => librarySheet(!!el.dataset.pick), { title: el.dataset.pick ? 'Добавить упражнение' : 'Библиотека' }); },
  'lib-g': el => { ui.lib.g = el.dataset.val; refreshSheet(); },
  'lib-avail': () => { ui.lib.avail = !ui.lib.avail; refreshSheet(); },
  'ex-open': (el, e) => {
    if (e.target.closest('[data-act="pick-ex"]')) return;
    const pick = !!el.dataset.pick;
    openSheet(() => exInfoSheet(el.dataset.ex, pick), { title: 'Техника' });
  },
  'ex-info': el => openSheet(() => exInfoSheet(el.dataset.ex, false), { title: 'Техника' }),
  'pick-ex': (el, e) => {
    e.stopPropagation();
    const ex = EX[el.dataset.ex];
    const it = Gen.prescribe(ex, P(), ui.draft.type || 'full', 'main');
    const coolStart = ui.draft.items.findIndex(i => i.sec === 'cool');
    coolStart >= 0 ? ui.draft.items.splice(coolStart, 0, it) : ui.draft.items.push(it);
    closeSheet(); toast(`Добавлено: ${ex.name}`); render();
  },

  'view-w': el => openSheet(() => workoutSheet(el.dataset.id), { title: wById(el.dataset.id)?.title || 'Тренировка' }),
  'start': el => { closeSheet(); startWorkout(el.dataset.id); },
  'resume': () => openPlayer(),
  'w-edit': el => {
    const w = wById(el.dataset.id);
    ui.draft = { title: w.title, type: w.type, items: w.items.map(i => ({ ...i })), editingId: w.id, date: w.date, loc: 'home' };
    ui._returnTab = ui.tab;
    closeSheet(); go('build');
  },
  'w-repeat': el => {
    const w = wById(el.dataset.id);
    ui.draft = { title: w.title, type: w.type, items: w.items.map(i => ({ ...i })), loc: 'home' };
    closeSheet(); go('build');
  },
  'w-move': el => {
    const w = wById(el.dataset.id);
    dateSheet('Перенести на', w.date, date => { w.date = date; save(); toast(`Перенесено: ${fmtDay(date)}`); render(); });
  },
  'w-del': el => confirmSheet('Удалить тренировку? Это действие нельзя отменить.', 'Удалить', () => {
    S.workouts = S.workouts.filter(w => w.id !== el.dataset.id); save(); render();
  }),
  'move-missed': () => {
    const t = today();
    const m = S.workouts.filter(w => w.status !== 'done' && w.date < t).sort((a, b) => a.date < b.date ? 1 : -1)[0];
    if (m) { m.date = t; save(); toast('Перенесено на сегодня'); render(); }
  },

  'date-quick': el => { $('#datePick').value = el.dataset.date; },
  'date-ok': () => { const v = $('#datePick').value; if (!v) return; const f = ui._datePick; closeSheet(); f && f(v); },

  'cal-nav': el => { ui.cal = new Date(ui.cal.getFullYear(), ui.cal.getMonth() + +el.dataset.dir, 1); render(); },
  'cal-today': () => { ui.cal = new Date(new Date().getFullYear(), new Date().getMonth(), 1); ui.calSel = today(); render(); },
  'cal-sel': el => { ui.calSel = el.dataset.date; render(); },
  'cal-go': el => { ui.calSel = el.dataset.date; const d = parseYmd(el.dataset.date); ui.cal = new Date(d.getFullYear(), d.getMonth(), 1); go('cal'); },
  'cal-add': () => { ui._draftDate = ui.calSel; ui.draft = null; go('build'); toast(`Тренировка на ${fmtDay(ui.calSel).toLowerCase()}`); },

  'plan-open': () => { ui._planWeeks = ui._planWeeks || 4; openSheet(planSheet, { title: 'План тренировок' }); },
  'plan-weeks': el => { ui._planWeeks = +el.dataset.val; refreshSheet(); },
  'plan-make': () => {
    const n = makePlan(ui._planWeeks || 4);
    closeSheet(); toast(`Готово: ${n} ${plural(n, 'тренировка', 'тренировки', 'тренировок')} в календаре`); go('cal');
  },

  'bw-add': () => {
    const v = parseFloat(String($('#bwInput').value).replace(',', '.'));
    if (!(v > 20 && v < 400)) { toast('Введите вес в килограммах'); return; }
    const t = today();
    S.bodyweight = S.bodyweight.filter(e => e.date !== t);
    S.bodyweight.push({ date: t, kg: v });
    S.profile.weight = v;
    save(); toast('Вес записан'); render();
  },

  'export': () => {
    const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `fitforge-backup-${today()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  'reset': () => confirmSheet('Удалить все тренировки, историю и анкету? Сначала сделайте экспорт, если данные нужны.', 'Удалить всё', () => {
    localStorage.removeItem(KEY); S = defaults(); ui.ob = 0; ui.draft = null; go('onboard');
  }),
};

const changeActions = {
  'prog-ex': el => { ui.progEx = el.value; render(); },
  'import': el => {
    const f = el.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result);
        if (d.v !== 1 || !Array.isArray(d.workouts)) throw new Error('format');
        confirmSheet('Заменить текущие данные данными из файла?', 'Заменить', () => { S = { ...defaults(), ...d }; save(); toast('Данные восстановлены'); go('home'); }, false);
      } catch (e) { toast('Файл не похож на резервную копию FitForge'); }
    };
    r.readAsText(f);
  },
};
const inputActions = {
  'd-title': el => { ui.draft.title = el.value; },
  'lib-q': el => {
    ui.lib.q = el.value;
    const pos = el.selectionStart;
    refreshSheet();
    const n = $('.sheet-panel input[type=search]');
    if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) { /* нет */ } }
  },
};

document.addEventListener('click', e => {
  const tip = e.target.closest('[data-tip]');
  if (tip) showTip(tip, e);
  const el = e.target.closest('[data-act]');
  if (!el || el.tagName === 'INPUT') return;
  const f = actions[el.dataset.act] || playerActions[el.dataset.act];
  if (f) { f(el, e); }
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.actChange && changeActions[el.dataset.actChange]) return changeActions[el.dataset.actChange](el);
  if (el.dataset.field) {
    let v = el.value;
    if ('num' in el.dataset) { v = parseFloat(v.replace(',', '.')); if (isNaN(v)) return; }
    setField(el.dataset.field, v);
    if (ui.tab === 'profile') render();
  }
  if (el.dataset.plSet !== undefined) playerInput(el);
});
document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.actInput && inputActions[el.dataset.actInput]) inputActions[el.dataset.actInput](el);
});

let tipEl = null;
function showTip(target, e) {
  if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'tip'; document.body.appendChild(tipEl); }
  tipEl.textContent = target.dataset.tip;
  tipEl.style.left = Math.min(window.innerWidth - 12, Math.max(12, e.clientX)) + 'px';
  tipEl.style.top = (e.clientY - 12) + 'px';
  tipEl.classList.add('show');
  clearTimeout(showTip._t);
  showTip._t = setTimeout(() => tipEl.classList.remove('show'), 1800);
}

/* ================= Навигация ================= */
function go(tab) {
  ui.tab = tab;
  render();
  window.scrollTo(0, 0);
}
function rerender() {
  if (sheets.length) refreshSheet();
  const y = window.scrollY;
  render();
  window.scrollTo(0, y);
}
function render() {
  if (!S.onboarded && ui.tab !== 'onboard') ui.tab = 'onboard';
  const v = $('#view');
  v.innerHTML = VIEWS[ui.tab]();
  mountFigures(v);
  $('#nav').hidden = ui.tab === 'onboard';
  $$('#nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === ui.tab));
}

function buildNav() {
  const items = [['home', 'home', 'Главная'], ['build', 'build', 'Конструктор'], ['cal', 'cal', 'Календарь'], ['prog', 'chart', 'Прогресс'], ['profile', 'user', 'Профиль']];
  $('#nav').innerHTML = items.map(([t, i, n]) => `<button data-act="tab" data-tab="${t}">${icon(i)}<span>${n}</span></button>`).join('');
}

/* ================= Плеер тренировки ================= */
let plTimer = null, wakeLock = null, audioCtx = null;

function startWorkout(id) {
  const w = wById(id);
  if (!w) return;
  if (S.active && S.active.wid !== id) {
    confirmSheet('Есть незавершённая тренировка. Начать новую? Прогресс прошлой будет потерян.', 'Начать новую', () => { dropActive(); startWorkout(id); });
    return;
  }
  if (!S.active) {
    S.active = {
      wid: id, i: 0, start: Date.now(), timer: null,
      log: w.items.map(it => {
        const ex = EX[it.ex];
        const hint = ex && ex.weighted ? Gen.suggestWeight(it.ex, it, S.workouts) : null;
        return Array.from({ length: it.sets }, () => ({ reps: it.time ? 0 : it.rmax, w: hint ? hint.w : 0, t: it.time || 0, done: false }));
      }),
    };
    save();
  }
  openPlayer();
}
function dropActive() {
  const a = S.active;
  if (a) { const w = wById(a.wid); if (w && w.adhoc) S.workouts = S.workouts.filter(x => x.id !== w.id); }
  S.active = null; save();
}

function openPlayer() {
  let host = $('#player');
  if (!host) { host = document.createElement('div'); host.id = 'player'; document.body.appendChild(host); }
  document.body.classList.add('no-scroll');
  renderPlayer();
  clearInterval(plTimer);
  plTimer = setInterval(playerTick, 250);
  requestWake();
}
function closePlayer() {
  clearInterval(plTimer);
  const host = $('#player'); if (host) host.remove();
  document.body.classList.remove('no-scroll');
  if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
  render();
}
async function requestWake() {
  try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch (e) { /* не поддерживается */ }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && $('#player')) requestWake(); });

function beep(times = 2) {
  if (!S.settings.sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    for (let k = 0; k < times; k++) {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(audioCtx.destination);
      const t0 = audioCtx.currentTime + k * 0.22;
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.3, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
      o.start(t0); o.stop(t0 + 0.18);
    }
  } catch (e) { /* без звука */ }
  if (navigator.vibrate) navigator.vibrate([180, 90, 180]);
}

function curW() { return S.active && wById(S.active.wid); }

function renderPlayer() {
  const host = $('#player'), a = S.active, w = curW();
  if (!host || !a || !w) { closePlayer(); return; }
  if (a.finish) { host.innerHTML = finishView(); return; }
  const it = w.items[a.i], ex = EX[it.ex], log = a.log[a.i];
  const secName = { warm: 'Разминка', main: 'Основная часть', cool: 'Заминка' }[it.sec];
  const secItems = w.items.map((x, k) => [x, k]).filter(([x]) => x.sec === it.sec);
  const posInSec = secItems.findIndex(([, k]) => k === a.i) + 1;
  const showW = ex.weighted || log.some(s => s.w > 0);
  const hint = ex.weighted ? Gen.suggestWeight(it.ex, it, S.workouts) : null;
  const last = Gen.lastPerformance(it.ex, S.workouts);
  const isLast = a.i === w.items.length - 1;

  host.innerHTML = `<div class="pl-top">
      <button class="icon-btn" data-act="pl-close" aria-label="Выйти">${icon('x')}</button>
      <div class="pl-title"><b>${esc(w.title)}</b><small>${a.i + 1} из ${w.items.length}</small></div>
      <div class="pl-clock" id="plClock">${fmtTime((Date.now() - a.start) / 1000)}</div></div>
    <div class="pl-progress">${w.items.map((x, k) => `<button class="${a.log[k].every(s => s.done) ? 'done' : a.log[k].some(s => s.done) ? 'part' : ''} ${k === a.i ? 'cur' : ''}" data-act="pl-goto" data-i="${k}" aria-label="Упражнение ${k + 1}"></button>`).join('')}</div>
    <div class="pl-body">
      <div class="eyebrow center">${secName} · ${posInSec}/${secItems.length}</div>
      <div class="pl-fig">${fig(it.ex, 'big')}</div>
      <h2 class="center">${esc(ex.name)}</h2>
      <div class="center muted">${prescText(it)}</div>
      ${hint || last ? `<div class="center hint">${hint ? `Рекомендуемый вес: ${hint.w} кг${hint.up ? ' ↑' : ''}` : ''}${last && !hint ? `Прошлый раз: ${last.sets.filter(s => s.done).map(s => s.t ? s.t + ' с' : s.reps).join(' · ')}` : ''}</div>` : ''}
      <details class="howto"><summary>Как выполнять</summary><ol class="steps">${ex.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol><ul class="tips">${ex.tips.map(s => `<li>${esc(s)}</li>`).join('')}</ul></details>
      <div class="sets">
        <div class="set-row head"><span>#</span><span>${it.time ? 'Время' : 'Повторы'}</span>${showW ? '<span>Вес, кг</span>' : '<span></span>'}<span></span></div>
        ${log.map((s, k) => `<div class="set-row ${s.done ? 'done' : ''}">
          <span class="set-n">${k + 1}</span>
          ${it.time ? `<button class="btn ghost small" data-act="pl-work" data-k="${k}">${icon('play')} ${s.t || it.time} с</button>`
            : `<input class="input num" type="number" inputmode="numeric" min="0" value="${s.reps}" data-pl-set="${k}" data-pl-k="reps" aria-label="Повторы, подход ${k + 1}">`}
          ${showW ? `<input class="input num" type="number" inputmode="decimal" step="0.5" min="0" value="${s.w || ''}" placeholder="—" data-pl-set="${k}" data-pl-k="w" aria-label="Вес, подход ${k + 1}">` : it.time ? '<span></span>' : `<button class="plain add-w" data-act="pl-addw">+ вес</button>`}
          <button class="set-check" data-act="pl-done" data-k="${k}" aria-label="Подход выполнен">${icon('check')}</button></div>`).join('')}
      </div>
      <div class="row gap center-row"><button class="btn ghost small" data-act="pl-addset">${icon('plus')} Подход</button>
      <button class="btn ghost small" data-act="pl-swap">${icon('swap')} Заменить</button></div>
    </div>
    <div class="pl-nav">
      <button class="btn ghost" data-act="pl-prev" ${a.i === 0 ? 'disabled' : ''} aria-label="Предыдущее">${icon('back')}</button>
      ${isLast ? `<button class="btn primary grow" data-act="pl-finish">${icon('check')} Завершить</button>`
      : `<button class="btn primary grow" data-act="pl-next">Далее: ${esc(EX[w.items[a.i + 1].ex].name)} ${icon('next')}</button>`}
    </div>
    ${a.timer ? timerView() : ''}`;
  mountFigures(host);
}

function timerView() {
  const a = S.active, t = a.timer, w = curW();
  const left = Math.max(0, (t.end - Date.now()) / 1000);
  const R = 88, C = 2 * Math.PI * R;
  const frac = t.total ? left / t.total : 0;
  const nextIt = w.items[a.i];
  const isWork = t.mode === 'work';
  return `<div class="timer ${isWork ? 'work' : 'rest'}">
    <div class="eyebrow">${isWork ? 'Работаем' : 'Отдых'}</div>
    ${isWork ? `<div class="timer-fig">${fig(nextIt.ex, 'big')}</div>` : ''}
    <div class="ring"><svg viewBox="0 0 200 200"><circle class="ring-bg" cx="100" cy="100" r="${R}"/>
      <circle class="ring-fg" id="ringFg" cx="100" cy="100" r="${R}" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - frac)}" transform="rotate(-90 100 100)"/></svg>
      <div class="ring-time" id="ringTime">${fmtTime(Math.ceil(left))}</div></div>
    ${!isWork ? `<div class="timer-next">Далее: <b>${esc(EX[nextIt.ex].name)}</b> · подход ${Math.min(a.log[a.i].findIndex(s => !s.done) + 1 || a.log[a.i].length, a.log[a.i].length)} из ${a.log[a.i].length}</div>` : ''}
    <div class="row gap">${!isWork ? '<button class="btn ghost" data-act="tm-add" data-d="-15">−15</button>' : ''}
      <button class="btn primary grow" data-act="tm-skip">${isWork ? 'Готово' : 'Пропустить'}</button>
      ${!isWork ? '<button class="btn ghost" data-act="tm-add" data-d="15">+15</button>' : ''}</div></div>`;
}

function playerTick() {
  const a = S.active;
  if (!a) return;
  const c = $('#plClock'); if (c) c.textContent = fmtTime((Date.now() - a.start) / 1000);
  if (!a.timer) return;
  const left = (a.timer.end - Date.now()) / 1000;
  const rt = $('#ringTime'), rf = $('#ringFg');
  if (rt) rt.textContent = fmtTime(Math.ceil(Math.max(0, left)));
  if (rf) { const C = 2 * Math.PI * 88; rf.setAttribute('stroke-dashoffset', C * (1 - Math.max(0, left) / a.timer.total)); }
  if (left <= 0) { beep(); timerDone(); }
}

function timerDone() {
  const a = S.active, t = a.timer;
  a.timer = null;
  if (t.mode === 'work') {
    const s = a.log[t.item][t.set];
    s.done = true; s.t = t.total;
    afterSet(t.item, t.set);
  } else { save(); renderPlayer(); }
}

function afterSet(item, k) {
  const a = S.active, w = curW(), it = w.items[item];
  const log = a.log[item];
  const remaining = log.some(s => !s.done);
  if (!remaining && item < w.items.length - 1 && a.i === item) a.i = item + 1;
  const allDone = a.log.every(l => l.every(s => s.done));
  if (allDone) { save(); renderPlayer(); return; }
  if (it.rest > 0) a.timer = { mode: 'rest', end: Date.now() + it.rest * 1000, total: it.rest };
  save(); renderPlayer();
}

function playerInput(el) {
  const a = S.active, k = +el.dataset.plSet, key = el.dataset.plK;
  const v = parseFloat(String(el.value).replace(',', '.'));
  a.log[a.i][k][key] = isNaN(v) ? 0 : v;
  // вес переносим на следующие подходы
  if (key === 'w') a.log[a.i].forEach((s, j) => { if (j > k && !s.done) s.w = a.log[a.i][k].w; });
  save();
  if (key === 'w') $$('[data-pl-k="w"]').forEach(n => { const j = +n.dataset.plSet; if (j > k) n.value = a.log[a.i][j].w || ''; });
}

function finishView() {
  const a = S.active, w = curW();
  const dur = (a.finish - a.start) / 1000;
  const sets = a.log.flat(), done = sets.filter(s => s.done).length;
  const vol = Math.round(sets.reduce((s, x) => s + (x.done && x.w ? x.w * (x.reps || 0) : 0), 0));
  return `<div class="finish">
    <div class="finish-badge">${icon('flame')}</div>
    <h1 class="center">Отличная работа!</h1>
    <p class="center muted">${esc(w.title)}</p>
    <div class="stats3"><div class="stat"><b>${fmtTime(dur)}</b><span>время</span></div>
      <div class="stat"><b>${done}<small>/${sets.length}</small></b><span>подходов</span></div>
      <div class="stat"><b>${vol}</b><span>кг объём</span></div></div>
    <div class="field"><span>Насколько тяжело было? (RPE)</span>
      <div class="rpe">${[...Array(10)].map((_, i) => `<button class="${a.rpe === i + 1 ? 'on' : ''}" data-act="pl-rpe" data-v="${i + 1}">${i + 1}</button>`).join('')}</div>
      <small class="muted">1 — очень легко, 10 — на пределе</small></div>
    <label class="field"><span>Заметки</span><textarea class="input" id="plNotes" rows="3" placeholder="Самочувствие, что получилось, что улучшить">${esc(a.notes || '')}</textarea></label>
    <button class="btn primary block" data-act="pl-save">${icon('check')} Сохранить тренировку</button>
    <button class="btn ghost block" data-act="pl-unfinish">Вернуться к тренировке</button></div>`;
}

const playerActions = {
  'pl-close': () => {
    openSheet(() => `<p class="lead">Прервать тренировку?</p>
      <button class="btn primary block" data-act="pl-pause">Свернуть — продолжу позже</button>
      <button class="btn ghost block" data-act="pl-finish-now">Завершить и сохранить выполненное</button>
      <button class="btn danger-ghost block" data-act="pl-discard">Выйти без сохранения</button>`, { title: 'Тренировка' });
  },
  'pl-pause': () => { closeSheet(); if (S.active) S.active.timer = null; save(); closePlayer(); },
  'pl-finish-now': () => { closeSheet(); S.active.timer = null; S.active.finish = Date.now(); save(); renderPlayer(); },
  'pl-discard': () => { closeSheet(); dropActive(); closePlayer(); },
  'pl-goto': el => { S.active.i = +el.dataset.i; S.active.timer = null; save(); renderPlayer(); },
  'pl-prev': () => { S.active.i = Math.max(0, S.active.i - 1); save(); renderPlayer(); },
  'pl-next': () => { S.active.i++; S.active.timer = null; save(); renderPlayer(); $('#player').scrollTop = 0; },
  'pl-done': el => {
    const a = S.active, k = +el.dataset.k, s = a.log[a.i][k];
    if (s.done) { s.done = false; save(); renderPlayer(); return; }
    s.done = true;
    afterSet(a.i, k);
  },
  'pl-work': el => {
    const a = S.active, k = +el.dataset.k, it = curW().items[a.i];
    const sec = a.log[a.i][k].t || it.time;
    a.timer = { mode: 'work', end: Date.now() + sec * 1000, total: sec, item: a.i, set: k };
    save(); renderPlayer();
    beep(1);
  },
  'tm-skip': () => {
    const t = S.active.timer;
    if (t.mode === 'work') { t.total = Math.max(1, Math.round((Date.now() - (t.end - t.total * 1000)) / 1000)); timerDone(); }
    else { S.active.timer = null; save(); renderPlayer(); }
  },
  'tm-add': el => {
    const t = S.active.timer, d = +el.dataset.d;
    t.end += d * 1000; t.total = Math.max(1, t.total + d);
    if (t.end < Date.now()) t.end = Date.now();
    save(); playerTick();
  },
  'pl-addset': () => {
    const a = S.active, l = a.log[a.i], lastS = l[l.length - 1];
    l.push({ reps: lastS.reps, w: lastS.w, t: lastS.t, done: false });
    curW().items[a.i].sets = l.length;
    save(); renderPlayer();
  },
  'pl-addw': () => { const a = S.active; a.log[a.i].forEach(s => { if (!s.w) s.w = 0.5; }); renderPlayer(); const n = $('[data-pl-k="w"]'); if (n) { n.value = ''; n.focus(); } },
  'pl-swap': () => {
    const a = S.active, w = curW();
    if (a.log[a.i].some(s => s.done)) { toast('Нельзя заменить упражнение с выполненными подходами'); return; }
    const alt = Gen.alternative(w.items[a.i], w.items, S.inventory, P(), w.type || 'full');
    if (!alt) { toast('Нет подходящих замен'); return; }
    w.items[a.i] = alt;
    a.log[a.i] = Array.from({ length: alt.sets }, () => ({ reps: alt.time ? 0 : alt.rmax, w: 0, t: alt.time || 0, done: false }));
    save(); renderPlayer();
  },
  'pl-finish': () => {
    const a = S.active;
    const left = a.log.flat().filter(s => !s.done).length;
    const fin = () => { a.timer = null; a.finish = Date.now(); save(); renderPlayer(); };
    if (left) confirmSheet(`Осталось невыполненных подходов: ${left}. Завершить тренировку?`, 'Завершить', fin, false); else fin();
  },
  'pl-unfinish': () => { S.active.finish = null; save(); renderPlayer(); },
  'pl-rpe': el => { S.active.rpe = +el.dataset.v; S.active.notes = $('#plNotes').value; renderPlayer(); },
  'pl-save': () => {
    const a = S.active, w = curW();
    w.status = 'done';
    w.log = a.log;
    w.doneAt = Date.now();
    w.durationSec = Math.round((a.finish - a.start) / 1000);
    w.rpe = a.rpe || null;
    w.notes = $('#plNotes').value.trim();
    if (w.date > today()) w.date = today();
    delete w.adhoc;
    S.active = null;
    save();
    closePlayer();
    toast('Тренировка сохранена 💪');
    go('home');
  },
};

/* ================= Старт ================= */
buildNav();
render();
if (S.active) openPlayer();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
