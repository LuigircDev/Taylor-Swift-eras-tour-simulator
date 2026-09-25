import { WebSocketServer } from 'ws';
import { randomUUID } from 'crypto';

const wss = new WebSocketServer({ port: 8080 });
const now = () => performance.timeOrigin / 1000 + performance.now() / 1000;
const showStart = now();
const showState = { era: 0, crowdMode: 0, autoShow: true };
const players = new Map(); // ws -> player
let host = null;

const send = (ws, type, payload) => ws.send(JSON.stringify({ type, payload }));
const broadcast = (type, payload, except) => {
  for (const ws of players.keys()) if (ws !== except) send(ws, type, payload);
};

wss.on('connection', ws => {
  ws.on('message', raw => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    const { type, payload } = msg;

    if (type === 'hello') {
      const p = {
        id: randomUUID().slice(0, 8),
        name: String(payload?.profile?.name ?? 'Swiftie').slice(0, 20),
        color: payload?.profile?.color ?? '#ff5fc8',
        x: 10, y: 0, z: 10, yaw: 0,
      };
      players.set(ws, p);
      if (!host) host = ws;
      send(ws, 'welcome', {
        playerId: p.id, serverNow: now(), showStart, showState,
        players: [...players.values()], isHost: ws === host,
      });
      broadcast('player_join', { player: p }, ws);
      return;
    }

    const me = players.get(ws);
    if (!me) return;
    if (type === 'player_state') {
      Object.assign(me, payload, { id: me.id });
      broadcast('player_state', { ...payload, id: me.id }, ws);
    }
    if (type === 'emote') broadcast('emote', { id: me.id, emote: payload.emote });
    if (type === 'show_event' && ws === host) {
      if (payload.type in showState) showState[payload.type] = payload.value;
      broadcast('show_event', payload); // incluye al anfitrión, que lo aplica al recibirlo
    }
  });

  ws.on('close', () => {
    const me = players.get(ws);
    players.delete(ws);
    if (me) broadcast('player_leave', { id: me.id });
    if (ws === host) {
      host = players.keys().next().value ?? null;
      if (host) send(host, 'host', {});
    }
  });
});

console.log('🎤 Servidor de concierto en ws://localhost:8080');