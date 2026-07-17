# 🌻 English Defenders — Learn · Defend · Win

**Juego educativo web en 3D para aprender inglés (niveles A1 a C1), estilo tower-defense por carriles.**

> Creado por **Teacher Esteban Yepes** — todos los contenidos pedagógicos, temas y banco de preguntas.
> Temario basado en el documento oficial *INT-ANX-005 — Base de Asignación de Temas para Tutorías de Inglés (V2, 2024)*.

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

## 🖼️ Usar tus propias texturas

El juego genera texturas cartoon por código, pero **si colocas archivos PNG en `assets/textures/` los usa automáticamente**:

| Archivo | Reemplaza |
|---|---|
| `board.png` | Césped del tablero (se recomienda patrón a cuadros 9×5) |
| `dirt.png` | Tierra del entorno |
| `stone.png` | Camino de piedra de los zombies |
| `wood.png` | Madera (cercas) |
| `sky.png` | Cielo de fondo |

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
