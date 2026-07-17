// Class Mode — multijugador P2P con PeerJS (docente = host, estudiantes = clientes).
// Usa window.Peer (vendor/peerjs.min.js) y la nube pública de señalización de PeerJS.
const PREFIX = 'edef-english-defenders-';
const MAX_PLAYERS = 7;

// Por defecto usa la nube gratuita de PeerJS. Con ?peerhost=servidor:puerto
// se puede apuntar a un peerjs-server propio (p. ej. en la red del colegio).
function peerOpts() {
  const p = new URLSearchParams(location.search).get('peerhost');
  if (!p) return { debug: 0 };
  const [host, port] = p.split(':');
  return { host, port: Number(port) || 443, path: '/', secure: location.protocol === 'https:' && host !== 'localhost', debug: 0 };
}

function randomCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let c = '';
  for (let i = 0; i < 5; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

export class ClassHost {
  constructor({ onReady, onError, onRoster }) {
    this.code = randomCode();
    this.conns = new Map(); // conn -> {name}
    this.onRoster = onRoster;
    this.peer = new Peer(PREFIX + this.code, peerOpts());
    this.peer.on('open', () => onReady(this.code));
    this.peer.on('error', (e) => {
      if (e.type === 'unavailable-id') {
        // código en uso: genera otro
        this.code = randomCode();
        this.peer = new Peer(PREFIX + this.code, peerOpts());
        this.peer.on('open', () => onReady(this.code));
        this.peer.on('connection', (c) => this._welcome(c));
        this.peer.on('error', (e2) => onError(e2));
      } else onError(e);
    });
    this.peer.on('connection', (c) => this._welcome(c));
  }

  _welcome(conn) {
    conn.on('open', () => {
      if (this.conns.size >= MAX_PLAYERS) {
        conn.send({ t: 'full' });
        setTimeout(() => conn.close(), 400);
        return;
      }
      conn.on('data', (msg) => this._onData(conn, msg));
      conn.on('close', () => { this.conns.delete(conn); this._roster(); });
    });
  }

  _onData(conn, msg) {
    if (!msg || typeof msg !== 'object') return;
    if (msg.t === 'join') {
      const name = String(msg.name || 'Student').slice(0, 16);
      this.conns.set(conn, { name, stat: null });
      conn.send({ t: 'welcome', players: this.roster() });
      this._roster();
    } else if (msg.t === 'stat') {
      const p = this.conns.get(conn);
      if (p) p.stat = {
        sun: msg.sun | 0, killed: msg.killed | 0,
        correct: msg.correct | 0, asked: msg.asked | 0,
        state: ['playing', 'won', 'lost', 'quiz', 'paused'].includes(msg.state) ? msg.state : 'playing',
      };
    }
  }

  roster() { return [...this.conns.values()].map(p => p.name); }
  _roster() { this.onRoster(this.roster()); }

  broadcast(msg) { for (const conn of this.conns.keys()) { try { conn.send(msg); } catch {} } }

  start(cfg) { this.broadcast({ t: 'start', cfg }); }

  // tabla de posiciones: host + estudiantes
  board(selfName, selfStat) {
    const rows = [{ name: `⭐ ${selfName}`, ...selfStat }];
    for (const p of this.conns.values()) if (p.stat) rows.push({ name: p.name, ...p.stat });
    rows.sort((a, b) => (b.killed + b.correct * 2) - (a.killed + a.correct * 2));
    this.broadcast({ t: 'board', rows });
    return rows;
  }

  destroy() { try { this.peer.destroy(); } catch {} }
}

export class ClassClient {
  constructor(code, name, { onStart, onBoard, onStatus }) {
    this.peer = new Peer(peerOpts());
    this.onStatus = onStatus;
    this.peer.on('open', () => {
      this.conn = this.peer.connect(PREFIX + code.toUpperCase(), { reliable: true });
      this.conn.on('open', () => {
        this.conn.send({ t: 'join', name });
        onStatus('waiting');
      });
      this.conn.on('data', (msg) => {
        if (!msg || typeof msg !== 'object') return;
        if (msg.t === 'welcome') onStatus('joined', msg.players);
        else if (msg.t === 'full') onStatus('full');
        else if (msg.t === 'start') onStart(msg.cfg);
        else if (msg.t === 'board') onBoard(msg.rows);
      });
      this.conn.on('close', () => onStatus('closed'));
    });
    this.peer.on('error', (e) => onStatus('error', e.type));
  }

  sendStat(stat) { try { this.conn?.send({ t: 'stat', ...stat }); } catch {} }
  destroy() { try { this.peer.destroy(); } catch {} }
}

export function joinURL(code) {
  const base = location.origin + location.pathname;
  return `${base}#join=${code}`;
}

export function makeQR(text) {
  // qrcode-generator (window.qrcode)
  const qr = window.qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  return qr.createDataURL(7, 8);
}
