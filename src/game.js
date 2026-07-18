// English Defenders — 3D game engine (Teacher Esteban Yepes)
// Lane tower-defense + minigames. Characters are billboard sprites from the teacher's atlas.
import * as THREE from 'three';
import { makeBoardTexture, makeDirtTexture, makeStoneTexture, makeSkyTexture, makeGradientSky } from './textures.js';
import { makeVase } from './models.js';
import { makeBillboard, makeGlowSprite } from './sprites.js';
import { SFX } from './audio.js';

export const ROWS = 5, COLS = 9;
const colX = (c) => c - (COLS - 1) / 2;
const rowZ = (r) => r - (ROWS - 1) / 2;

// Los sprites del atlas ya miran hacia la derecha (hacia los zombies): sin flip.
// Prestigios por nivel CEFR: Basic (A1) → Silver (A2) → Golden (B1) → Platinum (B2) → Diamond (C1)
export const TIER_RANK = { basic: 0, silver: 1, golden: 2, platinum: 3, diamond: 4 };
export const PLANTS = {
  sunny:   { name: 'Sunny',        tier: 'basic',    sprite: 'plant_sunny',   h: 1.0,  cost: 50,  hp: 120,  cooldown: 6 },
  shooter: { name: 'Pea Scholar',  tier: 'basic',    sprite: 'plant_shooter', h: 0.95, cost: 100, hp: 120,  cooldown: 6,  fireRate: 1.5, dmg: 20 },
  nut:     { name: 'Tough Nut',    tier: 'basic',    sprite: 'plant_nut',     h: 0.88, cost: 50,  hp: 950,  cooldown: 18 },
  garlic:  { name: 'Garlic Guard', tier: 'silver',   sprite: 'plant_garlic',  h: 0.8,  cost: 25,  hp: 500,  cooldown: 9 },
  frost:   { name: 'Frost Berry',  tier: 'silver',   sprite: 'plant_frost',   h: 0.95, cost: 150, hp: 120,  cooldown: 8,  fireRate: 1.9, dmg: 15, slow: true },
  bush:    { name: 'Guard Bush',   tier: 'golden',   sprite: 'plant_bush',    h: 0.92, cost: 75,  hp: 1500, cooldown: 22 },
  boom:    { name: 'Boom Shroom',  tier: 'golden',   sprite: 'plant_boom',    h: 0.85, cost: 125, hp: 110,  cooldown: 14, fireRate: 3.0, dmg: 45, aoe: 1.15 },
  cactus:  { name: 'Spike Cactus', tier: 'platinum', sprite: 'plant_cactus',  h: 1.0,  cost: 125, hp: 140,  cooldown: 9,  fireRate: 1.2, dmg: 18, pierce: 3 },
  corn:    { name: 'Corn Cannon',  tier: 'platinum', sprite: 'plant_corn',    h: 0.98, cost: 175, hp: 130,  cooldown: 12, fireRate: 2.6, dmg: 60 },
  fire:    { name: 'Ember Torch',  tier: 'diamond',  sprite: 'plant_fire',    h: 0.9,  cost: 200, hp: 150,  cooldown: 14, fireRate: 2.0, dmg: 35, burn: 0.7 },
};

// ===== Escenarios (los 12 fondos del arte de referencia) =====
// Cada tema recolorea cielo, tablero, suelo, niebla e iluminación.
export const THEMES = {
  day:     { name: 'Suburban · Day',   emoji: '🏡', sky: [[0,'#78c4f0'],[.55,'#a8ddf5'],[.8,'#d8efc8'],[1,'#e8f5d8']], board:{l1:'#8fbf4d',l2:'#7cae3e',d1:'#77a83a',d2:'#699733',blade:'120,160,60'}, dirt:['#6e4f2a','#5a3f20'], fog:0xcfe8d8, hemiSky:0xeaf6ff, hemiGround:0x5a7a3a, hemiI:0.95, sun:0xfff2d8, sunI:2.0, backdrop:true },
  night:   { name: 'Suburban · Night', emoji: '🌙', sky: [[0,'#0b1836'],[.55,'#1c2c52'],[.85,'#26406a'],[1,'#33507a']], board:{l1:'#3d5a4a',l2:'#324c48',d1:'#2c4450',d2:'#25384a',blade:'80,120,90'}, dirt:['#2a3040','#20263a'], fog:0x223050, hemiSky:0x9fb6e8, hemiGround:0x24304a, hemiI:0.7, sun:0xbcccff, sunI:1.1, backdrop:true },
  ruins:   { name: 'Ancient Ruins',    emoji: '🏛️', sky: [[0,'#4a5a4a'],[.5,'#6a7358'],[1,'#8a8a66']], board:{l1:'#9aa080',l2:'#868c68',d1:'#7c8460',d2:'#6a7350',blade:'110,120,80'}, dirt:['#7a7458','#5f5a40'], fog:0x6a7358, hemiSky:0xcfe0c0, hemiGround:0x556040, hemiI:0.85, sun:0xffe6b0, sunI:1.5, backdrop:false },
  pirate:  { name: 'Pirate Ship',      emoji: '🏴‍☠️', sky: [[0,'#4aa0d8'],[.5,'#7ac0e8'],[1,'#c8e8f0']], board:{l1:'#b98a52',l2:'#a87a44',d1:'#9a6c3a',d2:'#8a5e30',blade:'150,110,60'}, dirt:['#5a4028','#432f1c'], fog:0x9ac0d8, hemiSky:0xd0eefb, hemiGround:0x6a5030, hemiI:1.0, sun:0xfff0d0, sunI:1.9, backdrop:false },
  desert:  { name: 'Desert Canyon',    emoji: '🏜️', sky: [[0,'#e8a860'],[.5,'#f0c890'],[1,'#f8e0b0']], board:{l1:'#e8c888',l2:'#dcb870',d1:'#d0a860',d2:'#c49850',blade:'180,140,80'}, dirt:['#c89858','#a87838'], fog:0xe0b878, hemiSky:0xfff0d0, hemiGround:0x9a6a30, hemiI:1.1, sun:0xffe0a0, sunI:2.1, backdrop:false },
  snow:    { name: 'Snowy Mountains',  emoji: '❄️', sky: [[0,'#a8d8f0'],[.5,'#d0ecf8'],[1,'#f0f8ff']], board:{l1:'#e8f2fb',l2:'#d6e8f5',d1:'#cfe2f0',d2:'#bcd6ea',blade:'150,180,210'}, dirt:['#cfe0ee','#b8cee0'], fog:0xdcecf5, hemiSky:0xffffff, hemiGround:0x9ab0c0, hemiI:1.1, sun:0xf0f6ff, sunI:1.9, backdrop:false },
  haunted: { name: 'Haunted Manor',    emoji: '👻', sky: [[0,'#1a1030'],[.5,'#2a1c48'],[1,'#432a5a']], board:{l1:'#6a5a8a',l2:'#5a4a78',d1:'#4e4068',d2:'#433658',blade:'130,110,160'}, dirt:['#332a48','#241c38'], fog:0x2a1c48, hemiSky:0x9a80c0, hemiGround:0x2a1c40, hemiI:0.7, sun:0xc0a0ff, sunI:1.1, backdrop:false },
  future:  { name: 'Future City',      emoji: '🌆', sky: [[0,'#0a1a3a'],[.5,'#12335a'],[1,'#1a5a8a']], board:{l1:'#2a5a7a',l2:'#22496a',d1:'#1e3f5e',d2:'#183450',blade:'90,220,240'}, dirt:['#20303f','#16232f'], fog:0x123a5a, hemiSky:0x8ad0ff, hemiGround:0x1a3a5a, hemiI:0.85, sun:0x90e0ff, sunI:1.4, backdrop:false },
  jungle:  { name: 'Jungle Temple',    emoji: '🌴', sky: [[0,'#3a7a4a'],[.5,'#6aa858'],[1,'#a8d090']], board:{l1:'#7ab85a',l2:'#68a848',d1:'#5c9a3e',d2:'#4e8a34',blade:'90,150,60'}, dirt:['#4a6a2a','#35501c'], fog:0x6aa858, hemiSky:0xd0f0c0, hemiGround:0x2a5a2a, hemiI:0.95, sun:0xf0ffd0, sunI:1.7, backdrop:false },
  beach:   { name: 'Beach Resort',     emoji: '🏖️', sky: [[0,'#4ab8e8'],[.5,'#9adcf0'],[1,'#f0e8c0']], board:{l1:'#f0dca0',l2:'#e8d090',d1:'#e0c47e',d2:'#d4b86e',blade:'200,170,110'}, dirt:['#e0c880','#c8ac60'], fog:0xbfe0e8, hemiSky:0xe0f8ff, hemiGround:0x9a8050, hemiI:1.1, sun:0xfff0d0, sunI:2.1, backdrop:false },
  volcano: { name: 'Volcano Island',   emoji: '🌋', sky: [[0,'#3a1810'],[.5,'#7a2a18'],[1,'#c04a20']], board:{l1:'#6a5a52',l2:'#5a4a44',d1:'#4e403a',d2:'#443632',blade:'200,90,40'}, dirt:['#4a2418','#331810'], fog:0x6a2a18, hemiSky:0xffb080, hemiGround:0x4a1a10, hemiI:0.8, sun:0xff9050, sunI:1.6, backdrop:false },
  magic:   { name: 'Magic Forest',     emoji: '🍄', sky: [[0,'#1a2a4a'],[.5,'#2a4a6a'],[1,'#3a6a7a']], board:{l1:'#4a8a8a',l2:'#3e7a7e',d1:'#366e74',d2:'#2e6068',blade:'120,240,210'}, dirt:['#2a4a4a','#1c3838'], fog:0x2a4a5a, hemiSky:0x90f0e0, hemiGround:0x2a4a4a, hemiI:0.9, sun:0xa0ffe0, sunI:1.4, backdrop:false },
};

const ZOMBIE_TYPES = {
  basic:    { sprite: 'zombie_basic',    h: 1.35, hp: 100, speed: 0.22, dmg: 28 },
  flag:     { sprite: 'zombie_flag',     h: 1.55, hp: 120, speed: 0.30, dmg: 28 },
  cone:     { sprite: 'zombie_cone',     h: 1.5,  hp: 210, speed: 0.22, dmg: 28 },
  book:     { sprite: 'zombie_book',     h: 1.35, hp: 170, speed: 0.24, dmg: 28 },
  bucket:   { sprite: 'zombie_bucket',   h: 1.5,  hp: 350, speed: 0.18, dmg: 28 },
  football: { sprite: 'zombie_football', h: 1.4,  hp: 310, speed: 0.40, dmg: 38 },
  balloon:  { sprite: 'zombie_basic',    h: 1.3,  hp: 90,  speed: 0.30, dmg: 28, flying: true, tint: 0xff8a8a },
  prof:     { sprite: 'zombie_prof',     h: 1.55, hp: 560, speed: 0.14, dmg: 48 },
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

    // cámara cercana pero con aire para que la interfaz no tape el tablero
    this.camera = new THREE.PerspectiveCamera(43, innerWidth / innerHeight, 0.1, 100);
    this._fitCamera();

    const hemi = new THREE.HemisphereLight(0xeaf6ff, 0x5a7a3a, 0.95);
    this.scene.add(hemi);
    this.hemi = hemi;
    const sun = new THREE.DirectionalLight(0xfff2d8, 2.0);
    sun.position.set(6, 12, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -9; sun.shadow.camera.right = 9;
    sun.shadow.camera.top = 8; sun.shadow.camera.bottom = -8;
    this.scene.add(sun);
    this.sunLight = sun;

    // el suelo termina detrás de la cerca para que el telón del pueblo asome en el horizonte
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 40),
      new THREE.MeshStandardMaterial({ map: makeDirtTexture(), roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.02, 13);
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.groundMesh = ground;

    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(COLS, ROWS),
      new THREE.MeshStandardMaterial({ map: makeBoardTexture(COLS, ROWS), roughness: 0.95 })
    );
    board.rotation.x = -Math.PI / 2;
    board.receiveShadow = true;
    this.scene.add(board);
    this.boardMesh = board;

    // cada pieza de piedra con su textura repetida según sus dimensiones (sin estiramientos)
    const stonePiece = (w, d, x, z, y = 0.01, h = 0.06) => {
      const mat = new THREE.MeshStandardMaterial({ map: makeStoneTexture([w / 1.15, d / 1.15]), roughness: 0.9 });
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      b.position.set(x, y, z);
      b.receiveShadow = true;
      this.scene.add(b);
    };
    stonePiece(2.4, ROWS + 2.2, COLS / 2 + 1.1, 0);            // camino de los zombies
    stonePiece(COLS + 1.6, 0.8, 0, -(ROWS / 2) - 0.4, 0.005, 0.055); // marco norte
    stonePiece(COLS + 1.6, 0.8, 0, ROWS / 2 + 0.4, 0.005, 0.055);    // marco sur
    stonePiece(0.8, ROWS + 2.2, -(COLS / 2) - 0.4, 0, 0.005, 0.055); // marco oeste

    // ===== Escenografía con los sprites del atlas =====
    // Telón de fondo: el pueblo del atlas detrás de la cerca
    new THREE.TextureLoader().load('assets/textures/backdrop.png', (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      // panorámica del pueblo dimensionada para la franja visible sobre la cerca
      const bd = new THREE.Mesh(
        new THREE.PlaneGeometry(25.3, 5.0),
        new THREE.MeshBasicMaterial({ map: t, fog: false, depthWrite: false })
      );
      bd.position.set(1.0, 2.25, -7.3);
      bd.renderOrder = -10;
      this.scene.add(bd);
      this.backdrop = bd;
      // los fondos pintados traen su propio horizonte, así que el telón queda oculto
      bd.visible = false;
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
      // sobre la tierra, fuera del marco de piedra
      const z = Math.random() < 0.5 ? -(ROWS / 2) - 1.15 - Math.random() * 0.25 : ROWS / 2 + 0.95 + Math.random() * 0.35;
      prop(name, 0.24 + Math.random() * 0.12, x, z, { shadow: false });
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
      this._fitCamera();
      this.renderer.setSize(innerWidth, innerHeight);
    });
    this.renderer.setSize(innerWidth, innerHeight);

    // aplica el escenario guardado (fondo/luces/tablero)
    this.setTheme(localStorage.getItem('ed:theme') || 'day');
  }

  // Encuadra el tablero según la proporción de pantalla: en móviles verticales
  // se aleja y sube para que las 5 filas queden visibles sobre la bandeja de cartas.
  _fitCamera() {
    const a = innerWidth / Math.max(innerHeight, 1);
    if (a < 0.7)       { this.camera.position.set(0.4, 9.6, 13.6); this.camera.fov = 55; }
    else if (a < 1.0)  { this.camera.position.set(0.5, 8.4, 11.8); this.camera.fov = 50; }
    else if (a < 1.35) { this.camera.position.set(0.55, 7.3, 10.4); this.camera.fov = 46; }
    else               { this.camera.position.set(0.55, 6.6, 9.3);  this.camera.fov = 43; }
    this.camera.aspect = a;
    this.camera.lookAt(0.4, 0.25, -0.55);
    this.camera.updateProjectionMatrix();
  }

  // Cambia el escenario: recolorea cielo, tablero, suelo, niebla y luces.
  setTheme(id) {
    const t = THEMES[id] ? id : 'day';
    this.themeId = t;
    const th = THEMES[t];
    localStorage.setItem('ed:theme', t);

    // fondo: el arte pintado del escenario, con el degradado como respaldo inmediato
    this.scene.background = makeGradientSky(th.sky);
    this._loadThemeBackground(t);
    if (this.scene.fog) this.scene.fog.color.set(th.fog);

    // el tema day respeta la textura del usuario (board.png/dirt.png); el resto es procedural
    const allowOverride = t === 'day';
    if (this.boardMesh) {
      this.boardMesh.material.map?.dispose?.();
      this.boardMesh.material.map = makeBoardTexture(COLS, ROWS, th.board, allowOverride);
      this.boardMesh.material.needsUpdate = true;
    }
    if (this.groundMesh) {
      this.groundMesh.material.map?.dispose?.();
      this.groundMesh.material.map = makeDirtTexture(th.dirt, allowOverride);
      this.groundMesh.material.needsUpdate = true;
    }
    if (this.hemi) { this.hemi.color.set(th.hemiSky); this.hemi.groundColor.set(th.hemiGround); this.hemi.intensity = th.hemiI; }
    if (this.sunLight) { this.sunLight.color.set(th.sun); this.sunLight.intensity = th.sunI; }
    // el fondo pintado ya trae su propio horizonte: ocultamos el telón del pueblo
    if (this.backdrop) this.backdrop.visible = false;
  }

  // Carga el fondo pintado del escenario y lo aplica cuando llega (cacheado).
  _loadThemeBackground(id) {
    this._bgCache = this._bgCache || {};
    const apply = (tex) => { if (this.themeId === id) this.scene.background = tex; };
    if (this._bgCache[id]) return apply(this._bgCache[id]);
    new THREE.TextureLoader().load(`assets/backgrounds/${id}.jpg`, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      this._bgCache[id] = tex;
      apply(tex);
    }, undefined, () => {});
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
    logo.position.y = 1.45;
    logo.scale.setScalar(0.88);
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
    t.position.set(0.4, 0.55, 1.2);
    this.titleGroup = t;
    this.scene.add(t);
  }

  setTitleVisible(v) { this.titleGroup.visible = v; }

  _updateTitle(dt) {
    this.menuT += dt;
    const t = this.menuT;
    this.titleLogo.position.y = 1.45 + Math.sin(t * 1.2) * 0.12;
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
      this.endless = !!cfg.endless;
      // Sistema de oleadas progresivas: la partida se compone de varias oleadas
      // con descanso entre ellas y dificultad creciente, para durar más.
      this.totalWaves = this.endless ? Infinity : Math.min(3 + Math.floor(cfg.stageIdx / 2) + cfg.levelIdx, 9);
      this.waveNum = 0;
      this.waveState = 'intro';   // intro → spawning → clearing → rest → spawning…
      this.waveTimer = 5;         // cuenta atrás a la primera oleada
      this.waveSpawned = 0;
      this.waveTotal = 0;
      this.spawnTimer = 0;
      this.baseInterval = Math.max(8.5 - D * 0.32, 3.2);
      this.sunFallTimer = 5;
      // catálogo por prestigio: el nivel CEFR fija el tier máximo; en las últimas
      // etapas del nivel se anticipa una carta del siguiente prestigio
      const maxTier = cfg.levelIdx + (cfg.stageIdx >= 10 ? 1 : 0);
      const list = Object.entries(PLANTS)
        .filter(([, d]) => TIER_RANK[d.tier] <= maxTier)
        .sort((a, b) => TIER_RANK[a[1].tier] - TIER_RANK[b[1].tier] || a[1].cost - b[1].cost)
        .map(([id]) => id);
      const revealed = Math.min(3 + cfg.stageIdx, list.length);
      this.cards = list.slice(0, revealed).map(id => ({ id, cd: 0 }));
      this.hooks.onWave(0, 1, 'Get ready! The zombies are coming…');
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
    if (D >= 3.5) pool.push({ t: 'balloon', w: 1.5 + D * 0.4 }); // vuela por encima de las plantas
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
    // sin carta seleccionada: tocar una planta existente intenta evolucionarla
    if (!this.selectedCard) {
      const cell = this._cellAt(e);
      if (cell && this.grid[cell.r][cell.c]) await this._tryEvolve(this.grid[cell.r][cell.c]);
      return;
    }
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
      // prestigio por planta: LVL1 (basic) → LVL2 (evolved) → LVL3 (max)
      level: 1, dmgMul: 1, rateMul: 1, multi: 1, slowDur: 3, sunMul: 1,
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

  // Coste de evolución de una planta según su nivel actual.
  evolveCost(plant) { return Math.round(plant.def.cost * (plant.level * 0.75 + 0.5)); }

  // Evoluciona una planta plantada: LVL1 → LVL2 (evolved) → LVL3 (max).
  async _tryEvolve(plant) {
    if (this.mode !== 'classic') return;
    if (plant.level >= 3) { this.hooks.onStreak(`⭐ ${plant.def.name} is MAX level!`); return; }
    const cost = this.evolveCost(plant);
    if (this.sunAmount < cost) { this.hooks.onStreak(`Need ☀️${cost} to evolve ${plant.def.name}`); return; }
    const res = await this._askQuestion();
    if (!res.correct) return;
    // la planta pudo ser comida mientras se respondía
    if (!this.plants.includes(plant) || plant.level >= 3) return;
    this.sunAmount -= cost;
    this.hooks.onSun(this.sunAmount);
    this._applyEvolve(plant);
    this._streakCheck();
  }

  _applyEvolve(plant) {
    plant.level++;
    plant.dmgMul *= 1.5;          // más daño
    plant.rateMul *= 0.82;        // dispara más rápido
    plant.multi = plant.level;    // LVL2 = doble, LVL3 = triple disparo
    plant.slowDur = 3 + (plant.level - 1) * 1.5; // congelación más larga
    plant.sunMul = plant.level;   // más soles (sunny)
    const heal = plant.maxHp * 0.7;
    plant.maxHp += heal; plant.hp += heal;        // más vida
    // brillo dorado (LVL2) / diamante (LVL3) sobre la planta
    plant.mesh.userData.mat.color.set(plant.level >= 3 ? 0xbfeaff : 0xfff0c0);
    if (!plant.evolveGlow) {
      const glow = makeGlowSprite(plant.level >= 3 ? 0x7ae0ff : 0xffd860, 1.3);
      glow.position.set(0, plant.def.h * 0.5, 0);
      plant.mesh.add(glow);
      plant.evolveGlow = glow;
    } else {
      plant.evolveGlow.material.color.set(plant.level >= 3 ? 0x7ae0ff : 0xffd860);
      plant.evolveGlow.scale.setScalar(1.3 + (plant.level - 2) * 0.5);
    }
    SFX.plant();
    this._burst(plant.mesh.position.clone().add(new THREE.Vector3(0, 0.7, 0)), plant.level >= 3 ? 0x7ae0ff : 0xffd860, 22);
    this._flash(plant.mesh.position.clone().add(new THREE.Vector3(0, 0.7, 0.1)), 'part_gold', 1.6);
    const tag = plant.level >= 3 ? 'MAX ⭐' : 'LVL 2 ⬆️';
    this.hooks.onStreak(`✨ ${plant.def.name} → ${tag}!`);
  }

  /* ============================ ZOMBIES ============================ */
  _spawnZombie(type, row = null, x = null) {
    const def = ZOMBIE_TYPES[type];
    const r = row ?? Math.floor(Math.random() * ROWS);
    const mesh = makeBillboard(def.sprite, def.h);
    mesh.position.set(x ?? (COLS / 2 + 1.2 + Math.random() * 0.6), 0, rowZ(r));
    this._face(mesh);
    if (def.tint) mesh.userData.mat.color.set(def.tint);
    // un pequeño globo sobre el zombie volador
    if (def.flying) {
      const balloon = makeGlowSprite(0xff5a5a, 1.0);
      balloon.position.set(0, def.h + 0.5, 0);
      mesh.add(balloon);
      mesh.userData.balloon = balloon;
    }
    this.scene.add(mesh);
    // destello del portal al entrar un zombie
    if (x === null) this._flash(new THREE.Vector3(COLS / 2 + 1.9, 0.9, rowZ(r) * 0.35), 'part_purple', 1.15);
    this.zombies.push({
      type, def, mesh, r, hp: def.hp, maxHp: def.hp, flying: !!def.flying,
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
    if (this.mode === 'bowling') return this._updateBowlingSpawn(dt);
    // ---- modo clásico: máquina de estados de oleadas ----
    this._updateWaves(dt);
  }

  // Spud Bowling conserva su flujo simple de aparición continua
  _updateBowlingSpawn(dt) {
    if (this.spawned >= this.totalZombies) {
      if (this.zombies.length === 0) this._win();
      return;
    }
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this._spawnZombie(this._pickZombieType());
      const progress = this.spawned / this.totalZombies;
      this.spawnTimer = this.baseInterval * (0.7 + Math.random() * 0.5) * (1 - progress * 0.3);
      this.hooks.onWave(this.spawned, this.totalZombies, '🥔 Roll spuds to crush the zombies!');
    }
  }

  _waveLabel() {
    const n = this.waveNum;
    const tot = this.endless ? '∞' : this.totalWaves;
    return `🌊 Wave ${n}/${tot}`;
  }

  _updateWaves(dt) {
    if (this.waveState === 'intro') {
      this.waveTimer -= dt;
      if (this.waveTimer <= 0) this._beginWave();
      return;
    }
    if (this.waveState === 'spawning') {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0 && this.waveSpawned < this.waveTotal) {
        // último zombie de la oleada lleva bandera
        const isLast = this.waveSpawned === this.waveTotal - 1 && this.waveNum > 1;
        this._spawnZombie(isLast ? 'flag' : this._pickZombieType());
        this.waveSpawned++;
        const frac = this.waveSpawned / this.waveTotal;
        this.spawnTimer = this.waveInterval * (0.7 + Math.random() * 0.5);
        this.hooks.onWave(frac, 1, `${this._waveLabel()} — 🧟 attacking`);
      }
      if (this.waveSpawned >= this.waveTotal) this.waveState = 'clearing';
      return;
    }
    if (this.waveState === 'clearing') {
      // espera a que caigan todos los zombies de la oleada
      if (this.zombies.some(z => !z.dying)) return;
      if (!this.endless && this.waveNum >= this.totalWaves) { this._win(); return; }
      // recompensa por limpiar la oleada y descanso
      this.sunAmount += 25;
      this.hooks.onSun(this.sunAmount);
      this.waveState = 'rest';
      this.waveTimer = 6;
      this.hooks.onStreak(`✅ Wave ${this.waveNum} cleared! +25 ☀️`);
      SFX.victory();
      this.hooks.onWave(1, 1, `😌 Rest… next wave soon`);
      return;
    }
    if (this.waveState === 'rest') {
      this.waveTimer -= dt;
      if (this.waveTimer <= 3.02 && this.waveTimer + dt > 3.02) this.hooks.onStreak('⚠️ Next wave in 3…');
      if (this.waveTimer <= 0) this._beginWave();
    }
  }

  _beginWave() {
    this.waveNum++;
    this.waveState = 'spawning';
    this.waveSpawned = 0;
    const boss = (!this.endless && this.waveNum === this.totalWaves);
    // Progresión suave: la 1ª oleada es muy ligera (pocos zombies básicos y lentos)
    // y la variedad/cantidad/ritmo crece oleada a oleada hasta la horda final.
    const D = this.difficulty * 0.6 + (this.waveNum - 1) * 0.9;
    this.zombiePool = this._buildZombiePool(D);
    // cantidad: arranca en ~3 y sube ~2 por oleada; la oleada final trae un aluvión extra
    this.waveTotal = Math.round(2.5 + this.waveNum * 1.9 + this.difficulty * 0.4 + (boss ? 7 : 0));
    // ritmo: primeras oleadas muy espaciadas (~4 s), las últimas casi seguidas
    this.waveInterval = Math.max(4.2 - this.waveNum * 0.22 - this.difficulty * 0.06, 1.1);
    this.spawnTimer = 0.6;
    this.hooks.onStreak(boss ? '☠️ FINAL HORDE!' : `🌊 Wave ${this.waveNum}!`);
    SFX.wave();
    this.hooks.onWave(0, 1, `${this._waveLabel()} — 🧟 attacking`);
  }

  _updatePlants(dt) {
    for (const p of this.plants) {
      p.spawnAnim = Math.min(p.spawnAnim + dt * 4, 1);
      p.recoil = Math.max(p.recoil - dt * 4, 0);
      const lvlScale = 1 + (p.level - 1) * 0.14; // las evoluciones crecen un poco
      const wob = (1 + Math.sin(this.time * 2.4 + p.phase) * 0.025 + p.recoil * 0.12) * lvlScale;
      p.mesh.scale.setScalar(p.spawnAnim * wob);
      p.mesh.userData.plane.rotation.z = Math.sin(this.time * 1.8 + p.phase) * 0.04;

      if (p.type === 'sunny') {
        if (this.mode !== 'classic') continue;
        p.sunTimer -= dt;
        if (p.sunTimer <= 0) {
          // evolucionada: produce soles más a menudo y de más valor
          p.sunTimer = (11 + Math.random() * 2) / (1 + (p.level - 1) * 0.55);
          this._spawnSun(p.mesh.position.x + 0.3, p.mesh.position.z + 0.2, false, 25 * p.sunMul);
        }
        continue;
      }
      if (!p.def.fireRate) continue;
      const targets = this.zombies.filter(z => z.r === p.r && !z.dying && z.mesh.position.x > p.mesh.position.x - 0.2 && z.mesh.position.x < COLS / 2 + 2.2);
      if (!targets.length) continue;
      p.fireTimer -= dt;
      if (p.fireTimer <= 0) {
        p.fireTimer = p.def.fireRate * p.rateMul; // evolución dispara más rápido
        this._fire(p, targets);
      }
    }
  }

  _fire(plant, targets) {
    SFX.shoot();
    plant.recoil = 1;
    const from = plant.mesh.position.clone().add(new THREE.Vector3(0.32, 0.55, 0));
    const dmg = (plant.def.dmg || 0) * plant.dmgMul;
    if (plant.type === 'boom') {
      const target = targets.reduce((a, b) => a.mesh.position.x < b.mesh.position.x ? a : b);
      const mesh = makeBillboard('fx_gas', 0.34, { shadow: false });
      mesh.position.copy(from);
      this._face(mesh);
      this.scene.add(mesh);
      const to = target.mesh.position.clone().setY(0.4);
      to.x -= 0.2;
      this.projectiles.push({ mesh, kind: 'spore', dmg, aoe: plant.def.aoe * (1 + (plant.level - 1) * 0.2), row: plant.r, arc: { from, to, t: 0, dur: 0.8 } });
    } else {
      const kind = plant.type === 'frost' ? 'frost' : plant.type === 'corn' ? 'kernel'
        : plant.type === 'cactus' ? 'spike' : plant.type === 'fire' ? 'flame' : 'pea';
      const sprite = kind === 'frost' ? 'fx_ice' : 'fx_pea';
      const h = kind === 'frost' ? 0.26 : kind === 'kernel' ? 0.26 : kind === 'flame' ? 0.24 : 0.2;
      // Evolución "double/triple shot": dispara una ráfaga escalonada de proyectiles.
      for (let i = 0; i < plant.multi; i++) {
        const mesh = makeBillboard(sprite, h, { shadow: false });
        if (kind === 'kernel') mesh.userData.mat.color.set(0xffe080);
        if (kind === 'spike') mesh.userData.mat.color.set(0xd8f890);
        if (kind === 'flame') mesh.userData.mat.color.set(0xff9040);
        mesh.position.copy(from);
        mesh.position.x -= i * 0.42; // el tren de disparos sale espaciado
        this._face(mesh);
        this.scene.add(mesh);
        this.projectiles.push({
          mesh, kind, dmg, slow: plant.def.slow, slowDur: plant.slowDur, row: plant.r, vx: 7,
          pierce: plant.def.pierce || 0, burn: plant.def.burn || 0, hitSet: plant.def.pierce ? new Set() : null,
        });
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
        if (pr.hitSet && pr.hitSet.has(z)) continue;
        if (Math.abs(z.mesh.position.x - pr.mesh.position.x) < 0.28) {
          this._damageZombie(z, pr.dmg);
          if (pr.slow) z.slowUntil = this.time + (pr.slowDur || 3);
          if (pr.kind === 'kernel') z.mesh.position.x += 0.18;
          SFX.hit();
          this._burst(pr.mesh.position, pr.kind === 'frost' ? 0x9adcff : pr.kind === 'kernel' ? 0xffd23d : pr.kind === 'flame' ? 0xff8c40 : 0x7ed348, 8);
          // Ember Torch: pequeña llamarada que quema a los vecinos
          if (pr.burn) {
            this._flash(pr.mesh.position, 'part_orange', 1.0);
            for (const o of this.zombies) {
              if (o !== z && !o.dying && o.mesh.position.distanceTo(pr.mesh.position) < pr.burn) this._damageZombie(o, pr.dmg * 0.5);
            }
          }
          // Spike Cactus: la espina atraviesa varios zombies
          if (pr.pierce > 0) {
            pr.pierce--;
            pr.hitSet.add(z);
            if (pr.pierce > 0) continue;
          }
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
      mat.color.set(z.flash > 0 ? 0xff9a8a : slowed ? 0x9ac8ff : (z.def.tint || 0xffffff));

      let speed = z.def.speed * (slowed ? 0.45 : 1);
      if (z.type === 'book' && z.hp < z.maxHp * 0.45) speed *= 2;

      const c = Math.round(z.mesh.position.x + (COLS - 1) / 2);
      let eating = null;
      // los zombies voladores pasan por encima de las plantas (no las comen)
      if (!z.flying && c >= 0 && c < COLS) {
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
        // los voladores flotan más alto y con vaivén suave
        z.mesh.position.y = z.flying ? 0.55 + Math.sin(t * 0.5) * 0.12 : Math.abs(Math.sin(t)) * 0.035;
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

  // fin por límite de tiempo (Class Mode): sobrevivir cuenta como victoria
  timeUp() { if (this.state === 'playing' || this.state === 'quiz') { this.quiz.hide(); this.state = 'playing'; this._win(); } }

  pause() { if (this.state === 'playing') this.state = 'paused'; }
  resume() { if (this.state === 'paused') { this.state = 'playing'; this.clock.getDelta(); } }
  toggleSpeed() { this.speed = this.speed === 1 ? 2 : 1; return this.speed; }
}
