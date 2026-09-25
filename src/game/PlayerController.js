import { isBlocked } from '../core/collision.js';

// Modifica solo los DATOS del jugador local (no el mesh).
// En multijugador, esos datos se envían al servidor.
export class PlayerController {
  constructor(input, bus) {
    this.input = input; this.bus = bus;
    this.player = null; this.vy = 0; this.pitch = 0;
  }
  attach(player) { this.player = player; }

  update(dt) {
    const p = this.player, i = this.input;
    if (!p) return;

    if (i.locked) {
      p.yaw -= i.mouse.dx * 0.0022;
      this.pitch = Math.max(-1.3, Math.min(1.3, this.pitch - i.mouse.dy * 0.0022));
    }

    let f = 0, s = 0;
    if (i.down('KeyW') || i.down('ArrowUp')) f++;
    if (i.down('KeyS') || i.down('ArrowDown')) f--;
    if (i.down('KeyD') || i.down('ArrowRight')) s++;
    if (i.down('KeyA') || i.down('ArrowLeft')) s--;

    if (f || s) {
      const len = Math.hypot(f, s); f /= len; s /= len;
      const speed = i.down('ShiftLeft') ? 7 : 3.5;
      const sin = Math.sin(p.yaw), cos = Math.cos(p.yaw);
      const dx = (-sin * f + cos * s) * speed * dt;
      const dz = (-cos * f - sin * s) * speed * dt;
      if (!isBlocked(p.x + dx, p.z + dz)) { p.x += dx; p.z += dz; }
      else if (!isBlocked(p.x + dx, p.z)) p.x += dx;
      else if (!isBlocked(p.x, p.z + dz)) p.z += dz;
    }

    if (i.wasPressed('Space') && p.y <= 0.001) this.vy = 5;
    this.vy -= 15 * dt;
    p.y = Math.max(0, p.y + this.vy * dt);
    if (p.y === 0) this.vy = Math.max(this.vy, 0);

    if (i.wasPressed('KeyE')) this.bus.emit('local:emote', 'wave');
    if (i.wasPressed('KeyQ')) this.bus.emit('local:emote', 'heart');
  }
}