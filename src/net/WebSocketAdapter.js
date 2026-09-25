import { NetworkAdapter } from './NetworkAdapter.js';
import { MSG } from './protocol.js';

export class WebSocketAdapter extends NetworkAdapter {
  constructor(bus, url) { super(bus); this.url = url; this.authority = false; }

  connect(profile) {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = () => this.ws.send(JSON.stringify({ type: 'hello', payload: { profile } }));
      this.ws.onerror = reject;
      this.ws.onclose = () => this.bus.emit('net:disconnected');
      this.ws.onmessage = ev => {
        const { type, payload } = JSON.parse(ev.data);
        if (type === MSG.WELCOME) {
          this.playerId = payload.playerId;
          this.authority = !!payload.isHost;
          resolve(this.playerId);
        }
        if (type === MSG.HOST) this.authority = true; // migración de anfitrión
        this.bus.emit('net:' + type, payload);
      };
    });
  }
  get isAuthority() { return this.authority; }
  send(type, payload) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ type, payload }));
  }
  disconnect() { this.ws?.close(); }
}