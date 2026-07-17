// English Defenders — motor de juego 3D (Teacher Esteban Yepes)
// Tower-defense por carriles inspirado en las mecánicas clásicas del género.
import * as THREE from 'three';
import { makeBoardTexture, makeDirtTexture, makeStoneTexture, makeSkyTexture } from './textures.js';
import {
  makePlantModel, makeZombieModel, makeSunModel, makeProjectile, makeMowerModel,
  makeFence, makeHouse, makeTree, makeRock, makeGraveSign,
} from './models.js';
import { SFX } from './audio.js';

export const ROWS = 5, COLS = 9;
const CELL = 1;
const colX = (c) => c - (COLS - 1) / 2; // col 0..8 -> x -4..4
const rowZ = (r) => r - (ROWS - 1) / 2; // row 0..4 -> z -2..2

export const PLANTS = {
  sunny:   { name: 'Sunny',       icon: '🌻', cost: 50,  hp: 120, cooldown: 6 },
  shooter: { name: 'Pea Scholar', icon: '🌱', cost: 100, hp: 120, cooldown: 6,  fireRate: 1.5, dmg: 20 },
  nut:     { name: 'Tough Nut',   icon: '🥥', cost: 50,  hp: 950, cooldown: 18 },
  frost:   { name: 'Frost Berry', icon: '🫐', cost: 150, hp: 120, cooldown: 8,  fireRate: 1.9, dmg: 15, slow: true },
  boom:    { name: 'Boom Shroom', icon: '🍄', cost: 125, hp: 110, cooldown: 14, fireRate: 3.0, dmg: 45, aoe: 1.15 },
  corn:    { name: 'Corn Cannon', icon: '🌽', cost: 175, hp: 130, cooldown: 12, fireRate: 2.6, dmg: 60 },
};

const ZOMBIE_TYPES = {
  basic:    { hp: 100, speed: 0.22, dmg: 28 },
  flag:     { hp: 120, speed: 0.30, dmg: 28 },
  cone:     { hp: 210, speed: 0.22, dmg: 28 },
  book:     { hp: 170, speed: 0.24, dmg: 28 },
  bucket:   { hp: 350, speed: 0.18, dmg: 28 },
  football: { hp: 310, speed: 0.40, dmg: 38 },
  prof:     { hp: 560, speed: 0.14, dmg: 48 },
};

export class Game {
  constructor(canvas, quiz, hooks) {
    this.canvas = canvas;
    this.quiz = quiz;
    this.hooks = hooks; // { onSun, onWave, onEnd, onCards, onStreak }
    this.state = 'idle';
    this.speed = 1;
    this._initScene();
    this._bindInput();
    this.clock = new THREE.Clock();
    this._animate = this._animate.bind(this);
    requestAnimationFrame(this._animate);
  }

  /* ============================ ESCENA ============================ */
  _initScene() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene = new THREE.Scene();
    this.scene.background = makeSkyTexture();
    this.scene.fog = new THREE.Fog(0xcfe8d8, 22, 45);

    this.camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
    this.camera.position.set(0.7, 8.3, 7.6);
    this.camera.lookAt(0.5, -0.3, -0.4);

    const hemi = new THREE.HemisphereLight(0xeaf6ff, 0x5a7a3a, 0.95);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff2d8, 2.0);
    sun.position.set(6, 12, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -9; sun.shadow.camera.right = 9;
    sun.shadow.camera.top = 8; sun.shadow.camera.bottom = -8;
    this.scene.add(sun);

    // Suelo general
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 40),
      new THREE.MeshStandardMaterial({ map: makeDirtTexture(), roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Tablero de césped
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(COLS * CELL, ROWS * CELL),
      new THREE.MeshStandardMaterial({ map: makeBoardTexture(COLS, ROWS), roughness: 0.95 })
    );
    board.rotation.x = -Math.PI / 2;
    board.receiveShadow = true;
    this.scene.add(board);
    this.boardMesh = board;

    // Camino de piedra por donde llegan los zombies
    const path = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.06, ROWS * CELL + 0.6),
      new THREE.MeshStandardMaterial({ map: makeStoneTexture(), roughness: 0.9 })
    );
    path.position.set(COLS / 2 + 1.1, 0.01, 0);
    path.receiveShadow = true;
    this.scene.add(path);

    // Props
    const fence = makeFence(COLS + 3);
    fence.position.set(0.5, 0, -(ROWS / 2) - 0.7);
    this.scene.add(fence);
    const house = makeHouse();
    house.position.set(-(COLS / 2) - 2.6, 0, 0);
    this.scene.add(house);
    for (const [x, z, s] of [[-6.4, -3.4, 1.3], [7.6, -3.2, 1.1], [3.5, -3.8, 0.9], [-2, -4, 1.0]]) {
      const t = makeTree(s); t.position.set(x, 0, z); this.scene.add(t);
    }
    for (const [x, z, s] of [[6.9, 2.8, 1.2], [-5.6, 3, 0.9], [7.4, -1.8, 0.8]]) {
      const r = makeRock(s); r.position.set(x, 0, z); this.scene.add(r);
    }
    const sign = makeGraveSign();
    sign.position.set(COLS / 2 + 1.2, 0, ROWS / 2 + 0.6);
    sign.rotation.y = -0.5;
    this.scene.add(sign);

    // Nubes
    this.clouds = [];
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.92 });
    for (let i = 0; i < 5; i++) {
      const cl = new THREE.Group();
      for (let j = 0; j < 3; j++) {
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.6 + Math.random() * 0.5, 10, 8), cloudMat);
        b.position.set(j * 0.8 - 0.8, Math.random() * 0.2, Math.random() * 0.4);
        b.scale.y = 0.55;
        cl.add(b);
      }
      cl.position.set(-14 + i * 7 + Math.random() * 3, 7.5 + Math.random() * 2.5, -9 - Math.random() * 5);
      this.scene.add(cl);
      this.clouds.push(cl);
    }

    // Resaltado de casilla
    const hl = new THREE.Mesh(
      new THREE.PlaneGeometry(0.96, 0.96),
      new THREE.MeshBasicMaterial({ color: 0xfff2a0, transparent: true, opacity: 0.35 })
    );
    hl.rotation.x = -Math.PI / 2;
    hl.position.y = 0.02;
    hl.visible = false;
    this.scene.add(hl);
    this.highlight = hl;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    addEventListener('resize', () => {
      this.camera.aspect = innerWidth / innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(innerWidth, innerHeight);
    });
    this.renderer.setSize(innerWidth, innerHeight);
  }

  /* ============================ ETAPA ============================ */
  startStage(cfg) {
    // cfg: { level:'A1', levelIdx, unit, stageIdx, label }
    this.cfg = cfg;
    this._clearEntities();
    this.sunAmount = 150;
    this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    this.plants = []; this.zombies = []; this.projectiles = []; this.suns = [];
    this.particles = []; this.mowers = [];
    this.selectedCard = null; this.shovelMode = false;
    this.time = 0;
    this.killed = 0;
    this.speed = 1;

    // Libros voladores (última defensa)
    for (let r = 0; r < ROWS; r++) {
      const m = makeMowerModel();
      m.position.set(-(COLS / 2) - 0.7, 0, rowZ(r));
      this.scene.add(m);
      this.mowers.push({ mesh: m, row: r, active: false, used: false, baseY: 0 });
    }

    // Dificultad: crece con el nivel CEFR y la etapa
    const D = cfg.levelIdx * 2.2 + cfg.stageIdx * 0.55;
    this.totalZombies = Math.min(14 + Math.round(cfg.stageIdx * 1.6 + cfg.levelIdx * 5), 48);
    this.spawned = 0;
    this.spawnTimer = 7; // primer zombie
    this.baseInterval = Math.max(8.5 - D * 0.32, 3.2);
    this.zombiePool = this._buildZombiePool(D);
    this.sunFallTimer = 5;

    // Cartas desbloqueadas según progreso
    const cards = ['sunny', 'shooter', 'nut'];
    if (cfg.stageIdx >= 1 || cfg.levelIdx >= 1) cards.push('frost');
    if (cfg.stageIdx >= 3 || cfg.levelIdx >= 2) cards.push('boom');
    if (cfg.stageIdx >= 5 || cfg.levelIdx >= 3) cards.push('corn');
    this.cards = cards.map(id => ({ id, cd: 0 }));
    this.hooks.onCards(this.cards);
    this.hooks.onSun(this.sunAmount);
    this.hooks.onWave(0, this.totalZombies, '¡Prepárate! Los zombies vienen en camino…');

    this.state = 'playing';
    this.clock.getDelta();
  }

  _buildZombiePool(D) {
    const pool = [{ t: 'basic', w: 10 }];
    if (D >= 0.5) pool.push({ t: 'cone', w: 4 + D });
    if (D >= 1.5) pool.push({ t: 'book', w: 3 + D * 0.8 });
    if (D >= 2.5) pool.push({ t: 'bucket', w: 2 + D * 0.7 });
    if (D >= 4) pool.push({ t: 'football', w: 1 + D * 0.5 });
    if (D >= 6) pool.push({ t: 'prof', w: 0.5 + D * 0.3 });
    return pool;
  }

  _pickZombieType() {
    const total = this.zombiePool.reduce((s, z) => s + z.w, 0);
    let r = Math.random() * total;
    for (const z of this.zombiePool) { r -= z.w; if (r <= 0) return z.t; }
    return 'basic';
  }

  _clearEntities() {
    if (!this.plants) return;
    for (const arr of [this.plants, this.zombies, this.projectiles, this.suns, this.particles])
      for (const e of arr) this.scene.remove(e.mesh || e.points);
    for (const m of this.mowers) this.scene.remove(m.mesh);
  }

  quitToMenu() {
    this.state = 'idle';
    this._clearEntities();
    this.plants = []; this.zombies = []; this.projectiles = []; this.suns = []; this.particles = []; this.mowers = [];
  }

  /* ============================ INPUT ============================ */
  _bindInput() {
    this.canvas.addEventListener('pointermove', (e) => this._onMove(e));
    this.canvas.addEventListener('pointerdown', (e) => this._onClick(e));
  }

  _ray(e) {
    this.pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
  }

  _cellAt(e) {
    this._ray(e);
    const hit = this.raycaster.intersectObject(this.boardMesh)[0];
    if (!hit) return null;
    const c = Math.round(hit.point.x + (COLS - 1) / 2);
    const r = Math.round(hit.point.z + (ROWS - 1) / 2);
    if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return null;
    return { r, c };
  }

  _onMove(e) {
    if (this.state !== 'playing' || (!this.selectedCard && !this.shovelMode)) {
      this.highlight.visible = false;
      return;
    }
    const cell = this._cellAt(e);
    if (cell) {
      this.highlight.visible = true;
      this.highlight.position.set(colX(cell.c), 0.02, rowZ(cell.r));
      const occupied = !!this.grid[cell.r][cell.c];
      this.highlight.material.color.set(
        this.shovelMode ? (occupied ? 0xff8866 : 0x888888) : (occupied ? 0xff8866 : 0xfff2a0)
      );
    } else this.highlight.visible = false;
  }

  async _onClick(e) {
    if (this.state !== 'playing') return;
    // 1) ¿clic sobre un sol?
    this._ray(e);
    const sunMeshes = this.suns.filter(s => !s.collected).map(s => s.mesh);
    const hitSun = this.raycaster.intersectObjects(sunMeshes, true)[0];
    if (hitSun) {
      let obj = hitSun.object;
      while (obj.parent && !obj.userData.sun) obj = obj.parent;
      const sun = this.suns.find(s => s.mesh === obj);
      if (sun) { this._collectSun(sun); return; }
    }
    // 2) pala
    if (this.shovelMode) {
      const cell = this._cellAt(e);
      if (cell && this.grid[cell.r][cell.c]) {
        this._removePlant(this.grid[cell.r][cell.c]);
        SFX.shovel();
      }
      this.setShovel(false);
      return;
    }
    // 3) plantar
    if (!this.selectedCard) return;
    const cell = this._cellAt(e);
    if (!cell || this.grid[cell.r][cell.c]) return;
    const card = this.cards.find(c => c.id === this.selectedCard);
    const def = PLANTS[card.id];
    if (card.cd > 0 || this.sunAmount < def.cost) return;

    // === Pregunta de inglés para plantar ===
    this.state = 'quiz';
    this.highlight.visible = false;
    const res = await this.quiz.ask();
    this.state = 'playing';
    this.clock.getDelta(); // descarta el tiempo del modal
    if (res.correct) {
      this.sunAmount -= def.cost;
      card.cd = def.cooldown;
      this._placePlant(card.id, cell.r, cell.c);
      this.hooks.onSun(this.sunAmount);
      // Racha: bonus cada 3 correctas seguidas
      if (this.quiz.stats.streak > 0 && this.quiz.stats.streak % 3 === 0) {
        this.sunAmount += 50;
        this.hooks.onSun(this.sunAmount);
        this.hooks.onStreak(`🔥 ¡Racha de ${this.quiz.stats.streak}! +50 ☀️`);
        SFX.streak();
      }
    } else {
      card.cd = 2.5; // pequeña penalización
    }
    this.selectCard(null);
    this.hooks.onCards(this.cards);
  }

  selectCard(id) {
    this.selectedCard = id;
    this.shovelMode = false;
    this.canvas.classList.toggle('planting', !!id);
    this.canvas.classList.remove('shoveling');
  }

  setShovel(on) {
    this.shovelMode = on;
    this.selectedCard = null;
    this.canvas.classList.toggle('shoveling', on);
    this.canvas.classList.remove('planting');
    if (!on) this.highlight.visible = false;
  }

  /* ============================ PLANTAS ============================ */
  _placePlant(type, r, c) {
    const def = PLANTS[type];
    const mesh = makePlantModel(type);
    mesh.position.set(colX(c), 0, rowZ(r));
    mesh.scale.setScalar(0.01);
    this.scene.add(mesh);
    const plant = {
      type, def, mesh, r, c, hp: def.hp, maxHp: def.hp,
      fireTimer: 1 + Math.random() * 0.5, sunTimer: 7 + Math.random() * 3,
      born: this.time, spawnAnim: 0,
    };
    this.grid[r][c] = plant;
    this.plants.push(plant);
    SFX.plant();
    this._burst(mesh.position.clone().add(new THREE.Vector3(0, 0.5, 0)), 0x9adc60, 14);
  }

  _removePlant(plant) {
    this.grid[plant.r][plant.c] = null;
    this.plants = this.plants.filter(p => p !== plant);
    this.scene.remove(plant.mesh);
    this._burst(plant.mesh.position.clone().add(new THREE.Vector3(0, 0.4, 0)), 0x8a5a2b, 10);
  }

  /* ============================ ZOMBIES ============================ */
  _spawnZombie(type, row = null) {
    const def = ZOMBIE_TYPES[type];
    const r = row ?? Math.floor(Math.random() * ROWS);
    const mesh = makeZombieModel(type);
    mesh.position.set(COLS / 2 + 1.2 + Math.random() * 0.6, 0, rowZ(r));
    this.scene.add(mesh);
    this.zombies.push({
      type, def, mesh, r, hp: def.hp, maxHp: def.hp,
      slowUntil: 0, dying: 0, eating: null, phase: Math.random() * 6,
    });
    this.spawned++;
  }

  /* ============================ SOLES ============================ */
  _spawnSun(x, z, fromSky, value = 25) {
    const mesh = makeSunModel();
    mesh.userData.sun = true;
    mesh.position.set(x, fromSky ? 9 : 0.8, z);
    this.scene.add(mesh);
    this.suns.push({ mesh, value, targetY: 0.45, fromSky, life: 12, collected: false, t: 0 });
  }

  _collectSun(sun) {
    if (sun.collected) return;
    sun.collected = true;
    SFX.sun();
    this.sunAmount += sun.value;
    this.hooks.onSun(this.sunAmount);
  }

  /* ============================ PARTÍCULAS ============================ */
  _burst(pos, color, n = 12) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(n * 3);
    const vels = [];
    for (let i = 0; i < n; i++) {
      positions.set([pos.x, pos.y, pos.z], i * 3);
      vels.push(new THREE.Vector3((Math.random() - .5) * 3, Math.random() * 3 + 1, (Math.random() - .5) * 3));
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color, size: 0.09, transparent: true, opacity: 1 });
    const points = new THREE.Points(geo, mat);
    this.scene.add(points);
    this.particles.push({ points, vels, life: 0.7, maxLife: 0.7 });
  }

  /* ============================ LOOP ============================ */
  _animate() {
    requestAnimationFrame(this._animate);
    const rawDt = Math.min(this.clock.getDelta(), 0.08);
    // Nubes siempre a la deriva
    if (this.clouds) for (const c of this.clouds) {
      c.position.x += rawDt * 0.25;
      if (c.position.x > 18) c.position.x = -18;
    }
    if (this.state === 'playing') {
      const dt = rawDt * this.speed;
      this.time += dt;
      this._updateSpawning(dt);
      this._updatePlants(dt);
      this._updateZombies(dt);
      this._updateProjectiles(dt);
      this._updateSuns(dt);
      this._updateMowers(dt);
      this._updateParticles(dt);
      this._updateCooldowns(dt);
    } else if (this.state !== 'idle') {
      this._updateParticles(rawDt);
    }
    this.renderer.render(this.scene, this.camera);
  }

  _updateSpawning(dt) {
    this.sunFallTimer -= dt;
    if (this.sunFallTimer <= 0) {
      this.sunFallTimer = 8 + Math.random() * 3;
      this._spawnSun(colX(Math.floor(Math.random() * COLS)), rowZ(Math.floor(Math.random() * ROWS)), true);
    }
    if (this.spawned >= this.totalZombies) {
      if (this.zombies.length === 0) this._win();
      return;
    }
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      const progress = this.spawned / this.totalZombies;
      // Oleadas masivas al 50% y al final
      if (!this.midWaveDone && progress >= 0.5) {
        this.midWaveDone = true;
        this.hooks.onStreak('🚩 ¡UNA OLEADA ENORME SE ACERCA!');
        SFX.wave();
        this._spawnZombie('flag');
        const burst = Math.min(4, this.totalZombies - this.spawned);
        for (let i = 0; i < burst; i++) this._spawnZombie(this._pickZombieType());
        this.spawnTimer = this.baseInterval * 1.6;
      } else if (!this.finalWaveDone && progress >= 0.86) {
        this.finalWaveDone = true;
        this.hooks.onStreak('☠️ ¡OLEADA FINAL!');
        SFX.wave();
        this._spawnZombie('flag');
        while (this.spawned < this.totalZombies) this._spawnZombie(this._pickZombieType());
      } else {
        this._spawnZombie(this._pickZombieType());
        this.spawnTimer = this.baseInterval * (0.75 + Math.random() * 0.5) * (1 - progress * 0.35);
      }
      this.hooks.onWave(this.spawned, this.totalZombies,
        this.finalWaveDone ? '☠️ ¡Oleada final!' : this.midWaveDone ? '🚩 Oleada enorme' : '🧟 Zombies atacando');
    }
  }

  _updatePlants(dt) {
    for (const p of this.plants) {
      // animación de aparición + balanceo
      p.spawnAnim = Math.min(p.spawnAnim + dt * 4, 1);
      const wob = 1 + Math.sin(this.time * 3 + p.c) * 0.02;
      p.mesh.scale.setScalar(p.spawnAnim * wob);
      if (p.mesh.userData.head) p.mesh.userData.head.rotation.z = Math.sin(this.time * 2 + p.r) * 0.06;

      if (p.type === 'sunny') {
        p.sunTimer -= dt;
        if (p.sunTimer <= 0) {
          p.sunTimer = 11 + Math.random() * 2;
          this._spawnSun(p.mesh.position.x + 0.3, p.mesh.position.z + 0.2, false);
        }
        continue;
      }
      if (!p.def.fireRate) continue;
      // ¿hay zombies en la fila por delante?
      const targets = this.zombies.filter(z => z.r === p.r && !z.dying && z.mesh.position.x > p.mesh.position.x - 0.2 && z.mesh.position.x < COLS / 2 + 2.2);
      if (!targets.length) continue;
      p.fireTimer -= dt;
      if (p.fireTimer <= 0) {
        p.fireTimer = p.def.fireRate;
        this._fire(p, targets);
      }
    }
  }

  _fire(plant, targets) {
    SFX.shoot();
    const kind = plant.type === 'frost' ? 'frost' : plant.type === 'boom' ? 'spore' : plant.type === 'corn' ? 'kernel' : 'pea';
    const mesh = makeProjectile(kind);
    const muzzle = plant.mesh.userData.muzzle || new THREE.Vector3(0.4, 0.7, 0);
    mesh.position.copy(plant.mesh.position).add(muzzle);
    this.scene.add(mesh);
    if (plant.type === 'boom') {
      // disparo en arco hacia el zombie más adelantado
      const target = targets.reduce((a, b) => a.mesh.position.x < b.mesh.position.x ? a : b);
      const from = mesh.position.clone();
      const to = target.mesh.position.clone().setY(0.4);
      to.x -= 0.2;
      this.projectiles.push({ mesh, kind, dmg: plant.def.dmg, aoe: plant.def.aoe, row: plant.r, arc: { from, to, t: 0, dur: 0.8 } });
    } else {
      this.projectiles.push({ mesh, kind, dmg: plant.def.dmg, slow: plant.def.slow, row: plant.r, vx: 7 });
      // retroceso del cañón
      if (plant.mesh.userData.head) {
        plant.mesh.userData.head.position.x = -0.08;
        setTimeout(() => { if (plant.mesh.userData.head) plant.mesh.userData.head.position.x = 0; }, 120);
      }
    }
  }

  _updateProjectiles(dt) {
    for (const pr of this.projectiles) {
      if (pr.arc) {
        pr.arc.t += dt / pr.arc.dur;
        const t = Math.min(pr.arc.t, 1);
        pr.mesh.position.lerpVectors(pr.arc.from, pr.arc.to, t);
        pr.mesh.position.y += Math.sin(t * Math.PI) * 1.6;
        if (t >= 1) { this._explode(pr); pr.dead = true; }
        continue;
      }
      pr.mesh.position.x += pr.vx * dt;
      pr.mesh.rotation.z -= dt * 8;
      if (pr.mesh.position.x > COLS / 2 + 2.5) { pr.dead = true; this.scene.remove(pr.mesh); continue; }
      for (const z of this.zombies) {
        if (z.dying || z.r !== pr.row) continue;
        if (Math.abs(z.mesh.position.x - pr.mesh.position.x) < 0.28) {
          this._damageZombie(z, pr.dmg);
          if (pr.slow) { z.slowUntil = this.time + 3; }
          if (pr.kind === 'kernel') z.mesh.position.x += 0.18; // retroceso
          SFX.hit();
          this._burst(pr.mesh.position, pr.kind === 'frost' ? 0x9adcff : pr.kind === 'kernel' ? 0xffd23d : 0x7ed348, 8);
          pr.dead = true;
          this.scene.remove(pr.mesh);
          break;
        }
      }
    }
    this.projectiles = this.projectiles.filter(p => !p.dead);
  }

  _explode(pr) {
    SFX.boom();
    this._burst(pr.mesh.position, 0xc07be8, 26);
    this._burst(pr.mesh.position, 0xff8c40, 16);
    for (const z of this.zombies) {
      if (z.dying) continue;
      if (z.mesh.position.distanceTo(pr.mesh.position) < pr.aoe) this._damageZombie(z, pr.dmg);
    }
    this.scene.remove(pr.mesh);
  }

  _damageZombie(z, dmg) {
    z.hp -= dmg;
    // pequeño temblor
    z.mesh.userData.anim.body.rotation.z = 0.15;
    setTimeout(() => { if (z.mesh.userData.anim) z.mesh.userData.anim.body.rotation.z = 0; }, 90);
    if (z.hp <= 0 && !z.dying) {
      z.dying = 0.0001;
      this.killed++;
      SFX.zombieDie();
      this._burst(z.mesh.position.clone().add(new THREE.Vector3(0, 0.8, 0)), 0x9db56e, 18);
    }
  }

  _updateZombies(dt) {
    for (const z of this.zombies) {
      if (z.dying) {
        z.dying += dt;
        z.mesh.rotation.z = Math.min(z.dying * 2.5, Math.PI / 2);
        z.mesh.position.y = -z.dying * 0.4;
        if (z.dying > 0.9) { this.scene.remove(z.mesh); z.remove = true; }
        continue;
      }
      const slowed = this.time < z.slowUntil;
      let speed = z.def.speed * (slowed ? 0.45 : 1);
      // el zombie con libro se enfurece al perder la mitad de su vida
      if (z.type === 'book' && z.hp < z.maxHp * 0.45) {
        speed *= 2;
        if (z.mesh.userData.book) { z.mesh.remove(z.mesh.userData.book); z.mesh.userData.book = null; }
      }
      // tinte azul si está congelado
      z.mesh.traverse(o => { if (o.material && o.material.color) o.material.emissive?.setHex(slowed ? 0x123a66 : 0x000000); });

      // ¿planta delante para comer?
      const c = Math.round(z.mesh.position.x + (COLS - 1) / 2);
      let eating = null;
      if (c >= 0 && c < COLS) {
        const plant = this.grid[z.r][c];
        if (plant && z.mesh.position.x - (colX(c)) < 0.42 && z.mesh.position.x > colX(c) - 0.1) eating = plant;
      }
      if (eating) {
        z.eatTimer = (z.eatTimer || 0) - dt;
        if (z.eatTimer <= 0) { z.eatTimer = 0.55; SFX.chomp(); this._burst(eating.mesh.position.clone().add(new THREE.Vector3(0, 0.5, 0)), 0x6a9a30, 5); }
        eating.hp -= z.def.dmg * dt;
        if (eating.hp <= 0) this._removePlant(eating);
        // mordida
        z.mesh.userData.anim.head.rotation.x = Math.sin(this.time * 14) * 0.2;
      } else {
        z.mesh.position.x -= speed * dt;
        const a = z.mesh.userData.anim;
        const t = this.time * 5 + z.phase;
        a.legL.rotation.z = Math.sin(t) * 0.5;
        a.legR.rotation.z = -Math.sin(t) * 0.5;
        a.armL.rotation.z = Math.sin(t * 0.7) * 0.12 - 0.05;
        a.armR.rotation.z = -Math.sin(t * 0.7) * 0.12 + 0.05;
        a.head.rotation.z = Math.sin(t * 0.5) * 0.08;
        z.mesh.position.y = Math.abs(Math.sin(t)) * 0.03;
      }

      // ¿llegó a la casa?
      if (z.mesh.position.x < -(COLS / 2) - 0.4) {
        const mower = this.mowers.find(m => m.row === z.r && !m.used);
        if (mower && !mower.active) {
          mower.active = true; mower.used = true;
          SFX.mower();
        } else if (!mower) {
          this._lose();
          return;
        }
      }
    }
    this.zombies = this.zombies.filter(z => !z.remove);
  }

  _updateMowers(dt) {
    for (const m of this.mowers) {
      if (!m.active) {
        m.mesh.position.y = 0.05 + Math.sin(this.time * 2 + m.row) * 0.04; // flota
        m.mesh.rotation.y = Math.sin(this.time + m.row) * 0.1;
        continue;
      }
      m.mesh.position.x += 7.5 * dt;
      m.mesh.rotation.y += dt * 10;
      for (const z of this.zombies) {
        if (!z.dying && z.r === m.row && Math.abs(z.mesh.position.x - m.mesh.position.x) < 0.5) {
          this._damageZombie(z, 9999);
        }
      }
      if (m.mesh.position.x > COLS / 2 + 3) { this.scene.remove(m.mesh); m.active = false; }
    }
  }

  _updateSuns(dt) {
    for (const s of this.suns) {
      s.t += dt;
      if (s.collected) {
        // vuela hacia el contador (arriba a la izquierda)
        s.mesh.position.lerp(new THREE.Vector3(-7, 7.5, -2), dt * 6);
        s.mesh.scale.multiplyScalar(1 - dt * 2.2);
        if (s.mesh.scale.x < 0.1) { this.scene.remove(s.mesh); s.remove = true; }
        continue;
      }
      if (s.mesh.position.y > s.targetY) s.mesh.position.y -= dt * (s.fromSky ? 1.1 : 2.2);
      s.mesh.rotation.z += dt * 1.5;
      s.mesh.scale.setScalar(1 + Math.sin(s.t * 4) * 0.07);
      s.life -= dt;
      if (s.life <= 0) {
        s.mesh.scale.multiplyScalar(1 - dt * 4);
        if (s.mesh.scale.x < 0.1) { this.scene.remove(s.mesh); s.remove = true; }
      }
    }
    this.suns = this.suns.filter(s => !s.remove);
  }

  _updateParticles(dt) {
    for (const p of this.particles) {
      p.life -= dt;
      const pos = p.points.geometry.attributes.position;
      for (let i = 0; i < p.vels.length; i++) {
        p.vels[i].y -= dt * 6;
        pos.array[i * 3] += p.vels[i].x * dt;
        pos.array[i * 3 + 1] += p.vels[i].y * dt;
        pos.array[i * 3 + 2] += p.vels[i].z * dt;
      }
      pos.needsUpdate = true;
      p.points.material.opacity = Math.max(p.life / p.maxLife, 0);
      if (p.life <= 0) { this.scene.remove(p.points); p.remove = true; }
    }
    this.particles = this.particles.filter(p => !p.remove);
  }

  _updateCooldowns(dt) {
    let changed = false;
    for (const c of this.cards) {
      if (c.cd > 0) { c.cd = Math.max(c.cd - dt, 0); changed = true; }
    }
    if (changed || this._lastSun !== this.sunAmount) this.hooks.onCards(this.cards);
    this._lastSun = this.sunAmount;
  }

  /* ============================ FIN ============================ */
  _win() {
    if (this.state !== 'playing') return;
    this.state = 'won';
    SFX.victory();
    const acc = this.quiz.accuracy;
    const stars = acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : 1;
    this.hooks.onEnd(true, {
      stars,
      accuracy: Math.round(acc * 100),
      asked: this.quiz.stats.asked,
      correct: this.quiz.stats.correct,
      bestStreak: this.quiz.stats.bestStreak,
      killed: this.killed,
    });
  }

  _lose() {
    if (this.state !== 'playing') return;
    this.state = 'lost';
    SFX.defeat();
    this.hooks.onEnd(false, {
      stars: 0,
      accuracy: Math.round(this.quiz.accuracy * 100),
      asked: this.quiz.stats.asked,
      correct: this.quiz.stats.correct,
      bestStreak: this.quiz.stats.bestStreak,
      killed: this.killed,
    });
  }

  pause() { if (this.state === 'playing') this.state = 'paused'; }
  resume() { if (this.state === 'paused') { this.state = 'playing'; this.clock.getDelta(); } }
  toggleSpeed() { this.speed = this.speed === 1 ? 2 : 1; return this.speed; }
}
