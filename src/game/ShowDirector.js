import { MSG } from '../net/protocol.js';
import { ERAS } from '../config.js';

// Estado global del show. Cualquiera puede PEDIR; solo la autoridad DECIDE.
export class ShowDirector {
  constructor(ctx, net) {
    this.ctx = ctx; this.net = net;
    this.state = { era: 0, crowdMode: 0, autoShow: true };
    this.lastAuto = 0;

    ctx.bus.on('net:' + MSG.WELCOME, w => {
      if (w.showState) Object.assign(this.state, w.showState);
      this.emitAll();
    });
    ctx.bus.on('net:' + MSG.SHOW_EVENT, ev => this.apply(ev));
    ctx.bus.on('audio:beat', () => this.onBeat());
  }

  request(type, value) {
    this.net.send(MSG.SHOW_EVENT, { type, value, at: this.ctx.clock.time });
  }

  apply({ type, value }) {
    if (type in this.state) this.state[type] = value;
    this.ctx.bus.emit('show:' + type, value);
    if (type === 'era') this.ctx.bus.emit('show:fireworks', value * 7919 + 1);
  }

  emitAll() {
    for (const [k, v] of Object.entries(this.state)) this.ctx.bus.emit('show:' + k, v);
  }

  update({ t }) {
    if (!this.net.isAuthority || !this.state.autoShow) return;
    if (t - this.lastAuto > 35) {
      this.lastAuto = t;
      this.request('era', (this.state.era + 1) % ERAS.length);
    }
  }

  onBeat() {
    if (this.net.isAuthority && this.state.autoShow && Math.random() < 0.025) {
      this.request('fireworks', (Math.random() * 1e9) | 0);
    }
  }
}