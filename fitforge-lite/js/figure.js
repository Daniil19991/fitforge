/* Анимированная фигурка: углы сегментов → координаты суставов → SVG.
   Один общий requestAnimationFrame на все фигурки, невидимые не перерисовываются. */

const Figure = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const L = { sh: 44, neck: 48, headOff: 12, headR: 9, ua: 27, fa: 25, th: 38, shin: 37, foot: 12 };
  const GROUND = 180;
  const RAD = Math.PI / 180;
  const HELD_TYPES = ['dumbbell', 'kettlebell', 'barbell'];

  const dir = (a, l) => [Math.sin(a * RAD) * l, Math.cos(a * RAD) * l];
  const add = (p, v) => [p[0] + v[0], p[1] + v[1]];
  const ease = u => (1 - Math.cos(Math.PI * u)) / 2;

  function norm(k, view) {
    if (view === 'front') {
      const a = k.a || [8, 4], l = k.l || [4, 0];
      return { a, a2: k.a2 || a, l, l2: k.l2 || l, dx: k.dx || 0, dy: k.dy || 0, rope: k.rope || 0 };
    }
    const a1 = k.a1 || [0, 0], l1 = k.l1 || [0, 0, 90];
    return { t: k.t ?? 180, h: k.h || 0, a1, a2: k.a2 || a1, l1, l2: k.l2 || l1, dx: k.dx || 0, dy: k.dy || 0 };
  }

  function lerpPose(A, B, u) {
    const o = {};
    for (const k in A) {
      const a = A[k], b = B[k];
      o[k] = Array.isArray(a) ? a.map((v, i) => v + (b[i] - v) * u) : a + (b - a) * u;
    }
    return o;
  }

  function solveSide(P) {
    const S = dir(P.t, L.sh), N = dir(P.t, L.neck);
    const arm = a => { const e = add(S, dir(a[0], L.ua)); return [e, add(e, dir(a[1], L.fa))]; };
    const leg = l => { const k = dir(l[0], L.th); const an = add(k, dir(l[1], L.shin)); return [k, an, add(an, dir(l[2], L.foot))]; };
    const [e1, w1] = arm(P.a1), [e2, w2] = arm(P.a2);
    const [k1, an1, t1] = leg(P.l1), [k2, an2, t2] = leg(P.l2);
    const head = add(N, dir(P.t + P.h, L.headOff));
    const face = P.t + P.h - 90;
    return {
      hip: [0, 0], hip1: [0, 0], hip2: [0, 0], sh: S, sh2: S, neck: N, head,
      nose: add(head, dir(face, 7.5)),
      elbow: e1, hand: w1, elbow2: e2, hand2: w2,
      knee: k1, ankle: an1, toe: t1, knee2: k2, ankle2: an2, toe2: t2,
    };
  }

  function solveFront(P) {
    const sd = (a, l, s) => [s * Math.sin(a * RAD) * l, Math.cos(a * RAD) * l];
    const s1 = [-13, -L.sh + 1], s2 = [13, -L.sh + 1], h1 = [-7, 0], h2 = [7, 0];
    const arm = (S, a, s) => { const e = add(S, sd(a[0], L.ua, s)); return [e, add(e, sd(a[1], L.fa, s))]; };
    const leg = (H, l, s) => { const k = add(H, sd(l[0], L.th, s)); const an = add(k, sd(l[1], L.shin, s)); return [k, an, add(an, [s * 7, 1])]; };
    const [e1, w1] = arm(s1, P.a, -1), [e2, w2] = arm(s2, P.a2, 1);
    const [k1, an1, t1] = leg(h1, P.l, -1), [k2, an2, t2] = leg(h2, P.l2, 1);
    return {
      hip: [0, 0], hip1: h1, hip2: h2, sh: s1, sh2: s2, neck: [0, -L.neck], head: [0, -L.neck - L.headOff],
      elbow: e1, hand: w1, elbow2: e2, hand2: w2,
      knee: k1, ankle: an1, toe: t1, knee2: k2, ankle2: an2, toe2: t2,
    };
  }

  function anchorOffset(J, an) {
    if (an.p === 'ground') {
      const y = Math.max(J.ankle[1], J.ankle2[1], J.toe[1], J.toe2[1]);
      return [an.at[0] - J.hip[0], an.at[1] - y];
    }
    const p = J[an.p];
    return [an.at[0] - p[0], an.at[1] - p[1]];
  }

  // Поза в момент времени time (секунды)
  function frame(anim, time) {
    const view = anim.view || 'side';
    if (!anim._n) anim._n = anim.keys.map(k => norm(k, view));
    const keys = anim._n, raw = anim.keys, N = keys.length;
    const segs = anim.mode === 'cycle' ? N - 1 : (N === 1 ? 1 : N);
    const dur = anim.dur ?? 1.1, hold = anim.hold ?? 0.25;
    const total = segs * (dur + hold);
    let t = ((time % total) + total) % total;
    const i = Math.min(segs - 1, Math.floor(t / (dur + hold)));
    t -= i * (dur + hold);
    const u = t < hold ? 0 : ease(Math.min(1, (t - hold) / dur));
    const j = (i + 1) % N;
    const P = lerpPose(keys[i], keys[j], u);
    const J = view === 'front' ? solveFront(P) : solveSide(P);
    const defA = anim.anchor || { p: 'ankle', at: [105, 180] };
    const oA = anchorOffset(J, raw[i].anchor || defA);
    const oB = anchorOffset(J, raw[j].anchor || defA);
    const off = [oA[0] + (oB[0] - oA[0]) * u + P.dx, oA[1] + (oB[1] - oA[1]) * u + P.dy];
    for (const k in J) J[k] = [J[k][0] + off[0], J[k][1] + off[1]];
    return { P, J, i, j, u, anA: raw[i].anchor || defA, anB: raw[j].anchor || defA };
  }

  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  const setLine = (n, a, b) => {
    n.setAttribute('x1', a[0].toFixed(1)); n.setAttribute('y1', a[1].toFixed(1));
    n.setAttribute('x2', b[0].toFixed(1)); n.setAttribute('y2', b[1].toFixed(1));
  };

  function heldItem(ex, inv) {
    const g = (ex.eq || []).find(gr => gr.some(x => HELD_TYPES.includes(x)));
    if (!g) return 'dumbbell';
    const opts = g.filter(x => HELD_TYPES.includes(x));
    return opts.find(x => (inv || []).includes(x)) || opts[0];
  }

  function drawStatic(g, ex, anim) {
    const props = anim.props || [];
    for (const p of props) {
      if (p.type === 'bench') {
        el('rect', { x: p.x, y: p.y, width: p.w, height: 6, rx: 2, class: 'prop' }, g);
        el('line', { x1: p.x + 7, y1: p.y + 6, x2: p.x + 7, y2: GROUND, class: 'prop-line' }, g);
        el('line', { x1: p.x + p.w - 7, y1: p.y + 6, x2: p.x + p.w - 7, y2: GROUND, class: 'prop-line' }, g);
      } else if (p.type === 'box') {
        el('rect', { x: p.x, y: p.y, width: p.w, height: p.h, rx: 3, class: 'prop' }, g);
      } else if (p.type === 'wall') {
        el('rect', { x: p.x - 8, y: 8, width: 8, height: GROUND - 8, class: 'prop' }, g);
      } else if (p.type === 'pullbar') {
        el('line', { x1: p.x - 42, y1: 0, x2: p.x - 42, y2: p.y, class: 'prop-line' }, g);
        el('line', { x1: p.x + 42, y1: 0, x2: p.x + 42, y2: p.y, class: 'prop-line' }, g);
        el('line', { x1: p.x - 46, y1: p.y, x2: p.x + 46, y2: p.y, class: 'prop-bar' }, g);
      } else if (p.type === 'dipbar') {
        el('line', { x1: p.x1 + 10, y1: p.y, x2: p.x1 + 10, y2: GROUND, class: 'prop-line' }, g);
        el('line', { x1: p.x2 - 10, y1: p.y, x2: p.x2 - 10, y2: GROUND, class: 'prop-line' }, g);
        el('line', { x1: p.x1, y1: p.y, x2: p.x2, y2: p.y, class: 'prop-bar' }, g);
      }
    }
  }

  function makeHeld(parent, item, view) {
    const g = el('g', { class: 'held' }, parent);
    if (item === 'kettlebell') {
      el('path', { d: 'M -5 3 Q 0 -5 5 3', class: 'held-handle' }, g);
      el('circle', { cx: 0, cy: 9, r: 8, class: 'held-body' }, g);
    } else if (item === 'barbell' && view !== 'front') {
      el('circle', { cx: 0, cy: 0, r: 17, class: 'held-body plate' }, g);
      el('circle', { cx: 0, cy: 0, r: 3.5, class: 'held-hub' }, g);
    } else {
      el('rect', { x: -8, y: -2, width: 16, height: 4, rx: 1.5, class: 'held-handle-fill' }, g);
      el('rect', { x: -9, y: -6, width: 5, height: 12, rx: 1.5, class: 'held-body' }, g);
      el('rect', { x: 4, y: -6, width: 5, height: 12, rx: 1.5, class: 'held-body' }, g);
    }
    return g;
  }

  function build(svg, ex, opts) {
    const anim = ex.anim;
    const view = anim.view || 'side';
    const hl = new Set(ex.hl || {
      legs: ['th', 'shin'], chest: ['torso', 'ua'], back: ['torso'], shoulders: ['ua'],
      arms: ['ua', 'fa'], core: ['torso'], cardio: [], mobility: [],
    }[ex.group] || []);
    svg.setAttribute('viewBox', '0 0 220 200');
    svg.setAttribute('class', 'figure-svg');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Анимация: ' + ex.name);
    el('line', { x1: 4, y1: GROUND + 1, x2: 216, y2: GROUND + 1, class: 'ground' }, svg);
    if (ex.mat) el('rect', { x: 18, y: GROUND - 2, width: 184, height: 4, rx: 2, class: 'mat' }, svg);
    drawStatic(el('g', {}, svg), ex, anim);

    const item = heldItem(ex, opts.inventory);
    const parts = [];
    const seg = (name, a, b, parent, extra) => {
      const n = el('line', { class: 'seg seg-' + name + (hl.has(name) ? ' hl' : '') + (extra || '') }, parent);
      parts.push([n, a, b]);
    };
    const dyn = {};
    const props = anim.props || [];
    const far = el('g', { class: view === 'front' ? '' : 'far' }, svg);
    const farHeld = el('g', {}, svg);
    const body = el('g', {}, svg);

    if (view === 'front') {
      seg('th', 'hip1', 'knee', far); seg('shin', 'knee', 'ankle', far); seg('ft', 'ankle', 'toe', far);
      seg('th', 'hip2', 'knee2', far); seg('shin', 'knee2', 'ankle2', far); seg('ft', 'ankle2', 'toe2', far);
      seg('torso', 'hip', 'neck', body, ' torso-front');
      seg('torso', 'sh', 'sh2', body, ' shoulders');
      seg('torso', 'hip1', 'hip2', body, ' pelvis');
      seg('ua', 'sh', 'elbow', body); seg('fa', 'elbow', 'hand', body);
      seg('ua', 'sh2', 'elbow2', body); seg('fa', 'elbow2', 'hand2', body);
    } else {
      seg('ua', 'sh2', 'elbow2', far); seg('fa', 'elbow2', 'hand2', far);
      seg('th', 'hip', 'knee2', far); seg('shin', 'knee2', 'ankle2', far); seg('ft', 'ankle2', 'toe2', far);
      seg('torso', 'hip', 'neck', body);
    }
    dyn.head = el('circle', { r: L.headR, class: 'head' }, body);
    if (view !== 'front') dyn.nose = el('circle', { r: 2.2, class: 'nose' }, body);
    if (view !== 'front') {
      seg('th', 'hip', 'knee', body); seg('shin', 'knee', 'ankle', body); seg('ft', 'ankle', 'toe', body);
      seg('ua', 'sh', 'elbow', body); seg('fa', 'elbow', 'hand', body);
    }

    const helds = [];
    const bands = [];
    let rope = null;
    for (const p of props) {
      if (p.type === 'held') {
        const at = p.at || 'hand';
        if (!p.single && at === 'hand') {
          helds.push([makeHeld(view === 'front' ? body : farHeld, item, view), 'hand2', [0, 0]]);
          if (view !== 'front') farHeld.setAttribute('class', 'far');
        }
        // штанга на плечах рисуется за телом, чтобы не закрывать голову
        helds.push([makeHeld(at === 'sh' ? farHeld : body, item, view), at, at === 'sh' ? [-4, -2] : [0, 0]]);
      } else if (p.type === 'band') {
        bands.push([el('line', { class: 'band' }, body), p.from, p.to]);
      } else if (p.type === 'rope') {
        rope = el('path', { class: 'rope' }, body);
      }
    }

    return function draw(time) {
      const { P, J } = frame(anim, time);
      for (const [n, a, b] of parts) setLine(n, J[a], J[b]);
      dyn.head.setAttribute('cx', J.head[0].toFixed(1));
      dyn.head.setAttribute('cy', J.head[1].toFixed(1));
      if (dyn.nose) { dyn.nose.setAttribute('cx', J.nose[0].toFixed(1)); dyn.nose.setAttribute('cy', J.nose[1].toFixed(1)); }
      for (const [g, at, o] of helds) g.setAttribute('transform', `translate(${(J[at][0] + o[0]).toFixed(1)} ${(J[at][1] + o[1]).toFixed(1)})`);
      for (const [n, a, b] of bands) setLine(n, J[a], Array.isArray(b) ? b : J[b]);
      if (rope) {
        const hy = (J.hand[1] + J.hand2[1]) / 2;
        const c = Math.cos(P.rope * RAD);
        const apex = c >= 0 ? hy + (GROUND + 2 - hy) * c : hy + (hy - 12) * c;
        const cy = 2 * apex - hy, cx = (J.hand[0] + J.hand2[0]) / 2;
        rope.setAttribute('d', `M ${J.hand[0].toFixed(1)} ${J.hand[1].toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${J.hand2[0].toFixed(1)} ${J.hand2[1].toFixed(1)}`);
        const behind = Math.sin(P.rope * RAD) > 0;
        rope.style.opacity = behind ? 0.35 : 1;
      }
    };
  }

  /* ---- Общий тикер ---- */
  const live = new Set();
  let running = false;
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver(es => es.forEach(e => { if (e.target._fig) e.target._fig.visible = e.isIntersecting; }))
    : null;

  function tick(now) {
    for (const f of live) {
      if (!f.host.isConnected) { live.delete(f); io && io.unobserve(f.host); continue; }
      if (f.visible && !f.paused) f.draw((now / 1000) * f.speed + f.phase);
    }
    if (live.size) requestAnimationFrame(tick); else running = false;
  }

  function mount(host, ex, opts = {}) {
    if (!ex || !ex.anim) return null;
    host.innerHTML = '';
    const svg = document.createElementNS(NS, 'svg');
    host.appendChild(svg);
    const f = {
      host, draw: build(svg, ex, opts), speed: opts.speed || 1,
      phase: opts.phase ?? Math.random() * 3, visible: !io, paused: false,
    };
    f.draw(f.phase);
    host._fig = f;
    if (opts.still) return f;
    live.add(f);
    io && io.observe(host);
    if (!running) { running = true; requestAnimationFrame(tick); }
    return f;
  }

  // Длительность полного цикла анимации, секунды
  function period(anim) {
    const N = anim.keys.length;
    const segs = anim.mode === 'cycle' ? N - 1 : (N === 1 ? 1 : N);
    return segs * ((anim.dur ?? 1.1) + (anim.hold ?? 0.25));
  }

  return { mount, heldItem, frame, period };
})();
