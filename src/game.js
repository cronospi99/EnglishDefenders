// English Defenders — 3D game engine (Teacher Esteban Yepes)
// Lane tower-defense + minigames. Characters are billboard sprites from the teacher's atlas.
import * as THREE from 'three';
import { makeBoardTexture, makeDirtTexture, makeStoneTexture, makeSkyTexture } from './textures.js';
import { makeVase } from './models.js';
import { makeBillboard, makeGlowSprite } from './sprites.js';
import { SFX } from './audio.js';

export const ROWS = 5, COLS = 9;
const colX = (c) => c - (COLS - 1) / 2;
const rowZ = (r) => r - (ROWS - 1) / 2;

// Los sprites del atlas ya miran hacia la derecha (hacia los zombies): sin flip.
export const PLANTS = {
  sunny:   { name: 'Sunny',       sprite: 'plant_sunny',   h: 0.82, cost: 50,  hp: 120, cooldown: 6 },
  shooter: { name: 'Pea Scholar', sprite: 'plant_shooter', h: 0.78, cost: 100, hp: 120, cooldown: 6,  fireRate: 1.5, dmg: 20 },
  nut:     { name: 'Tough Nut',   sprite: 'plant_nut',     h: 0.74, cost: 50,  hp: 950, cooldown: 18 },
  frost:   { name: 'Frost Berry', sprite: 'plant_frost',   h: 0.78, cost: 150, hp: 120, cooldown: 8,  fireRate: 1.9, dmg: 15, slow: true },
  boom:    { name: 'Boom Shroom', sprite: 'plant_boom',    h: 0.72, cost: 125, hp: 110, cooldown: 14, fireRate: 3.0, dmg: 45, aoe: 1.15 },
  corn:    { name: 'Corn Cannon', sprite: 'plant_corn',    h: 0.8,  cost: 175, hp: 130, cooldown: 12, fireRate: 2.6, dmg: 60 },
};

const ZOMBIE_TYPES = {
  basic:    { sprite: 'zombie_basic',    h: 1.1,  hp: 100, speed: 0.22, dmg: 28 },
  flag:     { sprite: 'zombie_flag',     h: 1.28, hp: 120, speed: 0.30, dmg: 28 },
  cone:     { sprite: 'zombie_cone',     h: 1.22, hp: 210, speed: 0.22, dmg: 28 },
  book:     { sprite: 'zombie_book',     h: 1.1,  hp: 170, speed: 0.24, dmg: 28 },
  bucket:   { sprite: 'zombie_bucket',   h: 1.26, hp: 350, speed: 0.18, dmg: 28 },
  football: { sprite: 'zombie_football', h: 1.16, hp: 310, speed: 0.40, dmg: 38 },
  prof:     { sprite: 'zombie_prof',     h: 1.3,  hp: 560, speed: 0.14, dmg: 48 },
};

export class Game {
  constructor(canvas, quiz, hooks) {
    this.canvas = canvas;
    this.quiz = quiz;
    this.hooks = hooks; // { onSun, onWave, onEnd, onCards, onStreak, onAmmo }
    this.state = 'idle';
    this.mode = 'classic';
    this.speed = 1;
    this._initScene();
    this._buildTitle();
    this._bindInput();
    this.clock = new THREE.Clock();
    this.menuT = 0;
    this._animate = this._animate.bind(this);
    requestAnimationFrame(this._animate);
  }

  /* ============================ SCENE ============================ */
  _initScene() {
    // algunos equipos fallan con antialias: reintenta sin él
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    } catch {
      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, powerPreference: 'low-power' });
    }
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

    // el suelo termina detrás de la cerca para que el telón del pueblo asome en el horizonte
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 40),
      new THREE.MeshStandardMaterial({ map: makeDirtTexture(), roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.02, 13);
    ground.receiveShadow = true;
    this.scene.add(ground);

    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(COLS, ROWS),
      new THREE.MeshStandardMaterial({ map: makeBoardTexture(COLS, ROWS), roughness: 0.95 })
    );
    board.rotation.x = -Math.PI / 2;
    board.receiveShadow = true;
    this.scene.add(board);
    this.boardMesh = board;

    const path = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.06, ROWS + 0.6),
      new THREE.MeshStandardMaterial({ map: makeStoneTexture(), roughness: 0.9 })
    );
    path.position.set(COLS / 2 + 1.1, 0.01, 0);
    path.receiveShadow = true;
    this.scene.add(path);

    // ===== Escenografía con los sprites del atlas =====
    // Telón de fondo: el pueblo del atlas detrás de la cerca
    new THREE.TextureLoader().load('assets/textures/backdrop.png', (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      const bd = new THREE.Mesh(
        new THREE.PlaneGeometry(34, 20.5),
        new THREE.MeshBasicMaterial({ map: t, fog: false, depthWrite: false })
      );
      // telón vertical justo donde termina el suelo: llena el horizonte
      bd.position.set(1.5, 3.4, -7.3);
      bd.renderOrder = -10;
      this.scene.add(bd);
    }, undefined, () => {});

    const prop = (name, h, x, z, opts = {}) => {
      const b = makeBillboard(name, h, opts);
      b.position.set(x, 0, z);
      this._face(b);
      this.scene.add(b);
      return b;
    };
    // cerca de madera del atlas a lo largo del fondo
    for (let i = 0; i < 12; i++) prop('prop_fence', 0.85, -6.5 + i * 1.22, -(ROWS / 2) - 0.85);
    // casa del pueblo a la izquierda
    prop('prop_house', 3.4, -(COLS / 2) - 2.7, -1.2);
    // árboles y rocas del atlas
    prop('prop_tree', 2.5, -6.6, -3.9);
    prop('prop_tree', 2.2, 7.8, -3.6);
    prop('prop_tree', 2.0, 3.4, -4.3);
    prop('prop_rocks', 0.8, 7.2, 2.9);
    prop('prop_rocks', 0.6, -5.7, 3.2);
    // portal por donde llegan los zombies
    const portal = prop('door_portal', 2.0, COLS / 2 + 2.15, 0, { shadow: false });
    this.portal = portal;
    // props del pueblo
    prop('prop_mailbox', 0.85, -(COLS / 2) - 1.5, 1.9);
    prop('prop_lantern', 1.25, COLS / 2 + 0.4, -(ROWS / 2) - 0.6);
    prop('prop_lantern', 1.25, COLS / 2 + 0.4, ROWS / 2 + 0.7);
    prop('prop_barrel', 0.72, -(COLS / 2) - 1.9, -2.6);
    prop('prop_crate', 0.62, -(COLS / 2) - 2.5, -3.1);
    prop('prop_bench', 0.7, 1.2, -(ROWS / 2) - 1.5);
    prop('prop_signpost', 1.0, COLS / 2 + 1.3, ROWS / 2 + 0.9);
    prop('sign_levels', 1.25, -(COLS / 2) - 0.9, ROWS / 2 + 1.1);
    prop('deco_board', 1.15, -(COLS / 2) - 2.2, 2.9);
    prop('deco_gnome', 0.65, -(COLS / 2) - 0.6, 2.6);
    prop('deco_planter', 0.55, -3.3, -(ROWS / 2) - 0.62);
    prop('deco_balloons', 1.0, 5.2, -(ROWS / 2) - 0.9);
    prop('prop_hydrant', 0.55, 6.6, ROWS / 2 + 0.55);
    // detalles de vegetación en los bordes del jardín
    const details = ['detail_grass', 'detail_flower', 'detail_flowers2', 'detail_mushrooms', 'detail_plant', 'detail_bush'];
    for (let i = 0; i < 16; i++) {
      const name = details[i % details.length];
      const x = -(COLS / 2) + Math.random() * COLS;
      const z = Math.random() < 0.5 ? -(ROWS / 2) - 0.25 - Math.random() * 0.3 : ROWS / 2 + 0.25 + Math.random() * 0.3;
      prop(name, 0.22 + Math.random() * 0.12, x, z, { shadow: false });
    }

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

    // resaltado de casilla
    const hl = new THREE.Mesh(
      new THREE.PlaneGeometry(0.96, 0.96),
      new THREE.MeshBasicMaterial({ color: 0xfff2a0, transparent: true, opacity: 0.35 })
    );
    hl.rotation.x = -Math.PI / 2;
    hl.position.y = 0.02;
    hl.visible = false;
    this.scene.add(hl);
    this.highlight = hl;

    // resaltado de fila (bolos)
    const rh = new THREE.Mesh(
      new THREE.PlaneGeometry(COLS, 0.96),
      new THREE.MeshBasicMaterial({ color: 0xfff2a0, transparent: true, opacity: 0.22 })
    );
    rh.rotation.x = -Math.PI / 2;
    rh.position.y = 0.02;
    rh.visible = false;
    this.scene.add(rh);
    this.rowHighlight = rh;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    addEventListener('resize', () => {
      this.camera.aspect = innerWidth / innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(innerWidth, innerHeight);
    });
    this.renderer.setSize(innerWidth, innerHeight);
  }

  /* ============================ 3D TITLE ============================ */
  _buildTitle() {
    const t = new THREE.Group();
    // Logo con extrusión 3D: capas apiladas en profundidad, más oscuras hacia atrás
    const logo = new THREE.Group();
    const LAYERS = 9;
    for (let i = LAYERS - 1; i >= 0; i--) {
      const layer = makeBillboard('logo', 2.3, { shadow: false });
      const p = layer.userData.plane;
      p.position.z = -i * 0.035;
      p.position.y = 1.15 - i * 0.008;
      const shade = 1 - (i / LAYERS) * 0.72;
      layer.userData.mat.color.setScalar(shade);
      layer.position.y = 0;
      logo.add(p);
    }
    logo.position.y = 1.7;
    t.add(logo);
    this.titleLogo = logo;
    this.titleLogo.userData.plane = logo.children[logo.children.length - 1];

    const glow1 = makeGlowSprite(0xffd870, 6.5);
    glow1.position.set(0, 2.8, -0.4);
    const glow2 = makeGlowSprite(0x9adc60, 8.5);
    glow2.position.set(0, 2.8, -0.6);
    glow2.material.opacity = 0.55;
    t.add(glow2, glow1);
    this.titleGlows = [glow1, glow2];

    // anillos de chispas doradas
    this.sparkles = [];
    for (const [n, color, r0] of [[42, 0xffe080, 3.2], [30, 0xfff8d0, 2.4]]) {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(n * 3);
      const meta = [];
      for (let i = 0; i < n; i++) {
        meta.push({ a: Math.random() * Math.PI * 2, r: r0 + Math.random() * 0.8, y: 1.6 + Math.random() * 2.4, sp: 0.15 + Math.random() * 0.3, tw: Math.random() * 6 });
        pos.set([0, 0, 0], i * 3);
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({ color, size: 0.09, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
      const points = new THREE.Points(geo, mat);
      t.add(points);
      this.sparkles.push({ points, meta });
    }
    t.position.set(0.4, 1.25, 1.2);
    this.titleGroup = t;
    this.scene.add(t);
  }

  setTitleVisible(v) { this.titleGroup.visible = v; }

  _updateTitle(dt) {
    this.menuT += dt;
    const t = this.menuT;
    this.titleLogo.position.y = 1.7 + Math.sin(t * 1.2) * 0.12;
    this.titleLogo.rotation.z = Math.sin(t * 0.8) * 0.03;
    // giro suave para lucir la profundidad de la extrusión
    this.titleLogo.rotation.y = Math.sin(t * 0.5) * 0.22;
    this.titleGlows[0].material.opacity = 0.5 + Math.sin(t * 2.1) * 0.25;
    this.titleGlows[1].material.opacity = 0.3 + Math.sin(t * 1.4 + 2) * 0.18;
    for (const s of this.sparkles) {
      const pos = s.points.geometry.attributes.position;
      for (let i = 0; i < s.meta.length; i++) {
        const m = s.meta[i];
        m.a += dt * m.sp;
        pos.array[i * 3] = Math.cos(m.a) * m.r;
        pos.array[i * 3 + 1] = m.y + Math.sin(t * 1.5 + m.tw) * 0.15;
        pos.array[i * 3 + 2] = Math.sin(m.a) * m.r * 0.35;
      }
      pos.needsUpdate = true;
      s.points.material.opacity = 0.55 + Math.sin(t * 3 + s.meta[0].tw) * 0.35;
    }
  }

  // orienta un billboard hacia la cámara (sólo giro Y)
  _face(g) {
    g.rotation.y = Math.atan2(this.camera.position.x - g.position.x, this.camera.position.z - g.position.z) * 0.35;
  }

  /* ============================ STAGE ============================ */
  startStage(cfg) {
    // cfg: { level, levelIdx, unit, stageIdx, mode: 'classic'|'vase'|'bowling' }
    this.cfg = cfg;
    this.mode = cfg.mode || 'classic';
    this._clearEntities();
    this.setTitleVisible(false);
    this.sunAmount = this.mode === 'classic' ? 150 : 0;
    this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    this.plants = []; this.zombies = []; this.projectiles = []; this.suns = [];
    this.particles = []; this.flashes = []; this.mowers = []; this.vases = [];
    this.selectedCard = null; this.shovelMode = false;
    this.time = 0;
    this.killed = 0;
    this.speed = 1;
    this.midWaveDone = false; this.finalWaveDone = false;
    this.ammo = 0;

    for (let r = 0; r < ROWS; r++) {
      const m = makeBillboard('icon_book', 0.55);
      m.position.set(-(COLS / 2) - 0.7, 0.05, rowZ(r));
      this._face(m);
      this.scene.add(m);
      this.mowers.push({ mesh: m, row: r, active: false, used: false });
    }

    const D = cfg.levelIdx * 2.2 + cfg.stageIdx * 0.55;
    this.difficulty = D;
    this.zombiePool = this._buildZombiePool(D);

    if (this.mode === 'classic') {
      this.totalZombies = Math.min(14 + Math.round(cfg.stageIdx * 1.6 + cfg.levelIdx * 5), 48);
      this.spawned = 0;
      this.spawnTimer = 7;
      this.baseInterval = Math.max(8.5 - D * 0.32, 3.2);
      this.sunFallTimer = 5;
      const cards = ['sunny', 'shooter', 'nut'];
      if (cfg.stageIdx >= 1 || cfg.levelIdx >= 1) cards.push('frost');
      if (cfg.stageIdx >= 3 || cfg.levelIdx >= 2) cards.push('boom');
      if (cfg.stageIdx >= 5 || cfg.levelIdx >= 3) cards.push('corn');
      this.cards = cards.map(id => ({ id, cd: 0 }));
      this.hooks.onWave(0, this.totalZombies, 'Get ready! The zombies are coming…');
    } else if (this.mode === 'vase') {
      this.cards = [];
      this.totalZombies = 0; this.spawned = 0;
      const cells = [];
      for (let r = 0; r < ROWS; r++) for (let c = 3; c < COLS; c++) cells.push([r, c]);
      for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
      const nVases = 16;
      for (const [r, c] of cells.slice(0, nVases)) {
        const mesh = makeVase();
        mesh.position.set(colX(c), 0, rowZ(r));
        mesh.rotation.y = Math.random() * 6;
        this.scene.add(mesh);
        this.vases.push({ mesh, r, c });
      }
      this.hooks.onWave(0, nVases, '🏺 Break the vases… if you dare!');
    } else if (this.mode === 'bowling') {
      this.cards = [];
      this.ammo = 4;
      this.totalZombies = Math.min(18 + cfg.levelIdx * 5, 40);
      this.spawned = 0;
      this.spawnTimer = 4;
      this.baseInterval = Math.max(6.0 - D * 0.28, 2.6);
      this.hooks.onAmmo(this.ammo);
      this.hooks.onWave(0, this.totalZombies, '🥔 Roll spuds to crush the zombies!');
    }

    this.hooks.onCards(this.cards);
    this.hooks.onSun(this.sunAmount);
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
    for (const arr of [this.plants, this.zombies, this.projectiles, this.suns, this.vases])
      for (const e of arr) this.scene.remove(e.mesh);
    for (const p of this.particles) this.scene.remove(p.points);
    for (const f of this.flashes) this.scene.remove(f.mesh);
    for (const m of this.mowers) this.scene.remove(m.mesh);
  }

  quitToMenu() {
    this.state = 'idle';
    this._clearEntities();
    this.plants = []; this.zombies = []; this.projectiles = []; this.suns = [];
    this.particles = []; this.flashes = []; this.mowers = []; this.vases = [];
    this.setTitleVisible(true);
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
    if (this.state !== 'playing') { this.highlight.visible = false; this.rowHighlight.visible = false; return; }
    if (this.mode === 'bowling') {
      const cell = this._cellAt(e);
      this.rowHighlight.visible = !!cell && this.ammo > 0;
      if (cell) this.rowHighlight.position.set(0, 0.02, rowZ(cell.r));
      return;
    }
    if (this.mode === 'vase') {
      this.highlight.visible = false;
      return;
    }
    if (!this.selectedCard && !this.shovelMode) { this.highlight.visible = false; return; }
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
    this._ray(e);

    // soles primero (todos los modos)
    const sunMeshes = this.suns.filter(s => !s.collected).map(s => s.mesh);
    const hitSun = this.raycaster.intersectObjects(sunMeshes, true)[0];
    if (hitSun) {
      let obj = hitSun.object;
      while (obj.parent && !this.suns.some(s => s.mesh === obj)) obj = obj.parent;
      const sun = this.suns.find(s => s.mesh === obj);
      if (sun) { this._collectSun(sun); return; }
    }

    if (this.mode === 'vase') return this._clickVase(e);
    if (this.mode === 'bowling') return this._clickBowl(e);

    // ----- modo clásico -----
    if (this.shovelMode) {
      const cell = this._cellAt(e);
      if (cell && this.grid[cell.r][cell.c]) {
        this._removePlant(this.grid[cell.r][cell.c]);
        SFX.shovel();
      }
      this.setShovel(false);
      return;
    }
    if (!this.selectedCard) return;
    const cell = this._cellAt(e);
    if (!cell || this.grid[cell.r][cell.c]) return;
    const card = this.cards.find(c => c.id === this.selectedCard);
    const def = PLANTS[card.id];
    if (card.cd > 0 || this.sunAmount < def.cost) return;

    const res = await this._askQuestion();
    if (res.correct) {
      this.sunAmount -= def.cost;
      card.cd = def.cooldown;
      this._placePlant(card.id, cell.r, cell.c);
      this.hooks.onSun(this.sunAmount);
      this._streakCheck();
    } else {
      card.cd = 2.5;
    }
    this.selectCard(null);
    this.hooks.onCards(this.cards);
  }

  async _askQuestion() {
    this.state = 'quiz';
    this.highlight.visible = false;
    this.rowHighlight.visible = false;
    const res = await this.quiz.ask();
    this.state = 'playing';
    this.clock.getDelta();
    return res;
  }

  _streakCheck() {
    const st = this.quiz.stats.streak;
    if (st > 0 && st % 3 === 0) {
      if (this.mode === 'classic') {
        this.sunAmount += 50;
        this.hooks.onSun(this.sunAmount);
        this.hooks.onStreak(`🔥 Streak x${st}! +50 ☀️`);
      } else if (this.mode === 'bowling') {
        this.ammo += 1;
        this.hooks.onAmmo(this.ammo);
        this.hooks.onStreak(`🔥 Streak x${st}! +1 🥔`);
      } else {
        this.hooks.onStreak(`🔥 Streak x${st}! Amazing!`);
      }
      SFX.streak();
    }
  }

  /* ---------- vase breaker ---------- */
  async _clickVase(e) {
    const hit = this.raycaster.intersectObjects(this.vases.map(v => v.mesh), true)[0];
    if (!hit) return;
    let obj = hit.object;
    while (obj.parent && !this.vases.some(v => v.mesh === obj)) obj = obj.parent;
    const vase = this.vases.find(v => v.mesh === obj);
    if (!vase) return;

    const res = await this._askQuestion();
    // el jarrón se rompe siempre; el contenido depende de la respuesta
    this.vases = this.vases.filter(v => v !== vase);
    this.scene.remove(vase.mesh);
    SFX.shovel();
    this._burst(new THREE.Vector3(colX(vase.c), 0.5, rowZ(vase.r)), 0xb06a3a, 20);

    if (!res.correct) {
      this._spawnZombie(this._pickZombieType(), vase.r, colX(vase.c));
      this.hooks.onStreak('🧟 A zombie was hiding inside!');
    } else {
      this._streakCheck();
      const roll = Math.random();
      if (roll < 0.2) {
        this._spawnZombie(this._pickZombieType(), vase.r, colX(vase.c));
        this.hooks.onStreak('🧟 Oh no… zombie anyway!');
      } else if (roll < 0.35) {
        // cofre: un libro barre esa fila
        this.hooks.onStreak('📖 Treasure! A book sweeps the lane!');
        SFX.mower();
        this._flash(new THREE.Vector3(colX(vase.c), 0.6, rowZ(vase.r)), 'part_gold', 1.6);
        this._launchBook(vase.r);
      } else {
        const pool = ['shooter', 'shooter', 'frost', 'nut', 'boom', 'corn'];
        const type = pool[Math.floor(Math.random() * pool.length)];
        this._placePlant(type, vase.r, vase.c);
        this.hooks.onStreak(`🌱 Free ${PLANTS[type].name}!`);
      }
    }
    this.hooks.onWave(16 - this.vases.length, 16, `🏺 ${this.vases.length} vases left`);
  }

  _launchBook(row) {
    const m = makeBillboard('icon_book', 0.55);
    m.position.set(-(COLS / 2) - 0.4, 0.05, rowZ(row));
    this.scene.add(m);
    this.mowers.push({ mesh: m, row, active: true, used: true, extra: true });
  }

  /* ---------- bowling ---------- */
  _clickBowl(e) {
    const cell = this._cellAt(e);
    if (!cell || this.ammo <= 0) return;
    this.ammo--;
    this.hooks.onAmmo(this.ammo);
    SFX.shoot();
    const mesh = makeBillboard('plant_nut', 0.5);
    mesh.position.set(-(COLS / 2) - 0.3, 0, rowZ(cell.r));
    this._face(mesh);
    this.scene.add(mesh);
    this.projectiles.push({ mesh, kind: 'potato', row: cell.r, vx: 5, dmg: 240, targetZ: rowZ(cell.r) });
  }

  async askForAmmo() {
    if (this.state !== 'playing' || this.mode !== 'bowling') return false;
    const res = await this._askQuestion();
    if (res.correct) {
      this.ammo += 2;
      this.hooks.onAmmo(this.ammo);
      this._streakCheck();
      return true;
    }
    return false;
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

  /* ============================ PLANTS ============================ */
  _placePlant(type, r, c) {
    if (this.grid[r][c]) return;
    const def = PLANTS[type];
    const mesh = makeBillboard(def.sprite, def.h, { flip: def.flip });
    mesh.position.set(colX(c), 0, rowZ(r));
    this._face(mesh);
    mesh.scale.setScalar(0.01);
    this.scene.add(mesh);
    const plant = {
      type, def, mesh, r, c, hp: def.hp, maxHp: def.hp,
      fireTimer: 1 + Math.random() * 0.5, sunTimer: 7 + Math.random() * 3,
      spawnAnim: 0, phase: Math.random() * 6, recoil: 0,
    };
    this.grid[r][c] = plant;
    this.plants.push(plant);
    SFX.plant();
    this._burst(mesh.position.clone().add(new THREE.Vector3(0, 0.5, 0)), 0x9adc60, 14);
    this._flash(mesh.position.clone().add(new THREE.Vector3(0, 0.55, 0.1)), 'part_green', 1.1);
  }

  _removePlant(plant) {
    this.grid[plant.r][plant.c] = null;
    this.plants = this.plants.filter(p => p !== plant);
    this.scene.remove(plant.mesh);
    this._burst(plant.mesh.position.clone().add(new THREE.Vector3(0, 0.4, 0)), 0x8a5a2b, 10);
  }

  /* ============================ ZOMBIES ============================ */
  _spawnZombie(type, row = null, x = null) {
    const def = ZOMBIE_TYPES[type];
    const r = row ?? Math.floor(Math.random() * ROWS);
    const mesh = makeBillboard(def.sprite, def.h);
    mesh.position.set(x ?? (COLS / 2 + 1.2 + Math.random() * 0.6), 0, rowZ(r));
    this._face(mesh);
    this.scene.add(mesh);
    this.zombies.push({
      type, def, mesh, r, hp: def.hp, maxHp: def.hp,
      slowUntil: 0, dying: 0, phase: Math.random() * 6, flash: 0,
    });
    this.spawned++;
  }

  /* ============================ SUNS ============================ */
  _spawnSun(x, z, fromSky, value = 25) {
    const mesh = makeBillboard('fx_sun', 0.5, { shadow: false });
    const glow = makeGlowSprite(0xffd850, 1.1);
    glow.position.y = 0.25;
    mesh.add(glow);
    mesh.position.set(x, fromSky ? 8 : 0.6, z);
    this._face(mesh);
    this.scene.add(mesh);
    this.suns.push({ mesh, value, targetY: 0.35, fromSky, life: 12, collected: false, t: 0 });
  }

  _collectSun(sun) {
    if (sun.collected) return;
    sun.collected = true;
    SFX.sun();
    this.sunAmount += sun.value;
    this.hooks.onSun(this.sunAmount);
  }

  /* ============================ FX ============================ */
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

  _flash(pos, sprite = 'fx_boom', maxScale = 2) {
    const mesh = makeBillboard(sprite, 1, { shadow: false });
    mesh.position.copy(pos);
    mesh.position.y = Math.max(pos.y - 0.4, 0);
    this._face(mesh);
    mesh.scale.setScalar(0.3);
    this.scene.add(mesh);
    this.flashes.push({ mesh, t: 0, maxScale });
  }

  /* ============================ LOOP ============================ */
  _animate() {
    requestAnimationFrame(this._animate);
    const rawDt = Math.min(this.clock.getDelta(), 0.08);
    this.worldT = (this.worldT || 0) + rawDt;
    if (this.clouds) for (const c of this.clouds) {
      c.position.x += rawDt * 0.25;
      if (c.position.x > 18) c.position.x = -18;
    }
    if (this.portal) {
      this.portal.scale.setScalar(1 + Math.sin(this.worldT * 1.8) * 0.035);
      this.portal.userData.mat.color.setScalar(0.92 + Math.sin(this.worldT * 3.1) * 0.08);
    }
    if (this.titleGroup.visible) this._updateTitle(rawDt);
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
      this._updateFlashes(dt);
      this._updateCooldowns(dt);
    } else if (this.state !== 'idle') {
      this._updateParticles(rawDt);
      this._updateFlashes(rawDt);
    }
    this.renderer.render(this.scene, this.camera);
  }

  _updateSpawning(dt) {
    if (this.mode === 'classic') {
      this.sunFallTimer -= dt;
      if (this.sunFallTimer <= 0) {
        this.sunFallTimer = 8 + Math.random() * 3;
        this._spawnSun(colX(Math.floor(Math.random() * COLS)), rowZ(Math.floor(Math.random() * ROWS)), true);
      }
    }
    if (this.mode === 'vase') {
      if (this.vases.length === 0 && this.zombies.length === 0) this._win();
      return;
    }
    if (this.spawned >= this.totalZombies) {
      if (this.zombies.length === 0) this._win();
      return;
    }
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      const progress = this.spawned / this.totalZombies;
      if (this.mode === 'classic' && !this.midWaveDone && progress >= 0.5) {
        this.midWaveDone = true;
        this.hooks.onStreak('🚩 A HUGE WAVE IS COMING!');
        SFX.wave();
        this._spawnZombie('flag');
        const burst = Math.min(4, this.totalZombies - this.spawned);
        for (let i = 0; i < burst; i++) this._spawnZombie(this._pickZombieType());
        this.spawnTimer = this.baseInterval * 1.6;
      } else if (this.mode === 'classic' && !this.finalWaveDone && progress >= 0.86) {
        this.finalWaveDone = true;
        this.hooks.onStreak('☠️ FINAL WAVE!');
        SFX.wave();
        this._spawnZombie('flag');
        while (this.spawned < this.totalZombies) this._spawnZombie(this._pickZombieType());
      } else {
        this._spawnZombie(this._pickZombieType());
        this.spawnTimer = this.baseInterval * (0.75 + Math.random() * 0.5) * (1 - progress * 0.35);
      }
      this.hooks.onWave(this.spawned, this.totalZombies,
        this.finalWaveDone ? '☠️ Final wave!' : this.midWaveDone ? '🚩 Huge wave' : '🧟 Zombies attacking');
    }
  }

  _updatePlants(dt) {
    for (const p of this.plants) {
      p.spawnAnim = Math.min(p.spawnAnim + dt * 4, 1);
      p.recoil = Math.max(p.recoil - dt * 4, 0);
      const wob = 1 + Math.sin(this.time * 2.4 + p.phase) * 0.025 + p.recoil * 0.12;
      p.mesh.scale.setScalar(p.spawnAnim * wob);
      p.mesh.userData.plane.rotation.z = Math.sin(this.time * 1.8 + p.phase) * 0.04;

      if (p.type === 'sunny') {
        if (this.mode !== 'classic') continue;
        p.sunTimer -= dt;
        if (p.sunTimer <= 0) {
          p.sunTimer = 11 + Math.random() * 2;
          this._spawnSun(p.mesh.position.x + 0.3, p.mesh.position.z + 0.2, false);
        }
        continue;
      }
      if (!p.def.fireRate) continue;
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
    plant.recoil = 1;
    const from = plant.mesh.position.clone().add(new THREE.Vector3(0.32, 0.55, 0));
    if (plant.type === 'boom') {
      const target = targets.reduce((a, b) => a.mesh.position.x < b.mesh.position.x ? a : b);
      const mesh = makeBillboard('fx_gas', 0.34, { shadow: false });
      mesh.position.copy(from);
      this._face(mesh);
      this.scene.add(mesh);
      const to = target.mesh.position.clone().setY(0.4);
      to.x -= 0.2;
      this.projectiles.push({ mesh, kind: 'spore', dmg: plant.def.dmg, aoe: plant.def.aoe, row: plant.r, arc: { from, to, t: 0, dur: 0.8 } });
    } else {
      const kind = plant.type === 'frost' ? 'frost' : plant.type === 'corn' ? 'kernel' : 'pea';
      const sprite = kind === 'frost' ? 'fx_ice' : 'fx_pea';
      const h = kind === 'frost' ? 0.26 : kind === 'kernel' ? 0.26 : 0.2;
      const mesh = makeBillboard(sprite, h, { shadow: false });
      if (kind === 'kernel') mesh.userData.mat.color.set(0xffe080);
      mesh.position.copy(from);
      this._face(mesh);
      this.scene.add(mesh);
      this.projectiles.push({ mesh, kind, dmg: plant.def.dmg, slow: plant.def.slow, row: plant.r, vx: 7 });
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
      if (pr.kind === 'potato') {
        pr.mesh.position.x += pr.vx * dt;
        pr.mesh.position.z += (pr.targetZ - pr.mesh.position.z) * Math.min(dt * 6, 1);
        pr.mesh.userData.plane.rotation.z -= dt * 9;
        if (pr.mesh.position.x > COLS / 2 + 2) { pr.dead = true; this.scene.remove(pr.mesh); continue; }
        for (const z of this.zombies) {
          if (z.dying || z.r !== pr.row) continue;
          if (Math.abs(z.mesh.position.x - pr.mesh.position.x) < 0.35 && !(pr.lastHit === z)) {
            pr.lastHit = z;
            this._damageZombie(z, pr.dmg);
            SFX.hit();
            this._burst(pr.mesh.position.clone().add(new THREE.Vector3(0, 0.3, 0)), 0xd8b45a, 12);
            // rebota a la fila vecina
            const dir = pr.row === 0 ? 1 : pr.row === ROWS - 1 ? -1 : (Math.random() < 0.5 ? -1 : 1);
            pr.row += dir;
            pr.targetZ = rowZ(pr.row);
            break;
          }
        }
        continue;
      }
      pr.mesh.position.x += pr.vx * dt;
      if (pr.kind !== 'pea') pr.mesh.userData.plane.rotation.z -= dt * 6;
      if (pr.mesh.position.x > COLS / 2 + 2.5) { pr.dead = true; this.scene.remove(pr.mesh); continue; }
      for (const z of this.zombies) {
        if (z.dying || z.r !== pr.row) continue;
        if (Math.abs(z.mesh.position.x - pr.mesh.position.x) < 0.28) {
          this._damageZombie(z, pr.dmg);
          if (pr.slow) z.slowUntil = this.time + 3;
          if (pr.kind === 'kernel') z.mesh.position.x += 0.18;
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
    this._flash(pr.mesh.position, 'fx_boom', 2.2);
    this._burst(pr.mesh.position, 0xc07be8, 22);
    for (const z of this.zombies) {
      if (z.dying) continue;
      if (z.mesh.position.distanceTo(pr.mesh.position) < pr.aoe) this._damageZombie(z, pr.dmg);
    }
    this.scene.remove(pr.mesh);
  }

  _damageZombie(z, dmg) {
    z.hp -= dmg;
    z.flash = 0.1;
    if (z.hp <= 0 && !z.dying) {
      z.dying = 0.0001;
      this.killed++;
      SFX.zombieDie();
      this._burst(z.mesh.position.clone().add(new THREE.Vector3(0, 0.8, 0)), 0x9db56e, 18);
      this._flash(z.mesh.position.clone().add(new THREE.Vector3(0, 0.7, 0.1)), 'part_purple', 1.2);
    }
  }

  _updateZombies(dt) {
    // gemidos ambientales aleatorios mientras haya zombies vivos
    this.groanTimer = (this.groanTimer ?? 4) - dt;
    if (this.groanTimer <= 0) {
      this.groanTimer = 5 + Math.random() * 8;
      if (this.zombies.some(z => !z.dying)) SFX.groan();
    }
    for (const z of this.zombies) {
      const plane = z.mesh.userData.plane;
      const mat = z.mesh.userData.mat;
      if (z.dying) {
        z.dying += dt;
        plane.rotation.z = Math.min(z.dying * 2.2, Math.PI / 2 - 0.2);
        mat.opacity = Math.max(1 - z.dying * 1.1, 0);
        mat.transparent = true;
        if (z.dying > 0.9) { this.scene.remove(z.mesh); z.remove = true; }
        continue;
      }
      z.flash = Math.max(z.flash - dt, 0);
      const slowed = this.time < z.slowUntil;
      mat.color.set(z.flash > 0 ? 0xff9a8a : slowed ? 0x9ac8ff : 0xffffff);

      let speed = z.def.speed * (slowed ? 0.45 : 1);
      if (z.type === 'book' && z.hp < z.maxHp * 0.45) speed *= 2;

      const c = Math.round(z.mesh.position.x + (COLS - 1) / 2);
      let eating = null;
      if (c >= 0 && c < COLS) {
        const plant = this.grid[z.r][c];
        if (plant && z.mesh.position.x - colX(c) < 0.42 && z.mesh.position.x > colX(c) - 0.1) eating = plant;
      }
      if (eating) {
        z.eatTimer = (z.eatTimer || 0) - dt;
        if (z.eatTimer <= 0) {
          z.eatTimer = 0.55;
          SFX.chomp();
          this._burst(eating.mesh.position.clone().add(new THREE.Vector3(0, 0.5, 0)), 0x6a9a30, 5);
        }
        eating.hp -= z.def.dmg * dt;
        if (eating.hp <= 0) this._removePlant(eating);
        plane.rotation.z = Math.sin(this.time * 13) * 0.09;
      } else {
        z.mesh.position.x -= speed * dt;
        const t = this.time * 4.6 + z.phase;
        plane.rotation.z = Math.sin(t) * 0.07;
        z.mesh.position.y = Math.abs(Math.sin(t)) * 0.035;
        this._face(z.mesh);
      }

      if (z.mesh.position.x < -(COLS / 2) - 0.4) {
        const mower = this.mowers.find(m => m.row === z.r && !m.used);
        if (mower && !mower.active) {
          mower.active = true; mower.used = true;
          SFX.mower();
        } else if (!mower && !this.mowers.some(m => m.row === z.r && m.active)) {
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
        if (m.used) continue;
        m.mesh.position.y = 0.06 + Math.sin(this.time * 2 + m.row) * 0.045;
        m.mesh.userData.plane.rotation.z = Math.sin(this.time * 1.5 + m.row) * 0.12;
        continue;
      }
      m.mesh.position.x += 7.5 * dt;
      m.mesh.position.y = 0.15 + Math.abs(Math.sin(this.time * 14)) * 0.12;
      m.mesh.userData.plane.rotation.z -= dt * 4;
      for (const z of this.zombies) {
        if (!z.dying && z.r === m.row && Math.abs(z.mesh.position.x - m.mesh.position.x) < 0.5) {
          this._damageZombie(z, 9999);
        }
      }
      if (m.mesh.position.x > COLS / 2 + 3) {
        this.scene.remove(m.mesh);
        m.active = false;
        if (m.extra) this.mowers = this.mowers.filter(x => x !== m);
      }
    }
  }

  _updateSuns(dt) {
    for (const s of this.suns) {
      s.t += dt;
      if (s.collected) {
        s.mesh.position.lerp(new THREE.Vector3(-7, 7.5, -2), dt * 6);
        s.mesh.scale.multiplyScalar(1 - dt * 2.2);
        if (s.mesh.scale.x < 0.1) { this.scene.remove(s.mesh); s.remove = true; }
        continue;
      }
      if (s.mesh.position.y > s.targetY) s.mesh.position.y -= dt * (s.fromSky ? 1.1 : 2.2);
      s.mesh.userData.plane.rotation.z += dt * 1.2;
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

  _updateFlashes(dt) {
    for (const f of this.flashes) {
      f.t += dt * 2.6;
      const s = 0.3 + (f.maxScale - 0.3) * Math.min(f.t, 1);
      f.mesh.scale.setScalar(s);
      f.mesh.userData.mat.opacity = Math.max(1 - f.t, 0);
      f.mesh.userData.mat.transparent = true;
      if (f.t >= 1) { this.scene.remove(f.mesh); f.remove = true; }
    }
    this.flashes = this.flashes.filter(f => !f.remove);
  }

  _updateCooldowns(dt) {
    let changed = false;
    for (const c of this.cards) {
      if (c.cd > 0) { c.cd = Math.max(c.cd - dt, 0); changed = true; }
    }
    if (changed || this._lastSun !== this.sunAmount) this.hooks.onCards(this.cards);
    this._lastSun = this.sunAmount;
  }

  /* ============================ END ============================ */
  _endStats(stars) {
    return {
      stars,
      accuracy: Math.round(this.quiz.accuracy * 100),
      asked: this.quiz.stats.asked,
      correct: this.quiz.stats.correct,
      bestStreak: this.quiz.stats.bestStreak,
      killed: this.killed,
    };
  }

  _win() {
    if (this.state !== 'playing') return;
    this.state = 'won';
    SFX.victory();
    const acc = this.quiz.accuracy;
    const stars = acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : 1;
    this.hooks.onEnd(true, this._endStats(stars));
  }

  _lose() {
    if (this.state !== 'playing') return;
    this.state = 'lost';
    SFX.defeat();
    this.hooks.onEnd(false, this._endStats(0));
  }

  pause() { if (this.state === 'playing') this.state = 'paused'; }
  resume() { if (this.state === 'paused') { this.state = 'playing'; this.clock.getDelta(); } }
  toggleSpeed() { this.speed = this.speed === 1 ? 2 : 1; return this.speed; }
}
