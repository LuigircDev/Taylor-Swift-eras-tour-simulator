// Reloj compartido del show.
// Offline: reloj local. Online: se sincroniza con la hora del servidor.
export class ShowClock {
  constructor() { this.offset = 0; this.showStart = this.now(); }
  now() { return performance.now() / 1000 + this.offset; }
  get time() { return this.now() - this.showStart; }
  syncServerTime(serverNow) { this.offset = serverNow - performance.now() / 1000; }
  setShowStart(t) { this.showStart = t; }
}