import { ERAS } from '../config.js';

const $ = id => document.getElementById(id);
const toggleIn = (sel, pred) => document.querySelectorAll(sel).forEach(b => b.classList.toggle('active', pred(b)));

export class HUD {
  constructor({ bus, director, audio, rig, input, canvas }) {
    Object.assign(this, { bus, director, audio, rig, input });
    this.count = 0; this.era = 0;

    ERAS.forEach((e, i) => {
      const b = document.createElement('button');
      b.textContent = e.name;
      b.style.borderColor = '#' + e.colors[0].toString(16).padStart(6, '0');
      b.onclick = () => director.request('era', i);
      $('eras').appendChild(b);
    });

    $('demo').onclick = () => (audio.demoRunning ? audio.stopDemo() : audio.startDemo());
    $('file').onchange = e => e.target.files[0] && audio.playFile(e.target.files[0]);
    document.querySelectorAll('#modes button').forEach(b => (b.onclick = () => director.request('crowdMode', +b.dataset.mode)));
    document.querySelectorAll('#cams button').forEach(b => (b.onclick = () => rig.setMode(b.dataset.cam)));
    $('fw').onclick = () => director.request('fireworks', (Math.random() * 1e9) | 0);
    $('auto').onclick = () => director.request('autoShow', !director.state.autoShow);

    // Evita que Espacio vuelva a pulsar el último botón clicado
    addEventListener('click', e => e.target.closest?.('button')?.blur());
    canvas.addEventListener('click', () => { if (rig.mode !== 'orbit') input.lock(); });
    addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || $('ui').hidden) return;
      if (e.key >= '1' && e.key <= '8') director.request('era', +e.key - 1);
      if (e.code === 'KeyF') $('fw').onclick();
      if (e.code === 'KeyC') rig.cycle();
    });

    // La interfaz muestra el estado AUTORITATIVO (lo que llega de la red)
    bus.on('show:era', i => {
      this.era = i;
      [...$('eras').children].forEach((b, k) => b.classList.toggle('active', k === i));
      this.renderStatus();
    });
    bus.on('show:crowdMode', m => toggleIn('#modes button', b => +b.dataset.mode === m));
    bus.on('show:autoShow', v => {
      $('auto').textContent = `Auto show: ${v ? 'ON' : 'OFF'}`;
      $('auto').classList.toggle('active', v);
    });
    bus.on('camera:mode', m => { toggleIn('#cams button', b => b.dataset.cam === m); this.updateHint(); });
    bus.on('audio:state', s => ($('demo').textContent = s.demo ? '⏸ Parar demo' : '▶ Beat demo'));
    bus.on('players:changed', n => { this.count = n; this.renderStatus(); });
    document.addEventListener('pointerlockchange', () => this.updateHint());
  }

  renderStatus() {
    $('status').textContent = `Era: ${ERAS[this.era].name} · 👥 ${this.count} en el estadio`;
  }

  updateHint() {
    const walking = this.rig.mode !== 'orbit' && !$('ui').hidden;
    $('hint').hidden = !walking || this.input.locked;
    $('crosshair').hidden = !(this.rig.mode === 'fp' && this.input.locked);
  }

  showLobby() {
    return new Promise(resolve => {
      $('enter').onclick = () => {
        this.audio.init(); // necesita el gesto del usuario
        $('lobby').hidden = true; $('ui').hidden = false;
        resolve({ name: $('name').value.trim() || 'Swiftie', color: $('color').value });
      };
    });
  }
}