// English Defenders — bootstrap, menus & HUD (Teacher Esteban Yepes)
import { TOPICS } from '../data/topics.js';
import { Quiz, tipsES, setTipsES } from './quiz.js';
import { Game, PLANTS, THEMES, PLANT_DESC, ZOMBIE_INFO, availablePlants } from './game.js';
import { preloadSprites, spriteURL } from './sprites.js';
import { preloadModels } from './models3d.js';
import { SFX, setMuted, isMuted } from './audio.js';
import { startMusic, stopMusic, isMusicPlaying } from './music.js';
import { ClassHost, ClassClient, joinURL, makeQR } from './net.js';

const musicWanted = () => localStorage.getItem('ed:music') !== 'off';

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
      el.className = `plant-card tier-${def.tier}`;
      el.dataset.id = card.id;
      el.title = `${def.name} (${def.tier})`;
      el.innerHTML = `<img class="card-icon" src="${spriteURL(def.sprite)}" alt=""><span class="card-cost">☀️${def.cost}</span><span class="tier-dot"></span><div class="card-cd"></div>`;
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
    el.addEventListener('click', () => { SFX.click(); openPlantSelect(i); });
    grid.appendChild(el);
  });
  show('screen-stages');
}

/* ================= Plant loadout picker ================= */
let plantSel = { stageIdx: 0, list: [], chosen: [], max: 8 };
function openPlantSelect(stageIdx) {
  current.stageIdx = stageIdx;
  const list = availablePlants(current.levelIdx, stageIdx);
  plantSel = { stageIdx, list, max: Math.min(list.length, 8), chosen: [] };
  // reutiliza la última selección válida; si no, un set por defecto
  const prev = (current.loadout || []).filter(id => list.includes(id));
  plantSel.chosen = prev.length ? prev.slice(0, plantSel.max) : list.slice(0, Math.min(6, list.length));
  const st = current.stages[stageIdx];
  $('plants-title').textContent = `Choose your plants — Unit ${st.unit}`;
  $('plant-desc').textContent = 'Tap a plant to see what it does.';
  renderPlantSelect();
  show('screen-plants');
}

function renderPlantSelect() {
  const grid = $('plants-grid');
  grid.innerHTML = '';
  for (const id of plantSel.list) {
    const def = PLANTS[id];
    const chosen = plantSel.chosen.includes(id);
    const el = document.createElement('div');
    el.className = `plant-pick tier-${def.tier}${chosen ? ' chosen' : ''}`;
    el.innerHTML =
      `<img src="${spriteURL(def.sprite)}" alt=""><span class="pp-name">${def.name}</span>` +
      `<span class="pp-cost">☀️${def.cost}</span>${chosen ? '<span class="pp-check">✓</span>' : ''}`;
    el.addEventListener('click', () => {
      SFX.click();
      $('plant-desc').innerHTML = `<b>${def.name}</b> · ☀️${def.cost} — ${PLANT_DESC[id] || ''}`;
      const i = plantSel.chosen.indexOf(id);
      if (i >= 0) plantSel.chosen.splice(i, 1);
      else if (plantSel.chosen.length < plantSel.max) plantSel.chosen.push(id);
      else { hooks.onStreak?.(`You can bring up to ${plantSel.max} plants`); }
      renderPlantSelect();
    });
    grid.appendChild(el);
  }
  // fila de seleccionadas
  const slots = $('plants-slots');
  slots.innerHTML = plantSel.chosen.length
    ? plantSel.chosen.map(id => `<div class="slot tier-${PLANTS[id].tier}"><img src="${spriteURL(PLANTS[id].sprite)}" alt="" title="${PLANTS[id].name}"></div>`).join('')
    : '<span class="slot-empty">No plants selected yet — tap some below!</span>';
  $('btn-plants-start').disabled = plantSel.chosen.length === 0;
}

/* ================= Almanac ================= */
function openAlmanac(kind = 'plants') {
  for (const b of document.querySelectorAll('.almanac-tab')) b.classList.remove('selected');
  $(kind === 'plants' ? 'alm-tab-plants' : 'alm-tab-zombies').classList.add('selected');
  const listEl = $('almanac-list');
  listEl.innerHTML = '';
  if (kind === 'plants') {
    for (const [id, def] of Object.entries(PLANTS)) {
      listEl.appendChild(almanacRow(def.sprite, `${def.name} · ☀️${def.cost}`, PLANT_DESC[id] || '', `tier-${def.tier}`));
    }
  } else {
    for (const info of Object.values(ZOMBIE_INFO)) {
      listEl.appendChild(almanacRow(info.sprite, info.name, info.desc, 'zrow'));
    }
  }
  $('almanac-modal').classList.remove('hidden');
}
function almanacRow(sprite, title, desc, cls) {
  const row = document.createElement('div');
  row.className = `almanac-row ${cls || ''}`;
  row.innerHTML = `<img src="${spriteURL(sprite)}" alt=""><div class="ar-text"><b>${title}</b><span>${desc}</span></div>`;
  return row;
}

function startStage(stageIdx, mode = 'classic', opts = {}) {
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
    endless: !!opts.endless,   // Class Mode: oleadas infinitas hasta el tiempo o el docente
    loadout: mode === 'classic' ? current.loadout : null, // plantas elegidas por el jugador
  });
  renderCards();
}

function quitToMenu() {
  game.quitToMenu();
  stopClass();
  $('hud').classList.add('hidden');
  $('end-modal').classList.add('hidden');
  $('pause-modal').classList.add('hidden');
  // restaura botones del modal de fin que Class Mode oculta
  $('btn-retry').style.display = '';
  buildMenu();
  show('screen-menu');
}

/* ================= Class Mode (multiplayer) ================= */
let classHost = null, classClient = null, classTimer = null, classLevel = 'A1', className = 'Teacher';
let classMinutes = 0, classDeadline = 0, classCountdown = null;

function myStat() {
  return {
    sun: game.sunAmount | 0, killed: game.killed | 0,
    correct: quiz.stats.correct | 0, asked: quiz.stats.asked | 0,
    state: game.state,
  };
}

function classTimeLeft() {
  if (!classDeadline) return '';
  const s = Math.max(Math.round((classDeadline - Date.now()) / 1000), 0);
  return `⏱ ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function renderClassBoard(rows) {
  const el = $('class-board');
  el.classList.remove('hidden');
  const icon = (s) => s === 'won' ? '🏆' : s === 'lost' ? '💀' : '⚔️';
  const medal = (i) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '·';
  el.innerHTML =
    `<div class="row head"><b>👥 CLASS BATTLE</b><span>${classTimeLeft()}</span></div>` +
    rows.map((r, i) => {
      const acc = r.asked ? Math.round((r.correct / r.asked) * 100) : 0;
      const me = r.name.startsWith('⭐') || r.name === className;
      return `<div class="prow${me ? ' me' : ''}">` +
        `<span class="nm">${medal(i)} ${icon(r.state)} ${r.name}</span>` +
        `<span class="sc">🧟${r.killed} · ${acc}%</span>` +
        `<div class="pbar"><div class="pfill" style="width:${acc}%"></div></div>` +
        `</div>`;
    }).join('');
}

function startClassBattle(level, minutes = 0) {
  $('class-modal').classList.add('hidden');
  const stages = stagesFor(level);
  current = { level, levelIdx: LEVELS.indexOf(level), stageIdx: 4, stages, mode: 'classic' };
  startStage(4, 'classic', { endless: true });
  // en batalla de clase se pregunta de todo el nivel
  quiz.setStage(level, 999);
  $('topic-banner').textContent = `👥 Class Battle — Level ${level} (full review)`;
  // controles en pantalla según el rol
  $('btn-class-end').classList.toggle('hidden', !classHost);
  $('btn-class-leave').classList.toggle('hidden', !classClient);
  clearInterval(classTimer);
  classTimer = setInterval(() => {
    if (!game) return;
    if (classHost) renderClassBoard(classHost.board(className, myStat()));
    else if (classClient) classClient.sendStat(myStat());
  }, 2000);
  // límite de tiempo fijado por el docente
  clearInterval(classCountdown);
  classDeadline = minutes > 0 ? Date.now() + minutes * 60000 : 0;
  if (classDeadline) {
    classCountdown = setInterval(() => {
      const head = document.querySelector('#class-board .head span');
      if (head) head.textContent = classTimeLeft();
      if (Date.now() >= classDeadline) {
        clearInterval(classCountdown);
        if (classHost) endClassGame();      // el docente cierra la sesión para todos
        else game.timeUp();
      }
    }, 500);
  }
}

// El docente termina la partida para toda la clase y muestra el ranking final.
function endClassGame() {
  if (!classHost) return;
  const rows = classHost.board(className, myStat());
  classHost.end(rows);
  showClassResults(rows, true);
}

function showClassResults(rows, isHost) {
  clearInterval(classTimer); classTimer = null;
  clearInterval(classCountdown); classCountdown = null;
  if (game) game.pause();
  const medal = (i) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
  $('end-title').textContent = '🏁 Class results';
  $('end-stars').textContent = '👥';
  $('end-stats').innerHTML = rows.map((r, i) => {
    const acc = r.asked ? Math.round((r.correct / r.asked) * 100) : 0;
    return `<div style="text-align:left">${medal(i)} <b>${r.name}</b> — 🧟 ${r.killed} · ${acc}%</div>`;
  }).join('');
  $('btn-next').style.display = 'none';
  $('btn-retry').style.display = 'none';
  $('end-modal').classList.remove('hidden');
}

function openClassHost() {
  className = 'Teacher';
  $('class-modal').classList.remove('hidden');
  $('class-host').classList.remove('hidden');
  $('class-join').classList.add('hidden');
  $('class-code').textContent = '·····';
  $('class-roster').textContent = 'Connecting to the network…';
  $('btn-class-start').disabled = true;
  // selector de nivel
  const wrap = $('class-levels');
  wrap.innerHTML = '';
  for (const lvl of LEVELS) {
    const b = document.createElement('button');
    b.className = `level-btn level-${lvl}`;
    b.textContent = lvl;
    b.style.outline = lvl === classLevel ? '3px solid #ffd83d' : 'none';
    b.addEventListener('click', () => {
      classLevel = lvl;
      for (const o of wrap.children) o.style.outline = 'none';
      b.style.outline = '3px solid #ffd83d';
    });
    wrap.appendChild(b);
  }
  // selector de límite de tiempo
  const tWrap = $('class-times');
  tWrap.innerHTML = '';
  for (const [label, min] of [['No limit', 0], ['3 min', 3], ['5 min', 5], ['10 min', 10]]) {
    const b = document.createElement('button');
    b.className = 'wood-btn small time-btn';
    b.textContent = label;
    b.style.outline = min === classMinutes ? '3px solid #ffd83d' : 'none';
    b.addEventListener('click', () => {
      classMinutes = min;
      for (const o of tWrap.children) o.style.outline = 'none';
      b.style.outline = '3px solid #ffd83d';
    });
    tWrap.appendChild(b);
  }
  classHost = new ClassHost({
    onReady: (code) => {
      $('class-code').textContent = code;
      const url = joinURL(code);
      $('class-link').textContent = url;
      const qrImg = $('class-qr');
      try {
        qrImg.src = makeQR(url);
        qrImg.style.display = '';
      } catch (e) {
        console.warn('QR generation failed:', e);
        qrImg.style.display = 'none'; // sin QR, el enlace/código de abajo bastan para unirse
      }
      $('class-roster').textContent = 'Waiting for students…';
      $('btn-class-start').disabled = false;
    },
    onError: (e) => {
      $('class-roster').textContent = `⚠ Connection error (${e.type || e}). Check your internet and reload.`;
    },
    onRoster: (players) => {
      $('class-roster').innerHTML = players.length
        ? `👥 ${players.length}/7 joined: <b>${players.join(', ')}</b>`
        : 'Waiting for students…';
    },
  });
}

let classJoinCode = null;
function openClassJoin(code) {
  classJoinCode = code;
  $('class-modal').classList.remove('hidden');
  $('class-host').classList.add('hidden');
  $('class-join').classList.remove('hidden');
  $('class-join-status').textContent = '';
  $('btn-class-retry').classList.add('hidden');
  $('btn-class-join').classList.remove('hidden');
  $('btn-class-join').disabled = false;
  $('class-join-msg').textContent = `Join your teacher's game (code ${code}). Enter your name:`;
  $('btn-class-join').onclick = () => doJoin(code);
}

function doJoin(code) {
  const name = $('class-name').value.trim() || 'Student';
  className = name;
  $('class-join-status').textContent = '⏳ Connecting…';
  $('btn-class-join').disabled = true;
  $('btn-class-retry').classList.add('hidden');
  classClient?.destroy();
  classClient = new ClassClient(code, name, {
    onStart: (cfg) => startClassBattle(cfg.level || 'A1', cfg.minutes || 0),
    onBoard: renderClassBoard,
    onEnd: (rows) => showClassResults(rows, false),
    onStatus: (s, extra) => {
      const msgs = {
        waiting: '✅ Connected! Waiting for your teacher to start…',
        joined: `✅ You're in! Players: ${(extra || []).join(', ')}`,
        full: '⚠ The class is full (7 students max).',
        closed: '⚠ The teacher ended the session.',
        retrying: `⏳ ${extra}`,
        failed: '⚠ Could not connect. Check the code and your internet, then Retry.',
        error: `⚠ Connection problem (${extra}). Tap Retry.`,
      };
      $('class-join-status').textContent = msgs[s] || s;
      const showRetry = (s === 'error' || s === 'full' || s === 'failed');
      $('btn-class-retry').classList.toggle('hidden', !showRetry);
      if (showRetry) $('btn-class-join').classList.add('hidden');
    },
  });
}

function stopClass() {
  clearInterval(classTimer); classTimer = null;
  clearInterval(classCountdown); classCountdown = null;
  classDeadline = 0;
  classHost?.destroy(); classHost = null;
  classClient?.destroy(); classClient = null;
  $('class-board').classList.add('hidden');
  $('btn-class-end').classList.add('hidden');
  $('btn-class-leave').classList.add('hidden');
  if (location.hash.startsWith('#join=')) history.replaceState(null, '', location.pathname);
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

/* ================= Scenario picker ================= */
function openScenario() {
  const grid = $('scenario-grid');
  grid.innerHTML = '';
  const cur = (game && game.themeId) || localStorage.getItem('ed:theme') || 'day';
  for (const [id, t] of Object.entries(THEMES)) {
    const b = document.createElement('button');
    b.className = 'scenario-btn' + (id === cur ? ' selected' : '');
    // miniatura del fondo pintado real para que se vea qué escenario eliges
    b.innerHTML =
      `<img class="sc-thumb" src="assets/backgrounds/${id}.jpg" alt="" loading="lazy">` +
      `<span class="sc-label"><span class="sc-emoji">${t.emoji}</span> ${t.name}</span>`;
    b.addEventListener('click', () => {
      SFX.click();
      game.setTheme(id);
      for (const o of grid.children) o.classList.remove('selected');
      b.classList.add('selected');
      $('scenario-note').textContent = `✅ ${t.name} selected — you'll see it when you start a game!`;
    });
    grid.appendChild(b);
  }
  $('scenario-note').textContent = 'Tap a scenario to choose your battlefield.';
  $('scenario-modal').classList.remove('hidden');
}

/* ================= Buttons ================= */
function bindUI() {
  $('btn-scenario').addEventListener('click', () => { SFX.click(); openScenario(); });
  $('btn-scenario-hud').addEventListener('click', () => { SFX.click(); openScenario(); });
  $('btn-scenario-close').addEventListener('click', () => { SFX.click(); $('scenario-modal').classList.add('hidden'); });
  $('btn-stages-back').addEventListener('click', () => { SFX.click(); show('screen-menu'); });
  // selector de plantas
  $('btn-plants-back').addEventListener('click', () => { SFX.click(); show('screen-stages'); });
  $('btn-plants-start').addEventListener('click', () => {
    SFX.click();
    current.loadout = plantSel.chosen.slice();
    startStage(plantSel.stageIdx, 'classic');
  });
  // almanaque
  $('btn-almanac').addEventListener('click', () => { SFX.click(); openAlmanac('plants'); });
  $('alm-tab-plants').addEventListener('click', () => { SFX.click(); openAlmanac('plants'); });
  $('alm-tab-zombies').addEventListener('click', () => { SFX.click(); openAlmanac('zombies'); });
  $('btn-almanac-close').addEventListener('click', () => { SFX.click(); $('almanac-modal').classList.add('hidden'); });
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
  $('btn-class').addEventListener('click', () => { SFX.click(); openClassHost(); });
  $('btn-class-close').addEventListener('click', () => { $('class-modal').classList.add('hidden'); stopClass(); });
  $('btn-class-start').addEventListener('click', () => {
    SFX.click();
    classHost?.start({ level: classLevel, minutes: classMinutes });
    startClassBattle(classLevel, classMinutes);
  });
  $('btn-class-retry').addEventListener('click', () => { SFX.click(); if (classJoinCode) doJoin(classJoinCode); });
  // el docente termina la partida para toda la clase
  $('btn-class-end').addEventListener('click', () => {
    SFX.click();
    if (confirm('End the game for the whole class and show results?')) endClassGame();
  });
  // el estudiante sale de la partida
  $('btn-class-leave').addEventListener('click', () => {
    SFX.click();
    classClient?.leave(); classClient = null;
    quitToMenu();
  });
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
  $('btn-music').addEventListener('click', (e) => {
    const on = !musicWanted();
    localStorage.setItem('ed:music', on ? 'on' : 'off');
    if (on) startMusic(); else stopMusic();
    e.target.textContent = on ? '🎵' : '🎵̸';
    e.target.style.opacity = on ? '1' : '0.5';
  });
  // la música arranca con el primer gesto del usuario (política de autoplay)
  const kickMusic = () => { if (musicWanted() && !isMusicPlaying()) startMusic(); };
  document.addEventListener('pointerdown', kickMusic, { once: false });

  $('shovel').addEventListener('click', () => {
    if (game.state !== 'playing') return;
    SFX.click();
    game.setShovel(!game.shovelMode);
    renderCards();
  });

  $('btn-retry').addEventListener('click', () => { SFX.click(); startStage(current.stageIdx, current.mode); });
  $('btn-next').addEventListener('click', () => { SFX.click(); $('end-modal').classList.add('hidden'); openPlantSelect(current.stageIdx + 1); });
  $('btn-end-menu').addEventListener('click', () => { SFX.click(); quitToMenu(); });
}

/* ================= Boot ================= */
function bootError(msg) {
  const inner = document.querySelector('.loading-inner');
  inner.innerHTML =
    `<div style="font-size:46px">🧟</div>` +
    `<h2 style="color:#ffb0a0">The game could not start</h2>` +
    `<p style="max-width:480px;margin:10px auto;font-weight:700;line-height:1.5">${msg}</p>`;
}

(async function boot() {
  try {
    // WebGL es indispensable: algunos navegadores (p. ej. Brave con Shields
    // agresivos o sin aceleración por hardware) lo bloquean.
    const test = document.createElement('canvas');
    const gl = test.getContext('webgl2') || test.getContext('webgl');
    if (!gl) {
      bootError(
        'Your browser has <b>WebGL disabled</b>, which this 3D game needs.<br><br>' +
        '🦁 <b>Brave:</b> click the lion icon in the address bar and turn Shields OFF for this site, ' +
        'and make sure <i>Settings → System → Use hardware acceleration</i> is ON, then reload.<br><br>' +
        '🌐 Or try opening the game in Chrome or Edge.'
      );
      return;
    }
    // si la carga de sprites/modelos tarda demasiado, seguimos con respaldos
    await Promise.race([
      Promise.all([preloadSprites(), preloadModels()]),
      new Promise(res => setTimeout(res, 20000)),
    ]);
    game = new Game($('game-canvas'), quiz, hooks);
    window.__game = game; // debug/tests
    bindUI();
    buildMenu();
    show('screen-menu');
    // si llega por un enlace/QR de Class Mode, abre el flujo de unirse
    const m = location.hash.match(/^#join=([A-Za-z0-9]{4,8})$/);
    if (m) openClassJoin(m[1]);
  } catch (err) {
    console.error(err);
    bootError(
      `Something went wrong while starting:<br><code style="color:#ffd0c0">${String(err).slice(0, 200)}</code>` +
      '<br><br>Try a hard refresh (<b>Ctrl+Shift+R</b>).<br>' +
      'If it persists: enable <i>hardware acceleration</i> in your browser settings ' +
      '(<code>chrome://settings/system</code>) and update your graphics drivers, then restart the browser.'
    );
  }
})();
