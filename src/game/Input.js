export class Input {
  constructor(dom) {
    this.dom = dom; this.keys = new Set(); this.pressed = new Set();
    this.mouse = { dx: 0, dy: 0 }; this.locked = false;

    addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT') return;
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
    });
    addEventListener('keyup', e => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === dom;
    });
    addEventListener('mousemove', e => {
      if (this.locked) { this.mouse.dx += e.movementX; this.mouse.dy += e.movementY; }
    });
  }
  lock() { this.dom.requestPointerLock(); }
  down(code) { return this.keys.has(code); }
  wasPressed(code) { return this.pressed.has(code); }
  endFrame() { this.pressed.clear(); this.mouse.dx = this.mouse.dy = 0; }
}