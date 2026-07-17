// English Defenders — arranque, menús y HUD (Teacher Esteban Yepes)
import { TOPICS } from '../data/topics.js';
import { Quiz } from './quiz.js';
import { Game, PLANTS } from './game.js';
import { SFX, setMuted, isMuted } from './audio.js';

const $ = (id) => document.getElementById(id);
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
const LEVEL_NAMES = { A1: 'Principiante', A2: 'Básico', B1: 'Intermedio', B2: 'Intermedio alto', C1: 'Avanzado' };

/* ================= Persistencia ================= */
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

/* ================= Etapas por nivel ================= */
function stagesFor(level) {
  const byUnit = new Map();
  for (const t of TOPICS[level]) {
    if (!byUnit.has(t.unit)) byUnit.set(t.unit, []);
    byUnit.get(t.unit).push(t.topic);
  }
  return [...byUnit.entries()].map(([unit, topics]) => ({ unit, topics }));
}

/* ================= Estado ================= */
let current = null; // { level, levelIdx, stageIdx, stages }
const quiz = new Quiz();

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
    $('wave-bar').style.width = `${Math.round((spawned / total) * 100)}%`;
    $('wave-label').textContent = label;
  },
  onCards() { renderCards(); },
  onStreak(msg) {
    const el = $('streak-pop');
    el.textContent = msg;
    el.classList.remove('hidden');
    el.style.animation = 'none';
    void el.offsetWidth; // reinicia la animación
    el.style.animation = '';
    setTimeout(() => el.classList.add('hidden'), 1700);
  },
  onEnd(won, stats) {
    store.addGlobal(stats.asked, stats.correct);
    if (won) store.setStars(current.level, current.stages[current.stageIdx].unit, stats.stars);
    $('end-title').textContent = won ? '🏆 ¡VICTORIA!' : '🧟 Los zombies llegaron…';
    $('end-stars').textContent = won ? starStr(stats.stars) : '💀';
    $('end-stats').innerHTML =
      `Precisión en inglés: <b>${stats.accuracy}%</b> (${stats.correct}/${stats.asked})<br>` +
      `Mejor racha: <b>${stats.bestStreak}</b> · Zombies vencidos: <b>${stats.killed}</b>` +
      (won && stats.accuracy < 90 ? '<br><small>Consigue 90% de precisión para 3 estrellas ⭐</small>' : '');
    $('btn-next').style.display = won && current.stageIdx < current.stages.length - 1 ? '' : 'none';
    $('end-modal').classList.remove('hidden');
  },
};

const game = new Game($('game-canvas'), quiz, hooks);

/* ================= Cartas ================= */
function renderCards() {
  const tray = $('card-tray');
  if (!game.cards) return;
  if (tray.childElementCount !== game.cards.length) {
    tray.innerHTML = '';
    for (const card of game.cards) {
      const def = PLANTS[card.id];
      const el = document.createElement('div');
      el.className = 'plant-card';
      el.dataset.id = card.id;
      el.title = def.name;
      el.innerHTML = `<span class="card-icon">${def.icon}</span><span class="card-cost">☀️${def.cost}</span><div class="card-cd"></div>`;
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

/* ================= Menú principal ================= */
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
}

function openStages(level) {
  const stages = stagesFor(level);
  current = { level, levelIdx: LEVELS.indexOf(level), stageIdx: 0, stages };
  $('stages-title').textContent = `Nivel ${level} — ${LEVEL_NAMES[level]}`;
  const grid = $('stage-grid');
  grid.innerHTML = '';
  const prog = store.progress[level] || {};
  stages.forEach((st, i) => {
    const el = document.createElement('div');
    el.className = 'stage-card';
    const stars = prog[st.unit] || 0;
    el.innerHTML =
      `<div class="stage-num">Etapa ${i + 1} · Unit ${st.unit}</div>` +
      `<div class="stage-topics">${st.topics.join(' · ')}</div>` +
      `<div class="stage-stars">${starStr(stars)}</div>`;
    el.addEventListener('click', () => { SFX.click(); startStage(i); });
    grid.appendChild(el);
  });
  show('screen-stages');
}

function startStage(stageIdx) {
  current.stageIdx = stageIdx;
  const st = current.stages[stageIdx];
  quiz.setStage(current.level, st.unit);
  $('topic-banner').textContent = `${current.level} · Unit ${st.unit} — ${st.topics[0].slice(0, 46)}`;
  show(null);
  $('hud').classList.remove('hidden');
  $('end-modal').classList.add('hidden');
  game.startStage({
    level: current.level,
    levelIdx: current.levelIdx,
    unit: st.unit,
    stageIdx,
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

/* ================= Botones ================= */
$('btn-stages-back').addEventListener('click', () => { SFX.click(); show('screen-menu'); });
$('btn-how').addEventListener('click', () => { SFX.click(); $('how-modal').classList.remove('hidden'); });
$('btn-how-close').addEventListener('click', () => { SFX.click(); $('how-modal').classList.add('hidden'); });
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
    `Preguntas respondidas: <b>${g.asked}</b><br>Precisión total: <b>${acc}%</b><br>` +
    `Unidades superadas: <b>${unitsDone}</b> · Estrellas: <b>${starTotal} ⭐</b>`;
  $('stats-modal').classList.remove('hidden');
});
$('btn-stats-close').addEventListener('click', () => $('stats-modal').classList.add('hidden'));

$('btn-pause').addEventListener('click', () => {
  if (game.state !== 'playing') return;
  SFX.click();
  game.pause();
  $('pause-modal').classList.remove('hidden');
});
$('btn-resume').addEventListener('click', () => { SFX.click(); $('pause-modal').classList.add('hidden'); game.resume(); });
$('btn-restart').addEventListener('click', () => { SFX.click(); $('pause-modal').classList.add('hidden'); startStage(current.stageIdx); });
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

$('btn-retry').addEventListener('click', () => { SFX.click(); startStage(current.stageIdx); });
$('btn-next').addEventListener('click', () => { SFX.click(); startStage(current.stageIdx + 1); });
$('btn-end-menu').addEventListener('click', () => { SFX.click(); quitToMenu(); });

/* ================= Arranque ================= */
window.__game = game; // para depuración/pruebas
buildMenu();
setTimeout(() => { show('screen-menu'); }, 600);
