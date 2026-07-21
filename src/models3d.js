// Carga e instancia de modelos 3D (GLB): zombies animados (Kenney), casa, castillo
// y kit de naturaleza (Ultimate Stylized Nature Pack). Todo es tolerante a fallos:
// si un GLB no carga, el juego sigue con la escenografía de sprites de siempre.
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/jsm/loaders/GLTFLoader.js';
import { clone as skeletonClone } from '../vendor/jsm/utils/SkeletonUtils.js';

const loader = new GLTFLoader();
const A = {}; // assets cargados: { zombieBody, walkClip, house, castle, nature }
let ready = false;

function load(url) {
  return new Promise((res) => {
    loader.load(url, (g) => res(g), undefined, (e) => { console.warn('GLB no cargó:', url, e?.message || e); res(null); });
  });
}

// Mide el bounding box REAL de un objeto. Clave: hay que actualizar las matrices
// del mundo antes de medir; si no, los modelos con escala interna grande (p. ej. los
// skinned meshes de Kenney, exportados con geometría diminuta y un nodo raíz que la
// agranda) devuelven un tamaño equivocado y quedan escalados a casi cero.
const _measScene = new THREE.Scene();
function measureBox(obj) {
  const prevParent = obj.parent;
  _measScene.add(obj);
  _measScene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  _measScene.remove(obj);
  if (prevParent) prevParent.add(obj);
  return box;
}

// Normaliza un modelo estático (no animado): lo centra en el suelo (y=0) y lo escala
// a una altura objetivo. Devuelve { obj, size }.
function groundAndScale(obj, targetHeight) {
  const size = new THREE.Vector3(); measureBox(obj).getSize(size);
  obj.scale.multiplyScalar(targetHeight / (size.y || 1));
  const box2 = measureBox(obj);
  const c = new THREE.Vector3(); box2.getCenter(c);
  obj.position.x -= c.x;
  obj.position.z -= c.z;
  obj.position.y -= box2.min.y; // apoya la base en y=0
  return { obj, size: box2.getSize(new THREE.Vector3()) };
}

export async function preloadModels() {
  const base = 'assets/models/';
  const [bodyG, walkG, houseG, castleG, natureG] = await Promise.all([
    load(base + 'zombie_body.glb'),
    load(base + 'zombie_walk.glb'),
    load(base + 'house.glb'),
    load(base + 'castle.glb'),
    load(base + 'nature.glb'),
  ]);

  // --- Zombie (cuerpo Kenney animado) ---
  if (bodyG) {
    const root = bodyG.scene;
    root.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.frustumCulled = false; // los skinned meshes se recortan mal al animar
        if (o.material) { o.material.metalness = 0; o.material.roughness = 0.9; }
      }
    });
    A.zombieBody = root;
    // altura nativa del modelo (medida con matrices actualizadas), para escalar bien
    A.zombieNativeH = measureBox(root).getSize(new THREE.Vector3()).y || 3.76;
    // la clave de la animación de caminar vive en zombie_walk.glb
    if (walkG && walkG.animations?.length) {
      A.walkClip = walkG.animations.find((c) => /run|walk/i.test(c.name)) || walkG.animations[0];
    }
  }

  // --- Casa / Castillo / Naturaleza (props estáticos) ---
  const prep = (g) => {
    if (!g) return null;
    g.scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return g.scene;
  };
  A.house = prep(houseG);
  A.castle = prep(castleG);
  // El kit de naturaleza es un solo GLB con muchas variantes por nombre de nodo.
  if (natureG) {
    A.nature = natureG.scene;
    A.natureIndex = {};
    natureG.scene.traverse((o) => {
      if (o.isMesh && o.name) A.natureIndex[o.name] = o;
      else if (o.name && o.children?.length) A.natureIndex[o.name] = o;
    });
  }
  ready = true;
  return A;
}

export function modelsReady() { return ready; }
export function hasZombie3D() { return !!(A.zombieBody && A.walkClip); }

// Tinte por tipo de zombie (se aplica sobre la piel Kenney para diferenciarlos
// manteniendo su silueta 3D; su imagen original va como cartel al frente).
const ZTINT = {
  basic: 0x8fae6a, flag: 0x9ab86a, cone: 0xc98a3a, book: 0x8a6ad0,
  bucket: 0x9aa6b0, football: 0xd06a4a, balloon: 0xd08ad0, prof: 0x6a5ad0,
};

// Crea un cuerpo 3D animado para un zombie. Devuelve { group, mixer } o null.
// `height` es la altura objetivo (en unidades del tablero).
export function makeZombie3D(type, height) {
  if (!hasZombie3D()) return null;
  const model = skeletonClone(A.zombieBody);
  // Kenney mira hacia +Z; los zombies caminan hacia -X (hacia la casa): giramos -90°.
  model.rotation.y = -Math.PI / 2;
  const tint = ZTINT[type] || 0x8fae6a;
  model.traverse((o) => {
    if (o.isMesh && o.material) {
      o.material = o.material.clone();
      o.material.color = new THREE.Color(tint);
    }
  });
  // El modelo Kenney ya viene con los pies en y=0 y centrado en X/Z. NO tocamos su
  // transform (moverlo/escalarlo directamente rompe el skinning): lo colgamos de un
  // grupo y escalamos EL GRUPO por la altura nativa medida al precargar.
  const group = new THREE.Group();
  group.add(model);
  group.scale.setScalar(height / (A.zombieNativeH || 3.76));

  const mixer = new THREE.AnimationMixer(model);
  const act = mixer.clipAction(A.walkClip);
  act.play();
  act.time = Math.random() * (A.walkClip.duration || 1); // desfasa el ciclo entre zombies
  mixer.update(0); // aplica ya la pose de caminar (evita un fotograma en pose base al aparecer)
  return { group, mixer, model };
}

// Instancia una variante del kit de naturaleza por nombre (p. ej. 'PineTree_1').
// Devuelve un Group escalado a `targetHeight` o null si no existe.
export function makeNature(name, targetHeight) {
  if (!A.natureIndex || !A.natureIndex[name]) return null;
  const src = A.natureIndex[name];
  const obj = skeletonClone(src);
  obj.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = true; } });
  const g = new THREE.Group();
  groundAndScale(obj, targetHeight);
  obj.rotation.y = Math.random() * Math.PI * 2;
  g.add(obj);
  return g;
}

export function natureNames() { return A.natureIndex ? Object.keys(A.natureIndex) : []; }

// Casa o castillo escalados a una altura objetivo y apoyados en el suelo.
export function makeBuilding(kind, targetHeight) {
  const src = kind === 'castle' ? A.castle : A.house;
  if (!src) return null;
  const obj = src.clone(true);
  const g = new THREE.Group();
  groundAndScale(obj, targetHeight);
  g.add(obj);
  return g;
}
