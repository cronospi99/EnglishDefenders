// Motor de preguntas — conecta los temas del programa (INT-ANX-005) con el juego.
import { TOPICS } from '../data/topics.js';
import { GRAMMAR_NOTES } from '../data/grammar-notes.js';
import { QUESTIONS_A1 } from '../data/questions-a1.js';
import { QUESTIONS_A2 } from '../data/questions-a2.js';
import { QUESTIONS_B1 } from '../data/questions-b1.js';
import { QUESTIONS_B2 } from '../data/questions-b2.js';
import { QUESTIONS_C1 } from '../data/questions-c1.js';
import { EXTRA_QUESTIONS } from '../data/questions-extra.js';
import { PLUS_A1 } from '../data/questions-plus-a1.js';
import { PLUS_A2 } from '../data/questions-plus-a2.js';
import { PLUS_B1 } from '../data/questions-plus-b1.js';
import { PLUS_B2 } from '../data/questions-plus-b2.js';
import { PLUS_C1 } from '../data/questions-plus-c1.js';
import { DRILLS } from '../data/questions-drills.js';
import { PASSAGES_A2 } from '../data/passages-a2.js';
import { PASSAGES_B1 } from '../data/passages-b1.js';
import { PASSAGES_B2 } from '../data/passages-b2.js';
import { PASSAGES_C1 } from '../data/passages-c1.js';
import { PLUS_PASSAGES_B1 } from '../data/passages-plus-b1.js';
import { PLUS_PASSAGES_B2 } from '../data/passages-plus-b2.js';
import { PLUS_PASSAGES_C1 } from '../data/passages-plus-c1.js';
import { SFX } from './audio.js';

// fusiona el banco base con todos los bancos adicionales del mismo nivel
function merge(base, ...extras) {
  const out = {};
  const keys = new Set(Object.keys(base));
  for (const e of extras) if (e) for (const k of Object.keys(e)) keys.add(k);
  for (const k of keys) {
    out[k] = [...(base[k] || [])];
    for (const e of extras) if (e && e[k]) out[k].push(...e[k]);
  }
  return out;
}
const BANKS = {
  A1: merge(QUESTIONS_A1, EXTRA_QUESTIONS.A1, PLUS_A1, DRILLS.A1),
  A2: merge(QUESTIONS_A2, EXTRA_QUESTIONS.A2, PLUS_A2, DRILLS.A2, PASSAGES_A2),
  B1: merge(QUESTIONS_B1, EXTRA_QUESTIONS.B1, PLUS_B1, PASSAGES_B1, PLUS_PASSAGES_B1),
  B2: merge(QUESTIONS_B2, EXTRA_QUESTIONS.B2, PLUS_B2, PASSAGES_B2, PLUS_PASSAGES_B2),
  C1: merge(QUESTIONS_C1, EXTRA_QUESTIONS.C1, PLUS_C1, PASSAGES_C1, PLUS_PASSAGES_C1),
};

// Dos formatos de ejercicio conviven en el banco:
//   • completion sentence  — una frase corta con un hueco (drill rápido de gramática/vocabulario)
//   • text completion (t:'p') — un pasaje de 2 a 4 frases donde el hueco se resuelve por contexto
// La proporción de pasajes sube con el nivel: A1 se queda en frases sueltas y de B1 en
// adelante el contexto pasa a ser el formato dominante.
const PASSAGE_MIX = { A1: 0, A2: 0.3, B1: 0.5, B2: 0.6, C1: 0.65 };
const isPassage = (q) => q.t === 'p';

// Reparte los pasajes entre las frases al ritmo pedido (ratio = proporción deseada de
// pasajes). Si un formato se agota antes, el resto se añade al final: nunca se pierden
// preguntas, sólo cambia el orden en que salen.
function blend(sent, pass, ratio) {
  if (!pass.length) return sent;
  if (!sent.length) return pass;
  if (ratio <= 0) return sent;
  const out = [];
  let i = 0, j = 0, credit = 0;
  while (i < sent.length || j < pass.length) {
    credit += ratio;
    if (credit >= 1 && j < pass.length) { out.push(pass[j++]); credit -= 1; }
    else if (i < sent.length) out.push(sent[i++]);
    else { out.push(pass[j++]); credit = 0; }
  }
  return out;
}

// Toggle: mostrar las explicaciones gramaticales en español
export function tipsES() { return localStorage.getItem('ed:tips-es') !== 'off'; }
export function setTipsES(on) { localStorage.setItem('ed:tips-es', on ? 'on' : 'off'); }

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class Quiz {
  constructor() {
    this.modal = document.getElementById('quiz-modal');
    this.elTopic = document.getElementById('quiz-topic');
    this.elQ = document.getElementById('quiz-question');
    this.elOpts = document.getElementById('quiz-options');
    this.elKind = document.getElementById('quiz-kind');
    this.elFb = document.getElementById('quiz-feedback');
    this.elExplain = document.getElementById('quiz-explain');
    this.btnWhy = document.getElementById('quiz-why');
    this.btnCont = document.getElementById('quiz-continue');
    this.pool = [];
    this.queue = [];
    this.stats = { asked: 0, correct: 0, streak: 0, bestStreak: 0 };
  }

  // Prepara el pool para una etapa: nivel CEFR + unidad. Incluye refuerzo de unidades anteriores.
  // Sin repeticiones: primero toda la unidad actual, luego todo el repaso; solo se
  // recicla cuando el pool completo se agotó (y se vuelve a barajar).
  setStage(level, unit) {
    this.level = level;
    this.mix = PASSAGE_MIX[level] ?? 0;
    const bank = BANKS[level];
    const topics = TOPICS[level];
    const current = [], review = [];
    for (const t of topics) {
      const key = `${t.unit}-${t.cls}`;
      const qs = bank[key];
      if (!qs) continue;
      const isCurrent = t.unit === unit;
      const isReview = t.unit < unit;
      if (!isCurrent && !isReview) continue;
      for (const q of qs) (isCurrent ? current : review).push({ ...q, topic: t.topic, unit: t.unit });
    }
    this.pool = current.concat(review);
    if (!this.pool.length) this.pool = Object.values(bank).flat().map(q => ({ ...q, topic: level }));
    this.queue = this._deal(current).concat(this._deal(review));
    if (!this.queue.length) this.queue = this._deal(this.pool);
    this.lastQ = null;
    this.stats = { asked: 0, correct: 0, streak: 0, bestStreak: 0 };
  }

  // Baraja un grupo y dosifica en él los pasajes según el nivel.
  _deal(arr) {
    return blend(shuffle(arr.filter(q => !isPassage(q))), shuffle(arr.filter(isPassage)), this.mix);
  }

  next() {
    if (!this.queue.length) {
      this.queue = this._deal(this.pool);
      // evita que la primera del nuevo ciclo repita la última mostrada
      if (this.queue.length > 1 && this.queue[0] === this.lastQ) this.queue.push(this.queue.shift());
    }
    const q = this.queue.shift();
    this.lastQ = q;
    return q;
  }

  // Muestra el modal y resuelve {correct:boolean} al terminar la interacción.
  ask() {
    const q = this.next();
    return new Promise((resolve) => {
      const passage = isPassage(q);
      this.elTopic.textContent = q.topic;
      // Los pasajes se muestran con letra más pequeña y alineados a la izquierda: son
      // varias frases y hay que leerlas como un texto, no como un enunciado suelto.
      this.elQ.className = passage ? 'quiz-question passage' : 'quiz-question';
      this.elQ.textContent = q.q;
      if (this.elKind) {
        this.elKind.textContent = passage ? '📖 Text completion' : '✏️ Complete the sentence';
        this.elKind.classList.remove('hidden');
      }
      this.elFb.className = 'quiz-feedback hidden';
      this.elFb.textContent = '';
      this.elExplain.className = 'quiz-explain hidden';
      this.elExplain.textContent = '';
      this.btnWhy.classList.add('hidden');
      this.btnCont.classList.add('hidden');
      this.elOpts.innerHTML = '';

      // Botón "💡 Why?": muestra la explicación de gramática (por qué la respuesta es
      // correcta o incorrecta). Disponible en todos los niveles, tras responder.
      const revealWhy = () => {
        const note = (GRAMMAR_NOTES[this.level] || {})[q.unit];
        this.elExplain.innerHTML = '';
        const why = document.createElement('div');
        why.className = 'why-line';
        why.textContent = `💡 ${q.why}`;
        this.elExplain.appendChild(why);
        if (note) {
          const ext = document.createElement('div');
          ext.className = 'grammar-note';
          // título del tema + nota extendida (regla + ejemplo). Los saltos de línea
          // del texto se respetan con white-space: pre-line en el CSS.
          ext.textContent = `📘 ${q.topic}\n${note}`;
          this.elExplain.appendChild(ext);
        }
        this.elExplain.className = 'quiz-explain';
        this.btnWhy.classList.add('hidden');
      };
      this.btnWhy.onclick = revealWhy;

      const order = shuffle(q.o.map((text, i) => ({ text, i })));
      let answered = false;

      for (const opt of order) {
        const b = document.createElement('button');
        b.className = 'quiz-opt';
        b.textContent = opt.text;
        b.addEventListener('click', () => {
          // Ignora el "ghost click" que el navegador sintetiza al soltar el mismo
          // toque que abrió el modal (en móvil respondía la pregunta sola).
          if (performance.now() < this._lockUntil) return;
          if (answered) return;
          answered = true;
          const correct = opt.i === q.a;
          this.stats.asked++;
          if (correct) {
            this.stats.correct++;
            this.stats.streak++;
            this.stats.bestStreak = Math.max(this.stats.bestStreak, this.stats.streak);
            b.classList.add('correct');
            SFX.correct();
            this.elFb.className = 'quiz-feedback good';
            this.elFb.textContent = '✔ Correct!';
            // el jugador lee la explicación y pulsa Continuar para seguir (no avanza solo)
            for (const other of this.elOpts.children) other.disabled = true;
            this.btnWhy.classList.remove('hidden');
            if (tipsES()) revealWhy();
            this.btnCont.textContent = '▶ Continue';
            this.btnCont.classList.remove('hidden');
            this.btnCont.onclick = () => { this.hide(); resolve({ correct: true }); };
          } else {
            this.stats.streak = 0;
            b.classList.add('wrong');
            SFX.wrong();
            // resalta la correcta
            for (const other of this.elOpts.children) {
              if (other.textContent === q.o[q.a]) other.classList.add('correct');
              other.disabled = true;
            }
            this.elFb.className = 'quiz-feedback bad';
            this.elFb.textContent = `✘ The correct answer was "${q.o[q.a]}".`;
            this.btnWhy.classList.remove('hidden');
            if (tipsES()) revealWhy();
            this.btnCont.textContent = '▶ Continue';
            this.btnCont.classList.remove('hidden');
            this.btnCont.onclick = () => { this.hide(); resolve({ correct: false }); };
          }
        });
        this.elOpts.appendChild(b);
      }
      this.modal.classList.remove('hidden');
      // breve bloqueo tras abrir para descartar el toque que originó la pregunta
      this._lockUntil = performance.now() + 450;
    });
  }

  hide() { this.modal.classList.add('hidden'); }
  get accuracy() { return this.stats.asked ? this.stats.correct / this.stats.asked : 1; }
}
