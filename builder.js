// Builder World: an endless world to explore and build a factory in. Gather wood, rock, metal and berries,
// tame wolves into dogs and rats into helpers, and run conveyor belts back to the centre tower, which is the
// only place stuff can be spent. Days and nights go round forever, and every night the monsters come for the
// tower, so build walls and turrets. Each night brings more monsters than the last.
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);

  // ── The rules ────────────────────────────────────────────────────────────
  const FIRST_DAY = 200, DAY_LEN = 150, NIGHT_LEN = 80;   // seconds
  const BELT_SPEED = 2;          // tiles a second
  const PACK_MAX = 30;           // things you can carry
  const RAT_BOOST = 0.05;        // every tamed rat makes harvesters 5% faster
  const CHICK_BOOST = 0.05;      // every tamed chicken makes dogs 5% stronger
  const OWL_RANGE = 4, OWL_HEAL = 6;   // owls heal you and your dogs this close, this much a second
  const TOWER_HP = 600;
  const START = { wood: 6, rock: 6, metal: 6, berry: 0 };
  const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];            // 0 right, 1 down, 2 left, 3 up
  const ARROWS = ['→', '↓', '←', '↑'];

  const ITEMS = { wood: '🪵', rock: '🪨', metal: '🔩', berry: '🫐' };
  const NODES = {
    tree:  { name: 'tree', gives: 'wood', amt: 6 },
    rock:  { name: 'rock', gives: 'rock', amt: 5 },
    metal: { name: 'metal scraps', gives: 'metal', amt: 3 },
    berry: { name: 'berry bush', gives: 'berry', amt: 4, regrow: 45 },
  };

  const BUILD = {
    belt:     { name: 'Conveyor Belt', short: 'Belt', icon: '➡️', cost: { metal: 1, rock: 1 }, hp: 25, dir: true,
                about: 'Carries stuff the way the arrow points. Drag to lay a line, and lead it into the tower!' },
    splitter: { name: 'Splitter', short: 'Splitter', icon: '🔀', cost: { metal: 2, rock: 1 }, hp: 35, dir: true,
                about: 'Sends things left, straight on and right, taking turns.' },
    over:     { name: 'Over Belt', short: 'Over Belt', icon: '🌉', cost: { metal: 2, rock: 2 }, hp: 25, dir: true,
                about: 'A raised belt that goes over other belts so lines can cross. Drag to lay a line. Stuff drops off its end onto a belt or the tower.' },
    wall:     { name: 'Wall', short: 'Wall', icon: '🧱', cost: { wood: 2, rock: 2 }, hp: 90, solid: true,
                about: 'Monsters have to break through walls to get past. Drag to build a line.' },
    hwood:    { name: 'Wood Harvester', short: 'Wood H.', icon: '🪓', cost: { metal: 1, wood: 2 }, hp: 50, dir: true, solid: true,
                on: 'tree', makes: 'wood', every: 4, color: '#7a5230', about: 'Build it on a tree. Pushes wood out of its arrow side.' },
    hrock:    { name: 'Rock Harvester', short: 'Rock H.', icon: '⛏️', cost: { metal: 2, rock: 1 }, hp: 50, dir: true, solid: true,
                on: 'rock', makes: 'rock', every: 4.5, color: '#6d6d78', about: 'Build it on a rock. Pushes rock out of its arrow side.' },
    hmetal:   { name: 'Metal Harvester', short: 'Metal H.', icon: '🧲', cost: { metal: 3 }, hp: 50, dir: true, solid: true,
                on: 'metal', makes: 'metal', every: 6, color: '#4f6f86', about: 'Build it on metal scraps. Pushes metal out of its arrow side.' },
    tbasic:   { name: 'Basic Turret', short: 'Basic', icon: '🔫', cost: { wood: 2, rock: 2, metal: 2 }, hp: 60, solid: true, turret: true,
                range: 5, every: 0.5, dmg: 6, shot: 'bullet', barrel: '#cfd6de', bl: 0.46, bw: 0.14, cap: '#9aa5b1',
                about: 'Quick little shots. Range 5.' },
    tsniper:  { name: 'Sniper Turret', short: 'Sniper', icon: '🎯', cost: { wood: 2, metal: 5 }, hp: 50, solid: true, turret: true,
                range: 10, every: 1.8, dmg: 45, shot: 'snipe', barrel: '#d9bb72', bl: 0.62, bw: 0.08, cap: '#c99a3a',
                about: 'Slow but hits very hard from very far. Range 10.' },
    tfire:    { name: 'Fire Turret', short: 'Fire', icon: '🔥', cost: { wood: 4, rock: 2, metal: 4 }, hp: 70, solid: true, turret: true,
                range: 3, dps: 10, shot: 'fire', barrel: '#ff8a3d', bl: 0.34, bw: 0.24, cap: '#e8590c',
                about: 'Burns every monster close by, all at once. Range 3.' },
    tmega:    { name: 'Mega Turret', short: 'Mega', icon: '💥', cost: { wood: 4, rock: 8, metal: 10 }, hp: 150, solid: true, turret: true,
                range: 6.5, every: 1.2, dmg: 35, splash: 1.6, shot: 'shell', barrel: '#30343a', bl: 0.52, bw: 0.13, cap: '#e03131',
                about: 'Big exploding shells that hurt everyone nearby. Range 6.5.' },
  };

  const MON = {
    rallet: { name: 'Rallet', icon: '👹', hp: 30, speed: 1.5, dmg: 6, every: 0.8, r: 0.36, size: 0.85, about: 'the basic monster' },
    archen: { name: 'Archen', icon: '💀', hp: 22, speed: 1.3, dmg: 5, every: 1.7, r: 0.34, size: 0.8, ranged: true, range: 6, about: 'stops and shoots arrows' },
    minsi:  { name: 'Minsi', icon: '👾', hp: 8, speed: 3.2, dmg: 2, every: 0.5, r: 0.24, size: 0.5, about: 'tiny, weak and fast' },
    megso:  { name: 'Megso', icon: '🧌', hp: 220, speed: 0.65, dmg: 28, every: 1.4, r: 0.62, size: 1.6, about: 'giant, strong and slow' },
    double: { name: 'Doubleshot', icon: '👺', hp: 40, speed: 1.1, dmg: 6, every: 2.2, r: 0.36, size: 0.9, ranged: true, range: 9, twin: true,
              about: 'shoots 2 bullets at a time from super far away (only snipers reach that far)' },
  };
  const TAME = { wolf: 5, rat: 2, chicken: 7, owl: 9 };
  const WILD = { wolf: { icon: '🐺', size: 0.8, sp: 1.3 }, rat: { icon: '🐀', size: 0.55, sp: 1 },
                 chicken: { icon: '🐔', size: 0.6, sp: 0.9 }, owl: { icon: '🦉', size: 0.65, sp: 1.6 } };

  const TOOLS = ['hand', 'belt', 'over', 'splitter', 'wall', 'hwood', 'hrock', 'hmetal', 'tbasic', 'tsniper', 'tfire', 'tmega', 'remove'];
  const TOOL_KEYS = { '1': 'belt', '2': 'splitter', '3': 'wall', '4': 'hwood', '5': 'hrock', '6': 'hmetal',
                      '7': 'tbasic', '8': 'tsniper', '9': 'tfire', '0': 'tmega', 'o': 'over', 'x': 'remove', 'q': 'hand', 'escape': 'hand' };
  const SAVE_KEY = 'builderworld-save-v1', BEST_KEY = 'builderworld-best';

  // ── Little helpers ───────────────────────────────────────────────────────
  const key = (x, y) => x + ',' + y;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const rand = (a, b) => a + Math.random() * (b - a);
  const fmt = (s) => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const costText = (c) => Object.entries(c).map(([k, v]) => v + ITEMS[k]).join(' ');
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* no storage: fine */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* fine */ } },
  };

  function hash(x, y, s) {
    let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1274126177)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1103515245);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function vnoise(x, y, sc, s) {
    const fx = x / sc, fy = y / sc, ix = Math.floor(fx), iy = Math.floor(fy);
    const tx = fx - ix, ty = fy - iy, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    const a = hash(ix, iy, s), b = hash(ix + 1, iy, s), c = hash(ix, iy + 1, s), d = hash(ix + 1, iy + 1, s);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  }

  // ── The world ────────────────────────────────────────────────────────────
  let S = null;   // everything about the world being played

  function genNode(x, y) {
    if (x * x + y * y < 12) return null;                    // a clear space around the tower
    const sd = S.seed, r = hash(x, y, sd);
    const forest = vnoise(x, y, 9, sd + 11), rocky = vnoise(x, y, 12, sd + 29);
    let p = forest > 0.62 ? 0.3 : 0.025;
    if (r < p) return { type: 'tree', amt: NODES.tree.amt };
    p += rocky > 0.64 ? 0.2 : 0.018;
    if (r < p) return { type: 'rock', amt: NODES.rock.amt };
    p += rocky > 0.64 ? 0.045 : 0.011;
    if (r < p) return { type: 'metal', amt: NODES.metal.amt };
    p += 0.014;
    if (r < p) return { type: 'berry', amt: NODES.berry.amt };
    return null;
  }
  function nodeAt(x, y) {
    const k = key(x, y);
    const n = S.changed.has(k) ? S.changed.get(k) : genNode(x, y);
    if (n && n.type === 'berry' && n.regrowAt && S.T >= n.regrowAt) { n.amt = NODES.berry.amt; n.regrowAt = 0; }
    return n;
  }

  function newWorld() {
    S = {
      seed: (Math.random() * 1e9) | 0, T: 0, phase: 'day', clock: 0, night: 0, warned: false,
      stock: { ...START }, pack: { wood: 0, rock: 0, metal: 0, berry: 0 },
      changed: new Map(), builds: new Map(), raised: new Map(), list: [], tower: null,
      player: { x: 0, y: 2.6, hp: 100, dead: 0, calm: 9, cd: 0, face: -1 },
      monsters: [], animals: [], dogs: [], rats: [], chickens: [], owls: [], shots: [], fx: [], queue: [],
      animalT: 0, kills: 0, over: false,
    };
    makeTower(TOWER_HP);
    // A few things close by so the first minute isn't spent wandering.
    const near = [['tree', 4, 1], ['tree', 5, 2], ['tree', -4, 3], ['tree', -5, 2], ['rock', -3, -4], ['rock', 4, -3],
                  ['metal', 2, 4], ['metal', -5, -1], ['berry', -2, 5], ['berry', 5, -1]];
    for (const [t, x, y] of near) S.changed.set(key(x, y), { type: t, amt: NODES[t].amt });
  }
  function makeTower(hp) {
    S.tower = { type: 'tower', x: -1, y: -1, hp, max: TOWER_HP, hit: 0 };
    for (const [x, y] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) S.builds.set(key(x, y), S.tower);
  }

  // ── Saving ───────────────────────────────────────────────────────────────
  function save() {
    if (!S || S.over || S.phase === 'night') return;      // a world saves during the day (and at dawn)
    const data = {
      v: 1, seed: S.seed, T: S.T, clock: S.clock, night: S.night, stock: S.stock, pack: S.pack, kills: S.kills,
      px: S.player.x, py: S.player.y, tower: S.tower.hp, rats: S.rats.length, dogs: S.dogs.length,
      chickens: S.chickens.length, owls: S.owls.length,
      changed: [...S.changed], builds: S.list.map((b) => [b.type, b.x, b.y, b.dir, Math.ceil(b.hp)]),
    };
    store.set(SAVE_KEY, JSON.stringify(data));
  }
  function load() {
    let d;
    try { d = JSON.parse(store.get(SAVE_KEY)); } catch (e) { return false; }
    if (!d || d.v !== 1) return false;
    newWorld();
    S.changed = new Map(d.changed); S.seed = d.seed; S.T = d.T; S.clock = d.clock; S.night = d.night;
    S.stock = d.stock; S.pack = d.pack; S.kills = d.kills || 0;
    S.player.x = d.px; S.player.y = d.py; S.tower.hp = d.tower;
    for (const [t, x, y, dir, hp] of d.builds) {
      if (!BUILD[t]) continue;
      const b = makeBuilding(t, x, y, dir); b.hp = hp;
      layer(t).set(key(x, y), b); S.list.push(b);
    }
    for (let i = 0; i < d.rats; i++) addRat(rand(-2, 2), rand(1.5, 3));
    for (let i = 0; i < d.dogs; i++) addDog(S.player.x + rand(-1, 1), S.player.y + rand(-1, 1));
    for (let i = 0; i < (d.chickens || 0); i++) addChicken(rand(-2, 2), rand(1.5, 3));
    for (let i = 0; i < (d.owls || 0); i++) addOwl(S.player.x + rand(-1, 1), S.player.y + rand(-1, 1));
    return true;
  }

  // ── Building ─────────────────────────────────────────────────────────────
  const afford = (c) => Object.entries(c).every(([k, v]) => S.stock[k] >= v);
  const pay = (c) => { for (const k in c) S.stock[k] -= c[k]; };
  const refund = (c) => { for (const k in c) S.stock[k] += c[k]; };
  const isSolid = (b) => b.type === 'tower' || !!BUILD[b.type].solid;
  const layer = (t) => (t === 'over' ? S.raised : S.builds);   // over belts sit on their own layer, above the ground
  const topAt = (x, y) => S.raised.get(key(x, y)) || S.builds.get(key(x, y));
  function solidAt(x, y) { const b = S.builds.get(key(x, y)); return b && isSolid(b) ? b : null; }

  function makeBuilding(type, x, y, dir) {
    const d = BUILD[type];
    return { type, x, y, dir: d.dir ? dir : 0, hp: d.hp, item: null, prog: 0, buf: 0, cd: d.every || 0, next: 0,
             ang: -Math.PI / 2, firing: 0, hit: 0, dead: false };
  }
  function whyNot(type, x, y) {
    const d = BUILD[type];
    const g = S.builds.get(key(x, y));
    if (type === 'over') {
      if (S.raised.has(key(x, y))) return 'There is already an over belt there.';
      if (g && g.type !== 'belt' && g.type !== 'splitter') return 'Over belts can only go over belts and splitters, or on empty ground.';
      if (g) return afford(d.cost) ? null : `Not enough at the tower. ${d.name} costs ${costText(d.cost)}.`;
    } else if (g) return 'Something is already built there.';
    else if (S.raised.has(key(x, y)) && type !== 'belt' && type !== 'splitter') return 'Only belts and splitters fit under an over belt.';
    const n = nodeAt(x, y);
    if (d.on) { if (!n || n.type !== d.on) return `Build the ${d.name} on ${d.on === 'tree' ? 'a tree' : d.on === 'rock' ? 'a rock' : 'metal scraps'}.`; }
    else if (n && n.type !== 'berry') return `There's a ${NODES[n.type].name} in the way. Tap it to gather it first.`;
    if (!afford(d.cost)) return `Not enough at the tower. ${d.name} costs ${costText(d.cost)}.`;
    return null;
  }
  function place(type, x, y, dir, quiet) {
    const why = whyNot(type, x, y);
    if (why) { if (!quiet) say(why, true); return null; }
    const d = BUILD[type];
    pay(d.cost);
    if (!d.on && nodeAt(x, y)) S.changed.set(key(x, y), null);     // building over a berry bush clears it
    const b = makeBuilding(type, x, y, dir);
    layer(type).set(key(x, y), b); S.list.push(b);
    fx({ k: 'poof', x: x + 0.5, y: y + 0.5, life: 0.3, r: 0.6, c: '255,255,255' });
    return b;
  }
  function removeBuilding(b, giveBack) {
    layer(b.type).delete(key(b.x, b.y));
    const i = S.list.indexOf(b); if (i >= 0) S.list.splice(i, 1);
    b.dead = true;
    if (giveBack) { refund(BUILD[b.type].cost); if (b.item) S.stock[b.item]++; }
  }
  function removeAt(x, y, quiet) {
    const b = topAt(x, y);
    if (!b) return;
    if (b.type === 'tower') { if (!quiet) say("You can't remove the tower!", true); return; }
    removeBuilding(b, true);
    fx({ k: 'poof', x: x + 0.5, y: y + 0.5, life: 0.3, r: 0.6, c: '255,255,255' });
    if (!quiet) say(`Removed. You got ${costText(BUILD[b.type].cost)} back.`);
  }
  function damageBuilding(b, dmg) {
    if (b.dead) return;
    b.hp -= dmg; b.hit = 0.15;
    if (b.hp > 0) return;
    if (b.type === 'tower') { b.hp = 0; gameOver(); return; }
    removeBuilding(b, false);
    fx({ k: 'boom', x: b.x + 0.5, y: b.y + 0.5, life: 0.4, r: 0.9, c: '160,140,120' });
  }

  // Can (x, y) take this item, coming in heading in direction dir?
  function accept(x, y, item, dir) {
    const b = S.builds.get(key(x, y));
    if (!b) return acceptOver(x, y, item, dir);     // nothing on the ground: climb onto an over belt if there is one
    if (b.type === 'tower') { S.stock[item]++; return true; }
    if (b.type === 'belt' || b.type === 'splitter') {
      if (b.item || b.dir === (dir + 2) % 4) return false;    // full, or pointing back at us
      b.item = item; b.prog = 0; return true;
    }
    return false;
  }

  function acceptOver(x, y, item, dir) {
    const o = S.raised.get(key(x, y));
    if (!o || o.item || o.dir === (dir + 2) % 4) return false;
    o.item = item; o.prog = 0; return true;
  }
  // Where an over belt puts things: onto the next over belt, or down onto whatever is on the ground.
  const overNext = (x, y, item, dir) => (S.raised.has(key(x, y)) ? acceptOver(x, y, item, dir) : accept(x, y, item, dir));

  // ── Animals ──────────────────────────────────────────────────────────────
  const dogPower = () => 1 + CHICK_BOOST * S.chickens.length;
  function addDog(x, y) { const m = 80 * dogPower(); S.dogs.push({ x, y, hp: m, max: m, rest: 0, cd: 0, face: -1, slot: S.dogs.length }); }
  function addRat(x, y) { S.rats.push({ x, y, tx: x, ty: y, t: 0, face: -1 }); }
  function addChicken(x, y) { S.chickens.push({ x, y, tx: x, ty: y, t: 0, face: -1 }); }
  function addOwl(x, y) { S.owls.push({ x, y, face: -1 }); }
  function tame(a) {
    const p = S.player, need = TAME[a.kind];
    if (dist(p, a) > 2.6) { say('Walk closer to tame it.'); return; }
    const have = S.pack.berry + S.stock.berry;
    if (have < need) { say(`You need ${need}🫐 to tame a ${a.kind}. You have ${have}. Gather berries from bushes!`, true); return; }
    const fromPack = Math.min(S.pack.berry, need);
    S.pack.berry -= fromPack; S.stock.berry -= need - fromPack;
    S.animals.splice(S.animals.indexOf(a), 1);
    fx({ k: 'text', x: a.x, y: a.y - 0.6, life: 1.2, text: '❤️' });
    if (a.kind === 'wolf') { addDog(a.x, a.y); toast('🐺 + 5🫐 = 🐕 A new dog! It will fight monsters with you.'); }
    else if (a.kind === 'chicken') { addChicken(a.x, a.y); toast(`🐔 + 7🫐 = 🐓 Tamed chicken! Your dogs are now ${Math.round(S.chickens.length * CHICK_BOOST * 100)}% stronger.`); }
    else if (a.kind === 'owl') { addOwl(a.x, a.y); toast('🦉 + 9🫐 = Tamed owl! It follows you and heals you and your dogs nearby.'); }
    else { addRat(a.x, a.y); toast(`🐀 + 2🫐 = 🐁 Tamed rat! Harvesters are now ${Math.round(S.rats.length * RAT_BOOST * 100)}% faster.`); }
  }

  // ── Night and day ────────────────────────────────────────────────────────
  const dayLen = () => (S.night === 0 ? FIRST_DAY : DAY_LEN);
  function startNight() {
    S.phase = 'night'; S.clock = 0; S.night++;
    const n = S.night, list = [];
    const add = (k, c) => { for (let i = 0; i < c; i++) list.push(k); };
    add('rallet', 3 + 2 * n); add('minsi', 1 + Math.floor(n * 1.5));
    add('archen', Math.max(0, n - 1)); add('megso', n >= 3 ? Math.floor((n - 1) / 2) : 0);
    add('double', n >= 4 ? Math.floor((n - 2) / 2) : 0);
    const sides = [];   // monsters come from one side at first, then more
    for (let i = 0; i < Math.min(4, 1 + Math.floor(n / 3)); i++) sides.push(Math.random() * Math.PI * 2);
    S.queue = list.map((kind) => ({ kind, at: rand(0, NIGHT_LEN * 0.6), ang: sides[(Math.random() * sides.length) | 0] + rand(-0.35, 0.35) }))
      .sort((a, b) => a.at - b.at);
    toast(`🌙 Night ${n}! ${list.length} monsters are coming for your tower!`);
  }
  function startDay() {
    S.phase = 'day'; S.clock = 0; S.warned = false; S.queue = [];
    for (const m of S.monsters) fx({ k: 'poof', x: m.x, y: m.y, life: 0.6, r: MON[m.kind].size, c: '255,220,150' });
    S.monsters = [];
    for (const g of S.dogs) { g.rest = 0; g.hp = g.max; }
    const best = +(store.get(BEST_KEY) || 0);
    if (S.night > best) store.set(BEST_KEY, S.night);
    toast(`☀️ You survived night ${S.night}! The monsters crumble in the sunlight.`);
    save();
  }
  function spawnMonster(q) {
    const d = MON[q.kind], r = rand(22, 26), hp = d.hp * (1 + 0.15 * (S.night - 1));
    S.monsters.push({ kind: q.kind, x: Math.cos(q.ang) * r, y: Math.sin(q.ang) * r, hp, max: hp, cd: rand(0, 0.5),
                      re: 0, tgt: null, burn: 0, face: 1 });
  }

  // ── Who monsters go for ──────────────────────────────────────────────────
  function tpos(t) {
    if (!t) return null;
    if (t.k === 'p') return S.player.dead > 0 ? null : S.player;
    if (t.k === 'd') return t.ref.rest > 0 || !S.dogs.includes(t.ref) ? null : t.ref;
    if (t.k === 'b') return t.ref.dead ? null : { x: t.ref.x + 0.5, y: t.ref.y + 0.5 };
    return { x: 0, y: 0 };   // the tower
  }
  function pickTarget(m) {
    const d = MON[m.kind], p = S.player;
    let best = null, bd = d.ranged ? d.range : 5;
    if (p.dead <= 0) { const e = dist(m, p); if (e < bd) { bd = e; best = { k: 'p' }; } }
    for (const g of S.dogs) if (g.rest <= 0) { const e = dist(m, g); if (e < bd) { bd = e; best = { k: 'd', ref: g }; } }
    if (best) return best;
    if (d.ranged) {   // archers shoot whatever building is closest
      const R = Math.ceil(d.range), mx = Math.floor(m.x), my = Math.floor(m.y);
      let bb = null; bd = d.range;
      for (let y = my - R; y <= my + R; y++) for (let x = mx - R; x <= mx + R; x++) {
        const b = solidAt(x, y);
        if (!b) continue;
        const e = Math.hypot(x + 0.5 - m.x, y + 0.5 - m.y);
        if (e < bd) { bd = e; bb = b; }
      }
      if (bb) return bb.type === 'tower' ? { k: 't' } : { k: 'b', ref: bb };
    }
    return { k: 't' };
  }
  function hitTarget(t, dmg) {
    if (t.k === 'p') hurtPlayer(dmg);
    else if (t.k === 'd') hurtDog(t.ref, dmg);
    else if (t.k === 'b') damageBuilding(t.ref, dmg);
    else damageBuilding(S.tower, dmg);
  }
  function hurtPlayer(dmg) {
    const p = S.player;
    if (p.dead > 0) return;
    p.hp -= dmg; p.calm = 0;
    fx({ k: 'text', x: p.x, y: p.y - 0.7, life: 0.7, text: '-' + dmg, c: '#ff8a8a' });
    if (p.hp <= 0) {
      p.hp = 0; p.dead = 4;
      for (const k in S.pack) S.pack[k] = 0;
      toast('💫 Ouch! You dropped your backpack. Back at the tower in a moment…');
    }
  }
  function hurtDog(g, dmg) {
    g.hp -= dmg;
    if (g.hp <= 0) { g.rest = 25; fx({ k: 'poof', x: g.x, y: g.y, life: 0.5, r: 0.7, c: '255,255,255' }); say('🐕 Your dog ran home to rest. It will be back soon.'); }
  }

  // ── Every frame: the world moves ─────────────────────────────────────────
  let tool = 'hand', toolDir = 0, press = null, joy = null, isTouch = false, hover = null, paused = false;
  const keys = new Set();

  function update(dt) {
    S.T += dt; S.clock += dt;

    // Day and night go round forever.
    if (S.phase === 'day') {
      const left = dayLen() - S.clock;
      if (left < 20 && !S.warned) { S.warned = true; toast('🌅 Night is coming soon! Get your walls and turrets ready.'); }
      if (left <= 0) startNight();
    } else {
      while (S.queue.length && S.queue[0].at <= S.clock) spawnMonster(S.queue.shift());
      if (S.clock >= NIGHT_LEN) startDay();
    }
    if (S.over) return;

    updatePlayer(dt);
    updateBuildings(dt);
    updateMonsters(dt);
    updateShots(dt);
    updateAnimals(dt);
    for (const f of S.fx) { f.t = (f.t || 0) + dt; if (f.vx) { f.x += f.vx * dt; f.y += f.vy * dt; } }
    S.fx = S.fx.filter((f) => f.t < f.life);
    if (S.tower.hit > 0) S.tower.hit -= dt;
  }

  function updatePlayer(dt) {
    const p = S.player;
    if (p.dead > 0) {
      p.dead -= dt;
      if (p.dead <= 0) { p.x = 0; p.y = 2.6; p.hp = 100; p.calm = 9; }
      return;
    }
    let mx = 0, my = 0;
    if (keys.has('a') || keys.has('arrowleft')) mx--;
    if (keys.has('d') || keys.has('arrowright')) mx++;
    if (keys.has('w') || keys.has('arrowup')) my--;
    if (keys.has('s') || keys.has('arrowdown')) my++;
    if (joy) { mx = joy.dx; my = joy.dy; }
    const l = Math.hypot(mx, my);
    if (l > 1) { mx /= l; my /= l; }
    p.x += mx * 5 * dt; p.y += my * 5 * dt;
    if (mx) p.face = mx > 0 ? 1 : -1;
    p.cd -= dt; p.calm += dt;
    if (p.calm > 3) p.hp = Math.min(100, p.hp + 5 * dt);

    // Holding down on something keeps gathering it.
    if (press && press.hold && tool === 'hand') gather(press.tx, press.ty, true);

    // Walking up to the tower unloads your backpack.
    if (Math.hypot(p.x, p.y) < 3) {
      const got = Object.entries(S.pack).filter(([, v]) => v > 0);
      if (got.length) {
        for (const [k, v] of got) { S.stock[k] += v; S.pack[k] = 0; }
        fx({ k: 'text', x: 0, y: -1.6, life: 1.3, text: got.map(([k, v]) => `+${v}${ITEMS[k]}`).join(' ') });
      }
    }
  }

  function updateBuildings(dt) {
    const rate = 1 + RAT_BOOST * S.rats.length;
    for (const b of S.list) {
      const d = BUILD[b.type];
      if (b.hit > 0) b.hit -= dt;
      if (b.type === 'belt') {
        if (b.item) {
          b.prog = Math.min(1, b.prog + dt * BELT_SPEED);
          if (b.prog >= 1 && accept(b.x + DX[b.dir], b.y + DY[b.dir], b.item, b.dir)) b.item = null;
        }
      } else if (b.type === 'over') {
        if (b.item) {
          b.prog = Math.min(1, b.prog + dt * BELT_SPEED);
          if (b.prog >= 1 && overNext(b.x + DX[b.dir], b.y + DY[b.dir], b.item, b.dir)) b.item = null;
        }
      } else if (b.type === 'splitter') {
        if (b.item) {
          b.prog = Math.min(1, b.prog + dt * BELT_SPEED * 1.5);
          if (b.prog >= 1) {
            const outs = [(b.dir + 3) % 4, b.dir, (b.dir + 1) % 4];
            for (let k = 0; k < 3; k++) {
              const o = outs[(b.next + k) % 3];
              if (accept(b.x + DX[o], b.y + DY[o], b.item, o)) { b.item = null; b.next = (b.next + k + 1) % 3; break; }
            }
          }
        }
      } else if (d.makes) {
        b.cd -= dt * rate;
        if (b.cd <= 0) { b.cd += d.every; if (b.buf < 4) b.buf++; }
        if (b.buf > 0 && accept(b.x + DX[b.dir], b.y + DY[b.dir], d.makes, b.dir)) b.buf--;
      } else if (d.turret) {
        updateTurret(b, d, dt);
      }
    }
  }

  function updateTurret(b, d, dt) {
    b.cd -= dt; if (b.firing > 0) b.firing -= dt;
    const cx = b.x + 0.5, cy = b.y + 0.5;
    let tgt = null, bd = d.range;
    for (const m of S.monsters) { const e = Math.hypot(m.x - cx, m.y - cy); if (e < bd) { bd = e; tgt = m; } }
    if (!tgt) return;
    b.ang = Math.atan2(tgt.y - cy, tgt.x - cx);
    if (d.shot === 'fire') {
      b.firing = 0.2;
      for (const m of S.monsters) if (Math.hypot(m.x - cx, m.y - cy) < d.range) { m.hp -= d.dps * dt; m.burn = Math.max(m.burn, 1.5); }
      if (Math.random() < dt * 30) {
        const a = b.ang + rand(-0.35, 0.35), sp = rand(3.5, 6);
        fx({ k: 'flame', x: cx + Math.cos(b.ang) * 0.35, y: cy + Math.sin(b.ang) * 0.35, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.3, 0.5) });
      }
      return;
    }
    if (b.cd > 0) return;
    b.cd = d.every; b.firing = 0.1;
    const mx = cx + Math.cos(b.ang) * d.bl, my = cy + Math.sin(b.ang) * d.bl;
    if (d.shot === 'snipe') {
      tgt.hp -= d.dmg;
      fx({ k: 'line', x: mx, y: my, x2: tgt.x, y2: tgt.y, life: 0.18 });
    } else if (d.shot === 'bullet') {
      S.shots.push({ k: 'bullet', x: mx, y: my, vx: Math.cos(b.ang) * 16, vy: Math.sin(b.ang) * 16, life: d.range / 16 + 0.1, dmg: d.dmg });
    } else if (d.shot === 'shell') {
      S.shots.push({ k: 'shell', x: mx, y: my, sx: mx, sy: my, tx: tgt.x, ty: tgt.y, t: 0, dur: bd / 9, dmg: d.dmg, splash: d.splash });
    }
  }

  function updateMonsters(dt) {
    for (const m of S.monsters) {
      const d = MON[m.kind];
      m.cd -= dt;
      if (m.burn > 0) { m.burn -= dt; m.hp -= 3 * dt; }
      if ((m.re -= dt) <= 0) { m.re = rand(0.4, 0.6); m.tgt = pickTarget(m); }
      let tp = tpos(m.tgt);
      if (!tp) { m.tgt = { k: 't' }; tp = { x: 0, y: 0 }; }
      const dx = tp.x - m.x, dy = tp.y - m.y, e = Math.hypot(dx, dy) || 0.001;
      m.face = dx > 0 ? 1 : -1;
      if (d.ranged && e - (m.tgt.k === 't' ? 1.2 : 0) < d.range) {
        if (m.cd <= 0) {
          m.cd = d.every;
          if (d.twin) {   // two bullets side by side
            const nx = -dy / e * 0.18, ny = dx / e * 0.18;
            for (const k of [-1, 1]) S.shots.push({ k: 'arrow', bolt: true, x: m.x + nx * k, y: m.y + ny * k, sx: m.x + nx * k, sy: m.y + ny * k,
              tx: tp.x + nx * k, ty: tp.y + ny * k, t: 0, dur: e / 15, tgt: m.tgt, dmg: d.dmg });
          } else S.shots.push({ k: 'arrow', x: m.x, y: m.y, sx: m.x, sy: m.y, tx: tp.x, ty: tp.y, t: 0, dur: e / 10, tgt: m.tgt, dmg: d.dmg });
        }
        continue;
      }
      if ((m.tgt.k === 'p' || m.tgt.k === 'd') && e < d.r + 0.4) {
        if (m.cd <= 0) { m.cd = d.every; hitTarget(m.tgt, d.dmg); }
        continue;
      }
      const step = d.speed * dt, ux = dx / e, uy = dy / e;
      const blk = solidAt(Math.floor(m.x + ux * (d.r + step)), Math.floor(m.y + uy * (d.r + step)));
      if (blk) { if (m.cd <= 0) { m.cd = d.every; damageBuilding(blk, d.dmg); } }
      else { m.x += ux * step; m.y += uy * step; }
    }
    // Don't let monsters pile up on one spot.
    const ms = S.monsters;
    for (let i = 0; i < ms.length; i++) for (let j = i + 1; j < ms.length; j++) {
      const a = ms[i], b = ms[j], dx = b.x - a.x, dy = b.y - a.y, e = Math.hypot(dx, dy);
      const min = (MON[a.kind].r + MON[b.kind].r) * 0.85;
      if (e > 0 && e < min) { const push = (min - e) / 2 / e; a.x -= dx * push; a.y -= dy * push; b.x += dx * push; b.y += dy * push; }
    }
    S.monsters = ms.filter((m) => {
      if (m.hp > 0) return true;
      S.kills++;
      fx({ k: 'poof', x: m.x, y: m.y, life: 0.45, r: MON[m.kind].size * 0.8, c: '190,120,255' });
      return false;
    });
  }

  function updateShots(dt) {
    S.shots = S.shots.filter((s) => {
      if (s.k === 'bullet') {
        s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
        for (const m of S.monsters) if (Math.hypot(m.x - s.x, m.y - s.y) < MON[m.kind].r + 0.1) { m.hp -= s.dmg; return false; }
        return s.life > 0;
      }
      s.t += dt;
      const f = Math.min(1, s.t / s.dur);
      s.x = s.sx + (s.tx - s.sx) * f; s.y = s.sy + (s.ty - s.sy) * f;
      if (f < 1) return true;
      if (s.k === 'shell') {
        for (const m of S.monsters) if (Math.hypot(m.x - s.x, m.y - s.y) < s.splash) m.hp -= s.dmg;
        fx({ k: 'boom', x: s.x, y: s.y, life: 0.35, r: s.splash, c: '255,150,60' });
      } else if (s.k === 'arrow') {
        const tp = tpos(s.tgt);
        if (tp && Math.hypot(tp.x - s.x, tp.y - s.y) < 1.5) hitTarget(s.tgt, s.dmg);
      }
      return false;
    });
  }

  function updateAnimals(dt) {
    const p = S.player;
    // Wild animals wander about the world near you.
    if ((S.animalT -= dt) <= 0) {
      S.animalT = 2.5;
      S.animals = S.animals.filter((a) => dist(a, p) < 40);
      if (S.animals.filter((a) => dist(a, p) < 25).length < 8) {
        const ang = Math.random() * Math.PI * 2, r = rand(10, 22);
        const x = p.x + Math.cos(ang) * r, y = p.y + Math.sin(ang) * r;
        if (Math.hypot(x, y) > 7 && !solidAt(Math.floor(x), Math.floor(y)))
        {
          const r2 = Math.random(), kind = r2 < 0.32 ? 'wolf' : r2 < 0.72 ? 'rat' : r2 < 0.9 ? 'chicken' : 'owl';
          S.animals.push({ kind, x, y, vx: 0, vy: 0, t: 0 });
        }
      }
    }
    for (const a of S.animals) {
      if ((a.t -= dt) <= 0) {
        a.t = rand(2, 5);
        if (Math.random() < 0.35) { a.vx = a.vy = 0; }
        else { const ang = Math.random() * Math.PI * 2, sp = WILD[a.kind].sp; a.vx = Math.cos(ang) * sp; a.vy = Math.sin(ang) * sp; }
      }
      a.x += a.vx * dt; a.y += a.vy * dt;
    }
    // Tamed rats and chickens live around the tower.
    for (const r of S.rats.concat(S.chickens)) {
      if ((r.t -= dt) <= 0) { r.t = rand(2, 5); const ang = Math.random() * Math.PI * 2, rr = rand(1.8, 3.2); r.tx = Math.cos(ang) * rr; r.ty = Math.sin(ang) * rr; }
      const dx = r.tx - r.x, dy = r.ty - r.y, e = Math.hypot(dx, dy);
      if (e > 0.1) { const sp = Math.min(e, (e > 5 ? 3 : 1.2) * dt); r.x += dx / e * sp; r.y += dy / e * sp; r.face = dx > 0 ? 1 : -1; }
    }
    // Owls fly along with you and heal you and your dogs close by.
    S.owls.forEach((o, i) => {
      const a = S.T * 0.8 + i * 2.4, tx = p.x + Math.cos(a) * 1.3, ty = p.y - 0.9 + Math.sin(a) * 0.5;
      const dx = tx - o.x, dy = ty - o.y, e = Math.hypot(dx, dy);
      if (e > 16) { o.x = tx; o.y = ty; }
      else if (e > 0.05) { const st = Math.min(e, Math.max(3, e * 2) * dt); o.x += dx / e * st; o.y += dy / e * st; o.face = dx > 0 ? 1 : -1; }
      if (p.dead <= 0 && dist(o, p) < OWL_RANGE) p.hp = Math.min(100, p.hp + OWL_HEAL * dt);
      for (const g of S.dogs) if (g.rest <= 0 && dist(o, g) < OWL_RANGE) g.hp = Math.min(g.max, g.hp + OWL_HEAL * dt);
    });
    // Dogs follow you, and fight any monster that comes close. Chickens make them stronger.
    const power = dogPower();
    S.dogs.forEach((g, i) => {
      const max = 80 * power;
      if (g.max !== max) { g.hp *= max / g.max; g.max = max; }
      if (g.rest > 0) { g.rest -= dt; if (g.rest <= 0) { g.hp = g.max; g.x = rand(-1, 1); g.y = 1.8; } return; }
      g.cd -= dt;
      let foe = null, bd = 7;
      for (const m of S.monsters) { const e = dist(m, g); if (e < bd && dist(m, p) < 12) { bd = e; foe = m; } }
      let tx, ty, sp = 5;
      if (foe) {
        tx = foe.x; ty = foe.y; sp = 5.5;
        if (bd < MON[foe.kind].r + 0.45) { if (g.cd <= 0) { g.cd = 0.6; foe.hp -= 9 * power; } return; }
      } else {
        g.hp = Math.min(g.max, g.hp + 3 * dt);
        if (p.dead > 0) return;
        const a = i * 2.1 + 1;
        tx = p.x + Math.cos(a) * 1.4; ty = p.y + Math.sin(a) * 1.1;
      }
      const dx = tx - g.x, dy = ty - g.y, e = Math.hypot(dx, dy);
      if (e > 16 && !foe) { g.x = tx; g.y = ty; return; }
      if (e > 0.15) { const st = Math.min(e, (e > 4 ? sp * 1.5 : sp) * dt); g.x += dx / e * st; g.y += dy / e * st; g.face = dx > 0 ? 1 : -1; }
    });
  }

  // ── What a tap does ──────────────────────────────────────────────────────
  function gather(tx, ty, quiet) {
    const p = S.player;
    if (p.dead > 0) return false;
    const n = nodeAt(tx, ty);
    if (!n || S.builds.has(key(tx, ty))) return false;
    if (Math.hypot(tx + 0.5 - p.x, ty + 0.5 - p.y) > 2.4) { if (!quiet) say(`Walk closer to gather that ${NODES[n.type].name}.`); return true; }
    if (p.cd > 0) return true;
    if (n.amt <= 0) { if (!quiet) say('No berries right now. They grow back.'); return true; }
    if (packCount() >= PACK_MAX) { if (!quiet) say('🎒 Backpack full! Walk to the tower to unload it.', true); return true; }
    p.cd = 0.3;
    const item = NODES[n.type].gives;
    S.pack[item]++; n.amt--;
    fx({ k: 'text', x: tx + 0.5, y: ty, life: 0.8, text: '+1' + ITEMS[item] });
    if (n.amt <= 0 && n.type !== 'berry') S.changed.set(key(tx, ty), null);
    else { if (n.amt <= 0) n.regrowAt = S.T + NODES.berry.regrow; S.changed.set(key(tx, ty), n); }
    return true;
  }
  const packCount = () => Object.values(S.pack).reduce((a, b) => a + b, 0);

  function tapWorld(wx, wy) {
    const tx = Math.floor(wx), ty = Math.floor(wy), p = S.player;
    if (p.dead > 0) return;
    // Hit a monster
    let m = null, bd = 0.9;
    for (const o of S.monsters) { const e = Math.hypot(o.x - wx, o.y - wy); if (e < Math.max(bd, MON[o.kind].size * 0.6)) { bd = e; m = o; } }
    if (m) {
      if (dist(m, p) > 2.2) { say('Get closer to hit it, or let your turrets and dogs do the work.'); return; }
      if (p.cd <= 0) {
        p.cd = 0.4; m.hp -= 10;
        const e = dist(m, p) || 1; m.x += (m.x - p.x) / e * 0.3; m.y += (m.y - p.y) / e * 0.3;
        fx({ k: 'poof', x: m.x, y: m.y, life: 0.2, r: 0.4, c: '255,255,255' });
      }
      return;
    }
    // Tame an animal
    let a = null; bd = 0.9;
    for (const o of S.animals) { const e = Math.hypot(o.x - wx, o.y - wy); if (e < bd) { bd = e; a = o; } }
    if (a) { tame(a); return; }
    // Gather
    if (gather(tx, ty, false)) { if (press) press.hold = true; return; }
    // Look at a building
    const b = topAt(tx, ty);
    if (b) say(describe(b));
  }
  function describe(b) {
    if (b.type === 'tower') return `🏰 Centre tower: ${Math.ceil(b.hp)}/${b.max}. Everything you spend has to get here first.`;
    const d = BUILD[b.type];
    if (d.makes) return `${d.icon} ${d.name}: ${b.buf ? b.buf + ' waiting to go out. ' : ''}Points ${ARROWS[b.dir]}. Put a belt on that side heading to the tower.`;
    if (d.turret) return `${d.icon} ${d.name}: ${Math.ceil(b.hp)}/${d.hp} health. ${d.about}`;
    return `${d.icon} ${d.name}: ${d.about}`;
  }

  // Dragging with a belt, wall or remove lays a whole line.
  function stepDrag(tx, ty) {
    const pr = press, dx = tx - pr.lx, dy = ty - pr.ly;
    if (tool === 'belt' || tool === 'over') {
      const dir = dx === 1 ? 0 : dy === 1 ? 1 : dx === -1 ? 2 : 3, L = layer(tool);
      toolDir = dir;
      const prev = L.get(key(pr.lx, pr.ly));
      if (prev && prev.type === tool && pr.mine.has(key(pr.lx, pr.ly))) prev.dir = dir;
      const here = L.get(key(tx, ty));
      if (here && here.type === tool) { here.dir = dir; pr.mine.add(key(tx, ty)); }
      else if (place(tool, tx, ty, dir, true)) pr.mine.add(key(tx, ty));
    } else if (tool === 'wall') place('wall', tx, ty, 0, true);
    else if (tool === 'remove') removeAt(tx, ty, true);
    pr.lx = tx; pr.ly = ty;
  }
  function dragTo(tx, ty) {
    // walk one tile at a time so fast drags don't leave gaps
    let guard = 60;
    while ((press.lx !== tx || press.ly !== ty) && guard--) {
      if (press.lx !== tx) stepDrag(press.lx + Math.sign(tx - press.lx), press.ly);
      else stepDrag(press.lx, press.ly + Math.sign(ty - press.ly));
    }
  }

  // ── Drawing ──────────────────────────────────────────────────────────────
  const cv = $('cv'), ctx = cv.getContext('2d');
  const lc = document.createElement('canvas'), lctx = lc.getContext('2d');
  let W = 0, H = 0, DPR = 1, baseTS = 40, zoom = 1, TS = 40, camX = 0, camY = 0;
  const spriteCache = new Map();
  const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    lc.width = cv.width; lc.height = cv.height;
    baseTS = Math.max(26, Math.min(46, Math.min(W, H) / 13));
    TS = baseTS * zoom;
    spriteCache.clear();
  }
  const sx = (wx) => (wx - camX) * TS + W / 2;
  const sy = (wy) => (wy - camY) * TS + H / 2;
  const toWorld = (px, py) => ({ x: (px - W / 2) / TS + camX, y: (py - H / 2) / TS + camY });

  function sprite(e, px) {
    px = Math.max(6, Math.round(px * DPR / 2) * 2);
    const k = e + px;
    let c = spriteCache.get(k);
    if (!c) {
      c = document.createElement('canvas');
      c.width = c.height = Math.ceil(px * 1.3);
      const g = c.getContext('2d');
      g.font = `${px}px ${EMOJI_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(e, c.width / 2, c.height / 2 + px * 0.06);
      spriteCache.set(k, c);
    }
    return c;
  }
  function emoji(e, x, y, size, flip) {
    const c = sprite(e, size), w = c.width / DPR;
    if (flip) { ctx.save(); ctx.translate(x, y); ctx.scale(-1, 1); ctx.drawImage(c, -w / 2, -w / 2, w, w); ctx.restore(); }
    else ctx.drawImage(c, x - w / 2, y - w / 2, w, w);
  }
  function rrect(x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
  }
  function circle(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }
  function bar(x, y, w, f, color) {
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(x - w / 2, y, w, 5);
    ctx.fillStyle = color; ctx.fillRect(x - w / 2 + 1, y + 1, (w - 2) * Math.max(0, f), 3);
  }

  function drawNode(n, x, y, px, py, s) {
    const cx = px + s / 2, cy = py + s / 2;
    if (n.type === 'tree') {
      ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(cx, cy + s * 0.32, s * 0.32, s * 0.12, 0, 0, 7); ctx.fill();
      emoji(hash(x, y, 3) < 0.55 ? '🌲' : '🌳', cx, cy - s * 0.06, s * 0.95);
    } else if (n.type === 'rock') {
      emoji('🪨', cx, cy + s * 0.04, s * 0.72);
    } else if (n.type === 'metal') {
      ctx.fillStyle = '#5d646c'; ctx.beginPath(); ctx.ellipse(cx, cy + s * 0.12, s * 0.38, s * 0.2, 0, 0, 7); ctx.fill();
      emoji('⚙️', cx + s * 0.14, cy + s * 0.02, s * 0.38);
      emoji('🔩', cx - s * 0.12, cy - s * 0.02, s * 0.42);
    } else if (n.type === 'berry') {
      ctx.fillStyle = '#245f2c'; circle(cx, cy + s * 0.04, s * 0.38); ctx.fill();
      ctx.fillStyle = '#2f7d3a'; circle(cx - s * 0.08, cy - s * 0.04, s * 0.26); ctx.fill();
      ctx.fillStyle = '#5c6cff';
      const spots = [[-0.18, -0.08], [0.14, -0.12], [0.02, 0.14], [0.2, 0.12]];
      for (let i = 0; i < n.amt; i++) { circle(cx + spots[i][0] * s, cy + spots[i][1] * s, s * 0.075); ctx.fill(); }
    }
  }

  function drawBuilding(b, px, py, s) {
    const d = BUILD[b.type], cx = px + s / 2, cy = py + s / 2;
    if (b.type === 'over') {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(b.dir * Math.PI / 2);
      const w = s * 0.62;
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(-s / 2, -w / 2 + s * 0.12, s, w);              // shadow on the ground
      ctx.fillStyle = '#8a94a3'; ctx.fillRect(-s / 2, -w / 2 - s * 0.06, s, w);
      ctx.fillStyle = '#4b5361'; ctx.fillRect(-s / 2, -w / 2 + s * 0.02 - s * 0.06, s, w - s * 0.04 * 2);
      ctx.fillStyle = '#c7cfda'; ctx.fillRect(-s / 2, -w / 2 - s * 0.06, s, s * 0.05); ctx.fillRect(-s / 2, w / 2 - s * 0.11, s, s * 0.05);
      ctx.strokeStyle = 'rgba(140,220,255,.75)'; ctx.lineWidth = Math.max(1.5, s * 0.06); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const off = (S.T * BELT_SPEED) % 1;
      ctx.beginPath();
      for (let k = 0; k < 2; k++) {
        const u = (((k * 0.5 + off) % 1) - 0.5) * s * 0.8;
        ctx.moveTo(u - s * 0.06, -s * 0.18); ctx.lineTo(u + s * 0.05, -s * 0.06); ctx.lineTo(u - s * 0.06, s * 0.06);
      }
      ctx.stroke(); ctx.restore();
    } else if (b.type === 'belt') {
      ctx.fillStyle = '#3d4249'; rrect(px + 1, py + 1, s - 2, s - 2, s * 0.12); ctx.fill();
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(b.dir * Math.PI / 2);
      ctx.fillStyle = '#2a2e34'; ctx.fillRect(-s / 2 + 1, -s * 0.3, s - 2, s * 0.6);
      ctx.strokeStyle = 'rgba(255,201,77,.6)'; ctx.lineWidth = Math.max(1.5, s * 0.06); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const off = (S.T * BELT_SPEED) % 1;
      ctx.beginPath();
      for (let k = 0; k < 2; k++) {
        const u = (((k * 0.5 + off) % 1) - 0.5) * s * 0.8;
        ctx.moveTo(u - s * 0.07, -s * 0.15); ctx.lineTo(u + s * 0.06, 0); ctx.lineTo(u - s * 0.07, s * 0.15);
      }
      ctx.stroke(); ctx.restore();
    } else if (b.type === 'splitter') {
      ctx.fillStyle = '#5b4a7a'; rrect(px + 1, py + 1, s - 2, s - 2, s * 0.14); ctx.fill();
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(b.dir * Math.PI / 2);
      ctx.fillStyle = '#ffc94d';
      for (const a of [-Math.PI / 2, 0, Math.PI / 2]) {
        ctx.save(); ctx.rotate(a); ctx.beginPath();
        ctx.moveTo(s * 0.42, 0); ctx.lineTo(s * 0.26, -s * 0.1); ctx.lineTo(s * 0.26, s * 0.1); ctx.fill(); ctx.restore();
      }
      ctx.fillStyle = '#3c3052'; circle(0, 0, s * 0.16); ctx.fill();
      ctx.restore();
    } else if (b.type === 'wall') {
      ctx.fillStyle = '#7d5f43'; ctx.fillRect(px, py, s, s);
      ctx.strokeStyle = '#5a412c'; ctx.lineWidth = Math.max(1, s * 0.05);
      ctx.beginPath();
      for (let r = 1; r < 3; r++) { ctx.moveTo(px, py + r * s / 3); ctx.lineTo(px + s, py + r * s / 3); }
      for (let r = 0; r < 3; r++) { const o = r % 2 ? s / 4 : s * 0.6; ctx.moveTo(px + o, py + r * s / 3); ctx.lineTo(px + o, py + (r + 1) * s / 3); }
      ctx.stroke();
      ctx.strokeStyle = '#4a3523'; ctx.strokeRect(px + 0.5, py + 0.5, s - 1, s - 1);
    } else if (d.makes) {
      ctx.fillStyle = d.color; rrect(px + 2, py + 2, s - 4, s - 4, s * 0.18); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(S.T * 2);
      ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = s * 0.08; ctx.setLineDash([s * 0.08, s * 0.08]);
      circle(0, 0, s * 0.3); ctx.stroke(); ctx.restore();
      emoji(ITEMS[d.makes], cx, cy, s * 0.42);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(b.dir * Math.PI / 2);
      ctx.fillStyle = '#ffc94d'; ctx.beginPath(); ctx.moveTo(s * 0.5, 0); ctx.lineTo(s * 0.32, -s * 0.14); ctx.lineTo(s * 0.32, s * 0.14); ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#fff';
      for (let i = 0; i < b.buf; i++) { circle(px + s * 0.2 + i * s * 0.12, py + s * 0.82, s * 0.04); ctx.fill(); }
    } else if (d.turret) {
      const mega = b.type === 'tmega';
      ctx.fillStyle = '#41464d'; circle(cx, cy, s * (mega ? 0.48 : 0.44)); ctx.fill();
      ctx.fillStyle = '#656b74'; circle(cx, cy, s * (mega ? 0.38 : 0.33)); ctx.fill();
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(b.ang);
      const kick = b.firing > 0 && d.shot !== 'fire' ? -s * 0.05 : 0;
      ctx.fillStyle = d.barrel;
      if (mega) { ctx.fillRect(kick, -s * 0.2, d.bl * s, d.bw * s); ctx.fillRect(kick, s * 0.07, d.bl * s, d.bw * s); }
      else ctx.fillRect(kick, -d.bw * s / 2, d.bl * s, d.bw * s);
      ctx.restore();
      ctx.fillStyle = d.cap; circle(cx, cy, s * 0.17); ctx.fill();
      if (b.type === 'tfire' && b.firing > 0) { ctx.fillStyle = 'rgba(255,200,80,.8)'; circle(cx, cy, s * 0.09); ctx.fill(); }
    }
    if (b.hit > 0) { ctx.fillStyle = 'rgba(255,60,60,.35)'; ctx.fillRect(px, py, s, s); }
    if (d && b.hp < d.hp) bar(cx, py - 6, s * 0.8, b.hp / d.hp, '#6ee07a');
  }

  function drawTower(s) {
    const t = S.tower, px = sx(-1), py = sy(-1), w = s * 2;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; rrect(px + 4, py + 6, w - 4, w - 4, s * 0.25); ctx.fill();
    ctx.fillStyle = '#8b939d'; rrect(px + 2, py + 2, w - 4, w - 4, s * 0.25); ctx.fill();
    ctx.strokeStyle = '#ffc94d'; ctx.lineWidth = 3; ctx.stroke();
    emoji('🏰', px + w / 2, py + w / 2 - s * 0.05, s * 1.5);
    if (t.hit > 0) { ctx.fillStyle = 'rgba(255,60,60,.3)'; rrect(px + 2, py + 2, w - 4, w - 4, s * 0.25); ctx.fill(); }
    bar(px + w / 2, py - 10, w * 0.9, t.hp / t.max, t.hp / t.max > 0.35 ? '#6ee07a' : '#ff6b6b');
  }

  function drawThing(icon, x, y, size, face, extra) {
    const px = sx(x), py = sy(y), s = TS;
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(px, py + size * s * 0.38, size * s * 0.32, size * s * 0.12, 0, 0, 7); ctx.fill();
    emoji(icon, px, py, size * s, face > 0);
    if (extra) extra(px, py, s);
  }

  function render() {
    const p = S.player;
    camX = p.dead > 0 ? camX + (0 - camX) * 0.05 : p.x;
    camY = p.dead > 0 ? camY + (2.6 - camY) * 0.05 : p.y;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = '#4a8a3f'; ctx.fillRect(0, 0, W, H);
    const s = TS;
    const x0 = Math.floor(camX - W / 2 / s) - 1, x1 = Math.ceil(camX + W / 2 / s) + 1;
    const y0 = Math.floor(camY - H / 2 / s) - 1, y1 = Math.ceil(camY + H / 2 / s) + 1;

    // ground patches
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const h = hash(x, y, 7);
      if (h < 0.3) { ctx.fillStyle = h < 0.12 ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.04)'; ctx.fillRect(sx(x), sy(y), s + 0.5, s + 0.5); }
    }
    // resources and buildings
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const b = S.builds.get(key(x, y));
      if (b) { if (b.type !== 'tower') drawBuilding(b, sx(x), sy(y), s); continue; }
      const n = nodeAt(x, y);
      if (n && n.type !== 'tree') drawNode(n, x, y, sx(x), sy(y), s);
    }
    // things riding on belts
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const b = S.builds.get(key(x, y));
      if (!b || !b.item) continue;
      const f = b.type === 'splitter' ? 0 : b.prog - 0.5;
      emoji(ITEMS[b.item], sx(x + 0.5 + DX[b.dir] * f), sy(y + 0.5 + DY[b.dir] * f), s * 0.42);
    }
    // over belts, up above the ground belts, with what they carry
    for (const o of S.raised.values()) {
      if (o.x < x0 || o.x > x1 || o.y < y0 || o.y > y1) continue;
      drawBuilding(o, sx(o.x), sy(o.y), s);
      if (o.item) { const f = o.prog - 0.5; emoji(ITEMS[o.item], sx(o.x + 0.5 + DX[o.dir] * f), sy(o.y + 0.5 + DY[o.dir] * f) - s * 0.12, s * 0.4); }
    }
    drawTower(s);

    // trees go over everything on the ground so they look tall
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (S.builds.has(key(x, y))) continue;
      const n = nodeAt(x, y);
      if (n && n.type === 'tree') drawNode(n, x, y, sx(x), sy(y), s);
    }

    for (const r of S.rats) drawThing('🐁', r.x, r.y, 0.5, r.face);
    for (const c of S.chickens) drawThing('🐓', c.x, c.y, 0.55, c.face);
    for (const a of S.animals) drawThing(WILD[a.kind].icon, a.x, a.y, WILD[a.kind].size, a.vx);
    for (const g of S.dogs) {
      if (g.rest > 0) continue;
      drawThing('🐕', g.x, g.y, 0.75, g.face, (px, py) => { if (g.hp < g.max) bar(px, py - s * 0.5, s * 0.6, g.hp / g.max, '#6ee07a'); });
    }
    if (p.dead <= 0) {
      drawThing('🧑‍🔧', p.x, p.y, 0.85, p.face, (px, py) => { if (p.hp < 100) bar(px, py - s * 0.6, s * 0.7, p.hp / 100, '#6ee07a'); });
      if (tool === 'hand') { ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1; ctx.setLineDash([4, 6]); circle(sx(p.x), sy(p.y), 2.4 * s); ctx.stroke(); ctx.setLineDash([]); }
    }

    for (const o of S.owls) {
      ctx.fillStyle = 'rgba(120,255,150,.07)'; circle(sx(o.x), sy(o.y), OWL_RANGE * s); ctx.fill();
      ctx.strokeStyle = 'rgba(120,255,150,.22)'; ctx.lineWidth = 1.5; ctx.stroke();
      drawThing('🦉', o.x, o.y + Math.sin(S.T * 6 + o.x) * 0.06, 0.6, o.face);
    }

    // shots
    for (const sh of S.shots) {
      if (sh.k === 'bullet') { ctx.fillStyle = '#fff3bf'; circle(sx(sh.x), sy(sh.y), Math.max(2, s * 0.07)); ctx.fill(); }
      else if (sh.k === 'shell') { ctx.fillStyle = '#222'; circle(sx(sh.x), sy(sh.y), s * 0.12); ctx.fill(); ctx.fillStyle = '#ff922b'; circle(sx(sh.x), sy(sh.y), s * 0.05); ctx.fill(); }
      else if (sh.k === 'arrow' && sh.bolt) { ctx.fillStyle = '#ff4d6d'; circle(sx(sh.x), sy(sh.y), Math.max(2.5, s * 0.08)); ctx.fill(); }
      else if (sh.k === 'arrow') {
        const a = Math.atan2(sh.ty - sh.sy, sh.tx - sh.sx);
        ctx.save(); ctx.translate(sx(sh.x), sy(sh.y)); ctx.rotate(a);
        ctx.strokeStyle = '#e9d8a6'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-s * 0.25, 0); ctx.lineTo(s * 0.2, 0); ctx.stroke();
        ctx.fillStyle = '#ced4da'; ctx.beginPath(); ctx.moveTo(s * 0.28, 0); ctx.lineTo(s * 0.16, -s * 0.07); ctx.lineTo(s * 0.16, s * 0.07); ctx.fill();
        ctx.restore();
      }
    }
    // effects
    for (const f of S.fx) {
      const k = f.t / f.life;
      if (f.k === 'text') {
        ctx.globalAlpha = 1 - k; ctx.fillStyle = f.c || '#fff'; ctx.font = `600 ${Math.round(s * 0.42)}px Fredoka, sans-serif`;
        ctx.textAlign = 'center'; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 3;
        ctx.strokeText(f.text, sx(f.x), sy(f.y) - k * s * 0.8); ctx.fillText(f.text, sx(f.x), sy(f.y) - k * s * 0.8);
        ctx.globalAlpha = 1;
      } else if (f.k === 'poof' || f.k === 'boom') {
        ctx.fillStyle = `rgba(${f.c},${(1 - k) * (f.k === 'boom' ? 0.7 : 0.5)})`;
        circle(sx(f.x), sy(f.y), f.r * s * (0.4 + k * 0.6)); ctx.fill();
      } else if (f.k === 'flame') {
        ctx.fillStyle = `rgba(255,${Math.round(200 - k * 150)},40,${1 - k})`;
        circle(sx(f.x), sy(f.y), s * (0.1 + k * 0.12)); ctx.fill();
      } else if (f.k === 'line') {
        ctx.strokeStyle = `rgba(255,240,180,${1 - k})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(sx(f.x), sy(f.y)); ctx.lineTo(sx(f.x2), sy(f.y2)); ctx.stroke();
      }
    }

    // what you're about to build
    if (hover && BUILD[tool] && !press) {
      const d = BUILD[tool], hx = hover.tx, hy = hover.ty, bad = whyNot(tool, hx, hy);
      ctx.globalAlpha = 0.55;
      drawBuilding(makeBuilding(tool, hx, hy, toolDir), sx(hx), sy(hy), s);
      ctx.globalAlpha = 1;
      if (bad) { ctx.fillStyle = 'rgba(255,60,60,.3)'; ctx.fillRect(sx(hx), sy(hy), s, s); }
      if (d.range) { ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.setLineDash([6, 6]); circle(sx(hx + 0.5), sy(hy + 0.5), d.range * s); ctx.stroke(); ctx.setLineDash([]); }
    } else if (hover && tool === 'remove' && topAt(hover.tx, hover.ty)) {
      ctx.strokeStyle = '#ff6b6b'; ctx.lineWidth = 3; ctx.strokeRect(sx(hover.tx) + 2, sy(hover.ty) + 2, s - 4, s - 4);
    }

    drawDark();

    // monsters are drawn over the dark so you can always see them coming
    for (const m of S.monsters) {
      const d = MON[m.kind];
      drawThing(d.icon, m.x, m.y, d.size, m.face, (px, py) => {
        if (m.burn > 0) emoji('🔥', px + s * d.size * 0.25, py - s * d.size * 0.3, s * 0.35);
        if (m.hp < m.max) bar(px, py - s * d.size * 0.6, s * Math.max(0.6, d.size * 0.8), m.hp / m.max, '#ff6b6b');
      });
    }

    if (isTouch) {
      const j = joyCenter();
      ctx.fillStyle = 'rgba(255,255,255,.1)'; circle(j.x, j.y, 56); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; circle(j.x + (joy ? joy.dx * 40 : 0), j.y + (joy ? joy.dy * 40 : 0), 24); ctx.fill();
    }
  }

  function darkness() {
    if (S.phase === 'day') { const left = dayLen() - S.clock; return left < 15 ? 0.62 * (1 - left / 15) : 0; }
    const left = NIGHT_LEN - S.clock;
    return left < 8 ? 0.62 * (left / 8) : 0.62;
  }
  function drawDark() {
    const dark = darkness();
    if (dark <= 0.01) return;
    lctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    lctx.globalCompositeOperation = 'source-over';
    lctx.clearRect(0, 0, W, H);
    lctx.fillStyle = `rgba(6,10,34,${dark})`; lctx.fillRect(0, 0, W, H);
    lctx.globalCompositeOperation = 'destination-out';
    const light = (wx, wy, r, a) => {
      const x = sx(wx), y = sy(wy), R = r * TS;
      if (x < -R || y < -R || x > W + R || y > H + R) return;
      const g = lctx.createRadialGradient(x, y, 0, x, y, R);
      g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      lctx.fillStyle = g; lctx.fillRect(x - R, y - R, R * 2, R * 2);
    };
    if (S.player.dead <= 0) light(S.player.x, S.player.y, 4.5, 0.85);
    for (const o of S.owls) light(o.x, o.y, OWL_RANGE, 0.35);
    light(0, 0, 6.5, 0.9);
    for (const b of S.list) if (BUILD[b.type].turret) light(b.x + 0.5, b.y + 0.5, b.type === 'tfire' ? 3.5 + Math.sin(S.T * 13 + b.x) * 0.2 : 2.2, 0.6);
    for (const sh of S.shots) if (sh.k !== 'arrow' || sh.bolt) light(sh.x, sh.y, 0.8, 0.5);
    for (const f of S.fx) if (f.k === 'boom' || f.k === 'flame') light(f.x, f.y, f.k === 'boom' ? 2.5 : 1, 0.5);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(lc, 0, 0);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  // ── The bars on screen ───────────────────────────────────────────────────
  const toolsEl = $('tools'), infoEl = $('info'), toastEl = $('toast');
  let sayUntil = 0, toastTimer = 0;
  function say(msg, bad) { infoEl.textContent = msg; infoEl.classList.toggle('bad', !!bad); sayUntil = performance.now() + 3000; }
  function toast(msg) {
    toastEl.textContent = msg; toastEl.style.opacity = 1;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastEl.style.opacity = 0; }, 4000);
  }
  function toolInfo() {
    if (tool === 'hand') return '✋ Tap trees, rocks, metal and bushes next to you to gather (hold to keep going). Tap a 🐺 🐀 🐔 or 🦉 to tame it with berries. Tap monsters to hit them.';
    if (tool === 'remove') return '🗑️ Tap a building to remove it. You get everything back. Drag to remove lots.';
    const d = BUILD[tool];
    return `${d.icon} ${d.name} (${costText(d.cost)}): ${d.about}${d.dir ? ` Facing ${ARROWS[toolDir]}, press R or ↻ to turn.` : ''}`;
  }
  function buildToolbar() {
    toolsEl.innerHTML = '';
    for (const t of TOOLS) {
      const d = t === 'hand' ? { icon: '✋', short: 'Hand' } : t === 'remove' ? { icon: '🗑️', short: 'Remove' } : BUILD[t];
      const kk = Object.keys(TOOL_KEYS).find((k) => TOOL_KEYS[k] === t && k.length === 1);
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'tool'; btn.dataset.t = t;
      btn.title = t === 'hand' ? 'Hand (Q)' : t === 'remove' ? 'Remove (X)' : `${d.name} (${kk})`;
      btn.innerHTML = `<span class="i">${d.icon}</span><span class="n">${d.short}</span>` +
        (d.cost ? `<span class="c">${costText(d.cost)}</span>` : `<span class="c">&nbsp;</span>`);
      btn.addEventListener('click', () => setTool(tool === t && t !== 'hand' ? 'hand' : t));
      toolsEl.appendChild(btn);
    }
    const rot = document.createElement('button');
    rot.type = 'button'; rot.className = 'tool'; rot.title = 'Turn (R)';
    rot.innerHTML = '<span class="i">↻</span><span class="n">Turn</span><span class="c" id="rot-dir"></span>';
    rot.addEventListener('click', rotate);
    toolsEl.appendChild(rot);
  }
  function setTool(t) {
    tool = t;
    for (const b of toolsEl.querySelectorAll('.tool[data-t]')) b.classList.toggle('on', b.dataset.t === t);
    sayUntil = 0; refreshHud();
  }
  function rotate() { toolDir = (toolDir + 1) % 4; sayUntil = 0; refreshHud(); }

  function refreshHud() {
    if (!S) return;
    const st = S.stock, pk = S.pack;
    $('h-stock').innerHTML = `<span class="lbl">Tower</span>🪵${st.wood} 🪨${st.rock} 🔩${st.metal} 🫐${st.berry}`;
    const n = packCount();
    $('h-pack').innerHTML = `<span class="lbl">🎒</span>` + (n ? Object.entries(pk).filter(([, v]) => v).map(([k, v]) => ITEMS[k] + v).join(' ') + (n >= PACK_MAX ? ' FULL' : '') : 'empty');
    $('h-pack').classList.toggle('warn', n >= PACK_MAX);
    const tm = $('h-time');
    if (S.phase === 'day') { tm.textContent = `☀️ Day ${S.night + 1} · 🌙 in ${fmt(dayLen() - S.clock)}`; tm.className = 'pill' + (dayLen() - S.clock < 20 ? ' warn' : ''); }
    else { tm.textContent = `🌙 Night ${S.night} · ☀️ in ${fmt(NIGHT_LEN - S.clock)} · ${S.monsters.length + S.queue.length} 👹`; tm.className = 'pill night'; }
    const lf = $('h-life');
    lf.textContent = `🏰${Math.ceil(S.tower.hp)} ❤️${Math.ceil(S.player.hp)}`;
    lf.classList.toggle('warn', S.tower.hp < S.tower.max * 0.35);
    const pct = (n, b) => (n ? ` (+${Math.round(n * b * 100)}%)` : '');
    $('h-pets').textContent = `🐁${S.rats.length}${pct(S.rats.length, RAT_BOOST)} 🐕${S.dogs.length} 🐓${S.chickens.length}${pct(S.chickens.length, CHICK_BOOST)} 🦉${S.owls.length}`;
    for (const b of toolsEl.querySelectorAll('.tool[data-t]')) { const d = BUILD[b.dataset.t]; b.classList.toggle('poor', !!d && !afford(d.cost)); }
    const rd = $('rot-dir'); if (rd) rd.textContent = ARROWS[toolDir];
    if (performance.now() > sayUntil) { infoEl.textContent = toolInfo(); infoEl.classList.remove('bad'); }
  }

  // ── Controls ─────────────────────────────────────────────────────────────
  function joyCenter() { return { x: 84, y: H - $('bottom').offsetHeight - 84 }; }
  function updateJoy(e) {
    const j = joyCenter();
    let dx = (e.clientX - j.x) / 45, dy = (e.clientY - j.y) / 45;
    const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
    joy.dx = dx; joy.dy = dy;
  }
  const playing = () => S && !S.over && !paused && !$('game').hidden;

  cv.addEventListener('pointerdown', (e) => {
    if (!playing()) return;
    if (e.pointerType === 'touch') isTouch = true;
    try { cv.setPointerCapture(e.pointerId); } catch (err) { /* fine */ }
    const j = joyCenter();
    if (isTouch && Math.hypot(e.clientX - j.x, e.clientY - j.y) < 75) { joy = { id: e.pointerId, dx: 0, dy: 0 }; updateJoy(e); return; }
    if (press) return;
    const w = toWorld(e.clientX, e.clientY), tx = Math.floor(w.x), ty = Math.floor(w.y);
    if (e.pointerType === 'mouse') hover = { tx, ty };
    if (e.button === 2) { removeAt(tx, ty); return; }
    press = { id: e.pointerId, tx, ty, lx: tx, ly: ty, mine: new Set(), hold: false };
    if (tool === 'hand') tapWorld(w.x, w.y);
    else if (tool === 'remove') removeAt(tx, ty);
    else if (place(tool, tx, ty, toolDir)) press.mine.add(key(tx, ty));
  });
  cv.addEventListener('pointermove', (e) => {
    if (!S) return;
    if (joy && e.pointerId === joy.id) { updateJoy(e); return; }
    const w = toWorld(e.clientX, e.clientY), tx = Math.floor(w.x), ty = Math.floor(w.y);
    if (e.pointerType === 'mouse') hover = { tx, ty };
    if (!press || e.pointerId !== press.id || !playing()) return;
    if (tool === 'hand') { press.tx = tx; press.ty = ty; }
    else if (tool === 'belt' || tool === 'over' || tool === 'wall' || tool === 'remove') dragTo(tx, ty);
  });
  const endPress = (e) => {
    if (joy && e.pointerId === joy.id) joy = null;
    if (press && e.pointerId === press.id) press = null;
  };
  cv.addEventListener('pointerup', endPress);
  cv.addEventListener('pointercancel', endPress);
  cv.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') hover = null; });
  cv.addEventListener('contextmenu', (e) => e.preventDefault());
  cv.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoom = Math.max(0.55, Math.min(1.8, zoom * (e.deltaY < 0 ? 1.1 : 0.9)));
    TS = baseTS * zoom;
  }, { passive: false });

  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (!playing()) { if (k === 'escape' && paused) resume(); return; }
    if (k === 'p') { pause(); return; }
    keys.add(k);
    if (k.startsWith('arrow')) e.preventDefault();
    if (k === 'r') rotate();
    else if (TOOL_KEYS[k]) setTool(TOOL_KEYS[k]);
    else if (k === '=' || k === '+') { zoom = Math.min(1.8, zoom * 1.1); TS = baseTS * zoom; }
    else if (k === '-') { zoom = Math.max(0.55, zoom * 0.9); TS = baseTS * zoom; }
  });
  window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => { keys.clear(); press = null; joy = null; });
  window.addEventListener('resize', resize);
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });

  // ── Screens ──────────────────────────────────────────────────────────────
  function fx(f) { if (S.fx.length < 400) { f.t = 0; S.fx.push(f); } }
  function show(id) { for (const s of ['start', 'game', 'paused', 'over']) $(s).hidden = s !== id && !(s === 'game' && (id === 'paused' || id === 'over')); }

  function startScreen() {
    paused = false;
    show('start');
    $('continue').hidden = !store.get(SAVE_KEY);
    const best = +(store.get(BEST_KEY) || 0);
    $('best').textContent = best ? `Your best: survived ${best} night${best === 1 ? '' : 's'}` : '';
  }
  function begin(fresh) {
    if (fresh || !load()) newWorld();
    keys.clear(); press = null; joy = null; paused = false;
    camX = S.player.x; camY = S.player.y;
    show('game');
    resize(); setTool('hand');
    toast(S.night === 0 && S.T < 1 ? '☀️ Gather stuff and bring it to the 🏰 tower. Night comes in a few minutes!' : `☀️ Welcome back! Day ${S.night + 1}.`);
  }
  function pause() { if (!playing()) return; paused = true; save(); show('paused'); }
  function resume() { paused = false; show('game'); last = performance.now(); }
  function gameOver() {
    if (S.over) return;
    S.over = true;
    store.del(SAVE_KEY);
    const best = Math.max(+(store.get(BEST_KEY) || 0), S.night - 1);
    store.set(BEST_KEY, best);
    $('over-text').textContent = `The monsters knocked down your tower on night ${S.night}. You beat ${S.kills} monster${S.kills === 1 ? '' : 's'}. Best: ${best} night${best === 1 ? '' : 's'} survived.`;
    setTimeout(() => show('over'), 900);
  }

  $('new').addEventListener('click', () => {
    if (store.get(SAVE_KEY) && !confirm('Start a new world? Your saved world will be lost.')) return;
    store.del(SAVE_KEY); begin(true);
  });
  $('continue').addEventListener('click', () => begin(false));
  $('menu-btn').addEventListener('click', pause);
  $('resume').addEventListener('click', resume);
  $('to-menu').addEventListener('click', () => { save(); startScreen(); });
  $('again').addEventListener('click', () => begin(true));
  $('over-menu').addEventListener('click', startScreen);

  // Fill in the tables on the start screen from the rules above.
  $('chart-build').innerHTML = Object.values(BUILD).map((d) => `<b>${d.icon} ${d.name} · ${costText(d.cost)}</b><span>${d.about}</span>`).join('');
  $('chart-mon').innerHTML = Object.values(MON).map((d) => `<b>${d.icon} ${d.name}</b><span>${d.about[0].toUpperCase() + d.about.slice(1)}.</span>`).join('');

  // ── The loop ─────────────────────────────────────────────────────────────
  let last = performance.now(), hudT = 0, saveT = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (S && !$('game').hidden) {
      if (!paused && !S.over) {
        update(dt);
        if ((saveT += dt) > 15) { saveT = 0; save(); }
      }
      render();
      if ((hudT += dt) > 0.15) { hudT = 0; refreshHud(); }
    }
    requestAnimationFrame(frame);
  }

  if (location.hash === '#debug') window.BW = { get S() { return S; }, place };   // for testing
  buildToolbar();
  resize();
  startScreen();
  requestAnimationFrame(frame);
})();
