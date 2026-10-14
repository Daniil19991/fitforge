/* Подбор тренировок по анкете, инвентарю и истории. */

const Gen = (() => {
  const GOAL_P = {
    strength: { sets: 4, reps: [4, 6], bw: [6, 10], rest: 150, time: 40 },
    muscle: { sets: 3, reps: [8, 12], bw: [10, 15], rest: 90, time: 40 },
    fatloss: { sets: 3, reps: [12, 15], bw: [12, 20], rest: 45, time: 40 },
    endurance: { sets: 3, reps: [15, 20], bw: [15, 25], rest: 30, time: 50 },
    health: { sets: 3, reps: [10, 12], bw: [10, 15], rest: 60, time: 35 },
  };
  // Упражнения, где повторов обычно заметно меньше
  const REP_SCALE = { pullup: 0.4, dips: 0.6, pikepushup: 0.6, burpee: 0.6, hangknee: 0.7, pushup: 0.8, jumpsquat: 0.7, legraise: 0.8 };
  const ISOLATION = ['bi', 'tri', 'calves'];

  const bmi = p => p.weight && p.height ? p.weight / Math.pow(p.height / 100, 2) : 22;
  const lowImpact = p => (p.limits || []).includes('knee') || p.noJumps || p.age >= 55 || bmi(p) >= 32;
  const hasEq = (ex, inv) => ex.eq.every(g => g.some(x => inv.includes(x)));
  const allowed = (ex, p) => !ex.stress.some(s => (p.limits || []).includes(s)) && !(ex.impact && lowImpact(p));
  const round5 = x => Math.max(10, Math.round(x / 5) * 5);

  function recentIds(workouts, n = 3) {
    const done = workouts.filter(w => w.status === 'done').sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0)).slice(0, n);
    return new Set(done.flatMap(w => w.items.map(i => i.ex)));
  }

  function candidates(pattern, ctx) {
    return EXERCISES.filter(e => e.pat.includes(pattern) && hasEq(e, ctx.inv) && allowed(e, ctx.profile) && e.lvl <= ctx.profile.level);
  }

  function score(e, pattern, ctx) {
    const p = ctx.profile;
    let s = 1 + Math.random() * 1.2;
    if (ctx.recent.has(e.id)) s -= 0.6;
    if (e.pat[0] === pattern) s += 0.3;
    if (e.lvl === p.level) s += 0.4;
    if ((p.goal === 'strength' || p.goal === 'muscle') && e.weighted) s += 0.9;
    if ((p.goal === 'fatloss' || p.goal === 'endurance') && e.pat.includes('cardio')) s += 0.3;
    if ((p.focus || []).includes(e.group)) s += 0.7;
    return s;
  }

  function pick(slot, ctx) {
    const tries = slot.split('|');
    for (const pat of tries) {
      const c = candidates(pat, ctx).filter(e => !ctx.used.has(e.id));
      if (c.length) return best(c, pat, ctx);
    }
    for (const pat of tries) {
      for (const fb of SLOT_FALLBACK[pat] || []) {
        const c = candidates(fb, ctx).filter(e => !ctx.used.has(e.id));
        if (c.length) return best(c, fb, ctx);
      }
    }
    return null;
  }
  function best(list, pat, ctx) {
    let b = null, bs = -Infinity;
    for (const e of list) { const s = score(e, pat, ctx); if (s > bs) { bs = s; b = e; } }
    return b;
  }

  function prescribe(ex, profile, type, sec) {
    const lvl = profile.level || 1;
    const G = GOAL_P[profile.goal] || GOAL_P.health;
    const base = { ex: ex.id, sec, sets: 1, rmin: 0, rmax: 0, time: 0, rest: 10 };
    if (sec === 'warm') return { ...base, time: 40 };
    if (sec === 'cool') return { ...base, time: ex.uni ? 60 : 40 };
    if (type === 'hiit') {
      return { ...base, sets: [2, 3, 4][lvl - 1], time: [30, 40, 45][lvl - 1], rest: [30, 20, 15][lvl - 1] };
    }
    if (type === 'mobility') return { ...base, sets: 2, time: ex.uni ? 60 : 40, rest: 15 };

    const sets = Math.min(5, Math.max(2, G.sets + (lvl === 1 ? -1 : lvl === 3 ? 1 : 0)));
    let rest = G.rest + (profile.age >= 50 ? 15 : 0);
    if (ISOLATION.some(p => ex.pat.includes(p))) rest = Math.min(rest, 75);
    if (ex.group === 'core') rest = Math.min(rest, 60);
    if (ex.kind === 'time') {
      let t = G.time * [0.6, 1, 1.4][lvl - 1];
      if (ex.id === 'deadhang') t *= 0.7;
      return { ...base, sets, time: round5(t), rest: Math.min(rest, 60) };
    }
    let [a, b] = ex.weighted ? G.reps : G.bw;
    if (!ex.weighted) {
      const k = [0.6, 0.85, 1.1][lvl - 1] * (REP_SCALE[ex.id] || 1);
      a = Math.max(3, Math.round(a * k)); b = Math.max(a + 1, Math.round(b * k));
    }
    if (ex.uni && b > 15) { a = Math.round(a * 0.7); b = Math.round(b * 0.7); }
    return { ...base, sets, rmin: a, rmax: b, rest };
  }

  function estimate(item) {
    const ex = EX[item.ex];
    const work = item.time ? item.time * (ex && ex.uni && item.sec === 'main' ? 2 : 1) : (item.rmax || 10) * 3.5 * (ex && ex.uni ? 2 : 1);
    return item.sets * (work + item.rest) + 20;
  }
  const estimateMin = items => Math.max(5, Math.round(items.reduce((s, i) => s + estimate(i), 0) / 60));

  function generate(opt) {
    const { type, duration, inv, profile, warm, cool, workouts } = opt;
    const ctx = { inv, profile, used: new Set(), recent: recentIds(workouts || []) };
    const items = [];
    let est = 0;
    const budget = duration * 60;

    if (warm && type !== 'mobility') {
      const n = duration >= 30 ? 3 : 2;
      for (let i = 0; i < n; i++) {
        const e = pick('warmup', ctx);
        if (!e) break;
        ctx.used.add(e.id);
        const it = prescribe(e, profile, type, 'warm');
        items.push(it); est += estimate(it);
      }
    }
    const coolItems = [];
    if (cool && type !== 'mobility') {
      for (let i = 0; i < 2; i++) {
        const e = pick('stretch', ctx);
        if (!e) break;
        ctx.used.add(e.id);
        const it = prescribe(e, profile, type, 'cool');
        coolItems.push(it); est += estimate(it);
      }
    }
    const slots = WORKOUT_TYPES[type].slots;
    let main = 0, miss = 0;
    for (let i = 0; i < 40 && miss < slots.length; i++) {
      const e = pick(slots[i % slots.length], ctx);
      if (!e) { miss++; continue; }
      miss = 0;
      const it = prescribe(e, profile, type, 'main');
      const cost = estimate(it);
      if (main >= 3 && est + cost > budget * 1.08) break;
      ctx.used.add(e.id);
      items.push(it); est += cost; main++;
      if (est >= budget) break;
    }
    return {
      title: WORKOUT_TYPES[type].name,
      type,
      items: items.concat(coolItems),
    };
  }

  // Следующая подходящая замена упражнения
  function alternative(item, list, inv, profile, type) {
    const ex = EX[item.ex];
    const ctx = { inv, profile, used: new Set(), recent: new Set() };
    const inUse = new Set(list.map(i => i.ex));
    const pats = item.sec === 'warm' ? ['warmup'] : item.sec === 'cool' ? ['stretch'] : ex.pat.filter(p => p !== 'warmup');
    const seen = new Set();
    const opts = [];
    for (const p of pats.concat(pats.flatMap(p => SLOT_FALLBACK[p] || []))) {
      for (const e of candidates(p, ctx)) if (!seen.has(e.id) && (e.id === ex.id || !inUse.has(e.id))) { seen.add(e.id); opts.push(e); }
    }
    if (opts.length < 2) return null;
    const idx = opts.findIndex(e => e.id === ex.id);
    const next = opts[(idx + 1) % opts.length];
    if (next.id === ex.id) return null;
    return prescribe(next, profile, type, item.sec);
  }

  function rotation(n, goal) {
    n = Math.max(1, Math.min(7, n));
    const base = {
      1: ['full'], 2: ['full', 'full'], 3: ['full', 'full', 'full'],
      4: ['upper', 'lower', 'upper', 'lower'],
      5: ['push', 'pull', 'lower', 'upper', 'lower'],
      6: ['push', 'pull', 'lower', 'push', 'pull', 'lower'],
      7: ['push', 'pull', 'lower', 'mobility', 'push', 'pull', 'lower'],
    }[n].slice();
    if ((goal === 'fatloss' || goal === 'endurance') && n >= 3) base[Math.floor(n / 2)] = 'hiit';
    return base;
  }

  function suggestWeight(exId, item, workouts) {
    const last = lastPerformance(exId, workouts);
    if (!last) return null;
    const ws = last.sets.filter(s => s.done && s.w > 0);
    if (!ws.length) return null;
    const maxW = Math.max(...ws.map(s => s.w));
    const allHit = item.rmax && ws.every(s => (s.reps || 0) >= item.rmax);
    return allHit ? { w: maxW + (maxW < 20 ? 1 : 2.5), up: true } : { w: maxW, up: false };
  }

  function lastPerformance(exId, workouts) {
    const done = workouts.filter(w => w.status === 'done' && w.log).sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));
    for (const w of done) {
      const idx = w.items.findIndex(i => i.ex === exId);
      if (idx >= 0 && w.log[idx] && w.log[idx].some(s => s.done)) return { sets: w.log[idx], date: w.date, item: w.items[idx] };
    }
    return null;
  }

  return { generate, prescribe, alternative, rotation, estimateMin, suggestWeight, lastPerformance, bmi, lowImpact, hasEq, allowed };
})();
