import * as THREE from 'three';
import { beamVS, beamFS } from './shaders.js';

export class Lights {
  constructor({ scene, palette }) {
    this.palette = palette;
    const geo = new THREE.ConeGeometry(3, 45, 32, 1, true);
    geo.translate(0, -22.5, 0);
    this.beams = [];
    const add = (x, y, z, ci, up, seed) => {
      const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({
        uniforms: { uColor: { value: palette.cur[ci] }, uBeat: palette.uniforms.uBeat },
        vertexShader: beamVS, fragmentShader: beamFS,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      }));
      m.position.set(x, y, z);
      m.userData = { up, seed }; // semilla fija (no Math.random) -> igual en todos los clientes
      scene.add(m); this.beams.push(m);
    };
    for (let i = 0; i < 12; i++) add(-30 + i * (60 / 11), 25, -44, i % 3, false, i);
    for (let i = 0; i < 8; i++) add(-21 + i * 6, 2, -38.5, (i + 1) % 3, true, i * 1.7);

    this.washes = [0, 1, 2].map(i => {
      const s = new THREE.SpotLight(0xffffff, 4, 0, 0.6, 0.6, 0);
      s.position.set(-15 + i * 15, 25, -40);
      s.target.position.set(-15 + i * 15, 0, -44);
      scene.add(s, s.target); return s;
    });
  }

  update({ t, beat }) {
    this.beams.forEach((b, i) => {
      const s = b.userData.seed;
      if (b.userData.up) b.rotation.set(Math.PI + Math.sin(t * 0.6 + s) * 0.35, 0, Math.cos(t * 0.8 + s) * 0.4);
      else b.rotation.set(-0.5 + Math.cos(t * 0.5 + i * 0.3) * 0.35, 0, Math.sin(t * 0.7 + i) * 0.5);
    });
    this.washes.forEach((w, i) => { w.color.copy(this.palette.cur[i]); w.intensity = 2 + beat * 6; });
  }
}