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
   · Las **plantas de sol** (Sunflower y Twin Sunflower) se plantan **sin pregunta**: son el motor
   económico de la partida y bloquearlas frenaba todo lo demás. El resto sigue exigiendo acertar.
   · El modal muestra el **nombre del tema de gramática** y un botón **🔄 Change question** para
   sacar otra pregunta sin gastar el intento (deja de estar disponible al responder).
   · Si la batalla empieza en una unidad avanzada, **~35 %** de las preguntas son de esa unidad y
   **~65 %** repaso mezclado de las anteriores. En la unidad 1 todo sale de la unidad 1.
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
Zombie común, gorro de cono, **zombie del periódico** (se enfurece cuando lo hieren), balde de metal, portaestandarte de oleada, **jugador de fútbol** (rápido y duro), el **Balloon Zombie** 🎈 (vuela sobre el jardín: sólo el Cactus estirado puede bajarlo), el **Profesor Zombie** 🧠 y el **Boss Zombie** ☠️, un gigante con muchísima resistencia que avanza pisando **dos carriles a la vez**.

### Plantas especiales
- **Cactus** — dispara pinchos por tierra y **se estira** cuando entra un Balloon Zombie en su carril: es el único contraataque contra los voladores. Al despejarse el carril vuelve a su forma normal. Si no lo llevas en tu baraja, **no saldrán globos** en esa partida.
- **Chili Pepper** — arrasa un carril entero de izquierda a derecha; los zombies quedan un momento como **siluetas negras**.
- **Cherry Bomb** — estalla en cruz larga: su casilla y **dos** casillas hacia arriba, abajo, izquierda y derecha (hasta 9 casillas).
- **Potato Mine** — mina barata que se arma bajo tierra y revienta al primer zombi que la toca.
- **Corn Launcher** y **Cabbage-pult** — lanzan en arco por encima de los muros.
- **Garlic** — muerde al zombi y lo **empuja al carril de al lado** (elige el más despejado), repartiendo la presión.

### ⚔️ Dificultad
Antes de cada batalla se elige la dificultad (se recuerda para la siguiente). No es
sólo la vida de los zombies: cada nivel mueve **todas** las palancas de forma coherente.

| | 🌱 Easy | 🌻 Medium | 🔥 Hard | 💀 Extreme |
|---|---|---|---|---|
| Vida de los zombies | ×0.70 | ×1.00 | ×1.40 | ×1.90 |
| Velocidad | ×0.85 | ×1.00 | ×1.12 | ×1.28 |
| Zombies por oleada | ×0.75 | ×1.00 | ×1.30 | ×1.60 |
| Ritmo entre oleadas | más lento | normal | más rápido | frenético |
| Tipos de zombie | aparecen tarde | normal | se adelantan | élite desde el principio |
| Sol inicial | 275 | 175 | 125 | 100 |
| Caída de soles | más frecuente | normal | más lenta | mucho más lenta |
| Libros voladores (última defensa) | sí | sí | sí | **no** |

La dificultad elegida se muestra como insignia en el HUD durante toda la partida.

### 🌊 Nº de oleadas
Junto a la dificultad hay un **deslizador de 1 a 10 oleadas**: decide cuánto quieres que
dure la batalla. Se recuerda entre partidas. Menos oleadas = escaramuza rápida; más
oleadas = asedio largo, y las últimas son siempre las más duras.

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
- **Soundtrack de 8 temas originales** (*Boots on the Cobblestone*, *Quest for the Summit*, *Sunny Side Dash*, *Parade on Gilded Hills*, *A Cartographer's First Map*, *Victory at the Plaza*, *Grand Quest Reset* y *The Hero's Quiet Return*) que rotan automáticamente en bucle. Con el botón **🎶 Soundtrack** (en el menú principal y en el HUD durante las partidas) puedes elegir un tema concreto para escucharlo en bucle o dejarlos en modo aleatorio; tu elección se recuerda. Si los archivos no cargan, se usa como respaldo una banda sonora sintetizada en el propio juego con WebAudio. Botón 🎵 para activarlo/silenciarlo.
- **Gemidos de zombies**, disparos, mordiscos, aciertos/errores y fanfarrias, todos generados con WebAudio (sin archivos externos).
- Botones **🎵 Music** y **🔊 Sound** en la **portada** (y sus equivalentes en el HUD): encienden o apagan música y efectos por separado, se sincronizan entre sí y recuerdan tu elección.

---

## 📚 Contenido educativo

- **149 temas de gramática** organizados por nivel CEFR (A1: 32, A2: 32, B1: 32, B2: 29, C1: 24) y por unidades — extraídos del programa oficial.
- **+1850 preguntas de opción múltiple** con retroalimentación explicada en español (mínimo 8 por tema en todos los niveles).
- Cada **etapa = una unidad** del programa. Las preguntas priorizan la unidad actual (peso ×3) e incluyen repaso de unidades anteriores.
- Progreso guardado en el navegador: estrellas por unidad, precisión total y rachas.

### ✏️📖 Dos formatos de ejercicio

Cada pregunta llega en uno de estos dos formatos, y el juego lo indica con una etiqueta encima del enunciado:

| | Formato | Qué es | Dónde aparece |
|---|---|---|---|
| ✏️ | **Complete the sentence** | Una frase con un hueco: drill rápido y directo de una regla o de vocabulario. | Todos los niveles |
| 📖 | **Text completion** | Un pasaje de 2 a 4 frases con un hueco: la respuesta se decide leyendo el contexto, no sólo la regla. | A2 en adelante |

La proporción cambia con el nivel, de modo que la dificultad de lectura suba junto con la gramática:

| Nivel | Frases sueltas | Pasajes con contexto |
|---|---|---|
| A1 | 100 % | — |
| A2 | ~70 % | ~30 % |
| B1 | ~50 % | ~50 % |
| B2 | ~40 % | ~60 % |
| C1 | ~35 % | ~65 % |

A1 se queda enteramente en frases cortas; de B1 en adelante el pasaje pasa a ser el formato dominante.
El reparto lo hace `src/quiz.js` (constante `PASSAGE_MIX`) barajando ambos formatos sin repetir preguntas.

### Editar o agregar preguntas

Los bancos de frases están en `data/questions-a1.js` … `data/questions-c1.js`, más los
adicionales `data/questions-plus-*.js`, `data/questions-extra.js` y los drills de A1–A2 en
`data/questions-drills.js`. Formato:

```js
"1-2": [   // clave "unidad-clase" según el temario (data/topics.js)
  { q: 'She ____ a doctor.',            // enunciado (____ = espacio en blanco)
    o: ['is', 'are', 'am', 'be'],       // 4 opciones
    a: 0,                               // índice de la correcta (0 = primera)
    why: 'Con "she" el verbo to be es "is".' },  // explicación
],
```

Los pasajes viven en `data/passages-a2.js` … `data/passages-c1.js` (y sus `passages-plus-*.js`).
Son iguales, pero llevan `t:'p'` y el hueco va dentro de un texto de 2 a 4 frases:

```js
"1-1": [
  { t: 'p',                             // 'p' = text completion
    q: 'Last Saturday my cousins came to visit. We ____ so happy to see them ' +
       'because they live very far away. In the afternoon we cooked together.',
    o: ['were', 'was', 'are', 'did'],
    a: 0,
    why: 'El sujeto es "we" y el relato está en pasado: "were".' },
],
```

Agrega tantas preguntas como quieras por tema y en cualquiera de los dos formatos: el juego
las mezcla automáticamente respetando la proporción del nivel.

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
data/questions-plus-*.js  Preguntas adicionales por nivel (se fusionan con las base)
data/questions-drills.js  Completion sentences: drills de gramática y vocabulario (A1–A2)
data/questions-*.js   Bancos de preguntas por nivel
data/passages-*.js    Text completions: pasajes de 2–4 frases con un hueco (A2 en adelante)
src/main.js           Menús, progreso, HUD
src/game.js           Motor del juego (tablero, oleadas, combate)
src/models.js         Props 3D procedurales (cercas, jarrones…)
src/models3d.js       Carga de modelos GLB: zombies animados, casa, castillo y naturaleza
src/textures.js       Texturas procedurales + carga de PNG del usuario
src/quiz.js           Motor de preguntas
src/audio.js          Efectos de sonido sintetizados (WebAudio)
src/music.js          Soundtrack: playlist MP3 + respaldo sintetizado (WebAudio)
vendor/jsm/           GLTFLoader + SkeletonUtils (add-ons de Three.js r161)
assets/models/        Modelos 3D en formato GLB (zombies, edificios, kit de naturaleza)
assets/music/         Temas del soundtrack en MP3
assets/textures/      Coloca aquí tus PNG opcionales
```

---

## ⚖️ Créditos

- **Autor y contenido educativo:** Teacher **Esteban Yepes**.
- Juego original e independiente **inspirado en las mecánicas clásicas** del género *lane tower-defense*. No contiene código, arte ni nombres de *Plants vs. Zombies* (marca de PopCap/EA).

### Escenografía 3D (GLB)

Los zombies y las plantas son **sprites 2D planos** del atlas del profe (con el recorte de alfa
limpiado para que no se vean "huecos" transparentes). Los escenarios sí añaden **edificios y
naturaleza en 3D**:

- **Casa** (Suburban día/noche, **Beach Resort** y **Snowy Mountains**) y **castillo** (Jungle Temple
  y Ancient Ruins) — modelos GLB a la izquierda del jardín, colocados de modo que no tapen los
  "libros" cortacéspedes de cada carril.
- La casa **se repinta según el escenario**: blanca y fría en la nieve, cálida y tropical en la
  playa. El GLB trae un único material, así que el tono se multiplica sobre su textura (`HOUSE_TINT`
  en `src/game.js`) y los materiales se clonan para no teñir todas las casas a la vez.
- **Kit de naturaleza** (árboles, palmeras, arbustos, rocas, flores y césped) alrededor del tablero,
  con variantes según el escenario.

Los modelos viven en `assets/models/*.glb`. Si alguno falta o falla, el juego usa la escenografía de
sprites de siempre (carga tolerante a fallos).

### Antes de cada partida

- 🌻 **Selector de plantas:** elige qué plantas llevar (con su descripción) antes de empezar.
- 📘 **Temas de gramática de la unidad:** cada unidad trae 2–3 temas (clases). Antes de la batalla
  se marca cuáles entran; se puede dejar sólo uno para insistir en él. Siempre queda al menos uno.
- 👥 **Lista de la clase (opcional):** se escriben los nombres de los alumnos y las preguntas se
  dirigen a uno tras otro por turnos (el modal muestra **👤 For \<nombre\>**). A cada alumno se le
  puede asignar **su propia unidad**: entonces sus preguntas salen de esa unidad, aunque la batalla
  vaya por otra. Es la lista local del dispositivo del docente; el **Class Mode** multijugador
  mantiene su propio registro y no la usa.
- 📚 **Almanaque:** descripción de cada planta y cada zombi, accesible desde el menú. Al **tocar
  cualquier carta** se abre su **ficha técnica**: vida, daño, daño por segundo, alcance, a quién
  alcanza, cadencia, coste y recarga, sus rasgos especiales y —en las plantas— la **tabla de las tres
  evoluciones** (Lv1 → Lv2 → MAX ⭐) con lo que cuesta cada subida. Los botones **Lv1 / Lv2 / MAX**
  recalculan la ficha completa para ese nivel. En los zombies se ve además su velocidad en casillas
  por segundo y cuánto tarda en cruzar el jardín.
- 🌊 **Oleadas:** máximo 6 por partida, más largas; la primera es suave y las últimas son hordas.
- ❓ Tras responder (bien o mal) el jugador pulsa **Continuar** para seguir.
