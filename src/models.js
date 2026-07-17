// Modelos 3D cartoon construidos con primitivas — estilo del atlas "English Defenders".
import * as THREE from 'three';

const M = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0.02, ...opts });
const GEO = {
  sphere: new THREE.SphereGeometry(1, 20, 16),
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 16),
  cone: new THREE.ConeGeometry(1, 1, 14),
};

function mesh(geo, mat, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(geo, mat);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  return m;
}

function eyes(head, r, y, z, spread = 0.36, size = 0.13) {
  const eyeMat = M(0x1a1a1a, { roughness: 0.4 });
  const whiteMat = M(0xffffff, { roughness: 0.4 });
  for (const s of [-1, 1]) {
    const w = mesh(GEO.sphere, whiteMat, size * 1.5, size * 1.6, size * 0.9);
    w.position.set(s * spread * r, y, z);
    const p = mesh(GEO.sphere, eyeMat, size * 0.8, size * 0.9, size * 0.6);
    p.position.set(s * spread * r, y, z + size * 0.55);
    head.add(w, p);
  }
}

/* ============================== PLANTAS ============================== */

function stemAndLeaves(g, h = 0.42) {
  const green = M(0x3e9b28);
  const stem = mesh(GEO.cyl, green, 0.07, h, 0.07);
  stem.position.y = h / 2;
  g.add(stem);
  const leafMat = M(0x54b83a);
  for (const s of [-1, 1]) {
    const leaf = mesh(GEO.sphere, leafMat, 0.24, 0.06, 0.13);
    leaf.position.set(s * 0.18, 0.1, 0);
    leaf.rotation.z = s * -0.4;
    g.add(leaf);
  }
  return h;
}

function makeSunny() { // Girasol — genera soles
  const g = new THREE.Group();
  const top = stemAndLeaves(g);
  const head = new THREE.Group();
  head.position.y = top + 0.28;
  const face = mesh(GEO.sphere, M(0x8a5a2b), 0.3, 0.3, 0.22);
  head.add(face);
  const petalMat = M(0xffc93d, { emissive: 0x996b00, emissiveIntensity: 0.25 });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const p = mesh(GEO.sphere, petalMat, 0.12, 0.2, 0.05);
    p.position.set(Math.cos(a) * 0.34, Math.sin(a) * 0.34, -0.02);
    p.rotation.z = a + Math.PI / 2;
    head.add(p);
  }
  eyes(head, 1, 0.08, 0.2, 0.11, 0.16);
  g.add(head);
  g.userData.head = head;
  return g;
}

function makeShooter(frost = false) { // Lanzaguisantes / Baya de hielo
  const g = new THREE.Group();
  const top = stemAndLeaves(g);
  const head = new THREE.Group();
  head.position.y = top + 0.3;
  const color = frost ? 0x3d8fd4 : 0x4caf30;
  const body = mesh(GEO.sphere, M(color), 0.3, 0.3, 0.3);
  head.add(body);
  const snout = mesh(GEO.cyl, M(frost ? 0x2f78b8 : 0x3e9b28), 0.13, 0.3, 0.13);
  snout.rotation.z = Math.PI / 2;
  snout.position.set(0.3, 0.03, 0);
  head.add(snout);
  const lip = mesh(GEO.cyl, M(frost ? 0x26639a : 0x338020), 0.15, 0.08, 0.15);
  lip.rotation.z = Math.PI / 2;
  lip.position.set(0.44, 0.03, 0);
  head.add(lip);
  if (frost) { // cristales de hielo en la cabeza
    const ice = M(0xbfe8ff, { roughness: 0.25, emissive: 0x2a6a99, emissiveIntensity: 0.3 });
    for (let i = 0; i < 3; i++) {
      const c = mesh(GEO.cone, ice, 0.07, 0.22, 0.07);
      c.position.set(-0.12 + i * 0.11, 0.3, 0);
      c.rotation.z = (i - 1) * 0.35;
      head.add(c);
    }
  }
  eyes(head, 1, 0.13, 0.24, 0.14, 0.13);
  g.add(head);
  g.userData.head = head;
  g.userData.muzzle = new THREE.Vector3(0.5, top + 0.33, 0);
  return g;
}

function makeNut() { // Nuez defensora
  const g = new THREE.Group();
  const body = mesh(GEO.sphere, M(0xa87b3e), 0.36, 0.46, 0.34);
  body.position.y = 0.46;
  // vetas
  const dark = M(0x8a6230);
  for (let i = 0; i < 3; i++) {
    const line = mesh(GEO.sphere, dark, 0.37, 0.03, 0.35);
    line.position.y = 0.3 + i * 0.16;
    g.add(line);
  }
  g.add(body);
  const head = new THREE.Group();
  head.position.y = 0.55;
  eyes(head, 1, 0.05, 0.3, 0.13, 0.15);
  g.add(head);
  g.userData.head = body;
  return g;
}

function makeBoom() { // Hongo morado — bombas de área
  const g = new THREE.Group();
  const stem = mesh(GEO.cyl, M(0xe8ddc8), 0.14, 0.3, 0.14);
  stem.position.y = 0.15;
  g.add(stem);
  const head = new THREE.Group();
  head.position.y = 0.42;
  const cap = mesh(GEO.sphere, M(0x8e4ec6, { emissive: 0x3a1266, emissiveIntensity: 0.3 }), 0.32, 0.24, 0.32);
  head.add(cap);
  const spotMat = M(0xe8d8f8);
  for (let i = 0; i < 5; i++) {
    const a = i * 1.35;
    const s = mesh(GEO.sphere, spotMat, 0.06, 0.03, 0.06);
    s.position.set(Math.cos(a) * 0.18, 0.16 + Math.sin(i) * 0.03, Math.sin(a) * 0.18);
    head.add(s);
  }
  eyes(head, 1, -0.04, 0.28, 0.12, 0.13);
  g.add(head);
  g.userData.head = head;
  g.userData.muzzle = new THREE.Vector3(0, 0.6, 0);
  return g;
}

function makeCorn() { // Maíz — dispara fuerte y lento
  const g = new THREE.Group();
  const top = stemAndLeaves(g, 0.3);
  const head = new THREE.Group();
  head.position.y = top + 0.34;
  const cob = mesh(GEO.sphere, M(0xf2c437), 0.2, 0.38, 0.2);
  head.add(cob);
  const husk = M(0x5cb53c);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    const leaf = mesh(GEO.sphere, husk, 0.08, 0.3, 0.05);
    leaf.position.set(Math.cos(a) * 0.16, -0.12, Math.sin(a) * 0.16);
    leaf.rotation.z = Math.cos(a) * 0.5;
    leaf.rotation.x = -Math.sin(a) * 0.5;
    head.add(leaf);
  }
  // granos
  const kernel = M(0xffdd66);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
    const k = mesh(GEO.sphere, kernel, 0.045, 0.045, 0.02);
    k.position.set(-0.08 + c * 0.053, 0.05 + r * 0.09, 0.19);
    head.add(k);
  }
  eyes(head, 1, 0.24, 0.16, 0.35, 0.11);
  g.add(head);
  g.userData.head = head;
  g.userData.muzzle = new THREE.Vector3(0.35, top + 0.4, 0);
  return g;
}

export function makePlantModel(type) {
  switch (type) {
    case 'sunny': return makeSunny();
    case 'shooter': return makeShooter(false);
    case 'frost': return makeShooter(true);
    case 'nut': return makeNut();
    case 'boom': return makeBoom();
    case 'corn': return makeCorn();
  }
}

/* ============================== ZOMBIES ============================== */

export function makeZombieModel(type) {
  const g = new THREE.Group();
  const skin = M(0x9db56e);
  const suit = M(type === 'football' ? 0xb03a2e : type === 'prof' ? 0xe8e8e0 : 0x6e5a4a);
  const pants = M(0x4a4038);

  const body = mesh(GEO.box, suit, 0.34, 0.42, 0.22);
  body.position.y = 0.72;
  g.add(body);
  // corbata rasgada
  if (type === 'basic' || type === 'cone' || type === 'bucket') {
    const tie = mesh(GEO.box, M(0xa03030), 0.07, 0.22, 0.02);
    tie.position.set(0, 0.74, 0.12);
    g.add(tie);
  }

  const head = new THREE.Group();
  head.position.y = 1.08;
  const skull = mesh(GEO.sphere, skin, 0.19, 0.21, 0.19);
  head.add(skull);
  const jaw = mesh(GEO.box, skin, 0.16, 0.09, 0.12);
  jaw.position.set(0, -0.13, 0.05);
  head.add(jaw);
  eyes(head, 0.19, 0.04, 0.15, 0.45, 0.05);
  g.add(head);

  // brazos extendidos hacia adelante (marcha zombie) — el frente del zombie es -X
  const armL = new THREE.Group(), armR = new THREE.Group();
  for (const [arm, s] of [[armL, -1], [armR, 1]]) {
    arm.position.set(-0.05, 0.86, s * 0.2);
    const a = mesh(GEO.box, suit, 0.34, 0.09, 0.09);
    a.position.x = -0.17;
    const hand = mesh(GEO.sphere, skin, 0.06, 0.06, 0.06);
    hand.position.x = -0.36;
    arm.add(a, hand);
    g.add(arm);
  }

  const legL = new THREE.Group(), legR = new THREE.Group();
  for (const [leg, s] of [[legL, -1], [legR, 1]]) {
    leg.position.set(0, 0.5, s * 0.09);
    const l = mesh(GEO.box, pants, 0.12, 0.5, 0.12);
    l.position.y = -0.25;
    const shoe = mesh(GEO.box, M(0x2e2620), 0.2, 0.08, 0.13);
    shoe.position.set(-0.04, -0.5, 0);
    leg.add(l, shoe);
    g.add(leg);
  }

  // Accesorios por tipo
  if (type === 'cone') {
    const cone = mesh(GEO.cone, M(0xe07b28), 0.15, 0.3, 0.15);
    cone.position.y = 0.26;
    head.add(cone);
  } else if (type === 'bucket') {
    const b = mesh(GEO.cyl, M(0x9aa2a8, { metalness: 0.55, roughness: 0.35 }), 0.17, 0.26, 0.17);
    b.position.y = 0.22;
    head.add(b);
  } else if (type === 'book') {
    const book = mesh(GEO.box, M(0x3a6ea8), 0.06, 0.3, 0.24);
    book.position.set(-0.42, 0.85, 0);
    g.add(book);
    g.userData.book = book;
  } else if (type === 'flag') {
    const pole = mesh(GEO.cyl, M(0x6b4a1f), 0.02, 0.9, 0.02);
    pole.position.set(0.12, 1.1, 0.14);
    const flag = mesh(GEO.box, M(0xc03a2e, { side: THREE.DoubleSide }), 0.3, 0.2, 0.02);
    flag.position.set(0.24, 1.42, 0.14);
    g.add(pole, flag);
  } else if (type === 'football') {
    const helmet = mesh(GEO.sphere, M(0xc0392b, { roughness: 0.3 }), 0.22, 0.2, 0.22);
    helmet.position.y = 0.08;
    head.add(helmet);
    const guard = mesh(GEO.box, M(0xdddddd), 0.04, 0.05, 0.24);
    guard.position.set(-0.2, -0.02, 0);
    head.add(guard);
  } else if (type === 'prof') {
    const hair = mesh(GEO.sphere, M(0xd8d8d8), 0.21, 0.1, 0.21);
    hair.position.y = 0.15;
    head.add(hair);
    const glassesMat = M(0x222222);
    for (const s of [-1, 1]) {
      const lens = mesh(GEO.cyl, glassesMat, 0.06, 0.015, 0.06);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(s * 0.08, 0.03, 0.17);
      head.add(lens);
    }
    const brain = mesh(GEO.sphere, M(0xe89ab8), 0.1, 0.07, 0.1);
    brain.position.set(0, 0.2, 0);
    head.add(brain);
  }

  g.userData.anim = { head, armL, armR, legL, legR, body };
  g.rotation.y = 0; // camina hacia -X
  return g;
}

/* ============================== OTROS ============================== */

export function makeSunModel() {
  const g = new THREE.Group();
  const core = mesh(GEO.sphere, M(0xffd83d, { emissive: 0xffaa00, emissiveIntensity: 0.9, roughness: 0.3 }), 0.2, 0.2, 0.2);
  g.add(core);
  const ray = M(0xffe480, { emissive: 0xffc040, emissiveIntensity: 0.7, transparent: true, opacity: 0.9 });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const r = mesh(GEO.cone, ray, 0.05, 0.14, 0.05);
    r.position.set(Math.cos(a) * 0.28, Math.sin(a) * 0.28, 0);
    r.rotation.z = a - Math.PI / 2;
    g.add(r);
  }
  return g;
}

export function makeProjectile(kind) {
  let mat;
  if (kind === 'frost') mat = M(0x9adcff, { emissive: 0x3a9adc, emissiveIntensity: 0.8, roughness: 0.2 });
  else if (kind === 'spore') mat = M(0xc07be8, { emissive: 0x7a2ab8, emissiveIntensity: 0.7, roughness: 0.3 });
  else if (kind === 'kernel') mat = M(0xffd23d, { emissive: 0xcc8800, emissiveIntensity: 0.6, roughness: 0.3 });
  else mat = M(0x7ed348, { emissive: 0x2a7a10, emissiveIntensity: 0.55, roughness: 0.3 });
  const size = kind === 'spore' ? 0.14 : kind === 'kernel' ? 0.12 : 0.1;
  return mesh(GEO.sphere, mat, size, size, size);
}

export function makeMowerModel() { // Libro volador — última defensa
  const g = new THREE.Group();
  const cover = mesh(GEO.box, M(0x2e6da8, { roughness: 0.5 }), 0.34, 0.26, 0.42);
  cover.position.y = 0.3;
  const pages = mesh(GEO.box, M(0xf5efd8), 0.3, 0.2, 0.38);
  pages.position.set(0.03, 0.3, 0);
  g.add(cover, pages);
  eyes(g, 1, 0.42, 0.2, 0.1, 0.1);
  return g;
}

/* ============================== PROPS ============================== */

export function makeFence(width) {
  const g = new THREE.Group();
  const wood = M(0x8a5a2b);
  const rail1 = mesh(GEO.box, wood, width, 0.08, 0.05);
  rail1.position.y = 0.45;
  const rail2 = rail1.clone();
  rail2.position.y = 0.72;
  g.add(rail1, rail2);
  const n = Math.round(width / 0.55);
  for (let i = 0; i <= n; i++) {
    const post = mesh(GEO.box, wood, 0.1, 0.95, 0.06);
    post.position.set(-width / 2 + (i / n) * width, 0.47, 0);
    const tip = mesh(GEO.cone, wood, 0.07, 0.12, 0.05);
    tip.position.set(post.position.x, 1.0, 0);
    g.add(post, tip);
  }
  return g;
}

export function makeHouse() {
  const g = new THREE.Group();
  const wall = mesh(GEO.box, M(0xd8c8a8), 2.2, 1.9, 3.2);
  wall.position.y = 0.95;
  g.add(wall);
  const roof = mesh(GEO.cone, M(0x8a4030), 2.1, 1.2, 2.6);
  roof.position.y = 2.5;
  roof.rotation.y = Math.PI / 4;
  g.add(roof);
  const door = mesh(GEO.box, M(0x6b4a1f), 0.1, 0.9, 0.6);
  door.position.set(1.1, 0.5, 0);
  g.add(door);
  const winMat = M(0x9adcff, { emissive: 0x446688, emissiveIntensity: 0.4 });
  for (const z of [-1, 1]) {
    const win = mesh(GEO.box, winMat, 0.06, 0.45, 0.45);
    win.position.set(1.12, 1.25, z);
    g.add(win);
  }
  return g;
}

export function makeTree(scale = 1) {
  const g = new THREE.Group();
  const trunk = mesh(GEO.cyl, M(0x6b4a1f), 0.14, 0.9, 0.14);
  trunk.position.y = 0.45;
  g.add(trunk);
  const leafMat = M(0x4a8f2e);
  const blobs = [[0, 1.2, 0, 0.5], [0.3, 1.0, 0.1, 0.35], [-0.3, 1.05, -0.05, 0.38], [0, 1.5, 0, 0.34]];
  for (const [x, y, z, s] of blobs) {
    const b = mesh(GEO.sphere, leafMat, s, s * 0.85, s);
    b.position.set(x, y, z);
    g.add(b);
  }
  g.scale.setScalar(scale);
  return g;
}

export function makeRock(scale = 1) {
  const r = mesh(GEO.sphere, M(0x8d8d85), 0.3, 0.22, 0.26);
  r.position.y = 0.1;
  r.rotation.y = Math.random() * 3;
  r.scale.multiplyScalar(scale);
  return r;
}

export function makeGraveSign() { // cartel "LEARN!" al lado de spawn
  const g = new THREE.Group();
  const post = mesh(GEO.box, M(0x6b4a1f), 0.08, 0.7, 0.08);
  post.position.y = 0.35;
  const board = mesh(GEO.box, M(0x8a5a2b), 0.7, 0.35, 0.06);
  board.position.y = 0.75;
  g.add(post, board);
  return g;
}
