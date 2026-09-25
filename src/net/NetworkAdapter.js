import { MSG } from './protocol.js';

/**
 * CONTRATO: cualquier adaptador (Offline, WebSocket, WebRTC, Colyseus...)
 * debe emitir en el bus:
 *   'net:welcome'      { playerId, serverNow, showStart, players[], showState }
 *   'net:player_join'  { player }
 *   'net:player_leave' { id }
 *   'net:player_state' { id, x, y, z, yaw }
 *   'net:show_event'   { type, value, at }
 *   'net:emote'        { id, emote }
 */
export class NetworkAdapter {
  constructor(bus) { this.bus = bus; this.playerId = null; }
  async connect(profile) { throw new Error('connect() no implementado'); }
  send(type, payload) {}
  get isAuthority() { return false; }
  disconnect() {}
}

// Modo un jugador: "el servidor" somos nosotros (loopback)
export class OfflineAdapter extends NetworkAdapter {
  async connect(profile) {
    this.playerId = 'local-' + Math.random().toString(36).slice(2, 8);
    const now = performance.now() / 1000;
    this.bus.emit('net:' + MSG.WELCOME, {
      playerId: this.playerId,
      serverNow: now,
      showStart: now,
      players: [{ id: this.playerId, ...profile }],
      showState: null,
    });
    return this.playerId;
  }
  get isAuthority() { return true; }
  send(type, payload) {
    switch (type) {
      case MSG.SHOW_EVENT: this.bus.emit('net:' + MSG.SHOW_EVENT, payload); break;
      case MSG.EMOTE: this.bus.emit('net:' + MSG.EMOTE, { id: this.playerId, ...payload }); break;
      case MSG.PLAYER_STATE: break; // no hay nadie más a quien enviarlo
    }
  }
}