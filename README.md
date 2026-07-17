# 🌻 English Defenders — Learn · Defend · Win

**Juego educativo web en 3D para aprender inglés (niveles A1 a C1), estilo tower-defense por carriles, con el arte oficial del proyecto.**

> Creado por **Teacher Esteban Yepes** — contenidos pedagógicos, temas, banco de preguntas y atlas de texturas.
> Temario basado en el documento oficial *INT-ANX-005 — Base de Asignación de Temas para Tutorías de Inglés (V2, 2024)*.
>
> 🌐 Interfaz del juego **en inglés**; las explicaciones gramaticales en español se activan/desactivan con el botón **"Spanish tips"** del menú.

![Niveles A1–C1](https://img.shields.io/badge/CEFR-A1%20→%20C1-8dc63f) ![3D](https://img.shields.io/badge/Web-3D%20(Three.js)-2ea7e0) ![Sin build](https://img.shields.io/badge/build-no%20requiere-9b59d0)

---

## 🎮 ¿Cómo se juega?

Defiende tu jardín de los zombies **respondiendo preguntas de inglés**:

1. ☀️ **Recoge soles** (caen del cielo y los producen tus girasoles) — son tu recurso.
2. 🌻 **Elige una carta de planta** y haz clic en una casilla del jardín.
3. ❓ Antes de plantar aparece una **pregunta del tema de la unidad**. Si aciertas, la planta se coloca. Si fallas, ves la **explicación en español** y pierdes unos segundos.
4. 🔥 Cada **3 respuestas correctas seguidas** ganas +50 ☀️ de bonus.
5. 🧟 Los zombies avanzan por 5 carriles. Los **libros voladores** son tu última defensa (uno por fila).
6. ⭐ Al ganar recibes 1–3 estrellas según tu **precisión en inglés** (90 %+ = 3 ⭐).

### Plantas
| Carta | Nombre | Costo | Función |
|---|---|---|---|
| 🌻 | Sunny | 50 | Produce soles |
| 🌱 | Pea Scholar | 100 | Dispara guisantes |
| 🥥 | Tough Nut | 50 | Muro defensivo |
| 🫐 | Frost Berry | 150 | Daña y **congela** |
| 🍄 | Boom Shroom | 125 | Bombas de **área** |
| 🌽 | Corn Cannon | 175 | Daño alto + empuje |

### Zombies
Zombie común, gorro de cono, **zombie lector** (se enfurece al perder su libro), balde de metal, portaestandarte de oleada, **jugador de fútbol** (rápido y duro) y el temible **Profesor Zombie** 🧠 (niveles altos).

### 🕹️ Minijuegos
- **🏺 Vase Breaker:** responde una pregunta para romper cada jarrón — dentro hay plantas gratis, tesoros que barren el carril… o zombies. Gana rompiéndolos todos.
- **🥔 Spud Bowling:** haz clic en un carril para lanzar una papa rodante que aplasta zombies y rebota entre carriles. Responde preguntas para ganar más papas.
- Ambos usan preguntas de **todo el nivel** elegido (repaso general).

### 👥 Class Mode (multijugador, hasta 7 estudiantes + docente)
1. El docente pulsa **Class Mode** en el menú: se genera un **código y un QR**.
2. Los estudiantes escanean el QR con el celular (o abren el enlace) y escriben su nombre.
3. El docente elige el nivel y pulsa **Start battle**: todos juegan la misma batalla a la vez, con **marcador en vivo** (zombies vencidos y precisión de inglés de cada jugador).
- Requiere internet (usa la nube gratuita de PeerJS para conectar los dispositivos).
- Avanzado: con `?peerhost=servidor:puerto` en la URL puede usarse un servidor PeerJS propio en la red del colegio.

### 🎵 Audio
- **Soundtrack original de 4 piezas** compuestas por síntesis en el propio juego (100 % libre de copyright), que rotan automáticamente: *Garden Patrol*, *Sunny March*, *Twilight Waltz* y *Final Wave*. Botón 🎵 para activarlo/silenciarlo.
- **Gemidos de zombies**, disparos, mordiscos, aciertos/errores y fanfarrias, todos generados con WebAudio (sin archivos externos).

---

## 📚 Contenido educativo

- **149 temas de gramática** organizados por nivel CEFR (A1: 32, A2: 32, B1: 32, B2: 29, C1: 24) y por unidades — extraídos del programa oficial.
- **+600 preguntas de opción múltiple** con retroalimentación explicada en español.
- Cada **etapa = una unidad** del programa. Las preguntas priorizan la unidad actual (peso ×3) e incluyen repaso de unidades anteriores.
- Progreso guardado en el navegador: estrellas por unidad, precisión total y rachas.

### Editar o agregar preguntas

Los bancos están en `data/questions-a1.js` … `data/questions-c1.js`. Formato:

```js
"1-2": [   // clave "unidad-clase" según el temario (data/topics.js)
  { q: 'She ____ a doctor.',            // enunciado (____ = espacio en blanco)
    o: ['is', 'are', 'am', 'be'],       // 4 opciones
    a: 0,                               // índice de la correcta (0 = primera)
    why: 'Con "she" el verbo to be es "is".' },  // explicación
],
```

Agrega tantas preguntas como quieras por tema: el juego las mezcla automáticamente.

---

## 🖼️ Arte y texturas

Todo el arte proviene del **atlas oficial "English Defenders"** del profe (los dos archivos de texturas):

- `assets/sprites/` — personajes (6 plantas, 7 zombies), efectos (guisante, sol, hielo, gas, explosión), tesoros, iconos y el **logo** (que flota en 3D con partículas doradas en el menú). Extraídos del atlas con eliminación automática del fondo.
- `assets/textures/` — césped del tablero (compuesto en damero desde el atlas), tierra, piedra y madera (del atlas de materiales PBR, convertidas en texturas repetibles sin costuras).

Puedes **reemplazar cualquier PNG** de esas carpetas y el juego lo usará tal cual (mismos nombres de archivo). Si un archivo falta, el juego genera una textura procedural de respaldo:

| Archivo | Uso |
|---|---|
| `textures/board.png` | Césped del tablero (9×5) |
| `textures/dirt.png` | Tierra del entorno (repetible) |
| `textures/stone.png` | Camino de piedra (repetible) |
| `textures/wood.png` | Madera de cercas (repetible) |
| `textures/sky.png` | Cielo de fondo (opcional) |
| `sprites/plant_*.png`, `sprites/zombie_*.png` | Personajes (PNG con transparencia) |

---

## 🚀 Ejecutar y publicar

No requiere instalación ni build (Three.js va incluido en `vendor/`). Solo necesita un servidor estático:

```bash
# opción 1
python3 -m http.server 8080
# opción 2
npx serve .
```

y abre `http://localhost:8080`.

**Publicar gratis en GitHub Pages:** Settings → Pages → *Deploy from a branch* → elige la rama y carpeta `/ (root)`. El juego queda en línea en `https://<usuario>.github.io/<repo>/`.

Funciona en escritorio y móvil/tablet (pantalla táctil compatible).

---

## 🗂️ Estructura

```
index.html            Pantallas y HUD
css/style.css         Estilo cartoon (paneles de madera, cartas, quiz)
vendor/               Three.js (sin dependencias externas)
data/topics.js        Temario oficial A1–C1 (INT-ANX-005)
data/questions-*.js   Bancos de preguntas por nivel
src/main.js           Menús, progreso, HUD
src/game.js           Motor del juego (tablero, oleadas, combate)
src/models.js         Modelos 3D de plantas, zombies y escenario
src/textures.js       Texturas procedurales + carga de PNG del usuario
src/quiz.js           Motor de preguntas
src/audio.js          Efectos de sonido sintetizados (WebAudio)
assets/textures/      Coloca aquí tus PNG opcionales
```

---

## ⚖️ Créditos

- **Autor y contenido educativo:** Teacher **Esteban Yepes**.
- Juego original e independiente **inspirado en las mecánicas clásicas** del género *lane tower-defense*. No contiene código, arte ni nombres de *Plants vs. Zombies* (marca de PopCap/EA).
