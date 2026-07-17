// Soundtrack original de English Defenders — compuesto en código (WebAudio).
// Música 100% original y libre de copyright: melodía tipo "guardería embrujada"
// en La menor, homenaje al espíritu del género tower-defense.
let ctx = null;
let master = null;
let playing = false;
let timer = null;
let step = 0;
let nextTime = 0;

const BPM = 112;
const STEP = 60 / BPM / 2; // corcheas

// n = semitonos desde A4 (440 Hz); null = silencio
const F = (n) => 440 * Math.pow(2, n / 12);
const A2 = -24, C3 = -21, D3 = -19, E3 = -17, F3 = -16, G3 = -14, GS3 = -13;
const A3 = -12, B3 = -10, C4 = -9, D4 = -7, E4 = -5, F4 = -4, G4 = -2, GS4 = -1;
const A4 = 0, B4 = 2, C5 = 3, D5 = 5, E5 = 7, F5 = 8, G5 = 10, A5 = 12;

// 8 compases × 8 corcheas = 64 pasos
const MELODY = [
  A4, null, C5, null, E5, null, C5, null,
  B4, null, A4, G4, A4, null, null, null,
  F4, null, A4, null, C5, null, A4, null,
  G4, null, B4, null, D5, null, B4, null,
  A4, null, C5, null, E5, null, G5, null,
  F5, E5, D5, C5, B4, null, G4, null,
  E4, G4, B4, null, E5, null, GS4, B4,
  A4, null, null, null, E4, G4, A4, null,
];
const BASS = [
  A2, null, A2, A3, null, A2, E3, A2,
  A2, null, A2, A3, null, A2, E3, G3,
  F3, null, F3, A3, null, F3, C4, F3,
  G3, null, G3, B3, null, G3, D4, G3,
  A2, null, A2, A3, null, A2, E3, A2,
  F3, null, F3, A3, null, F3, C4, F3,
  E3, null, E3, GS3, null, E3, B3, E3,
  A2, null, E3, null, A2, null, A3, null,
];
const COUNTER = [ // arpegio suave de fondo, entra en los compases 5-8
  null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null,
  E5, null, null, A5, null, null, E5, null,
  C5, null, null, F5, null, null, C5, null,
  B4, null, null, E5, null, null, B4, null,
  C5, null, B4, null, A4, null, null, null,
];

function ac() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function voice(freq, t, dur, type, vol, decay = 0.9) {
  const a = ac();
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur * decay);
  o.connect(g).connect(master);
  o.start(t); o.stop(t + dur + 0.05);
}

function hat(t, vol = 0.018) {
  const a = ac();
  const buf = a.createBuffer(1, a.sampleRate * 0.05, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = a.createBufferSource();
  s.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'highpass'; f.frequency.value = 6000;
  const g = a.createGain();
  g.gain.value = vol;
  s.connect(f).connect(g).connect(master);
  s.start(t);
}

function scheduleStep(i, t) {
  const m = MELODY[i % 64], b = BASS[i % 64], c = COUNTER[i % 64];
  if (m !== null) voice(F(m), t, STEP * 1.9, 'square', 0.045);
  if (b !== null) voice(F(b), t, STEP * 1.6, 'triangle', 0.12);
  if (c !== null) voice(F(c), t, STEP * 2.6, 'sine', 0.028);
  if (i % 2 === 0) hat(t, i % 8 === 4 ? 0.03 : 0.014);
}

function tick() {
  const a = ac();
  while (nextTime < a.currentTime + 0.3) {
    scheduleStep(step, Math.max(nextTime, a.currentTime + 0.01));
    nextTime += STEP;
    step++;
  }
}

export function startMusic() {
  if (playing) return;
  playing = true;
  const a = ac();
  step = 0;
  nextTime = a.currentTime + 0.1;
  timer = setInterval(tick, 80);
}

export function stopMusic() {
  playing = false;
  if (timer) { clearInterval(timer); timer = null; }
}

export function isMusicPlaying() { return playing; }
export function setMusicVolume(v) { if (master) master.gain.value = v; }
