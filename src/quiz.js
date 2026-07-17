// Motor de preguntas — conecta los temas del programa (INT-ANX-005) con el juego.
import { TOPICS } from '../data/topics.js';
import { QUESTIONS_A1 } from '../data/questions-a1.js';
import { QUESTIONS_A2 } from '../data/questions-a2.js';
import { QUESTIONS_B1 } from '../data/questions-b1.js';
import { QUESTIONS_B2 } from '../data/questions-b2.js';
import { QUESTIONS_C1 } from '../data/questions-c1.js';
import { SFX } from './audio.js';

const BANKS = { A1: QUESTIONS_A1, A2: QUESTIONS_A2, B1: QUESTIONS_B1, B2: QUESTIONS_B2, C1: QUESTIONS_C1 };

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
  setStage(level, unit) {
    const bank = BANKS[level];
    const topics = TOPICS[level];
    const pool = [];
    for (const t of topics) {
      const key = `${t.unit}-${t.cls}`;
      const qs = bank[key];
      if (!qs) continue;
      const isCurrent = t.unit === unit;
      const isReview = t.unit < unit;
      if (!isCurrent && !isReview) continue;
      for (const q of qs) {
        // Las preguntas de la unidad actual pesan x3 frente al repaso.
        const copies = isCurrent ? 3 : 1;
        for (let i = 0; i < copies; i++) pool.push({ ...q, topic: t.topic, unit: t.unit });
      }
    }
    this.pool = pool.length ? pool : Object.values(bank).flat().map(q => ({ ...q, topic: level }));
    this.queue = shuffle(this.pool);
    this.stats = { asked: 0, correct: 0, streak: 0, bestStreak: 0 };
  }

  next() {
    if (!this.queue.length) this.queue = shuffle(this.pool);
    return this.queue.pop();
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
          if (correct) {
            this.stats.correct++;
            this.stats.streak++;
            this.stats.bestStreak = Math.max(this.stats.bestStreak, this.stats.streak);
            b.classList.add('correct');
            SFX.correct();
            this.elFb.className = 'quiz-feedback good';
            this.elFb.textContent = `✔ ¡Correcto! ${q.why}`;
            setTimeout(() => { this.hide(); resolve({ correct: true }); }, 950);
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
            this.elFb.textContent = `✘ La respuesta era "${q.o[q.a]}". ${q.why}`;
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
