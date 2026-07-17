// Motor de preguntas — conecta los temas del programa (INT-ANX-005) con el juego.
import { TOPICS } from '../data/topics.js';
import { QUESTIONS_A1 } from '../data/questions-a1.js';
import { QUESTIONS_A2 } from '../data/questions-a2.js';
import { QUESTIONS_B1 } from '../data/questions-b1.js';
import { QUESTIONS_B2 } from '../data/questions-b2.js';
import { QUESTIONS_C1 } from '../data/questions-c1.js';
import { EXTRA_QUESTIONS } from '../data/questions-extra.js';
import { SFX } from './audio.js';

// fusiona los bancos base con las preguntas adicionales
function merge(base, extra) {
  if (!extra) return base;
  const out = {};
  for (const k of new Set([...Object.keys(base), ...Object.keys(extra)]))
    out[k] = [...(base[k] || []), ...(extra[k] || [])];
  return out;
}
const BANKS = {
  A1: merge(QUESTIONS_A1, EXTRA_QUESTIONS.A1),
  A2: merge(QUESTIONS_A2, EXTRA_QUESTIONS.A2),
  B1: merge(QUESTIONS_B1, EXTRA_QUESTIONS.B1),
  B2: merge(QUESTIONS_B2, EXTRA_QUESTIONS.B2),
  C1: merge(QUESTIONS_C1, EXTRA_QUESTIONS.C1),
};

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
    this.elFb = document.getElementById('quiz-feedback');
    this.btnCont = document.getElementById('quiz-continue');
    this.pool = [];
    this.queue = [];
    this.stats = { asked: 0, correct: 0, streak: 0, bestStreak: 0 };
  }

  // Prepara el pool para una etapa: nivel CEFR + unidad. Incluye refuerzo de unidades anteriores.
  // Sin repeticiones: primero toda la unidad actual, luego todo el repaso; solo se
  // recicla cuando el pool completo se agotó (y se vuelve a barajar).
  setStage(level, unit) {
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
    this.queue = shuffle(current).concat(shuffle(review));
    if (!this.queue.length) this.queue = shuffle(this.pool);
    this.lastQ = null;
    this.stats = { asked: 0, correct: 0, streak: 0, bestStreak: 0 };
  }

  next() {
    if (!this.queue.length) {
      this.queue = shuffle(this.pool);
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
      this.elTopic.textContent = q.topic;
      this.elQ.textContent = q.q;
      this.elFb.className = 'quiz-feedback hidden';
      this.elFb.textContent = '';
      this.btnCont.classList.add('hidden');
      this.elOpts.innerHTML = '';

      const order = shuffle(q.o.map((text, i) => ({ text, i })));
      let answered = false;

      for (const opt of order) {
        const b = document.createElement('button');
        b.className = 'quiz-opt';
        b.textContent = opt.text;
        b.addEventListener('click', () => {
          if (answered) return;
          answered = true;
          const correct = opt.i === q.a;
          this.stats.asked++;
          const tip = tipsES() ? ` ${q.why}` : '';
          if (correct) {
            this.stats.correct++;
            this.stats.streak++;
            this.stats.bestStreak = Math.max(this.stats.bestStreak, this.stats.streak);
            b.classList.add('correct');
            SFX.correct();
            this.elFb.className = 'quiz-feedback good';
            this.elFb.textContent = `✔ Correct!${tip}`;
            setTimeout(() => { this.hide(); resolve({ correct: true }); }, tipsES() ? 1400 : 850);
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
            this.elFb.textContent = `✘ The correct answer was "${q.o[q.a]}".${tip}`;
            this.btnCont.classList.remove('hidden');
            this.btnCont.onclick = () => { this.hide(); resolve({ correct: false }); };
          }
        });
        this.elOpts.appendChild(b);
      }
      this.modal.classList.remove('hidden');
    });
  }

  hide() { this.modal.classList.add('hidden'); }
  get accuracy() { return this.stats.asked ? this.stats.correct / this.stats.asked : 1; }
}
