import * as THREE from 'three';
import { mulberry32 } from '../core/rng.js';

const N = 5000;

export class Fireworks {
  constructor({ scene, bus, palette }) {
    this.palette = palette;
    this.pos = new Float32Array(N * 3); this.col = new Float32Array(N * 3);
    this.vel = new Float32Array(N * 3); this.base = new Float32Array(N * 3);
    this.life = new Float32Array(N); this.idx = 0;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.points = new THREE.Points(g, new THREE.PointsMaterial({
      size: 0.7, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    this.points.frustumCulled = false;
    scene.add(this.points);
    // La semilla viene de la red -> mismos fuegos en todas las pantallas
    bus.on('show:fireworks', seed => this.launch(seed));
  }

  launch(seed) {
    const rng = mulberry32(seed);
    for (let k = 0; k < 6; k++) {
      const origin = [(rng() - 0.5) * 90, 35 + rng() * 25, -60 + rng() * 30];
      const burstSeed = (rng() * 1e9) | 0;
      setTimeout(() => this.burst(origin, this.palette.cur[k % 3].clone().multiplyScalar(2), burstSeed), k * 250);
    }
  }

  burst(o, color, seed, n = 350) {
    const rng = mulberry32(seed);
    for (let k = 0; k < n; k++) {
      const i = this.idx; this.idx = (this.idx + 1) % N;
      const u = rng() * 2 - 1, th = rng() * Math.PI * 2, s = Math.sqrt(1 - u * u), sp = 8 + rng() * 6;
      this.pos.set(o, i * 3);
      this.vel.set([s * Math.cos(th) * sp, u * sp, s * Math.sin(th) * sp], i * 3);
      this.base.set([color.r, color.g, color.b], i * 3);
      this.life[i] = 1 + rng() * 0.5;
    }
  }

  update({ dt }) {
    const { pos, vel, col, base, life } = this;
    for (let i = 0; i < N; i++) {
      if (life[i] <= 0) { col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = 0; continue; }
      vel[i * 3 + 1] -= 6 * dt;
      for (let a = 0; a < 3; a++) { vel[i * 3 + a] *= 0.985; pos[i * 3 + a] += vel[i * 3 + a] * dt; }
      life[i] -= dt * 0.6;
      const l = Math.max(life[i], 0);
      for (let a = 0; a < 3; a++) col[i * 3 + a] = base[i * 3 + a] * l;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;
  }
}