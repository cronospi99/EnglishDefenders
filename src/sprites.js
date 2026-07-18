// Gestor de sprites: carga los recortes del atlas del profe y crea billboards 3D.
import * as THREE from 'three';

const NAMES = [
  'plant_peashooter', 'plant_sunflower', 'plant_tallnut', 'plant_repeater', 'plant_icepea',
  'plant_garlic', 'plant_cabbage', 'plant_firepea', 'plant_spikeweed', 'plant_chili',
  'plant_bloomshroom', 'plant_magnet', 'plant_electricpea', 'plant_laserbean', 'plant_wintermelon',
  'zombie_basic', 'zombie_cone', 'zombie_bucket', 'zombie_book', 'zombie_flag', 'zombie_football', 'zombie_prof', 'zombie_balloon',
  'fx_pea', 'fx_sun', 'fx_ice', 'fx_gas', 'fx_boom',
  'coin', 'diamond', 'chest', 'star', 'logo',
  'icon_book', 'icon_vocab', 'icon_listen', 'icon_write', 'icon_speak', 'icon_think',
  'prop_house', 'prop_fence', 'prop_flag', 'prop_tree', 'prop_rocks', 'prop_signpost', 'prop_mailbox',
  'prop_crate', 'prop_barrel', 'prop_lantern', 'prop_bench', 'prop_hydrant', 'prop_vending', 'prop_trash', 'prop_cone',
  'deco_zhead', 'deco_balloons', 'deco_board', 'deco_gnome', 'deco_planter',
  'sign_this', 'sign_levels', 'sign_grammar', 'sign_vocab', 'sign_phrasal',
  'door_portal', 'door_arch', 'door_gold',
  'detail_grass', 'detail_plant', 'detail_rocks', 'detail_flower', 'detail_bush', 'detail_flowers2', 'detail_mushrooms',
  'part_purple', 'part_gold', 'part_green', 'part_orange',
];

const cache = {}; // name -> { tex, aspect }
let shadowTex = null;

export function preloadSprites() {
  const loader = new THREE.TextureLoader();
  return Promise.all(NAMES.map(name => new Promise((res) => {
    loader.load(`assets/sprites/${name}.png`, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      cache[name] = { tex, aspect: tex.image.width / tex.image.height };
      res();
    }, undefined, () => { cache[name] = null; res(); }); // tolerante a faltantes
  })));
}

export function spriteURL(name) { return `assets/sprites/${name}.png`; }

function getShadowTex() {
  if (shadowTex) return shadowTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  g.addColorStop(0, 'rgba(10,20,5,0.45)');
  g.addColorStop(1, 'rgba(10,20,5,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  shadowTex = new THREE.CanvasTexture(c);
  return shadowTex;
}

// Billboard vertical (gira sólo en Y hacia la cámara). userData.plane para animaciones.
export function makeBillboard(name, height, { flip = false, shadow = true, emissive = 0 } = {}) {
  const g = new THREE.Group();
  const entry = cache[name];
  const aspect = entry ? entry.aspect : 1;
  const mat = new THREE.MeshBasicMaterial({
    map: entry ? entry.tex : null,
    transparent: true,
    alphaTest: 0.02,
    depthWrite: false,
    side: THREE.DoubleSide,
    color: 0xffffff,
  });
  if (!entry) mat.color.set(0xff00ff);
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(height * aspect, height), mat);
  plane.position.y = height / 2;
  if (flip) plane.scale.x = -1;
  g.add(plane);
  if (shadow) {
    const sh = new THREE.Mesh(
      new THREE.PlaneGeometry(height * aspect * 0.85, height * aspect * 0.5),
      new THREE.MeshBasicMaterial({ map: getShadowTex(), transparent: true, depthWrite: false })
    );
    sh.rotation.x = -Math.PI / 2;
    sh.position.y = 0.015;
    g.add(sh);
  }
  g.userData.plane = plane;
  g.userData.mat = mat;
  g.userData.h = height;
  return g;
}

// Sprite plano siempre de cara a la cámara (para brillos y efectos)
export function makeGlowSprite(color = 0xffd870, size = 2) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const col = new THREE.Color(color);
  const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
  g.addColorStop(0, `rgba(${col.r * 255 | 0},${col.g * 255 | 0},${col.b * 255 | 0},0.9)`);
  g.addColorStop(0.4, `rgba(${col.r * 255 | 0},${col.g * 255 | 0},${col.b * 255 | 0},0.25)`);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const s = new THREE.Sprite(mat);
  s.scale.setScalar(size);
  return s;
}
