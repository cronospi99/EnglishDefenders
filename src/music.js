// Soundtrack original de English Defenders — 4 piezas compuestas en código (WebAudio).
// Música 100% original y libre de copyright. Rotan automáticamente:
//  A) "Garden Patrol"  B) "Sunny March"  C) "Twilight Waltz"  D) "Final Wave"
let ctx = null;
let master = null;
let playing = false;
let timer = null;
let step = 0;
let nextTime = 0;
let songIdx = 0;
let loopsOfSong = 0;

const BPM = 112;
const STEP = 60 / BPM / 2; // corcheas

const F = (n) => 440 * Math.pow(2, n / 12);
// notas (semitonos desde A4)
const G2 = -26, A2 = -24, B2 = -22, C3 = -21, D3 = -19, E3 = -17, F3 = -16, G3 = -14, GS3 = -13;
const A3 = -12, B3 = -10, C4 = -9, D4 = -7, DS4 = -6, E4 = -5, F4 = -4, G4 = -2, GS4 = -1;
const A4 = 0, B4 = 2, C5 = 3, D5 = 5, DS5 = 6, E5 = 7, F5 = 8, G5 = 10, A5 = 12, B5 = 14, C6 = 15;
const __ = null;

// Cada canción: 8 compases × 8 corcheas = 64 pasos
const SONGS = [
 { // A — "Garden Patrol" (La menor, juguetona)
  melody: [
   A4,__,C5,__,E5,__,C5,__,  B4,__,A4,G4,A4,__,__,__,
   F4,__,A4,__,C5,__,A4,__,  G4,__,B4,__,D5,__,B4,__,
   A4,__,C5,__,E5,__,G5,__,  F5,E5,D5,C5,B4,__,G4,__,
   E4,G4,B4,__,E5,__,GS4,B4, A4,__,__,__,E4,G4,A4,__,
  ],
  bass: [
   A2,__,A2,A3,__,A2,E3,A2,  A2,__,A2,A3,__,A2,E3,G3,
   F3,__,F3,A3,__,F3,C4,F3,  G3,__,G3,B3,__,G3,D4,G3,
   A2,__,A2,A3,__,A2,E3,A2,  F3,__,F3,A3,__,F3,C4,F3,
   E3,__,E3,GS3,__,E3,B3,E3, A2,__,E3,__,A2,__,A3,__,
  ],
  counter: [
   __,__,__,__,__,__,__,__,  __,__,__,__,__,__,__,__,
   __,__,__,__,__,__,__,__,  __,__,__,__,__,__,__,__,
   E5,__,__,A5,__,__,E5,__,  C5,__,__,F5,__,__,C5,__,
   B4,__,__,E5,__,__,B4,__,  C5,__,B4,__,A4,__,__,__,
  ],
 },
 { // B — "Sunny March" (Do mayor, brillante y optimista)
  melody: [
   C5,__,E5,__,G5,__,E5,C5,  D5,__,B4,__,G4,__,__,__,
   A4,__,C5,__,E5,__,C5,A4,  F5,__,E5,D5,C5,__,__,__,
   G4,C5,E5,__,G5,__,A5,G5,  E5,__,C5,__,A4,__,F4,G4,
   E5,D5,C5,__,D5,C5,B4,D5,  C5,__,__,__,G4,E4,C4,__,
  ],
  bass: [
   C3,__,C3,G3,__,C3,E3,C3,  G2,__,G2,G3,__,G2,D3,G2,
   A2,__,A2,A3,__,A2,E3,A2,  F3,__,F3,A3,__,F3,C4,F3,
   C3,__,C3,G3,__,C3,E3,C3,  A2,__,A2,A3,__,A2,E3,A2,
   F3,__,G3,__,F3,__,G3,__,  C3,__,G3,__,C3,__,C4,__,
  ],
  counter: [
   __,__,__,__,__,__,__,__,  __,__,__,__,__,__,__,__,
   E5,__,__,__,G5,__,__,__,  A5,__,__,__,F5,__,__,__,
   __,__,__,__,__,__,__,__,  E5,__,__,__,C5,__,__,__,
   G5,__,__,__,F5,__,__,__,  E5,__,C5,__,G4,__,__,__,
  ],
 },
 { // C — "Twilight Waltz" (Re menor, misteriosa y elegante)
  melody: [
   D5,__,__,F5,__,__,A4,__,  E5,__,D5,C5,D5,__,__,__,
   F4,__,A4,__,D5,__,F5,__,  E5,__,C5,__,A4,__,__,__,
   D5,__,__,F5,__,__,A5,__,  G5,F5,E5,D5,C5,__,A4,__,
   B4,__,D5,__,GS4,__,B4,__,  A4,__,__,__,D4,F4,A4,__,
  ],
  bass: [
   D3,__,__,F3,A3,__,D3,__,  D3,__,__,F3,A3,__,D3,__,
   A2,__,__,E3,A3,__,A2,__,  F3,__,__,A3,C4,__,F3,__,
   D3,__,__,F3,A3,__,D3,__,  C3,__,__,E3,G3,__,C3,__,
   E3,__,__,GS3,B3,__,E3,__,  A2,__,D3,__,A2,__,D3,__,
  ],
  counter: [
   __,__,A5,__,__,__,__,__,  __,__,F5,__,__,__,__,__,
   __,__,__,__,__,__,__,__,  __,__,__,__,__,__,__,__,
   __,__,F5,__,__,__,D5,__,  __,__,E5,__,__,__,C5,__,
   __,__,__,__,E5,__,__,__,  A4,__,__,__,__,__,__,__,
  ],
 },
 { // D — "Final Wave" (La menor tensa, con cromatismo)
  melody: [
   A4,A4,__,A4,C5,__,A4,__,  DS5,__,D5,C5,B4,__,__,__,
   A4,A4,__,A4,E5,__,D5,__,  F5,__,E5,DS5,E5,__,__,__,
   A4,A4,__,A4,G5,__,F5,__,  E5,DS5,E5,F5,E5,__,C5,__,
   B4,C5,B4,__,GS4,__,B4,__,  A4,__,__,A4,__,__,A4,__,
  ],
  bass: [
   A2,__,E3,A2,__,A2,E3,__,  A2,__,E3,A2,__,A2,F3,E3,
   A2,__,E3,A2,__,A2,E3,__,  D3,__,A3,D3,__,D3,F3,D3,
   A2,__,E3,A2,__,A2,E3,__,  F3,__,C4,F3,__,F3,C4,__,
   E3,__,B3,E3,GS3,__,E3,__,  A2,__,A2,__,A2,__,A2,__,
  ],
  counter: [
   __,__,__,__,__,__,__,__,  __,__,__,__,__,__,__,__,
   E5,__,__,__,__,__,__,__,  D5,__,__,__,__,__,__,__,
   C5,__,__,__,__,__,__,__,  DS5,__,__,__,__,__,__,__,
   E5,__,__,__,B4,__,__,__,  A4,__,E5,__,A5,__,__,__,
  ],
 },
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
  const song = SONGS[songIdx];
  const k = i % 64;
  const m = song.melody[k], b = song.bass[k], c = song.counter[k];
  if (m !== null) voice(F(m), t, STEP * 1.9, 'square', 0.045);
  if (b !== null) voice(F(b), t, STEP * 1.6, 'triangle', 0.12);
  if (c !== null) voice(F(c), t, STEP * 2.6, 'sine', 0.028);
  if (i % 2 === 0) hat(t, i % 8 === 4 ? 0.03 : 0.014);
  // cada canción suena 2 vueltas y pasa a la siguiente
  if (k === 63) {
    loopsOfSong++;
    if (loopsOfSong >= 2) { loopsOfSong = 0; songIdx = (songIdx + 1) % SONGS.length; }
  }
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
