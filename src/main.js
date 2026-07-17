// English Defenders — bootstrap, menus & HUD (Teacher Esteban Yepes)
import { TOPICS } from '../data/topics.js';
import { Quiz, tipsES, setTipsES } from './quiz.js';
import { Game, PLANTS } from './game.js';
import { preloadSprites, spriteURL } from './sprites.js';
import { SFX, setMuted, isMuted } from './audio.js';

const $ = (id) => document.getElementById(id);
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
const LEVEL_NAMES = { A1: 'Beginner', A2: 'Elementary', B1: 'Intermediate', B2: 'Upper-Int.', C1: 'Advanced' };

/* ================= Persistence ================= */
const store = {
  get progress() { try { return JSON.parse(localStorage.getItem('ed:progress')) || {}; } catch { return {}; } },
  setStars(level, unit, stars) {
    const p = store.progress;
    p[level] = p[level] || {};
    p[level][unit] = Math.max(p[level][unit] || 0, stars);
    localStorage.setItem('ed:progress', JSON.stringify(p));
  },
  get global() { try { return JSON.parse(localStorage.getItem('ed:global')) || { asked: 0, correct: 0 }; } catch { return { asked: 0, correct: 0 }; } },
  addGlobal(asked, correct) {
    const g = store.global;
    g.asked += asked; g.correct += correct;
    localStorage.setItem('ed:global', JSON.stringify(g));
  },
};

/* ================= Stages per level ================= */
function stagesFor(level) {
  const byUnit = new Map();
  for (const t of TOPICS[level]) {
    if (!byUnit.has(t.unit)) byUnit.set(t.unit, []);
    byUnit.get(t.unit).push(t.topic);
  }
  return [...byUnit.entries()].map(([unit, topics]) => ({ unit, topics }));
}

/* ================= State ================= */
let current = null; // { level, levelIdx, stageIdx, stages, mode }
let pendingMini = null;
const quiz = new Quiz();
let game = null;

/* ================= UI helpers ================= */
function show(screenId) {
  for (const s of document.querySelectorAll('.screen')) s.classList.remove('visible');
  if (screenId) $(screenId).classList.add('visible');
}
function starStr(n) { return '⭐'.repeat(n) + '☆'.repeat(3 - n); }

/* ================= HUD hooks ================= */
const hooks = {
  onSun(v) { $('sun-amount').textContent = v; renderCards(); },
  onWave(spawned, total, label) {
    $('wave-bar').style.width = `${Math.round((spawned / Math.max(total, 1)) * 100)}%`;
    $('wave-label').textContent = label;
  },
  onCards() { renderCards(); },
  onAmmo(n) { $('ammo-count').textContent = n; },
  onStreak(msg) {
    const el = $('streak-pop');
    el.textContent = msg;
    el.classList.remove('hidden');
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
    setTimeout(() => el.classList.add('hidden'), 1700);
  },
  onEnd(won, stats) {
    store.addGlobal(stats.asked, stats.correct);
    const isClassic = current.mode === 'classic';
    if (won && isClassic) store.setStars(current.level, current.stages[current.stageIdx].unit, stats.stars);
    $('end-title').textContent = won ? '🏆 VICTORY!' : '🧟 The zombies got in…';
    $('end-stars').textContent = won ? (isClassic ? starStr(stats.stars) : '🏆') : '💀';
    $('end-stats').innerHTML =
      `English accuracy: <b>${stats.accuracy}%</b> (${stats.correct}/${stats.asked})<br>` +
      `Best streak: <b>${stats.bestStreak}</b> · Zombies defeated: <b>${stats.killed}</b>` +
      (won && isClassic && stats.accuracy < 90 ? '<br><small>Reach 90% accuracy for 3 stars ⭐</small>' : '');
    $('btn-next').style.display = won && isClassic && current.stageIdx < current.stages.length - 1 ? '' : 'none';
    $('end-modal').classList.remove('hidden');
  },
};

/* ================= Cards ================= */
function renderCards() {
  const tray = $('card-tray');
  if (!game || !game.cards) return;
  if (tray.childElementCount !== game.cards.length) {
    tray.innerHTML = '';
    for (const card of game.cards) {
      const def = PLANTS[card.id];
      const el = document.createElement('div');
      el.className = 'plant-card';
      el.dataset.id = card.id;
      el.title = def.name;
      el.innerHTML = `<img class="card-icon" src="${spriteURL(def.sprite)}" alt=""><span class="card-cost">☀️${def.cost}</span><div class="card-cd"></div>`;
      el.addEventListener('click', () => {
        const c = game.cards.find(x => x.id === card.id);
        if (c.cd > 0 || game.sunAmount < def.cost) return;
        SFX.click();
        const already = game.selectedCard === card.id;
        game.selectCard(already ? null : card.id);
        renderCards();
      });
      tray.appendChild(el);
    }
  }
  for (const el of tray.children) {
    const card = game.cards.find(c => c.id === el.dataset.id);
    const def = PLANTS[card.id];
    el.classList.toggle('selected', game.selectedCard === card.id);
    el.classList.toggle('unaffordable', game.sunAmount < def.cost);
    el.querySelector('.card-cd').style.transform = `scaleY(${card.cd > 0 ? card.cd / def.cooldown : 0})`;
  }
  $('shovel').classList.toggle('selected', game.shovelMode);
}

/* ================= Main menu ================= */
function buildMenu() {
  const wrap = $('level-buttons');
  wrap.innerHTML = '';
  for (const lvl of LEVELS) {
    const stages = stagesFor(lvl);
    const prog = store.progress[lvl] || {};
    const done = Object.keys(prog).length;
    const b = document.createElement('button');
    b.className = `level-btn level-${lvl}`;
    b.innerHTML = `${lvl}<small>${LEVEL_NAMES[lvl]}</small><small>${done}/${stages.length} ✔</small>`;
    b.addEventListener('click', () => { SFX.click(); openStages(lvl); });
    wrap.appendChild(b);
  }
  $('btn-tips').textContent = `🇪🇸 Spanish tips: ${tipsES() ? 'ON' : 'OFF'}`;
}

function openStages(level) {
  const stages = stagesFor(level);
  current = { level, levelIdx: LEVELS.indexOf(level), stageIdx: 0, stages, mode: 'classic' };
  $('stages-title').textContent = `Level ${level} — ${LEVEL_NAMES[level]}`;
  const grid = $('stage-grid');
  grid.innerHTML = '';
  const prog = store.progress[level] || {};
  stages.forEach((st, i) => {
    const el = document.createElement('div');
    el.className = 'stage-card';
    const stars = prog[st.unit] || 0;
    el.innerHTML =
      `<div class="stage-num">Stage ${i + 1} · Unit ${st.unit}</div>` +
      `<div class="stage-topics">${st.topics.join(' · ')}</div>` +
      `<div class="stage-stars">${starStr(stars)}</div>`;
    el.addEventListener('click', () => { SFX.click(); startStage(i); });
    grid.appendChild(el);
  });
  show('screen-stages');
}

function startStage(stageIdx, mode = 'classic') {
  current.stageIdx = stageIdx;
  current.mode = mode;
  const st = current.stages[stageIdx];
  const isClassic = mode === 'classic';
  // en los minijuegos se repasa todo el nivel
  quiz.setStage(current.level, isClassic ? st.unit : 999);
  $('topic-banner').textContent = isClassic
    ? `${current.level} · Unit ${st.unit} — ${st.topics[0].slice(0, 46)}`
    : `${current.level} · ${mode === 'vase' ? 'Vase Breaker' : 'Spud Bowling'} — full level review`;
  show(null);
  $('hud').classList.remove('hidden');
  $('end-modal').classList.add('hidden');
  $('sun-panel').classList.toggle('hidden', !isClassic);
  $('shovel').style.display = isClassic ? '' : 'none';
  $('ammo-panel').classList.toggle('hidden', mode !== 'bowling');
  game.startStage({
    level: current.level,
    levelIdx: current.levelIdx,
    unit: st.unit,
    stageIdx,
    mode,
  });
  renderCards();
}

function quitToMenu() {
  game.quitToMenu();
  $('hud').classList.add('hidden');
  $('end-modal').classList.add('hidden');
  $('pause-modal').classList.add('hidden');
  buildMenu();
  show('screen-menu');
}

/* ================= Minigames ================= */
function openMini(mode) {
  pendingMini = mode;
  $('mini-title').textContent = mode === 'vase' ? '🏺 Vase Breaker' : '🥔 Spud Bowling';
  $('mini-desc').textContent = mode === 'vase'
    ? 'Answer a question to break each vase. Plants, treasures… or zombies hide inside! Clear every vase to win.'
    : 'Click a lane to roll a spud and crush the zombies. Answer questions to earn more spuds!';
  const wrap = $('mini-levels');
  wrap.innerHTML = '';
  for (const lvl of LEVELS) {
    const b = document.createElement('button');
    b.className = `level-btn level-${lvl}`;
    b.textContent = lvl;
    b.addEventListener('click', () => {
      SFX.click();
      $('mini-modal').classList.add('hidden');
      current = { level: lvl, levelIdx: LEVELS.indexOf(lvl), stageIdx: 3, stages: stagesFor(lvl), mode: pendingMini };
      startStage(3, pendingMini);
    });
    wrap.appendChild(b);
  }
  $('mini-modal').classList.remove('hidden');
}

/* ================= Buttons ================= */
function bindUI() {
  $('btn-stages-back').addEventListener('click', () => { SFX.click(); show('screen-menu'); });
  $('btn-how').addEventListener('click', () => { SFX.click(); $('how-modal').classList.remove('hidden'); });
  $('btn-how-close').addEventListener('click', () => { SFX.click(); $('how-modal').classList.add('hidden'); });
  $('btn-tips').addEventListener('click', () => {
    SFX.click();
    setTipsES(!tipsES());
    $('btn-tips').textContent = `🇪🇸 Spanish tips: ${tipsES() ? 'ON' : 'OFF'}`;
  });
  $('btn-stats').addEventListener('click', () => {
    SFX.click();
    const g = store.global;
    const acc = g.asked ? Math.round((g.correct / g.asked) * 100) : 0;
    let starTotal = 0, unitsDone = 0;
    for (const lvl of LEVELS) {
      const p = store.progress[lvl] || {};
      for (const u in p) { starTotal += p[u]; unitsDone++; }
    }
    $('stats-body').innerHTML =
      `Questions answered: <b>${g.asked}</b><br>Overall accuracy: <b>${acc}%</b><br>` +
      `Units cleared: <b>${unitsDone}</b> · Stars: <b>${starTotal} ⭐</b>`;
    $('stats-modal').classList.remove('hidden');
  });
  $('btn-stats-close').addEventListener('click', () => $('stats-modal').classList.add('hidden'));

  $('btn-mini-vase').addEventListener('click', () => { SFX.click(); openMini('vase'); });
  $('btn-mini-bowl').addEventListener('click', () => { SFX.click(); openMini('bowling'); });
  $('btn-mini-close').addEventListener('click', () => $('mini-modal').classList.add('hidden'));
  $('btn-ammo').addEventListener('click', async (e) => {
    const btn = e.target;
    if (btn.disabled) return;
    btn.disabled = true;
    await game.askForAmmo();
    setTimeout(() => { btn.disabled = false; }, 4000);
  });

  $('btn-pause').addEventListener('click', () => {
    if (game.state !== 'playing') return;
    SFX.click();
    game.pause();
    $('pause-modal').classList.remove('hidden');
  });
  $('btn-resume').addEventListener('click', () => { SFX.click(); $('pause-modal').classList.add('hidden'); game.resume(); });
  $('btn-restart').addEventListener('click', () => { SFX.click(); $('pause-modal').classList.add('hidden'); startStage(current.stageIdx, current.mode); });
  $('btn-quit').addEventListener('click', () => { SFX.click(); quitToMenu(); });

  $('btn-speed').addEventListener('click', (e) => {
    SFX.click();
    const s = game.toggleSpeed();
    e.target.textContent = `▶ x${s}`;
  });
  $('btn-mute').addEventListener('click', (e) => {
    setMuted(!isMuted());
    e.target.textContent = isMuted() ? '🔇' : '🔊';
  });

  $('shovel').addEventListener('click', () => {
    if (game.state !== 'playing') return;
    SFX.click();
    game.setShovel(!game.shovelMode);
    renderCards();
  });

  $('btn-retry').addEventListener('click', () => { SFX.click(); startStage(current.stageIdx, current.mode); });
  $('btn-next').addEventListener('click', () => { SFX.click(); startStage(current.stageIdx + 1, 'classic'); });
  $('btn-end-menu').addEventListener('click', () => { SFX.click(); quitToMenu(); });
}

/* ================= Boot ================= */
(async function boot() {
  await preloadSprites();
  game = new Game($('game-canvas'), quiz, hooks);
  window.__game = game; // debug/tests
  bindUI();
  buildMenu();
  show('screen-menu');
})();
